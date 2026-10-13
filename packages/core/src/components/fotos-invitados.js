// Componente Alpine: página /fotos/ para invitados.
//
// Lee el código del evento de la URL (?c=, viene del QR) y lo recuerda en el
// teléfono. Recibe las fotos de `camara` (evento `fotos-elegidas`), las
// comprime, las sube una por una con progreso y reintentos, y muestra el muro
// compartido, que se actualiza solo cada 15 s.
import { gallery } from './gallery.js'
import { comprimir } from '../fotos/comprimir.js'
import { crearApi, almacen, formatearFechaHora } from '../fotos/api.js'

const CADA_MS = 15_000
const ESPERAS_SIN_RED = [2_000, 5_000, 10_000]

export function fotosInvitados(config) {
  const claveCodigo = `fotos:${config.slug}:codigo`
  let api
  let temporizador

  return {
    ...gallery(),

    estado: 'cargando', // cargando · sin_codigo · listo · error
    error: '',
    codigo: '',
    codigoManual: '',
    autor: almacen.leer('fotos:autor'),
    evento: null,
    fotos: [],
    siguiente: null,
    cargandoMas: false,
    cola: [],
    procesando: false,

    init() {
      api = crearApi(config, () => ({ 'X-Codigo': this.codigo }))
      const enUrl = new URLSearchParams(location.search).get('c')
      this.codigo = (enUrl || almacen.leer(claveCodigo)).trim().toUpperCase()
      if (this.codigo) this.conectar()
      else this.estado = 'sin_codigo'

      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && this.estado === 'listo') this.actualizar()
      })
    },

    destroy() {
      clearInterval(temporizador)
    },

    // ── Acceso ────────────────────────────────────────────────────────────

    async conectar() {
      this.estado = 'cargando'
      this.error = ''
      try {
        this.evento = await api.pedir('')
        almacen.guardar(claveCodigo, this.codigo)
        await this.cargar()
        this.estado = 'listo'
        clearInterval(temporizador)
        temporizador = setInterval(() => !document.hidden && this.actualizar(), CADA_MS)
      } catch (e) {
        if (e.codigo === 'sin_acceso') {
          almacen.guardar(claveCodigo, '')
          this.codigo = ''
          this.estado = 'sin_codigo'
          this.error = 'Ese código no es válido. Revisa el QR del evento.'
        } else {
          this.estado = 'error'
          this.error = e.message
        }
      }
    },

    usarCodigo() {
      this.codigo = this.codigoManual.trim().toUpperCase()
      if (this.codigo) this.conectar()
    },

    guardarAutor() {
      this.autor = this.autor.trim().slice(0, 60)
      almacen.guardar('fotos:autor', this.autor)
    },

    // ── Estado de la subida ───────────────────────────────────────────────

    get subidaAbierta() {
      return this.evento?.subida === 'abierta'
    },

    get avisoSubida() {
      if (this.evento?.subida === 'aun_no_abre') {
        return `La subida de fotos abre el ${formatearFechaHora(this.evento.abre_en, config.locale)}.`
      }
      if (this.evento?.subida === 'cerrada') return 'La subida de fotos ya cerró. ¡Gracias por compartir!'
      return ''
    },

    // ── Muro ──────────────────────────────────────────────────────────────

    /** Para el visor de `gallery()`: imágenes grandes en el mismo orden que el muro. */
    get photos() {
      return this.fotos.map((f) => this.src(f))
    },

    src(foto) {
      return `${api.url(foto.src)}?c=${encodeURIComponent(this.codigo)}`
    },

    thumb(foto) {
      return `${api.url(foto.thumb)}?c=${encodeURIComponent(this.codigo)}`
    },

    async cargar() {
      const datos = await api.pedir('/fotos?limite=30')
      this.fotos = datos.fotos
      this.siguiente = datos.siguiente
    },

    async masFotos() {
      if (!this.siguiente || this.cargandoMas) return
      this.cargandoMas = true
      try {
        const datos = await api.pedir(`/fotos?limite=30&antes=${encodeURIComponent(this.siguiente)}`)
        this.agregar(datos.fotos)
        this.siguiente = datos.siguiente
      } catch {
        // Se reintenta con el siguiente toque del botón.
      } finally {
        this.cargandoMas = false
      }
    },

    /** Polling: estado del evento (puede abrir o cerrar) y fotos nuevas. */
    async actualizar() {
      try {
        this.evento = await api.pedir('')
        const desde = this.fotos[0]?.creada
        if (!desde) return this.cargar()
        const datos = await api.pedir(`/fotos?limite=100&desde=${encodeURIComponent(desde)}`)
        this.agregar(datos.fotos)
      } catch {
        // Sin señal un momento: el siguiente ciclo lo vuelve a intentar.
      }
    },

    agregar(nuevas) {
      const ids = new Set(this.fotos.map((f) => f.id))
      const sinRepetir = nuevas.filter((f) => !ids.has(f.id))
      if (!sinRepetir.length) return
      this.fotos = [...sinRepetir, ...this.fotos].sort((a, b) =>
        a.creada === b.creada ? b.id.localeCompare(a.id) : b.creada.localeCompare(a.creada),
      )
    },

    // ── Subida ────────────────────────────────────────────────────────────

    /** Handler de @fotos-elegidas.window */
    recibir({ archivos }) {
      if (!this.subidaAbierta) return
      for (const archivo of archivos) {
        this.cola.push({
          clave: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
          archivo,
          estado: 'pendiente', // pendiente · preparando · subiendo · esperando · lista · error
          progreso: 0,
          error: '',
          preview: '',
          intentos: 0,
          datos: null,
        })
      }
      this.procesarCola()
    },

    get subiendo() {
      return this.cola.filter((i) => i.estado !== 'lista' && i.estado !== 'error').length
    },

    async procesarCola() {
      if (this.procesando) return
      this.procesando = true
      let item
      while ((item = this.cola.find((i) => i.estado === 'pendiente'))) {
        await this.subirItem(item)
      }
      this.procesando = false
    },

    async subirItem(item) {
      try {
        if (!item.datos) {
          item.estado = 'preparando'
          item.datos = await comprimir(item.archivo)
          item.preview = URL.createObjectURL(item.datos.miniatura)
        }
        const { foto, miniatura, ancho, alto } = item.datos
        const ext = foto.type === 'image/webp' ? 'webp' : 'jpg'
        const form = new FormData()
        form.append('foto', foto, `foto.${ext}`)
        form.append('thumb', miniatura, `thumb.${ext}`)
        form.append('ancho', ancho)
        form.append('alto', alto)
        if (this.autor) form.append('autor', this.autor)

        item.estado = 'subiendo'
        item.progreso = 0
        const res = await api.subir(form, (p) => (item.progreso = p))

        item.estado = 'lista'
        item.progreso = 1
        this.agregar([res.foto])
        setTimeout(() => this.quitar(item), 2_500)
      } catch (e) {
        this.manejarError(item, e)
      }
    },

    manejarError(item, e) {
      if (e.codigo === 'sin_red' && item.intentos < ESPERAS_SIN_RED.length) {
        item.estado = 'esperando'
        item.error = 'Sin señal, reintentando…'
        setTimeout(() => this.reintentar(item), ESPERAS_SIN_RED[item.intentos++])
        return
      }
      if (e.codigo === 'demasiadas') {
        item.estado = 'esperando'
        item.error = 'Muchas fotos seguidas; continúa en un minuto…'
        setTimeout(() => this.reintentar(item), 60_000)
        return
      }
      if (e.codigo === 'aun_no_abre' || e.codigo === 'cerrada') this.actualizar()
      item.estado = 'error'
      item.error = e.message
    },

    reintentar(item) {
      if (!this.cola.includes(item)) return
      item.estado = 'pendiente'
      item.error = ''
      this.procesarCola()
    },

    quitar(item) {
      if (item.preview) URL.revokeObjectURL(item.preview)
      this.cola = this.cola.filter((i) => i !== item)
    },
  }
}
