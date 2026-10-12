variable "cloudflare_api_token" {
  description = "API token de Cloudflare. Déjalo en null y usa la variable de entorno CLOUDFLARE_API_TOKEN."
  type        = string
  sensitive   = true
  default     = null
}

variable "cloudflare_account_id" {
  description = "ID de la cuenta de Cloudflare (dashboard → Overview, o en la URL)."
  type        = string
}

variable "zone_name" {
  description = "Dominio raíz gestionado en Cloudflare del que cuelgan los subdominios."
  type        = string
  default     = "evento.casa"
}

variable "github_owner" {
  description = "Usuario u organización dueña del monorepo en GitHub."
  type        = string
  default     = "DaniDeveloper11"
}

variable "github_repo" {
  description = "Nombre del monorepo en GitHub."
  type        = string
  default     = "invitaciones"
}

variable "production_branch" {
  description = "Rama que dispara el despliegue de producción en Pages."
  type        = string
  default     = "main"
}
