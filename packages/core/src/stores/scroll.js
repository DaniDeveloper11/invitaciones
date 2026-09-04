// Store global con la posición de scroll (throttleada con rAF) para efectos de
// parallax. Se consume en la plantilla como `$store.scroll.y`.
export function registerScrollStore(Alpine) {
  Alpine.store('scroll', { y: 0 })

  let ticking = false
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        Alpine.store('scroll').y = window.scrollY
        ticking = false
      })
    },
    { passive: true },
  )
}
