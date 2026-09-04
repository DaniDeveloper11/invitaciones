// Directiva x-reveal: anima un elemento cuando entra en pantalla al hacer scroll.
// Modificadores opcionales:
//   .blur   → además desenfoca el elemento y lo enfoca al revelarse
//   .scale  → además lo escala desde 92% a 100%
//   .lg     → recorrido más largo (más dramático)
//   .delay-300, .delay-500, etc. → retrasa el inicio (ms)
export function registerReveal(Alpine) {
  Alpine.directive('reveal', (el, { modifiers }) => {
    const distance = modifiers.includes('lg') ? '4rem' : '2.5rem'
    const delayMod = modifiers.find((m) => m.startsWith('delay-'))
    const delay = delayMod ? Number(delayMod.split('-')[1]) : 0

    const hidden = [`translateY(${distance})`]
    if (modifiers.includes('scale')) hidden.push('scale(0.92)')

    el.style.opacity = '0'
    el.style.transform = hidden.join(' ')
    el.style.filter = modifiers.includes('blur') ? 'blur(14px)' : 'none'
    el.style.transition = `opacity 1100ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 1100ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, filter 1100ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`
    el.style.willChange = 'opacity, transform, filter'

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.style.opacity = '1'
            el.style.transform = 'translateY(0) scale(1)'
            el.style.filter = 'blur(0px)'
            observer.unobserve(el)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    )

    observer.observe(el)
  })
}
