// Componente Alpine: panel de los festejados en /rsvp/#admin=<token>.
//
// Muestra todos los pases con quién asiste y los totales (adultos y niños),
// manda cada invitación por WhatsApp (y guarda que ya se envió), recuerda a los
// pendientes, permite agregar, editar, desactivar y borrar pases (y desactivar
// personas), y descarga la lista en CSV.
// Mismo token que el panel de fotos.
import { crearApi, formatearFechaHora, tokenAdmin } from '../fotos/api.js'
import { textoInvitacion, textoRecordatorio } from '../rsvp-mensajes.js'

const CADA_MS = 60_000

let claves = 0
/** Persona del editor; `clave` sólo identifica la fila en el x-for. */
const filaPersona = (p = {}) => ({
  id: p.id ?? null,
  nombre: p.nombre ?? '',
  nino: Boolean(p.nino),
  libre: Boolean(p.libre),
  etiqueta: p.etiqueta ?? '',
  activa: p.activa !== false, // sólo se muestra; se cambia fuera del editor
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
    filtro: 'todos', // todos · van · no_van · pendiente · sin_enviar · desactivado
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

    /** Las personas que siguen invitadas (las desactivadas no cuentan). */
    activas(pase) {
      return pase.personas.filter((p) => p.activa !== false)
    },

    /** van · no_van · pendiente · desactivado */
    estadoPase(pase) {
      if (pase.activo === false) return 'desactivado'
      if (!pase.respondido_en) return 'pendiente'
      return this.activas(pase).some((p) => p.asiste) ? 'van' : 'no_van'
    },

    get conteo() {
      const conteo = { todos: 0, van: 0, no_van: 0, pendiente: 0, sin_enviar: 0, desactivado: 0 }
      for (const pase of this.pases) {
        const estado = this.estadoPase(pase)
        conteo[estado]++
        if (estado !== 'desactivado') conteo.todos++
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
        ['desactivado', `Desactivados (${c.desactivado})`],
      ]
    },

    get lista() {
      const q = normalizar(this.busqueda.trim())
      return this.pases.filter(
        (pase) =>
          // "Todos" son los invitados: los desactivados tienen su propio filtro.
          ((this.filtro === 'todos' && this.estadoPase(pase) !== 'desactivado') ||
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
      return persona.nombre || persona.etiqueta || 'Acompañante'
    },

    resumenPase(pase) {
      const personas = this.activas(pase)
      const van = personas.filter((p) => p.asiste).length
      const estado = this.estadoPase(pase)
      if (estado === 'desactivado') return 'Invitación desactivada: su enlace ya no funciona'
      if (estado === 'pendiente') return `Sin responder · ${personas.length} en el pase`
      if (estado === 'no_van') return personas.length > 1 ? 'No asistirán' : 'No asistirá'
      return `Asisten ${van} de ${personas.length}`
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

    whatsapp(pase, texto) {
      return `https://wa.me/${pase.telefono ?? ''}?text=${encodeURIComponent(texto)}`
    },

    /** Nadie le ha mandado la invitación y aún puede confirmar. */
    porEnviar(pase) {
      return !pase.enviada_en && this.estadoPase(pase) === 'pendiente'
    },

    /** La primera invitación: fecha, misa y recepción, a quién incluye y el enlace. */
    invitacion(pase) {
      const datos = { pase: { ...pase, personas: this.activas(pase) }, enlace: this.enlace(pase), cierraEn: this.cierraEn }
      return this.whatsapp(pase, textoInvitacion(event, datos))
    },

    recordatorio(pase) {
      const datos = { pase: { ...pase, personas: this.activas(pase) }, enlace: this.enlace(pase), cierraEn: this.cierraEn }
      return this.whatsapp(pase, textoRecordatorio(event, datos))
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

    // ── Desactivar y habilitar (no se borra nada: conservan su respuesta) ──

    /** Desactiva el pase (su enlace deja de servir) o lo vuelve a habilitar. */
    async activarPase(pase, activo) {
      pase.activo = activo
      try {
        await api.pedir(`/admin/rsvp/${pase.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ activo }),
        })
        this.error = ''
        await this.cargar() // los totales cambian
      } catch (e) {
        pase.activo = !activo
        this.error = `No se pudo ${activo ? 'habilitar' : 'desactivar'} a ${pase.nombre}: ${e.message}`
      }
    },

    /** Quita a una persona del pase del invitado o la vuelve a agregar. */
    async activarPersona(pase, persona, activa) {
      persona.activa = activa
      try {
        await api.pedir(`/admin/rsvp/${pase.id}/personas/${persona.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ activa }),
        })
        this.error = ''
        await this.cargar()
      } catch (e) {
        persona.activa = !activa
        this.error = `No se pudo ${activa ? 'habilitar' : 'desactivar'} a ${this.nombrePersona(persona)}: ${e.message}`
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
            personas: personas.map(({ id, nombre, nino, libre, etiqueta }) => ({ id, nombre, nino, libre, etiqueta })),
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
      const filas = [['pase', 'persona', 'tipo', 'invitado', 'asiste', 'mensaje', 'telefono', 'ultima_respuesta']]
      for (const pase of this.pases) {
        for (const p of pase.personas) {
          filas.push([
            pase.nombre,
            this.nombrePersona(p),
            [p.nino ? 'niño/a' : 'adulto', p.libre && (p.etiqueta?.toLowerCase() || 'acompañante')].filter(Boolean).join(', '),
            pase.activo === false ? 'no (pase desactivado)' : p.activa === false ? 'no (desactivada)' : 'sí',
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
