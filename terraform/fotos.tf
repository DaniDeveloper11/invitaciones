# Fotos de invitados: almacenamiento compartido por todas las invitaciones.
#
#   D1 `invitaciones`        Metadatos en SQL (tablas eventos y fotos). Las
#                            tablas las crean las migraciones de wrangler en
#                            workers/fotos/migrations, no Terraform.
#   R2 `invitaciones-fotos`  Archivos: <slug>/<id>.webp y <slug>/<id>.thumb.webp.
#
# No son por invitación: cada evento es una fila en D1 y una carpeta (prefijo)
# en R2. El Worker api.evento.casa (workers/fotos/) es el único que los usa; su
# código y su dominio se despliegan con wrangler.
#
# Ubicación: wnam (oeste de Norteamérica), lo más cercano a los invitados en
# México. Es sólo una pista: no se puede cambiar después sin recrear el recurso.
#
# Permisos extra del API token (además de los de providers.tf):
#   Account → D1                     → Edit
#   Account → Workers R2 Storage     → Edit

resource "cloudflare_d1_database" "invitaciones" {
  account_id            = var.cloudflare_account_id
  name                  = "invitaciones"
  primary_location_hint = "wnam"

  read_replication = {
    mode = "disabled"
  }
}

resource "cloudflare_r2_bucket" "fotos" {
  account_id = var.cloudflare_account_id
  name       = "invitaciones-fotos"
  location   = "wnam"
}

output "d1_database_id" {
  description = "ID de la base D1; va en workers/fotos/wrangler.jsonc (d1_databases[0].database_id)."
  value       = cloudflare_d1_database.invitaciones.uuid
}

output "r2_bucket_name" {
  description = "Nombre del bucket R2; va en workers/fotos/wrangler.jsonc (r2_buckets[0].bucket_name)."
  value       = cloudflare_r2_bucket.fotos.name
}
