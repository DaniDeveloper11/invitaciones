# Invitaciones

Monorepo para crear invitaciones digitales (cumpleaños, bodas, XV, aniversarios…).
Cada invitación vive en `sites/<slug>/`, es un **proyecto Vite independiente con su
propio repositorio** (un submódulo de este) y se despliega por separado, pero todas
comparten los mismos componentes y el mismo tema.

**Stack:** Vite · Alpine.js · Tailwind CSS v4 · npm workspaces · submódulos de git.

```
invitaciones/
├── packages/core/          Componentes Alpine, tema Tailwind y config de Vite compartidos
├── templates/base/         Plantilla que se copia al crear una invitación nueva
├── sites/                  Cada subcarpeta es un submódulo (repo propio)
│   ├── cumple-40/          Una invitación (proyecto Vite independiente)
│   └── boda-demo/          Otra invitación
└── scripts/                Generador de invitaciones y build para GitHub Pages
```

## Empezar

```bash
git clone --recurse-submodules <url-del-repo>   # sin esto, sites/ llega vacío
npm install
npm run dev -w cumple-40      # http://localhost:5173
```

Si ya clonaste sin submódulos: `git submodule update --init --recursive`.

## Trabajar con los submódulos

La raíz no guarda los archivos de cada invitación, sólo un puntero al commit del repo
de esa invitación. Así que un cambio en un sitio se commitea **dos veces**:

```bash
git -C sites/<slug> commit -am "Fecha y lugar definitivos"
git -C sites/<slug> push
git commit -am "sites/<slug>: fecha y lugar"   # en la raíz, mueve el puntero
```

Comandos útiles: `git submodule status` (en qué commit está cada invitación),
`git submodule update --remote` (traer lo último de cada repo),
`git submodule foreach git status -s` (ver cambios sin commitear en todas).

## Crear una invitación nueva

```bash
npm run new -- boda-ana-y-luis --titulo "Ana & Luis"
npm install                   # enlaza el nuevo workspace
npm run dev -w boda-ana-y-luis
```

El generador crea la carpeta, inicializa su repositorio (rama `main`, primer commit,
`origin` en `https://github.com/DaniDeveloper11/<slug>.git`) y lo registra como
submódulo. El repo remoto hay que crearlo a mano en GitHub y después:
`git -C sites/<slug> push -u origin main`. Para otro dueño de los repos:
`--owner <cuenta>` o la variable `REPOS_OWNER`.

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

Cada sitio se publica por separado. La receta que funciona en cualquier plataforma
es construir desde la raíz del repo (para que npm workspaces resuelva `@invitaciones/core`):

| Ajuste             | Valor                      |
| ------------------ | -------------------------- |
| Install command    | `npm ci`                   |
| Build command      | `npm run build -w <slug>`  |
| Output / publish   | `sites/<slug>/dist`        |

- **Vercel:** deja *Root Directory* en la raíz y usa esos comandos. Un proyecto de
  Vercel por invitación, todos apuntando a este repo; activa la opción de submódulos
  para que `sites/` se descargue (o apunta el proyecto al repo de la invitación).
- **Netlify:** *Base directory* vacío, *Build command* `npm run build -w <slug>`,
  *Publish directory* `sites/<slug>/dist`.
- **Subdirectorio** (cuando la invitación no vive en la raíz del dominio):
  `BASE_PATH=/mi-invitacion/ npm run build -w <slug>`.
- **GitHub Pages:** el workflow `.github/workflows/pages.yml` publica *todas* las
  invitaciones juntas en `/<repo>/<slug>/` con un índice; hace `checkout` con
  `submodules: recursive`, y para repos privados necesita un token con acceso a ellos.
  Localmente: `npm run build:pages`.

## Notas

- Los datos de contacto (WhatsApp) y las fotos viven en el repo: si lo haces público,
  ten en cuenta que la invitación y sus imágenes quedan accesibles.
- Las fotos se muestran en blanco y negro por CSS (`grayscale`); súbelas a color y
  quita esa clase si las quieres en color.
