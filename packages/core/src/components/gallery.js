// Componente Alpine: cuadrícula + visor a pantalla completa (lightbox).
export function gallery(photos = []) {
  return {
    photos,
    open: false,
    index: 0,

    show(i) {
      if (!this.photos.length) return
      this.index = i
      this.open = true
      document.body.style.overflow = 'hidden'
    },

    close() {
      this.open = false
      document.body.style.overflow = ''
    },

    next() {
      this.index = (this.index + 1) % this.photos.length
    },

    prev() {
      this.index = (this.index - 1 + this.photos.length) % this.photos.length
    },
  }
}
