from fastapi import FastAPI, HTTPException, Request, BackgroundTasks, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import json
import os
import smtplib
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import csv
import io
import secrets
import boto3
from botocore.exceptions import ClientError
from urllib.parse import urlparse

load_dotenv()

app = FastAPI(title="SCMmax Campaign API")

# Configure static folder
current_dir = os.path.dirname(os.path.abspath(__file__))
# Check if we are in backend folder or root
if os.path.basename(current_dir) == 'backend':
    static_dir = os.path.abspath(os.path.join(current_dir, '../frontend/dist'))
else:
    static_dir = os.path.abspath(os.path.join(current_dir, 'frontend/dist'))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv("DATABASE_URL", "campaigns.db")
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
ADMIN_SECRET_KEY = os.getenv("ADMIN_SECRET_KEY", "campaign_secret_2025")

# S3 Client Setup
aws_key = os.getenv("AWS_ACCESS_KEY_ID")
aws_secret = os.getenv("AWS_SECRET_ACCESS_KEY")
aws_region = os.getenv("AWS_REGION", "us-east-1")

s3_kwargs = {'region_name': aws_region}
if aws_key and aws_key.strip():
    s3_kwargs['aws_access_key_id'] = aws_key.strip()
if aws_secret and aws_secret.strip():
    s3_kwargs['aws_secret_access_key'] = aws_secret.strip()

s3_client = boto3.client('s3', **s3_kwargs)

def get_s3_presigned_url(s3_url: str, expiration=3600):
    if not s3_url or not s3_url.startswith("https://") or ".s3." not in s3_url:
        return s3_url
    
    try:
        # Parse bucket and key from URL
        # Format: https://bucket-name.s3.region.amazonaws.com/key
        # Or: https://bucket-name.s3.amazonaws.com/key
        parsed = urlparse(s3_url)
        bucket = parsed.netloc.split('.')[0]
        key = parsed.path.lstrip('/')
        
        response = s3_client.generate_presigned_url('get_object',
                                                    Params={'Bucket': bucket,
                                                            'Key': key},
                                                    ExpiresIn=expiration)
        return response
    except Exception as e:
        print(f"Error generating presigned URL: {e}")
        return s3_url

# 1. Database Setup
def init_db():
    conn = sqlite3.connect(DATABASE_URL)
    c = conn.cursor()
    # Campaigns table
    c.execute('''
        CREATE TABLE IF NOT EXISTS campaigns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT,
            slug TEXT UNIQUE,
            company_name TEXT,
            exec_name TEXT,
            greeting TEXT,
            intro TEXT,
            provenance TEXT,
            findings_json TEXT,  -- Array of {title, body, impact}
            stats_json TEXT,     -- Array of {num, label}
            contact_email TEXT,
            pdf_1 TEXT,
            pdf_2 TEXT,
            pdf_3 TEXT,
            pdf_4 TEXT,
            created_at DATETIME,
            updated_at DATETIME
        )
    ''')
    # Tracking table
    c.execute('''
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            campaign_slug TEXT,
            event_type TEXT, -- visit, download_click, stage_select
            detail TEXT,     -- selection index or file name
            ip_address TEXT,
            user_agent TEXT,
            created_at DATETIME
        )
    ''')
    # Leads table
    c.execute('''
        CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT,
            first_name TEXT,
            last_name TEXT,
            email TEXT,
            company TEXT,
            role TEXT,
            token TEXT,
            created_at DATETIME,
            is_downloaded INTEGER DEFAULT 0,
            downloaded_at DATETIME
        )
    ''')
    
    # Migration: Add new columns if missing
    columns_to_add = [
        ("industry_segment", "TEXT"),
        ("hero_subheadline", "TEXT"),
        ("research_date", "TEXT"),
        ("analysis_source", "TEXT"),
        ("nav_label", "TEXT"),
        ("findings_title", "TEXT"),
        ("findings_subtitle", "TEXT"),
        ("findings_eyebrow", "TEXT"),
        ("hero_title", "TEXT"),
        ("hero_title_main", "TEXT"),
        ("hero_title_highlight", "TEXT"),
        ("findings_title_main", "TEXT"),
        ("findings_title_highlight", "TEXT"),
        ("roadmap_title_main", "TEXT"),
        ("roadmap_title_highlight", "TEXT"),
        ("roadmap_eyebrow", "TEXT"),
        ("roadmap_subtitle", "TEXT")
    ]
    for col_name, col_type in columns_to_add:
        try:
            c.execute(f"ALTER TABLE campaigns ADD COLUMN {col_name} {col_type}")
        except sqlite3.OperationalError:
            pass # Already exists

    conn.commit()
    conn.close()

init_db()

# 2. Models
class TrackEvent(BaseModel):
    slug: str
    event_type: str
    detail: str = None
    maturity: str = None

class LeadRequest(BaseModel):
    slug: str
    first_name: str
    last_name: str
    email: str
    company: str
    role: str
    maturity: str = None

# 3. Email Logic
def send_notification(to_email: str, subject: str, body: str):
    try:
        msg = MIMEMultipart()
        msg['From'] = f"SCMmax Campaigns <{SENDER_EMAIL}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'html'))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.sendmail(SENDER_EMAIL, to_email, msg.as_string())
        server.quit()
    except Exception as e:
        print(f"Mail Error: {e}")

# 4. Routes
@app.get("/api/campaign/{slug}")
async def get_campaign(slug: str):
    conn = sqlite3.connect(DATABASE_URL)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM campaigns WHERE slug = ?", (slug,))
    row = c.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    data = dict(row)
    # Parse JSON fields
    try:
        data['findings'] = json.loads(data['findings_json']) if data['findings_json'] else []
        data['stats'] = json.loads(data['stats_json']) if data['stats_json'] else []
    except:
        data['findings'] = []
        data['stats'] = []


    # Pre-sign S3 URLs
    for i in range(1, 5):
        key = f'pdf_{i}'
        if data.get(key):
            data[key] = get_s3_presigned_url(data[key])

    return data

@app.post("/api/track")
async def track_event(event: TrackEvent, request: Request, background_tasks: BackgroundTasks):
    ip = request.client.host if request.client else "unknown"
    ua = request.headers.get("user-agent", "unknown")
    
    conn = sqlite3.connect(DATABASE_URL)
    c = conn.cursor()
    
    # Log event
    c.execute('''
        INSERT INTO events (campaign_slug, event_type, detail, ip_address, user_agent, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (event.slug, event.event_type, event.detail, ip, ua, datetime.now().isoformat()))
    
    # Check for notification trigger
    if event.event_type == "visit":
        # Check if this is the first visit for this slug
        c.execute("SELECT COUNT(*) FROM events WHERE campaign_slug = ? AND event_type = 'visit'", (event.slug,))
        visit_count = c.fetchone()[0]
        
        if visit_count == 1:
            # First visit! Notify contact_email
            c.execute("SELECT company_name, exec_name, contact_email FROM campaigns WHERE slug = ?", (event.slug,))
            camp = c.fetchone()
            if camp and camp[2]:
                subject = f"Campaign Opened: {camp[0]}"
                if camp[1]: subject += f" ({camp[1]})"
                
                body = f"""
                <h3>Campaign Link Opened!</h3>
                <p><strong>Company:</strong> {camp[0]}</p>
                <p><strong>Executive:</strong> {camp[1] if camp[1] else 'N/A'}</p>
                <p><strong>Time:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                <p><strong>IP:</strong> {ip}</p>
                <p><strong>User Agent:</strong> {ua}</p>
                """
                background_tasks.add_task(send_notification, camp[2], subject, body)

    elif event.event_type == "download_click":
         c.execute("SELECT company_name, exec_name, contact_email, type, pdf_1, pdf_2, pdf_3, pdf_4 FROM campaigns WHERE slug = ?", (event.slug,))
         camp = c.fetchone()
         if camp and camp[2]:
             # Determine the PDF link based on maturity
             pdf_url = "No PDF available"
             if event.maturity == "Exploring": pdf_url = camp[4]
             elif event.maturity == "Piloting": pdf_url = camp[5]
             elif event.maturity == "Scaling": pdf_url = camp[6]
             elif event.maturity == "Not started": pdf_url = camp[7]
             elif event.detail: pdf_url = event.detail

             # Pre-sign the URL for the email
             pdf_url = get_s3_presigned_url(pdf_url)

             # 1. Send Notification
             subject = f"PDF Downloaded: {camp[0]}"
             body = f"""
             <h3>PDF Download Triggered</h3>
             <p>{camp[1] if camp[1] else 'Executive'} from {camp[0]} just clicked the download link.</p>
             <p><strong>Maturity Selected:</strong> {event.maturity}</p>
             <p><strong>PDF Link:</strong> <a href="{pdf_url}">{pdf_url}</a></p>
             """
             background_tasks.add_task(send_notification, camp[2], subject, body)
             
             # 2. Record in Leads table for Personalized campaigns (so it shows in Admin)
             if camp[3] == 'p':
                 viewer_email = "Personalized Viewer"
                 unique_token = f"PERS-{secrets.token_urlsafe(16)}"
                 c.execute('''
                    INSERT INTO leads (slug, first_name, last_name, email, company, role, maturity, token, created_at, is_downloaded, downloaded_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ''', (event.slug, camp[1] or "Executive", "Visitor", viewer_email, camp[0], "Personalized Viewer", event.maturity, unique_token, datetime.now().isoformat(), 1, datetime.now().isoformat()))

    conn.commit()
    conn.close()
    return {"status": "success"}

@app.post("/api/report-request")
async def report_request(data: LeadRequest, request: Request, background_tasks: BackgroundTasks):
    token = secrets.token_urlsafe(32)
    created_at = datetime.now().isoformat()
    
    conn = sqlite3.connect(DATABASE_URL)
    c = conn.cursor()
    c.execute('''
        INSERT INTO leads (slug, first_name, last_name, email, company, role, maturity, token, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (data.slug, data.first_name, data.last_name, data.email, data.company, data.role, data.maturity, token, created_at))
    conn.commit()
    
    # Get campaign details for the email
    c.execute("SELECT company_name, contact_email, pdf_1 FROM campaigns WHERE slug = ?", (data.slug,))
    camp = c.fetchone()
    conn.close()
    
    # Construct download link
    base_url = os.getenv("BASE_URL", str(request.base_url).rstrip("/"))
    download_link = f"{base_url}/api/report/download/{token}"
    
    if SMTP_USERNAME and SMTP_PASSWORD:
        # 1. Notify User
        user_subject = "Your SCMmax Industry Report Playbook"
        user_body = f"""
        <html>
          <body style="font-family: sans-serif; color: #333;">
            <p>Hello {data.first_name},</p>
            <p>Thank you for your interest in SCMmax. As requested, here is your copy of the <strong>AI Procurement in Indian Chemicals — 2025 Playbook</strong>.</p>
            <p style="margin: 30px 0;">
              <a href="{download_link}" style="background: #c9933a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Download Report Playbook</a>
            </p>
            <p>If the button doesn't work, copy and paste this link: <br/> {download_link}</p>
            <p>Regards,<br/>SCMmax Team</p>
          </body>
        </html>
        """
        background_tasks.add_task(send_notification, data.email, user_subject, user_body)
        
        # 2. Notify Sales
        sales_email = os.getenv("SALES_EMAIL", camp[1] if camp and camp[1] else "sales@scmmax.com")
        sales_subject = f"NEW Report Lead: {data.company} - {data.first_name} {data.last_name}"
        sales_body = f"""
        <html>
          <body>
            <h3>New Report Request Received</h3>
            <p><strong>Name:</strong> {data.first_name} {data.last_name}</p>
            <p><strong>Email:</strong> {data.email}</p>
            <p><strong>Company:</strong> {data.company}</p>
            <p><strong>Role:</strong> {data.role}</p>
            <p><strong>Campaign:</strong> {data.slug} ({camp[0] if camp else 'N/A'})</p>
            <p><strong>Time:</strong> {created_at}</p>
          </body>
        </html>
        """
        background_tasks.add_task(send_notification, sales_email, sales_subject, sales_body)
        
    return {"status": "success", "message": "Report request received"}

@app.get("/api/report/download/{token}")
async def download_report(token: str, request: Request):
    from fastapi.responses import RedirectResponse
    conn = sqlite3.connect(DATABASE_URL)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM leads WHERE token = ?", (token,))
    lead = c.fetchone()
    
    if not lead:
        conn.close()
        raise HTTPException(status_code=404, detail="Invalid or expired download link")
    
    # Update download status
    c.execute("UPDATE leads SET is_downloaded = 1, downloaded_at = ? WHERE token = ?", (datetime.now().isoformat(), token))
    
    # Get campaign PDF
    c.execute("SELECT pdf_1, company_name, contact_email FROM campaigns WHERE slug = ?", (lead['slug'],))
    camp = c.fetchone()
    conn.commit()
    conn.close()
    
    # Default PDF if not set
    pdf_url = camp['pdf_1'] if camp and camp['pdf_1'] else "https://scmmax-proprietary.s3.us-east-1.amazonaws.com/Apollo-Agent-Suite-Overview.pdf"
    
    return RedirectResponse(url=pdf_url)

@app.get("/api/admin/leads")
async def get_admin_leads(key: str):
    if key != ADMIN_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    try:
        conn = sqlite3.connect(DATABASE_URL)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute("SELECT * FROM leads ORDER BY created_at DESC")
        rows = c.fetchall()
        conn.close()
        
        # Convert sqlite3.Row to dict
        data = [dict(row) for row in rows]
        return data
    except Exception as e:
        logger.error(f"Error in get_admin_leads: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/api/admin/leads/csv")
async def export_leads_csv(key: str):
    if key != ADMIN_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    conn = sqlite3.connect(DATABASE_URL)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM leads ORDER BY created_at DESC")
    rows = c.fetchall()
    conn.close()
    
    if not rows:
        return StreamingResponse(io.StringIO("No leads found").getvalue(), media_type="text/csv")

    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    cols = ['id', 'slug', 'first_name', 'last_name', 'email', 'company', 'role', 'maturity', 'token', 'created_at', 'is_downloaded', 'downloaded_at']
    writer.writerow(cols)
    
    # Data rows
    for row in rows:
        writer.writerow([row[c] if c in row.keys() else "" for c in cols])
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=leads_export.csv"}
    )

@app.get("/api/admin/template")
async def download_template(key: str):
    if key != ADMIN_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Unauthorized")

    import pandas as pd
    columns = [
        "Type", "Slug", "Company_Name", "Exec_Name", "Greeting", "Intro", "Provenance",
        "Finding1_Title", "Finding1_Body", "Finding1_Impact",
        "Finding2_Title", "Finding2_Body", "Finding2_Impact",
        "Finding3_Title", "Finding3_Body", "Finding3_Impact",
        "Stat1_Num", "Stat1_Label", "Stat2_Num", "Stat2_Label",
        "Stat3_Num", "Stat3_Label", "Stat4_Num", "Stat4_Label",
        "Contact_Email", "PDF_1", "PDF_2", "PDF_3", "PDF_4"
    ]
    df = pd.DataFrame(columns=columns)
    
    sample_row_p = {
        "Type": "p",
        "Slug": "tata-chemicals-rajesh",
        "Company_Name": "Tata Chemicals",
        "Exec_Name": "Rajesh",
        "Greeting": "Good morning,",
        "Intro": "Our team spent time understanding **Tata Chemicals' direct spend profile**, your supplier base, and the commodity markets you operate in. What follows are two specific opportunities where Apollo can move the needle on your procurement margins.",
        "Provenance": "Prepared exclusively for Tata Chemicals",
        "Finding1_Title": "Your soda ash margins are absorbing Chinese import pressure that your contracts aren't indexed to deflect",
        "Finding1_Body": "Global soda ash prices have declined 18% over the past 14 months, driven by expanded Chinese production capacity. Apollo's analysis indicates that a significant portion of your domestic soda ash purchases are on fixed-price annual contracts — meaning you are not capturing the downward price movement.\n\nApollo's Should-Cost Modeling agent builds a live bottom-up cost model that reflects current Chinese export pricing and energy input costs, giving your team a defensible number for renewals.",
        "Finding1_Impact": "**Estimated CPO impact:** Transitioning 40% of fixed-price soda ash contracts to indexed structures could represent ₹28–45Cr in annual cost reduction.",
        "Finding2_Title": "Your specialty chemical supplier base has three single-source dependencies that create supply risk",
        "Finding2_Body": "Analysis identified three material categories — sodium bicarbonate precursors, chlorine derivatives, and silica compounds — where your supply base shows single-source concentration. Two of these suppliers are in geographies experiencing logistics volatility.\n\nApollo's Alternate Suppliers agent continuously scans global trade databases to identify pre-vetted alternative sources — complete with landed cost comparisons and quality certification status.",
        "Finding2_Impact": "**Estimated CPO impact:** Qualifying two alternate sources per category reduces emergency sourcing premium exposure — historically 15–30% above contracted price.",
        "Stat1_Num": "₹2,400Cr",
        "Stat1_Label": "Estimated direct spend under management",
        "Stat2_Num": "6",
        'Type': 'p', 'Slug': 'tata-chemicals-rajesh', 'Company_Name': 'Tata Chemicals',
        'Exec_Name': 'Rajesh', 'Greeting': 'Good morning,', 
        'Intro': 'Our team spent time understanding **Tata Chemicals\' direct spend profile**...',
        'Provenance': 'Prepared exclusively for Tata Chemicals',
        'Industry_Segment': 'Specialty & Commodity Chemicals · Mumbai',
        'Hero_Subheadline': 'applied to Tata Chemicals\' complexity.',
        'Research_Date': 'Research prepared · 14 April 2025',
        'Analysis_Source': 'Analysis built from Tata Chemicals\' FY25 annual report...',
        'Nav_Label': 'Prepared for Tata Chemicals · Rajesh, CEO',
        'Finding1_Title': 'Your soda ash margins are absorbing Chinese import pressure...',
        'Finding1_Body': 'Global soda ash prices have declined 18%...',
        'Finding1_Impact': 'Estimated CPO impact: **₹28–45Cr** in annual cost reduction.',
        'Finding2_Title': 'Your specialty chemical supplier base has three single-source dependencies...',
        'Finding2_Body': 'Analysis identified three material categories...',
        'Finding2_Impact': 'Estimated CPO impact: **₹15–20Cr** risk reduction.',
        'Stat1_Num': '₹2,400Cr', 'Stat1_Label': 'Estimated direct spend',
        'Stat2_Num': '6', 'Stat2_Label': 'Key categories analysed',
        'Stat3_Num': '3–5%', 'Stat3_Label': 'Potential cost reduction',
        'Stat4_Num': '90 days', 'Stat4_Label': 'Time to first agent',
        'Contact_Email': 'sales@scmmax.com',
        'PDF_1': 'https://example.com/roadmap1.pdf'
    }
    
    sample_row_i = {
        "Finding2_Impact": "",
        "Stat1_Num": "₹180Cr",
        "Stat1_Label": "Avg. direct spend in mid-size Indian chemical co.",
        "Stat2_Num": "3–6%",
        "Stat2_Label": "Typical margin leakage from unindexed contracts",
        "Stat3_Num": "23%",
        "Stat3_Label": "Of specialty chemical categories have single-source risk",
        "Stat4_Num": "90 days",
        "Stat4_Label": "To first agent running alongside your ERP",
        "Contact_Email": "sales@scmmax.com"
    }
    
    df = pd.concat([df, pd.DataFrame([sample_row_p, sample_row_i])], ignore_index=True)
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False)
        
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=campaign_template.xlsx"}
    )


@app.post("/api/admin/upload-pdf")
async def upload_pdf(key: str, file: UploadFile = File(...)):
    if key != ADMIN_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    try:
        # Upload to S3
        file_name = f"campaign_pdfs/{secrets.token_hex(8)}_{file.filename}"
        s3_client.upload_fileobj(
            file.file,
            os.getenv("S3_BUCKET_NAME", "scmmax-proprietary"),
            file_name
        )
        
        # Construct the S3 URL
        bucket = os.getenv("S3_BUCKET_NAME", "scmmax-proprietary")
        region = os.getenv("AWS_REGION", "us-east-1")
        # Use a standard S3 URL format that our get_s3_presigned_url can parse
        url = f"https://{bucket}.s3.{region}.amazonaws.com/{file_name}"
        return {"url": url}
    except Exception as e:
        print(f"Upload Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/admin/ingest")
async def ingest_campaigns(key: str, request: Request):
    if key != ADMIN_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    try:
        import pandas as pd
        import io
        # We expect a file upload here, but for simplicity we'll check for a local file if needed
        # Or handle multi-part file upload
        form = await request.form()
        file = form.get("file")
        if not file:
            return JSONResponse(status_code=400, content={"detail": "No file uploaded"})
        
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        conn = sqlite3.connect(DATABASE_URL)
        c = conn.cursor()
        
        for _, row in df.iterrows():
            findings = []
            for i in range(1, 7): # Support up to 6 findings
                title = row.get(f'Finding{i}_Title')
                if pd.notna(title):
                    findings.append({
                        "title": title,
                        "body": row.get(f'Finding{i}_Body', ''),
                        "impact": row.get(f'Finding{i}_Impact', '')
                    })
            
            stats = []
            for i in range(1, 7): # Support up to 6 stats
                num = row.get(f'Stat{i}_Num')
                if pd.notna(num):
                    stats.append({
                        "num": num,
                        "label": row.get(f'Stat{i}_Label', '')
                    })

            # Upsert logic
            c.execute('''
                INSERT INTO campaigns (
                    type, slug, company_name, exec_name, greeting, intro, provenance,
                    industry_segment, hero_subheadline, research_date, analysis_source, nav_label,
                    findings_json, stats_json, contact_email, pdf_1, pdf_2, pdf_3, pdf_4,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(slug) DO UPDATE SET
                    type=excluded.type,
                    company_name=excluded.company_name,
                    exec_name=excluded.exec_name,
                    greeting=excluded.greeting,
                    intro=excluded.intro,
                    provenance=excluded.provenance,
                    industry_segment=excluded.industry_segment,
                    hero_subheadline=excluded.hero_subheadline,
                    research_date=excluded.research_date,
                    analysis_source=excluded.analysis_source,
                    nav_label=excluded.nav_label,
                    findings_json=excluded.findings_json,
                    stats_json=excluded.stats_json,
                    contact_email=excluded.contact_email,
                    pdf_1=excluded.pdf_1,
                    pdf_2=excluded.pdf_2,
                    pdf_3=excluded.pdf_3,
                    pdf_4=excluded.pdf_4,
                    updated_at=excluded.updated_at
            ''', (
                row.get('Type', 'p'),
                row.get('Slug'),
                row.get('Company_Name'),
                row.get('Exec_Name'),
                row.get('Greeting', ''),
                row.get('Intro', ''),
                row.get('Provenance', ''),
                row.get('Industry_Segment', ''),
                row.get('Hero_Subheadline', ''),
                row.get('Research_Date', ''),
                row.get('Analysis_Source', ''),
                row.get('Nav_Label', ''),
                json.dumps(findings),
                json.dumps(stats),
                row.get('Contact_Email'),
                row.get('PDF_1'),
                row.get('PDF_2'),
                row.get('PDF_3'),
                row.get('PDF_4'),
                datetime.now().isoformat(),
                datetime.now().isoformat()
            ))
        
        conn.commit()
        conn.close()
        return {"status": "success", "processed": len(df)}
        
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})

@app.get("/api/admin/campaigns")
async def list_campaigns(key: str):
    if key != ADMIN_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    conn = sqlite3.connect(DATABASE_URL)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT id, type, slug, company_name, exec_name, updated_at FROM campaigns ORDER BY updated_at DESC")
    rows = c.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]


class CampaignData(BaseModel):
    is_new: bool = False
    type: str # 'p' for personalized, 'i' for industrial
    slug: str
    company_name: str
    exec_name: Optional[str] = None
    greeting: Optional[str] = ""
    intro: Optional[str] = ""
    provenance: Optional[str] = ""
    findings: list = [] # title, body, impact
    stats: list = [] # num, label
    contact_email: Optional[str] = "sales@scmmax.com"
    industry_segment: Optional[str] = ""
    hero_subheadline: Optional[str] = ""
    research_date: Optional[str] = ""
    analysis_source: Optional[str] = ""
    nav_label: Optional[str] = ""
    findings_title: Optional[str] = ""
    findings_subtitle: Optional[str] = ""
    findings_eyebrow: Optional[str] = ""
    hero_title: Optional[str] = ""
    hero_title_main: Optional[str] = ""
    hero_title_highlight: Optional[str] = ""
    findings_title_main: Optional[str] = ""
    findings_title_highlight: Optional[str] = ""
    roadmap_title_main: Optional[str] = ""
    roadmap_title_highlight: Optional[str] = ""
    roadmap_eyebrow: Optional[str] = ""
    roadmap_subtitle: Optional[str] = ""
    pdf_1: Optional[str] = ""
    pdf_2: Optional[str] = ""
    pdf_3: Optional[str] = ""
    pdf_4: Optional[str] = ""

@app.post("/api/admin/save")
async def save_campaign(key: str, data: CampaignData):
    if key != ADMIN_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    conn = sqlite3.connect(DATABASE_URL)
    c = conn.cursor()
    
    try:
        if data.is_new:
            c.execute("SELECT 1 FROM campaigns WHERE slug = ?", (data.slug,))
            if c.fetchone():
                return JSONResponse(status_code=400, content={"detail": f"Slug '{data.slug}' already exists!"})
        
        c.execute('''
            INSERT INTO campaigns (
                type, slug, company_name, exec_name, greeting, intro, provenance,
                industry_segment, hero_subheadline, research_date, analysis_source, nav_label,
                findings_title, findings_subtitle, findings_eyebrow, hero_title,
                hero_title_main, hero_title_highlight, findings_title_main, findings_title_highlight,
                roadmap_title_main, roadmap_title_highlight, roadmap_eyebrow, roadmap_subtitle,
                findings_json, stats_json, contact_email, pdf_1, pdf_2, pdf_3, pdf_4,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(slug) DO UPDATE SET
                type=excluded.type,
                company_name=excluded.company_name,
                exec_name=excluded.exec_name,
                greeting=excluded.greeting,
                intro=excluded.intro,
                provenance=excluded.provenance,
                industry_segment=excluded.industry_segment,
                hero_subheadline=excluded.hero_subheadline,
                research_date=excluded.research_date,
                analysis_source=excluded.analysis_source,
                nav_label=excluded.nav_label,
                findings_title=excluded.findings_title,
                findings_subtitle=excluded.findings_subtitle,
                findings_eyebrow=excluded.findings_eyebrow,
                hero_title=excluded.hero_title,
                hero_title_main=excluded.hero_title_main,
                hero_title_highlight=excluded.hero_title_highlight,
                findings_title_main=excluded.findings_title_main,
                findings_title_highlight=excluded.findings_title_highlight,
                roadmap_title_main=excluded.roadmap_title_main,
                roadmap_title_highlight=excluded.roadmap_title_highlight,
                roadmap_eyebrow=excluded.roadmap_eyebrow,
                roadmap_subtitle=excluded.roadmap_subtitle,
                findings_json=excluded.findings_json,
                stats_json=excluded.stats_json,
                contact_email=excluded.contact_email,
                pdf_1=excluded.pdf_1,
                pdf_2=excluded.pdf_2,
                pdf_3=excluded.pdf_3,
                pdf_4=excluded.pdf_4,
                updated_at=excluded.updated_at
        ''', (
            data.type, data.slug, data.company_name, data.exec_name, data.greeting,
            data.intro, data.provenance, data.industry_segment, data.hero_subheadline,
            data.research_date, data.analysis_source, data.nav_label,
            data.findings_title, data.findings_subtitle, data.findings_eyebrow, data.hero_title,
            data.hero_title_main, data.hero_title_highlight, data.findings_title_main, data.findings_title_highlight,
            data.roadmap_title_main, data.roadmap_title_highlight, data.roadmap_eyebrow, data.roadmap_subtitle,
            json.dumps(data.findings), json.dumps(data.stats),
            data.contact_email, data.pdf_1, data.pdf_2, data.pdf_3, data.pdf_4,
            datetime.now().isoformat(), datetime.now().isoformat()
        ))
        conn.commit()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.delete("/api/admin/campaign/{slug}")
async def delete_campaign(slug: str, key: str):
    if key != ADMIN_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    conn = sqlite3.connect(DATABASE_URL)
    c = conn.cursor()
    c.execute("DELETE FROM campaigns WHERE slug = ?", (slug,))
    conn.commit()
    conn.close()
    return {"status": "success"}

# 11. Static Files & SPA Routing
if os.path.exists(static_dir):
    app.mount("/campaign-static", StaticFiles(directory=static_dir), name="campaign-static")

    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        # Otherwise serve index.html for React Router
        return FileResponse(os.path.join(static_dir, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
