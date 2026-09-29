import { asset, photos } from '@invitaciones/core'

/**
 * Datos de la invitación. Este es el único archivo que necesitas editar
 * para una invitación nueva; index.html sólo se toca si cambias el diseño.
 */
export default {
  // Título de la pestaña del navegador.
  titulo: 'Victoria Vélez Aviña · Primera Comunión',

  // Adorno floral que separa secciones (recortado de la invitación impresa).
  adorno: asset('images/divider.webp'),

  hero: {
    eyebrow: 'Mi Primera Comunión',
    titulo: 'Victoria',
    subtitulo: 'Vélez Aviña',
    // Ilustración a pantalla completa: public/images/hero.webp
    imagen: 'images/hero.webp',
  },

  // Fecha y hora del evento en formato ISO (respeta la zona horaria local).
  // Los textos de fecha y hora se calculan solos; si quieres otro texto,
  // llena `fechaTexto` y `horaTexto`.
  fecha: '2026-10-10T12:00:00',
  fechaTexto: 'Sábado 10 de Octubre, 2026',
  horaTexto: '12:00 hrs',
  // Bloque de fecha en tres columnas (como la invitación impresa).
  fechaPartes: { dia: 'Sábado', numero: '10', mes: 'Octubre', anio: '2026' },
  guardaLaFecha: 'Guarda la fecha',

  cuentaRegresiva: {
    eyebrow: 'Faltan',
    finalizado: '¡El gran día ha llegado! 🕊️',
  },

  mensaje: {
    eyebrow: 'Un mensaje para ti',
    texto:
      'Me llena de alegría compartir contigo este día tan especial,\nen el que recibo por primera vez a Jesús en mi corazón;\nun día de luz, fe y amor.',
  },

  lugar: {
    eyebrow: 'Los detalles',
    etiqueta: 'Ceremonia · 12:00 hrs',
    nombre: 'Templo de la Cuevita Santa',
    direccion: 'Etzatlán, Jalisco',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Templo+de+la+Cuevita+Santa+Etzatl%C3%A1n+Jalisco',
  },

  // Segunda sede: se muestra debajo de la ceremonia (ver index.html).
  recepcion: {
    etiqueta: 'Recepción · 14:00 hrs',
    nombre: 'Rancho Cajita del Agua',
    direccion: 'Matamoros 40, Etzatlán, Jalisco',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Rancho+Cajita+del+Agua+Matamoros+40+Etzatl%C3%A1n+Jalisco',
  },

  dresscode: {
    // Deja `titulo` vacío para ocultar toda la sección.
    titulo: '',
    nota: 'Te invitamos a vestir en estos tonos',
    // Círculos de color de la paleta sugerida.
    paleta: ['#e9b8b4', '#f3e3d3', '#c9a063'],
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
    titulo: 'Favor de confirmar asistencia',
    nota: 'Elige una opción y se enviará como mensaje de WhatsApp al 33 1344 9813.',
    // Código de país + número, sin "+", espacios ni guiones (ej. 523312345678).
    // Déjalo vacío para ocultar la sección.
    whatsapp: '523313449813',
    opciones: [
      '¡Sí, ahí estaré! 🎉',
      'Sí, iré acompañado/a 👥',
      'Aún no estoy seguro/a 🤔',
      'No podré asistir 😢',
    ],
  },

  musica: {
    // Canción de fondo: public/audio/song.mp3. Deja `src` vacío para quitarla.
    src: '',
    autoplay: true,
  },

  footer: 'Con amor, Victoria 🕊️',
}
