#!/usr/bin/env node
// Crea una invitación nueva copiando templates/base en sites/<slug>.
// Es una carpeta más del monorepo: se publica añadiéndola a
// terraform/sites.tf (ver README).
//
//   npm run new -- boda-ana-y-luis --titulo "Ana & Luis"
//
// Después:  npm install && npm run dev -w boda-ana-y-luis

import { cp, readFile, writeFile, access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const args = process.argv.slice(2)

const slug = args.find((a) => !a.startsWith('--'))
const tituloIndex = args.indexOf('--titulo')
const titulo = tituloIndex !== -1 ? args[tituloIndex + 1] : null

if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
  console.error('Uso: npm run new -- <slug-en-minusculas> [--titulo "Texto"]')
  console.error('Ej.: npm run new -- boda-ana-y-luis --titulo "Ana & Luis"')
  process.exit(1)
}

const destino = path.join(root, 'sites', slug)

const existe = await access(destino).then(
  () => true,
  () => false,
)
if (existe) {
  console.error(`Ya existe sites/${slug}`)
  process.exit(1)
}

await cp(path.join(root, 'templates', 'base'), destino, { recursive: true })

const reemplazos = [
  ['package.json', { __SLUG__: slug }],
  ['src/event.config.js', { __TITULO__: titulo || slug }],
  ['index.html', { '<title>Invitación</title>': `<title>${titulo || slug}</title>`, __TITULO__: titulo || slug }],
  ['fotos/index.html', { __TITULO__: titulo || slug }],
]

for (const [archivo, pares] of reemplazos) {
  const ruta = path.join(destino, archivo)
  let contenido = await readFile(ruta, 'utf8')
  for (const [de, a] of Object.entries(pares)) contenido = contenido.replaceAll(de, a)
  await writeFile(ruta, contenido)
}

console.log(`
✓ Creada sites/${slug}

  1. npm install                     (enlaza el nuevo workspace)
  2. npm run dev -w ${slug}
  3. Edita sites/${slug}/src/event.config.js y pon tus fotos en
     sites/${slug}/public/images/ (hero.webp, gallery/, dresscode/)
  4. Pon su dirección definitiva en sites/${slug}/.env (VITE_SITE_URL):
     de ahí salen las etiquetas Open Graph de la vista previa de WhatsApp.

  Para publicarla, añádela a terraform/sites.tf y aplica:
     "${slug}" = { subdominio = "..." }
     cd terraform && source .env.local && terraform apply
`)
