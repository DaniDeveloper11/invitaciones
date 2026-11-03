-- Los festejados pueden desactivar un pase o a una persona sin borrarlos (por
-- si se arrepienten): no se le muestran al invitado ni cuentan en los totales,
-- y conservan su respuesta por si se vuelven a habilitar.
ALTER TABLE pases ADD COLUMN desactivado_en TEXT;      -- NULL = invitado
ALTER TABLE personas ADD COLUMN desactivada_en TEXT;   -- NULL = invitada
