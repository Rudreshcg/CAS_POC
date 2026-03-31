from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging

import os
import boto3
from dotenv import load_dotenv
from botocore.exceptions import ClientError

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Load environment variables
load_dotenv()

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
S3_FILE_KEY = os.getenv("S3_FILE_KEY")

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.office365.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SALES_EMAIL = os.getenv("SALES_EMAIL", "sales@scmmax.com")

# Initialize S3 client
s3_client = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION
)

app = FastAPI()

# CORS configuration to allow React app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DownloadRequest(BaseModel):
    name: str
    email: EmailStr

# Blocked Public Email Providers
PUBLIC_DOMAINS = {
    "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", 
    "icloud.com", "protonmail.com", "zoho.com", "mail.com", 
    "gmx.com", "yandex.com", "aol.com", "live.com"
}

# Blocked Competitor/Big-Firm Domains
BLOCKED_COMPANIES = {
    "accenture.com", "deloitte.com", "ibm.com", "kpmg.com", 
    "ey.com", "pwc.com", "capgemini.com"
}

def validate_business_email(email: str):
    domain = email.split('@')[-1].lower()
    if domain in PUBLIC_DOMAINS:
        raise HTTPException(status_code=400, detail="Personal email addresses (Gmail, Yahoo, etc.) are not allowed. Please use your work email.")
    if domain in BLOCKED_COMPANIES:
        raise HTTPException(status_code=403, detail="Our records indicate your firm is restricted from downloading this proprietary material. Please contact our sales team directly.")

def create_presigned_url(expiration=3600):
    """Generate a presigned URL to share an S3 object"""
    try:
        response = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': S3_BUCKET_NAME, 'Key': S3_FILE_KEY},
            ExpiresIn=expiration
        )
    except ClientError as e:
        logger.error(f"S3 Error: {e}")
        return None
    return response

def send_email_notifications(request: DownloadRequest, download_url: str):
    """Send personal download link and internal alert via SMTP"""
    try:
        # Create server connection
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)

        # 1. Send to User
        msg_user = MIMEMultipart()
        msg_user['From'] = SENDER_EMAIL
        msg_user['To'] = request.email
        msg_user['Subject'] = 'Your SCMmax Agent Overview Download Link'
        
        body_user = f"""
        <html>
        <body>
            <h2>Hello {request.name},</h2>
            <p>Thank you for your interest in SCMmax. You can download the Agent Overview using the personalized link below:</p>
            <p><a href="{download_url}" style="padding: 10px 20px; background-color: #C9933A; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">Download Agent Overview</a></p>
            <p><i>Note: This link will expire in 1 hour for security purposes.</i></p>
            <br>
            <p>Best regards,<br>The SCMmax Team</p>
        </body>
        </html>
        """
        msg_user.attach(MIMEText(body_user, 'html'))
        server.send_message(msg_user)
        
        # 2. Alert Sales
        msg_sales = MIMEMultipart()
        msg_sales['From'] = SENDER_EMAIL
        msg_sales['To'] = SALES_EMAIL
        msg_sales['Subject'] = f'New Download: {request.name}'
        
        body_sales = f"User: {request.name}\nEmail: {request.email}\nHas requested and received a download link for the Agent Overview."
        msg_sales.attach(MIMEText(body_sales, 'plain'))
        server.send_message(msg_sales)

        server.quit()
        logger.info(f"SMTP Emails sent successfully for {request.email}")
    except Exception as e:
        logger.error(f"SMTP Error: {e}")

@app.post("/api/download-request")
async def handle_download_request(request: DownloadRequest, background_tasks: BackgroundTasks):
    # 1. Validate Email
    validate_business_email(request.email)
    
    # 2. Generate Secure Link
    download_url = create_presigned_url()
    if not download_url:
        # Fallback for testing if S3 is not configured
        download_url = "https://scmmax.com/fallback-download"
        logger.warning("S3 URL generation failed, using fallback.")
    
    # 3. Trigger Email Notifications in Background
    if SMTP_USERNAME and SMTP_PASSWORD:
        background_tasks.add_task(send_email_notifications, request, download_url)
    else:
        logger.warning("SMTP credentials missing. Logging request only.")
        logger.info(f"STUB: Sending email to {request.email} with link {download_url}")
    
    return {
        "status": "success",
        "message": f"Verification successful! We have sent the download link to {request.email}.",
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
