# Localiza el zone de evento.casa dentro de la cuenta de Cloudflare.
#
# En el provider v5 el data source fiable para buscar por nombre es
# `cloudflare_zones` (plural): devuelve `result`, una lista; tomamos [0].
# (`cloudflare_zone` singular exige zone_id o un bloque filter y ha dado
# problemas de validación en v5.)
#
# Si el zone no existe en la cuenta, `result[0]` fallará: verifica que
# evento.casa esté activo en Cloudflare antes de aplicar.
data "cloudflare_zones" "evento_casa" {
  name = var.zone_name
}

locals {
  zone_id = data.cloudflare_zones.evento_casa.result[0].id
}
