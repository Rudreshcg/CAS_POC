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

**That's it!** Your app will be running.

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
1. ✅ Zips your code
2. ✅ Uploads to EC2
3. ✅ Installs dependencies
4. ✅ Restarts the app
5. ✅ Shows you the URL

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

Your app will be live in ~5 minutes!
