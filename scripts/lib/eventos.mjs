// Utilidades compartidas por los scripts de la API de invitaciones
// (fotos:alta, fotos:borrar, rsvp:alta): D1 vía wrangler, fechas en hora de
// México, datos del sitio y generación de códigos.

import { createHash, randomBytes, randomInt } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
export const workerDir = path.join(root, 'workers', 'fotos')
const wranglerBin = path.join(workerDir, 'node_modules', '.bin', 'wrangler')

export function salir(mensaje) {
  console.error(mensaje)
  process.exit(1)
}

// ── Argumentos ──────────────────────────────────────────────────────────────

/**
 * Lee `--bandera` y `--opcion valor` de process.argv; el resto son posicionales.
 * `conValor` lista las opciones que llevan valor.
 */
export function leerArgs(conValor = []) {
  const args = process.argv.slice(2)
  const opciones = {}
  const banderas = new Set()
  const posicionales = []
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (!a.startsWith('--')) posicionales.push(a)
    else if (conValor.includes(a.slice(2))) opciones[a.slice(2)] = args[++i]
    else banderas.add(a.slice(2))
  }
  return { opciones, bandera: (n) => banderas.has(n), posicionales }
}

export const SLUG_VALIDO = /^[a-z0-9][a-z0-9-]*$/

// ── Wrangler y D1 ───────────────────────────────────────────────────────────

export function wrangler(argumentos) {
  if (!existsSync(wranglerBin)) {
    salir('Falta wrangler. Instálalo una vez con:  npm install --prefix workers/fotos')
  }
  try {
    return execFileSync(wranglerBin, argumentos, {
      cwd: workerDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 64 * 1024 * 1024,
    })
  } catch (err) {
    salir(`wrangler ${argumentos.slice(0, 3).join(' ')} falló:\n${err.stderr || err.stdout || err.message}`)
  }
}

/** Ejecuta SQL en la D1 (remota o la de `wrangler dev`) y devuelve las filas del primer resultado. */
export function crearD1(local) {
  const destino = local ? '--local' : '--remote'
  return {
    consultar(comando) {
      const salida = wrangler(['d1', 'execute', 'invitaciones', destino, '--json', '--command', comando])
      return JSON.parse(salida)[0]?.results ?? []
    },
    /** Varias sentencias desde un archivo .sql (para inserciones grandes). */
    ejecutarArchivo(archivo) {
      wrangler(['d1', 'execute', 'invitaciones', destino, '--yes', '--file', archivo])
    },
  }
}

/** Literal SQL: texto entre comillas, números tal cual, null → NULL. */
export const sql = (v) =>
  v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replaceAll("'", "''")}'`

/** Carga CLOUDFLARE_API_TOKEN y CLOUDFLARE_ACCOUNT_ID de terraform/.env.local si no están en la terminal. */
export function cargarCredenciales() {
  const envLocal = path.join(root, 'terraform', '.env.local')
  if (existsSync(envLocal)) {
    for (const [, clave, valor] of readFileSync(envLocal, 'utf8').matchAll(
      /^\s*(?:export\s+)?(CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID)\s*=\s*"?([^"\n]*)"?/gm,
    )) {
      process.env[clave] ||= valor
    }
  }
  for (const clave of ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID']) {
    if (!process.env[clave]) salir(`Falta ${clave} (en la terminal o en terraform/.env.local).`)
  }
}

// ── Códigos y tokens ────────────────────────────────────────────────────────

// Sin O/0, I/1/L: el código se puede dictar o teclear sin confusiones.
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export const codigoAleatorio = (largo) =>
  Array.from({ length: largo }, () => ALFABETO[randomInt(ALFABETO.length)]).join('')

/** Token de los festejados y su hash (en D1 sólo se guarda el hash). */
export function tokenFestejados() {
  const token = randomBytes(32).toString('base64url')
  return { token, hash: createHash('sha256').update(token).digest('hex') }
}

// ── Fechas en hora de México ────────────────────────────────────────────────

export const ZONA = 'America/Mexico_City'
export const DIA_MS = 24 * 60 * 60 * 1000

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
export function fechaMexico(texto) {
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

export function validarFecha(fecha, origen) {
  if (Number.isNaN(fecha.getTime())) salir(`Fecha no válida en ${origen}`)
  return fecha
}

/** Día (YYYY-MM-DD) en hora de México de un instante. */
export const diaMexico = (instante) => new Date(instante.getTime() + desfase(instante)).toISOString().slice(0, 10)

export const formatoMx = new Intl.DateTimeFormat('es-MX', { timeZone: ZONA, dateStyle: 'full', timeStyle: 'short' })

// ── Datos del sitio ─────────────────────────────────────────────────────────

/**
 * Lee sites/<slug>: el texto de event.config.js, `fecha`, `titulo` y la URL
 * pública (VITE_SITE_URL del .env, terminada en /).
 */
export function leerSitio(slug) {
  const dir = path.join(root, 'sites', slug)
  if (!existsSync(dir)) salir(`No existe sites/${slug}`)

  const config = readFileSync(path.join(dir, 'src', 'event.config.js'), 'utf8')
  const env = existsSync(path.join(dir, '.env')) ? readFileSync(path.join(dir, '.env'), 'utf8') : ''
  const url = env.match(/^VITE_SITE_URL=(.+)$/m)?.[1]?.trim()
  if (!url || url.includes('CAMBIAR-URL')) {
    salir(`Pon la dirección de la invitación en sites/${slug}/.env (VITE_SITE_URL) antes de continuar.`)
  }

  return {
    dir,
    config,
    fecha: config.match(/fecha:\s*'([^']+)'/)?.[1],
    titulo: config.match(/titulo:\s*'([^']+)'/)?.[1],
    url: url.endsWith('/') ? url : `${url}/`,
  }
}
