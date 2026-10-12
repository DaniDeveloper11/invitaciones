output "project_name" {
  description = "Nombre del proyecto en Cloudflare Pages."
  value       = cloudflare_pages_project.site.name
}

output "pages_dev_url" {
  description = "URL por defecto de Pages (<slug>.pages.dev)."
  value       = "https://${cloudflare_pages_project.site.subdomain}"
}

output "custom_domain" {
  description = "Dominio personalizado asignado (<subdominio>.<zone>)."
  value       = local.dominio
}

output "url" {
  description = "URL pública de la invitación."
  value       = "https://${local.dominio}/"
}
