# EC2 Deployment - Quick Start Guide

## One-Time Setup (5 minutes)

### Step 1: Generate SSH Key

```powershell
cd c:\SMC-MAX\CAS_POC\terraform\ec2

# Generate SSH key pair
ssh-keygen -t rsa -b 4096 -f cas_app_key -N ""
```

This creates:
- `cas_app_key` (private key)
- `cas_app_key.pub` (public key)

### Step 2: Deploy Infrastructure

```powershell
# Initialize Terraform
terraform init

# Deploy EC2 instance (and IAM Role for Bedrock)
terraform apply -auto-approve
```

> [!IMPORTANT]
> If you are updating an existing deployment to support the new LLM features, you MUST run `terraform apply` again to create and attach the IAM Role for Bedrock access.

**Wait ~5 minutes** for the instance to be ready.

### Step 3: Initial Deployment

```powershell
cd c:\SMC-MAX\CAS_POC

# Deploy your app
.\deploy.ps1
```

**That's it!** Your React app will be running.

---

## Future Updates (Just 1 Command!)

Whenever you update your code:

```powershell
.\deploy.ps1
```

Done! Your changes are live in ~30 seconds.

---

## What Gets Deployed

The `deploy.ps1` script:
1. ✅ **Builds React frontend** (`npm run build`)
2. ✅ Packages backend + frontend/dist
3. ✅ Uploads to EC2
4. ✅ Installs Python dependencies (including flask-cors)
5. ✅ Restarts the app
6. ✅ Shows you the URL

**Deployment Structure on EC2:**
```
/opt/cas-lookup/
├── app.py
├── llm_helper.py
├── requirements.txt
├── material_clusters.json
├── frontend/
│   └── dist/
│       ├── index.html
│       ├── assets/
│       └── ...
├── uploads/
└── outputs/
```

---

## Architecture

**Frontend (React + Vite):**
- Built with `npm run build` → creates `frontend/dist/`
- Served by Flask as static files
- Routes handled by React Router

**Backend (Flask):**
- Serves React app from `/` route
- API endpoints: `/upload`, `/process`, `/download`, `/clusters`
- CORS enabled for React API calls
- Auto-detects environment (local vs EC2)

**Deployment:**
- Gunicorn runs Flask on port 5000
- Systemd service for auto-restart
- Elastic IP for stable access

---

## Useful Commands

```powershell
# Get app URL
cd terraform\ec2
terraform output application_url

# SSH into server
ssh -i terraform\ec2\cas_app_key ec2-user@<IP>

# View logs
ssh -i terraform\ec2\cas_app_key ec2-user@<IP> 'sudo journalctl -u cas-lookup -f'

# Check app status
ssh -i terraform\ec2\cas_app_key ec2-user@<IP> 'sudo systemctl status cas-lookup'

# Verify directory structure
ssh -i terraform\ec2\cas_app_key ec2-user@<IP> 'ls -la /opt/cas-lookup/'
ssh -i terraform\ec2\cas_app_key ec2-user@<IP> 'ls -la /opt/cas-lookup/frontend/dist/'

# Restart service manually
ssh -i terraform\ec2\cas_app_key ec2-user@<IP> 'sudo systemctl restart cas-lookup'
```

---

## Troubleshooting

### React App Not Loading (404 or Blank Page)

**Check if frontend was built:**
```powershell
# Local check
Test-Path "c:\SMC-MAX\CAS_POC\frontend\dist\index.html"

# EC2 check
ssh -i terraform\ec2\cas_app_key ec2-user@<IP> 'ls -la /opt/cas-lookup/frontend/dist/'
```

**Solution:** Rebuild and redeploy
```powershell
cd c:\SMC-MAX\CAS_POC\frontend
npm run build
cd ..
.\deploy.ps1
```

### API Calls Failing (CORS Errors)

**Check logs for CORS errors:**
```powershell
ssh -i terraform\ec2\cas_app_key ec2-user@<IP> 'sudo journalctl -u cas-lookup -n 100'
```

**Solution:** Ensure flask-cors is installed
```powershell
ssh -i terraform\ec2\cas_app_key ec2-user@<IP> 'cd /opt/cas-lookup && python3.11 -m pip list | grep flask-cors'
```

### Service Won't Start

**Check service status:**
```powershell
ssh -i terraform\ec2\cas_app_key ec2-user@<IP> 'sudo systemctl status cas-lookup'
```

**Check for Python errors:**
```powershell
ssh -i terraform\ec2\cas_app_key ec2-user@<IP> 'sudo journalctl -u cas-lookup -n 50'
```

**Common issues:**
- Missing dependencies: Redeploy with `.\deploy.ps1`
- Port already in use: Restart EC2 instance
- Static folder not found: Check directory structure (see commands above)

### Routes Not Working (React Router)

**Symptom:** Direct navigation to `/clusters` returns 404

**Solution:** This should work automatically. Flask's catch-all route serves `index.html` for all non-API routes, allowing React Router to handle routing.

If it doesn't work, check Flask logs:
```powershell
ssh -i terraform\ec2\cas_app_key ec2-user@<IP> 'sudo journalctl -u cas-lookup -f'
```

---

## Cost

- **EC2 t3.small**: ~$15/month
- **Elastic IP**: Free (when attached)
- **Data Transfer**: ~$1/month
- **Total**: ~$16/month

---

## Next Steps

Run these commands now:

```powershell
# 1. Generate SSH key
cd c:\SMC-MAX\CAS_POC\terraform\ec2
ssh-keygen -t rsa -b 4096 -f cas_app_key -N ""

# 2. Deploy infrastructure
terraform init
terraform apply -auto-approve

# 3. Deploy app
cd c:\SMC-MAX\CAS_POC
.\deploy.ps1
```

Your React app will be live in ~5 minutes!

