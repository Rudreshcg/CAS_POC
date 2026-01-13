terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# S3 Bucket for Elastic Beanstalk application versions
resource "aws_s3_bucket" "eb_app_versions" {
  bucket = "${var.application_name}-versions-${random_id.bucket_suffix.hex}"
  
  tags = {
    Name        = "${var.application_name}-versions"
    Environment = var.environment_name
  }
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket_versioning" "eb_app_versions" {
  bucket = aws_s3_bucket.eb_app_versions.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# Elastic Beanstalk Application
resource "aws_elastic_beanstalk_application" "cas_lookup" {
  name        = var.application_name
  description = "CAS Number Lookup System - Flask Application"
  
  tags = {
    Name        = var.application_name
    Environment = var.environment_name
  }
}

# IAM Role for EC2 instances
resource "aws_iam_role" "eb_ec2_role" {
  name = "${var.application_name}-eb-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

# Attach required policies to EC2 role
resource "aws_iam_role_policy_attachment" "eb_web_tier" {
  role       = aws_iam_role.eb_ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier"
}

resource "aws_iam_role_policy_attachment" "eb_multicontainer_docker" {
  role       = aws_iam_role.eb_ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkMulticontainerDocker"
}

resource "aws_iam_role_policy_attachment" "eb_worker_tier" {
  role       = aws_iam_role.eb_ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkWorkerTier"
}

# Instance profile
resource "aws_iam_instance_profile" "eb_ec2_profile" {
  name = "${var.application_name}-eb-ec2-profile"
  role = aws_iam_role.eb_ec2_role.name
}

# IAM Role for Elastic Beanstalk service
resource "aws_iam_role" "eb_service_role" {
  name = "${var.application_name}-eb-service-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "elasticbeanstalk.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "eb_service" {
  role       = aws_iam_role.eb_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkEnhancedHealth"
}

resource "aws_iam_role_policy_attachment" "eb_service_managed" {
  role       = aws_iam_role.eb_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkManagedUpdatesCustomerRolePolicy"
}

# Security Group for EFS
resource "aws_security_group" "efs_sg" {
  name        = "${var.application_name}-efs-sg"
  description = "Security group for EFS mount targets"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 2049
    to_port     = 2049
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.default.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.application_name}-efs-sg"
  }
}

# EFS File System for persistent storage
resource "aws_efs_file_system" "cas_storage" {
  creation_token = "${var.application_name}-storage"
  encrypted      = true

  tags = {
    Name        = "${var.application_name}-storage"
    Environment = var.environment_name
  }
}

# EFS Mount Targets (one per AZ)
resource "aws_efs_mount_target" "cas_storage_mt" {
  count           = length(data.aws_subnets.default.ids)
  file_system_id  = aws_efs_file_system.cas_storage.id
  subnet_id       = data.aws_subnets.default.ids[count.index]
  security_groups = [aws_security_group.efs_sg.id]
}

# Elastic Beanstalk Environment
resource "aws_elastic_beanstalk_environment" "cas_lookup_env" {
  name                = var.environment_name
  application         = aws_elastic_beanstalk_application.cas_lookup.name
  solution_stack_name = "64bit Amazon Linux 2023 v4.3.0 running Python 3.11"
  tier                = "WebServer"

  # Instance configuration
  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "InstanceType"
    value     = var.instance_type
  }

  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "IamInstanceProfile"
    value     = aws_iam_instance_profile.eb_ec2_profile.name
  }

  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "EC2KeyName"
    value     = var.key_pair_name
  }

  # Auto-scaling configuration
  setting {
    namespace = "aws:autoscaling:asg"
    name      = "MinSize"
    value     = "1"
  }

  setting {
    namespace = "aws:autoscaling:asg"
    name      = "MaxSize"
    value     = "4"
  }

  # Load balancer configuration
  setting {
    namespace = "aws:elasticbeanstalk:environment"
    name      = "LoadBalancerType"
    value     = "application"
  }

  setting {
    namespace = "aws:elbv2:listener:default"
    name      = "ListenerEnabled"
    value     = "true"
  }

  # Service role
  setting {
    namespace = "aws:elasticbeanstalk:environment"
    name      = "ServiceRole"
    value     = aws_iam_role.eb_service_role.name
  }

  # Environment variables
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "FLASK_ENV"
    value     = "production"
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "EFS_ID"
    value     = aws_efs_file_system.cas_storage.id
  }

  # Health check configuration
  setting {
    namespace = "aws:elasticbeanstalk:environment:process:default"
    name      = "HealthCheckPath"
    value     = "/"
  }

  setting {
    namespace = "aws:elasticbeanstalk:environment:process:default"
    name      = "HealthCheckTimeout"
    value     = "5"
  }

  # Enhanced health reporting
  setting {
    namespace = "aws:elasticbeanstalk:healthreporting:system"
    name      = "SystemType"
    value     = "enhanced"
  }

  # Rolling updates
  setting {
    namespace = "aws:autoscaling:updatepolicy:rollingupdate"
    name      = "RollingUpdateEnabled"
    value     = "true"
  }

  setting {
    namespace = "aws:autoscaling:updatepolicy:rollingupdate"
    name      = "RollingUpdateType"
    value     = "Health"
  }

  # CloudWatch Logs
  setting {
    namespace = "aws:elasticbeanstalk:cloudwatch:logs"
    name      = "StreamLogs"
    value     = "true"
  }

  setting {
    namespace = "aws:elasticbeanstalk:cloudwatch:logs"
    name      = "DeleteOnTerminate"
    value     = "false"
  }

  tags = {
    Name        = var.environment_name
    Environment = var.environment_name
  }

  depends_on = [
    aws_efs_mount_target.cas_storage_mt
  ]
}

# Data sources
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}
