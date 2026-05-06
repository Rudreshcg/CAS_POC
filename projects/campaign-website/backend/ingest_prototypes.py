import sqlite3
import json
import os
from datetime import datetime

DATABASE_URL = "campaigns.db"

def ingest():
    conn = sqlite3.connect(DATABASE_URL)
    c = conn.cursor()

    # 1. Varun Gupta
    varun_findings = [
        {
            "label": "Finding 01 · Acetic Acid — ₹40–70Cr annual EBITDA opportunity",
            "title": "Acetic acid is ~30% of Jubilant Ingrevia's external procurement spend — and the FY24 margin collapse was almost entirely this one category's fault",
            "body": "Apollo's Commodity Intelligence agent monitors ICIS Acetic Acid Asia, Chinese export pricing, and methanol input costs daily. It calculates Jubilant Ingrevia's real-time gross margin on Acetic Anhydride and Ethyl Acetate.",
            "impact": "**₹40–70 Crore annually** captured through competitive tendering, dynamic spot-buy windows, and index-linked customer contracts.",
            "icon": "📊", "accent": "brass"
        },
        {
            "label": "Finding 02 · Cross-Site Spend Fragmentation",
            "title": "\"Project Lean\" is generating directional savings commentary — but without a spend analytics backbone, you cannot report verifiable, auditable cost reductions to investors",
            "body": "Apollo's Spend Analytics module ingests your ERP purchase order data and builds a real-time cross-site spend cube — 50 plants, 5 manufacturing sites, 130+ products — in 48 hours. Every rupee of procurement spend becomes visible.",
            "impact": "**₹30–50 Crore annually** across packaging, MRO, and lab chemicals — with the audit trail that turns \"Project Lean\" into a measurable program.",
            "icon": "🧬", "accent": "teal"
        },
        {
            "label": "Finding 03 · Bharuch Capex Debt",
            "title": "The new Bharuch Acetic Anhydride plant carried ₹526Cr in finance costs in FY24. The procurement cost of acetic acid at Bharuch determines ROI",
            "body": "Apollo's TCO module models the live plant-level economics at Bharuch — tracking acetic acid procurement cost, conversion cost, and output pricing in real time.",
            "impact": "**₹526Cr of annual finance cost** riding on this plant's performance. Real-time procurement cost intelligence is not a nice-to-have.",
            "icon": "🏭", "accent": "brass"
        },
        {
            "label": "Finding 04 · HUL / Unilever Playbook",
            "title": "You spent 18 years building financial discipline at HUL. Apollo bridges the gap between best practice and current transactional reality",
            "body": "Apollo is the platform that brings the analytical standard you know from HUL to a specialty chemicals procurement context. ROI is measurable within the first quarter.",
            "impact": "**₹150–220 Crore** across all five initiatives represents Jubilant Ingrevia's clearest path to the \"Pinnacle 345\" EBITDA target.",
            "icon": "🏆", "accent": "teal"
        }
    ]
    varun_stats = [
        {"num": "~₹2,300Cr", "label": "Estimated annual direct procurement spend"},
        {"num": "₹526Cr", "label": "FY24 finance cost — acetic acid inventory a major contributor"},
        {"num": "₹150–220Cr", "label": "Addressable annual EBITDA improvement identified"},
        {"num": "<90 days", "label": "Apollo payback period — acetic acid savings alone cover it"}
    ]

    # 2. Birajeev Singh
    birajeev_findings = [
        {
            "label": "Finding 01 · The KEC Playbook — you did this at $1Bn+ scale. The opportunity here is bigger.",
            "title": "At KEC International, you managed a global procurement portfolio and led SAP implementation — delivering significant annual savings. Jubilant Ingrevia's procurement base is more complex and has not yet received the same structured treatment.",
            "body": "At KEC, you managed global procurement across metals, cables, and infrastructure at over ₹8,000 Crore scale — implementing SAP, generating significant savings, and managing logistics across 80+ countries. Jubilant Ingrevia's direct procurement (estimated ₹2,300 Crore externally) spans 130+ products, 5 manufacturing sites, 65+ raw materials, and supply chains from West Africa to Southeast Asia. The KEC procurement discipline you built — category management, should-cost modelling, supplier consolidation — is exactly what Jubilant Ingrevia's procurement function needs now. Apollo gives you the intelligence layer to deploy it without waiting for a full SAP transformation.",
            "impact": "**₹150–220 Crore of addressable annual savings** across 5 identified categories.",
            "icon": "💼", "accent": "brass"
        },
        {
            "label": "Finding 02 · Acetic Acid — your single biggest lever, and the most urgent",
            "title": "Jubilant Ingrevia is India's largest importer of acetic acid — ~₹600–800 Crore annually — bought from Celanese, GNFC, Lotte, and import traders with no dynamic price management mechanism visible in public disclosures",
            "body": "At Castrol and KEC, you managed commodity procurement with index-linked pricing, forward contract windows, and multi-supplier competitive frameworks. Jubilant Ingrevia's acetic acid procurement at this scale — the largest single external spend category — deserves the same treatment. Currently, FY24's margin collapse ($526Cr finance cost spike) was partly driven by buying expensive acetic acid inventory ahead of a market price drop, then being unable to pass the cost through to customers quickly enough. Apollo's Commodity Intelligence agent monitors ICIS Acetic Acid Asia, Chinese spot pricing, and methanol input costs daily — and recommends the optimal inventory coverage level (weeks of stock to hold) based on price direction signal.",
            "impact": "**₹40–70 Crore annual improvement** on acetic acid alone. This is the fastest win available — actionable within your first quarter.",
            "icon": "📊", "accent": "teal"
        },
        {
            "label": "Finding 03 · TMA & Ethylene Oxide — oligopoly supply risk on your Choline business",
            "title": "Jubilant Ingrevia is India's #1 Choline Chloride producer. The entire business runs on Trimethylamine (TMA) — globally dominated by BASF alone — and Ethylene Oxide. This is a supply security issue as much as a cost issue.",
            "body": "You have managed supply chains for EV battery procurement at Ola and renewable energy inputs at Aliaxis — both categories where single-source dependency and long lead times create existential supply risk. TMA for Choline Chloride synthesis has the same profile: dominated by one global producer (BASF), 8–12 week lead time, dollar-denominated cost. A 90-day TMA safety stock (working capital: ~₹15–20 Crore) is cheap insurance against a ₹80–100 Crore Choline production stoppage. Apollo's Supply Security Scoring gives you a real-time risk score for TMA and Ethylene Oxide — and tracks alternate supplier qualification progress against a defined timeline.",
            "impact": "**Cost impact: ₹20–30 Crore annually** through competitive TMA pricing once BASF faces a qualified alternate.",
            "icon": "🏭", "accent": "brass"
        },
        {
            "label": "Finding 04 · Molasses Supply Chain — the strategic moat that needs formalising",
            "title": "Molasses is the reason Jubilant Ingrevia is the lowest-cost non-Chinese Pyridine producer globally. This competitive advantage is currently managed on a seasonal spot basis — one poor UP monsoon or an ethanol blending policy change away from a supply crisis.",
            "body": "At J&J and Asian Paints, you managed agricultural and specialty raw material supply planning with demand-signal-driven procurement. Jubilant Ingrevia's molasses supply — 300,000–400,000 MT/year from UP sugar mills — is the foundational input for its entire Pyridine platform and global #1 market position. But molasses procurement appears to be primarily spot or short-term seasonal, without formal multi-year offtake agreements with mills like Balrampur Chini, Triveni Engineering, or Dhampur. Apollo's Seasonal Demand Forecasting agent models quarterly molasses requirements and triggers procurement action 90 days before season start — before competing ethanol producers lock in supply.",
            "impact": "Strategic impact: 3-year offtake agreements with 8 UP sugar mills = **₹15–25 Crore annual saving** through price corridor certainty.",
            "icon": "🌾", "accent": "teal"
        }
    ]
    birajeev_stats = [
        {"num": "~₹2,300Cr", "label": "Estimated direct external procurement spend across 5 sites"},
        {"num": "65+", "label": "Distinct input raw material categories identified by Apollo's Prism"},
        {"num": "₹150–220Cr", "label": "Addressable annual savings across 5 priority categories"},
        {"num": "48 hours", "label": "Time for Apollo to build your full cross-site spend cube from ERP data"}
    ]

    campaigns = [
        {
            "type": "p", "slug": "jubilant-ingrevia-varun-gupta", "company_name": "Jubilant Ingrevia",
            "exec_name": "Varun", "greeting": "Good morning,",
            "hero_title_main": "Varun,", "hero_title_highlight": "the margin story",
            "intro": "You joined Jubilant Ingrevia in August 2024 to lead a financial recovery — **ROCE rebuilding from 10% to its potential, EBITDA recovering from an 11% trough, and a ₹526Cr annual finance cost burden from the Bharuch capex demanding faster payback.**\n\nOur team spent time understanding Jubilant Ingrevia's procurement cost structure, acetic acid exposure, and the gap between where \"Project Lean\" is today and where it needs to be. What follows are four specific findings that change the P&L — grounded in your company's numbers, not generic benchmarks.",
            "provenance": "Prepared exclusively for Varun Gupta · Jubilant Ingrevia",
            "industry_segment": "Life Science Ingredients & Specialty Chemicals · NSE: JUBLINGREA",
            "hero_subheadline": "the margin story begins in procurement.",
            "research_date": "Research prepared · May 2026 · JIL Procurement Analysis",
            "analysis_source": "Analysis built from JIL's FY24/FY25 annual reports, quarterly investor presentations, \"Project Lean\" management commentary across 4 consecutive earnings calls, and acetic acid market data. JIL is India's largest importer of acetic acid — confirmed by company disclosures.",
            "nav_label": "Prepared for Jubilant Ingrevia · Varun Gupta, CFO",
            "findings_eyebrow": "What We Found — Specific to Jubilant Ingrevia · For the CFO",
            "findings_title_main": "Four P&L levers.", "findings_title_highlight": "Quantified. Yours to act on.",
            "findings_subtitle": "These findings are grounded in Jubilant Ingrevia's own reported numbers — the FY24 EBITDA trough, the Bharuch capex financing cost, and the \"Project Lean\" savings that are referenced but not yet verified at purchase-order level. Each one is actionable this quarter.",
            "roadmap_eyebrow": "Your Personalised CFO Roadmap",
            "roadmap_title_main": "A structured P&L", "roadmap_title_highlight": "recovery roadmap for JIL.",
            "roadmap_subtitle": "Our team has built a complete Apollo deployment plan for Jubilant Ingrevia — sequenced by category, calibrated to your Bharuch site complexity, and prioritised by savings vs. effort.",
            "findings": varun_findings, "stats": varun_stats, "contact_email": "sales@scmmax.com"
        },
        {
            "type": "p", "slug": "jubilant-ingrevia-birajeev-singh", "company_name": "Jubilant Ingrevia",
            "exec_name": "Birajeev", "greeting": "Good morning,",
            "hero_title_main": "Birajeev,", "hero_title_highlight": "the KEC discipline",
            "intro": "23 years. J&J. Asian Paints. Castrol. CEAT. KEC — **₹8,000 Crore portfolio, global procurement, SAP implementation.** Ola. Aliaxis.\n\nAnd now Jubilant Ingrevia — 130+ products, 65+ raw materials, 5 manufacturing sites, and a procurement base that has not yet received the structured treatment your career has prepared you to give it. This page is our analysis of where the biggest levers are — and what Apollo can put in your hands to pull them, starting this quarter.",
            "provenance": "Prepared exclusively for Birajeev Singh · Jubilant Ingrevia",
            "industry_segment": "Life Science Ingredients & Specialty Chemicals · NSE: JUBLINGREA",
            "hero_subheadline": "the KEC discipline, applied to Jubilant Ingrevia's complexity.",
            "research_date": "Research prepared · May 2026 · JIL Supply Chain Analysis",
            "analysis_source": "Analysis built from JIL's FY25 annual report, quarterly investor calls, management commentary on \"Project Lean\" and Pyridine feedstock strategy, acetic acid market data (India's largest importer confirmed), and UP sugar mill proximity mapping to Gajraula.",
            "nav_label": "Prepared for Jubilant Ingrevia · Birajeev Singh, CPO",
            "findings_eyebrow": "What We Found — Specific to Jubilant Ingrevia · For the CPO",
            "findings_title_main": "Four categories.", "findings_title_highlight": "Your biggest levers, right now.",
            "findings_subtitle": "Each of these findings is grounded in Jubilant Ingrevia's publicly disclosed cost structure, your predecessor's procurement gaps, and the specific supply chain risks that your 23 years of experience will recognise immediately.",
            "roadmap_eyebrow": "Your Personalised CPO Roadmap",
            "roadmap_title_main": "A structured procurement", "roadmap_title_highlight": "transformation roadmap for JIL.",
            "roadmap_subtitle": "Our team has built a complete Apollo deployment plan for Jubilant Ingrevia — sequenced by category, calibrated to your 5-site complexity, and prioritised by savings vs. effort.",
            "findings": birajeev_findings, "stats": birajeev_stats, "contact_email": "sales@scmmax.com"
        }
    ]

    for data in campaigns:
        c.execute('''
            INSERT INTO campaigns (
                type, slug, company_name, exec_name, greeting, intro, provenance,
                industry_segment, hero_subheadline, research_date, analysis_source, nav_label,
                findings_eyebrow, findings_title_main, findings_title_highlight, findings_subtitle, 
                hero_title_main, hero_title_highlight,
                roadmap_eyebrow, roadmap_title_main, roadmap_title_highlight, roadmap_subtitle,
                findings_json, stats_json, contact_email, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(slug) DO UPDATE SET
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
                findings_eyebrow=excluded.findings_eyebrow,
                findings_title_main=excluded.findings_title_main,
                findings_title_highlight=excluded.findings_title_highlight,
                findings_subtitle=excluded.findings_subtitle,
                hero_title_main=excluded.hero_title_main,
                hero_title_highlight=excluded.hero_title_highlight,
                roadmap_eyebrow=excluded.roadmap_eyebrow,
                roadmap_title_main=excluded.roadmap_title_main,
                roadmap_title_highlight=excluded.roadmap_title_highlight,
                roadmap_subtitle=excluded.roadmap_subtitle,
                findings_json=excluded.findings_json,
                stats_json=excluded.stats_json,
                contact_email=excluded.contact_email,
                updated_at=excluded.updated_at
        ''', (
            data["type"], data["slug"], data["company_name"], data["exec_name"], 
            data["greeting"], data["intro"], data["provenance"],
            data["industry_segment"], data["hero_subheadline"],
            data["research_date"], data["analysis_source"], data["nav_label"],
            data["findings_eyebrow"], data["findings_title_main"], data["findings_title_highlight"], 
            data["findings_subtitle"],
            data["hero_title_main"], data["hero_title_highlight"],
            data["roadmap_eyebrow"], data["roadmap_title_main"], data["roadmap_title_highlight"],
            data["roadmap_subtitle"],
            json.dumps(data["findings"]), json.dumps(data["stats"]),
            data["contact_email"], datetime.now().isoformat(), datetime.now().isoformat()
        ))

    conn.commit()
    conn.close()
    print("Ingestion complete.")

if __name__ == "__main__":
    ingest()
