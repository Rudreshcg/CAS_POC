variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "application_name" {
  description = "Name of the Elastic Beanstalk application"
  type        = string
  default     = "cas-lookup-app"
}

variable "environment_name" {
  description = "Name of the Elastic Beanstalk environment"
  type        = string
  default     = "cas-lookup-prod"
}

variable "instance_type" {
  description = "EC2 instance type for the application"
  type        = string
  default     = "t3.small"

  validation {
    condition     = can(regex("^t[23]\\.(micro|small|medium|large)$", var.instance_type))
    error_message = "Instance type must be a valid t2 or t3 instance (micro, small, medium, or large)."
  }
}

variable "key_pair_name" {
  description = "Name of the EC2 key pair for SSH access (optional)"
  type        = string
  default     = ""
}

variable "min_instances" {
  description = "Minimum number of EC2 instances"
  type        = number
  default     = 1
}

variable "max_instances" {
  description = "Maximum number of EC2 instances"
  type        = number
  default     = 4
}

variable "tags" {
  description = "Additional tags to apply to resources"
  type        = map(string)
  default = {
    Project   = "CAS-Lookup"
    ManagedBy = "Terraform"
  }
}
