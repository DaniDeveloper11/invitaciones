/**
 * Carrusel de la galería con tira de miniaturas. La pista principal se
 * desliza con el dedo (scroll-snap) y avanza sola cada `intervalo` ms hasta
 * que el invitado la toca; la miniatura activa se resalta y se mantiene a la
 * vista en su tira.
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

    total() {
      return this.$refs.pista.querySelectorAll(':scope > button').length
    },

    /** Actualiza la foto activa según la posición del scroll. */
    alDeslizar() {
      const pista = this.$refs.pista
      this.activo = Math.round(pista.scrollLeft / pista.clientWidth)
    },

    ir(i) {
      const total = this.total()
      if (!total) return
      const destino = (i + total) % total
      const pista = this.$refs.pista
      pista.scrollTo({ left: destino * pista.clientWidth, behavior: 'smooth' })
    },

    /** Desplaza sólo la tira (no la página) para que se vea la miniatura. */
    centrarMiniatura(i) {
      const tira = this.$refs.tira
      const miniatura = tira?.querySelectorAll(':scope > button')[i]
      if (!miniatura) return
      const izquierda = miniatura.offsetLeft - (tira.clientWidth - miniatura.clientWidth) / 2
      tira.scrollTo({ left: izquierda, behavior: 'smooth' })
    },
  }
}
