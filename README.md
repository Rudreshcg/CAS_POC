# CAS Lookup Application

A Flask-based web application that automatically finds CAS Registry Numbers for chemical descriptions using a multi-stage lookup process, including AI-powered cleaning.

## Features

- **Automated CAS Lookup**: Queries the CAS Common Chemistry API.
- **Intelligent Cleaning**: 
  - Uses regex heuristics to clean common noise words.
  - Generates smart variations for complex names (e.g., Polyglycerol -> Polyglyceryl).
  - **LLM-Powered Fallback**: Uses **AWS Bedrock (Llama 3)** to intelligently extract chemical names when standard lookups fail.
- **INCI Support**: Automatically finds INCI names for cosmetic ingredients.
- **Batch Processing**: Process CSV files with thousands of rows.
- **Real-Time Progress**: View results as they are found.

## Prerequisites

- **Python 3.11+**
- **AWS Credentials** (for Bedrock AI features):
  - Access to `bedrock-runtime`
  - Access to `meta.llama3-70b-instruct-v1:0` model

## Local Setup

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure AWS Credentials**
   Ensure you have AWS credentials configured in `~/.aws/credentials` or environment variables:
   ```bash
   export AWS_PROFILE=default
   # OR
   export AWS_ACCESS_KEY_ID=...
   export AWS_SECRET_ACCESS_KEY=...
   ```

3. **Run Application**
   ```bash
   python app.py
   ```
   Open http://localhost:5000 in your browser.

## Deployment on AWS EC2

This project includes a fully automated deployment pipeline using Terraform and PowerShell.

### 1. One-Time Infrastructure Setup
Navigate to the terraform directory:
```powershell
cd terraform/ec2

# 1. Generate SSH Key
ssh-keygen -t rsa -b 4096 -f cas_app_key -N ""

# 2. Init Terraform
terraform init

# 3. Deploy Infrastructure (EC2 + IAM Role + SG)
terraform apply -auto-approve
```
*Note: This creates an EC2 instance with an IAM Role that automatically allows access to AWS Bedrock.*

### 2. Deploy Application Code
From the project root:
```powershell
.\deploy.ps1
```
This script will:
1. Zip your code
2. Upload it to the EC2 instance
3. Install dependencies (including `boto3`)
4. Restart the service

### 3. Verification
The `deploy.ps1` script will output your application URL.
Example: `http://34.123.45.67`

## Troubleshooting

- **"NOT FOUND" Results**: 
  - Check if the description is too generic.
  - Verify AWS Bedrock access if "AI" fallback is expected.
- **Bedrock Errors**:
  - Check EC2 IAM role permissions (handle by Terraform automatically).
  - Verify model access in AWS Console (Model Access > Enable Llama 3).
