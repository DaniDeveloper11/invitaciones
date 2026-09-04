// Componente Alpine para la cuenta regresiva hacia la fecha del evento.
export function countdown(targetDate) {
  return {
    dias: 0,
    horas: 0,
    minutos: 0,
    segundos: 0,
    terminado: false,
    _interval: null,

    init() {
      this.tick()
      this._interval = setInterval(() => this.tick(), 1000)
      this.$el.addEventListener('alpine:destroy', () => clearInterval(this._interval))
    },

    tick() {
      const diff = new Date(targetDate).getTime() - Date.now()

      if (diff <= 0) {
        this.dias = 0
        this.horas = 0
        this.minutos = 0
        this.segundos = 0
        this.terminado = true
        clearInterval(this._interval)
        return
      }

      this.dias = Math.floor(diff / (1000 * 60 * 60 * 24))
      this.horas = Math.floor((diff / (1000 * 60 * 60)) % 24)
      this.minutos = Math.floor((diff / (1000 * 60)) % 60)
      this.segundos = Math.floor((diff / 1000) % 60)
    },

    /** '07' en vez de 7, para que la tipografía no salte. */
    pad(n) {
      return String(n).padStart(2, '0')
    },
  }
}
