locals {
  # Dominio completo: <subdominio>.<zone_name>  (ej. victoria.evento.casa)
  dominio = "${var.subdominio}.${var.zone_name}"

  # Nombre del proyecto en Pages. Por defecto el slug; se sobrescribe con
  # `project_name` para adoptar un proyecto ya existente cuyo nombre no sigue
  # la convención (p.ej. el sitio de Victoria vive en el proyecto "invitaciones").
  project_name = coalesce(var.project_name, var.slug)

  # Build watch paths: rutas que, al cambiar, disparan un rebuild.
  # Por defecto ["*"] = reconstruir con cualquier cambio del repo (es lo que
  # Cloudflare pone al crear el proyecto a mano). Cuando haya VARIOS sitios en
  # este mismo repo, conviene acotarlo por sitio para no reconstruir todos en
  # cada push; pasa entonces `watch_paths`, p.ej.:
  #   ["sites/<slug>/**", "packages/**", "package.json", "package-lock.json"]
  watch_paths = coalesce(var.watch_paths, ["*"])
}

# Proyecto de Cloudflare Pages conectado al monorepo de GitHub.
#
# El build corre desde la raíz del repo (root_dir vacío) para que npm workspaces
# resuelva @invitaciones/core; la salida es sites/<slug>/dist. Equivale a los
# ajustes de la tabla del README de la raíz.
resource "cloudflare_pages_project" "site" {
  account_id        = var.account_id
  name              = local.project_name
  production_branch = var.production_branch

  source = {
    type = "github"
    config = {
      owner                          = var.github_owner
      repo_name                      = var.github_repo
      production_branch              = var.production_branch
      production_deployments_enabled = true
      pr_comments_enabled            = true
      preview_deployment_setting     = var.preview_deployment_setting
      path_includes                  = local.watch_paths
    }
  }

  build_config = {
    build_command   = "npm run build -w ${var.slug}"
    destination_dir = "sites/${var.slug}/dist"
    root_dir        = ""
  }

  # deployment_configs (env vars de build como VITE_SITE_URL, compatibility_date,
  # usage_model, build_image_major_version…) se gestiona desde el dashboard y
  # lleva muchos campos con valores que Cloudflare rellena solo. Lo ignoramos para:
  #   1. No borrar el VITE_SITE_URL ya configurado en el proyecto existente.
  #   2. Evitar drift por esos campos autogestionados (fechas, versiones…).
  # En sitios NUEVOS, VITE_SITE_URL sale de sites/<slug>/.env en el repo (fuente
  # canónica según el README), así que no hace falta el env var de Pages.
  lifecycle {
    ignore_changes = [deployment_configs]
  }
}

# Registro CNAME <subdominio>.<zone> → <project>.pages.dev.
# proxied = true activa el proxy de Cloudflare y la emisión del certificado.
resource "cloudflare_dns_record" "site" {
  zone_id = var.zone_id
  name    = local.dominio
  type    = "CNAME"
  content = cloudflare_pages_project.site.subdomain
  proxied = true
  ttl     = 1
}

# Vincula el dominio personalizado al proyecto Pages.
#
# OJO: cloudflare_pages_domain NO crea el registro DNS (ver docs del provider);
# por eso existe el cloudflare_dns_record de arriba, y este recurso depende de
# él para que el CNAME ya exista al registrar el dominio.
resource "cloudflare_pages_domain" "site" {
  account_id   = var.account_id
  project_name = cloudflare_pages_project.site.name
  name         = local.dominio

  depends_on = [cloudflare_dns_record.site]
}
