import Alpine from 'alpinejs'
import { normalizeEvent } from './event.js'
import { countdown } from './components/countdown.js'
import { gallery } from './components/gallery.js'
import { audioPlayer } from './components/audio-player.js'
import { rsvp } from './components/rsvp.js'
import { registerReveal } from './directives/reveal.js'
import { registerScrollStore } from './stores/scroll.js'

export { asset, photos, normalizeEvent } from './event.js'
export { countdown, gallery, audioPlayer, rsvp, registerReveal, registerScrollStore }
export { Alpine }

/**
 * Arranca una invitación: registra los componentes, deja el evento disponible
 * como `$store.event` en la plantilla e inicia Alpine.
 *
 * Uso en sites/<slug>/src/main.js:
 *   import './style.css'
 *   import { createInvitation } from '@invitaciones/core'
 *   import event from './event.config.js'
 *   createInvitation(event)
 *
 * @param {object} config          Configuración del evento (event.config.js).
 * @param {object} [opciones]
 * @param {(Alpine: any, event: object) => void} [opciones.setup]
 *        Gancho para registrar componentes propios de un sitio antes del start.
 */
export function createInvitation(config, { setup } = {}) {
  const event = normalizeEvent(config)

  window.Alpine = Alpine
  Alpine.store('event', event)

  Alpine.data('countdown', () => countdown(event.fecha))
  Alpine.data('gallery', () => gallery(event.galeria.fotos))
  Alpine.data('dresscode', () => ({
    ...event.dresscode,
    ...gallery(event.dresscode.fotos),
  }))
  Alpine.data('lugar', () => ({ ...event.lugar }))
  Alpine.data('audioPlayer', () => audioPlayer(event.musica))
  Alpine.data('rsvp', () => rsvp(event.rsvp))

  registerReveal(Alpine)
  registerScrollStore(Alpine)

  if (document.title === '' || document.title === 'Invitación') {
    document.title = event.titulo
  }

  setup?.(Alpine, event)

  // La página /fotos/ (<body data-pagina="fotos">) carga sus componentes aparte.
  if (document.body.dataset.pagina === 'fotos') {
    import('./fotos/registrar.js')
      .then(({ registrarFotos }) => registrarFotos(Alpine, event))
      .catch((err) => console.error('[invitación] No se pudieron cargar las fotos', err))
      .finally(() => Alpine.start())
  } else {
    Alpine.start()
  }

  return { Alpine, event }
}
