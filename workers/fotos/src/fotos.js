// Handlers de la API. Cada uno recibe (ctx) = { request, env, url, evento, params }.
import { HttpError, json } from './http.js'
import { exigirAcceso, exigirAdmin, sha256 } from './auth.js'

const MB = 1024 * 1024
const MAX_FOTO = 8 * MB
const MAX_THUMB = 1 * MB
// Foto + miniatura + campos del formulario.
const MAX_PETICION = MAX_FOTO + MAX_THUMB + 64 * 1024

export async function cargarEvento(env, slug) {
  const evento = await env.DB.prepare('SELECT * FROM eventos WHERE slug = ?').bind(slug).first()
  if (!evento) throw new HttpError(404, 'Evento no encontrado', { codigo: 'sin_evento' })
  return evento
}

function estadoSubida(evento, ahora = new Date().toISOString()) {
  if (evento.abre_en && ahora < evento.abre_en) return 'aun_no_abre'
  if (evento.cierra_en && ahora >= evento.cierra_en) return 'cerrada'
  return 'abierta'
}

function aFoto(slug, fila, admin) {
  const base = `/v1/${slug}/img/${fila.id}`
  return {
    id: fila.id,
    autor: fila.autor,
    mensaje: fila.mensaje,
    ancho: fila.ancho,
    alto: fila.alto,
    creada: fila.creada,
    src: base,
    thumb: `${base}.thumb`,
    ...(admin && { oculta: Boolean(fila.oculta) }),
  }
}

/** GET /v1/:slug — datos del evento y si la subida está abierta. */
export async function verEvento({ request, env, url, evento }) {
  const rol = await exigirAcceso(evento, request, url)
  const filtro = rol === 'admin' ? '' : ' AND oculta = 0'
  const { total } = await env.DB.prepare(`SELECT COUNT(*) AS total FROM fotos WHERE slug = ?${filtro}`)
    .bind(evento.slug)
    .first()
  return json({
    slug: evento.slug,
    nombre: evento.nombre,
    rol,
    // Los festejados lo usan para compartir el enlace de invitados.
    ...(rol === 'admin' && { codigo: evento.codigo }),
    subida: estadoSubida(evento),
    abre_en: evento.abre_en,
    cierra_en: evento.cierra_en,
    total,
  })
}

/**
 * GET /v1/:slug/fotos            invitados: sólo visibles
 * GET /v1/:slug/admin/fotos      festejados: todas, con `oculta`
 *
 * Más nuevas primero. `?antes=<cursor>` pagina hacia atrás (scroll infinito);
 * `?desde=<creada>` trae sólo las nuevas (polling del muro).
 */
async function listar({ env, url, evento }, admin) {
  const limite = Math.min(Math.max(Number(url.searchParams.get('limite')) || 30, 1), 100)
  const antes = url.searchParams.get('antes')
  const desde = url.searchParams.get('desde')

  let sql = 'SELECT * FROM fotos WHERE slug = ?'
  const binds = [evento.slug]
  if (!admin) sql += ' AND oculta = 0'
  if (antes) {
    const [creada, id] = antes.split('~')
    sql += ' AND (creada < ? OR (creada = ? AND id < ?))'
    binds.push(creada, creada, id ?? '')
  }
  if (desde) {
    sql += ' AND creada > ?'
    binds.push(desde)
  }
  sql += ' ORDER BY creada DESC, id DESC LIMIT ?'
  binds.push(limite + 1)

  const { results } = await env.DB.prepare(sql).bind(...binds).all()
  const hayMas = results.length > limite
  const filas = results.slice(0, limite)
  const ultima = filas.at(-1)

  return json({
    fotos: filas.map((f) => aFoto(evento.slug, f, admin)),
    siguiente: hayMas ? `${ultima.creada}~${ultima.id}` : null,
  })
}

export async function listarFotos(ctx) {
  await exigirAcceso(ctx.evento, ctx.request, ctx.url)
  return listar(ctx, false)
}

export async function listarFotosAdmin(ctx) {
  await exigirAdmin(ctx.evento, ctx.request)
  return listar(ctx, true)
}

/** Tipo real del archivo por sus primeros bytes (no confiamos en el que manda el navegador). */
async function tipoImagen(archivo) {
  const b = new Uint8Array(await archivo.slice(0, 12).arrayBuffer())
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  const ascii = (i, j) => String.fromCharCode(...b.slice(i, j))
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp'
  return null
}

async function validarArchivo(archivo, max, nombre) {
  if (!(archivo instanceof File)) throw new HttpError(400, `Falta el archivo «${nombre}»`)
  if (archivo.size > max) {
    throw new HttpError(413, `La ${nombre} pesa más de ${max / MB} MB`, { codigo: 'muy_grande' })
  }
  const tipo = await tipoImagen(archivo)
  if (!tipo) throw new HttpError(415, 'Sólo se aceptan fotos JPEG o WebP', { codigo: 'tipo_no_valido' })
  return tipo
}

function entero(valor) {
  const n = Number.parseInt(valor, 10)
  return Number.isFinite(n) && n > 0 && n < 100000 ? n : null
}

function texto(valor, max) {
  const t = typeof valor === 'string' ? valor.trim().slice(0, max) : ''
  return t || null
}

/**
 * POST /v1/:slug/fotos — multipart/form-data:
 *   foto   (requerido) imagen ya comprimida en el navegador, ≤ 8 MB
 *   thumb  (requerido) miniatura, ≤ 1 MB
 *   autor, mensaje, ancho, alto (opcionales)
 */
export async function subirFoto({ request, env, url, evento }) {
  await exigirAcceso(evento, request, url)

  const subida = estadoSubida(evento)
  if (subida === 'aun_no_abre') {
    throw new HttpError(403, 'La subida de fotos todavía no abre', { codigo: subida, abre_en: evento.abre_en })
  }
  if (subida === 'cerrada') {
    throw new HttpError(403, 'La subida de fotos ya cerró', { codigo: subida })
  }

  const ip = request.headers.get('CF-Connecting-IP') ?? 'local'
  const limite = await env.SUBIDAS?.limit({ key: `${evento.slug}:${ip}` })
  if (limite && !limite.success) {
    throw new HttpError(429, 'Demasiadas fotos seguidas; espera un minuto', { codigo: 'demasiadas' })
  }

  if (Number(request.headers.get('Content-Length')) > MAX_PETICION) {
    throw new HttpError(413, `La foto pesa más de ${MAX_FOTO / MB} MB`, { codigo: 'muy_grande' })
  }

  let form
  try {
    form = await request.formData()
  } catch {
    throw new HttpError(400, 'Formulario no válido')
  }
  const foto = form.get('foto')
  const thumb = form.get('thumb')
  const tipo = await validarArchivo(foto, MAX_FOTO, 'foto')
  const tipoThumb = await validarArchivo(thumb, MAX_THUMB, 'miniatura')

  const { total } = await env.DB.prepare('SELECT COUNT(*) AS total FROM fotos WHERE slug = ?')
    .bind(evento.slug)
    .first()
  if (total >= evento.max_fotos) {
    throw new HttpError(403, 'El álbum del evento ya está lleno', { codigo: 'lleno' })
  }

  const id = crypto.randomUUID()
  const clave = `${evento.slug}/${id}`
  await Promise.all([
    env.BUCKET.put(clave, foto.stream(), { httpMetadata: { contentType: tipo } }),
    env.BUCKET.put(`${clave}.thumb`, thumb.stream(), { httpMetadata: { contentType: tipoThumb } }),
  ])

  try {
    const fila = await env.DB.prepare(
      `INSERT INTO fotos (id, slug, autor, mensaje, tipo, ancho, alto, bytes, ip_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
    )
      .bind(
        id,
        evento.slug,
        texto(form.get('autor'), 60),
        texto(form.get('mensaje'), 280),
        tipo,
        entero(form.get('ancho')),
        entero(form.get('alto')),
        foto.size,
        (await sha256(`${evento.slug}:${ip}`)).slice(0, 16),
      )
      .first()
    return json({ foto: aFoto(evento.slug, fila, false) }, 201)
  } catch (err) {
    // Sin fila en D1 los archivos quedarían huérfanos en R2.
    await env.BUCKET.delete([clave, `${clave}.thumb`])
    throw err
  }
}

/**
 * GET /v1/:slug/img/:id[.thumb]?c=<código>
 * Las ocultas sólo las ven los festejados (Authorization: Bearer).
 */
export async function servirImagen({ request, env, url, evento, params }) {
  const rol = await exigirAcceso(evento, request, url)
  const [id, esThumb] = params

  const fila = await env.DB.prepare('SELECT oculta FROM fotos WHERE id = ? AND slug = ?')
    .bind(id, evento.slug)
    .first()
  if (!fila || (fila.oculta && rol !== 'admin')) throw new HttpError(404, 'Foto no encontrada')

  const objeto = await env.BUCKET.get(`${evento.slug}/${id}${esThumb ? '.thumb' : ''}`)
  if (!objeto) throw new HttpError(404, 'Foto no encontrada')

  const headers = new Headers()
  objeto.writeHttpMetadata(headers)
  headers.set('ETag', objeto.httpEtag)
  // El id nunca cambia de contenido; `private` para que ningún CDN intermedio
  // la siga sirviendo si los festejados la ocultan.
  headers.set('Cache-Control', 'private, max-age=86400')
  return new Response(objeto.body, { headers })
}

/** PATCH /v1/:slug/admin/fotos/:id — body JSON { oculta: true|false } */
export async function cambiarFoto({ request, env, evento, params }) {
  await exigirAdmin(evento, request)
  const [id] = params
  const body = await request.json().catch(() => null)
  if (typeof body?.oculta !== 'boolean') throw new HttpError(400, 'Falta `oculta` (true o false)')

  const { meta } = await env.DB.prepare('UPDATE fotos SET oculta = ? WHERE id = ? AND slug = ?')
    .bind(body.oculta ? 1 : 0, id, evento.slug)
    .run()
  if (!meta.changes) throw new HttpError(404, 'Foto no encontrada')
  return json({ id, oculta: body.oculta })
}

/** DELETE /v1/:slug/admin/fotos/:id — borra de R2 y de D1, sin vuelta atrás. */
export async function borrarFoto({ request, env, evento, params }) {
  await exigirAdmin(evento, request)
  const [id] = params
  const { meta } = await env.DB.prepare('DELETE FROM fotos WHERE id = ? AND slug = ?')
    .bind(id, evento.slug)
    .run()
  if (!meta.changes) throw new HttpError(404, 'Foto no encontrada')
  await env.BUCKET.delete([`${evento.slug}/${id}`, `${evento.slug}/${id}.thumb`])
  return new Response(null, { status: 204 })
}
