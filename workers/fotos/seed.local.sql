-- Datos de prueba SOLO para la base local (npm run db:seed:local).
-- Código de invitados: DEMO23 · token de festejados: demo-admin-token
INSERT OR REPLACE INTO eventos (slug, nombre, codigo, admin_hash, abre_en, cierra_en)
VALUES
  ('demo',         'Evento de prueba',          'DEMO23', '91c16f0d6cc1bec3c3603972182a07c66ff4fa71618a975e963d6dbe42b6dd37', NULL, NULL),
  ('demo-futuro',  'Evento que aún no abre',    'DEMO23', '91c16f0d6cc1bec3c3603972182a07c66ff4fa71618a975e963d6dbe42b6dd37', '2099-01-01T06:00:00.000Z', NULL),
  ('demo-cerrado', 'Evento con subida cerrada', 'DEMO23', '91c16f0d6cc1bec3c3603972182a07c66ff4fa71618a975e963d6dbe42b6dd37', NULL, '2020-01-01T06:00:00.000Z');
