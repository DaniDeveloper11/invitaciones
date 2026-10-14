// API de las invitaciones (fotos de invitados y RSVP) — https://api.evento.casa
//
// Un solo Worker para todas las invitaciones; cada evento se identifica por el
// slug de su carpeta en sites/. D1 guarda los metadatos y R2 los archivos.
//
// Fotos:
//   GET    /v1/:slug                       evento y estado de la subida   (código o admin)
//   GET    /v1/:slug/fotos                 muro: fotos visibles            (código o admin)
//   POST   /v1/:slug/fotos                 subir una foto                  (código)
//   GET    /v1/:slug/img/:id[.thumb]       la imagen                       (código o admin)
//   GET    /v1/:slug/admin/fotos           todas, incluidas las ocultas    (admin)
//   PATCH  /v1/:slug/admin/fotos/:id       ocultar / mostrar               (admin)
//   DELETE /v1/:slug/admin/fotos/:id       borrar                          (admin)
//
// RSVP:
//   GET    /v1/:slug/rsvp                  el pase y su respuesta          (pase)
//   PUT    /v1/:slug/rsvp                  confirmar / cambiar respuesta   (pase)
//   GET    /v1/:slug/admin/rsvp            todos los pases y totales       (admin)
//
// Código: header X-Codigo (o ?c= en <img>). Pase: header X-Pase.
// Admin: Authorization: Bearer <token>.
import { HttpError, json, corsHeaders, conCors } from './http.js'
import {
  cargarEvento,
  conFotos,
  verEvento,
  listarFotos,
  listarFotosAdmin,
  subirFoto,
  servirImagen,
  cambiarFoto,
  borrarFoto,
} from './fotos.js'
import { verPase, responderPase, listarRsvp } from './rsvp.js'

const SLUG = '([a-z0-9-]+)'
const ID = '([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'

const RUTAS = [
  ['GET', `^/v1/${SLUG}$`, conFotos(verEvento)],
  ['GET', `^/v1/${SLUG}/fotos$`, conFotos(listarFotos)],
  ['POST', `^/v1/${SLUG}/fotos$`, conFotos(subirFoto)],
  ['GET', `^/v1/${SLUG}/img/${ID}(\\.thumb)?$`, conFotos(servirImagen)],
  ['GET', `^/v1/${SLUG}/admin/fotos$`, conFotos(listarFotosAdmin)],
  ['PATCH', `^/v1/${SLUG}/admin/fotos/${ID}$`, conFotos(cambiarFoto)],
  ['DELETE', `^/v1/${SLUG}/admin/fotos/${ID}$`, conFotos(borrarFoto)],
  ['GET', `^/v1/${SLUG}/rsvp$`, verPase],
  ['PUT', `^/v1/${SLUG}/rsvp$`, responderPase],
  ['GET', `^/v1/${SLUG}/admin/rsvp$`, listarRsvp],
].map(([metodo, patron, handler]) => ({ metodo, patron: new RegExp(patron), handler }))

async function enrutar(request, env) {
  const url = new URL(request.url)
  const coinciden = RUTAS.map((r) => ({ ...r, m: url.pathname.match(r.patron) })).filter((r) => r.m)
  if (!coinciden.length) throw new HttpError(404, 'Ruta no encontrada')

  const ruta = coinciden.find((r) => r.metodo === request.method)
  if (!ruta) throw new HttpError(405, 'Método no permitido')

  const [, slug, ...params] = ruta.m
  const evento = await cargarEvento(env, slug)
  return ruta.handler({ request, env, url, evento, params })
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) })
    }

    let response
    try {
      response = await enrutar(request, env)
    } catch (err) {
      if (err instanceof HttpError) {
        response = json({ error: err.message, ...err.extra }, err.status)
      } else {
        console.error(err)
        response = json({ error: 'Error interno' }, 500)
      }
    }
    return conCors(response, request)
  },
}
