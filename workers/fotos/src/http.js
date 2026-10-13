// Respuestas JSON, errores y CORS.

/** Error con código HTTP; el router lo convierte en { error, ...extra }. */
export class HttpError extends Error {
  constructor(status, mensaje, extra = {}) {
    super(mensaje)
    this.status = status
    this.extra = extra
  }
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

// Las invitaciones (*.evento.casa) y el desarrollo local, incluido el teléfono
// en la misma red (vite --host). CORS no es la barrera de seguridad: sin el
// código del evento o el token de los festejados, la API no responde nada útil.
const ORIGEN_PERMITIDO =
  /^(https:\/\/([a-z0-9-]+\.)*evento\.casa|https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?)$/

export function corsHeaders(request) {
  const origin = request.headers.get('Origin')
  if (!origin || !ORIGEN_PERMITIDO.test(origin)) return {}
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Codigo',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

export function conCors(response, request) {
  const out = new Response(response.body, response)
  for (const [k, v] of Object.entries(corsHeaders(request))) out.headers.set(k, v)
  return out
}
