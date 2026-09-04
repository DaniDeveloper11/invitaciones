#!/usr/bin/env node
// Construye TODAS las invitaciones en un solo sitio para GitHub Pages:
//   dist/<slug>/  →  https://<usuario>.github.io/<repo>/<slug>/
// y genera un índice con enlaces a cada una.
//
// Para desplegar cada invitación por separado (Vercel, Netlify, etc.)
// no necesitas este script: usa `npm run build -w <slug>`.

import { execFileSync } from 'node:child_process'
import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const salida = path.join(root, 'dist')

// En GitHub Pages de proyecto el sitio vive en /<repo>/; con dominio propio, en /.
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]
const prefijo = process.env.PAGES_PREFIX ?? (repo ? `/${repo}` : '')

const entradas = await readdir(path.join(root, 'sites'), { withFileTypes: true })
const sitios = entradas.filter((e) => e.isDirectory()).map((e) => e.name)

await rm(salida, { recursive: true, force: true })
await mkdir(salida, { recursive: true })

for (const slug of sitios) {
  const base = `${prefijo}/${slug}/`
  console.log(`\n▸ ${slug}  (base ${base})`)
  execFileSync('npm', ['run', 'build', '-w', slug], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, BASE_PATH: base },
  })
  await cp(path.join(root, 'sites', slug, 'dist'), path.join(salida, slug), { recursive: true })
}

const enlaces = sitios.map((slug) => `      <li><a href="${prefijo}/${slug}/">${slug}</a></li>`).join('\n')
await writeFile(
  path.join(salida, 'index.html'),
  `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex" />
    <title>Invitaciones</title>
    <style>
      body { font-family: system-ui, sans-serif; background: #f0ece4; color: #1a1a1a; margin: 0; padding: 4rem 1.5rem; }
      main { max-width: 32rem; margin: 0 auto; }
      h1 { font-weight: 500; letter-spacing: 0.2em; text-transform: uppercase; font-size: 0.75rem; color: #1a1a1a99; }
      ul { list-style: none; padding: 0; margin: 2rem 0 0; }
      li + li { margin-top: 0.75rem; }
      a { display: block; padding: 1rem; border: 1px solid #1a1a1a26; color: inherit; text-decoration: none; }
      a:hover { border-color: #1a1a1a; }
    </style>
  </head>
  <body>
    <main>
      <h1>Invitaciones</h1>
      <ul>
${enlaces}
      </ul>
    </main>
  </body>
</html>
`,
)

console.log(`\n✓ ${sitios.length} invitación(es) en dist/`)
