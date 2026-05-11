resource "aws_secretsmanager_secret" "db" {
  name                    = "${var.project}/database"
  recovery_window_in_days = 0
  tags = {
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "db" {
  secret_id = aws_secretsmanager_secret.db.id
  secret_string = jsonencode({
    username = var.db_username
    password = "TenantOPS#2026!"
    engine   = "postgres"
    port     = 5432
  })
}

resource "aws_secretsmanager_secret" "jwt" {
  name                    = "${var.project}/jwt"
  recovery_window_in_days = 0
  tags = {
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "jwt" {
  secret_id = aws_secretsmanager_secret.jwt.id
  secret_string = jsonencode({
    secret = "tenantops-jwt-secret-2026-production"
  })
}
