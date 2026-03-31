import React, { useState, useEffect, useRef } from 'react'
import './agent-carousel.css'

const AGENTS = [
  // ── MARGIN EXPANSION ──
  {
    cat: 'expansion', tabColor: '', nameColor: 'n-brass',
    tab: 'Procurement Prism',
    catLabel: 'cl-brass', catName: 'Margin Expansion',
    name: 'Procurement Prism',
    badge: 'b-done', badgeText: 'Roadmap Ready',
    lbl: 'Agent Output',
    out: 'Analysed <span class="ow">100%</span> of direct spend across\n<span class="ot">6 categories</span>, 284 materials.\n\nIdentified <span class="ow">₹42Cr</span> cost reduction potential.\n<span class="ob">Structured sourcing roadmap attached.</span>',
    src: 'Sources: <span>PO History, Material Master, Market Indices, Contracts</span>',
    mets: [
      { v: '284', u: '+', l: 'Materials analysed' },
      { v: '₹42', u: 'Cr', l: 'Savings identified' },
      { v: '90', u: 'd', l: 'To first saving' },
    ],
  },
  {
    cat: 'expansion', tabColor: '', nameColor: 'n-brass',
    tab: 'Material Substitution',
    catLabel: 'cl-brass', catName: 'Margin Expansion',
    name: 'Material Substitution',
    badge: 'b-done', badgeText: '3 Substitutes Found',
    lbl: 'Substitution Analysis',
    out: 'Part #M2241 — Current spec: <span class="ow">Grade A</span>\n<span class="ot">Grade B equivalent</span> validated against\nyour quality requirements.\n\nCost delta: <span class="ow">−4.2%</span> per unit. <span class="ob">QA sign-off ready.</span>',
    src: 'Bill of Materials, Spec Sheets, Supplier Data',
    mets: [
      { v: '3', u: '+', l: 'Substitutes found' },
      { v: '4.2', u: '%', l: 'Cost reduction' },
      { v: '100', u: '%', l: 'Spec validated' },
    ],
  },
  {
    cat: 'expansion', tabColor: '', nameColor: 'n-brass',
    tab: 'Buy More Now or Later',
    catLabel: 'cl-brass', catName: 'Margin Expansion',
    name: 'Buy More Now or Later',
    badge: 'b-run', badgeText: 'Signal Active',
    lbl: 'Live Market Signal',
    out: '<span class="ot">Copper LME</span> down <span class="ow">8%</span> in 14 days.\nYour MRP shows 60-day forward demand.\n\n<span class="ow">Recommend: Buy forward now.</span>\n<span class="ob">Window closes est. 12 days.</span>',
    src: 'Inventory Data, Market Indices, MRP Output',
    mets: [
      { v: '8', u: '%', l: 'Price dip detected' },
      { v: '12', u: 'd', l: 'Action window' },
      { v: '60', u: 'd', l: 'Demand covered' },
    ],
  },
  {
    cat: 'expansion', tabColor: '', nameColor: 'n-brass',
    tab: 'Alternate Suppliers',
    catLabel: 'cl-brass', catName: 'Margin Expansion',
    name: 'Alternate Suppliers',
    badge: 'b-run', badgeText: 'Scanning Now',
    lbl: 'Supplier Discovery',
    out: 'Detected <span class="ot">5 qualified alternates</span> for\nCategory 3 — polypropylene resin.\n\nAvg. landed cost: <span class="ow">11% below</span> incumbent.\n<span class="ob">Risk profiles and samples available.</span>',
    src: 'Trade Data, Supplier DB, Customs Records',
    mets: [
      { v: '5', u: '+', l: 'Alternates found' },
      { v: '11', u: '%', l: 'Price advantage' },
      { v: '47', u: '+', l: 'Markets scanned' },
    ],
  },
  // ── MARGIN PROTECTION ──
  {
    cat: 'protection', tabColor: 'teal-tab', nameColor: 'n-teal',
    tab: 'Should-Cost Modeling',
    catLabel: 'cl-teal', catName: 'Margin Protection',
    name: 'Should-Cost Modeling',
    badge: 'b-done', badgeText: 'Analysis Complete',
    lbl: 'Should-Cost Model',
    out: 'Part #A4821 — Current: <span class="ow">$42.80</span>\nShould-cost: <span class="ot">$34.20 – $36.50</span>\n\nOverpaying by <span class="ow">17–25%</span>. Driver:\n<span class="ob">inflated tooling amortisation claim.</span>',
    src: 'BOM, PLM System, Industry Cost Indices',
    mets: [
      { v: '342', u: '+', l: 'Parts analysed' },
      { v: '$1.2', u: 'M', l: 'Savings found' },
    ],
  },
  {
    cat: 'protection', tabColor: 'teal-tab', nameColor: 'n-teal',
    tab: 'Price Forecasting',
    catLabel: 'cl-teal', catName: 'Margin Protection',
    name: 'Price Forecasting',
    badge: 'b-run', badgeText: 'Model Running',
    lbl: '12-Month Forecast',
    out: 'Soda ash: <span class="owarn">+7% forecast</span> next quarter\ndriven by Chinese energy costs.\n\n<span class="ow">Recommend: Lock contracts now</span>\nbefore Q2 price review. <span class="ob">Confidence: 81%.</span>',
    src: 'Market Indices, Macro Data, Historical Prices',
    mets: [
      { v: '81', u: '%', l: 'Forecast confidence' },
      { v: '12', u: 'mo', l: 'Forward view' },
      { v: '23', u: '+', l: 'Commodities tracked' },
    ],
  },
  {
    cat: 'protection', tabColor: 'teal-tab', nameColor: 'n-teal',
    tab: 'Sustainability Tracking',
    catLabel: 'cl-teal', catName: 'Margin Protection',
    name: 'Sustainability Tracking',
    badge: 'b-alert', badgeText: '1 Flag',
    lbl: 'ESG Risk Scan',
    out: '<span class="owarn">⚠ FLAG:</span> Supplier Z — CBAM exposure.\nCarbon intensity <span class="ow">38% above</span> sector avg.\n\nRegulatory cost impact est. <span class="ow">€120k/yr</span>.\n<span class="ob">Remediation options attached.</span>',
    src: 'ESG Databases, Regulatory Feeds, Supplier Data',
    mets: [
      { v: '12', u: '+', l: 'ESG dimensions' },
      { v: '38', u: '%', l: 'Above sector avg.' },
      { v: '€120', u: 'k', l: 'Est. cost impact' },
    ],
  },
  {
    cat: 'protection', tabColor: 'teal-tab', nameColor: 'n-teal',
    tab: 'Resilience Sentinel',
    catLabel: 'cl-teal', catName: 'Margin Protection',
    name: 'Resilience Sentinel',
    badge: 'b-alert', badgeText: '2 Alerts',
    lbl: 'Risk Assessment',
    out: '<span class="owarn">⚠ HIGH:</span> Supplier Y — financial distress.\nD&B score dropped <span class="ow">18pts</span> in 30 days.\n\n<span class="ot">Recommended:</span> Accelerate dual-sourcing\n<span class="ob">Cat. 3 components. Timeline: 6 weeks.</span>',
    src: 'D&B Feed, News Monitoring, Filings',
    mets: [
      { v: '12', u: '+', l: 'Risk dimensions' },
      { v: '98', u: '%', l: 'Early warning' },
    ],
  },
  // ── PRODUCTIVITY ──
  {
    cat: 'productivity', tabColor: 'teal-tab', nameColor: 'n-teal',
    tab: 'Negotiation Assistant',
    catLabel: 'cl-teal', catName: 'Productivity Improvement',
    name: 'Negotiation Assistant',
    badge: 'b-done', badgeText: 'Strategy Ready',
    lbl: 'Agent Output',
    out: 'Supplier X claiming raw material increases.\n<span class="ot">Feedstock Y</span> dropped <span class="ow">12%</span> in 60 days.\n\nRecommendation: Push back using\n<span class="ob">attached price index chart.</span>',
    src: 'Market Report (Today), PLM Data, Competitor Pricing',
    mets: [
      { v: '−8', u: '%', l: 'Target reduction' },
      { v: '3', u: 'd', l: 'Strategy ready' },
      { v: '94', u: '%', l: 'Confidence' },
    ],
  },
  {
    cat: 'productivity', tabColor: 'teal-tab', nameColor: 'n-teal',
    tab: 'Auto Quote Selection',
    catLabel: 'cl-teal', catName: 'Productivity Improvement',
    name: 'Automated Quote Initiation & Selection',
    badge: 'b-run', badgeText: 'Scanning Now',
    lbl: 'Live Market Signal',
    out: 'Detected: <span class="ot">3 new qualified suppliers</span> in Vietnam\nmatching Category 4 specifications.\n\nAvg. quoted price <span class="ow">14% below</span> current\nincumbent. <span class="ob">Full profiles attached.</span>',
    src: 'Supplier DB, Trade Reports, Customs Data',
    mets: [
      { v: '47', u: '+', l: 'Markets watched' },
      { v: '24', u: 'h', l: 'Signal latency' },
      { v: '98', u: '%', l: 'Accuracy' },
    ],
  },
  {
    cat: 'productivity', tabColor: 'teal-tab', nameColor: 'n-teal',
    tab: 'Supplier Rel. Manager',
    catLabel: 'cl-teal', catName: 'Productivity Improvement',
    name: 'Supplier Relationship Manager',
    badge: 'b-scan', badgeText: 'Monitoring',
    lbl: 'Relationship Health',
    out: 'Supplier A — <span class="ot">Relationship score: 84/100</span>\nDelivery OTIF: <span class="ow">96%</span> last 6 months.\n\nJoint cost-down project on track.\n<span class="ob">Next review: April 28.</span>',
    src: 'Delivery Data, Communication Logs, MRP Output',
    mets: [
      { v: '84', u: '/100', l: 'Relationship score' },
      { v: '96', u: '%', l: 'OTIF delivery' },
      { v: '3', u: '+', l: 'Joint projects' },
    ],
  },
  {
    cat: 'productivity', tabColor: 'teal-tab', nameColor: 'n-teal',
    tab: 'Market Demand Tracker',
    catLabel: 'cl-teal', catName: 'Productivity Improvement',
    name: 'Market Demand & Supply Tracker',
    badge: 'b-alert', badgeText: 'Tightness Alert',
    lbl: 'Market Signal',
    out: '<span class="owarn">⚠ TIGHT:</span> Epoxy resin supply tightening.\nLeadtimes up <span class="ow">+3 weeks</span> across Asia.\n\n<span class="ot">Recommend: Accelerate Q3 orders</span>\n<span class="ob">before further tightening. Window: 3 weeks.</span>',
    src: 'Market Data, Industry Reports, Demand Signals',
    mets: [
      { v: '+3', u: 'wk', l: 'Leadtime increase' },
      { v: '18', u: '+', l: 'Categories tracked' },
      { v: '72', u: 'h', l: 'Signal latency' },
    ],
  },
  // ── ANALYTICS & DATA ──
  {
    cat: 'data', tabColor: 'slate-tab', nameColor: 'n-slate',
    tab: 'Data De-duplication',
    catLabel: 'cl-slate', catName: 'Analytics & Data',
    name: 'Data De-duplication',
    badge: 'b-done', badgeText: 'Clean Complete',
    lbl: 'Data Quality Report',
    out: 'Scanned <span class="ow">48,200</span> material records.\nDuplicates resolved: <span class="ot">3,840</span> records.\n\nSpend visibility improved by <span class="ow">22%</span>.\n<span class="ob">Golden records now live in SAP.</span>',
    src: 'Material Master, Vendor Master, ERP Extract',
    mets: [
      { v: '48k', u: '+', l: 'Records scanned' },
      { v: '22', u: '%', l: 'Visibility gain' },
      { v: '8', u: '%', l: 'Duplicates removed' },
    ],
  },
  {
    cat: 'data', tabColor: 'slate-tab', nameColor: 'n-slate',
    tab: 'Data Enrichment',
    catLabel: 'cl-slate', catName: 'Analytics & Data',
    name: 'Data Enrichment & Golden Records',
    badge: 'b-done', badgeText: 'Enrichment Done',
    lbl: 'Enrichment Summary',
    out: '<span class="ot">12,400 thin records</span> enriched with\nstandardised attributes and classifications.\n\nVendor consolidation identified:\n<span class="ow">142 suppliers</span> → <span class="ob">89 Golden Records.</span>',
    src: 'Material Master, Vendor Master, External Databases',
    mets: [
      { v: '12k', u: '+', l: 'Records enriched' },
      { v: '37', u: '%', l: 'Vendor reduction' },
      { v: '100', u: '%', l: 'AI-interpretable' },
    ],
  },
  {
    cat: 'data', tabColor: 'slate-tab', nameColor: 'n-slate',
    tab: 'Data Mgmt in M&A',
    catLabel: 'cl-slate', catName: 'Analytics & Data',
    name: 'Data Management in M&A',
    badge: 'b-done', badgeText: 'Simulation Ready',
    lbl: 'M&A Integration Sim.',
    out: 'Combined entity simulation complete.\nOverlapping SKUs: <span class="ow">1,840</span> materials.\n\nSynergy potential identified: <span class="ot">$4.2M</span>\n<span class="ob">procurement savings in Year 1.</span>',
    src: 'Both Entity ERPs, Spend Data, Supplier Lists',
    mets: [
      { v: '1.8k', u: '+', l: 'Overlapping SKUs' },
      { v: '$4.2', u: 'M', l: 'Year 1 synergy' },
      { v: 'D1', u: '', l: 'Ready Day 1' },
    ],
  },
  {
    cat: 'data', tabColor: 'slate-tab', nameColor: 'n-slate',
    tab: 'Analytics',
    catLabel: 'cl-slate', catName: 'Analytics & Data',
    name: 'Analytics',
    badge: 'b-run', badgeText: 'Live Dashboard',
    lbl: 'Procurement Performance',
    out: 'Q1 savings delivered: <span class="ow">₹18.4Cr</span>\nvs. ₹16Cr target. <span class="ot">+15% ahead of plan.</span>\n\nTop performer: Should-Cost category.\n<span class="ob">CFO report auto-generated.</span>',
    src: 'ERP Data, Contract Data, Communication Logs',
    mets: [
      { v: '₹18', u: 'Cr', l: 'Q1 savings' },
      { v: '+15', u: '%', l: 'Ahead of target' },
      { v: '100', u: '%', l: 'Verified to PO' },
    ],
  },
]

const CATEGORIES = [
  { id: 'all', label: 'All 16 Agents', color: '' },
  { id: 'expansion', label: 'Margin Expansion', color: '' },
  { id: 'protection', label: 'Margin Protection', color: 'teal' },
  { id: 'productivity', label: 'Productivity', color: 'teal' },
  { id: 'data', label: 'Analytics & Data', color: 'slate' },
]

const AgentCarousel = (props) => {
  const [activeCategory, setActiveCategory] = useState('all')
  const [currentIndex, setCurrentIndex] = useState(0)
  const timerRef = useRef(null)
  const tabRefs = useRef([])

  const filteredAgents = AGENTS.filter(
    (a) => activeCategory === 'all' || a.cat === activeCategory
  )

  const activeAgent = filteredAgents[currentIndex] || filteredAgents[0]

  const startAuto = () => {
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredAgents.length)
    }, 3800)
  }

  useEffect(() => {
    setCurrentIndex(0)
    startAuto()
    return () => clearInterval(timerRef.current)
  }, [activeCategory])

  useEffect(() => {
    if (tabRefs.current[currentIndex]) {
      tabRefs.current[currentIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      })
    }
  }, [currentIndex])

  const handleTabClick = (index) => {
    clearInterval(timerRef.current)
    setCurrentIndex(index)
    startAuto()
  }

  const handleCategoryClick = (catId) => {
    setActiveCategory(catId)
  }

  return (
    <div className="apollo-wrap">
      {/* Category filter tabs */}
      <div className="ap-cat-tabs">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`ap-cat-tab ${cat.color} ${
              activeCategory === cat.id ? 'on' : ''
            }`}
            onClick={() => handleCategoryClick(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="ap">
        {/* Title bar */}
        <div className="ap-bar">
          <div className="ap-dots">
            <div className="ap-dot" style={{ background: '#FF5F57' }}></div>
            <div className="ap-dot" style={{ background: '#FFBD2E' }}></div>
            <div className="ap-dot" style={{ background: '#28C840' }}></div>
          </div>
          <div className="ap-title">
            Apollo · 16 Procurement Intelligence Agents
          </div>
          <div className="ap-live">
            <span className="ap-live-dot"></span>Live
          </div>
        </div>

        {/* Agent tabs */}
        <div className="ap-tabs">
          {filteredAgents.map((agent, i) => (
            <button
              key={`${activeCategory}-${agent.tab}-${i}`}
              ref={(el) => (tabRefs.current[i] = el)}
              className={`ap-tab ${agent.tabColor} ${
                currentIndex === i ? 'on' : ''
              }`}
              onClick={() => handleTabClick(i)}
            >
              {agent.tab}
            </button>
          ))}
        </div>

        {/* Agent card */}
        <div className="ap-body">
          {activeAgent && (
            <div className="ap-card on">
              <span className={`ap-cat-label ${activeAgent.catLabel}`}>
                {activeAgent.catName}
              </span>
              <div className="ap-card-hd">
                <span className={`ap-name ${activeAgent.nameColor}`}>
                  {activeAgent.name}
                </span>
                <span className={`ap-badge ${activeAgent.badge}`}>
                  {activeAgent.badgeText}
                </span>
              </div>
              <div className="ap-lbl">{activeAgent.lbl}</div>
              <div
                className="ap-out"
                dangerouslySetInnerHTML={{
                  __html: activeAgent.out.replace(/\n/g, '<br>'),
                }}
              />
              <div
                className="ap-src"
                dangerouslySetInnerHTML={{
                  __html: activeAgent.src,
                }}
              />

              <div className="ap-mets">
                {activeAgent.mets.map((m, i) => (
                  <div key={i} className="ap-met">
                    <div className="ap-mv">
                      {m.v}
                      <span
                        className={`ap-mu ${
                          ['%', 'Cr', 'M'].includes(m.u) ? 't' : ''
                        }`}
                      >
                        {m.u}
                      </span>
                    </div>
                    <div className="ap-ml">{m.l}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dots indicator */}
        <div className="ap-dots-row">
          {filteredAgents.map((_, i) => (
            <button
              key={i}
              className={`ap-ind ${currentIndex === i ? 'on' : ''}`}
              onClick={() => handleTabClick(i)}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="ap-ft">
          <div className="ap-ft-l">
            <span className="ap-ft-live">●</span>
            Apollo running{' '}
            <span
              style={{
                color: '#fff',
                fontWeight: 500,
                margin: '0 3px',
              }}
            >
              {filteredAgents.length}
            </span>{' '}
            agents simultaneously
          </div>
          <div className="ap-ft-btns">
            <button className="ap-ft-btn ap-ft-gh">Explore All</button>
            <a
              href="https://outlook.office.com/bookwithme/user/8b876d6424a5445e960d92a2a28db077@scmmax.com/meetingtype/NvRUL87SiUuK83_PAIvasw2?anonymous&ismsaljsauthenabled&ep=mlink"
              target="_blank"
              rel="noreferrer noopener"
              className="ap-ft-btn ap-ft-br"
              style={{ textDecoration: 'none', textAlign: 'center' }}
            >
              Book a Demo
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AgentCarousel
