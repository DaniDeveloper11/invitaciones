import { photos } from '@invitaciones/core'

/**
 * Datos de la invitación. Este es el único archivo que necesitas editar
 * para actualizar la invitación; index.html sólo se toca si cambias el diseño.
 */
export default {
  titulo: 'Mi Cumpleaños — Invitación',

  hero: {
    eyebrow: 'Te invito a mi',
    titulo: 'Cumpleaños',
    subtitulo: 'Acompáñame a celebrar este día tan especial',
    imagen: 'images/hero.webp',
  },

  // Fecha y hora del evento en formato ISO (respeta la zona horaria local).
  fecha: '2026-09-26T19:00:00',
  // La fecha se formatea sola ("Sábado, 26 de septiembre de 2026").
  // La hora se muestra tal cual para conservar el formato de la invitación.
  horaTexto: '3:00 PM',

  mensaje: {
    eyebrow: 'Un mensaje para ti',
    texto: `¡Pues resulta que ya voy a cumplir 40! 😱😂
No sé quién autorizó esto, pero ya que estamos aquí… ¡hay que festejarlo como se debe! 🥂🎉

Así que vayan preparando el hígado, los zapatos y la actitud…
¡porque esto apenas comienza! 🥳🥂❤️`,
  },

  lugar: {
    etiqueta: 'Lugar',
    nombre: "Becerra's Bar",
    direccion: 'Calle Escobedo 179, Etzatlan, jal',
    mapsUrl:
      'https://www.google.com/maps/place/Escobedo+179,+Centro,+46500+Etzatl%C3%A1n,+Jal./@20.7666277,-104.0923038,20.27z/data=!4m6!3m5!1s0x84266fd3608200e5:0x9abd2da26d1ea5f6!8m2!3d20.7665984!4d-104.0921498!16s%2Fg%2F11vzf_j0p9?entry=ttu&g_ep=EgoyMDI2MDgyNi4wIKXMDSoASAFQAw%3D%3D',
  },

  dresscode: {
    titulo: 'Blanco & Negro',
    nota: 'Te invitamos a vestir en estos tonos',
    paleta: ['#1a1a1a', '#f0ece4'],
    fotos: photos('dresscode', 5),
  },

  galeria: {
    eyebrow: 'Momentos',
    titulo: 'Galería',
    fotos: photos('gallery', 10),
  },

  rsvp: {
    titulo: 'Confirma tu asistencia',
    nota: 'Elige una opción y se enviará como mensaje de WhatsApp.',
    // Código de país + número, sin "+", espacios ni guiones.
    whatsapp: '523861095709',
    opciones: [
      '¡Sí, ahí estaré! 🎉',
      'Sí, iré acompañado/a 👥',
      'Aún no estoy seguro/a 🤔',
      'No podré asistir 😢',
      '¡Feliz cumpleaños! 🎂',
      'Tengo una duda ✋',
    ],
  },

  musica: {
    src: 'audio/song.mp3',
    autoplay: true,
  },

  footer: "Lleva tu kit pa' pistear🍺🍷🍾🥂",
}
