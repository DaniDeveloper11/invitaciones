#!/usr/bin/env node
// Crea una invitación nueva copiando templates/base en sites/<slug>.
// Cada invitación es su propio repositorio, registrado en la raíz como submódulo.
//
//   npm run new -- boda-ana-y-luis --titulo "Ana & Luis"
//
// Después:  npm install && npm run dev -w boda-ana-y-luis

import { execFileSync } from 'node:child_process'
import { cp, readFile, writeFile, access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const args = process.argv.slice(2)

const slug = args.find((a) => !a.startsWith('--'))
const tituloIndex = args.indexOf('--titulo')
const titulo = tituloIndex !== -1 ? args[tituloIndex + 1] : null

// Dueño de los repos por invitación (uno por sitio). Se puede cambiar con
// --owner <cuenta> o con la variable de entorno REPOS_OWNER.
const ownerIndex = args.indexOf('--owner')
const owner =
  (ownerIndex !== -1 ? args[ownerIndex + 1] : null) ?? process.env.REPOS_OWNER ?? 'DaniDeveloper11'

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
  ['index.html', { '<title>Invitación</title>': `<title>${titulo || slug}</title>` }],
]

for (const [archivo, pares] of reemplazos) {
  const ruta = path.join(destino, archivo)
  let contenido = await readFile(ruta, 'utf8')
  for (const [de, a] of Object.entries(pares)) contenido = contenido.replaceAll(de, a)
  await writeFile(ruta, contenido)
}

const git = (args, cwd = root) => execFileSync('git', args, { cwd, stdio: 'pipe' })

// La invitación es un repositorio propio...
const url = `https://github.com/${owner}/${slug}.git`
git(['init', '-b', 'main', '-q'], destino)
git(['remote', 'add', 'origin', url], destino)
git(['add', '-A'], destino)
git(['commit', '-q', '-m', `Invitación ${slug}`], destino)

// ...y en la raíz queda sólo el puntero al commit (submódulo).
git(['submodule', 'add', '-q', url, `sites/${slug}`])

console.log(`
✓ Creada sites/${slug}  (repo propio + submódulo en la raíz)

  1. npm install                     (enlaza el nuevo workspace)
  2. npm run dev -w ${slug}
  3. Edita sites/${slug}/src/event.config.js y pon tus fotos en
     sites/${slug}/public/images/ (hero.webp, gallery/, dresscode/)

  El repo remoto todavía no existe. Créalo como ${owner}/${slug} y luego:
     git -C sites/${slug} push -u origin main
     git commit -m 'Añade la invitación ${slug}'   (en la raíz, guarda el puntero)
`)
