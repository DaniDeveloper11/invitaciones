// Confirmación de asistencia con pases (rsvp.modo: 'pases').
//
// Cada pase llega con su enlace personal (/?i=<código>). La invitación guarda el
// código, pide el pase a la API y muestra a sus personas como casillas: el
// invitado marca quién asiste (y escribe el nombre en los lugares libres).
// Puede cambiar su respuesta hasta la fecha límite.
import { crearApi, almacen } from '../fotos/api.js'

export function rsvpPases(config) {
  const claveCodigo = `rsvp:pase:${config.slug}`
  let api

  return {
    estado: 'cargando', // cargando · sin_enlace · listo · error
    error: '',
    codigo: '',
    pase: null,
    abierta: true,
    cierraEn: null,
    // Copia editable de las personas: { id, nombre, nino, libre, asiste }.
    personas: [],
    mensaje: '',
    editando: false,
    enviando: false,

    init() {
      api = crearApi(config, () => ({ 'X-Pase': this.codigo }))
      const url = new URL(location.href)
      const enUrl = url.searchParams.get('i')
      if (enUrl) {
        almacen.guardar(claveCodigo, enUrl.trim().toUpperCase())
        // Fuera de la barra de direcciones: si comparten la página, no va su código.
        url.searchParams.delete('i')
        history.replaceState(history.state, '', url)
      }
      this.codigo = almacen.leer(claveCodigo)
      if (this.codigo) this.cargar()
      else this.estado = 'sin_enlace'
    },

    async cargar() {
      this.estado = 'cargando'
      this.error = ''
      try {
        this.aplicar(await api.pedir('/rsvp'))
        this.estado = 'listo'
      } catch (e) {
        this.manejarError(e)
      }
    },

    /** Copia la respuesta de la API al estado del formulario. */
    aplicar({ rsvp, cierra_en: cierraEn, pase }) {
      this.pase = pase
      this.abierta = rsvp === 'abierta'
      this.cierraEn = cierraEn
      this.mensaje = pase.mensaje ?? ''
      const respondio = Boolean(pase.respondido_en)
      // La primera vez, las personas con nombre vienen marcadas y los lugares libres no.
      this.personas = pase.personas.map((p) => ({
        ...p,
        nombre: p.nombre ?? '',
        asiste: respondio ? Boolean(p.asiste) : !p.libre,
      }))
      this.editando = !respondio && this.abierta
    },

    manejarError(e) {
      if (e.codigo === 'sin_acceso') {
        almacen.guardar(claveCodigo, '')
        this.codigo = ''
        this.estado = 'sin_enlace'
        this.error = 'Ese enlace de invitación no es válido.'
      } else if (this.pase) {
        // Ya había pase cargado: se queda el formulario y sólo se avisa.
        this.estado = 'listo'
        this.error = e.message
      } else {
        this.estado = 'error'
        this.error = e.message
      }
    },

    // ── Formulario ────────────────────────────────────────────────────────

    get respondio() {
      return Boolean(this.pase?.respondido_en)
    },

    get asistentes() {
      return this.personas.filter((p) => p.asiste)
    },

    get faltaNombre() {
      return this.personas.some((p) => p.libre && p.asiste && !p.nombre.trim())
    },

    /** "Luis Pérez, María López y Sofía Pérez" (en el resumen y el botón). */
    lista(personas) {
      const nombres = personas.map((p) => p.nombre.trim() || 'Acompañante')
      return nombres.length > 1 ? `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}` : (nombres[0] ?? '')
    },

    get resumen() {
      const n = this.asistentes.length
      if (this.personas.length === 1) return n ? '¡Nos acompañarás!' : 'No podrás acompañarnos.'
      if (!n) return 'No podrán acompañarnos.'
      return `Asistirán ${n} de ${this.personas.length}: ${this.lista(this.asistentes)}.`
    },

    get textoBoton() {
      if (this.enviando) return 'Enviando…'
      if (this.asistentes.length) return 'Confirmar'
      return this.personas.length > 1 ? 'Confirmar que no asistiremos' : 'Confirmar que no asistiré'
    },

    get textoNoAsistir() {
      return this.personas.length > 1 ? 'No podremos asistir' : 'No podré asistir'
    },

    get fechaLimite() {
      if (!this.cierraEn) return ''
      // cierra_en es el primer instante en que ya no se puede: se muestra el anterior.
      return new Intl.DateTimeFormat(config.locale, { day: 'numeric', month: 'long' }).format(
        new Date(new Date(this.cierraEn).getTime() - 1),
      )
    },

    cambiar() {
      this.error = ''
      this.editando = true
    },

    cancelar() {
      this.aplicar({ rsvp: this.abierta ? 'abierta' : 'cerrada', cierra_en: this.cierraEn, pase: this.pase })
    },

    noAsistiremos() {
      for (const p of this.personas) p.asiste = false
      return this.enviar()
    },

    async enviar() {
      if (this.enviando) return
      if (this.faltaNombre) {
        this.error = 'Escribe el nombre de tu acompañante.'
        return
      }
      this.enviando = true
      this.error = ''
      try {
        const datos = await api.pedir('/rsvp', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personas: this.personas.map((p) => ({
              id: p.id,
              asiste: p.asiste,
              ...(p.libre && { nombre: p.nombre.trim() }),
            })),
            mensaje: this.mensaje.trim(),
          }),
        })
        this.aplicar(datos)
      } catch (e) {
        if (e.codigo === 'cerrada') await this.cargar()
        this.manejarError(e)
      } finally {
        this.enviando = false
      }
    },
  }
}
