output "bucket_name" {
  description = "Name of the S3 bucket for validation documents"
  value       = aws_s3_bucket.validation_docs.id
}

output "bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.validation_docs.arn
}

output "bucket_region" {
  description = "Region of the S3 bucket"
  value       = aws_s3_bucket.validation_docs.region
}
