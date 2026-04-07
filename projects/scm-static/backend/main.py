from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging

import os
import boto3
from dotenv import load_dotenv
from botocore.exceptions import ClientError
from botocore.config import Config

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

import secrets
from starlette.responses import RedirectResponse

# Load environment variables
load_dotenv()

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
S3_FILE_KEY = os.getenv("S3_FILE_KEY")

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SALES_EMAIL = os.getenv("SALES_EMAIL", "sales@scmmax.com")
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")

# In-memory storage for tracking (In production, use Redis or a Database)
# Structure: { "token": { "name": "...", "email": "...", "requested_at": "..." } }
DOWNLOAD_TRACKS = {}

# Initialize S3 client
s3_params = {
    "region_name": AWS_REGION
}
# Only pass explicit keys if they are non-empty strings
if AWS_ACCESS_KEY_ID and AWS_ACCESS_KEY_ID.strip() and AWS_SECRET_ACCESS_KEY and AWS_SECRET_ACCESS_KEY.strip():
    s3_params["aws_access_key_id"] = AWS_ACCESS_KEY_ID
    s3_params["aws_secret_access_key"] = AWS_SECRET_ACCESS_KEY

s3_client = boto3.client("s3", **s3_params)

app = FastAPI()

# CORS configuration to allow React app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DownloadRequest(BaseModel):
    name: str
    email: str

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
    except Exception as e:
        logger.error(f"S3 Client Error: {e}")
        return None
    return response

def send_email_notifications(request: DownloadRequest, tracking_url: str):
    """Send personalized tracking link and internal alert via SMTP"""
    try:
        # Create server connection
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.set_debuglevel(1)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)

        # 1. Send to User
        msg_user = MIMEMultipart()
        msg_user['From'] = f"SCMmax <{SENDER_EMAIL}>"
        msg_user['To'] = request.email
        msg_user['Subject'] = 'Your SCMmax Agent Overview Download Link'
        
        body_user = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #0F1421;">Hello {request.name},</h2>
            <p>Thank you for your interest in SCMmax. You can download the Agent Overview by clicking the button below:</p>
            <p><a href="{tracking_url}" style="padding: 12px 24px; background-color: #C9933A; color: white; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Download Agent Overview</a></p>
            <p><i>Note: For security reasons, this link will expire in 1 hour.</i></p>
            <br>
            <p>Best regards,<br><strong>The SCMmax Team</strong></p>
        </body>
        </html>
        """
        msg_user.attach(MIMEText(body_user, 'html'))
        server.send_message(msg_user)
        
        # 2. Alert Sales
        msg_sales = MIMEMultipart()
        msg_sales['From'] = SENDER_EMAIL
        msg_sales['To'] = SALES_EMAIL
        msg_sales['Subject'] = f'New Download Requested: {request.name}'
        
        body_sales = f"User: {request.name}\nEmail: {request.email}\nHas requested the Agent Overview. A tracking link has been sent to them."
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
    
    # 2. Create Tracking Token
    token = secrets.token_urlsafe(32)
    DOWNLOAD_TRACKS[token] = {
        "name": request.name,
        "email": request.email,
        "status": "pending"
    }
    
    # 3. Construct Tracking URL
    tracking_url = f"{BASE_URL}/api/download/{token}"
    
    # 4. Trigger Email Notifications in Background
    if SMTP_USERNAME and SMTP_PASSWORD:
        background_tasks.add_task(send_email_notifications, request, tracking_url)
    else:
        logger.warning(f"SMTP credentials missing. Tracking link: {tracking_url}")
    
    return {
        "status": "success",
        "message": "Verification successful! We have sent the download link to your email.",
    }

@app.get("/api/download/{token}")
async def track_download(token: str):
    # 1. Validate Token
    if token not in DOWNLOAD_TRACKS:
        raise HTTPException(status_code=404, detail="Invalid or expired download link.")
    
    user_info = DOWNLOAD_TRACKS[token]
    
    # 2. Log actual download
    logger.info(f"FILE DOWNLOADED: {user_info['name']} ({user_info['email']})")
    DOWNLOAD_TRACKS[token]["status"] = "downloaded"
    
    # 3. Generate Secure S3 Link (Freshly signed)
    s3_url = create_presigned_url()
    if not s3_url:
        # Fallback if S3 is not configured
        s3_url = "https://scmmax.com/fallback-download"
        logger.warning("S3 URL generation failed, redirecting to fallback.")
    
    # 4. Redirect to S3
    return RedirectResponse(url=s3_url)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
