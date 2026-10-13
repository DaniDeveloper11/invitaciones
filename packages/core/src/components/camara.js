// Componente Alpine: cámara nativa del teléfono y selector de la galería.
//
// No sabe nada de la subida: entrega los archivos con el evento
// `fotos-elegidas` ({ archivos: File[] }) y quien lo escuche decide qué hacer.
// Cada sitio sólo maqueta los botones:
//
//   <div x-data="camara">
//     <button @click="tomar()">Tomar foto</button>
//     <button @click="elegir()">Elegir fotos</button>
//   </div>
export function camara() {
  return {
    /** Abre la app de cámara (cámara trasera). */
    tomar() {
      this.abrir({ capture: true })
    },

    /** Abre la galería para elegir una o varias fotos. */
    elegir() {
      this.abrir({ multiple: true })
    },

    abrir({ capture = false, multiple = false }) {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.multiple = multiple
      if (capture) input.capture = 'environment'
      input.hidden = true

      const limpiar = () => input.remove()
      input.addEventListener('cancel', limpiar)
      input.addEventListener('change', () => {
        // Algunos Android dejan `type` vacío; la validación real la hace la compresión.
        const archivos = [...input.files].filter((f) => !f.type || f.type.startsWith('image/'))
        if (archivos.length) this.$dispatch('fotos-elegidas', { archivos })
        limpiar()
      })

      // Safari en iOS sólo abre el selector si el input está en el documento.
      document.body.append(input)
      input.click()
    },
  }
}
