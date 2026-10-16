// Lectura de event.config.js desde Node (vite.js y los scripts de la raíz):
//   fotosHabilitadas → `fotosInvitados.habilitado: true` (página /fotos/)
//   rsvpConPases     → `rsvp.modo: 'pases'`               (página /rsvp/)
//
// event.config.js importa @invitaciones/core (Alpine, import.meta.env…), así
// que no se puede importar fuera de Vite: se lee como texto. Basta con que el
// bloque correspondiente (`fotosInvitados: { … }`, `rsvp: { … }`) contenga la
// opción.
import { readFileSync } from 'node:fs'
import path from 'node:path'

function leerConfig(dirSitio) {
  try {
    return readFileSync(path.join(dirSitio, 'src', 'event.config.js'), 'utf8')
  } catch {
    return ''
  }
}

export function fotosHabilitadas(dirSitio) {
  return /fotosInvitados\s*:\s*\{[^}]*?\bhabilitado\s*:\s*true\b/.test(leerConfig(dirSitio))
}

export function rsvpConPases(dirSitio) {
  return /\brsvp\s*:\s*\{[^}]*?\bmodo\s*:\s*['"]pases['"]/.test(leerConfig(dirSitio))
}
