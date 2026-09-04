import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

/**
 * Configuración base de Vite para cada invitación.
 *
 * Cada sitio de sites/ es un proyecto Vite independiente: se puede correr con
 * `npm run dev -w <slug>` y desplegar por separado (Vercel, Netlify, Pages...).
 *
 * `base` se toma de la variable de entorno BASE_PATH cuando existe, para poder
 * publicar el sitio en un subdirectorio (ej. GitHub Pages: /mi-invitacion/).
 *
 * @param {import('vite').UserConfig} [overrides] Ajustes propios del sitio.
 */
export function defineInvitationConfig(overrides = {}) {
  const { plugins = [], ...rest } = overrides

  return defineConfig({
    base: process.env.BASE_PATH || '/',
    plugins: [tailwindcss(), ...plugins],
    build: {
      target: 'es2020',
      assetsInlineLimit: 0,
    },
    ...rest,
  })
}

export default defineInvitationConfig
