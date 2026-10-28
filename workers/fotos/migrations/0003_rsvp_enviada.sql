-- Los festejados mandan cada invitación desde su panel; se guarda cuándo, para
-- distinguir a quién falta enviársela de a quién sólo hay que recordarle.
ALTER TABLE pases ADD COLUMN enviada_en TEXT;   -- NULL = aún no se envía
