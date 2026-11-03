-- Un lugar libre puede decir quién se espera ("Esposo", "Niña"); el nombre
-- lo sigue escribiendo el invitado.
ALTER TABLE personas ADD COLUMN etiqueta TEXT;   -- NULL = "Acompañante"
