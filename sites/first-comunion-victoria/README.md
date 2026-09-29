# Invitación

Proyecto Vite independiente dentro del monorepo `invitaciones`.

```bash
npm run dev -w <slug>      # desarrollo
npm run build -w <slug>    # build a dist/
```

- **`src/event.config.js`** — todos los datos: textos, fecha, lugar, dress code,
  RSVP, música. Es lo único que necesitas editar.
- **`.env`** — `VITE_SITE_URL`: la dirección pública donde se publica (absoluta,
  con `https://` y terminada en `/`). Vite la inyecta en las etiquetas Open Graph
  de `index.html`, que son las que arman la vista previa de WhatsApp. La imagen
  de esa vista previa es `public/images/og.jpg` (1200×630).
- **`public/`** — `images/hero.webp`, `images/gallery/*.webp`,
  `images/dresscode/*.webp`, `audio/song.mp3`.
- **`src/style.css`** — colores y tipografías propias de esta invitación.
- **`index.html`** — maquetación. No contiene datos: los lee de `$store.event`.
