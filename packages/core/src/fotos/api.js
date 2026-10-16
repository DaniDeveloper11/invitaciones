// Cliente de la API de fotos (workers/fotos). Lanza ErrorApi con el `codigo`
// que devuelve el Worker (sin_acceso, aun_no_abre, cerrada, demasiadas…).

export class ErrorApi extends Error {
  constructor(status, datos = {}) {
    super(datos.error || 'No se pudo conectar; revisa tu señal')
    this.status = status
    this.codigo = datos.codigo || (status ? 'error' : 'sin_red')
    this.datos = datos
  }
}

export function crearApi({ api, slug }, cabeceras) {
  const base = `${api.replace(/\/$/, '')}/v1/${slug}`

  async function pedir(ruta, opciones = {}) {
    let res
    try {
      res = await fetch(base + ruta, { ...opciones, headers: { ...cabeceras(), ...opciones.headers } })
    } catch {
      throw new ErrorApi(0)
    }
    if (res.status === 204) return null
    const datos = await res.json().catch(() => ({}))
    if (!res.ok) throw new ErrorApi(res.status, datos)
    return datos
  }

  return {
    base,
    /** URL absoluta de una ruta devuelta por la API (src / thumb de una foto). */
    url: (ruta) => `${api.replace(/\/$/, '')}${ruta}`,
    pedir,

    /**
     * Subida con XMLHttpRequest: fetch no informa del progreso del envío.
     * @param {FormData} form
     * @param {(fraccion: number) => void} alProgresar
     */
    subir(form, alProgresar) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `${base}/fotos`)
        for (const [k, v] of Object.entries(cabeceras())) xhr.setRequestHeader(k, v)
        xhr.upload.onprogress = (e) => e.lengthComputable && alProgresar(e.loaded / e.total)
        xhr.onerror = () => reject(new ErrorApi(0))
        xhr.ontimeout = () => reject(new ErrorApi(0))
        xhr.onload = () => {
          let datos = {}
          try {
            datos = JSON.parse(xhr.responseText)
          } catch {
            // Respuesta vacía o no JSON: nos quedamos con el status.
          }
          if (xhr.status >= 200 && xhr.status < 300) resolve(datos)
          else reject(new ErrorApi(xhr.status, datos))
        }
        xhr.timeout = 120_000
        xhr.send(form)
      })
    },
  }
}

/**
 * Token de los festejados (#admin=<token>). Va después de `#`, así que nunca se
 * envía al servidor de Pages ni queda en sus logs; los paneles (fotos y RSVP)
 * lo mandan a la API como Authorization: Bearer.
 */
export function tokenAdmin() {
  return new URLSearchParams(location.hash.slice(1)).get('admin') || ''
}

/** localStorage puede no estar disponible (modo privado); nunca debe romper la página. */
export const almacen = {
  leer(clave) {
    try {
      return localStorage.getItem(clave) || ''
    } catch {
      return ''
    }
  },
  guardar(clave, valor) {
    try {
      if (valor) localStorage.setItem(clave, valor)
      else localStorage.removeItem(clave)
    } catch {
      // Sin almacenamiento: el dato vive sólo mientras la página esté abierta.
    }
  },
}

/** "sábado 10 de octubre, 12:00 a. m." en el idioma del evento. */
export function formatearFechaHora(iso, locale = 'es-MX') {
  if (!iso) return ''
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}
