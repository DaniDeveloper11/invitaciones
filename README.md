# Invitaciones

Monorepo para crear invitaciones digitales (cumpleaños, bodas, XV, aniversarios…).
Cada invitación vive en `sites/<slug>/`, es un proyecto Vite independiente y se
publica en su propio dominio, pero todas comparten los mismos componentes y el
mismo tema.

**Stack:** Vite · Alpine.js · Tailwind CSS v4 · npm workspaces · Cloudflare Pages.

```
invitaciones/
├── packages/core/          Componentes Alpine, tema Tailwind y config de Vite compartidos
├── templates/base/         Plantilla que se copia al crear una invitación nueva
├── sites/                  Una carpeta por invitación (proyecto Vite independiente)
│   └── first-comunion-victoria/
└── scripts/                Generador de invitaciones
```

## Empezar

```bash
git clone <url-del-repo>
npm install
npm run dev -w first-comunion-victoria      # http://localhost:5173
```

Todo se corre **desde la raíz** (`-w <slug>`): es lo que hace que npm workspaces
resuelva `@invitaciones/core`. Dentro de `sites/<slug>/` un `npm install` falla,
porque ese paquete es privado y no está publicado en npm.

## Crear una invitación nueva

```bash
npm run new -- boda-ana-y-luis --titulo "Ana & Luis"
npm install                   # enlaza el nuevo workspace
npm run dev -w boda-ana-y-luis
```

Copia `templates/base/` en `sites/<slug>/`. Es una carpeta más del repo: para
publicarla, crea un proyecto de Cloudflare Pages que apunte a ella (ver más abajo).

Después sólo hay dos cosas que tocar:

1. **`sites/<slug>/src/event.config.js`** — todos los textos, la fecha, el lugar,
   el dress code, las opciones de RSVP y la paleta. `index.html` no contiene datos:
   los lee de aquí con `$store.event`.
2. **`sites/<slug>/public/`** — los archivos:
   - `images/hero.webp` — retrato a pantalla completa (mín. 1200×1600px)
   - `images/gallery/1.webp`, `2.webp`, … — galería
   - `images/dresscode/1.webp`, … — ejemplos de vestimenta
   - `audio/song.mp3` — música de fondo

   El número de fotos se declara en el config: `photos('gallery', 10)`.

Comandos por invitación (`-w <slug>`): `dev`, `build`, `preview`.
`npm run list` muestra las invitaciones con su fecha.

## Qué trae cada invitación

Portada con parallax · cuenta regresiva en vivo · fecha y hora formateadas solas ·
mensaje personal · lugar con enlace a Google Maps · dress code con paleta y visor de
ejemplos · galería con lightbox · confirmación de asistencia por WhatsApp ·
música de fondo · animaciones al hacer scroll (`x-reveal`).

Las secciones se ocultan solas cuando no las configuras: sin `whatsapp` no hay RSVP,
sin fotos no hay galería, sin `dresscode.titulo` no hay dress code, sin `musica.src`
no hay reproductor.

## Personalizar el diseño

- **Colores y tipografías:** descomenta el bloque `@theme` en
  `sites/<slug>/src/style.css` — sobrescribe el tema de `packages/core`.
- **Maquetación:** edita `sites/<slug>/index.html`. Es sólo HTML + Tailwind, y cada
  sitio tiene el suyo, así que puedes cambiarlo sin afectar a las demás invitaciones.
- **Componentes compartidos:** `packages/core/src/` (cuenta regresiva, galería,
  RSVP, reproductor, directiva `x-reveal`, store de scroll). Lo que cambies aquí
  afecta a todas las invitaciones.

## Desplegar una invitación

Cada invitación se publica como un **proyecto de Cloudflare Pages** apuntando a
este mismo repositorio. Varios proyectos pueden compartir el repo: lo que cambia
entre ellos es el build y la carpeta de salida.

| Ajuste                  | Valor                                  |
| ----------------------- | -------------------------------------- |
| Root directory          | *(vacío: la raíz del repo)*            |
| Build command           | `npm run build -w <slug>`              |
| Build output directory  | `sites/<slug>/dist`                    |

El *root directory* tiene que ser la raíz **del repo**, no `sites/<slug>/`: es lo
que permite que npm workspaces resuelva `@invitaciones/core`. Apuntarlo a la
carpeta de la invitación da `404 @invitaciones/core`, porque ese paquete es
privado y no está publicado en npm.

Alta de una invitación, una sola vez:

1. **Proyecto:** en Cloudflare Pages, *Create* → *Connect to Git* → este repo, con
   los ajustes de la tabla. Cada proyecto necesita un nombre distinto.
2. **Sólo reconstruir lo que cambió** (opcional, recomendado cuando hay varias):
   en *Settings → Build → Build watch paths*, incluye `sites/<slug>/*`,
   `packages/*` y `package.json`.
3. **Dominio:** *Custom domains* → *Set up a domain* → `<subdominio>.evento.casa`.
   Como el DNS vive en Cloudflare, el registro y el certificado se crean solos.
4. **`.env`:** pon esa misma dirección en `sites/<slug>/.env` (`VITE_SITE_URL`),
   que es de donde salen las etiquetas Open Graph de la vista previa de WhatsApp.

A partir de ahí, cada push a `main` republica las invitaciones afectadas.

La versión de Node la fija `.node-version` en la raíz.

## Notas

- Los datos de contacto (WhatsApp) y las fotos viven en el repo: si lo haces público,
  ten en cuenta que la invitación y sus imágenes quedan accesibles.
- Las fotos se muestran en blanco y negro por CSS (`grayscale`); súbelas a color y
  quita esa clase si las quieres en color.
