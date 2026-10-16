// Normalización de la configuración del evento y utilidades de rutas.
// El objetivo: que cada sitio sólo tenga que llenar `event.config.js` y que
// index.html no contenga datos, sólo maquetación.

/** Une una ruta pública con el `base` del build (funciona en subdirectorios). */
export function asset(path = '') {
  const base = import.meta.env.BASE_URL || '/'
  return `${base.replace(/\/$/, '')}/${String(path).replace(/^\//, '')}`
}

/**
 * Genera una lista de fotos numeradas: photos('gallery', 10) →
 * ['/images/gallery/1.webp', ... '/images/gallery/10.webp'].
 */
export function photos(dir, count, ext = 'webp') {
  return Array.from({ length: count }, (_, i) => asset(`images/${dir}/${i + 1}.${ext}`))
}

const DEFAULTS = {
  locale: 'es-MX',
  titulo: 'Invitación',
  hero: {
    eyebrow: '',
    titulo: '',
    subtitulo: '',
    imagen: 'images/hero.webp',
  },
  fecha: null,
  fechaTexto: '',
  horaTexto: '',
  guardaLaFecha: 'Guarda la fecha',
  cuentaRegresiva: {
    eyebrow: 'Faltan',
    finalizado: '¡El día ha llegado! 🎉',
  },
  mensaje: {
    eyebrow: 'Un mensaje para ti',
    texto: '',
  },
  lugar: {
    eyebrow: 'Los detalles',
    etiqueta: 'Lugar',
    nombre: '',
    direccion: '',
    mapsUrl: '',
  },
  dresscode: {
    eyebrow: 'Dress code',
    titulo: '',
    nota: 'Te invitamos a vestir en estos tonos',
    paleta: [],
    fotos: [],
  },
  galeria: {
    eyebrow: 'Momentos',
    titulo: 'Galería',
    fotos: [],
  },
  rsvp: {
    // 'whatsapp': cada opción abre WhatsApp con el mensaje escrito.
    // 'pases': cada invitado confirma con su enlace personal (/?i=<código>)
    //          marcando quién asiste; la lista se carga con `npm run rsvp:alta`.
    modo: 'whatsapp',
    titulo: 'Confirma tu asistencia',
    nota: '', // por defecto, según el modo (abajo)
    whatsapp: '',
    opciones: [],
    cierra: '', // fecha límite (sólo la lee `npm run rsvp:alta`)
    sinEnlace: 'Para confirmar, abre el enlace personal que te enviamos.',
    gracias: '¡Gracias por confirmar!',
  },
  musica: {
    src: 'audio/song.mp3',
    autoplay: true,
  },
  // Fotos de invitados: página /fotos/ (ver workers/fotos y README).
  // `habilitado` es el interruptor: publica la página y muestra el botón.
  fotosInvitados: {
    habilitado: false,
    api: 'https://api.evento.casa',
    slug: '', // por defecto, el nombre de la carpeta en sites/
    boton: 'Comparte tus fotos',
    eyebrow: 'Comparte tus fotos',
    titulo: 'Nuestro álbum',
    nota: 'Toma o elige fotos del evento: se compartirán con los festejados y con los demás invitados.',
  },
  footer: '',
}

function merge(base, extra) {
  const out = { ...base }
  for (const [key, value] of Object.entries(extra || {})) {
    if (value === undefined) continue
    out[key] =
      value && typeof value === 'object' && !Array.isArray(value)
        ? merge(base[key] || {}, value)
        : value
  }
  return out
}

function formatearFecha(iso, locale) {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return ''
  const texto = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(fecha)
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function formatearHora(iso, locale) {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return ''
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' })
    .format(fecha)
    .toUpperCase()
}

/** Aplica defaults, resuelve rutas y calcula los textos de fecha y hora. */
export function normalizeEvent(config = {}) {
  const event = merge(DEFAULTS, config)

  if (!event.fecha) {
    console.warn('[invitación] Falta `fecha` en event.config.js (formato ISO, ej. 2026-09-26T19:00:00)')
  }

  event.fechaTexto = event.fechaTexto || formatearFecha(event.fecha, event.locale)
  event.horaTexto = event.horaTexto || formatearHora(event.fecha, event.locale)
  event.hero.imagen = event.hero.imagen ? asset(event.hero.imagen) : ''
  event.musica.src = event.musica.src ? asset(event.musica.src) : ''
  event.tieneMusica = Boolean(event.musica.src)
  event.tieneGaleria = event.galeria.fotos.length > 0
  event.tieneDresscode = Boolean(event.dresscode.titulo)

  // VITE_FOTOS_API permite apuntar a `wrangler dev` en local sin tocar el config.
  const fotos = event.fotosInvitados
  fotos.api = import.meta.env.VITE_FOTOS_API || fotos.api
  fotos.slug = fotos.slug || import.meta.env.VITE_INVITACION_SLUG || ''

  // El RSVP con pases usa la misma API y el mismo evento que las fotos.
  const rsvp = event.rsvp
  rsvp.api = fotos.api
  rsvp.slug = fotos.slug
  rsvp.locale = event.locale
  rsvp.inicio = asset('')
  rsvp.conWhatsapp = Boolean(rsvp.whatsapp) && rsvp.opciones.length > 0
  rsvp.nota ||=
    rsvp.modo === 'pases'
      ? 'Marca quiénes nos acompañarán. Puedes cambiar tu respuesta más adelante.'
      : 'Elige una opción y se enviará como mensaje de WhatsApp.'
  event.tieneRsvpPases = rsvp.modo === 'pases' && Boolean(rsvp.slug)
  event.tieneRsvp = event.tieneRsvpPases || (rsvp.modo !== 'pases' && rsvp.conWhatsapp)
  fotos.locale = event.locale
  fotos.url = asset('fotos/')
  fotos.inicio = asset('')
  event.tieneFotosInvitados = Boolean(fotos.habilitado && fotos.slug)

  return event
}
