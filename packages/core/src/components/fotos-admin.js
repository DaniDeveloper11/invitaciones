// Componente Alpine: panel de los festejados en /fotos/#admin=<token>.
//
// El token va después de `#`, así que nunca se envía al servidor de Pages ni
// queda en sus logs; la página lo manda a la API como Authorization: Bearer.
// Las imágenes se piden con fetch (para poder mandar el token, también las
// ocultas) y se muestran como object URLs.
import { crearApi, formatearFechaHora } from '../fotos/api.js'

const CADA_MS = 30_000
const MINIATURAS_A_LA_VEZ = 6

export function tokenAdmin() {
  return new URLSearchParams(location.hash.slice(1)).get('admin') || ''
}

function nombreArchivo(texto) {
  return (
    String(texto || 'invitado')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'invitado'
  )
}

export function fotosAdmin(config) {
  const token = tokenAdmin()
  const api = crearApi(config, () => ({ Authorization: `Bearer ${token}` }))
  const urls = new Set()
  let temporizador

  async function blobUrl(ruta) {
    const res = await fetch(api.url(ruta), { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const url = URL.createObjectURL(await res.blob())
    urls.add(url)
    return url
  }

  return {
    estado: 'cargando', // cargando · sin_acceso · listo · error
    error: '',
    evento: null,
    fotos: [],
    miniaturas: {},
    filtro: 'todas', // todas · visibles · ocultas
    visor: null, // { foto, url }
    copiado: false,
    zip: { activo: false, hechas: 0, total: 0 },

    async init() {
      if (!token) {
        this.estado = 'sin_acceso'
        return
      }
      try {
        this.evento = await api.pedir('')
        if (this.evento.rol !== 'admin') throw Object.assign(new Error(), { codigo: 'sin_acceso' })
        await this.cargarTodas()
        this.estado = 'listo'
        temporizador = setInterval(() => !document.hidden && this.actualizar(), CADA_MS)
      } catch (e) {
        this.estado = e.codigo === 'sin_acceso' ? 'sin_acceso' : 'error'
        this.error = e.message
      }
    },

    destroy() {
      clearInterval(temporizador)
      for (const url of urls) URL.revokeObjectURL(url)
    },

    get visibles() {
      return this.fotos.filter((f) => !f.oculta)
    },

    get filtradas() {
      if (this.filtro === 'visibles') return this.visibles
      if (this.filtro === 'ocultas') return this.fotos.filter((f) => f.oculta)
      return this.fotos
    },

    get enlaceInvitados() {
      if (!this.evento?.codigo) return ''
      return `${location.origin}${location.pathname}?c=${this.evento.codigo}`
    },

    get textoVentana() {
      const e = this.evento
      if (!e) return ''
      const abre = e.abre_en ? formatearFechaHora(e.abre_en, config.locale) : 'ya'
      const cierra = e.cierra_en ? formatearFechaHora(e.cierra_en, config.locale) : 'sin fecha de cierre'
      return `Subida: abre ${abre} · cierra ${cierra}`
    },

    hora(foto) {
      return new Intl.DateTimeFormat(config.locale, { hour: 'numeric', minute: '2-digit' }).format(
        new Date(foto.creada),
      )
    },

    // ── Carga ─────────────────────────────────────────────────────────────

    async cargarTodas() {
      const todas = []
      let antes = ''
      do {
        const datos = await api.pedir(`/admin/fotos?limite=100${antes && `&antes=${encodeURIComponent(antes)}`}`)
        todas.push(...datos.fotos)
        antes = datos.siguiente
      } while (antes)
      this.fotos = todas
      this.cargarMiniaturas(todas)
    },

    async actualizar() {
      const desde = this.fotos[0]?.creada
      if (!desde) return this.cargarTodas().catch(() => {})
      try {
        const datos = await api.pedir(`/admin/fotos?limite=100&desde=${encodeURIComponent(desde)}`)
        const ids = new Set(this.fotos.map((f) => f.id))
        const nuevas = datos.fotos.filter((f) => !ids.has(f.id))
        this.fotos = [...nuevas, ...this.fotos]
        this.cargarMiniaturas(nuevas)
        this.evento = await api.pedir('')
      } catch {
        // El siguiente ciclo lo vuelve a intentar.
      }
    },

    async cargarMiniaturas(fotos) {
      const pendientes = fotos.filter((f) => !this.miniaturas[f.id])
      const trabajador = async () => {
        let foto
        while ((foto = pendientes.shift())) {
          try {
            this.miniaturas[foto.id] = await blobUrl(foto.thumb)
          } catch {
            // Se queda sin miniatura; la foto sigue listada.
          }
        }
      }
      await Promise.all(Array.from({ length: MINIATURAS_A_LA_VEZ }, trabajador))
    },

    // ── Acciones ──────────────────────────────────────────────────────────

    async ver(foto) {
      this.visor = { foto, url: this.miniaturas[foto.id] || '' }
      try {
        const url = await blobUrl(foto.src)
        if (this.visor?.foto === foto) this.visor.url = url
      } catch {
        // Se queda la miniatura.
      }
    },

    async alternar(foto) {
      try {
        const res = await api.pedir(`/admin/fotos/${foto.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ oculta: !foto.oculta }),
        })
        foto.oculta = res.oculta
      } catch (e) {
        alert(e.message)
      }
    },

    async borrar(foto) {
      const de = foto.autor ? ` de ${foto.autor}` : ''
      if (!confirm(`¿Borrar la foto${de}? No se puede deshacer.`)) return
      try {
        await api.pedir(`/admin/fotos/${foto.id}`, { method: 'DELETE' })
        this.fotos = this.fotos.filter((f) => f !== foto)
        if (this.visor?.foto === foto) this.visor = null
      } catch (e) {
        alert(e.message)
      }
    },

    async copiarEnlace() {
      try {
        await navigator.clipboard.writeText(this.enlaceInvitados)
        this.copiado = true
        setTimeout(() => (this.copiado = false), 2_000)
      } catch {
        prompt('Copia el enlace para los invitados:', this.enlaceInvitados)
      }
    },

    /**
     * Descarga las fotos visibles en un ZIP armado en el propio navegador
     * (las ocultas no se incluyen). Sin compresión extra: WebP/JPEG ya lo están.
     */
    async descargarZip() {
      const fotos = [...this.visibles].reverse() // en orden cronológico
      if (!fotos.length || this.zip.activo) return
      this.zip = { activo: true, hechas: 0, total: fotos.length }

      try {
        const { Zip, ZipPassThrough } = await import('fflate')
        const partes = []
        const terminado = new Promise((resolve, reject) => {
          const zip = new Zip((err, parte, final) => {
            if (err) return reject(err)
            partes.push(parte)
            if (final) resolve()
          })
          this._zip = zip
        })

        for (const [i, foto] of fotos.entries()) {
          const res = await fetch(api.url(foto.src), { headers: { Authorization: `Bearer ${token}` } })
          if (!res.ok) throw new Error(`No se pudo descargar una foto (HTTP ${res.status})`)
          const ext = res.headers.get('Content-Type') === 'image/jpeg' ? 'jpg' : 'webp'
          const entrada = new ZipPassThrough(`${String(i + 1).padStart(3, '0')}-${nombreArchivo(foto.autor)}.${ext}`)
          entrada.mtime = new Date(foto.creada)
          this._zip.add(entrada)
          entrada.push(new Uint8Array(await res.arrayBuffer()), true)
          this.zip.hechas = i + 1
        }
        this._zip.end()
        await terminado

        const url = URL.createObjectURL(new Blob(partes, { type: 'application/zip' }))
        const a = document.createElement('a')
        a.href = url
        a.download = `fotos-${config.slug}.zip`
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
      } catch (e) {
        alert(e.message || 'No se pudo armar el ZIP')
      } finally {
        this.zip.activo = false
        this._zip = null
      }
    },
  }
}
