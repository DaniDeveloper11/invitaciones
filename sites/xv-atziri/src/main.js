import './style.css'
import { createInvitation } from '@invitaciones/core'
import event from './event.config.js'
import { carrusel, ICONOS } from './componentes.js'

createInvitation(event, {
  setup(Alpine, event) {
    Alpine.data('carrusel', carrusel)
    Alpine.magic('icono', () => (nombre) => ICONOS[nombre] || '')

    // Fecha de la portada: "Sábado · 31 de diciembre · 2026".
    if (!event.fechaPortada) {
      const fecha = new Date(event.fecha)
      const parte = (opciones) => new Intl.DateTimeFormat(event.locale, opciones).format(fecha)
      event.fechaPortada = Number.isNaN(fecha.getTime())
        ? event.fechaTexto
        : `${parte({ weekday: 'long' })} · ${parte({ day: 'numeric', month: 'long' })} · ${parte({ year: 'numeric' })}`
    }
  },
})
