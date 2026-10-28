#!/usr/bin/env node
// Carga la lista de invitados de un evento para el RSVP con pases.
//
//   npm run rsvp:alta -- boda-ana-y-luis invitados.csv
//   npm run rsvp:alta -- boda-ana-y-luis invitados.csv --cierra 2026-11-20
//   npm run rsvp:alta -- demo invitados.csv --local        (base de `wrangler dev`)
//
// El CSV lleva una fila por persona; las filas con el mismo `pase` forman un
// pase (un enlace). `nino` marca a los niños (sí, x, 1). Un nombre que empieza
// con "+" ("+ acompañante") es un lugar libre: el nombre lo escribe el invitado.
// El teléfono basta en una fila del pase (10 dígitos → se antepone 52).
//
//   pase,nombre,nino,telefono
//   Familia Pérez,Luis Pérez,,3312345678
//   Familia Pérez,Sofía Pérez,sí,
//   Juan Gómez,Juan Gómez,,
//   Juan Gómez,+ acompañante,,
//
// Se puede volver a correr con la lista actualizada: agrega los pases nuevos
// y no toca los que ya existen (sus enlaces ya se enviaron). Si el evento no
// existe, lo da de alta sólo para RSVP e imprime el enlace de los festejados.
// Reconoce los pases por su nombre: si los festejados renombraron o borraron
// uno en su panel, volver a correrlo con el CSV viejo lo agrega de nuevo. Una
// vez que usan el panel, la lista vive ahí.
//
// Escribe sites/<slug>/assets-origen/rsvp-enlaces.csv con el enlace de cada
// pase y un enlace de WhatsApp con el mensaje listo (está en .gitignore;
// con --local, rsvp-enlaces.local.csv).
//
// Fecha límite: --cierra o `rsvp.cierra` en event.config.js. "2026-11-20"
// significa hasta el final de ese día, hora de México.

import { existsSync, readFileSync } from 'node:fs'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { rsvpConPases } from '@invitaciones/core/fotos-config'
import {
  DIA_MS,
  SLUG_VALIDO,
  codigoAleatorio,
  crearD1,
  fechaMexico,
  formatoMx,
  leerArgs,
  leerSitio,
  root,
  salir,
  sql,
  tokenFestejados,
  validarFecha,
} from './lib/eventos.mjs'

const LARGO_CODIGO = 8
const MAX_NOMBRE = 80

// ── Argumentos ──────────────────────────────────────────────────────────────

const { opciones, bandera, posicionales } = leerArgs(['cierra', 'nombre'])
const [slug, archivoCsv] = posicionales
const local = bandera('local')

if (!slug || !SLUG_VALIDO.test(slug) || !archivoCsv) {
  salir('Uso: npm run rsvp:alta -- <slug> <lista.csv> [--cierra FECHA] [--nombre "Texto"] [--local]')
}
if (!existsSync(archivoCsv)) salir(`No existe ${archivoCsv}`)

const sitio = leerSitio(slug)
const nombreEvento = opciones.nombre || sitio.titulo || slug

// ── Fecha límite ────────────────────────────────────────────────────────────

const textoCierra = opciones.cierra ?? sitio.config.match(/rsvp\s*:\s*\{[^}]*?\bcierra\s*:\s*'([^']+)'/)?.[1]
let cierra = null
if (textoCierra) {
  cierra = validarFecha(fechaMexico(textoCierra), opciones.cierra ? '--cierra' : 'rsvp.cierra')
  // Sólo el día: se puede confirmar durante todo ese día.
  if (/^\d{4}-\d{2}-\d{2}$/.test(textoCierra)) cierra = new Date(cierra.getTime() + DIA_MS)
}

// ── Lectura del CSV ─────────────────────────────────────────────────────────

/** CSV sencillo (coma o punto y coma, comillas dobles opcionales) → filas de texto. */
function leerCsv(texto) {
  texto = texto.replace(/^﻿/, '') // BOM de Excel
  const separador = (texto.split('\n')[0].match(/;/g)?.length ?? 0) > (texto.split('\n')[0].match(/,/g)?.length ?? 0) ? ';' : ','
  const filas = []
  let fila = []
  let campo = ''
  let entreComillas = false
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]
    if (entreComillas) {
      if (c === '"' && texto[i + 1] === '"') campo += texto[++i]
      else if (c === '"') entreComillas = false
      else campo += c
    } else if (c === '"') entreComillas = true
    else if (c === separador) fila.push(campo), (campo = '')
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++
      fila.push(campo), filas.push(fila), (fila = []), (campo = '')
    } else campo += c
  }
  if (campo || fila.length) fila.push(campo), filas.push(fila)
  return filas.filter((f) => f.some((v) => v.trim()))
}

const [encabezado, ...filas] = leerCsv(readFileSync(archivoCsv, 'utf8'))
const columnas = encabezado.map((c) => c.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''))
const col = (nombre) => columnas.indexOf(nombre)
for (const requerida of ['pase', 'nombre']) {
  if (col(requerida) === -1) salir(`El CSV debe tener las columnas: pase,nombre,nino,telefono (falta "${requerida}").`)
}

const errores = []
/** Pases del CSV en orden de aparición: nombre → { telefono, personas[] } */
const pasesCsv = new Map()

filas.forEach((fila, i) => {
  const linea = i + 2
  const valor = (nombre) => (col(nombre) === -1 ? '' : (fila[col(nombre)] ?? '').trim())
  const pase = valor('pase')
  const nombre = valor('nombre')
  if (!pase || !nombre) return errores.push(`línea ${linea}: falta el pase o el nombre`)
  if (pase.length > MAX_NOMBRE || nombre.length > MAX_NOMBRE) {
    return errores.push(`línea ${linea}: nombre de más de ${MAX_NOMBRE} caracteres`)
  }

  let telefono = valor('telefono').replace(/\D/g, '')
  if (telefono.length === 10) telefono = `52${telefono}`
  if (telefono && (telefono.length < 11 || telefono.length > 15)) {
    errores.push(`línea ${linea}: teléfono no válido (${valor('telefono')})`)
  }

  const datos = pasesCsv.get(pase) ?? { telefono: '', personas: [] }
  if (telefono) datos.telefono ||= telefono
  const libre = nombre.startsWith('+')
  datos.personas.push({
    nombre: libre ? null : nombre,
    nino: /^(s[ií]|x|1|true|niñ[oa])$/i.test(valor('nino')),
    libre,
  })
  pasesCsv.set(pase, datos)
})

if (errores.length) salir(`Revisa ${archivoCsv}:\n  ${errores.join('\n  ')}`)
if (!pasesCsv.size) salir(`${archivoCsv} no tiene invitados.`)

// ── Evento ──────────────────────────────────────────────────────────────────

const d1 = crearD1(local)
const [evento] = d1.consultar(`SELECT slug, fotos, rsvp_cierra_en FROM eventos WHERE slug = ${sql(slug)}`)

let token = null
if (!evento) {
  const festejados = tokenFestejados()
  token = festejados.token
  // Sólo RSVP: sin fotos. El código de fotos se genera igual por si después
  // se activan (npm run fotos:alta conserva este token).
  d1.consultar(
    `INSERT INTO eventos (slug, nombre, codigo, admin_hash, fotos, rsvp_cierra_en)
     VALUES (${[slug, nombreEvento, codigoAleatorio(6), festejados.hash].map(sql).join(', ')}, 0, ${sql(cierra?.toISOString())})`,
  )
} else if (cierra) {
  d1.consultar(`UPDATE eventos SET rsvp_cierra_en = ${sql(cierra.toISOString())} WHERE slug = ${sql(slug)}`)
}
const cierraFinal = cierra ?? (evento?.rsvp_cierra_en ? new Date(evento.rsvp_cierra_en) : null)

// ── Pases nuevos ────────────────────────────────────────────────────────────

const existentes = d1.consultar(`SELECT nombre, codigo FROM pases WHERE slug = ${sql(slug)}`)
const nombresExistentes = new Set(existentes.map((p) => p.nombre))
const codigosUsados = new Set(existentes.map((p) => p.codigo))

const nuevos = [...pasesCsv].filter(([nombre]) => !nombresExistentes.has(nombre))
const repetidos = [...pasesCsv.keys()].filter((nombre) => nombresExistentes.has(nombre))

if (nuevos.length) {
  const sentencias = nuevos.flatMap(([nombre, { telefono, personas }]) => {
    let codigo
    do codigo = codigoAleatorio(LARGO_CODIGO)
    while (codigosUsados.has(codigo))
    codigosUsados.add(codigo)

    const paseId = `(SELECT id FROM pases WHERE slug = ${sql(slug)} AND codigo = ${sql(codigo)})`
    return [
      `INSERT INTO pases (slug, codigo, nombre, telefono) VALUES (${[slug, codigo, nombre, telefono || null].map(sql).join(', ')});`,
      ...personas.map(
        (p, i) =>
          `INSERT INTO personas (pase_id, orden, nombre, es_nino, es_libre) VALUES (${paseId}, ${i + 1}, ${sql(p.nombre)}, ${p.nino ? 1 : 0}, ${p.libre ? 1 : 0});`,
      ),
    ]
  })

  // Por archivo: con cientos de invitados no cabe en un solo --command.
  const temporal = await mkdtemp(path.join(tmpdir(), 'rsvp-'))
  const archivoSql = path.join(temporal, 'pases.sql')
  await writeFile(archivoSql, sentencias.join('\n'))
  try {
    d1.ejecutarArchivo(archivoSql)
  } finally {
    await rm(temporal, { recursive: true, force: true })
  }
}

// ── Enlaces (todos los pases, no sólo los nuevos) ───────────────────────────

const pases = d1.consultar(`SELECT id, nombre, codigo, telefono FROM pases WHERE slug = ${sql(slug)} ORDER BY id`)
const personas = d1.consultar(
  `SELECT personas.pase_id, personas.nombre, personas.es_nino, personas.es_libre FROM personas
   JOIN pases ON pases.id = personas.pase_id WHERE pases.slug = ${sql(slug)} ORDER BY personas.pase_id, personas.orden`,
)
const porPase = Map.groupBy(personas, (p) => p.pase_id)

const describir = (p) => (p.es_libre ? 'un acompañante' : p.es_nino ? `${p.nombre} (niño/a)` : p.nombre)
const lista = (nombres) => (nombres.length > 1 ? `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}` : nombres[0])
const fechaLimite = cierraFinal
  ? new Intl.DateTimeFormat('es-MX', { timeZone: 'America/Mexico_City', dateStyle: 'long' }).format(
      new Date(cierraFinal.getTime() - 1),
    )
  : null

const csvCampo = (v) => (/[",\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v)
const lineas = [['pase', 'personas', 'telefono', 'enlace', 'whatsapp']]
for (const pase of pases) {
  const enlace = `${sitio.url}?i=${pase.codigo}`
  const quienes = lista((porPase.get(pase.id) ?? []).map(describir))
  const mensaje = [
    `¡Hola, ${pase.nombre}! 💌`,
    `Te compartimos la invitación a ${nombreEvento}.`,
    `Pase para: ${quienes}.`,
    `Confirma tu asistencia aquí${fechaLimite ? ` antes del ${fechaLimite}` : ''}:`,
    enlace,
  ].join('\n')
  const whatsapp = `https://wa.me/${pase.telefono ?? ''}?text=${encodeURIComponent(mensaje)}`
  lineas.push([pase.nombre, quienes, pase.telefono ?? '', enlace, whatsapp])
}

// En --local con otro nombre: una prueba nunca pisa los enlaces reales.
const salida = path.join(sitio.dir, 'assets-origen', local ? 'rsvp-enlaces.local.csv' : 'rsvp-enlaces.csv')
await mkdir(path.dirname(salida), { recursive: true })
// BOM para que Excel lo abra con acentos.
await writeFile(salida, `﻿${lineas.map((l) => l.map(csvCampo).join(',')).join('\n')}\n`)

// ── Resumen ─────────────────────────────────────────────────────────────────

const personasNuevas = nuevos.reduce((total, [, p]) => total + p.personas.length, 0)
const plural = (n, palabra) => `${n} ${palabra}${n === 1 ? '' : 's'}`
const modoPases = rsvpConPases(sitio.dir)

console.log(`
✓ RSVP de ${nombreEvento}${local ? '  (base LOCAL)' : ''}

  Pases nuevos:  ${nuevos.length}  (${plural(personasNuevas, 'persona')})
  Ya existían:   ${repetidos.length}${repetidos.length ? '  (sin cambios: sus enlaces ya se enviaron)' : ''}
  Total:         ${plural(pases.length, 'pase')} · ${plural(personas.length, 'persona')}
  Fecha límite:  ${cierraFinal ? formatoMx.format(new Date(cierraFinal.getTime() - 1)) : 'sin límite (usa --cierra o rsvp.cierra)'}

  Enlaces y mensajes de WhatsApp: ${path.relative(root, salida)}
${
  token
    ? `
  Festejados — mándales este enlace; NO se puede recuperar después:
    ${sitio.url}rsvp/#admin=${token}
`
    : `
  Festejados: usan su enlace de siempre (el de fotos sirve cambiando /fotos/ por /rsvp/).
`
}${
  modoPases
    ? ''
    : `
  ⚠ rsvp.modo no está en 'pases' en sites/${slug}/src/event.config.js: la
    invitación no mostrará la confirmación con pases hasta que lo cambies.
`
}`)
