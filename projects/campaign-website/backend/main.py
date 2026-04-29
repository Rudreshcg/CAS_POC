from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import json
import os
import smtplib
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import pandas as pd
import io

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
    conn.commit()
    conn.close()

init_db()

# 2. Models
class TrackEvent(BaseModel):
    slug: str
    event_type: str
    detail: str = None

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
         c.execute("SELECT company_name, contact_email FROM campaigns WHERE slug = ?", (event.slug,))
         camp = c.fetchone()
         if camp and camp[1]:
             subject = f"PDF Downloaded: {camp[0]}"
             body = f"User from {camp[0]} just clicked the download link for: {event.detail}"
             background_tasks.add_task(send_notification, camp[1], subject, body)

    conn.commit()
    conn.close()
    return {"status": "success"}

@app.get("/api/admin/template")
async def download_template(key: str):
    if key != ADMIN_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Unauthorized")

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
        "Stat2_Label": "Key commodity categories analysed",
        "Stat3_Num": "3–5%",
        "Stat3_Label": "Potential cost reduction identified",
        "Stat4_Num": "90 days",
        "Stat4_Label": "To first agent running alongside your ERP",
        "Contact_Email": "sales@scmmax.com"
    }
    
    sample_row_i = {
        "Type": "i",
        "Slug": "industrial-chemicals-na",
        "Company_Name": "Industrial Chemicals Ltd",
        "Exec_Name": "",
        "Greeting": "",
        "Intro": "",
        "Provenance": "Prepared exclusively for Industrial Chemicals Ltd",
        "Finding1_Title": "",
        "Finding1_Body": "",
        "Finding1_Impact": "",
        "Finding2_Title": "",
        "Finding2_Body": "",
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


@app.post("/api/admin/ingest")
async def ingest_campaigns(key: str, request: Request):
    if key != ADMIN_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    try:
        # We expect a file upload here, but for simplicity we'll check for a local file if needed
        # Or handle multi-part file upload
        form = await request.form()
        file = form.get("file")
        if not file:
            return JSONResponse(status_code=400, content={"detail": "No file uploaded"})
        
        # Save temp file
        temp_path = "temp_campaigns.xlsx"
        with open(temp_path, "wb") as f:
            f.write(await file.read())
            
        df = pd.read_excel(temp_path)
        conn = sqlite3.connect(DATABASE_URL)
        c = conn.cursor()
        
        for _, row in df.iterrows():
            findings = []
            for i in range(1, 4): # Support up to 3 findings
                title = row.get(f'Finding{i}_Title')
                if pd.notna(title):
                    findings.append({
                        "title": title,
                        "body": row.get(f'Finding{i}_Body', ''),
                        "impact": row.get(f'Finding{i}_Impact', '')
                    })
            
            stats = []
            for i in range(1, 5): # Support up to 4 stats
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
                    findings_json, stats_json, contact_email, pdf_1, pdf_2, pdf_3, pdf_4,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(slug) DO UPDATE SET
                    company_name=excluded.company_name,
                    exec_name=excluded.exec_name,
                    greeting=excluded.greeting,
                    intro=excluded.intro,
                    provenance=excluded.provenance,
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
        os.remove(temp_path)
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
    type: str
    slug: str
    company_name: str
    exec_name: str = None
    greeting: str = None
    intro: str = None
    provenance: str = None
    findings: list = []
    stats: list = []
    contact_email: str = None
    pdf_1: str = None
    pdf_2: str = None
    pdf_3: str = None
    pdf_4: str = None

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
                findings_json, stats_json, contact_email, pdf_1, pdf_2, pdf_3, pdf_4,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(slug) DO UPDATE SET
                type=excluded.type,
                company_name=excluded.company_name,
                exec_name=excluded.exec_name,
                greeting=excluded.greeting,
                intro=excluded.intro,
                provenance=excluded.provenance,
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
            data.intro, data.provenance, json.dumps(data.findings), json.dumps(data.stats),
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
