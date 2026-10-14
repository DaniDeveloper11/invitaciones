#!/usr/bin/env node
// Borra un evento de la API: sus fotos (archivos en R2 y filas en D1), sus
// pases de RSVP y el evento mismo.
//
//   npm run fotos:borrar -- boda-ana-y-luis                 (todo el evento)
//   npm run fotos:borrar -- boda-ana-y-luis --solo-fotos    (conserva evento y RSVP)
//   npm run fotos:borrar -- boda-ana-y-luis --simular       (sólo muestra qué borraría)
//   npm run fotos:borrar -- demo --local                    (base de `wrangler dev`)
//
// Pide escribir el slug para confirmar (o --si para no preguntar). Borra
// primero R2 y después D1: si algo falla a medias, el evento sigue en D1 y
// basta con volver a correrlo. No toca el sitio de Pages ni Terraform.
//
// Con --solo-fotos el evento queda dado de alta con el mismo código, QR,
// enlace de festejados y pases (útil para limpiar fotos de prueba).
//
// En remoto usa CLOUDFLARE_API_TOKEN y CLOUDFLARE_ACCOUNT_ID; si no están en
// la terminal, los lee de terraform/.env.local.

import { createInterface } from 'node:readline/promises'
import { SLUG_VALIDO, cargarCredenciales, crearD1, leerArgs, salir, sql, wrangler } from './lib/eventos.mjs'

const BUCKET = 'invitaciones-fotos'
const EN_PARALELO = 8

// ── Argumentos ──────────────────────────────────────────────────────────────

const { bandera, posicionales } = leerArgs()
const [slug] = posicionales
const local = bandera('local')
const soloFotos = bandera('solo-fotos')
const simular = bandera('simular')

if (!slug || !SLUG_VALIDO.test(slug)) {
  salir('Uso: npm run fotos:borrar -- <slug> [--solo-fotos] [--simular] [--si] [--local]')
}
if (!local) cargarCredenciales()

const d1 = crearD1(local)

// ── R2 ──────────────────────────────────────────────────────────────────────

const apiR2 = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/r2/buckets/${BUCKET}/objects`

async function cloudflare(url, opciones = {}) {
  const res = await fetch(url, {
    ...opciones,
    headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` },
  })
  const cuerpo = await res.json().catch(() => null)
  if (!res.ok || cuerpo?.success === false) {
    const detalle = cuerpo?.errors?.map((e) => e.message).join('; ') || res.statusText
    throw new Error(`API de Cloudflare ${res.status}: ${detalle}`)
  }
  return cuerpo
}

/** Todos los archivos bajo <slug>/ en R2 remoto: [{ key, size }]. */
async function listarRemoto() {
  const objetos = []
  let cursor
  do {
    const url = new URL(apiR2)
    url.searchParams.set('prefix', `${slug}/`)
    url.searchParams.set('per_page', '1000')
    if (cursor) url.searchParams.set('cursor', cursor)
    const { result, result_info: info } = await cloudflare(url)
    objetos.push(...result.map(({ key, size }) => ({ key, size })))
    cursor = info?.is_truncated ? info.cursor : undefined
  } while (cursor)
  return objetos
}

/** Ejecuta `tarea` sobre cada elemento, `EN_PARALELO` a la vez. */
async function enParalelo(elementos, tarea) {
  let siguiente = 0
  let hechos = 0
  const trabajador = async () => {
    while (siguiente < elementos.length) {
      await tarea(elementos[siguiente++])
      hechos++
      if (hechos % 50 === 0 || hechos === elementos.length) {
        process.stdout.write(`\r  R2: ${hechos}/${elementos.length} archivos borrados`)
      }
    }
  }
  await Promise.all(Array.from({ length: EN_PARALELO }, trabajador))
  if (elementos.length) process.stdout.write('\n')
}

const borrarRemoto = (key) => cloudflare(`${apiR2}/${encodeURIComponent(key)}`, { method: 'DELETE' })

// En local no hay API para listar por carpeta: las llaves salen de D1.
const borrarLocal = async (key) => {
  wrangler(['r2', 'object', 'delete', `${BUCKET}/${key}`, '--local'])
}

// ── Resumen y confirmación ──────────────────────────────────────────────────

const [evento] = d1.consultar(`SELECT slug, nombre FROM eventos WHERE slug = ${sql(slug)}`)
const fotos = d1.consultar(`SELECT id FROM fotos WHERE slug = ${sql(slug)}`)
const [rsvp] = d1.consultar(
  `SELECT COUNT(DISTINCT pases.id) AS pases, COUNT(personas.id) AS personas
   FROM pases LEFT JOIN personas ON personas.pase_id = pases.id WHERE pases.slug = ${sql(slug)}`,
)

let archivos
if (local) {
  archivos = fotos.flatMap(({ id }) => [`${slug}/${id}`, `${slug}/${id}.thumb`]).map((key) => ({ key }))
} else {
  try {
    archivos = await listarRemoto()
  } catch (err) {
    salir(`No se pudo listar R2: ${err.message}`)
  }
}

if (!evento && !fotos.length && !archivos.length && !rsvp.pases) {
  salir(`No hay nada de ${slug} en ${local ? 'la base LOCAL' : 'D1 ni en R2'}.`)
}

const mb = archivos.reduce((total, a) => total + (a.size ?? 0), 0) / 1024 / 1024
console.log(`
  Evento:  ${slug}${evento ? ` — "${evento.nombre}"` : '  (no está dado de alta)'}${local ? '  (base LOCAL)' : ''}
  Fotos en D1:  ${fotos.length}
  Archivos en R2 (${slug}/):  ${archivos.length}${local ? '' : `  (~${mb.toFixed(1)} MB)`}
  Pases de RSVP:  ${rsvp.pases}  (${rsvp.personas} personas)
  Se borra:  ${
    soloFotos
      ? 'sólo las fotos (el evento, su código, su QR y sus pases se conservan)'
      : `las fotos${rsvp.pases ? ', los pases con sus respuestas' : ''} y el evento`
  }
`)

if (simular) {
  console.log('  --simular: no se borró nada.')
  process.exit(0)
}

if (!bandera('si')) {
  if (!process.stdin.isTTY) salir('Sin terminal interactiva: confirma con --si.')
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const respuesta = (await rl.question(`  Esto no se puede deshacer. Escribe "${slug}" para confirmar: `)).trim()
  rl.close()
  if (respuesta !== slug) salir('\n  No coincide: no se borró nada.')
}

// ── Borrado: R2 primero, D1 al final ────────────────────────────────────────

try {
  await enParalelo(
    archivos.map((a) => a.key),
    local ? borrarLocal : borrarRemoto,
  )
} catch (err) {
  salir(`\n  Falló el borrado en R2 (D1 no se tocó; vuelve a correr el comando): ${err.message}`)
}

d1.consultar(`DELETE FROM fotos WHERE slug = ${sql(slug)}`)
if (!soloFotos) {
  d1.consultar(
    `DELETE FROM personas WHERE pase_id IN (SELECT id FROM pases WHERE slug = ${sql(slug)});
     DELETE FROM pases WHERE slug = ${sql(slug)};
     DELETE FROM eventos WHERE slug = ${sql(slug)};`,
  )
}

console.log(`
✓ ${soloFotos ? 'Fotos borradas' : 'Evento borrado'}: ${slug}${local ? '  (base LOCAL)' : ''}
${
  soloFotos
    ? ''
    : `
  Si también vas a dar de baja la invitación:
    1. Quita su entrada de terraform/sites.tf y corre terraform apply.
    2. git rm -r sites/${slug}  y commit + push.
`
}`)
