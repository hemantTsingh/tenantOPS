resource "aws_s3_bucket" "tenantops" {
  bucket = "${var.project}-assets-${var.account_id}"
  tags = {
    Name        = "${var.project}-assets"
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "tenantops" {
  bucket = aws_s3_bucket.tenantops.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tenantops" {
  bucket = aws_s3_bucket.tenantops.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
