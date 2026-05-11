terraform {
  backend "s3" {
    bucket         = "tenantops-tfstate-051556733177"
    key            = "tenantops/terraform.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "tenantops-terraform-lock"
    encrypt        = true
  }
}
