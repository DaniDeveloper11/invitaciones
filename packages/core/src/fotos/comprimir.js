// Reduce una foto en el navegador antes de subirla: menos datos móviles, menos
// almacenamiento y, al redibujarla en un canvas, se descartan los metadatos
// EXIF (incluida la ubicación GPS).

export const LADO_FOTO = 2048
export const LADO_MINIATURA = 480

async function decodificar(archivo) {
  // `from-image` respeta la orientación EXIF (fotos verticales de iPhone).
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(archivo, { imageOrientation: 'from-image' })
    } catch {
      // Safari antiguo no acepta opciones; probamos con <img>.
    }
  }
  const url = URL.createObjectURL(archivo)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

function aBlob(canvas, tipo, calidad) {
  return new Promise((resolve) => canvas.toBlob(resolve, tipo, calidad))
}

async function redimensionar(imagen, ladoMax, calidad) {
  const ancho = imagen.width
  const alto = imagen.height
  const escala = Math.min(1, ladoMax / Math.max(ancho, alto))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(ancho * escala)
  canvas.height = Math.round(alto * escala)
  canvas.getContext('2d').drawImage(imagen, 0, 0, canvas.width, canvas.height)

  // WebP si el navegador sabe codificarlo; si no (Safari < 17), JPEG.
  let blob = await aBlob(canvas, 'image/webp', calidad)
  if (!blob || blob.type !== 'image/webp') blob = await aBlob(canvas, 'image/jpeg', calidad)
  if (!blob) throw new Error('No se pudo procesar la foto')
  return { blob, ancho: canvas.width, alto: canvas.height }
}

/**
 * @param {File} archivo
 * @returns {Promise<{ foto: Blob, miniatura: Blob, ancho: number, alto: number }>}
 */
export async function comprimir(archivo) {
  let imagen
  try {
    imagen = await decodificar(archivo)
  } catch {
    throw new Error('Este formato de foto no es compatible con tu navegador')
  }
  try {
    const foto = await redimensionar(imagen, LADO_FOTO, 0.82)
    const miniatura = await redimensionar(imagen, LADO_MINIATURA, 0.7)
    return { foto: foto.blob, miniatura: miniatura.blob, ancho: foto.ancho, alto: foto.alto }
  } finally {
    imagen.close?.()
  }
}
