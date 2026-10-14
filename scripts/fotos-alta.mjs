#!/usr/bin/env node
// Da de alta un evento en la API de fotos de invitados (D1 de workers/fotos).
//
//   npm run fotos:alta -- first-comunion-victoria
//   npm run fotos:alta -- boda-ana-y-luis --abre 2026-12-05T16:00 --cierra 2026-12-09
//   npm run fotos:alta -- boda-ana-y-luis --regenerar     (código y token nuevos)
//   npm run fotos:alta -- demo --local                     (base de `wrangler dev`)
//
// Genera el código de invitados (va en el QR) y el token de los festejados
// (en D1 sólo queda su hash), calcula la ventana de subida a partir de `fecha`
// en event.config.js (ese día a las 00:00 hora de México → 3 días después),
// guarda el QR en sites/<slug>/assets-origen/qr-fotos.png (qr-fotos.local.png
// con --local) e imprime los
// enlaces. El de festejados no se puede recuperar: guárdalo al darlo de alta.
//
// Si el evento ya existe sólo para RSVP (npm run rsvp:alta), activa las fotos
// conservando su enlace de festejados.
//
// Fechas de --abre / --cierra: "2026-12-05" o "2026-12-05T16:00" se toman en
// hora de México; con zona explícita ("…Z", "…-06:00") se respetan tal cual.

import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import QRCode from 'qrcode'
import { fotosHabilitadas } from '@invitaciones/core/fotos-config'
import {
  DIA_MS,
  SLUG_VALIDO,
  codigoAleatorio,
  crearD1,
  diaMexico,
  fechaMexico,
  formatoMx,
  leerArgs,
  leerSitio,
  root,
  salir,
  sql,
  tokenFestejados,
  validarFecha,
} from './lib/eventos.mjs'

const DIAS_ABIERTA = 3

// ── Argumentos ──────────────────────────────────────────────────────────────

const { opciones, bandera, posicionales } = leerArgs(['abre', 'cierra', 'nombre'])
const [slug] = posicionales
const local = bandera('local')
const regenerar = bandera('regenerar')

if (!slug || !SLUG_VALIDO.test(slug)) {
  salir(
    'Uso: npm run fotos:alta -- <slug> [--abre FECHA] [--cierra FECHA] [--nombre "Texto"] [--regenerar] [--local]',
  )
}

// ── Datos del sitio y ventana de subida ─────────────────────────────────────

const sitio = leerSitio(slug)
const nombre = opciones.nombre || sitio.titulo || slug
const urlFotos = `${sitio.url}fotos/`

let abre
if (opciones.abre) abre = validarFecha(fechaMexico(opciones.abre), '--abre')
else if (sitio.fecha) abre = validarFecha(fechaMexico(sitio.fecha.slice(0, 10)), 'event.config.js (fecha)')
else salir(`sites/${slug}/src/event.config.js no tiene \`fecha\`; usa --abre.`)

// Por defecto: medianoche del día de apertura + 3 días (México no tiene horario de verano).
const cierra = opciones.cierra
  ? validarFecha(fechaMexico(opciones.cierra), '--cierra')
  : new Date(fechaMexico(diaMexico(abre)).getTime() + DIAS_ABIERTA * DIA_MS)
if (cierra <= abre) salir('La fecha de cierre debe ser posterior a la de apertura.')

// ── D1 ──────────────────────────────────────────────────────────────────────

const d1 = crearD1(local)
const [existente] = d1.consultar(`SELECT slug, codigo, fotos, creado FROM eventos WHERE slug = ${sql(slug)}`)
if (existente?.fotos && !regenerar) {
  salir(
    `El evento ${slug} ya está dado de alta (desde ${existente.creado}).\n` +
      'Para generar un código y un enlace de festejados nuevos (los anteriores dejan de servir), usa --regenerar.',
  )
}
// Evento sólo de RSVP: se activan las fotos sin tocar el token de los festejados.
const activarEnRsvp = existente && !existente.fotos && !regenerar

let codigo
let token
if (activarEnRsvp) {
  codigo = existente.codigo
  d1.consultar(
    `UPDATE eventos SET fotos = 1, nombre = ${sql(nombre)}, abre_en = ${sql(abre.toISOString())},
       cierra_en = ${sql(cierra.toISOString())} WHERE slug = ${sql(slug)}`,
  )
} else {
  codigo = codigoAleatorio(6)
  const festejados = tokenFestejados()
  token = festejados.token
  const valores = [slug, nombre, codigo, festejados.hash, abre.toISOString(), cierra.toISOString()].map(sql).join(', ')
  d1.consultar(
    `INSERT INTO eventos (slug, nombre, codigo, admin_hash, abre_en, cierra_en, fotos) VALUES (${valores}, 1)
     ON CONFLICT (slug) DO UPDATE SET nombre = excluded.nombre, codigo = excluded.codigo, fotos = 1,
       admin_hash = excluded.admin_hash, abre_en = excluded.abre_en, cierra_en = excluded.cierra_en`,
  )
}

// ── QR y resumen ────────────────────────────────────────────────────────────

const urlInvitados = `${urlFotos}?c=${codigo}`
// En --local con otro nombre: una prueba nunca pisa el QR real.
const qrPath = path.join(sitio.dir, 'assets-origen', local ? 'qr-fotos.local.png' : 'qr-fotos.png')
await mkdir(path.dirname(qrPath), { recursive: true })
await QRCode.toFile(qrPath, urlInvitados, { width: 1200, margin: 2, errorCorrectionLevel: 'M' })

const accion = activarEnRsvp ? 'activadas' : existente ? 'regeneradas' : 'dadas de alta'
const festejados = activarEnRsvp
  ? `  Festejados — usan el mismo enlace que ya tienen del RSVP, cambiando
    /rsvp/ por /fotos/ (el token es el mismo para los dos).`
  : `  Festejados — mándales este enlace; NO se puede recuperar después:
    ${urlFotos}#admin=${token}
    (el mismo token sirve para su panel de RSVP: ${sitio.url}rsvp/#admin=…)`

console.log(`
✓ Fotos de invitados ${accion}: ${nombre}${local ? '  (base LOCAL)' : ''}

  Subida abierta
    desde  ${formatoMx.format(abre)}
    hasta  ${formatoMx.format(cierra)}

  Invitados (código ${codigo}) — es lo que lleva el QR:
    ${urlInvitados}
    QR para imprimir: ${path.relative(root, qrPath)}

${festejados}
${existente && !activarEnRsvp ? '\n  ⚠ El código y el enlace de festejados anteriores ya no sirven (tampoco el del RSVP). Las fotos y los pases se conservan.\n' : ''}
${
  fotosHabilitadas(sitio.dir)
    ? ''
    : `  ⚠ fotosInvitados.habilitado está en false en sites/${slug}/src/event.config.js:
    la página /fotos/ NO se publica y el QR llevaría a una página inexistente.
    Ponlo en true y haz push antes de imprimir el QR.
`
}`)
