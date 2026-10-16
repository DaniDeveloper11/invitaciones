// Componente Alpine: panel de los festejados en /rsvp/#admin=<token>.
//
// Muestra todos los pases con quién asiste, los totales (adultos y niños), los
// pendientes con un recordatorio por WhatsApp y descarga la lista en CSV.
// Mismo token que el panel de fotos.
import { crearApi, formatearFechaHora, tokenAdmin } from '../fotos/api.js'

const CADA_MS = 60_000

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
    filtro: 'todos', // todos · van · no_van · pendiente
    busqueda: '',
    copiado: null, // id del pase cuyo enlace se acaba de copiar
    actualizando: false,

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
      const conteo = { todos: this.pases.length, van: 0, no_van: 0, pendiente: 0 }
      for (const pase of this.pases) conteo[this.estadoPase(pase)]++
      return conteo
    },

    get filtros() {
      const c = this.conteo
      return [
        ['todos', `Todos (${c.todos})`],
        ['van', `Confirmados (${c.van})`],
        ['no_van', `No van (${c.no_van})`],
        ['pendiente', `Pendientes (${c.pendiente})`],
      ]
    },

    get lista() {
      const q = normalizar(this.busqueda.trim())
      return this.pases.filter(
        (pase) =>
          (this.filtro === 'todos' || this.estadoPase(pase) === this.filtro) &&
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
      if (estado === 'no_van') return 'No asistirán'
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

    /** WhatsApp con un recordatorio ya escrito (sin teléfono, WhatsApp pide elegir el contacto). */
    recordatorio(pase) {
      const limite = this.cierraEn
        ? ` antes del ${new Intl.DateTimeFormat(config.locale, { day: 'numeric', month: 'long' }).format(new Date(new Date(this.cierraEn).getTime() - 1))}`
        : ''
      const texto = `¡Hola, ${pase.nombre}! 💌 Te recordamos confirmar tu asistencia a ${event.titulo}${limite}:\n${this.enlace(pase)}`
      return `https://wa.me/${pase.telefono ?? ''}?text=${encodeURIComponent(texto)}`
    },

    // ── CSV ───────────────────────────────────────────────────────────────

    /** Una fila por persona: para el salón, el banquete o la lista de la entrada. */
    descargarCsv() {
      const campo = (v) => {
        const t = String(v ?? '')
        return /[",\n]/.test(t) ? `"${t.replaceAll('"', '""')}"` : t
      }
      const filas = [['pase', 'persona', 'tipo', 'asiste', 'mensaje', 'telefono', 'respondio']]
      for (const pase of this.pases) {
        for (const p of pase.personas) {
          filas.push([
            pase.nombre,
            this.nombrePersona(p),
            p.nino ? 'niño/a' : 'adulto',
            p.asiste === null ? 'sin responder' : p.asiste ? 'sí' : 'no',
            pase.mensaje,
            pase.telefono,
            pase.respondido_en ? formatearFechaHora(pase.respondido_en, config.locale) : '',
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
