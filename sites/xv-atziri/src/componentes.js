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

const svg = (trazos) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" class="h-full w-full">${trazos}</svg>`

/** Íconos de línea del dress code; se usan con `x-html="$icono('bota')"`. */
export const ICONOS = {
  sombrero: svg(
    '<path d="M2.5 14.5c1.5 2.5 17.5 2.5 19 0"/><path d="M6.5 15c-.3-4.5 1.3-8 3.2-8 .9 0 1.4.9 2.3.9s1.4-.9 2.3-.9c1.9 0 3.5 3.5 3.2 8"/><path d="M6.7 12.6c3.4.9 7.2.9 10.6 0"/>',
  ),
  saco: svg(
    '<path d="M8.5 3 4 5.5V21h16V5.5L15.5 3"/><path d="M8.5 3 12 9l3.5-6"/><path d="M8.5 3 7 9l2.5 1.5L12 9"/><path d="M15.5 3 17 9l-2.5 1.5L12 9"/><path d="M12 9v12"/>',
  ),
  monio: svg(
    '<path d="M10 10.5 3.5 7v10l6.5-3.5"/><path d="M14 10.5 20.5 7v10L14 13.5"/><rect x="10" y="10" width="4" height="4" rx="1"/>',
  ),
  camisa: svg(
    '<path d="M9 3 4 5.5 2.5 11l3 1V21h13v-9l3-1L20 5.5 15 3"/><path d="M9 3l3 3.5L15 3"/><path d="M12 6.5V21"/><path d="M12 10h.01M12 13.5h.01M12 17h.01"/>',
  ),
  bota: svg(
    '<path d="M8 3h6.5v9.5l4.6 2.4a2.2 2.2 0 0 1 1.2 2V20H7l-.6-3.2L8 14.5z"/><path d="M8 7h6.5"/><path d="M7 20v1.5h3.5V20"/>',
  ),
  vestido: svg(
    '<path d="M9.5 2.5 10 7l-4.5 14h13L14 7l.5-4.5"/><path d="M10 7c1.3.8 2.7.8 4 0"/><path d="M9 11.5h6"/>',
  ),
  joya: svg('<path d="M6.5 4h11L21 9l-9 11L3 9z"/><path d="M3 9h18"/><path d="M9.5 4 8 9l4 11 4-11-1.5-5"/>'),
  bolsa: svg(
    '<rect x="3" y="8.5" width="18" height="11" rx="1.5"/><path d="M3 12.5h18"/><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5"/><rect x="10.5" y="11.5" width="3" height="2.2" rx=".5"/>',
  ),
}
