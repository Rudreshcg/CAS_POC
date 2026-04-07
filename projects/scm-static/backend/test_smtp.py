import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

# Use the .env we just created
load_dotenv('c:/SMC-MAX/SCM-MAX-Projects/projects/scm-static/backend/.env')

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

def test_mail():
    print(f"Testing SMTP with {SMTP_USERNAME}...")
    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        
        msg = MIMEMultipart()
        msg['From'] = SMTP_USERNAME
        msg['To'] = SMTP_USERNAME  # Send to self
        msg['Subject'] = 'SMTP Test'
        msg.attach(MIMEText('This is a test email from the SCMmax backend setup.', 'plain'))
        
        server.send_message(msg)
        server.quit()
        print("Success: SMTP connection and login worked!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_mail()
