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
    // Foto de portada a pantalla completa: public/images/hero.webp (vertical, ~1450x1920px)
    imagen: 'images/hero.webp',
  },

  cuentaRegresiva: {
    eyebrow: 'Faltan',
  },

  // Fecha y hora del evento en formato ISO (respeta la zona horaria local).
  // Los textos de fecha y hora se calculan solos; si quieres otro texto,
  // llena `fechaTexto` y `horaTexto`.
  fecha: '2026-12-19T19:00:00',
  fechaTexto: '19 de Diciembre del 2026',
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
       "grupos": [
      {
        "titulo": "",
        "nombres": [
          "Leonel Alvarez",
          "Elena Perez"
        ]
      },
      {
        "titulo": "Mis padrinos",
        "nombres": [
          "Irma Martinez"
        ]
      },
      {
        "titulo": "Mis padrinos",
        "nombres": [
          "Cesar Villaseñor"
        ]
      }
    ],
    cierre: 'A festejar mis',
  },

  // Misa y recepción. `icono`: iglesia, copas, corona, vals, camara, disco o
  // reloj. Sin `mapsUrl` no aparece el botón "Ver ubicación".
 "ceremonias": [
    {
      "icono": "iglesia",
      "titulo": "Misa de Agradecimiento",
      "hora": "5:00 PM",
      "lugar": "Parroquia San Francisco de Asis",
      "direccion": "Alvaro Obregon no. 1",
      "mapsUrl": "https://maps.app.goo.gl/3yh22G5FuEMYP6z8A"
    },
    {
      "icono": "copas",
      "titulo": "Recepción",
      "hora": "7:00 PM",
      "lugar": "Kinta E Reinas",
      "direccion": "",
      "mapsUrl": ""
    }
  ],

  // Fotos del diseño (verticales, ~1000x1250px). Deja una vacía para quitarla.
  fotos: {
    regalos: 'images/gallery/8.webp', // antes de la sugerencia de regalos
    marco: 'images/gallery/2.webp', // cuadrada, bajo "¡Te esperamos!"
    final: 'images/gallery/4.webp', // cierre de la invitación
  },

  // Línea de tiempo. Íconos (src/componentes.js): iglesia, copas, cena,
  // corona, vals, camara, disco, reloj.
  itinerario: [
    { hora: '5:00 PM', actividad: 'Misa', icono: 'iglesia' },
    { hora: '7:00 PM', actividad: 'Recepción', icono: 'copas' },
    { hora: '8:00 PM', actividad: 'Cena', icono: 'cena' },
    { hora: '9:00 PM', actividad: 'Vals', icono: 'vals' },
    { hora: '10:00 PM', actividad: 'Baile', icono: 'disco' },
  ],

  // Hoteles cercanos para invitados de fuera. Cada botón (Llamar, Ubicación,
  // Reservar) aparece sólo si llenas `telefono`, `mapsUrl` o `url`.
  // Con `lista: []` la sección desaparece.
  hoteles: {
    nota: 'Para nuestros invitados que vienen de fuera, te recomendamos estas opciones cerca del salón.',
    lista: [
      {
        nombre: 'Nombre del hotel',
        direccion: 'Calle y número, Ciudad',
        distancia: 'A 5 minutos del salón',
        telefono: '',
        codigo: '',
        mapsUrl: 'https://maps.google.com/',
        url: '',
      },
      {
        nombre: 'Nombre del hotel',
        direccion: 'Calle y número, Ciudad',
        distancia: 'A 10 minutos del salón',
        telefono: '',
        codigo: '',
        mapsUrl: 'https://maps.google.com/',
        url: '',
      },
    ],
  },

  dresscode: {
    // Deja `titulo` vacío para ocultar toda la sección. La ilustración es
    // public/images/dresscode/pareja.webp.
    titulo: 'Formal',
    intro: 'Queremos que luzcan espectaculares y cómodos para disfrutar juntos de esta celebración.',
    // ellos: ['Traje formal (opcional)', 'Camisa de vestir', 'Corbata(opcional)', 'Zapatos de vestir', 'Accesorios a gusto'],
    // ellas: ['Vestido largo', 'Accesorios a gusto para complementar el look'],
    // Colores a evitar: nombre y color.
    evitar: [


      { nombre: 'Rosa pastel', color: '#f2b8c6' },
    ],
    nota: 'El rosa pastel está reservado especialmente para la quinceañera.',
    // Fotos de ejemplo del botón "Ver ejemplos": public/images/dresscode/1.jpg,
    // 2.jpg, … (verticales). Con 0 el botón se oculta.
    boton: 'Ver ejemplos',
    fotos: photos('dresscode', 4, 'jpg'),
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
    // Carrusel de fotos destacadas (después de misa y recepción). Fotos
    // verticales 4:5 en public/images/gallery/1.webp, 2.webp, …; cambia el
    // número al total de fotos. Con 0 la sección desaparece.
    fotos: photos('gallery', 34),
  },

  rsvp: {
    // 'whatsapp': cada opción abre WhatsApp con el mensaje ya escrito.
    // 'pases': cada invitado confirma con su enlace personal marcando quién
    //          asiste. La lista se carga con `npm run rsvp:alta` (ver README).
    modo: 'pases',
    // Sólo con pases: fecha límite para confirmar (hasta el final de ese día).
    cierra: '2026-12-01',
    titulo: 'Confirmar asistencia',
    nota: 'Por favor confirma tu asistencia antes del 1 de diciembre',
    // Con una sola opción se muestra un botón con este texto.
    boton: 'Confirmar aquí',
    // Código de país + número, sin "+", espacios ni guiones (ej. 523312345678).
    // Con 'whatsapp', déjalo vacío para ocultar la sección; con 'pases', es el
    // respaldo para quien abra la invitación sin su enlace personal.
    whatsapp: '18157900905',
   // opciones: ['¡Hola! Confirmo mi asistencia a los XV años de Camila 🎉'],
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
     boton: 'Comparte tus fotos',
     titulo: 'Nuestro álbum',
     nota: 'Toma o elige fotos del evento: se compartirán con los festejados y con los demás invitados.',
  },

  // Notas finales y despedida (en cursiva, antes de la foto enmarcada).
  notas: [
    'Con mucho cariño, esta celebración es para que adolescentes y adultos puedan compartir y disfrutar juntos.',
    'Tu presencia y alegría harán que esta noche sea inolvidable.',
  ],
  footer: '¡Te esperamos!',
}
