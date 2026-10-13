-- Fotos de invitados: un evento por invitación y sus fotos.
-- Las fechas se guardan como texto ISO en UTC (2026-10-10T06:00:00.000Z), el
-- mismo formato que Date#toISOString, así que se pueden comparar como texto.

CREATE TABLE eventos (
  slug       TEXT PRIMARY KEY,               -- carpeta en sites/ (first-comunion-victoria)
  nombre     TEXT NOT NULL,
  codigo     TEXT NOT NULL,                  -- código de invitados (va en el QR)
  admin_hash TEXT NOT NULL,                  -- SHA-256 (hex) del token de los festejados
  abre_en    TEXT,                           -- inicio de la subida; NULL = ya abierta
  cierra_en  TEXT,                           -- fin de la subida; NULL = sin cierre
  max_fotos  INTEGER NOT NULL DEFAULT 2000,
  creado     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE fotos (
  id       TEXT PRIMARY KEY,                 -- UUID; en R2: <slug>/<id> y <slug>/<id>.thumb
  slug     TEXT NOT NULL REFERENCES eventos(slug) ON DELETE CASCADE,
  autor    TEXT,
  mensaje  TEXT,
  tipo     TEXT NOT NULL,                    -- image/webp o image/jpeg
  ancho    INTEGER,
  alto     INTEGER,
  bytes    INTEGER NOT NULL,
  oculta   INTEGER NOT NULL DEFAULT 0,       -- 1 = la ocultaron los festejados
  ip_hash  TEXT,
  creada   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX fotos_slug_creada ON fotos (slug, creada DESC, id DESC);
