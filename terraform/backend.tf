# Estado local: terraform/terraform.tfstate (ignorado por git).
#
# Si más adelante quieres estado remoto (Terraform Cloud, S3, R2…), sustituye
# este bloque por el backend correspondiente y migra con:
#   terraform init -migrate-state
terraform {
  backend "local" {}
}
