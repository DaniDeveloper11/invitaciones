// Acceso: invitados con el código del evento, festejados con su token.
import { HttpError } from './http.js'

const encoder = new TextEncoder()

/** Comparación en tiempo constante (no filtra cuántos caracteres coinciden). */
function iguales(a, b) {
  const x = encoder.encode(String(a))
  const y = encoder.encode(String(b))
  if (x.byteLength !== y.byteLength) return false
  return crypto.subtle.timingSafeEqual(x, y)
}

export async function sha256(texto) {
  const buf = await crypto.subtle.digest('SHA-256', encoder.encode(texto))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function esAdmin(evento, request) {
  const token = request.headers.get('Authorization')?.match(/^Bearer\s+(.+)$/)?.[1]?.trim()
  return Boolean(token) && iguales(await sha256(token), evento.admin_hash)
}

function tieneCodigo(evento, request, url) {
  // Header en fetch; query `c` en <img src>, que no puede mandar headers.
  const codigo = (request.headers.get('X-Codigo') ?? url.searchParams.get('c') ?? '').trim().toUpperCase()
  return Boolean(codigo) && iguales(codigo, evento.codigo)
}

/** Devuelve 'admin' o 'invitado'; lanza 403 si no hay ninguno de los dos. */
export async function exigirAcceso(evento, request, url) {
  if (await esAdmin(evento, request)) return 'admin'
  if (tieneCodigo(evento, request, url)) return 'invitado'
  throw new HttpError(403, 'Código del evento inválido', { codigo: 'sin_acceso' })
}

export async function exigirAdmin(evento, request) {
  if (!(await esAdmin(evento, request))) {
    throw new HttpError(403, 'Enlace de festejados inválido', { codigo: 'sin_acceso' })
  }
}
