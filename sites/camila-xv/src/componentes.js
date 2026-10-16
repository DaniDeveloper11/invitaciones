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
