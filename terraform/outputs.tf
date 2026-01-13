output "application_name" {
  description = "Name of the Elastic Beanstalk application"
  value       = aws_elastic_beanstalk_application.cas_lookup.name
}

output "environment_name" {
  description = "Name of the Elastic Beanstalk environment"
  value       = aws_elastic_beanstalk_environment.cas_lookup_env.name
}

output "environment_url" {
  description = "URL of the Elastic Beanstalk environment"
  value       = "http://${aws_elastic_beanstalk_environment.cas_lookup_env.endpoint_url}"
}

output "cname" {
  description = "CNAME of the Elastic Beanstalk environment"
  value       = aws_elastic_beanstalk_environment.cas_lookup_env.cname
}

output "load_balancer_url" {
  description = "Load balancer URL"
  value       = aws_elastic_beanstalk_environment.cas_lookup_env.endpoint_url
}

output "efs_id" {
  description = "ID of the EFS file system"
  value       = aws_efs_file_system.cas_storage.id
}

output "efs_dns_name" {
  description = "DNS name of the EFS file system"
  value       = aws_efs_file_system.cas_storage.dns_name
}

output "s3_bucket" {
  description = "S3 bucket for application versions"
  value       = aws_s3_bucket.eb_app_versions.bucket
}
