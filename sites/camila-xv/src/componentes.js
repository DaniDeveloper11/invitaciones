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
    '<circle cx="18" cy="8" r="3.2"/><path d="M18 11.5c-2 1-3 3.5-3 6l-1 6 5-1 3-6 5-4"/><path d="M15 23 8 42h20l-6-17"/><circle cx="31" cy="7" r="3.2"/><path d="M31 10.5v12M27 14l4 1.5 2-1M31 22.5l-2 19.5M31 22.5l3 19.5"/>',
  ),
  camara: svg(
    '<rect x="5" y="13" width="38" height="26" rx="3"/><path d="M16 13l3-5h10l3 5"/><circle cx="24" cy="26" r="7"/><circle cx="24" cy="26" r="3"/><path d="M37 18h2"/>',
  ),
  disco: svg(
    '<path d="M24 2v6"/><circle cx="24" cy="25" r="16"/><path d="M8 25h32M10 17h28M10 33h28M24 9v32"/><path d="M24 9c-6 4.5-6 27.5 0 32M24 9c6 4.5 6 27.5 0 32"/>',
  ),
  reloj: svg('<circle cx="24" cy="24" r="18"/><path d="M24 12v12l8 5"/>'),
}
