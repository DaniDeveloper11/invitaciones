-- Datos de prueba SOLO para la base local (npm run db:seed:local).
-- Código de invitados: DEMO23 · token de festejados: demo-admin-token
-- Pases de RSVP: PEREZ234, ROSA2345, JUAN2345 (demo), CERRADO2, SOLORSVP
INSERT OR REPLACE INTO eventos (slug, nombre, codigo, admin_hash, abre_en, cierra_en)
VALUES
  ('demo',         'Evento de prueba',          'DEMO23', '91c16f0d6cc1bec3c3603972182a07c66ff4fa71618a975e963d6dbe42b6dd37', NULL, NULL),
  ('demo-futuro',  'Evento que aún no abre',    'DEMO23', '91c16f0d6cc1bec3c3603972182a07c66ff4fa71618a975e963d6dbe42b6dd37', '2099-01-01T06:00:00.000Z', NULL),
  ('demo-cerrado', 'Evento con subida cerrada', 'DEMO23', '91c16f0d6cc1bec3c3603972182a07c66ff4fa71618a975e963d6dbe42b6dd37', NULL, '2020-01-01T06:00:00.000Z');

-- La invitación de Victoria, para probar su página /fotos/ en local.
INSERT OR REPLACE INTO eventos (slug, nombre, codigo, admin_hash, abre_en, cierra_en)
SELECT 'first-comunion-victoria', 'Primera Comunión de Victoria', codigo, admin_hash, NULL, NULL
FROM eventos WHERE slug = 'demo';

-- RSVP: el evento demo-cerrado también tiene la confirmación cerrada, y
-- demo-rsvp es un evento sólo de RSVP (sin fotos).
UPDATE eventos SET rsvp_cierra_en = '2020-01-01T06:00:00.000Z' WHERE slug = 'demo-cerrado';
INSERT OR REPLACE INTO eventos (slug, nombre, codigo, admin_hash, fotos)
SELECT 'demo-rsvp', 'Evento sólo con RSVP', codigo, admin_hash, 0 FROM eventos WHERE slug = 'demo';

-- Pases (enlace: /?i=<codigo>). Los ids fijos permiten volver a correr el seed.
INSERT OR REPLACE INTO pases (id, slug, codigo, nombre, telefono) VALUES
  (1, 'demo',         'PEREZ234', 'Familia Pérez', '523300000000'),
  (2, 'demo',         'ROSA2345', 'Tía Rosa',      NULL),
  (3, 'demo',         'JUAN2345', 'Juan Gómez',    '523300000001'),
  (4, 'demo-cerrado', 'CERRADO2', 'Familia López', NULL),
  (5, 'demo-rsvp',    'SOLORSVP', 'Ana Ruiz',      NULL);

DELETE FROM personas WHERE pase_id IN (1, 2, 3, 4, 5);
INSERT INTO personas (pase_id, orden, nombre, es_nino, es_libre) VALUES
  (1, 1, 'Luis Pérez',    0, 0),
  (1, 2, 'María López',   0, 0),
  (1, 3, 'Sofía Pérez',   1, 0),
  (1, 4, 'Diego Pérez',   1, 0),
  (2, 1, 'Rosa Martínez', 0, 0),
  (3, 1, 'Juan Gómez',    0, 0),
  (3, 2, NULL,            0, 1),
  (4, 1, 'Pedro López',   0, 0),
  (5, 1, 'Ana Ruiz',      0, 0);
