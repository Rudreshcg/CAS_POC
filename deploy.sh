#!/bin/bash
# One-Command Deployment Script for CAS Lookup Application
# Usage: ./deploy.sh [server_ip]

set -e  # Exit on error

echo "=================================="
echo "CAS Lookup - Deployment Script"
echo "=================================="
echo ""

# Get server IP from argument or Terraform output
if [ -z "$1" ]; then
    echo "Getting server IP from Terraform..."
    cd terraform/ec2
    SERVER_IP=$(terraform output -raw public_ip)
    cd ../..
    
    if [ -z "$SERVER_IP" ]; then
        echo "ERROR: Could not get server IP. Run terraform apply first or provide IP as argument."
        exit 1
    fi
else
    SERVER_IP=$1
fi

echo "Deploying to: $SERVER_IP"
echo ""

# Provision S3 bucket for validation documents
echo "[0/6] Provisioning S3 bucket..."
cd terraform
terraform init -upgrade
terraform apply -auto-approve -target=module.s3_validation
S3_BUCKET=$(terraform output -raw s3_validation_bucket)
cd ..

if [ -z "$S3_BUCKET" ]; then
    echo "ERROR: Failed to provision S3 bucket"
    exit 1
fi
echo "  ✅ S3 Bucket: $S3_BUCKET"
echo ""

# Build Frontend
echo "[1/6] Building React Frontend..."
cd frontend
if [ -d "node_modules" ]; then
    npm run build
else
    npm install
    npm run build
fi
cd ..

# Create deployment package
echo "[2/6] Creating deployment package..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ZIP_FILE="deploy_${TIMESTAMP}.zip"

# Create staging folder
STAGING_DIR="staging_deploy"
rm -rf $STAGING_DIR
mkdir -p $STAGING_DIR

# Copy Backend Files
cp backend/app.py $STAGING_DIR/
cp backend/llm_helper.py $STAGING_DIR/
cp backend/models.py $STAGING_DIR/
cp backend/cas_client.py $STAGING_DIR/
cp backend/chemical_utils.py $STAGING_DIR/
cp backend/requirements.txt $STAGING_DIR/
cp backend/material_clusters.json $STAGING_DIR/ 2>/dev/null || true
cp backend/reset_db.py $STAGING_DIR/
cp backend/migrate_db.py $STAGING_DIR/

# Copy Blueprints
mkdir -p $STAGING_DIR/blueprints
cp -r backend/blueprints/* $STAGING_DIR/blueprints/

# Copy Frontend Build
if [ -d "frontend/dist" ]; then
    mkdir -p $STAGING_DIR/frontend
    cp -r frontend/dist $STAGING_DIR/frontend/
    echo "  ✅ Frontend build copied to staging/frontend/dist"
else
    echo "ERROR: Frontend build missing. Run 'npm run build' inside frontend/ manually."
    exit 1
fi

# Create zip file
cd $STAGING_DIR
zip -r ../$ZIP_FILE . > /dev/null
cd ..
rm -rf $STAGING_DIR
echo "  Created: $ZIP_FILE"

# Upload to server
echo "[3/6] Uploading to server..."
scp -i terraform/ec2/cas_app_key -o StrictHostKeyChecking=no $ZIP_FILE ec2-user@${SERVER_IP}:/tmp/

# Extract and setup on server
echo "[4/6] Extracting files on server..."
ssh -i terraform/ec2/cas_app_key ec2-user@$SERVER_IP "cd /opt/cas-lookup && unzip -o /tmp/$ZIP_FILE && rm /tmp/$ZIP_FILE"

# Install dependencies and configure S3
echo "[5/6] Installing dependencies and configuring S3..."
ssh -i terraform/ec2/cas_app_key ec2-user@$SERVER_IP "cd /opt/cas-lookup && python3.11 -m pip install --user -r requirements.txt && echo 'export S3_VALIDATION_BUCKET=$S3_BUCKET' >> ~/.bashrc && echo 'export AWS_DEFAULT_REGION=us-east-1' >> ~/.bashrc"

# Restart service
echo "[6/6] Restarting application..."
ssh -i terraform/ec2/cas_app_key ec2-user@$SERVER_IP "sudo systemctl restart cas-lookup && sleep 5 && if systemctl is-active --quiet cas-lookup; then echo '✅ Service is RUNNING' && sudo systemctl status cas-lookup --no-pager; else echo '❌ Service FAILED to start' && sudo systemctl status cas-lookup --no-pager && exit 1; fi"

# Cleanup local zip
rm -f $ZIP_FILE

echo ""
echo "=================================="
echo "Deployment Complete!"
echo "=================================="
echo ""
echo "Your app is running at: http://${SERVER_IP}:5000"
echo ""
echo "S3 Bucket: $S3_BUCKET"
echo ""
echo "To view logs: ssh -i terraform/ec2/cas_app_key ec2-user@$SERVER_IP 'sudo journalctl -u cas-lookup -f'"
echo ""
