# One-Command Deployment Script for CAS Lookup App
# Usage: .\deploy.ps1

param(
    [string]$ServerIP = ""
)

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "CAS Lookup App - Deployment Script" -ForegroundColor Cyan
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

# Create deployment package
Write-Host "[1/5] Creating deployment package..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$zipFile = "deploy_$timestamp.zip"

# Zip the application files
Compress-Archive -Path `
    app.py, `
    application.py, `
    requirements.txt, `
    templates\*, `
    uploads, `
    outputs `
    -DestinationPath $zipFile -Force

Write-Host "  Created: $zipFile" -ForegroundColor Green

# Upload to server
Write-Host "[2/5] Uploading to server..." -ForegroundColor Yellow
scp -i terraform\ec2\cas_app_key -o StrictHostKeyChecking=no $zipFile ec2-user@${ServerIP}:/tmp/

# Extract and setup on server
Write-Host "[3/5] Extracting files on server..." -ForegroundColor Yellow
ssh -i terraform\ec2\cas_app_key ec2-user@$ServerIP @"
    cd /opt/cas-lookup
    unzip -o /tmp/$zipFile
    rm /tmp/$zipFile
"@

# Install dependencies
Write-Host "[4/5] Installing dependencies..." -ForegroundColor Yellow
ssh -i terraform\ec2\cas_app_key ec2-user@$ServerIP @"
    cd /opt/cas-lookup
    python3.11 -m pip install --user -r requirements.txt
"@

# Restart service
Write-Host "[5/5] Restarting application..." -ForegroundColor Yellow
ssh -i terraform\ec2\cas_app_key ec2-user@$ServerIP @"
    sudo systemctl restart cas-lookup
    sudo systemctl status cas-lookup --no-pager
"@

# Cleanup local zip
Remove-Item $zipFile

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your app is running at: http://${ServerIP}:5000" -ForegroundColor Green
Write-Host ""
Write-Host "To view logs: ssh -i terraform\ec2\cas_app_key ec2-user@$ServerIP 'sudo journalctl -u cas-lookup -f'" -ForegroundColor Yellow
Write-Host ""
