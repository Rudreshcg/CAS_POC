# EC2 Deployment with One-Command Updates

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

# Security Group
resource "aws_security_group" "cas_app_sg" {
  name        = "${var.app_name}-sg"
  description = "Security group for CAS Lookup application"

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Flask App"
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.app_name}-sg"
  }
}

# EC2 Key Pair
resource "aws_key_pair" "cas_app_key" {
  key_name   = "${var.app_name}-key"
  public_key = file("${path.module}/cas_app_key.pub")
}

# EC2 Instance
resource "aws_instance" "cas_app" {
  ami           = "ami-0453ec754f44f9a4a" # Amazon Linux 2023 in us-east-1
  instance_type = var.instance_type

  key_name               = aws_key_pair.cas_app_key.key_name
  vpc_security_group_ids = [aws_security_group.cas_app_sg.id]

  user_data = <<-EOF
              #!/bin/bash
              set -e
              
              # Update system
              yum update -y
              
              # Install Python 3.11
              yum install -y python3.11 python3.11-pip git
              
              # Create app directory
              mkdir -p /opt/cas-lookup
              chown ec2-user:ec2-user /opt/cas-lookup
              
              # Create systemd service
              cat > /etc/systemd/system/cas-lookup.service <<'SERVICE'
              [Unit]
              Description=CAS Lookup Flask Application
              After=network.target
              
              [Service]
              User=ec2-user
              WorkingDirectory=/opt/cas-lookup
              ExecStart=/usr/bin/python3.11 -m gunicorn --workers 2 --bind 0.0.0.0:5000 --timeout 600 app:app
              Restart=always
              
              [Install]
              WantedBy=multi-user.target
              SERVICE
              
              systemctl daemon-reload
              systemctl enable cas-lookup
              EOF

  tags = {
    Name = var.app_name
  }
}

# Elastic IP
resource "aws_eip" "cas_app_eip" {
  instance = aws_instance.cas_app.id
  domain   = "vpc"

  tags = {
    Name = "${var.app_name}-eip"
  }
}
