import sqlite3
import json
from datetime import datetime

DATABASE_URL = 'campaigns.db'

def reset_and_seed():
    conn = sqlite3.connect(DATABASE_URL)
    c = conn.cursor()
    
    # 1. Industrial Campaign (Type I) Refined Content
    industrial_findings = [
        {
            "title": "Your soda ash margins are absorbing Chinese import pressure that your contracts aren't indexed to deflect",
            "body": "Global soda ash prices have declined 18% over the past 14 months, driven by expanded Chinese production capacity. Apollo's analysis indicates that a significant portion of your domestic soda ash purchases are on fixed-price annual contracts — meaning you are not capturing the downward price movement.\n\nApollo's Should-Cost Modeling agent builds a live bottom-up cost model that reflects current Chinese export pricing and energy input costs, giving your team a defensible number for renewals.",
            "impact": "<strong>Estimated CFO impact:</strong> Transitioning 40% of fixed-price soda ash contracts to indexed structures could represent ₹28–45Cr in annual cost reduction."
        },
        {
            "title": "Your specialty chemical supplier base has three single-source dependencies that create supply risk",
            "body": "Analysis identified three material categories — sodium bicarbonate precursors, chlorine derivatives, and silica compounds — where your supply base shows single-source concentration. Two of these suppliers are in geographies experiencing logistics volatility.\n\nApollo's Alternate Suppliers agent continuously scans global trade databases to identify pre-vetted alternative sources — complete with landed cost comparisons and quality certification status.",
            "impact": "<strong>Estimated CPO impact:</strong> Qualifying two alternate sources per category reduces emergency sourcing premium exposure — historically 15–30% above contracted price."
        }
    ]
    
    industrial_stats = [
        {"num": "₹2,400Cr", "label": "Estimated spend under management"},
        {"num": "6", "label": "Key commodity categories analysed"},
        {"num": "3–5%", "label": "Potential cost reduction identified"},
        {"num": "90 days", "label": "Estimated time to first savings"}
    ]

    # Insert Refined Sample
    c.execute("DELETE FROM campaigns WHERE slug IN ('tata-chemicals-rajesh', 'industrial-chemicals-na')")
    
    # Industrial Chemicals (Standard)
    c.execute('''
        INSERT INTO campaigns (type, slug, company_name, exec_name, greeting, intro, provenance, findings_json, stats_json, contact_email, pdf_1, pdf_2, pdf_3, pdf_4, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        'i', 'industrial-chemicals-na', 'Industrial Chemicals Ltd', 'Aditya', 'Good morning,',
        "Our team has mapped the **direct spend architecture** of Industrial Chemicals Ltd. We've identified two primary vectors where Apollo's Agentic Procurement layer can yield double-digit margin improvement.",
        'Prepared exclusively for Industrial Chemicals Ltd',
        json.dumps(industrial_findings),
        json.dumps(industrial_stats),
        'sales@scmmax.com',
        'https://scmmax-proprietary.s3.us-east-1.amazonaws.com/Apollo-Agent-Suite-Overview.pdf',
        'https://scmmax-proprietary.s3.us-east-1.amazonaws.com/Apollo-Agent-Suite-Overview.pdf',
        'https://scmmax-proprietary.s3.us-east-1.amazonaws.com/Apollo-Agent-Suite-Overview.pdf',
        'https://scmmax-proprietary.s3.us-east-1.amazonaws.com/Apollo-Agent-Suite-Overview.pdf',
        datetime.now().isoformat(),
        datetime.now().isoformat()
    ))

    # Tata Chemicals (Personalized)
    c.execute('''
        INSERT INTO campaigns (type, slug, company_name, exec_name, greeting, intro, provenance, findings_json, stats_json, contact_email, pdf_1, pdf_2, pdf_3, pdf_4, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        'p', 'tata-chemicals-rajesh', 'Tata Chemicals', 'Rajesh', 'Good morning,',
        "Our team spent time understanding **Tata Chemicals' direct spend profile**, your supplier base, and the commodity markets you operate in. What follows are two specific opportunities where Apollo can move the needle on your procurement margins.",
        'Prepared exclusively for Tata Chemicals',
        json.dumps(industrial_findings),
        json.dumps(industrial_stats),
        'sales@scmmax.com',
        'https://scmmax-proprietary.s3.us-east-1.amazonaws.com/Apollo-Agent-Suite-Overview.pdf',
        'https://scmmax-proprietary.s3.us-east-1.amazonaws.com/Apollo-Agent-Suite-Overview.pdf',
        'https://scmmax-proprietary.s3.us-east-1.amazonaws.com/Apollo-Agent-Suite-Overview.pdf',
        'https://scmmax-proprietary.s3.us-east-1.amazonaws.com/Apollo-Agent-Suite-Overview.pdf',
        datetime.now().isoformat(),
        datetime.now().isoformat()
    ))

    conn.commit()
    conn.close()
    print("Database updated with premium content.")

if __name__ == "__main__":
    reset_and_seed()
