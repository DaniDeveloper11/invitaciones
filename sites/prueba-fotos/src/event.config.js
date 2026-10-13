import { photos } from '@invitaciones/core'

/**
 * Datos de la invitación. Este es el único archivo que necesitas editar
 * para una invitación nueva; index.html sólo se toca si cambias el diseño.
 */
export default {
  // Título de la pestaña del navegador.
  titulo: 'Prueba de fotos',

  hero: {
    eyebrow: 'Te invito a mi',
    titulo: 'Celebración',
    subtitulo: 'Acompáñame a celebrar este día tan especial',
    // Retrato a pantalla completa: public/images/hero.webp (mín. 1200x1600px)
    imagen: 'images/hero.webp',
  },

  // Fecha y hora del evento en formato ISO (respeta la zona horaria local).
  // Los textos de fecha y hora se calculan solos; si quieres otro texto,
  // llena `fechaTexto` y `horaTexto`.
  fecha: '2026-10-13T20:00:00',
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
    paleta: ['#1a1a1a', '#f0ece4'],
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
    titulo: 'Confirma tu asistencia',
    nota: 'Elige una opción y se enviará como mensaje de WhatsApp.',
    // Código de país + número, sin "+", espacios ni guiones (ej. 523312345678).
    // Déjalo vacío para ocultar la sección.
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
    habilitado: true,
    // boton: 'Comparte tus fotos',
    // titulo: 'Nuestro álbum',
    // nota: 'Toma o elige fotos del evento: se compartirán con los festejados y con los demás invitados.',
  },

  footer: 'Nos vemos ahí',
}
