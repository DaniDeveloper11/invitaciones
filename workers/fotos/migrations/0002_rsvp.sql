-- Confirmación de asistencia (RSVP) con pases: los festejados definen la
-- lista (quiénes forman cada pase) y cada pase confirma con su propio enlace
-- marcando quién asiste. Mismas convenciones de fechas que 0001.

-- Cada servicio tiene su interruptor: un evento dado de alta sólo para RSVP
-- no debe aceptar fotos. Los eventos que ya existen son de fotos.
ALTER TABLE eventos ADD COLUMN fotos INTEGER NOT NULL DEFAULT 1;
ALTER TABLE eventos ADD COLUMN rsvp_cierra_en TEXT;   -- fecha límite; NULL = sin límite

CREATE TABLE pases (
  id             INTEGER PRIMARY KEY,
  slug           TEXT NOT NULL REFERENCES eventos(slug) ON DELETE CASCADE,
  codigo         TEXT NOT NULL,              -- va en el enlace: /?i=<codigo>
  nombre         TEXT NOT NULL,              -- "Familia Pérez"
  telefono       TEXT,                       -- para mandarle el enlace o un recordatorio
  mensaje        TEXT,                       -- nota del invitado para los festejados
  respondido_en  TEXT,                       -- primera respuesta; NULL = pendiente
  actualizado_en TEXT,                       -- última vez que cambió su respuesta
  creado         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (slug, codigo)
);

CREATE TABLE personas (
  id       INTEGER PRIMARY KEY,
  pase_id  INTEGER NOT NULL REFERENCES pases(id) ON DELETE CASCADE,
  orden    INTEGER NOT NULL,                 -- orden en la lista del pase
  nombre   TEXT,                             -- en un lugar libre lo escribe el invitado
  es_nino  INTEGER NOT NULL DEFAULT 0,
  es_libre INTEGER NOT NULL DEFAULT 0,       -- 1 = "+ acompañante" sin nombre definido
  asiste   INTEGER                           -- NULL = sin responder · 1 = sí · 0 = no
);

CREATE INDEX pases_slug ON pases (slug, nombre);
CREATE INDEX personas_pase ON personas (pase_id, orden);
