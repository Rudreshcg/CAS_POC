output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.cas_app.id
}

output "public_ip" {
  description = "Public IP address"
  value       = aws_eip.cas_app_eip.public_ip
}

output "application_url" {
  description = "Application URL"
  value       = "http://${aws_eip.cas_app_eip.public_ip}:5000"
}

output "ssh_command" {
  description = "SSH command"
  value       = "ssh -i cas_app_key ec2-user@${aws_eip.cas_app_eip.public_ip}"
}
