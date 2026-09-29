#!/usr/bin/env node
// Publica CADA invitación en su propio repositorio, para que cada una pueda
// tener su dominio propio:
//
//   sites/<slug>  →  rama gh-pages de github.com/<owner>/<slug>  →  https://<dominio>/
//
// A diferencia de build-pages.mjs (que junta todas las invitaciones en un solo
// sitio bajo /<repo>/<slug>/), aquí cada invitación se construye en la raíz
// (BASE_PATH=/) porque vive sola en su dominio.
//
//   node scripts/deploy-sites.mjs --dry-run    # construye y no publica
//   node scripts/deploy-sites.mjs              # construye y publica
//   node scripts/deploy-sites.mjs <slug> ...   # sólo esas invitaciones
//
// Para publicar necesita SITES_DEPLOY_TOKEN: un token con permiso de escritura
// sobre los repos de las invitaciones (en CI, un secreto del repo).
//
// El dominio de cada invitación NO se configura aquí: sale de VITE_SITE_URL en
// sites/<slug>/.env, que ya es la única fuente de verdad para las etiquetas
// Open Graph. De ahí se deriva el archivo CNAME que GitHub Pages necesita.

import { execFileSync } from 'node:child_process'
import { mkdtemp, readdir, readFile, writeFile, cp, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import path from 'node:path'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const soloEstos = args.filter((a) => !a.startsWith('--'))

const token = process.env.SITES_DEPLOY_TOKEN
const sha = process.env.GITHUB_SHA?.slice(0, 7) ?? 'local'

const git = (argv, cwd = root) => execFileSync('git', argv, { cwd, stdio: 'pipe' }).toString().trim()

/** URL del repositorio de una invitación, tal como está registrada como submódulo. */
function repoDeSitio(slug) {
  try {
    return git(['config', '-f', '.gitmodules', '--get', `submodule.sites/${slug}.url`])
  } catch {
    return null
  }
}

/** VITE_SITE_URL de sites/<slug>/.env — la dirección pública de la invitación. */
async function urlDeSitio(slug) {
  const archivo = path.join(root, 'sites', slug, '.env')
  if (!existsSync(archivo)) return null
  const contenido = await readFile(archivo, 'utf8')
  const linea = contenido.match(/^\s*VITE_SITE_URL\s*=\s*(.+)$/m)
  return linea ? linea[1].trim().replace(/^['"]|['"]$/g, '') : null
}

const entradas = await readdir(path.join(root, 'sites'), { withFileTypes: true })
const todos = entradas.filter((e) => e.isDirectory()).map((e) => e.name)
const sitios = soloEstos.length ? todos.filter((s) => soloEstos.includes(s)) : todos

if (!sitios.length) {
  console.error('No hay invitaciones que publicar.')
  process.exit(1)
}

let publicados = 0
let omitidos = 0

for (const slug of sitios) {
  console.log(`\n▸ ${slug}`)

  const sitioUrl = await urlDeSitio(slug)
  if (!sitioUrl) {
    console.warn(`  ⚠ omitida: falta VITE_SITE_URL en sites/${slug}/.env`)
    omitidos++
    continue
  }

  let host
  try {
    host = new URL(sitioUrl).hostname
  } catch {
    console.warn(`  ⚠ omitida: VITE_SITE_URL no es una URL válida (${sitioUrl})`)
    omitidos++
    continue
  }

  if (host.includes('CAMBIAR-URL')) {
    console.warn(`  ⚠ omitida: VITE_SITE_URL sigue en el valor de ejemplo`)
    omitidos++
    continue
  }

  const repo = repoDeSitio(slug)
  if (!repo) {
    console.warn(`  ⚠ omitida: no está registrada como submódulo en .gitmodules`)
    omitidos++
    continue
  }

  // Vive sola en su dominio, así que se construye en la raíz.
  execFileSync('npm', ['run', 'build', '-w', slug], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, BASE_PATH: '/' },
  })

  const dist = path.join(root, 'sites', slug, 'dist')

  // CNAME: sin él, un push a gh-pages borra el dominio configurado en Settings.
  // Sólo para dominios propios; en *.github.io lo rompería.
  if (!host.endsWith('github.io')) {
    await writeFile(path.join(dist, 'CNAME'), `${host}\n`)
    console.log(`  dominio: ${host}`)
  } else {
    console.log(`  dominio: ${host} (sin CNAME)`)
  }

  // Evita que Pages pase el sitio por Jekyll.
  await writeFile(path.join(dist, '.nojekyll'), '')

  if (dryRun) {
    console.log(`  ✓ construida (--dry-run, no se publica)`)
    publicados++
    continue
  }

  if (!token) {
    console.error(`  ✗ falta SITES_DEPLOY_TOKEN para publicar en ${repo}`)
    process.exitCode = 1
    continue
  }

  // Se publica desde una copia: un repo huérfano de un solo commit por deploy,
  // para no arrastrar historia del build ni tocar el repo de trabajo.
  const tmp = await mkdtemp(path.join(tmpdir(), `deploy-${slug}-`))
  try {
    await cp(dist, tmp, { recursive: true })
    const remoto = repo.replace('https://', `https://x-access-token:${token}@`)

    git(['init', '-q', '-b', 'gh-pages'], tmp)
    git(['add', '-A'], tmp)
    git(
      [
        '-c',
        'user.name=github-actions[bot]',
        '-c',
        'user.email=41898282+github-actions[bot]@users.noreply.github.com',
        'commit',
        '-q',
        '-m',
        `Publica ${slug} (${sha})`,
      ],
      tmp,
    )
    git(['push', '-q', '--force', remoto, 'gh-pages'], tmp)
    console.log(`  ✓ publicada en ${repo} (gh-pages)`)
    publicados++
  } catch (error) {
    // El token puede aparecer en el mensaje de error de git.
    const limpio = String(error.stderr || error.message).replaceAll(token, '***')
    console.error(`  ✗ falló la publicación: ${limpio}`)
    process.exitCode = 1
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
}

console.log(`\n✓ ${publicados} invitación(es)${dryRun ? ' construida(s)' : ' publicada(s)'}${omitidos ? `, ${omitidos} omitida(s)` : ''}`)
