import './style.css'
import { createInvitation } from '@invitaciones/core'
import event from './event.config.js'
import { reproductor, fechaGrande, calendario } from './componentes.js'

createInvitation(event, {
  setup(Alpine, event) {
    Alpine.data('reproductor', reproductor)
    Alpine.data('fechaGrande', () => fechaGrande(event))
    Alpine.data('calendario', () => calendario(event))
  },
})
