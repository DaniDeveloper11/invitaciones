// Lectura de `fotosInvitados.habilitado` desde Node (vite.js, scripts/fotos-alta.mjs).
//
// event.config.js importa @invitaciones/core (Alpine, import.meta.env…), así
// que no se puede importar fuera de Vite: se lee como texto. Basta con que
// el bloque `fotosInvitados: { … }` contenga `habilitado: true`.
import { readFileSync } from 'node:fs'
import path from 'node:path'

export function fotosHabilitadas(dirSitio) {
  let config
  try {
    config = readFileSync(path.join(dirSitio, 'src', 'event.config.js'), 'utf8')
  } catch {
    return false
  }
  return /fotosInvitados\s*:\s*\{[^}]*?\bhabilitado\s*:\s*true\b/.test(config)
}
