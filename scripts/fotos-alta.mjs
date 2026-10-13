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
// guarda el QR en sites/<slug>/assets-origen/qr-fotos.png e imprime los
// enlaces. El de festejados no se puede recuperar: guárdalo al darlo de alta.
//
// Fechas de --abre / --cierra: "2026-12-05" o "2026-12-05T16:00" se toman en
// hora de México; con zona explícita ("…Z", "…-06:00") se respetan tal cual.

import { createHash, randomBytes, randomInt } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import QRCode from 'qrcode'

const ZONA = 'America/Mexico_City'
const DIAS_ABIERTA = 3
// Sin O/0, I/1/L: el código se puede dictar o teclear sin confusiones.
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const workerDir = path.join(root, 'workers', 'fotos')
const wranglerBin = path.join(workerDir, 'node_modules', '.bin', 'wrangler')

// ── Argumentos ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const opcion = (nombre) => {
  const i = args.indexOf(`--${nombre}`)
  return i !== -1 ? args[i + 1] : undefined
}
const bandera = (nombre) => args.includes(`--${nombre}`)
const valoresDeOpciones = new Set(['abre', 'cierra', 'nombre'].map(opcion).filter(Boolean))
const slug = args.find((a) => !a.startsWith('--') && !valoresDeOpciones.has(a))
const local = bandera('local')
const regenerar = bandera('regenerar')

function salir(mensaje) {
  console.error(mensaje)
  process.exit(1)
}

if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
  salir(
    'Uso: npm run fotos:alta -- <slug> [--abre FECHA] [--cierra FECHA] [--nombre "Texto"] [--regenerar] [--local]',
  )
}
if (!existsSync(wranglerBin)) {
  salir('Falta wrangler. Instálalo una vez con:  npm install --prefix workers/fotos')
}

// ── Fechas en hora de México ────────────────────────────────────────────────

/** Desfase (ms) de la zona respecto a UTC en un instante dado. */
function desfase(instante) {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: ZONA,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(instante)
      .map((p) => [p.type, p.value]),
  )
  const comoUtc = Date.UTC(partes.year, partes.month - 1, partes.day, partes.hour, partes.minute, partes.second)
  return comoUtc - instante.getTime()
}

/** "2026-10-10" o "2026-10-10T16:00" (hora de México) → Date. Con zona explícita, tal cual. */
function fechaMexico(texto) {
  if (/(Z|[+-]\d{2}:?\d{2})$/.test(texto)) return new Date(texto)
  const m = texto.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/)
  if (!m) return new Date(NaN)
  const [, y, mes, d, h = '00', min = '00'] = m
  const ingenua = new Date(Date.UTC(y, mes - 1, d, h, min))
  // Dos pasadas: el desfase puede cambiar justo en un cambio de horario.
  let instante = new Date(ingenua.getTime() - desfase(ingenua))
  instante = new Date(ingenua.getTime() - desfase(instante))
  return instante
}

function validarFecha(fecha, origen) {
  if (Number.isNaN(fecha.getTime())) salir(`Fecha no válida en ${origen}`)
  return fecha
}

const formatoMx = new Intl.DateTimeFormat('es-MX', { timeZone: ZONA, dateStyle: 'full', timeStyle: 'short' })

// ── Datos del sitio ─────────────────────────────────────────────────────────

const sitioDir = path.join(root, 'sites', slug)
if (!existsSync(sitioDir)) salir(`No existe sites/${slug}`)

const config = await readFile(path.join(sitioDir, 'src', 'event.config.js'), 'utf8')
const fechaEvento = config.match(/fecha:\s*'([^']+)'/)?.[1]
const nombre = opcion('nombre') || config.match(/titulo:\s*'([^']+)'/)?.[1] || slug

const env = await readFile(path.join(sitioDir, '.env'), 'utf8').catch(() => '')
const siteUrl = env.match(/^VITE_SITE_URL=(.+)$/m)?.[1]?.trim()
if (!siteUrl || siteUrl.includes('CAMBIAR-URL')) {
  salir(`Pon la dirección de la invitación en sites/${slug}/.env (VITE_SITE_URL) antes de dar de alta las fotos.`)
}
const urlFotos = new URL('fotos/', siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`).href

let abre
if (opcion('abre')) abre = validarFecha(fechaMexico(opcion('abre')), '--abre')
else if (fechaEvento) abre = validarFecha(fechaMexico(fechaEvento.slice(0, 10)), 'event.config.js (fecha)')
else salir(`sites/${slug}/src/event.config.js no tiene \`fecha\`; usa --abre.`)

/** Día (YYYY-MM-DD) en hora de México de un instante. */
const diaMexico = (instante) => new Date(instante.getTime() + desfase(instante)).toISOString().slice(0, 10)

// Por defecto: medianoche del día de apertura + 3 días (México no tiene horario de verano).
const cierra = opcion('cierra')
  ? validarFecha(fechaMexico(opcion('cierra')), '--cierra')
  : new Date(fechaMexico(diaMexico(abre)).getTime() + DIAS_ABIERTA * 24 * 60 * 60 * 1000)
if (cierra <= abre) salir('La fecha de cierre debe ser posterior a la de apertura.')

// ── D1 ──────────────────────────────────────────────────────────────────────

const sql = (v) => (v === null ? 'NULL' : `'${String(v).replaceAll("'", "''")}'`)

function d1(comando) {
  let salida
  try {
    salida = execFileSync(
      wranglerBin,
      ['d1', 'execute', 'invitaciones', local ? '--local' : '--remote', '--json', '--command', comando],
      { cwd: workerDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    )
  } catch (err) {
    salir(`wrangler d1 execute falló:\n${err.stderr || err.stdout || err.message}`)
  }
  return JSON.parse(salida)[0]?.results ?? []
}

const [existente] = d1(`SELECT slug, creado FROM eventos WHERE slug = ${sql(slug)}`)
if (existente && !regenerar) {
  salir(
    `El evento ${slug} ya está dado de alta (desde ${existente.creado}).\n` +
      'Para generar un código y un enlace de festejados nuevos (los anteriores dejan de servir), usa --regenerar.',
  )
}

const codigo = Array.from({ length: 6 }, () => ALFABETO[randomInt(ALFABETO.length)]).join('')
const token = randomBytes(32).toString('base64url')
const adminHash = createHash('sha256').update(token).digest('hex')

const valores = [slug, nombre, codigo, adminHash, abre.toISOString(), cierra.toISOString()].map(sql).join(', ')
d1(
  `INSERT INTO eventos (slug, nombre, codigo, admin_hash, abre_en, cierra_en) VALUES (${valores})
   ON CONFLICT (slug) DO UPDATE SET nombre = excluded.nombre, codigo = excluded.codigo,
     admin_hash = excluded.admin_hash, abre_en = excluded.abre_en, cierra_en = excluded.cierra_en`,
)

// ── QR y resumen ────────────────────────────────────────────────────────────

const urlInvitados = `${urlFotos}?c=${codigo}`
const urlFestejados = `${urlFotos}#admin=${token}`
const qrPath = path.join(sitioDir, 'assets-origen', 'qr-fotos.png')
await mkdir(path.dirname(qrPath), { recursive: true })
await QRCode.toFile(qrPath, urlInvitados, { width: 1200, margin: 2, errorCorrectionLevel: 'M' })

console.log(`
✓ Fotos de invitados ${existente ? 'regeneradas' : 'dadas de alta'}: ${nombre}${local ? '  (base LOCAL)' : ''}

  Subida abierta
    desde  ${formatoMx.format(abre)}
    hasta  ${formatoMx.format(cierra)}

  Invitados (código ${codigo}) — es lo que lleva el QR:
    ${urlInvitados}
    QR para imprimir: ${path.relative(root, qrPath)}

  Festejados — mándales este enlace; NO se puede recuperar después:
    ${urlFestejados}
${existente ? '\n  ⚠ El código y el enlace de festejados anteriores ya no sirven. Las fotos se conservan.\n' : ''}
  Para que el botón aparezca en la invitación: fotosInvitados.habilitado = true
  en sites/${slug}/src/event.config.js.
`)
