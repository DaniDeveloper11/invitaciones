variable "account_id" {
  description = "ID de la cuenta de Cloudflare."
  type        = string
}

variable "zone_id" {
  description = "ID del zone de evento.casa donde se crea el CNAME."
  type        = string
}

variable "zone_name" {
  description = "Nombre del zone raíz (evento.casa) para componer el dominio completo."
  type        = string
}

variable "github_owner" {
  description = "Dueño del monorepo en GitHub."
  type        = string
}

variable "github_repo" {
  description = "Nombre del monorepo en GitHub."
  type        = string
}

variable "production_branch" {
  description = "Rama que dispara el despliegue de producción."
  type        = string
  default     = "main"
}

variable "slug" {
  description = "Carpeta del sitio en sites/; se usa en el build (-w <slug>) y en la salida (sites/<slug>/dist)."
  type        = string
}

variable "project_name" {
  description = "Nombre del proyecto en Pages. null = usar el slug. Sobrescribir para adoptar un proyecto existente con otro nombre."
  type        = string
  default     = null
}

variable "subdominio" {
  description = "Parte izquierda del dominio: <subdominio>.<zone_name>."
  type        = string
}

variable "preview_deployment_setting" {
  description = "Despliegues preview para PRs: all, none o custom."
  type        = string
  default     = "all"
}

variable "watch_paths" {
  description = "Rutas que, al cambiar, disparan un rebuild (build watch paths de Pages). null = [\"*\"] (reconstruir con cualquier cambio)."
  type        = list(string)
  default     = null
}
