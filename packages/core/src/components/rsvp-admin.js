// Componente Alpine: panel de los festejados en /rsvp/#admin=<token>.
//
// Muestra todos los pases con quién asiste y los totales (adultos y niños),
// manda cada invitación por WhatsApp (y guarda que ya se envió), recuerda a los
// pendientes, permite agregar, editar y borrar pases, y descarga la lista en CSV.
// Mismo token que el panel de fotos.
import { crearApi, formatearFechaHora, tokenAdmin } from '../fotos/api.js'

const CADA_MS = 60_000

let claves = 0
/** Persona del editor; `clave` sólo identifica la fila en el x-for. */
const filaPersona = (p = {}) => ({
  id: p.id ?? null,
  nombre: p.nombre ?? '',
  nino: Boolean(p.nino),
  libre: Boolean(p.libre),
  clave: ++claves,
})

/** Sin acentos ni mayúsculas, para la búsqueda. */
const normalizar = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

export function rsvpAdmin(event) {
  const config = event.rsvp
  const token = tokenAdmin()
  const api = crearApi(config, () => ({ Authorization: `Bearer ${token}` }))
  const inicio = new URL(config.inicio, location.href).href
  let temporizador

  return {
    estado: 'cargando', // cargando · deshabilitado · sin_acceso · listo · error
    error: '',
    pases: [],
    totales: null,
    abierta: true,
    cierraEn: null,
    filtro: 'todos', // todos · van · no_van · pendiente · sin_enviar
    busqueda: '',
    copiado: null, // id del pase cuyo enlace se acaba de copiar
    actualizando: false,
    // Editor de un pase: null = cerrado; id null = pase nuevo.
    editor: null,
    guardando: false,
    errorEditor: '',
    confirmarBorrar: false,

    async init() {
      if (config.modo !== 'pases') {
        this.estado = 'deshabilitado'
        return
      }
      if (!token) {
        this.estado = 'sin_acceso'
        return
      }
      await this.cargar()
      if (this.estado !== 'listo') return
      temporizador = setInterval(() => !document.hidden && this.cargar(), CADA_MS)
      document.addEventListener('visibilitychange', () => !document.hidden && this.cargar())
    },

    destroy() {
      clearInterval(temporizador)
    },

    async cargar() {
      this.actualizando = true
      try {
        const datos = await api.pedir('/admin/rsvp')
        this.pases = datos.pases
        this.totales = datos.totales
        this.abierta = datos.rsvp === 'abierta'
        this.cierraEn = datos.cierra_en
        this.estado = 'listo'
        this.error = ''
      } catch (e) {
        this.error = e.message
        if (e.codigo === 'sin_acceso') this.estado = 'sin_acceso'
        // Si ya había lista, se queda la última y sólo se muestra el aviso.
        else if (this.estado !== 'listo') this.estado = 'error'
      } finally {
        this.actualizando = false
      }
    },

    // ── Resumen ───────────────────────────────────────────────────────────

    /** van · no_van · pendiente */
    estadoPase(pase) {
      if (!pase.respondido_en) return 'pendiente'
      return pase.personas.some((p) => p.asiste) ? 'van' : 'no_van'
    },

    get conteo() {
      const conteo = { todos: this.pases.length, van: 0, no_van: 0, pendiente: 0, sin_enviar: 0 }
      for (const pase of this.pases) {
        conteo[this.estadoPase(pase)]++
        if (this.porEnviar(pase)) conteo.sin_enviar++
      }
      return conteo
    },

    get filtros() {
      const c = this.conteo
      return [
        ['todos', `Todos (${c.todos})`],
        ['van', `Confirmados (${c.van})`],
        ['no_van', `No van (${c.no_van})`],
        ['pendiente', `Pendientes (${c.pendiente})`],
        ['sin_enviar', `Sin enviar (${c.sin_enviar})`],
      ]
    },

    get lista() {
      const q = normalizar(this.busqueda.trim())
      return this.pases.filter(
        (pase) =>
          (this.filtro === 'todos' ||
            this.estadoPase(pase) === this.filtro ||
            (this.filtro === 'sin_enviar' && this.porEnviar(pase))) &&
          (!q || normalizar([pase.nombre, ...pase.personas.map((p) => p.nombre)].join(' ')).includes(q)),
      )
    },

    get textoCierre() {
      if (!this.cierraEn) return 'Sin fecha límite para confirmar'
      const fecha = formatearFechaHora(new Date(new Date(this.cierraEn).getTime() - 1).toISOString(), config.locale)
      return this.abierta ? `Pueden confirmar hasta el ${fecha}` : `Las confirmaciones cerraron el ${fecha}`
    },

    // ── Cada pase ─────────────────────────────────────────────────────────

    nombrePersona(persona) {
      return persona.nombre || 'Acompañante'
    },

    resumenPase(pase) {
      const van = pase.personas.filter((p) => p.asiste).length
      const estado = this.estadoPase(pase)
      if (estado === 'pendiente') return `Sin responder · ${pase.personas.length} en el pase`
      if (estado === 'no_van') return pase.personas.length > 1 ? 'No asistirán' : 'No asistirá'
      return `Asisten ${van} de ${pase.personas.length}`
    },

    enlace(pase) {
      return `${inicio}?i=${pase.codigo}`
    },

    async copiar(pase) {
      try {
        await navigator.clipboard.writeText(this.enlace(pase))
        this.copiado = pase.id
        setTimeout(() => this.copiado === pase.id && (this.copiado = null), 2000)
      } catch {
        prompt('Copia el enlace:', this.enlace(pase))
      }
    },

    // ── WhatsApp (sin teléfono, WhatsApp pide elegir el contacto) ─────────

    get limite() {
      if (!this.cierraEn) return ''
      const fecha = new Date(new Date(this.cierraEn).getTime() - 1)
      return ` antes del ${new Intl.DateTimeFormat(config.locale, { day: 'numeric', month: 'long' }).format(fecha)}`
    },

    whatsapp(pase, texto) {
      return `https://wa.me/${pase.telefono ?? ''}?text=${encodeURIComponent(texto)}`
    },

    /** Nadie le ha mandado la invitación y aún puede confirmar. */
    porEnviar(pase) {
      return !pase.enviada_en && this.estadoPase(pase) === 'pendiente'
    },

    /** La primera invitación: a quién incluye el pase y el enlace para confirmar. */
    invitacion(pase) {
      const nombres = pase.personas.map((p) =>
        p.libre ? 'un acompañante' : p.nino ? `${p.nombre} (niño/a)` : p.nombre,
      )
      const quienes = nombres.length > 1 ? `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}` : nombres[0]
      return this.whatsapp(
        pase,
        [
          `¡Hola, ${pase.nombre}! 💌`,
          `Te compartimos la invitación a ${event.titulo}.`,
          `Pase para: ${quienes}.`,
          `Confirma tu asistencia aquí${this.limite}:`,
          this.enlace(pase),
        ].join('\n'),
      )
    },

    recordatorio(pase) {
      return this.whatsapp(
        pase,
        `¡Hola, ${pase.nombre}! 💌 Te recordamos confirmar tu asistencia a ${event.titulo}${this.limite}:\n${this.enlace(pase)}`,
      )
    },

    textoEnviada(pase) {
      if (!pase.enviada_en) return ''
      const fecha = new Intl.DateTimeFormat(config.locale, { day: 'numeric', month: 'short' }).format(
        new Date(pase.enviada_en),
      )
      return `Invitación enviada el ${fecha}`
    },

    /**
     * Al tocar "Enviar invitación" (el enlace abre WhatsApp) o "Desmarcar". Se
     * marca de inmediato; si la API falla, vuelve como estaba y se ve el aviso.
     */
    async marcarEnviada(pase, enviada) {
      const antes = pase.enviada_en
      pase.enviada_en = enviada ? (antes ?? new Date().toISOString()) : null
      try {
        const datos = await api.pedir(`/admin/rsvp/${pase.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enviada }),
        })
        pase.enviada_en = datos.enviada_en
        this.error = ''
      } catch (e) {
        pase.enviada_en = antes
        this.error = `No se pudo guardar el envío de ${pase.nombre}: ${e.message}`
      }
    },

    // ── Agregar, editar y borrar pases ────────────────────────────────────

    abrirEditor(pase = null) {
      this.editor = {
        id: pase?.id ?? null,
        nombre: pase?.nombre ?? '',
        // Los de México se guardan con 52; se editan con los 10 dígitos.
        telefono: (pase?.telefono ?? '').replace(/^52(\d{10})$/, '$1'),
        personas: pase ? pase.personas.map(filaPersona) : [filaPersona()],
        respondido: Boolean(pase?.respondido_en),
      }
      this.errorEditor = ''
      this.confirmarBorrar = false
    },

    cerrarEditor() {
      if (!this.guardando) this.editor = null
    },

    agregarPersona(libre = false) {
      this.editor.personas.push(filaPersona({ libre }))
    },

    quitarPersona(i) {
      this.editor.personas.splice(i, 1)
    },

    async guardarPase() {
      const { id, nombre, telefono, personas } = this.editor
      this.guardando = true
      this.errorEditor = ''
      try {
        await api.pedir(id ? `/admin/rsvp/${id}` : '/admin/rsvp', {
          method: id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre,
            telefono,
            personas: personas.map(({ id, nombre, nino, libre }) => ({ id, nombre, nino, libre })),
          }),
        })
        if (!id) {
          // Que el pase nuevo se vea en la lista.
          this.filtro = 'todos'
          this.busqueda = nombre.trim()
        }
        this.guardando = false
        this.editor = null
        await this.cargar()
      } catch (e) {
        this.errorEditor = e.message
      } finally {
        this.guardando = false
      }
    },

    async borrarPase() {
      this.guardando = true
      this.errorEditor = ''
      try {
        await api.pedir(`/admin/rsvp/${this.editor.id}`, { method: 'DELETE' })
        this.guardando = false
        this.editor = null
        await this.cargar()
      } catch (e) {
        this.errorEditor = e.message
      } finally {
        this.guardando = false
      }
    },

    // ── CSV ───────────────────────────────────────────────────────────────

    /** Una fila por persona: para el salón, el banquete o la lista de la entrada. */
    descargarCsv() {
      const campo = (v) => {
        const t = String(v ?? '')
        return /[",\n]/.test(t) ? `"${t.replaceAll('"', '""')}"` : t
      }
      const filas = [['pase', 'persona', 'tipo', 'asiste', 'mensaje', 'telefono', 'ultima_respuesta']]
      for (const pase of this.pases) {
        for (const p of pase.personas) {
          filas.push([
            pase.nombre,
            this.nombrePersona(p),
            [p.nino ? 'niño/a' : 'adulto', p.libre && 'acompañante'].filter(Boolean).join(', '),
            p.asiste === null ? 'sin responder' : p.asiste ? 'sí' : 'no',
            pase.mensaje,
            pase.telefono,
            pase.respondido_en ? formatearFechaHora(pase.actualizado_en ?? pase.respondido_en, config.locale) : '',
          ])
        }
      }
      // BOM para que Excel lo abra con acentos.
      const csv = `﻿${filas.map((f) => f.map(campo).join(',')).join('\n')}\n`
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
      const a = Object.assign(document.createElement('a'), { href: url, download: `rsvp-${config.slug}.csv` })
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    },
  }
}
