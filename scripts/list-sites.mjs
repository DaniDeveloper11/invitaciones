#!/usr/bin/env node
// Lista las invitaciones del monorepo con su fecha de evento.
import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const sitesDir = path.join(root, 'sites')

const entradas = await readdir(sitesDir, { withFileTypes: true })
const sitios = entradas.filter((e) => e.isDirectory())

if (!sitios.length) {
  console.log('No hay invitaciones todavía. Crea una con: npm run new -- <slug>')
  process.exit(0)
}

for (const sitio of sitios) {
  let fecha = '—'
  try {
    const config = await readFile(path.join(sitesDir, sitio.name, 'src', 'event.config.js'), 'utf8')
    fecha = config.match(/fecha:\s*'([^']+)'/)?.[1] ?? '—'
  } catch {
    // Sitio sin config: lo listamos igual.
  }
  console.log(`  ${sitio.name.padEnd(28)} ${fecha}`)
}
