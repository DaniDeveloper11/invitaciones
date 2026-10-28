// Componentes propios de esta invitación (se registran en main.js).

const MESES_CAP = (fecha, locale) => {
  const mes = fecha.toLocaleDateString(locale, { month: 'long' })
  return mes.charAt(0).toUpperCase() + mes.slice(1)
}

/**
 * Reproductor "Dale play": controla el mismo <audio id="musica"> que el botón
 * flotante, así nunca suenan dos copias de la canción.
 */
export function reproductor() {
  return {
    playing: false,
    progreso: 0,
    repetir: true,
    _audio: null,

    init() {
      this.$nextTick(() => {
        const audio = document.getElementById('musica')
        if (!audio) return
        this._audio = audio
        this.playing = !audio.paused
        audio.addEventListener('play', () => (this.playing = true))
        audio.addEventListener('pause', () => (this.playing = false))
        audio.addEventListener('timeupdate', () => {
          this.progreso = audio.duration ? audio.currentTime / audio.duration : 0
        })
      })
    },

    toggle() {
      if (!this._audio) return
      this._audio.paused ? this._audio.play().catch(() => {}) : this._audio.pause()
    },

    /** Sólo hay una canción: anterior y siguiente vuelven al inicio. */
    reiniciar() {
      if (!this._audio) return
      this._audio.currentTime = 0
      this._audio.play().catch(() => {})
    },

    alternarRepetir() {
      this.repetir = !this.repetir
      if (this._audio) this._audio.loop = this.repetir
    },

    /** Clic en la barra: salta a esa parte de la canción. */
    buscar(e) {
      const a = this._audio
      if (!a?.duration) return
      const r = e.currentTarget.getBoundingClientRect()
      a.currentTime = ((e.clientX - r.left) / r.width) * a.duration
    },
  }
}

/** Partes de la fecha para el bloque "Marzo / SÁBADO · 14 · 2026". */
export function fechaGrande(event) {
  const f = new Date(event.fecha)
  return {
    mes: MESES_CAP(f, event.locale),
    diaSemana: f.toLocaleDateString(event.locale, { weekday: 'long' }),
    dia: f.getDate(),
    anio: f.getFullYear(),
  }
}

/** Calendario del mes del evento, con semanas de lunes a domingo. */
export function calendario(event) {
  const f = new Date(event.fecha)
  const primero = new Date(f.getFullYear(), f.getMonth(), 1)
  const diasDelMes = new Date(f.getFullYear(), f.getMonth() + 1, 0).getDate()
  // getDay(): 0 = domingo. Lo pasamos a 0 = lunes.
  const huecos = (primero.getDay() + 6) % 7
  return {
    mes: MESES_CAP(f, event.locale),
    diaEvento: f.getDate(),
    encabezados: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    celdas: [
      ...Array.from({ length: huecos }, (_, i) => ({ id: `h${i}`, dia: null })),
      ...Array.from({ length: diasDelMes }, (_, i) => ({ id: `d${i + 1}`, dia: i + 1 })),
    ],
  }
}

/**
 * Íconos de línea para ceremonias e itinerario. Se usan con
 * `x-html="$icono('iglesia')"`; heredan el color del texto (currentColor).
 */
const svg = (cuerpo, relleno = false) =>
  `<svg viewBox="0 0 48 48" class="h-full w-full" fill="${relleno ? 'currentColor' : 'none'}" stroke="${relleno ? 'none' : 'currentColor'}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${cuerpo}</svg>`

export const ICONOS = {
  iglesia: svg(
    '<path d="M24 4v8M20.5 7.5h7"/><path d="M12 22 24 12l12 10"/><path d="M14 20v22h20V20"/><path d="M8 42h32"/><path d="M21 42v-8a3 3 0 0 1 6 0v8"/><path d="M19 25h2v4h-2zM27 25h2v4h-2z"/>',
  ),
  copas: svg(
    '<path d="M11 8h10l-1.5 11a3.5 3.5 0 0 1-7 0z" transform="rotate(-14 16 14)"/><path d="M27 8h10l-1.5 11a3.5 3.5 0 0 1-7 0z" transform="rotate(14 32 14)"/><path d="M17.5 23 20 38M30.5 23 28 38M15 39h9M24 39h9"/><path d="M24 2v4M19 4l1.5 2.5M29 4l-1.5 2.5"/>',
  ),
  corona: svg(
    '<path d="M8 34c10-2.5 22-2.5 32 0"/><path d="M8.5 33 11 21l6 6 3.5-10L24 9l3.5 8L31 27l6-6 2.5 12"/><circle cx="24" cy="8" r="1.5"/><circle cx="11" cy="20" r="1.2"/><circle cx="37" cy="20" r="1.2"/>',
  ),
  vals: svg(
    '<circle cx="16" cy="8" r="3.2"/><path d="M16 11.5l1 8.5"/><path d="M14.5 20h5c2 7 4.5 14 7.5 22-6.5 1.5-13 1.5-19.5 0 2.5-8 5-15 7-22z"/><path d="M16.5 14l7.5-3.5 8-.5"/><circle cx="32" cy="7" r="3.2"/><path d="M32 10.5v14M32 24.5l-2.5 17.5M32 24.5l3 17.5M32 15l-12 5.5"/>',
  ),
  cena: svg(
    '<circle cx="24" cy="25" r="12"/><circle cx="24" cy="25" r="7.5"/><path d="M6 9v7a3 3 0 0 0 3 3v22M9 9v7M12 9v7a3 3 0 0 1-3 3"/><path d="M39 41V9c3 2.5 4 8 3.5 14H39"/>',
  ),
  camara: svg(
    '<rect x="5" y="13" width="38" height="26" rx="3"/><path d="M16 13l3-5h10l3 5"/><circle cx="24" cy="26" r="7"/><circle cx="24" cy="26" r="3"/><path d="M37 18h2"/>',
  ),
  disco: svg(
    '<path d="M24 2v6"/><circle cx="24" cy="25" r="16"/><path d="M8 25h32M10 17h28M10 33h28M24 9v32"/><path d="M24 9c-6 4.5-6 27.5 0 32M24 9c6 4.5 6 27.5 0 32"/>',
  ),
  reloj: svg('<circle cx="24" cy="24" r="18"/><path d="M24 12v12l8 5"/>'),
  traje: svg(
    '<path d="M17 4h14l6 4 4 30-6 2V46H13v-6l-6-2 4-30z"/><path d="M17 4l7 10 7-10" fill="#fff" opacity=".9"/><path d="M22 9h4l-1 3h-2z" fill="#fff"/><path d="M24 14 21 38h6z" opacity=".35" fill="#fff"/>',
    true,
  ),
  vestido: svg(
    '<path d="M18 3c1 4 1 7 0 10l-3 4c2 2 3 3 4 5L8 44h32L29 22c1-2 2-3 4-5l-3-4c-1-3-1-6 0-10l-2 1c0 3-2 6-4 6s-4-3-4-6z"/>',
    true,
  ),
  regalo: svg(
    '<rect x="6" y="18" width="36" height="8" rx="1"/><path d="M9 26h30v18H9z"/><path d="M24 18c-3-8-12-11-12-5 0 4 7 5 12 5zM24 18c3-8 12-11 12-5 0 4-7 5-12 5z"/><path d="M24 18v26M6 26h36" stroke="#f7f3ee" stroke-width="2.4"/>',
    true,
  ),
  tarjeta: svg(
    '<rect x="4" y="10" width="40" height="28" rx="2"/><path d="M4 30h40M18 10v28"/><path d="M18 22c-4-6-10-5-8-1s8 1 8 1zM18 22c4-6 10-5 8-1s-8 1-8 1z"/><path d="M14 30l4-8 4 8"/>',
  ),
  hotel: svg(
    '<path d="M6 40V14M6 30h36v10M6 24h10a4 4 0 0 1 4 4v2"/><circle cx="12" cy="20" r="3"/><path d="M20 30v-6h16a6 6 0 0 1 6 6"/><path d="M4 40h4M40 40h4"/>',
  ),
  confirmar: svg(
    '<rect x="6" y="9" width="36" height="34" rx="3"/><path d="M6 17h36M15 5v8M33 5v8"/><path d="M24 37s-8-4.5-8-9.5a4 4 0 0 1 8-1.5 4 4 0 0 1 8 1.5c0 5-8 9.5-8 9.5z"/>',
  ),
}

/**
 * Carrusel deslizable (scroll-snap) para la galería de fotos destacadas.
 * Avanza solo cada `intervalo` ms hasta que el invitado lo toca.
 */
export function carrusel(intervalo = 5000) {
  return {
    activo: 0,
    _timer: null,

    init() {
      this._timer = setInterval(() => this.ir(this.activo + 1), intervalo)
      this.$el.addEventListener('alpine:destroy', () => this.detener())
      this.$watch('activo', (i) => this.centrarMiniatura(i))
    },

    detener() {
      clearInterval(this._timer)
    },

    /** Actualiza el punto activo según la posición del scroll. */
    alDeslizar() {
      const pista = this.$refs.pista
      this.activo = Math.round(pista.scrollLeft / pista.clientWidth)
    },

    ir(i) {
      const pista = this.$refs.pista
      const total = pista.querySelectorAll(":scope > button").length
      if (!total) return
      const destino = (i + total) % total
      pista.scrollTo({ left: destino * pista.clientWidth, behavior: 'smooth' })
    },

    /** Desliza la tira de miniaturas para dejar la activa al centro. */
    centrarMiniatura(i) {
      const tira = this.$refs.miniaturas
      const miniatura = tira?.querySelectorAll(':scope > button')[i]
      if (!miniatura) return
      // scrollTo en la tira (no scrollIntoView) para no mover la página.
      const left = miniatura.offsetLeft - (tira.clientWidth - miniatura.offsetWidth) / 2
      tira.scrollTo({ left, behavior: 'smooth' })
    },
  }
}

/**
 * Apertura tipo sobre: cubre la invitación hasta que el invitado lo toca.
 * Al abrir avisa con el evento `sobre-abierto` (la portada empieza su
 * animación) y arranca la música, que ya puede sonar tras el toque.
 */
export function sobre() {
  return {
    abriendo: false,
    entrando: false,
    abierto: false,

    init() {
      document.documentElement.style.overflow = 'hidden'
      window.scrollTo(0, 0)
    },

    abrir() {
      if (this.abriendo) return
      this.abriendo = true
      document.getElementById('musica')?.play().catch(() => {})
      // Con las puertas casi abiertas, la carta crece y la pantalla se desvanece.
      setTimeout(() => (this.entrando = true), 1000)
      setTimeout(() => {
        this.abierto = true
        document.documentElement.style.overflow = ''
        window.dispatchEvent(new CustomEvent('sobre-abierto'))
      }, 1500)
    },
  }
}

/**
 * Directiva x-parallax="0.4": al hacer scroll el elemento baja a esa fracción
 * de la velocidad de la página, así parece quedarse atrás. Se apaga si el
 * sistema pide reducir movimiento.
 */
export function registrarParallax(Alpine) {
  Alpine.directive('parallax', (el, { expression }, { cleanup }) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const velocidad = Number(expression) || 0.4
    const contenedor = el.parentElement
    let pendiente = false

    const mover = () => {
      pendiente = false
      const { top, bottom } = contenedor.getBoundingClientRect()
      if (bottom < 0 || top > window.innerHeight) return
      el.style.transform = `translate3d(0, ${Math.max(-top, 0) * velocidad}px, 0)`
    }
    const alHacerScroll = () => {
      if (!pendiente) {
        pendiente = true
        requestAnimationFrame(mover)
      }
    }

    el.style.willChange = 'transform'
    window.addEventListener('scroll', alHacerScroll, { passive: true })
    mover()
    cleanup(() => window.removeEventListener('scroll', alHacerScroll))
  })
}
