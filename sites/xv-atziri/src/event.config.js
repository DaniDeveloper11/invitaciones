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
    eyebrow: 'Código de Vestimenta',
    titulo: 'Vaquero Formal',
    subtitulo: 'Para una noche especial',
    // Prendas por grupo. `icono`: sombrero, saco, monio, camisa, bota,
    // vestido, joya o bolsa (definidos en src/componentes.js).
    grupos: [
      {
        titulo: 'Ellos',
        prendas: [
          { icono: 'sombrero', texto: 'Sombrero o tejana formal' },
          { icono: 'saco', texto: 'Saco, americana o tejana de gala' },
          { icono: 'monio', texto: 'Moño o corbatín vaquero (bolo tie)' },
          { icono: 'camisa', texto: 'Camisa de vestir formal' },
          { icono: 'bota', texto: 'Botas vaqueras limpias y formales' },
        ],
      },
      {
        titulo: 'Ellas',
        prendas: [
          { icono: 'sombrero', texto: 'Sombrero vaquero formal (opcional)' },
          { icono: 'vestido', texto: 'Vestido largo de gala en telas finas' },
          { icono: 'bota', texto: 'Botas vaqueras de gala o calzado formal' },
          { icono: 'joya', texto: 'Accesorios elegantes y discretos' },
          { icono: 'bolsa', texto: 'Bolsa de mano pequeña o clutch' },
        ],
      },
    ],
    // Tonos reservados para la quinceañera (se muestran tachados).
    // Con `colores: []` el bloque desaparece.
    prohibidos: {
      titulo: 'Colores prohibidos',
      colores: [
        { nombre: 'Aqua y azul', tonos: ['#4fc3c3', '#3466b8'] },
        { nombre: 'Rosa', tonos: ['#f5a9c8', '#e2559a'] },
      ],
      nota: 'Agradecemos evitar estos tonos para que la quinceañera destaque en su gran noche.',
    },
    boton: 'Ver ejemplos',
    // Ejemplos verticales en public/images/dresscode/1.webp, 2.webp, ...
    // (cambia el número al total). Con 0 el botón desaparece.
    fotos: photos('dresscode', 4),
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
