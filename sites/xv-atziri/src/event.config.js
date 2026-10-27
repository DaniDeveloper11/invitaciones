import { photos } from '@invitaciones/core'

/**
 * Datos de la invitación. Este es el único archivo que necesitas editar
 * para una invitación nueva; index.html sólo se toca si cambias el diseño.
 */
export default {
  // Título de la pestaña del navegador.
  titulo: 'Mis XV Atziri',

  hero: {
    eyebrow: 'Mis XV Años',
    titulo: 'Atziri',
    // Apellidos bajo el nombre. Déjalo vacío para ocultarlo.
    subtitulo: 'Apellido Apellido',
    // Foto vertical en el marco de la portada: public/images/hero.webp
    // (~900x1200px). Sin foto, el marco desaparece.
    imagen: 'images/hero.webp',
  },

  cuentaRegresiva: {
    eyebrow: 'Faltan solo...',
  },

  // Fecha y hora del evento en formato ISO (respeta la zona horaria local).
  // El texto de la portada ("Sábado · 31 de diciembre · 2026") se calcula
  // solo; si quieres otro, llena `fechaPortada`.
  fecha: '2026-12-31T20:00:00',
  fechaPortada: '',

  mensaje: {
    // Frase bajo la fecha de la portada. Déjala vacía para ocultarla.
    texto: '"Con el encanto del rancho, la magia de las estrellas y la ilusión de mis sueños, celebro con inmensa alegría mis quince primaveras."',
  },

  // Padres y padrinos: un bloque por grupo, separados por un corazón.
  // Con `grupos: []` la sección desaparece.
  familia: {
    grupos: [
      { eyebrow: 'Con la bendición de', titulo: 'Mis Padres', nombres: ['Nombre del papá', 'Nombre de la mamá'] },
      { eyebrow: 'Y con el cariño de', titulo: 'Mis Padrinos', nombres: ['Nombre del padrino', 'Nombre de la madrina'] },
    ],
  },

  // Misa y recepción. `icono` es un nombre de Material Symbols (church,
  // wine_bar, celebration…); si usas uno nuevo, agrégalo también a la lista
  // `icon_names` del <link> de Material Symbols en index.html.
  // Sin `mapsUrl` no aparece el botón.
  ceremonias: [
    {
      icono: 'church',
      eyebrow: 'Solemne Misa',
      titulo: 'Ceremonia Religiosa',
      hora: '5:00 P.M.',
      lugar: 'Nombre de la parroquia',
      direccion: 'Calle y número, Ciudad',
      mapsUrl: 'https://maps.google.com/',
      boton: 'Ver ubicación en mapa',
    },
    {
      icono: 'wine_bar',
      eyebrow: 'Fiesta y Brindis',
      titulo: 'Recepción',
      hora: '8:00 P.M.',
      lugar: 'Nombre de la hacienda',
      direccion: 'Calle y número, Ciudad',
      mapsUrl: 'https://maps.google.com/',
      boton: 'Ver mapa de la hacienda',
    },
  ],

  dresscode: {
    // Deja `titulo` vacío para ocultar toda la sección.
    eyebrow: 'Etiqueta Sugerida',
    titulo: 'Vaquero Formal / Western Chic',
    nota: 'Botas, sombrero, vestidos de gala y vestimenta elegante campestre.',
    // Tonos sugeridos para los invitados.
    paleta: ['#8b5a2b', '#d7c9b8', '#1c1c19'],
    // Tono reservado para la quinceañera (se muestra tachado). Vacío lo oculta.
    reservado: {
      color: '#75bfb2',
      nombre: 'Verde Menta / Aqua',
    },
    // Ejemplos en public/images/dresscode/1.webp, 2.webp, ...
    fotos: photos('dresscode', 0),
  },

  // Lluvia de sobres / regalos. Sin `texto` la sección desaparece.
  regalos: {
    titulo: 'Lluvia de Sobres',
    texto: 'El regalo más valioso para mí es tu grata presencia. Si deseas hacerme un detalle, dispondremos de un buzón en la recepción para muestras de afecto en sobre.',
    cierre: '¡Muchísimas Gracias!',
  },

  galeria: {
    eyebrow: 'Sesión Fotográfica',
    titulo: 'Galería de Recuerdos',
    nota: 'Momentos que atesoramos con amor en el corazón.',
    // Fotos verticales 4:5 en public/images/gallery/1.webp, 2.webp, ...
    // (cambia el número al total). Con 0 la sección desaparece.
    fotos: photos('gallery', 4),
  },

  rsvp: {
    // 'whatsapp': cada opción abre WhatsApp con el mensaje ya escrito.
    // 'pases': cada invitado confirma con su enlace personal marcando quién
    //          asiste. La lista se carga con `npm run rsvp:alta` (ver README).
    //          Arriba del formulario se muestra "Pase personal: N lugares".
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

  // Despedida: `footer` es el título; `despedida.firma` vacía la oculta.
  footer: '¡Te Esperamos!',
  despedida: {
    texto: 'Será un honor compartir el inicio de esta nueva etapa contigo y nuestra amada familia.',
    firma: 'Familia Apellido Apellido',
  },
}
