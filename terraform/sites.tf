# Lista de invitaciones a desplegar.
#
# Cada entrada gestiona (vía el módulo pages-site):
#   1. Un proyecto de Cloudflare Pages conectado al monorepo de GitHub,
#      con build `npm run build -w <slug>` y salida `sites/<slug>/dist`.
#   2. El dominio personalizado <subdominio>.<zone_name>.
#   3. El registro CNAME <subdominio> → <proyecto>.pages.dev (proxied).
#
# Para añadir una invitación nueva:
#   1. npm run new -- <slug>          (crea sites/<slug>/)
#   2. Añade aquí su entrada con el subdominio que quieras.
#   3. terraform apply
#
# Campos de cada entrada:
#   subdominio    (requerido) parte izquierda: "victoria" → victoria.evento.casa
#   project_name  (opcional)  nombre del proyecto en Pages; por defecto = slug.
#                             Úsalo para adoptar un proyecto ya existente.
#   watch_paths   (opcional)  rutas que disparan un rebuild; por defecto ["*"].
#
# La clave del mapa es el slug = nombre de la carpeta en sites/.
locals {
  sitios = {
    "first-comunion-victoria" = {
      subdominio = "victoria"
      # Este sitio ya estaba desplegado a mano en el proyecto "invitaciones";
      # lo adoptamos tal cual (import) en vez de crear un proyecto nuevo.
      project_name = "invitaciones"
      watch_paths  = ["sites/first-comunion-victoria/**", "packages/**", "package.json", "package-lock.json"]
    }
  }
}

module "pages_site" {
  source   = "./modules/pages-site"
  for_each = local.sitios

  account_id        = var.cloudflare_account_id
  zone_id           = local.zone_id
  zone_name         = var.zone_name
  github_owner      = var.github_owner
  github_repo       = var.github_repo
  production_branch = var.production_branch

  slug         = each.key
  subdominio   = each.value.subdominio
  project_name = lookup(each.value, "project_name", null)
  watch_paths  = lookup(each.value, "watch_paths", null)
}
