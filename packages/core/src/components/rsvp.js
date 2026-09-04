// Confirmación de asistencia: cada opción abre WhatsApp con el mensaje ya escrito.
export function rsvp({ whatsapp = '', opciones = [], nota = '', titulo = '' } = {}) {
  return {
    titulo,
    nota,
    opciones,

    enviar(mensaje) {
      const numero = String(whatsapp).replace(/\D/g, '')
      if (!numero) return
      const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
      window.open(url, '_blank', 'noopener')
    },
  }
}
