// Mensajes de WhatsApp del RSVP con pases: la invitación y el recordatorio.
// Los usan el panel de festejados y scripts/rsvp-alta.mjs, así que no dependen
// del navegador ni de Vite: reciben la configuración del evento tal cual.

const ICONOS = { iglesia: '⛪', copas: '🥂', corona: '👑', vals: '💃', camara: '📸', disco: '🪩', reloj: '⏰' }

// La fecha límite es el final de un día en hora de México (rsvp.cierra).
const ZONA_LIMITE = 'America/Mexico_City'

/** "los XV años de Camila": rsvp.evento, o el título si no hay. */
const nombreEvento = (event) => event.rsvp?.evento || event.titulo

/** "Sábado 19 de diciembre de 2026" (con `corta`, "19 de diciembre"). */
function fechaEvento(event, corta = false) {
  const fecha = new Date(event.fecha)
  if (Number.isNaN(fecha.getTime())) return ''
  const opciones = corta
    ? { day: 'numeric', month: 'long' }
    : { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
  const texto = new Intl.DateTimeFormat(event.locale || 'es-MX', opciones).format(fecha).replace(',', '')
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/** "1 de diciembre", o '' sin fecha límite. */
function fechaLimite(event, cierraEn) {
  if (!cierraEn) return ''
  return new Intl.DateTimeFormat(event.locale || 'es-MX', { timeZone: ZONA_LIMITE, day: 'numeric', month: 'long' }).format(
    new Date(new Date(cierraEn).getTime() - 1),
  )
}

/** "Leticia Ascencio, esposo, niña y niño" — personas como las da la API. */
export function quienesVan(personas) {
  const nombres = personas.map((p) =>
    p.libre ? (p.etiqueta?.toLowerCase() ?? 'un acompañante') : p.nino ? `${p.nombre} (niño/a)` : p.nombre,
  )
  return nombres.length > 1 ? `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}` : (nombres[0] ?? '')
}

/** La primera invitación: fecha, misa y recepción, a quién incluye y el enlace. */
export function textoInvitacion(event, { pase, enlace, cierraEn }) {
  const fecha = fechaEvento(event)
  const limite = fechaLimite(event, cierraEn)
  const quienes = quienesVan(pase.personas)
  const ceremonias = (event.ceremonias ?? []).flatMap((c) => [
    `${ICONOS[c.icono] ?? '✨'} ${[c.titulo, c.hora].filter(Boolean).join(' · ')}`,
    ...(c.lugar ? [`📍 ${c.lugar}`] : []),
  ])
  const bloques = [
    [`¡Hola, ${pase.nombre}! 💌✨`, `Con mucho cariño te invitamos a celebrar *${nombreEvento(event)}* 🎉`],
    [...(fecha ? [`📅 *${fecha}*`] : []), ...ceremonias],
    quienes ? [`🎟️ *Pase para:* ${quienes}`] : [],
    [
      `⚠️ *Es muy importante que confirmes tu asistencia${limite ? ` antes del ${limite}` : ''}* 🙏`,
      `👉 Confirma aquí: ${enlace}`,
    ],
    ['¡Te esperamos! 💖'],
  ]
  return bloques
    .filter((b) => b.length)
    .map((b) => b.join('\n'))
    .join('\n\n')
}

/** Para quien aún no confirma. */
export function textoRecordatorio(event, { pase, enlace, cierraEn }) {
  const fecha = fechaEvento(event, true)
  const limite = fechaLimite(event, cierraEn)
  return [
    `¡Hola, ${pase.nombre}! 👋💌`,
    `⏰ Aún no recibimos tu confirmación para *${nombreEvento(event)}*${fecha ? ` (📅 ${fecha})` : ''}.`,
    limite ? `⚠️ Tienes hasta el *${limite}* para confirmar 🙏` : '⚠️ Por favor confírmanos tu asistencia 🙏',
    `👉 ${enlace}`,
  ].join('\n')
}
