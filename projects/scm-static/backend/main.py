from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
import os
import boto3
import secrets
import smtplib
import traceback
from datetime import datetime
from dotenv import load_dotenv
from botocore.exceptions import ClientError
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import sqlite3
import pandas as pd
import io
from fastapi.responses import JSONResponse, StreamingResponse
from starlette.responses import RedirectResponse

# 1. Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 2. Load Environment
load_dotenv()

# 3. Initialize App
app = FastAPI(title="SCMmax API Diagnostic")

# 4. CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 5. Global Config
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
BASE_URL = os.getenv("BASE_URL")
DATABASE_URL = os.getenv("DATABASE_URL", "downloads.db")
ADMIN_SECRET_KEY = os.getenv("ADMIN_SECRET_KEY", "scmmax_admin_secret")

PUBLIC_DOMAINS = {"gmail.com", "yahoo.com", "outlook.com", "hotmail.com"}
BLOCKED_COMPANIES = {"accenture.com", "deloitte.com", "ibm.com", "kpmg.com"}

# 6. Models
class DownloadRequest(BaseModel):
    name: str
    email: str

class ContactRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    job_title: str
    company: str
    direct_spend: str
    erp_systems: list
    procurement_systems: list

DOWNLOAD_TRACKS = {}

# 7. S3 Client
s3_params = {"region_name": AWS_REGION}
if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
    s3_params["aws_access_key_id"] = AWS_ACCESS_KEY_ID
    s3_params["aws_secret_access_key"] = AWS_SECRET_ACCESS_KEY
s3_client = boto3.client("s3", **s3_params)

# 8. Database Utility Functions
def init_db():
    conn = sqlite3.connect(DATABASE_URL)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS download_tracking (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            token TEXT UNIQUE,
            name TEXT,
            email TEXT,
            created_at DATETIME,
            is_downloaded INTEGER DEFAULT 0,
            downloaded_at DATETIME,
            ip_address TEXT,
            user_agent TEXT,
            click_count INTEGER DEFAULT 0
        )
    ''')
    conn.commit()
    conn.close()
    logger.info("Database initialized.")

def save_download_request(token, name, email, ip, ua):
    try:
        conn = sqlite3.connect(DATABASE_URL)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO download_tracking (token, name, email, created_at, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (token, name, email, datetime.now().isoformat(), ip, ua))
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"DB Insert Error: {e}")

def update_download_click(token, ip, ua):
    try:
        conn = sqlite3.connect(DATABASE_URL)
        cursor = conn.cursor()
        # Update if not already downloaded or just increment click count
        cursor.execute('''
            UPDATE download_tracking 
            SET is_downloaded = 1, 
                downloaded_at = COALESCE(downloaded_at, ?),
                click_count = click_count + 1,
                ip_address = ?,
                user_agent = ?
            WHERE token = ?
        ''', (datetime.now().isoformat(), ip, ua, token))
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"DB Update Error: {e}")

def get_downloads_from_db():
    try:
        conn = sqlite3.connect(DATABASE_URL)
        # Use pandas for easy conversion if possible, or just raw sqlite
        cursor = conn.cursor()
        cursor.execute('SELECT name, email, created_at, is_downloaded, downloaded_at, ip_address, user_agent, click_count FROM download_tracking ORDER BY created_at DESC')
        rows = cursor.fetchall()
        columns = [column[0] for column in cursor.description]
        data = [dict(zip(columns, row)) for row in rows]
        conn.close()
        return data
    except Exception as e:
        logger.error(f"DB Fetch Error: {e}")
        return []

# Run DB init on module load
init_db()

# 9. Utility Functions
def validate_business_email(email: str):
    domain = email.split('@')[-1].lower()
    if domain in PUBLIC_DOMAINS:
        raise HTTPException(status_code=400, detail="Personal email (Gmail, etc.) is not allowed. Please use your work email.")

def create_presigned_url(expiration=3600):
    try:
        return s3_client.generate_presigned_url('get_object', Params={'Bucket': S3_BUCKET_NAME, 'Key': S3_FILE_KEY}, ExpiresIn=expiration)
    except Exception as e:
        logger.error(f"S3 Error: {e}")
        return None

def safe_log_to_file(error_msg: str):
    """Safely log to a file, handling potential permission or path errors."""
    try:
        log_paths = ["/tmp/scm_debug.log", "scm_debug.log"]
        # On Windows, /tmp works if C:\tmp exists, but local scm_debug.log is safer
        for path in log_paths:
            try:
                with open(path, "a") as f:
                    f.write(f"\n[{datetime.now().isoformat()}] {error_msg}\n{traceback.format_exc()}\n")
                break # Stop if successful
            except:
                continue
    except:
        pass # Absolute fail-safe: never crash the error handler

def send_generic_email(to_email: str, subject: str, text_body: str, html_body: str):
    """Generic utility to send multi-part emails."""
    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        
        msg = MIMEMultipart('alternative')
        msg['From'] = f"SCMmax <{SENDER_EMAIL}>"
        msg['To'] = to_email
        msg['Subject'] = subject

        # Attach plain text first, then HTML as per RFC standards for alternative types
        msg.attach(MIMEText(text_body, 'plain'))
        msg.attach(MIMEText(html_body, 'html'))
        
        server.sendmail(SENDER_EMAIL, to_email, msg.as_string())
        server.quit()
        logger.info(f"Email sent successfully to {to_email}")
    except Exception as e:
        error_msg = f"GENERIC EMAIL ERROR ({to_email}): {e}"
        logger.error(error_msg)
        safe_log_to_file(error_msg)

def notify_user_download(data: DownloadRequest, tracking_url: str):
    subject = "Your SCMmax Agent Overview Download Link"
    text_body = (
        f"Hello {data.name},\n\n"
        "Thank you for your interest in SCMmax.\n"
        "Use the secure link below to download the Agent Overview:\n\n"
        f"{tracking_url}\n\n"
        "If you did not request this, you can ignore this email.\n\n"
        "Regards,\n"
        "SCMmax Team"
    )
    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
        <p>Hello {data.name},</p>
        <p>Thank you for your interest in <strong>SCMmax</strong>.</p>
        <p>Please use the secure link below to download the Agent Overview:</p>
        <p style="margin: 20px 0;">
          <a href="{tracking_url}" style="background:#0f766e;color:#ffffff;padding:10px 16px;text-decoration:none;border-radius:4px;display:inline-block;">
            Download Agent Overview
          </a>
        </p>
        <p>If the button does not work, copy and paste this URL into your browser:</p>
        <p><a href="{tracking_url}">{tracking_url}</a></p>
        <p>If you did not request this, you can ignore this email.</p>
        <p>Regards,<br/>SCMmax Team</p>
      </body>
    </html>
    """
    send_generic_email(data.email, subject, text_body, html_body)

def notify_sales_download(data: DownloadRequest):
    subject = f"NEW Download Request: {data.name}"
    text_body = f"New download request received:\n\nName: {data.name}\nEmail: {data.email}\nDate: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    html_body = f"""
    <html>
      <body>
        <h3>New Download Request Received</h3>
        <p><strong>Name:</strong> {data.name}</p>
        <p><strong>Email:</strong> {data.email}</p>
        <p><strong>Date:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
      </body>
    </html>
    """
    send_generic_email(SALES_EMAIL, subject, text_body, html_body)

def notify_user_contact(data: ContactRequest):
    subject = "Thank you for requesting a demo - SCMmax"
    text_body = f"Hello {data.first_name},\n\nThank you for requesting a demo of Apollo. A member of our team will reach out within 24 hours to confirm your session.\n\nSCMmax Team"
    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif;">
        <p>Hello {data.first_name},</p>
        <p>Thank you for requesting a demo of <strong>Apollo</strong>. We're excited to show you the power of AI-driven procurement.</p>
        <p>A member of our team will reach out to you within 24 hours to confirm timing and next steps.</p>
        <p>Regards,<br/>SCMmax Team</p>
      </body>
    </html>
    """
    send_generic_email(data.email, subject, text_body, html_body)

def notify_sales_contact(data: ContactRequest):
    subject = f"NEW Demo Request: {data.company} - {data.first_name} {data.last_name}"
    erp_list = ", ".join(data.erp_systems) if data.erp_systems else "None"
    proc_list = ", ".join(data.procurement_systems) if data.procurement_systems else "None"
    
    text_body = (
        f"New demo request received:\n\n"
        f"Name: {data.first_name} {data.last_name}\n"
        f"Email: {data.email}\n"
        f"Job Title: {data.job_title}\n"
        f"Company: {data.company}\n"
        f"Direct Spend: {data.direct_spend}\n"
        f"ERP Systems: {erp_list}\n"
        f"Procurement Systems: {proc_list}\n"
    )
    html_body = f"""
    <html>
      <body>
        <h3>New Demo Request Received</h3>
        <table border="0" cellpadding="5">
          <tr><td><strong>Name:</strong></td><td>{data.first_name} {data.last_name}</td></tr>
          <tr><td><strong>Email:</strong></td><td>{data.email}</td></tr>
          <tr><td><strong>Job Title:</strong></td><td>{data.job_title}</td></tr>
          <tr><td><strong>Company:</strong></td><td>{data.company}</td></tr>
          <tr><td><strong>Direct Spend:</strong></td><td>{data.direct_spend}</td></tr>
          <tr><td><strong>ERP Systems:</strong></td><td>{erp_list}</td></tr>
          <tr><td><strong>Procurement Systems:</strong></td><td>{proc_list}</td></tr>
        </table>
      </body>
    </html>
    """
    send_generic_email(SALES_EMAIL, subject, text_body, html_body)

def notify_sales_download_link_clicked(user_data: dict):
    subject = f"FILE DOWNLOADED: {user_data['name']}"
    text_body = f"User has successfully clicked the download link for Agent Overview:\n\nName: {user_data['name']}\nEmail: {user_data['email']}\nTime: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    html_body = f"""
    <html>
      <body>
        <h3 style="color: #0f766e;">Agent Overview Downloaded</h3>
        <p>The following user has just clicked the download link from their email:</p>
        <p><strong>Name:</strong> {user_data['name']}</p>
        <p><strong>Email:</strong> {user_data['email']}</p>
        <p><strong>Time:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
      </body>
    </html>
    """
    send_generic_email(SALES_EMAIL, subject, text_body, html_body)

# 9. ROUTES
@app.get("/api/health")
async def health_check():
    return {"status": "diagnostic_mode", "routes": [r.path for r in app.routes]}

@app.post("/api/download-request")
async def handle_download_request(data: DownloadRequest, background_tasks: BackgroundTasks, request: Request):
    logger.info(f"DIAGNOSTIC: Received download request for {data.email}")
    try:
        validate_business_email(data.email)
        token = secrets.token_urlsafe(32)
        DOWNLOAD_TRACKS[token] = {
            "name": data.name, 
            "email": data.email,
            "notified": False,
            "created_at": datetime.now().isoformat()
        }
        
        # Save to SQLite
        ip = request.client.host if request.client else "unknown"
        ua = request.headers.get("user-agent", "unknown")
        save_download_request(token, data.name, data.email, ip, ua)
        
        # Force BASE_URL to scmmax.com if it's currently localhost or IP for production safety
        if BASE_URL:
            public_base_url = BASE_URL.rstrip("/")
        else:
            # Infer from request, but strip 127.0.0.1/localhost if we have a real host header
            inferred = str(request.base_url).rstrip("/")
            if "localhost" in inferred or "127.0.0.1" in inferred:
                logger.warning(f"DIAGNOSTIC: BASE_URL not found, using inferred: {inferred}")
            public_base_url = inferred
            
        tracking_url = f"{public_base_url}/api/download/{token}"
        
        if SMTP_USERNAME and SMTP_PASSWORD:
            background_tasks.add_task(notify_user_download, data, tracking_url)
            background_tasks.add_task(notify_sales_download, data)
            
        return {"status": "success", "token_created": True}
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"DIAGNOSTIC DOWNLOAD ERROR: {e}"
        logger.error(error_msg)
        safe_log_to_file(error_msg)
        return JSONResponse(
            status_code=500,
            content={"status": "error", "detail": f"Server processing error: {str(e)}", "type": "INTERNAL_CRASH"}
        )

@app.post("/api/contact")
async def handle_contact_request(data: ContactRequest, background_tasks: BackgroundTasks):
    logger.info(f"DIAGNOSTIC: Received contact request from {data.email}")
    try:
        validate_business_email(data.email)
        
        if SMTP_USERNAME and SMTP_PASSWORD:
            background_tasks.add_task(notify_user_contact, data)
            background_tasks.add_task(notify_sales_contact, data)
            
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"DIAGNOSTIC CONTACT ERROR: {e}"
        logger.error(error_msg)
        safe_log_to_file(error_msg)
        return JSONResponse(
            status_code=500,
            content={"status": "error", "detail": str(e), "type": "INTERNAL_CRASH"}
        )

@app.get("/api/download/{token}")
async def track_download(token: str, request: Request, background_tasks: BackgroundTasks):
    ip = request.client.host if request.client else "unknown"
    ua = request.headers.get("user-agent", "unknown")
    
    # Update DB
    update_download_click(token, ip, ua)

    if token not in DOWNLOAD_TRACKS:
        # If not in memory but in DB, we should still allow it (fallback)
        logger.warning(f"DIAGNOSTIC: Token not in memory, checking DB: {token}")
        # For now, let's just proceed with redirect if we updated DB successfully
    
    user_data = DOWNLOAD_TRACKS.get(token)
    
    # Notify sales ONLY the first time the link is clicked
    if user_data and not user_data.get("notified", False):
        logger.info(f"DIAGNOSTIC: First download click for {user_data['email']}")
        user_data["notified"] = True
        user_data["downloaded_at"] = datetime.now().isoformat()
        if SMTP_USERNAME and SMTP_PASSWORD:
            background_tasks.add_task(notify_sales_download_link_clicked, user_data)
    else:
        logger.info(f"DIAGNOSTIC: Repeat download click or token missing from memory.")
        
    return RedirectResponse(url=create_presigned_url() or "https://scmmax.com")

# 10. ADMIN ROUTES
@app.get("/api/admin/downloads")
async def get_admin_downloads(key: str = None):
    # Basic protection
    if key != ADMIN_SECRET_KEY:
        return JSONResponse(status_code=403, content={"detail": "Unauthorized"})
    
    data = get_downloads_from_db()
    return {"status": "success", "count": len(data), "data": data}

@app.get("/api/admin/downloads/csv")
async def get_admin_downloads_csv(key: str = None):
    if key != ADMIN_SECRET_KEY:
        return JSONResponse(status_code=403, content={"detail": "Unauthorized"})
    
    data = get_downloads_from_db()
    if not data:
        return JSONResponse(content={"detail": "No data"})
    
    df = pd.DataFrame(data)
    
    # Create CSV in memory
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    
    response = StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=downloads_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
    )
    return response

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
