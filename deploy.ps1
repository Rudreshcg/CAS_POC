# One-Command Deployment Script for Golden Record Generator
# Usage: .\deploy.ps1

param(
    [string]$ServerIP = ""
)

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Golden Record Generator - Deployment Script" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Get server IP from Terraform output if not provided
if ($ServerIP -eq "") {
    Write-Host "Getting server IP from Terraform..." -ForegroundColor Yellow
    Push-Location terraform\ec2
    $ServerIP = (terraform output -raw public_ip)
    Pop-Location
    
    if ($ServerIP -eq "") {
        Write-Host "ERROR: Could not get server IP. Run terraform apply first." -ForegroundColor Red
        exit 1
    }
}

Write-Host "Deploying to: $ServerIP" -ForegroundColor Green
Write-Host ""

# Provision S3 bucket for validation documents
Write-Host "[0/6] Provisioning S3 bucket..." -ForegroundColor Cyan
Push-Location terraform
terraform init -upgrade > $null 2>&1
$applyResult = terraform apply -auto-approve 2>&1
if ($LASTEXITCODE -eq 0) {
    $S3Bucket = (terraform output -raw s3_validation_bucket 2>$null)
}
else {
    Write-Host "  ⚠️  Terraform apply had issues, checking if S3 bucket exists..." -ForegroundColor Yellow
    $S3Bucket = (terraform output -raw s3_validation_bucket 2>$null)
}
Pop-Location

if ([string]::IsNullOrWhiteSpace($S3Bucket)) {
    Write-Host "  ⚠️  S3 bucket not provisioned, using local storage" -ForegroundColor Yellow
    $S3Bucket = ""
}
else {
    Write-Host "  ✅ S3 Bucket: $S3Bucket" -ForegroundColor Green
}
Write-Host ""

# Create deployment package
# Build Frontend
Write-Host "[1/6] Building React Frontend..." -ForegroundColor Cyan
Push-Location frontend
if (Test-Path "node_modules") {
    npm run build
}
else {
    npm install
    npm run build
}
Pop-Location

# Create deployment package
Write-Host "[2/6] Creating deployment package..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$zipFile = "deploy_$timestamp.zip"

# Create a staging folder
$stagingDir = "staging_deploy"
if (Test-Path $stagingDir) { Remove-Item $stagingDir -Recurse -Force }
New-Item -ItemType Directory -Path $stagingDir | Out-Null

# Copy Backend Files
Copy-Item "backend/app.py" -Destination $stagingDir
Copy-Item "backend/llm_helper.py" -Destination $stagingDir
Copy-Item "backend/models.py" -Destination $stagingDir
Copy-Item "backend/requirements.txt" -Destination $stagingDir
Copy-Item "backend/material_clusters.json" -Destination $stagingDir -ErrorAction SilentlyContinue
Copy-Item "backend/reset_db.py" -Destination $stagingDir
Copy-Item "backend/migrate_db.py" -Destination $stagingDir
Copy-Item "backend/manage_data.py" -Destination $stagingDir
Copy-Item "backend/Purchase History.xlsx" -Destination $stagingDir -ErrorAction SilentlyContinue

# Copy Frontend Build (Maintain directory structure: frontend/dist)
if (Test-Path "frontend/dist") {
    # Create frontend/dist directory structure in staging
    New-Item -ItemType Directory -Path "$stagingDir/frontend" -Force | Out-Null
    Copy-Item "frontend/dist" -Destination "$stagingDir/frontend" -Recurse -Force
    Write-Host "  ✅ Frontend build copied to staging/frontend/dist" -ForegroundColor Green
}
else {
    Write-Host "ERROR: Frontend build missing. Run 'npm run build' inside frontend/ manually." -ForegroundColor Red
    exit 1
}

# Zip the staging folder contents (with retry for file locking)
$maxRetries = 3
$retryCount = 0
$zipCreated = $false

while (-not $zipCreated -and $retryCount -lt $maxRetries) {
    try {
        Start-Sleep -Milliseconds 500  # Brief pause to let file handles close
        Compress-Archive -Path "$stagingDir/*" -DestinationPath $zipFile -Force
        $zipCreated = $true
    }
    catch {
        $retryCount++
        if ($retryCount -lt $maxRetries) {
            Write-Host "  Retrying zip creation ($retryCount/$maxRetries)..." -ForegroundColor Yellow
            Start-Sleep -Seconds 1
        }
        else {
            Write-Host "ERROR: Failed to create zip after $maxRetries attempts: $_" -ForegroundColor Red
            Remove-Item $stagingDir -Recurse -Force -ErrorAction SilentlyContinue
            exit 1
        }
    }
}

Remove-Item $stagingDir -Recurse -Force
Write-Host "  Created: $zipFile" -ForegroundColor Green

# Upload to server
Write-Host "[3/6] Uploading to server..." -ForegroundColor Yellow
scp -i terraform\ec2\cas_app_key -o StrictHostKeyChecking=no $zipFile ec2-user@${ServerIP}:/tmp/

# Extract and setup on server
Write-Host "[4/6] Extracting files on server..." -ForegroundColor Yellow
$extractCmd = "cd /opt/cas-lookup && unzip -o /tmp/$zipFile && rm /tmp/$zipFile"
ssh -i terraform\ec2\cas_app_key ec2-user@$ServerIP $extractCmd

# Install dependencies and set environment variables
Write-Host "[5/6] Installing dependencies and configuring S3..." -ForegroundColor Yellow
if ($S3Bucket -ne "") {
    $installCmd = "cd /opt/cas-lookup && python3.11 -m pip install --user -r requirements.txt && grep -q 'S3_VALIDATION_BUCKET' ~/.bashrc || echo 'export S3_VALIDATION_BUCKET=$S3Bucket' >> ~/.bashrc"
}
else {
    $installCmd = "cd /opt/cas-lookup && python3.11 -m pip install --user -r requirements.txt"
}
ssh -i terraform\ec2\cas_app_key ec2-user@$ServerIP $installCmd

# Restart service
Write-Host "[6/6] Restarting application..." -ForegroundColor Yellow
$restartCmd = "sudo systemctl restart cas-lookup && sleep 5 && if systemctl is-active --quiet cas-lookup; then echo '✅ Service is RUNNING' && sudo systemctl status cas-lookup --no-pager; else echo '❌ Service FAILED to start' && sudo systemctl status cas-lookup --no-pager && exit 1; fi"
ssh -i terraform\ec2\cas_app_key ec2-user@$ServerIP $restartCmd

# Cleanup local zip
if (Test-Path $zipFile) {
    Remove-Item $zipFile
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your app is running at: http://${ServerIP}:5000" -ForegroundColor Green
Write-Host ""
Write-Host "To view logs: ssh -i terraform\ec2\cas_app_key ec2-user@$ServerIP 'sudo journalctl -u cas-lookup -f'" -ForegroundColor Yellow
Write-Host ""
