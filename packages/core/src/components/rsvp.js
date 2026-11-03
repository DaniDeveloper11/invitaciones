// Confirmación de asistencia: cada opción abre WhatsApp con el mensaje ya escrito.
import { enlaceWhatsapp } from '../rsvp-mensajes.js'

export function rsvp({ whatsapp = '', opciones = [], nota = '', titulo = '' } = {}) {
  return {
    titulo,
    nota,
    opciones,

    enviar(mensaje) {
      const numero = String(whatsapp).replace(/\D/g, '')
      if (!numero) return
      window.open(enlaceWhatsapp(numero, mensaje), '_blank', 'noopener')
    },
  }
}
