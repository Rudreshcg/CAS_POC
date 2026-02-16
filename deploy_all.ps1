# Multi-App Deployment Script

param(
    [string]$ServerIP = ""
)

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Multi-App Deployment Script" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# 1. Get Server IP from Terraform
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

$EC2_USER = "ec2-user"
$KEY_PATH = "terraform\ec2\cas_app_key"

Write-Host "Deploying to: $ServerIP" -ForegroundColor Green
Write-Host ""

# 2. Archive Projects
Write-Host "[1/5] Archiving projects..." -ForegroundColor Cyan
if (Test-Path "archives") { Remove-Item "archives" -Recurse -Force }
New-Item -ItemType Directory -Path "archives" | Out-Null

# CAS Lookup needs special handling (backend + frontend)
Write-Host "  Archiving CAS Lookup..."
$casStaging = "staging_cas"
if (Test-Path $casStaging) { Remove-Item $casStaging -Recurse -Force }
New-Item -ItemType Directory -Path $casStaging | Out-Null
Copy-Item "projects/cas-lookup/backend/*" -Destination $casStaging -Recurse
New-Item -ItemType Directory -Path "$casStaging/frontend" -Force | Out-Null
if (Test-Path "projects/cas-lookup/frontend/dist") {
    Copy-Item "projects/cas-lookup/frontend/dist" -Destination "$casStaging/frontend" -Recurse
}
tar -czf archives/cas-lookup.tar.gz -C $casStaging .
Remove-Item $casStaging -Recurse -Force

# Other projects
Write-Host "  Archiving Email Demo..."
tar -czf archives/email-demo.tar.gz -C projects/email-demo .
Write-Host "  Archiving Apollo Demo..."
tar -czf archives/apollo-demo.tar.gz -C projects/apollo-demo .
Write-Host "  Archiving SCM Static..."
tar -czf archives/scm-static.tar.gz -C projects/scm-static .

# 3. Create Support Files Locally
Write-Host "[2/5] Creating support files..." -ForegroundColor Cyan

# Service Files
$services = @{
    "cas-lookup"  = "app:app"
    "email-demo"  = "web_app:app"
    "apollo-demo" = "app:app"
    "scm-static"  = "app:app"
}

$ports = @{
    "cas-lookup"  = 5000
    "email-demo"  = 5001
    "apollo-demo" = 5002
    "scm-static"  = 5003
}

foreach ($svc in $services.Keys) {
    $entryPoint = $services[$svc]
    $port = $ports[$svc]
    $content = @"
[Unit]
Description=$svc App
After=network.target

[Service]
User=ec2-user
WorkingDirectory=/opt/$svc
ExecStart=/opt/$svc/venv/bin/gunicorn --workers 2 --bind 0.0.0.0:$port --timeout 600 $entryPoint
Restart=always

[Install]
WantedBy=multi-user.target
"@
    [System.IO.File]::WriteAllText((Join-Path "archives" "$svc.service"), ($content -replace "`r`n", "`n"))
}

# Nginx Config
$nginxConfig = @"
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
    }

    location /email-demo/ {
        proxy_pass http://127.0.0.1:5001/;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Script-Name /email-demo;
    }

    location /apollo/ {
        proxy_pass http://127.0.0.1:5002/;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Script-Name /apollo;
    }

    location /static-app/ {
        proxy_pass http://127.0.0.1:5003/;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Script-Name /static-app;
    }
}
"@
[System.IO.File]::WriteAllText((Join-Path "archives" "multi-app.conf"), ($nginxConfig -replace "`r`n", "`n"))

# Setup Script
$setupScript = @"
#!/bin/bash
set -x
set -e
exec > /tmp/setup.log 2>&1

echo "Installing prerequisites..."
sudo yum update -y
sudo yum install -y nginx python3.11 python3.11-pip git unzip

echo "Starting setup..."
# Ensure nginx is started and enabled
sudo systemctl enable nginx
sudo systemctl start nginx

# Stop and Clean
sudo systemctl stop cas-lookup email-demo apollo-demo scm-static || true
sudo rm -rf /opt/cas-lookup /opt/email-demo /opt/apollo-demo /opt/scm-static
sudo mkdir -p /opt/cas-lookup /opt/email-demo /opt/apollo-demo /opt/scm-static
sudo chown -R ec2-user:ec2-user /opt/cas-lookup /opt/email-demo /opt/apollo-demo /opt/scm-static

# Extract
tar -xzf /tmp/cas-lookup.tar.gz -C /opt/cas-lookup
tar -xzf /tmp/email-demo.tar.gz -C /opt/email-demo
tar -xzf /tmp/apollo-demo.tar.gz -C /opt/apollo-demo
tar -xzf /tmp/scm-static.tar.gz -C /opt/scm-static

# Venvs
for proj in cas-lookup email-demo apollo-demo scm-static; do
    echo "Processing `$proj..."
    cd /opt/`$proj
    python3.11 -m venv venv
    ./venv/bin/pip install --upgrade pip
    if [ -f "requirements.txt" ]; then
        ./venv/bin/pip install -r requirements.txt
    fi
    ./venv/bin/pip install gunicorn
    mkdir -p uploads
done

# Services
echo "Configuring services..."
for svc in cas-lookup email-demo apollo-demo scm-static; do
    sudo mv /tmp/`$svc.service /etc/systemd/system/
    sudo systemctl enable `$svc
    sudo systemctl restart `$svc
done

# Nginx
echo "Configuring nginx..."
sudo mv /tmp/multi-app.conf /etc/nginx/conf.d/
sudo systemctl restart nginx

echo "Setup finished."
"@
[System.IO.File]::WriteAllText((Join-Path "archives" "setup.sh"), ($setupScript -replace "`r`n", "`n"))

# 4. Upload and Execute
Write-Host "[3/5] Uploading and executing..." -ForegroundColor Cyan

# Upload files individually to ensure reliability
$filesToUpload = Get-ChildItem "archives"
foreach ($file in $filesToUpload) {
    Write-Host "  Uploading $($file.Name)..."
    scp -i $KEY_PATH -o StrictHostKeyChecking=no $file.FullName "${EC2_USER}@${ServerIP}:/tmp/"
}

ssh -i $KEY_PATH "${EC2_USER}@${ServerIP}" "chmod +x /tmp/setup.sh && /tmp/setup.sh"

Write-Host "[4/5] Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "App URLs:" -ForegroundColor Green
Write-Host "  CAS Lookup:  http://$ServerIP/"
Write-Host "  Email Demo:  http://$ServerIP/email-demo/"
Write-Host "  Apollo Demo: http://$ServerIP/apollo/"
Write-Host "  SCM Static:  http://$ServerIP/static-app/"
Write-Host ""
