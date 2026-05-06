import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

const IndustrialTemplate = ({ data, selectedMaturity, onMaturitySelect, onDownload, downloaded }) => {
    // Local form state for the prototype's contact form
    const [form, setForm] = useState({ first_name: '', last_name: '', email: '', company: '', role: '' });
    const [submitted, setSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        
        // Map index to label
        const maturityLabels = ["Exploring", "Piloting", "Scaling", "Not started"];
        const maturityValue = selectedMaturity !== null ? maturityLabels[selectedMaturity] : "None";

        try {
            await axios.post(`${API_BASE}/api/report-request`, {
                slug: data.slug,
                ...form,
                maturity: maturityValue
            });
            setSubmitted(true);
            if (onDownload) onDownload();
        } catch (err) {
            console.error("Report Request Error:", err);
            setError(err.response?.data?.detail || "Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="industrial-template">
            {/* ── NAV ── */}
            <nav className="nav">
                <div className="nav-brand">
                    <span className="brand-w">SCMM<span style={{color:'var(--brass)'}}>A</span>X</span>
                    <span className="brand-a">Apollo</span>
                </div>
                <div className="nav-right">
                    <a href="https://scmmax.com" className="nav-link-text">scmmax.com</a>
                    <button className="nav-cta" onClick={() => document.getElementById('downloadSection').scrollIntoView({behavior:'smooth'})}>Download the Report</button>
                </div>
            </nav>

            {/* ── HERO ── */}
            <section className="hero">
                <div className="hero-orb1"></div>
                <div className="hero-orb2"></div>
                <div className="hero-inner">
                    <div className="hero-left">
                        <div className="hero-eyebrow">
                            <span className="ey-line"></span>
                            <span className="ey-text">{data.research_date || data.provenance || 'AI Procurement Intelligence · Indian Chemical Sector'}</span>
                        </div>
                        <h1 className="hero-hl">
                            {data.exec_name ? (
                                <span dangerouslySetInnerHTML={{ __html: data.exec_name.replace(/\n/g, '<br/>') }} />
                            ) : (
                                <>Your margins are<br/>being decided in<br/><em>markets your team</em><br/><em>isn't watching.</em></>
                            )}
                        </h1>
                        <div className="hero-sub">
                            {data.intro ? (
                                <p style={{lineHeight: 1.8}} dangerouslySetInnerHTML={{ __html: data.intro.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                            ) : (
                                <p style={{lineHeight: 1.8}}>
                                    <strong>{data.company_name}</strong> faces a procurement challenge that SAP and Coupa 
                                    were not built to solve. <strong>Commodity volatility, Chinese import pressure, 
                                    and single-source supplier risk</strong> are eroding direct material margins 
                                    faster than procurement teams can respond manually.
                                    Apollo changes that.
                                </p>
                            )}
                        </div>
                        <div className="industry-tags">
                            {data.greeting ? (
                                data.greeting.split(',').map((tag, i) => (
                                    <span key={i} className="ind-tag active">{tag.trim()}</span>
                                ))
                            ) : (
                                <>
                                    <span className="ind-tag active">Specialty Chemicals</span>
                                    <span className="ind-tag active">Commodity Chemicals</span>
                                    <span className="ind-tag active">Agrochemicals</span>
                                    <span className="ind-tag">Petrochemicals</span>
                                    <span className="ind-tag">Pharma Intermediates</span>
                                </>
                            )}
                        </div>
                        <div className="ind-hero-buttons">
                            <button className="btn-primary" onClick={() => document.getElementById('downloadSection').scrollIntoView({behavior:'smooth'})}>
                                Download Industry Report →
                            </button>
                            <button className="btn-ghost-light" onClick={() => document.getElementById('demoSection').scrollIntoView({behavior:'smooth'})}>
                                Book a Demo
                            </button>
                        </div>
                    </div>

                    <div className="hero-right">
                        <div className="hero-stat-card">
                            <div className="stat-card-label" style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ width: '16px', height: '1px', background: 'var(--teal-lt)', marginRight: '8px' }}></span>
                                {data.nav_label || `Apollo in Indian Chemicals — What We See`}
                            </div>
                            <div className="ind-stat-grid">
                                {(data.stats && data.stats.length > 0 ? data.stats : [
                                    { num: '₹180Cr', label: 'Avg. direct spend in mid-size Indian chemical co.' },
                                    { num: '3–6%', label: 'Typical margin leakage from unindexed contracts' },
                                    { num: '23%', label: 'Of specialty chemical categories have single-source risk' },
                                    { num: '90 days', label: 'To first agent running alongside your ERP' }
                                ]).map((stat, i) => (
                                    <div key={i} className="ind-stat-item">
                                        <div className="stat-num">{stat.num}</div>
                                        <div className="stat-label">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', marginBottom: '16px', width: '100%' }}></div>
                            <div className="stat-footnote" style={{ fontSize: '.75rem', color: 'var(--slate-500)', lineHeight: '1.5' }}>
                                {data.analysis_source || `Based on Apollo's analysis of procurement patterns across 12 Indian chemical companies. Benchmarks are segment-specific, not global averages.`}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── WAVE ── */}
            <div className="wave">
                <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{display:'block',width:'100%',height:60}}>
                    <path d="M0 0 L1440 0 L1440 0 Q1080 60 720 50 Q360 40 0 60 Z" fill="#0F1421"/>
                    <path d="M0 60 Q360 40 720 50 Q1080 60 1440 0 L1440 60 Z" fill="#F4F6FA"/>
                </svg>
            </div>

            {/* ── PAIN POINTS (Challenges) ── */}
            <section className="pain-section">
                <div className="pain-inner">
                    <div className="section-eyebrow">
                        <span className="s-ey-line"></span>
                        <span className="s-ey-text">The Procurement Challenges Apollo Solves</span>
                    </div>
                    <h2 className="section-title">Six problems every Indian<br/><em>chemical CPO recognises.</em></h2>
                    <p className="section-sub">
                        These are not hypothetical. They are the procurement challenges 
                        we hear consistently from chemical companies across Gujarat, 
                        Maharashtra, and Rajasthan — and the ones Apollo is specifically 
                        built to address.
                    </p>

                    <div className="pain-grid">
                        {(data.findings && data.findings.length > 0 ? [
                            ...data.findings.map((f, i) => ({
                                icon: i % 2 === 0 ? '📉' : '🇨🇳',
                                title: f.title,
                                body: f.body,
                                apollo: f.impact
                            })),
                            { icon: '⚠️', title: 'Single-source dependencies that create production risk', body: 'Many specialty chemical inputs have limited qualified supplier pools. When a supplier has a quality event or logistics issue, your production line feels it within weeks.', apollo: 'Apollo\'s Alternate Suppliers and Resilience Sentinel agents continuously scan for qualified alternatives before you need them urgently.' },
                            { icon: '🗂️', title: 'Material master data that no one fully trusts', body: 'Duplicate material codes, inconsistent descriptions, and fragmented vendor records mean your spend analysis is always slightly wrong — and your AI initiatives start on a broken foundation.', apollo: 'Apollo\'s Data De-duplication and Golden Records agents clean and consolidate your SAP or Oracle master data without a manual data migration project.' },
                            { icon: '🤝', title: 'Negotiations where your buyers are outprepared', body: 'Your suppliers arrive with market data, cost justifications, and prepared positions. Your buyers arrive with last year\'s price and gut feel. The outcome of that meeting is predictable.', apollo: 'Apollo\'s Negotiation Assistant generates a complete intelligence brief — should-cost, market signals, supplier risk profile — automatically before every supplier meeting.' },
                            { icon: '📊', title: 'Savings that get claimed but can\'t be verified', body: 'Procurement reports savings. Finance can\'t reconcile them to the P&L. Leadership loses confidence in the procurement function\'s numbers. This cycle repeats every quarter.', apollo: 'Apollo\'s Analytics agent tracks every saving to the purchase order level — verified, attributable, and reportable to the CFO in real time.' }
                        ].slice(0, 6) : [
                            { icon: '📉', title: 'Commodity price movements that outpace your contracts', body: 'When soda ash, sulphur, or chlorine prices move, your fixed-price contracts don\'t. Competitors with indexed contracts capture the downside; you absorb it.', apollo: 'Apollo\'s Price Forecasting and Should-Cost agents give your team a live view of what commodities should cost before every contract renewal.' },
                            { icon: '🇨🇳', title: 'Chinese import pressure your buyers can\'t quantify', body: 'Chinese producers have expanded capacity significantly across basic chemicals. Your domestic suppliers know this. Your buyers often don\'t have the data to use it as leverage.', apollo: 'Apollo\'s Procurement Prism maps global supply dynamics per material and arms your buyers with indexed benchmarks before they negotiate.' },
                            { icon: '⚠️', title: 'Single-source dependencies that create production risk', body: 'Many specialty chemical inputs have limited qualified supplier pools. When a supplier has a quality event or logistics issue, your production line feels it within weeks.', apollo: 'Apollo\'s Alternate Suppliers and Resilience Sentinel agents continuously scan for qualified alternatives before you need them urgently.' },
                            { icon: '🗂️', title: 'Material master data that no one fully trusts', body: 'Duplicate material codes, inconsistent descriptions, and fragmented vendor records mean your spend analysis is always slightly wrong — and your AI initiatives start on a broken foundation.', apollo: 'Apollo\'s Data De-duplication and Golden Records agents clean and consolidate your SAP or Oracle master data without a manual data migration project.' },
                            { icon: '🤝', title: 'Negotiations where your buyers are outprepared', body: 'Your suppliers arrive with market data, cost justifications, and prepared positions. Your buyers arrive with last year\'s price and gut feel. The outcome of that meeting is predictable.', apollo: 'Apollo\'s Negotiation Assistant generates a complete intelligence brief — should-cost, market signals, supplier risk profile — automatically before every supplier meeting.' },
                            { icon: '📊', title: 'Savings that get claimed but can\'t be verified', body: 'Procurement reports savings. Finance can\'t reconcile them to the P&L. Leadership loses confidence in the procurement function\'s numbers. This cycle repeats every quarter.', apollo: 'Apollo\'s Analytics agent tracks every saving to the purchase order level — verified, attributable, and reportable to the CFO in real time.' }
                        ]).map((p, i) => (
                            <div key={i} className="pain-card">
                                <div className={`pain-icon ${i === 2 || i === 3 ? 'teal-icon' : ''}`}>{p.icon}</div>
                                <div className="pain-title">{p.title}</div>
                                <div className="pain-body" dangerouslySetInnerHTML={{ __html: p.body.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                                <div className="pain-apollo" dangerouslySetInnerHTML={{ __html: p.apollo.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section className="how-section">
                <div className="how-inner">
                    <div className="section-eyebrow">
                        <span className="s-ey-line"></span>
                        <span className="s-ey-text">How Apollo Works</span>
                    </div>
                    <h2 className="section-title">Not a replacement.<br/><em>An intelligence layer.</em></h2>
                    <p className="section-sub">
                        Apollo sits alongside your existing ERP and procurement software. 
                        It does not replace SAP or Coupa. It reads your data, understands 
                        your context, and surfaces decisions your team hasn't had time to make.
                    </p>

                    <div className="how-grid">
                        <div className="how-steps">
                            <div className="how-step">
                                <div className="how-step-num">01</div>
                                <div className="how-step-content">
                                    <div className="how-step-title">Apollo connects to your ERP in 60–90 days</div>
                                    <div className="how-step-body">Our Forward Deployed Engineers configure Apollo to read from your SAP, Oracle, or Coupa environment via secure API. No data migration. No disruption to your team's existing workflows.</div>
                                </div>
                            </div>
                            <div className="how-step">
                                <div className="how-step-num">02</div>
                                <div className="how-step-content">
                                    <div className="how-step-title">16 agents go to work on your spend</div>
                                    <div className="how-step-body">Each agent has a specific job — from cleaning your material master data to scanning global markets for better supplier alternatives. They run continuously, not just at contract renewal time.</div>
                                </div>
                            </div>
                            <div className="how-step">
                                <div className="how-step-num">03</div>
                                <div className="how-step-content">
                                    <div className="how-step-title">Your team acts on intelligence, not instinct</div>
                                    <div className="how-step-body">Buyers see should-cost benchmarks before negotiations. CPOs see category strategies updated in real time. CFOs see savings tracked to the purchase order.</div>
                                </div>
                            </div>
                            <div className="how-step">
                                <div className="how-step-num">04</div>
                                <div className="how-step-content">
                                    <div className="how-step-title">Your data never leaves your environment</div>
                                    <div className="how-step-body">Apollo runs inside your infrastructure — on-premise or private cloud. No spend data is shared externally, no models are trained on your information.</div>
                                </div>
                            </div>
                        </div>

                        <div className="agents-panel">
                            <div className="agents-label">Most Relevant Apollo Agents for Indian Chemicals</div>
                            <div className="agents-list">
                                <div className="agent-row"><span className="agent-dot brass"></span><span className="agent-name">Should-Cost Modeling</span><span className="agent-tag high">High impact</span></div>
                                <div className="agent-row"><span className="agent-dot brass"></span><span className="agent-name">Procurement Prism</span><span className="agent-tag high">High impact</span></div>
                                <div className="agent-row"><span className="agent-dot teal"></span><span className="agent-name">Price Forecasting</span><span className="agent-tag med">Key for chemicals</span></div>
                                <div className="agent-row"><span className="agent-dot teal"></span><span className="agent-name">Alternate Suppliers</span><span className="agent-tag med">Key for chemicals</span></div>
                                <div className="agent-row"><span className="agent-dot brass"></span><span className="agent-name">Resilience Sentinel</span><span className="agent-tag high">High impact</span></div>
                                <div className="agent-row"><span className="agent-dot teal"></span><span className="agent-name">Negotiation Assistant</span><span className="agent-tag med">Key for chemicals</span></div>
                                <div className="agent-row"><span className="agent-dot slate"></span><span className="agent-name">Data De-duplication</span><span className="agent-tag" style={{background:'rgba(74,88,128,.2)',color:'var(--slate-300)'}}>Foundation</span></div>
                                <div className="agent-row"><span className="agent-dot slate"></span><span className="agent-name">Analytics</span><span className="agent-tag" style={{background:'rgba(74,88,128,.2)',color:'var(--slate-300)'}}>Foundation</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── RESULTS (Benchmarks) ── */}
            <section className="results-section">
                <div className="results-orb"></div>
                <div className="results-inner">
                    <div className="results-eyebrow">
                        <span className="r-ey-line"></span>
                        <span className="r-ey-text">What Apollo Delivers — Chemical Sector Benchmarks</span>
                    </div>
                    <h2 className="results-title">Numbers from the<br/><em>category, not a brochure.</em></h2>
                    <p className="results-sub">
                        These benchmarks are drawn from Apollo deployments in chemical 
                        and process industry companies. They are not global SaaS averages.
                    </p>
                    <div className="results-grid">
                        <div className="result-card">
                            <div className="result-num">3–6%</div>
                            <div className="result-label">Direct material cost reduction</div>
                            <div style={{fontSize:'.7rem', color:'var(--slate-600)', marginTop:4}}>identified in first Procurement Prism scan</div>
                        </div>
                        <div className="result-card">
                            <div className="result-num">90</div>
                            <div className="result-label">Days to first savings identified</div>
                            <div style={{fontSize:'.7rem', color:'var(--slate-600)', marginTop:4}}>from contract signing to live agents</div>
                        </div>
                        <div className="result-card">
                            <div className="result-num">4–10%</div>
                            <div className="result-label">Better vs. market price</div>
                            <div style={{fontSize:'.7rem', color:'var(--slate-600)', marginTop:4}}>on first negotiation using should-cost model</div>
                        </div>
                        <div className="result-card">
                            <div className="result-num">16</div>
                            <div className="result-label">Agents working continuously</div>
                            <div style={{fontSize:'.7rem', color:'var(--slate-600)', marginTop:4}}>across every direct procurement lever</div>
                        </div>
                    </div>
                    <div className="results-quote">
                        <p className="rq-text">
                            We brought Apollo into our soda ash and chlorine categories first. 
                            Within the first quarter the should-cost models alone justified 
                            the entire annual contract value — and our buyers finally had 
                            numbers they could defend in front of suppliers.
                        </p>
                        <div className="rq-author">
                            <strong>Head of Procurement</strong> · Mid-size Specialty Chemical Company, Gujarat
                        </div>
                    </div>
                </div>
            </section>

            {/* ── WAVE 2 ── */}
            <div className="wave2">
                <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{display:'block',width:'100%',height:60}}>
                    <path d="M0 0 L1440 0 L1440 60 Q1080 40 720 50 Q360 60 0 40 Z" fill="#0F1421"/>
                    <path d="M0 40 Q360 60 720 50 Q1080 40 1440 60 L1440 60 Z" fill="#F4F6FA"/>
                </svg>
            </div>

            {/* ── DOWNLOAD (Industry Report) ── */}
            <section className="download-section" id="downloadSection">
                <div className="download-inner">
                    <div className="dl-left">
                        <div className="section-eyebrow">
                            <span className="s-ey-line"></span>
                            <span className="s-ey-text">Free Industry Report</span>
                        </div>
                        <h2 className="dl-title">AI Procurement in Indian<br/><em>Chemicals — 2025 Playbook</em></h2>
                        <p className="dl-sub">
                            A practical guide to deploying AI procurement intelligence 
                            in the Indian chemical sector — written for CPOs, not IT teams. 
                            No fluff, no vendor pitch. Just the playbook.
                        </p>
                        <div className="dl-contents">
                            <div className="dl-item"><div className="dl-item-icon">📊</div><div className="dl-item-text"><strong>Commodity volatility map</strong> — the 12 chemical input categories most exposed to price risk in 2025</div></div>
                            <div className="dl-item"><div className="dl-item-icon">🗺️</div><div className="dl-item-text"><strong>AI readiness framework</strong> — how to assess where your procurement team is and what to prioritise first</div></div>
                            <div className="dl-item"><div className="dl-item-icon">💰</div><div className="dl-item-text"><strong>ROI model template</strong> — a working spreadsheet to build the business case for procurement AI internally</div></div>
                            <div className="dl-item"><div className="dl-item-icon">⚖️</div><div className="dl-item-text"><strong>Vendor evaluation checklist</strong> — 14 questions to ask any procurement AI vendor before signing</div></div>
                        </div>
                    </div>

                    <div className="dl-right">
                        <div className="form-card">
                            {!submitted ? (
                                <>
                                    <div className="form-card-title">Get the report</div>
                                    <p className="form-card-sub">Free. No sales follow-up unless you want one. Delivered to your inbox immediately.</p>
                                    <form onSubmit={handleSubmit}>
                                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14}}>
                                            <div>
                                                <label className="admin-label">First name</label>
                                                <input type="text" className="admin-input" placeholder="Vikram" value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} required />
                                            </div>
                                            <div>
                                                <label className="admin-label">Last name</label>
                                                <input type="text" className="admin-input" placeholder="Shah" value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} required />
                                            </div>
                                        </div>
                                        <div style={{marginBottom:14}}>
                                            <label className="admin-label">Work email</label>
                                            <input type="email" className="admin-input" placeholder="vikram.shah@yourcompany.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                                        </div>
                                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20}}>
                                            <div>
                                                <label className="admin-label">Company</label>
                                                <input type="text" className="admin-input" placeholder="Your company" value={form.company} onChange={e => setForm({...form, company: e.target.value})} required />
                                            </div>
                                            <div>
                                                <label className="admin-label">Your role</label>
                                                <select className="admin-input" value={form.role} onChange={e => setForm({...form, role: e.target.value})} required>
                                                    <option value="" disabled>Select</option>
                                                    <option>CPO / Head of Procurement</option>
                                                    <option>VP / Director Procurement</option>
                                                    <option>Category Manager</option>
                                                    <option>CFO / Finance</option>
                                                    <option>CEO / MD</option>
                                                    <option>Other</option>
                                                </select>
                                            </div>
                                        </div>
                                        {error && <div style={{color: '#ff6b6b', fontSize: '.75rem', marginBottom: '15px', textAlign: 'center'}}>{error}</div>}
                                        <button type="submit" className="btn-primary" style={{width:'100%'}} disabled={isLoading}>
                                            {isLoading ? 'Sending...' : 'Send Me the Report →'}
                                        </button>
                                    </form>
                                </>
                            ) : (
                                <div className="form-success show">
                                    <div className="fs-icon">📩</div>
                                    <div className="fs-title">Report on its way to your inbox</div>
                                    <p className="fs-sub">Check your email — it should arrive within 2 minutes. If you'd like to see Apollo running on your own spend, book a 30-minute session below.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── DEMO STRIP ── */}
            <section className="demo-strip" id="demoSection">
                <div className="demo-inner">
                    <div className="demo-left">
                        <div className="demo-eyebrow"><span className="d-ey-line"></span>Ready to see Apollo on your spend?</div>
                        <h2 className="demo-title">30 minutes.<br/><em>Your spend. Our team.</em></h2>
                        <p className="demo-sub">No slides. No generic demo. We connect Apollo to a sample of your spend data and show you exactly what it finds — in your categories, with your suppliers.</p>
                    </div>
                    <div className="demo-right">
                        <div className="demo-buttons" style={{display:'flex', flexDirection:'column', gap:12, alignItems:'flex-end'}}>
                            <button className="btn-primary">Book a 30-Minute Session →</button>
                            <button className="btn-ghost-light">Talk to Our Team First</button>
                            <p className="demo-reassurance">No commitment. No follow-up sequence.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="footer">
                <div className="footer-left">
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <span className="brand-w">SCMM<span style={{color:'var(--brass)'}}>A</span>X</span>
                        <span className="brand-a">Apollo</span>
                    </div>
                    <span className="footer-copy">© 2025 SCMmax. All rights reserved.</span>
                </div>
                <div className="footer-links">
                    <a href="https://scmmax.com" className="footer-link">scmmax.com</a>
                </div>
            </footer>

            <style>{`
                .hero-sub p { margin-bottom: 0; }
                .admin-label { font-size: .62rem; font-weight: 500; letter-spacing: .1em; text-transform: uppercase; color: var(--slate-500); display: block; margin-bottom: 5px; }
                .admin-input { width: 100%; padding: 11px 14px; border: 1px solid var(--slate-100); border-radius: 6px; font-family: var(--font-b); font-size: .85rem; color: var(--slate-900); background: var(--slate-50); outline: none; transition: border-color 180ms, background 180ms; }
                .admin-input:focus { border-color: var(--brass); background: #fff; }
                
                .download-inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 80px; align-items: start; }
                .pain-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
                .how-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; margin-top: 56px; }
                .results-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 56px; }
                .demo-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 48px; }

                .dl-item { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 12px; }
                .dl-item-icon { 
                    width: 40px; height: 40px; border-radius: 8px; 
                    background: rgba(201,147,58,0.08); border: 1px solid rgba(201,147,58,0.15); 
                    display: flex; align-items: center; justify-content: center; 
                    font-size: 1.1rem; flex-shrink: 0; 
                }
                .dl-item-text { font-size: .88rem; color: var(--slate-600); line-height: 1.7; padding-top: 4px; }
                .dl-item-text strong { color: var(--slate-900); font-weight: 500; }

                .form-card { background: #fff; border: 1px solid var(--slate-100); border-radius: 16px; padding: 40px; }
                .form-card-title { font-family: var(--font-d); font-size: 1.3rem; font-weight: 300; color: var(--slate-900); letter-spacing: -.02em; margin-bottom: 6px; }
                .form-card-sub { font-size: .82rem; color: var(--slate-400); line-height: 1.6; margin-bottom: 28px; }

                .form-success { text-align: center; padding: 32px 16px; }
                .fs-icon { font-size: 2rem; margin-bottom: 12px; }
                .fs-title { font-family: var(--font-d); font-size: 1.2rem; font-weight: 300; color: var(--slate-900); margin-bottom: 8px; }
                .fs-sub { font-size: .82rem; color: var(--slate-500); line-height: 1.7; }

                .pain-card:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0,0,0,0.05); transition: all 200ms; }
                .btn-primary:hover { background: var(--brass-lt); transform: translateY(-1px); }
                
                select.admin-input { cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%237A8AAE' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px; }

                @media(max-width: 900px) {
                    .hero-inner, .how-grid, .download-inner, .demo-inner { grid-template-columns: 1fr; gap: 48px; }
                    .pain-grid { grid-template-columns: 1fr; }
                    .results-grid { grid-template-columns: 1fr 1fr; }
                    .demo-inner { flex-direction: column; align-items: flex-start; }
                }
            `}</style>
        </div>
    );
};

export default IndustrialTemplate;
