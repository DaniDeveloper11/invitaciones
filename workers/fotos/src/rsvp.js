// Confirmación de asistencia (RSVP) con pases.
//
// Los festejados definen la lista: cada pase ("Familia Pérez") tiene sus
// personas, marcadas como adulto o niño, y quizá lugares libres ("+ acompañante")
// cuyo nombre escribe el invitado. El pase confirma con su código (X-Pase)
// marcando quién asiste; puede cambiarlo hasta la fecha límite del evento.
import { HttpError, json } from './http.js'
import { exigirAdmin } from './auth.js'

const MAX_NOMBRE = 80
const MAX_MENSAJE = 500

function estadoRsvp(evento, ahora = new Date().toISOString()) {
  return evento.rsvp_cierra_en && ahora >= evento.rsvp_cierra_en ? 'cerrada' : 'abierta'
}

async function limitarIntentos(env, request, evento) {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'local'
  const limite = await env.INTENTOS?.limit({ key: `${evento.slug}:${ip}` })
  if (limite && !limite.success) {
    throw new HttpError(429, 'Demasiados intentos; espera un minuto', { codigo: 'demasiadas' })
  }
}

/** El pase del código en X-Pase, o 403. */
async function exigirPase({ env, request, evento }) {
  await limitarIntentos(env, request, evento)
  const codigo = (request.headers.get('X-Pase') ?? '').trim().toUpperCase()
  const pase =
    codigo &&
    (await env.DB.prepare('SELECT * FROM pases WHERE slug = ? AND codigo = ?').bind(evento.slug, codigo).first())
  if (!pase) throw new HttpError(403, 'Este enlace de invitación no es válido', { codigo: 'sin_acceso' })
  return pase
}

const aPersona = (p) => ({
  id: p.id,
  nombre: p.nombre,
  nino: Boolean(p.es_nino),
  libre: Boolean(p.es_libre),
  asiste: p.asiste === null ? null : Boolean(p.asiste),
})

async function personasDe(env, paseId) {
  const { results } = await env.DB.prepare('SELECT * FROM personas WHERE pase_id = ? ORDER BY orden')
    .bind(paseId)
    .all()
  return results
}

function aPase(pase, personas) {
  return {
    nombre: pase.nombre,
    mensaje: pase.mensaje,
    respondido_en: pase.respondido_en,
    actualizado_en: pase.actualizado_en,
    personas: personas.map(aPersona),
  }
}

function respuestaInvitado(evento, pase, personas) {
  return json({
    evento: evento.nombre,
    rsvp: estadoRsvp(evento),
    cierra_en: evento.rsvp_cierra_en,
    pase: aPase(pase, personas),
  })
}

/** GET /v1/:slug/rsvp — el pase, sus personas y su respuesta. */
export async function verPase(ctx) {
  const pase = await exigirPase(ctx)
  return respuestaInvitado(ctx.evento, pase, await personasDe(ctx.env, pase.id))
}

/**
 * PUT /v1/:slug/rsvp — reemplaza la respuesta completa del pase:
 *   { personas: [{ id, asiste, nombre? }], mensaje? }
 * Debe traer a todas las personas del pase, una vez cada una. `nombre` sólo
 * cuenta en lugares libres, y es obligatorio si ese lugar asiste.
 */
export async function responderPase(ctx) {
  const { request, env, evento } = ctx
  const pase = await exigirPase(ctx)
  if (estadoRsvp(evento) === 'cerrada') {
    throw new HttpError(403, 'La fecha para confirmar ya pasó', { codigo: 'cerrada' })
  }

  const body = await request.json().catch(() => null)
  if (!Array.isArray(body?.personas)) throw new HttpError(400, 'Falta la lista de personas')

  const personas = await personasDe(env, pase.id)
  const enviadas = new Map(body.personas.map((p) => [Number(p?.id), p]))
  if (enviadas.size !== body.personas.length || enviadas.size !== personas.length) {
    throw new HttpError(400, 'La respuesta debe incluir a cada persona del pase una vez')
  }

  const cambios = personas.map((persona) => {
    const enviada = enviadas.get(persona.id)
    if (!enviada || typeof enviada.asiste !== 'boolean') {
      throw new HttpError(400, 'Indica si asiste cada persona del pase')
    }
    let nombre = persona.nombre
    if (persona.es_libre) {
      nombre = typeof enviada.nombre === 'string' ? enviada.nombre.trim().slice(0, MAX_NOMBRE) : ''
      if (enviada.asiste && !nombre) {
        throw new HttpError(400, 'Escribe el nombre de tu acompañante', { codigo: 'falta_nombre', id: persona.id })
      }
      if (!enviada.asiste) nombre = null
    }
    return { id: persona.id, asiste: enviada.asiste ? 1 : 0, nombre }
  })

  const mensaje = typeof body.mensaje === 'string' ? body.mensaje.trim().slice(0, MAX_MENSAJE) || null : null
  const ahora = new Date().toISOString()

  // En un solo batch: o se guarda la respuesta completa o nada.
  await env.DB.batch([
    ...cambios.map((c) =>
      env.DB.prepare('UPDATE personas SET asiste = ?, nombre = ? WHERE id = ? AND pase_id = ?').bind(
        c.asiste,
        c.nombre,
        c.id,
        pase.id,
      ),
    ),
    env.DB.prepare(
      'UPDATE pases SET mensaje = ?, respondido_en = COALESCE(respondido_en, ?), actualizado_en = ? WHERE id = ?',
    ).bind(mensaje, ahora, ahora, pase.id),
  ])

  const actualizado = await env.DB.prepare('SELECT * FROM pases WHERE id = ?').bind(pase.id).first()
  return respuestaInvitado(evento, actualizado, await personasDe(env, pase.id))
}

/** GET /v1/:slug/admin/rsvp — todos los pases con sus personas y los totales. */
export async function listarRsvp({ request, env, evento }) {
  await exigirAdmin(evento, request)

  const [{ results: pases }, { results: personas }] = await env.DB.batch([
    env.DB.prepare('SELECT * FROM pases WHERE slug = ? ORDER BY nombre').bind(evento.slug),
    env.DB.prepare(
      `SELECT personas.* FROM personas JOIN pases ON pases.id = personas.pase_id
       WHERE pases.slug = ? ORDER BY personas.pase_id, personas.orden`,
    ).bind(evento.slug),
  ])

  const porPase = Map.groupBy(personas, (p) => p.pase_id)
  const totales = {
    pases: pases.length,
    pases_respondidos: pases.filter((p) => p.respondido_en).length,
    personas: personas.length,
    adultos: personas.filter((p) => p.asiste === 1 && !p.es_nino).length,
    ninos: personas.filter((p) => p.asiste === 1 && p.es_nino).length,
    no_asisten: personas.filter((p) => p.asiste === 0).length,
    sin_responder: personas.filter((p) => p.asiste === null).length,
  }

  return json({
    rsvp: estadoRsvp(evento),
    cierra_en: evento.rsvp_cierra_en,
    totales,
    pases: pases.map((p) => ({
      id: p.id,
      codigo: p.codigo,
      telefono: p.telefono,
      enviada_en: p.enviada_en,
      ...aPase(p, porPase.get(p.id) ?? []),
    })),
  })
}

/**
 * PATCH /v1/:slug/admin/rsvp/:id — { enviada: true | false }. Guarda la primera
 * vez que se envió (reenviar no la cambia); false la desmarca.
 */
export async function marcarEnviada({ request, env, evento, params }) {
  await exigirAdmin(evento, request)
  const body = await request.json().catch(() => null)
  if (typeof body?.enviada !== 'boolean') throw new HttpError(400, 'Indica si la invitación se envió')

  const pase = await env.DB.prepare(
    `UPDATE pases SET enviada_en = ${body.enviada ? 'COALESCE(enviada_en, ?)' : 'NULL'}
     WHERE id = ? AND slug = ? RETURNING id, enviada_en`,
  )
    .bind(...(body.enviada ? [new Date().toISOString()] : []), Number(params[0]), evento.slug)
    .first()
  if (!pase) throw new HttpError(404, 'Pase no encontrado')
  return json(pase)
}
