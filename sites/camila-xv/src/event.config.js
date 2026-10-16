import { photos } from '@invitaciones/core'

/**
 * Datos de la invitación. Este es el único archivo que necesitas editar
 * para una invitación nueva; index.html sólo se toca si cambias el diseño.
 */
export default {
  // Título de la pestaña del navegador.
  titulo: 'Camila XV',

  hero: {
    eyebrow: 'Acompáñame',
    subtitulo: 'a celebrar mis XV años',
    titulo: 'Camila',
    // Tarjeta en acuarela sin texto: public/images/hero.webp
    imagen: 'images/hero.webp',
  },

  cuentaRegresiva: {
    eyebrow: 'Faltan:',
  },

  // Fecha y hora del evento en formato ISO (respeta la zona horaria local).
  // Los textos de fecha y hora se calculan solos; si quieres otro texto,
  // llena `fechaTexto` y `horaTexto`.
  fecha: '2026-12-31T20:00:00',
  fechaTexto: '',
  horaTexto: '',

  mensaje: {
    eyebrow: 'Un mensaje para ti',
    texto: 'Escribe aquí tu mensaje personal.\nLos saltos de línea se respetan.',
  },

  lugar: {
    etiqueta: 'Lugar',
    nombre: 'Nombre del salón',
    direccion: 'Calle y número, Ciudad',
    mapsUrl: '',
  },

  dresscode: {
    // Deja `titulo` vacío para ocultar toda la sección.
    titulo: 'Formal',
    nota: 'Te invitamos a vestir en estos tonos',
    // Círculos de color de la paleta sugerida.
    paleta: ['#e6339a', '#f9bbdb', '#c9a24a'],
    // Ejemplos en public/images/dresscode/1.webp, 2.webp, ...
    fotos: photos('dresscode', 0),
  },

  galeria: {
    eyebrow: 'Momentos',
    titulo: 'Galería',
    // Fotos en public/images/gallery/1.webp, 2.webp, ... (cambia el número)
    fotos: photos('gallery', 0),
  },

  rsvp: {
    // 'whatsapp': cada opción abre WhatsApp con el mensaje ya escrito.
    // 'pases': cada invitado confirma con su enlace personal marcando quién
    //          asiste. La lista se carga con `npm run rsvp:alta` (ver README).
    modo: 'whatsapp',
    // Sólo con pases: fecha límite para confirmar (hasta el final de ese día).
    // cierra: '2026-11-20',
    titulo: 'Confirma tu asistencia',
    // nota: '',   (por defecto, un texto según el modo)
    // Código de país + número, sin "+", espacios ni guiones (ej. 523312345678).
    // Con 'whatsapp', déjalo vacío para ocultar la sección; con 'pases', es el
    // respaldo para quien abra la invitación sin su enlace personal.
    whatsapp: '',
    opciones: [
      '¡Sí, ahí estaré! 🎉',
      'Sí, iré acompañado/a 👥',
      'Aún no estoy seguro/a 🤔',
      'No podré asistir 😢',
    ],
  },

  musica: {
    // Canción de fondo: public/audio/song.mp3. Deja `src` vacío para quitarla.
    src: 'audio/song.mp3',
    autoplay: true,
  },

  // Fotos de invitados: los invitados suben fotos durante el evento desde
  // /fotos/ (con el código del QR). Antes, da de alta el evento con
  // `npm run fotos:alta -- <slug>` (ver README). Con `habilitado: true` se
  // publica la página /fotos/ y aparece el botón en la invitación.
  fotosInvitados: {
    habilitado: false,
    // boton: 'Comparte tus fotos',
    // titulo: 'Nuestro álbum',
    // nota: 'Toma o elige fotos del evento: se compartirán con los festejados y con los demás invitados.',
  },

  footer: 'Nos vemos ahí',
}
