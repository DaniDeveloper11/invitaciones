import { photos } from '@invitaciones/core'

/**
 * Datos de la invitación. Este es el único archivo que necesitas editar
 * para una invitación nueva; index.html sólo se toca si cambias el diseño.
 */
export default {
  // Título de la pestaña del navegador.
  titulo: 'Camila XV',

  hero: {
    eyebrow: 'Mis\nXV Años',
    titulo: 'Camila',
    // Foto vertical dentro del arco: public/images/hero.webp (~900x1200px)
    imagen: 'images/hero.webp',
  },

  cuentaRegresiva: {
    eyebrow: 'Faltan',
  },

  // Fecha y hora del evento en formato ISO (respeta la zona horaria local).
  // Los textos de fecha y hora se calculan solos; si quieres otro texto,
  // llena `fechaTexto` y `horaTexto`.
  fecha: '2026-12-31T20:00:00',
  fechaTexto: '',
  horaTexto: '',

  mensaje: {
    // Frase bajo la foto de la portada. Déjala vacía para ocultarla.
    texto: '"Hay momentos inolvidables que se atesoran en el corazón para siempre. Por eso quiero compartir contigo esta noche tan especial, celebrando juntos mis XV años."',
  },

  // Padres y padrinos. `titulo` presenta al primer grupo (los padres, sin
  // título propio); agrega o quita grupos libremente. Con `grupos: []` la
  // sección desaparece. `cierre` va antes de "XV Años" (vacío lo oculta).
  familia: {
    titulo: 'Acompáñame en este día tan especial junto a mis padres:',
    grupos: [
      { titulo: '', nombres: ['Nombre del papá', 'Nombre de la mamá'] },
      { titulo: 'Mis padrinos', nombres: ['Nombre del padrino', 'Nombre de la madrina'] },
    ],
    cierre: 'A festejar mis',
  },

  // Misa y recepción. `icono`: iglesia, copas, corona, vals, camara, disco o
  // reloj. Sin `mapsUrl` no aparece el botón "Ver ubicación".
  ceremonias: [
    {
      icono: 'iglesia',
      titulo: 'Misa de Agradecimiento',
      hora: '6:00 PM',
      lugar: 'Nombre de la iglesia',
      direccion: 'Calle y número, Ciudad',
      mapsUrl: 'https://maps.google.com/',
    },
    {
      icono: 'copas',
      titulo: 'Recepción',
      hora: '8:00 PM',
      lugar: 'Nombre del salón',
      direccion: 'Calle y número, Ciudad',
      mapsUrl: 'https://maps.google.com/',
    },
  ],

  // Fotos del diseño (verticales, ~1000x1250px). Deja una vacía para quitarla.
  fotos: {
    destacada: 'images/foto-1.webp', // después de misa y recepción
    regalos: 'images/foto-2.webp', // antes de la sugerencia de regalos
    marco: 'images/foto-3.webp', // cuadrada, bajo "¡Te esperamos!"
    final: 'images/foto-4.webp', // cierre de la invitación
  },

  // Línea de tiempo; mismos íconos que en `ceremonias`.
  itinerario: [
    { hora: '8:00 PM', actividad: 'Llegada', icono: 'corona' },
    { hora: '8:30 PM', actividad: 'Vals', icono: 'vals' },
    { hora: '9:00 PM', actividad: 'Sesión de fotos', icono: 'camara' },
    { hora: '10:30 PM', actividad: 'Fiesta', icono: 'disco' },
    { hora: '2:00 AM', actividad: 'Despedida', icono: 'reloj' },
  ],

  dresscode: {
    // Deja `titulo` vacío para ocultar toda la sección.
    titulo: 'Etiqueta',
    nota: 'Con mucho cariño, les pedimos evitar el tono rosa pastel, ya que está reservado especialmente para la quinceañera.',
    paleta: [],
    fotos: photos('dresscode', 0),
  },

  // Sugerencia de regalos. `datos` son las líneas de la cuenta; `copiar` es
  // lo que copia el botón "Copiar cuenta" (vacío lo oculta). Sin `texto` la
  // sección desaparece.
  regalos: {
    texto: 'Tu presencia es mi mejor regalo. Si deseas tener un detalle conmigo, puedes hacerlo con una transferencia. ¡Gracias por cada detalle!',
    datos: ['Banco', 'Nombre y apellido', 'CLABE 000 000 0000000000 0'],
    copiar: '',
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
    titulo: 'Confirmar asistencia',
    nota: 'Por favor confirma tu asistencia antes del 1 de diciembre',
    // Con una sola opción se muestra un botón con este texto.
    boton: 'Confirmar aquí',
    // Código de país + número, sin "+", espacios ni guiones (ej. 523312345678).
    // Con 'whatsapp', déjalo vacío para ocultar la sección; con 'pases', es el
    // respaldo para quien abra la invitación sin su enlace personal.
    whatsapp: '',
    opciones: ['¡Hola! Confirmo mi asistencia a los XV años de Camila 🎉'],
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

  // Notas finales y despedida (en cursiva, antes de la foto enmarcada).
  notas: [
    'Con mucho cariño, esta celebración es para que adolescentes y adultos puedan compartir y disfrutar juntos.',
    'Tu presencia y alegría harán que esta noche sea inolvidable.',
  ],
  footer: '¡Te esperamos!',
}
