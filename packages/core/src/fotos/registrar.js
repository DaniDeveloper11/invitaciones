// Componentes de la página /fotos/. Se cargan aparte (import dinámico desde
// createInvitation) para que no pesen en las invitaciones que no los usan.
import { camara } from '../components/camara.js'
import { fotosInvitados } from '../components/fotos-invitados.js'
import { fotosAdmin, tokenAdmin } from '../components/fotos-admin.js'

export function registrarFotos(Alpine, event) {
  Alpine.data('camara', camara)
  Alpine.data('fotosInvitados', () => fotosInvitados(event.fotosInvitados))
  Alpine.data('fotosAdmin', () => fotosAdmin(event.fotosInvitados))
  // true si se abrió con el enlace de los festejados (#admin=…).
  Alpine.store('esAdmin', Boolean(tokenAdmin()))
}
