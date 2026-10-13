import { existsSync } from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { fotosHabilitadas } from './fotos-config.js'

/**
 * Configuración base de Vite para cada invitación.
 *
 * Cada sitio de sites/ es un proyecto Vite independiente: se puede correr con
 * `npm run dev -w <slug>` y desplegar por separado (Vercel, Netlify, Pages...).
 *
 * `base` se toma de la variable de entorno BASE_PATH cuando existe, para poder
 * publicar el sitio en un subdirectorio (ej. GitHub Pages: /mi-invitacion/).
 *
 * La página de fotos de invitados (`fotos/index.html`) sólo se publica si
 * `fotosInvitados.habilitado` es true en src/event.config.js. En `vite dev` se
 * sirve igual, pero la página avisa que el evento no tiene álbum.
 *
 * @param {import('vite').UserConfig} [overrides] Ajustes propios del sitio.
 */
export function defineInvitationConfig(overrides = {}) {
  const { plugins = [], ...rest } = overrides
  // npm run <script> -w <slug> se ejecuta dentro de sites/<slug>/.
  const raiz = process.cwd()
  const paginaFotos = path.join(raiz, 'fotos', 'index.html')

  return defineConfig({
    base: process.env.BASE_PATH || '/',
    plugins: [tailwindcss(), ...plugins],
    define: {
      // El slug identifica el evento en la API de fotos (event.fotosInvitados.slug).
      'import.meta.env.VITE_INVITACION_SLUG': JSON.stringify(path.basename(raiz)),
    },
    build: {
      target: 'es2020',
      assetsInlineLimit: 0,
      ...(existsSync(paginaFotos) &&
        fotosHabilitadas(raiz) && {
          rolldownOptions: {
            input: { main: path.join(raiz, 'index.html'), fotos: paginaFotos },
          },
        }),
    },
    ...rest,
  })
}

export default defineInvitationConfig
