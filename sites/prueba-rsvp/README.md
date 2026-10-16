# Invitación

Proyecto Vite independiente dentro del monorepo `invitaciones`.

```bash
npm run dev -w <slug>      # desarrollo
npm run build -w <slug>    # build a dist/
```

- **`src/event.config.js`** — todos los datos: textos, fecha, lugar, dress code,
  RSVP, música. Es lo único que necesitas editar.
- **`public/`** — `images/hero.webp`, `images/gallery/*.webp`,
  `images/dresscode/*.webp`, `audio/song.mp3`.
- **`src/style.css`** — colores y tipografías propias de esta invitación.
- **`index.html`** — maquetación. No contiene datos: los lee de `$store.event`.
