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

# Build Campaign Website
Write-Host "  Building Campaign Website React app..."
Push-Location projects/campaign-website/frontend
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
Copy-Item "projects/cas-lookup/backend/*" -Destination $casStaging -Recurse -Exclude "venv","__pycache__"
New-Item -ItemType Directory -Path "$casStaging/frontend" -Force | Out-Null
if (Test-Path "projects/cas-lookup/frontend/dist") {
    Copy-Item "projects/cas-lookup/frontend/dist" -Destination "$casStaging/frontend" -Recurse
}
tar -czf archives/cas-lookup.tar.gz -C $casStaging .
Remove-Item $casStaging -Recurse -Force

# SCM Static needs both frontend build and backend
Write-Host "  Archiving SCM Static..."
$scmStaging = "staging_scm"
if (Test-Path $scmStaging) { Remove-Item $scmStaging -Recurse -Force }
New-Item -ItemType Directory -Path $scmStaging | Out-Null
Copy-Item "projects/scm-static/backend/*" -Destination $scmStaging -Recurse -Exclude "venv","__pycache__"
if (Test-Path "projects/scm-static/backend/.env") {
    Copy-Item "projects/scm-static/backend/.env" -Destination "$scmStaging/.env" -Force
}
if (Test-Path "projects/scm-static/backend/.env.example") {
    Copy-Item "projects/scm-static/backend/.env.example" -Destination "$scmStaging/.env.example" -Force
}
    New-Item -ItemType Directory -Path "$scmStaging/frontend/build" -Force | Out-Null
    Copy-Item "projects/scm-static/build/*" -Destination "$scmStaging/frontend/build" -Recurse -Force
tar -czf archives/scm-static.tar.gz -C $scmStaging .
Remove-Item $scmStaging -Recurse -Force

# Other projects
Write-Host "  Archiving Email Demo..."
tar -czf archives/email-demo.tar.gz -C projects/email-demo .
Write-Host "  Archiving Apollo Demo..."
tar -czf archives/apollo-demo.tar.gz -C projects/apollo-demo .

Write-Host "  Archiving Campaign Website..."
$campaignStaging = "staging_campaign"
if (Test-Path $campaignStaging) { Remove-Item $campaignStaging -Recurse -Force }
New-Item -ItemType Directory -Path $campaignStaging | Out-Null
Copy-Item "projects/campaign-website/backend/*" -Destination $campaignStaging -Recurse -Exclude "venv","__pycache__"
New-Item -ItemType Directory -Path "$campaignStaging/frontend" -Force | Out-Null
if (Test-Path "projects/campaign-website/frontend/dist") {
    Copy-Item "projects/campaign-website/frontend/dist" -Destination "$campaignStaging/frontend" -Recurse
}
tar -czf archives/campaign-website.tar.gz -C $campaignStaging .
Remove-Item $campaignStaging -Recurse -Force

# 3. Create Support Files Locally
Write-Host "[2/5] Creating support files..." -ForegroundColor Cyan

# Service Files
$services = @{
    "cas-lookup"  = "app:app"
    "email-demo"  = "web_app:app"
    "apollo-demo" = "app:app"
    "scm-static"  = "main:app"
    "campaign-website" = "main:app"
}

$workerArgs = @{
    "cas-lookup"  = ""
    "email-demo"  = ""
    "apollo-demo" = ""
    "scm-static"  = "-k uvicorn.workers.UvicornWorker"
    "campaign-website" = "-k uvicorn.workers.UvicornWorker"
}

$ports = @{
    "cas-lookup"  = 5000
    "email-demo"  = 5001
    "apollo-demo" = 5002
    "scm-static"  = 5003
    "campaign-website" = 5004
}

foreach ($svc in $services.Keys) {
    $entryPoint = $services[$svc]
    $port = $ports[$svc]
    $workerClass = $workerArgs[$svc]
    $content = @"
[Unit]
Description=$svc App
After=network.target

[Service]
User=ec2-user
WorkingDirectory=/opt/$svc
ExecStart=/opt/$svc/venv/bin/gunicorn $workerClass --workers 2 --bind 0.0.0.0:$port --timeout 600 $entryPoint
Restart=always

[Install]
WantedBy=multi-user.target
"@
    [System.IO.File]::WriteAllText((Join-Path "archives" "$svc.service"), ($content -replace "`r`n", "`n"))
}

# Nginx Config
$confPath = Join-Path "archives" "multi-app.conf"
if (Test-Path $confPath) { Remove-Item $confPath -Force }

# Nginx Config Template (Single-quoted to avoid PS expansion of $ variables)
$nginxConfigTemplate = @'
server {
    listen 80;
    server_name scmmax.com www.scmmax.com SERVER_IP_PLACEHOLDER;

    # Allow certbot challenge
    location /.well-known/acme-challenge/ {
        root /opt/scm-static/frontend/build;
    }

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

    location /api/ {
        proxy_pass http://127.0.0.1:5003/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location / {
        root /opt/scm-static/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}

server {
    listen 80;
    server_name campaigns.scmmax.com;

    location /.well-known/acme-challenge/ {
        root /opt/scm-static/frontend/build;
    }

    location / {
        proxy_pass http://127.0.0.1:5004/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
'@

$nginxConfig = $nginxConfigTemplate -replace 'SERVER_IP_PLACEHOLDER', $ServerIP
$confBytes = [System.Text.Encoding]::UTF8.GetBytes(($nginxConfig -replace "`r`n", "`n"))
$confBase64 = [Convert]::ToBase64String($confBytes)

# Verify local file (optional but keeps archives folder populated for manual check)
$utf8NoBOM = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($confPath, ($nginxConfig -replace "`r`n", "`n"), $utf8NoBOM)

# Setup Script Template
$setupScriptTemplate = @'
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
sudo systemctl stop cas-lookup email-demo apollo-demo scm-static campaign-website || true

# Backup databases if they exist
if [ -f "/opt/scm-static/downloads.db" ]; then
    echo "Backing up scm-static database..."
    sudo cp /opt/scm-static/downloads.db /tmp/downloads.db.bak
fi

if [ -f "/opt/campaign-website/campaigns.db" ]; then
    echo "Backing up campaign-website database..."
    sudo cp /opt/campaign-website/campaigns.db /tmp/campaigns.db.bak
fi

sudo rm -rf /opt/cas-lookup /opt/email-demo /opt/apollo-demo /opt/scm-static /opt/campaign-website
sudo mkdir -p /opt/cas-lookup /opt/email-demo /opt/apollo-demo /opt/scm-static /opt/campaign-website

# Restore databases if backups exist
if [ -f "/tmp/downloads.db.bak" ]; then
    echo "Restoring scm-static database..."
    sudo mv /tmp/downloads.db.bak /opt/scm-static/downloads.db
fi

if [ -f "/tmp/campaigns.db.bak" ]; then
    echo "Restoring campaign-website database..."
    sudo mv /tmp/campaigns.db.bak /opt/campaign-website/campaigns.db
fi

sudo chown -R ec2-user:ec2-user /opt/cas-lookup /opt/email-demo /opt/apollo-demo /opt/scm-static /opt/campaign-website

# Extract
tar -xzf /tmp/cas-lookup.tar.gz -C /opt/cas-lookup
tar -xzf /tmp/email-demo.tar.gz -C /opt/email-demo
tar -xzf /tmp/apollo-demo.tar.gz -C /opt/apollo-demo
tar -xzf /tmp/scm-static.tar.gz -C /opt/scm-static
tar -xzf /tmp/campaign-website.tar.gz -C /opt/campaign-website

# Venvs
for proj in cas-lookup email-demo apollo-demo scm-static campaign-website; do
    echo "Processing $proj..."
    cd /opt/$proj
    python3.11 -m venv venv
    ./venv/bin/pip install --upgrade pip
    if [ -f "requirements.txt" ]; then
        ./venv/bin/pip install -r requirements.txt
    fi
    ./venv/bin/pip install gunicorn
    mkdir -p uploads
done

# Nginx Config
echo "Configuring nginx..."
echo 'CONF_BASE64_PLACEHOLDER' | base64 -d | sudo tee /etc/nginx/conf.d/multi-app.conf > /dev/null
sudo nginx -t
sudo systemctl restart nginx

# SSL Certificate Check and Generation
echo "Checking SSL certificates..."
echo "Requesting SSL certificates for domains..."
# Attempt SSL but don't fail if it doesn't work (we have HTTP fallback)
sudo certbot --nginx -d scmmax.com -d www.scmmax.com -d campaigns.scmmax.com --non-interactive --agree-tos --register-unsafely-without-email --expand || echo "SSL certificate generation failed, continuing with HTTP only."

# Services
echo "Configuring services..."
for svc in cas-lookup email-demo apollo-demo scm-static campaign-website; do
    sudo mv /tmp/$svc.service /etc/systemd/system/
    sudo systemctl enable $svc
    sudo systemctl restart $svc
done

# Verify service health and fail deployment if any service is down
for svc in cas-lookup email-demo apollo-demo scm-static campaign-website; do
    if ! sudo systemctl is-active --quiet $svc; then
        echo "ERROR: Service $svc failed to start"
        sudo journalctl -u $svc -n 80 --no-pager || true
        exit 1
    fi
done

echo "Setup finished."
'@

$setupScript = $setupScriptTemplate -replace 'CONF_BASE64_PLACEHOLDER', $confBase64
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
Write-Host "  SCM Static (Root): http://$ServerIP/ (scmmax.com)"
Write-Host "  CAS Lookup:        http://$ServerIP/cas-lookup/"
Write-Host "  Email Demo:        http://$ServerIP/email-demo/"
Write-Host "  Apollo Demo:       http://$ServerIP/apollo/"
Write-Host "  Campaigns (P):     http://campaigns.scmmax.com/p/:slug"
Write-Host "  Campaigns (I):     http://campaigns.scmmax.com/i/:slug"
Write-Host "  Campaign Admin:    http://campaigns.scmmax.com/admin/ingest"
Write-Host ""
