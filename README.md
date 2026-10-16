# Invitaciones

Monorepo para crear invitaciones digitales (cumpleaños, bodas, XV, aniversarios…).
Cada invitación vive en `sites/<slug>/`, es un proyecto Vite independiente y se
publica en su propio dominio, pero todas comparten los mismos componentes y el
mismo tema.

**Stack:** Vite · Alpine.js · Tailwind CSS v4 · npm workspaces · Cloudflare Pages · Terraform.

```
invitaciones/
├── packages/core/          Componentes Alpine, tema Tailwind y config de Vite compartidos
├── templates/base/         Plantilla que se copia al crear una invitación nueva
├── sites/                  Una carpeta por invitación (proyecto Vite independiente)
│   └── first-comunion-victoria/
├── workers/fotos/          API de fotos de invitados y RSVP (Worker + D1 + R2), compartida por todas
├── scripts/                Generador de invitaciones, alta de fotos y de la lista del RSVP
└── terraform/              Infraestructura en Cloudflare (Pages, DNS, dominios, D1, R2)
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

## Guía: invitación para un cliente nuevo

Resumen de punta a punta; cada paso remite a su sección. Ejemplo: una boda.

1. **Crear la carpeta** (ver *Crear una invitación nueva*):
   ```bash
   npm run new -- boda-ana-y-luis --titulo "Ana & Luis"
   npm install
   ```
2. **Datos del cliente:**
   - `src/event.config.js` — nombres, fecha y hora (ISO), mensaje, lugar y enlace
     de Maps, dress code, confirmación (WhatsApp o pases), música, pie.
   - `.env` — `VITE_SITE_URL=https://ana-y-luis.evento.casa/` (vista previa de
     WhatsApp; `fotos:alta` también la usa).
   - `index.html` — descripción con fecha y lugar en `description` y
     `og:description` (toma la de Victoria como ejemplo).
3. **Archivos en `public/`:** portada, imagen de vista previa, galería, dress code
   y música (lista en *Crear una invitación nueva*).
4. **Diseño** (opcional): colores y fuentes en `src/style.css` y el enlace de
   Google Fonts en `index.html` (ver *Personalizar el diseño*).
5. **Revisar en local** y que el cliente apruebe: `npm run dev -w boda-ana-y-luis`.
6. **Commit y push** de `sites/boda-ana-y-luis/`.
7. **Publicar en su dominio:** entrada en `terraform/sites.tf` (con `watch_paths`)
   y `terraform apply` (ver *Desplegar una invitación*). Revisa la URL y pega el
   enlace en WhatsApp para comprobar la vista previa.
8. **Confirmación con pases** (si el cliente tiene lista de invitados):
   `rsvp.modo: 'pases'`, push y `npm run rsvp:alta -- boda-ana-y-luis
   invitados.csv`. Manda a cada invitado su enlace y a los festejados el de su
   panel (ver *RSVP con pases*).
9. **Fotos de invitados** (si el cliente las quiere): `fotosInvitados.habilitado:
   true`, push y `npm run fotos:alta -- boda-ana-y-luis`. Imprime el QR para las
   mesas y manda a los festejados su enlace (ver *Fotos de invitados*).
10. **Después del evento:** los festejados descargan su ZIP y su lista; luego
    puedes borrar el evento (ver *Fotos de invitados → Después del evento*).

## Crear una invitación nueva

```bash
npm run new -- boda-ana-y-luis --titulo "Ana & Luis"
npm install                   # enlaza el nuevo workspace
npm run dev -w boda-ana-y-luis
```

Copia `templates/base/` en `sites/<slug>/`. Es una carpeta más del repo: para
publicarla, añádela a `terraform/sites.tf` (ver *Desplegar una invitación*).

Después sólo hay dos cosas que tocar:

1. **`sites/<slug>/src/event.config.js`** — todos los textos, la fecha, el lugar,
   el dress code, las opciones de RSVP y la paleta. `index.html` no contiene datos:
   los lee de aquí con `$store.event`.
2. **`sites/<slug>/public/`** — los archivos:
   - `images/hero.webp` — retrato a pantalla completa (mín. 1200×1600px)
   - `images/og.jpg` — vista previa al compartir (JPG 1200×630, menos de 300 KB;
     WhatsApp descarta WebP)
   - `images/gallery/1.webp`, `2.webp`, … — galería
   - `images/dresscode/1.webp`, … — ejemplos de vestimenta
   - `audio/song.mp3` — música de fondo

   El número de fotos se declara en el config: `photos('gallery', 10)`.

Comandos por invitación (`-w <slug>`): `dev`, `build`, `preview`.
`npm run list` muestra las invitaciones con su fecha.

## Qué trae cada invitación

Portada con parallax · cuenta regresiva en vivo · fecha y hora formateadas solas ·
mensaje personal · lugar con enlace a Google Maps · dress code con paleta y visor de
ejemplos · galería con lightbox · confirmación de asistencia por WhatsApp o con pases
personales (ver *RSVP con pases*) · música de fondo · animaciones al hacer scroll
(`x-reveal`) · fotos de invitados durante el evento (opcional, ver *Fotos de
invitados*).

Las secciones se ocultan solas cuando no las configuras: en modo WhatsApp, sin
`whatsapp` no hay RSVP;
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
entre ellos es el build y la carpeta de salida. Los proyectos, sus dominios y el
DNS se gestionan con **Terraform** desde `terraform/`; no hace falta tocar el
dashboard.

Esto es lo que Terraform configura en cada proyecto:

| Ajuste                  | Valor                                  |
| ----------------------- | -------------------------------------- |
| Root directory          | *(vacío: la raíz del repo)*            |
| Build command           | `npm run build -w <slug>`              |
| Build output directory  | `sites/<slug>/dist`                    |

El *root directory* tiene que ser la raíz **del repo**, no `sites/<slug>/`: es lo
que permite que npm workspaces resuelva `@invitaciones/core`. Apuntarlo a la
carpeta de la invitación da `404 @invitaciones/core`, porque ese paquete es
privado y no está publicado en npm.

### Preparación (una sola vez por máquina)

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars   # pon tu account_id de Cloudflare
cp .env.local.example .env.local               # pega tu API token
terraform init
```

El token se crea en Cloudflare → *My Profile* → *API Tokens*, con estos permisos:
*Account → Cloudflare Pages → Edit*, *Zone → DNS → Edit* y *Zone → Zone → Read*
(limitados al zone `evento.casa`). Para las fotos de invitados añade además
*Account → D1 → Edit* y *Account → Workers R2 Storage → Edit*.

### Alta de una invitación

1. **Crear la carpeta:** `npm run new -- boda-ana-y-luis --titulo "Ana & Luis"`.
2. **Declararla en `terraform/sites.tf`**, con el subdominio que quieras:
   ```hcl
   "boda-ana-y-luis" = {
     subdominio = "ana-y-luis"   # → ana-y-luis.evento.casa
   }
   ```
3. **Aplicar:**
   ```bash
   cd terraform && source .env.local
   terraform plan    # revisa: proyecto de Pages + registro CNAME + dominio
   terraform apply
   ```
   Crea el proyecto de Pages conectado al repo con los ajustes de la tabla, el
   CNAME `<subdominio>.evento.casa` (con proxy, así que el certificado se emite
   solo) y el dominio personalizado del proyecto.
4. **`.env`:** pon esa misma dirección en `sites/<slug>/.env` (`VITE_SITE_URL`),
   que es de donde salen las etiquetas Open Graph de la vista previa de WhatsApp.
   Terraform no toca las variables de entorno de los proyectos de Pages.

A partir de ahí, cada push a `main` republica las invitaciones afectadas.

**Sólo reconstruir lo que cambió** (recomendado cuando hay varias invitaciones):
por defecto cada proyecto se reconstruye con cualquier cambio del repo. Para
acotarlo, añade `watch_paths` a su entrada en `sites.tf`:

```hcl
"boda-ana-y-luis" = {
  subdominio  = "ana-y-luis"
  watch_paths = ["sites/boda-ana-y-luis/**", "packages/**", "package.json", "package-lock.json"]
}
```

**Estado de Terraform:** `terraform/terraform.tfstate` es local y no se commitea.
No lo borres: sin él, Terraform intentaría crear de nuevo todo lo que ya existe.
Si vas a trabajar desde varias máquinas, muévelo a un backend remoto (ver
`terraform/backend.tf`).

La versión de Node la fija `.node-version` en la raíz.

## Fotos de invitados

Durante el evento, los invitados escanean un QR, toman o eligen fotos con su
teléfono y se comparten al instante en un muro con los demás invitados y los
festejados. Los festejados tienen un enlace privado para ocultar o borrar fotos y
descargarlas todas en un ZIP.

```
Invitado ── <subdominio>.evento.casa/fotos/?c=CODIGO   (página de la invitación, Pages)
                │
                ▼
         api.evento.casa  (Worker, workers/fotos/) ──► D1 invitaciones      (metadatos)
                                                  └─► R2 invitaciones-fotos (archivos)
```

- **Una sola API para todas las invitaciones:** cada evento es una fila en D1 y una
  carpeta `<slug>/` en R2. La base y el bucket los crea Terraform
  (`terraform/fotos.tf`); el Worker se publica con wrangler.
- **En el teléfono:** la cámara es la nativa (`camara` en `packages/core`). Antes
  de subir, la foto se reduce a 2048 px, se le hace una miniatura y se le quitan
  los metadatos EXIF (incluida la ubicación).
- **Acceso:** invitados con el código del QR; festejados con un token largo en el
  enlace (`#admin=…`, del que en D1 sólo queda el hash).
- **Reglas:** la subida abre a las 00:00 del día del evento (hora de México) y
  cierra 3 días después; máximo 8 MB por foto, 20 subidas por minuto por persona
  y 2000 fotos por evento.
- **Un solo interruptor por invitación:** `fotosInvitados.habilitado` en
  `event.config.js`. En `false` (por defecto) no hay botón y la página `/fotos/` no
  se publica; en `true` se publica y aparece el botón "Comparte tus fotos".

### Puesta en marcha (una sola vez)

```bash
npm install --prefix workers/fotos     # wrangler
cd workers/fotos
source ../../terraform/.env.local      # mismo token que Terraform + CLOUDFLARE_ACCOUNT_ID
npm run db:migrate                     # crea las tablas en la D1 de producción
npm run deploy                         # publica el Worker en api.evento.casa
```

Lo mismo cada vez que cambie el Worker: primero `db:migrate` (sólo aplica las
migraciones nuevas de `migrations/`) y después `deploy`, para que el código
nuevo nunca corra sin sus tablas. El Worker también atiende el RSVP.

El token de wrangler necesita, además de D1 y R2, *Account → Workers Scripts →
Edit* y *Zone → Workers Routes → Edit* (para el dominio `api.evento.casa`).

### Activarlas en un evento

1. En `sites/<slug>/src/event.config.js`:
   ```js
   fotosInvitados: {
     habilitado: true,
   },
   ```
   Commit y push: se publica `/fotos/` y aparece el botón en la invitación.
2. Da de alta el evento:
   ```bash
   npm run fotos:alta -- boda-ana-y-luis
   ```
   - Calcula la ventana de subida con la `fecha` del config. Para cambiarla:
     `--abre 2026-12-05T16:00 --cierra 2026-12-09` (hora de México).
   - Guarda el QR en `sites/<slug>/assets-origen/qr-fotos.png` (ignorado por
     git: lleva el código del evento).
   - Imprime el enlace de invitados (el del QR) y el **enlace de festejados, que
     no se puede recuperar**: mándalo y guárdalo.
   - Si se pierde el enlace, `--regenerar` crea código y enlace nuevos (los
     anteriores dejan de servir y el QR impreso también; las fotos se conservan).

### Probar en local

Dos terminales: el Worker con D1 y R2 locales (no tocan producción) y la invitación.

```bash
# Primera vez
npm install --prefix workers/fotos
cd workers/fotos && npm run db:migrate:local && npm run db:seed:local

# Terminal 1
cd workers/fotos && npm run dev                                         # :8787

# Terminal 2 (desde la raíz)
VITE_FOTOS_API=http://localhost:8787 npm run dev -w first-comunion-victoria   # :5173
```

Pon `habilitado: true` en el sitio que pruebes (sin commitearlo) y abre:

| Qué        | URL                                                  |
| ---------- | ---------------------------------------------------- |
| Invitado   | http://localhost:5173/fotos/?c=DEMO23                |
| Festejados | http://localhost:5173/fotos/#admin=demo-admin-token  |

`seed.local.sql` crea eventos de prueba (`demo`, `demo-futuro`, `demo-cerrado` y
`first-comunion-victoria`) con el código `DEMO23`. Sin `VITE_FOTOS_API`, la página
intenta usar `api.evento.casa`. Las fotos de prueba se guardan en
`workers/fotos/.wrangler/`; para vaciarlas:
`npx wrangler d1 execute invitaciones --local --command "DELETE FROM fotos"`.

### Después del evento

- Los festejados descargan las fotos visibles en ZIP desde su enlace.
- Para borrar las fotos de un evento: elimínalas una por una desde el panel de
  festejados, o borra todo el evento de una vez (archivos en R2 y filas en D1):
  ```bash
  npm run fotos:borrar -- boda-ana-y-luis --simular     # sólo muestra qué borraría
  npm run fotos:borrar -- boda-ana-y-luis               # pide escribir el slug para confirmar
  npm run fotos:borrar -- boda-ana-y-luis --solo-fotos  # conserva el evento, su código, su QR y sus pases
  ```
  Sin `--solo-fotos` borra el evento completo, incluidos los pases del RSVP y sus
  respuestas (el resumen los muestra antes de confirmar).
  Usa el token de `terraform/.env.local` (no hace falta `source`). `--local`
  trabaja con la base de `wrangler dev`. No toca el sitio: para dar de baja la
  invitación, quita su entrada de `terraform/sites.tf`, `terraform apply` y
  `git rm -r sites/<slug>`.

## RSVP con pases

La confirmación de asistencia tiene dos modos (`rsvp.modo` en `event.config.js`):

- **`'whatsapp'`** (por defecto): cada opción abre WhatsApp con el mensaje escrito.
- **`'pases'`**: los festejados definen la lista de invitados y cada pase
  ("Familia Pérez") recibe **su propio enlace**. Al abrirlo, la invitación muestra
  a las personas de su pase y el invitado **marca quién asiste**; no puede agregar
  a nadie. Los festejados ven las respuestas en su panel.

```
Invitado ── <subdominio>.evento.casa/?i=CODIGO ──► api.evento.casa ──► D1 (pases, personas)
Festejados ─ <subdominio>.evento.casa/rsvp/#admin=TOKEN ─┘
```

- **Pases:** cada uno tiene sus personas, marcadas como adulto o niño, y puede
  tener lugares libres ("+ acompañante") cuyo nombre escribe el invitado.
- **Cambios:** el invitado puede cambiar su respuesta con el mismo enlace hasta la
  fecha límite (`rsvp.cierra`). La invitación recuerda su pase y quita el código
  de la barra de direcciones.
- **Sin enlace personal:** quien abra la invitación general ve "abre el enlace
  personal que te enviamos" y, si hay `whatsapp`, los botones de siempre.
- **Panel de festejados** (`/rsvp/#admin=…`, el mismo token que las fotos):
  adultos y niños que asisten, pases sin responder, filtros y búsqueda,
  recordatorio por WhatsApp para los pendientes, enlace de cada pase y CSV con
  una fila por persona para el salón.
- **Seguridad:** el código de 8 caracteres sólo abre su pase; la API limita a 60
  peticiones por minuto por persona para que no se puedan adivinar.

### Activarlo en un evento

1. En `sites/<slug>/src/event.config.js`:
   ```js
   rsvp: {
     modo: 'pases',
     cierra: '2026-11-20',   // fecha límite (hasta el final de ese día)
     // whatsapp: '52…',     // opcional: respaldo para quien no tenga enlace
   },
   ```
   Commit y push: la invitación muestra la confirmación con pases y se publica
   `/rsvp/`.
2. Arma la lista en Excel o Google Sheets y expórtala como CSV, **una fila por
   persona**; las filas con el mismo `pase` forman un pase:
   ```csv
   pase,nombre,nino,telefono
   Familia Pérez,Luis Pérez,,3312345678
   Familia Pérez,María López,,
   Familia Pérez,Sofía Pérez,sí,
   Juan Gómez,Juan Gómez,,3311112222
   Juan Gómez,+ acompañante,,
   ```
   `nino` acepta `sí`, `x` o `1`; un nombre que empieza con `+` es un lugar
   libre; el teléfono basta en una fila del pase (10 dígitos → se antepone 52).
   Guárdala en `sites/<slug>/assets-origen/` (los CSV están en `.gitignore`).
3. Carga la lista:
   ```bash
   npm run rsvp:alta -- boda-ana-y-luis sites/boda-ana-y-luis/assets-origen/invitados.csv
   ```
   - Si el evento no existe, lo da de alta sólo para RSVP e imprime el **enlace
     de festejados, que no se puede recuperar** (si ya existía por las fotos, es
     el mismo enlace cambiando `/fotos/` por `/rsvp/`).
   - Genera `assets-origen/rsvp-enlaces.csv` con el enlace de cada pase y un
     enlace de WhatsApp con la invitación ya escrita: un clic por invitado.
   - Se puede volver a correr con la lista actualizada: agrega los pases nuevos y
     no toca los existentes (sus enlaces ya se enviaron).
   - `--cierra 2026-11-20` cambia la fecha límite sin tocar el config.

Si el evento también lleva fotos, `npm run fotos:alta` las activa conservando el
enlace de festejados.

### Probar en local

Con el Worker local corriendo (ver *Fotos de invitados → Probar en local*), en un
sitio con `modo: 'pases'` sin commitear:

```bash
npm run rsvp:alta -- <slug> lista.csv --local      # escribe rsvp-enlaces.local.csv
VITE_FOTOS_API=http://localhost:8787 npm run dev -w <slug>
```

Abre `http://localhost:5173/?i=<código>` con los códigos del CSV. Para el panel,
el token se imprime al dar de alta el evento. `seed.local.sql` trae además pases
de prueba en el evento `demo` (`PEREZ234`, `ROSA2345`, `JUAN2345`) con el token
`demo-admin-token`.

## Notas

- Los datos de contacto (WhatsApp) y las fotos viven en el repo: si lo haces público,
  ten en cuenta que la invitación y sus imágenes quedan accesibles.
- Las fotos se muestran en blanco y negro por CSS (`grayscale`); súbelas a color y
  quita esa clase si las quieres en color.
- `terraform/terraform.tfvars`, `terraform/.env.local` (el token) y el estado de
  Terraform están en `.gitignore`: nunca se commitean.
- Las fotos de los invitados no viven en el repo sino en R2, y sólo se ven con el
  código del evento. La lista de invitados del RSVP vive en D1; los CSV con
  nombres y teléfonos (`assets-origen/*.csv`) nunca se commitean.
