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

# Build React App (SCM Static)
Write-Host "  Building SCM Static React app..."
Push-Location projects/scm-static
npm install
npm run build
Pop-Location

# CAS Lookup needs special handling (backend + frontend)
Write-Host "  Building CAS Lookup frontend..."
Push-Location projects/cas-lookup/frontend
npm install
npm run build
Pop-Location

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
Write-Host "  Archiving SCM Static (Build Assets)..."
tar -czf archives/scm-static.tar.gz -C projects/scm-static/build .

# 3. Create Support Files Locally
Write-Host "[2/5] Creating support files..." -ForegroundColor Cyan

# Service Files
$services = @{
    "cas-lookup"  = "app:app"
    "email-demo"  = "web_app:app"
    "apollo-demo" = "app:app"
}

$ports = @{
    "cas-lookup"  = 5000
    "email-demo"  = 5001
    "apollo-demo" = 5002
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
$confPath = Join-Path "archives" "multi-app.conf"
if (Test-Path $confPath) { Remove-Item $confPath -Force }

$nginxConfig = @'
server {
    listen 80;
    server_name scmmax.com www.scmmax.com;

    # Allow certbot challenge
    location /.well-known/acme-challenge/ {
        root /opt/scm-static;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name scmmax.com www.scmmax.com;

    ssl_certificate /etc/letsencrypt/live/scmmax.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/scmmax.com/privkey.pem;

    # SSL optimizations
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location /cas-lookup/ {
        proxy_pass http://127.0.0.1:5000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Script-Name /cas-lookup;
    }

    location /email-demo/ {
        proxy_pass http://127.0.0.1:5001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Script-Name /email-demo;
    }

    location /apollo/ {
        proxy_pass http://127.0.0.1:5002/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Script-Name /apollo;
    }

    location / {
        root /opt/scm-static;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
'@

# Generate Base4 for setup.sh to use
$confBytes = [System.Text.Encoding]::UTF8.GetBytes(($nginxConfig -replace "`r`n", "`n"))
$confBase64 = [Convert]::ToBase64String($confBytes)

# Verify local file (optional but keeps archives folder populated for manual check)
$utf8NoBOM = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($confPath, ($nginxConfig -replace "`r`n", "`n"), $utf8NoBOM)

# Setup Script
$setupScript = @"
#!/bin/bash
set -x
set -e

echo "Starting setup..."
sudo yum update -y
sudo yum install -y nginx python3.11 python3.11-pip git unzip certbot python3-certbot-nginx

# Ensure nginx is started and enabled
sudo systemctl enable nginx
sudo systemctl start nginx

# Stop and Clean
sudo systemctl stop cas-lookup email-demo apollo-demo || true
sudo systemctl disable scm-static || true
sudo rm -f /etc/systemd/system/scm-static.service || true

sudo rm -rf /opt/cas-lookup /opt/email-demo /opt/apollo-demo /opt/scm-static
sudo mkdir -p /opt/cas-lookup /opt/email-demo /opt/apollo-demo /opt/scm-static
sudo chown -R ec2-user:ec2-user /opt/cas-lookup /opt/email-demo /opt/apollo-demo /opt/scm-static

# Extract
tar -xzf /tmp/cas-lookup.tar.gz -C /opt/cas-lookup
tar -xzf /tmp/email-demo.tar.gz -C /opt/email-demo
tar -xzf /tmp/apollo-demo.tar.gz -C /opt/apollo-demo
tar -xzf /tmp/scm-static.tar.gz -C /opt/scm-static

# Venvs
for proj in cas-lookup email-demo apollo-demo; do
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

# Special handling for SCM Static (Static Only)
mkdir -p /opt/scm-static/uploads

# SSL Certificate Check and Generation
# We use a temporary nginx config to allow the challenge
echo "Checking SSL certificates..."
if [ ! -d "/etc/letsencrypt/live/scmmax.com" ]; then
    echo "Requesting SSL certificates for scmmax.com and www.scmmax.com..."
    # Create a minimal nginx config for the challenge
    cat <<EOF | sudo tee /etc/nginx/conf.d/multi-app.conf
server {
    listen 80;
    server_name scmmax.com www.scmmax.com;
    location /.well-known/acme-challenge/ {
        root /opt/scm-static;
    }
}
EOF
    sudo systemctl restart nginx
    sudo certbot certonly --nginx -d scmmax.com -d www.scmmax.com --non-interactive --agree-tos --register-unsafely-without-email
fi

# Nginx Final Config
echo "Configuring nginx..."
echo '$confBase64' | base64 -d | sudo tee /etc/nginx/conf.d/multi-app.conf > /dev/null
sudo nginx -t
sudo systemctl restart nginx

# Services
echo "Configuring services..."
for svc in cas-lookup email-demo apollo-demo; do
    sudo mv /tmp/`$svc.service /etc/systemd/system/
    sudo systemctl enable `$svc
    sudo systemctl restart `$svc || echo "Warning: Failed to restart `$svc"
done

echo "Setup finished."
"@
[System.IO.File]::WriteAllText((Join-Path "archives" "setup.sh"), ($setupScript -replace "`r`n", "`n"))

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
Write-Host "  SCM Static (Root): http://$ServerIP/"
Write-Host "  CAS Lookup:        http://$ServerIP/cas-lookup/"
Write-Host "  Email Demo:        http://$ServerIP/email-demo/"
Write-Host "  Apollo Demo:       http://$ServerIP/apollo/"
Write-Host ""
