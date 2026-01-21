# S3 Bucket for Validation Documents
resource "aws_s3_bucket" "validation_docs" {
  bucket = "${var.application_name}-validation-docs-${random_id.bucket_suffix.hex}"

  tags = {
    Name        = "${var.application_name}-validation-docs"
    Environment = var.environment
    Purpose     = "Store MSDS and CoS validation documents"
  }
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# Enable versioning for document history
resource "aws_s3_bucket_versioning" "validation_docs" {
  bucket = aws_s3_bucket.validation_docs.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Enable server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "validation_docs" {
  bucket = aws_s3_bucket.validation_docs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block public access
resource "aws_s3_bucket_public_access_block" "validation_docs" {
  bucket = aws_s3_bucket.validation_docs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle rule for cost optimization (optional)
resource "aws_s3_bucket_lifecycle_configuration" "validation_docs" {
  bucket = aws_s3_bucket.validation_docs.id

  rule {
    id     = "transition-old-versions"
    status = "Enabled"

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_transition {
      noncurrent_days = 90
      storage_class   = "GLACIER"
    }
  }
}

# CORS configuration for direct uploads (if needed in future)
resource "aws_s3_bucket_cors_configuration" "validation_docs" {
  bucket = aws_s3_bucket.validation_docs.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}
