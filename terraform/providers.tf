# Provider de Cloudflare.
#
# El API token se toma de la variable de entorno CLOUDFLARE_API_TOKEN
# (recomendado) o, si lo prefieres, de `cloudflare_api_token` en
# terraform.tfvars. Cuando la variable es null, el provider usa el env var.
#
# Para no pegarlo en cada terminal, guárdalo en .env.local (gitignoreado,
# ver .env.local.example) y cárgalo con:  source .env.local
#
# Permisos mínimos del token (créalo en Cloudflare → My Profile → API Tokens):
#   Account → Cloudflare Pages → Edit
#   Zone    → DNS              → Edit   (limitado al zone evento.casa)
#   Zone    → Zone             → Read   (limitado al zone evento.casa)
#   Account → D1               → Edit   (fotos de invitados, ver fotos.tf)
#   Account → Workers R2 Storage → Edit (fotos de invitados, ver fotos.tf)
provider "cloudflare" {
  api_token = var.cloudflare_api_token
}
