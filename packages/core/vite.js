import { existsSync } from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { fotosHabilitadas, rsvpConPases } from './fotos-config.js'

/**
 * Configuración base de Vite para cada invitación.
 *
 * Cada sitio de sites/ es un proyecto Vite independiente: se puede correr con
 * `npm run dev -w <slug>` y desplegar por separado (Vercel, Netlify, Pages...).
 *
 * `base` se toma de la variable de entorno BASE_PATH cuando existe, para poder
 * publicar el sitio en un subdirectorio (ej. GitHub Pages: /mi-invitacion/).
 *
 * Páginas aparte, que sólo se publican si el evento las usa (en `vite dev` se
 * sirven igual, pero avisan que el evento no tiene ese servicio):
 *   fotos/index.html  fotos de invitados, con `fotosInvitados.habilitado: true`
 *   rsvp/index.html   panel de festejados del RSVP, con `rsvp.modo: 'pases'`
 *
 * @param {import('vite').UserConfig} [overrides] Ajustes propios del sitio.
 */
export function defineInvitationConfig(overrides = {}) {
  const { plugins = [], ...rest } = overrides
  // npm run <script> -w <slug> se ejecuta dentro de sites/<slug>/.
  const raiz = process.cwd()
  const pagina = (nombre) => path.join(raiz, nombre, 'index.html')
  const extras = {
    ...(existsSync(pagina('fotos')) && fotosHabilitadas(raiz) && { fotos: pagina('fotos') }),
    ...(existsSync(pagina('rsvp')) && rsvpConPases(raiz) && { rsvp: pagina('rsvp') }),
  }

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
      ...(Object.keys(extras).length && {
        rolldownOptions: { input: { main: path.join(raiz, 'index.html'), ...extras } },
      }),
    },
    ...rest,
  })
}

export default defineInvitationConfig
