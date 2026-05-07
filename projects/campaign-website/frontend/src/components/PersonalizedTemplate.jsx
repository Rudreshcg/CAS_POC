import React from 'react';

const PersonalizedTemplate = ({ data, selectedMaturity, onMaturitySelect, onDownload, downloaded }) => {
    const initials = data.company_name ? data.company_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : "TC";

    return (
        <div className="personalized-template">
            {/* Minimal Nav */}
            <nav className="nav">
                <div className="nav-brand">
                    <span className="brand-w">SCMM<span style={{color:'var(--brass)'}}>A</span>X</span>
                    <span className="brand-a" style={{marginLeft:6}}>Apollo</span>
                </div>
                <div className="nav-right">
                    <div className="nav-divider"></div>
                    <span className="nav-label">{data.nav_label || `Prepared for ${data.company_name}`}</span>
                </div>
            </nav>

            {/* Hero */}
            <section className="hero">
                <div className="hero-bg-orb1"></div>
                <div className="hero-bg-orb2"></div>
                <div className="hero-inner">
                    {/* Left */}
                    <div className="hero-left">
                        <div className="hero-provenance">
                            <span className="hero-prov-line"></span>
                            <span className="hero-prov-text">{data.provenance || `Prepared exclusively for ${data.company_name}`}</span>
                        </div>
                        <p className="hero-greeting">{data.greeting || 'Good morning,'}</p>
                        <h1 className="hero-name">
                            {data.hero_title_main || data.exec_name || 'Rajesh'}
                            <br/>
                            <em>{data.hero_title_highlight || (data.hero_title ? data.hero_title.replace(/.*<em>(.*)<\/em>.*/, '$1') : 'this is built')}</em>
                        </h1>
                        <p className="hero-company">{data.hero_subheadline || `for ${data.company_name}'s procurement team.`}</p>
                        <p className="hero-intro">
                            {data.intro && data.intro.split('\n\n').map((p, i) => (
                                <span key={i} dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                            ))}
                        </p>
                        <div className="scan-badge">
                            <span className="scan-dot"></span>
                            <span className="scan-badge-text">{data.research_date || 'Research prepared · 14 April 2025'}</span>
                        </div>
                    </div>

                    {/* Right — company card */}
                    <div className="hero-right">
                        <div className="company-card">
                            <div className="company-card-header">
                                <div className="company-logo-placeholder">{initials}</div>
                                <div>
                                    <div className="company-card-name">{data.company_name}</div>
                                    <div className="company-card-meta">{data.industry_segment || 'Specialty & Commodity Chemicals · Mumbai'}</div>
                                </div>
                            </div>
                            <div className="card-stat-row">
                                {data.stats && data.stats.map((stat, i) => (
                                    <div key={i} className="card-stat">
                                        <div className="card-stat-num">{stat.num}</div>
                                        <div className="card-stat-label">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="card-research-badge">
                                <span className="card-research-icon">🔍</span>
                                <span className="card-research-text" dangerouslySetInnerHTML={{ __html: (data.analysis_source || `This analysis was built using Apollo's Procurement Prism applied to publicly available **${data.company_name}** spend and supplier data — <strong>not generic benchmarks.</strong>`).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Wave */}
            <div className="wave">
                <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{display:'block',width:'100%',height:60}}>
                    <path d="M0 0 L1440 0 L1440 0 Q1080 60 720 50 Q360 40 0 60 Z" fill="#0F1421"/>
                    <path d="M0 60 Q360 40 720 50 Q1080 60 1440 0 L1440 60 Z" fill="#F4F6FA"/>
                </svg>
            </div>

            {/* Findings */}
            <section className="findings">
                <div className="findings-inner">
                    <div className="section-eyebrow">
                        <span className="eyebrow-line"></span>
                        <span className="eyebrow-text">{data.findings_eyebrow || `What We Found — Specific to ${data.company_name}`}</span>
                    </div>
                    <h2 className="section-title">
                        {data.findings_title_main || 'Two opportunities.'}
                        <br/>
                        <em>{data.findings_title_highlight || 'Quantified. Actionable. Yours.'}</em>
                    </h2>
                    <p className="section-sub" dangerouslySetInnerHTML={{ __html: (data.findings_subtitle || `These are not generic procurement observations. They reflect **${data.company_name}**'s specific commodity exposure, supplier base, and market position as of Q1 2025.`).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />

                    <div className="findings-grid">
                        {data.findings && data.findings.map((finding, i) => (
                            <div key={i} className="finding-card">
                                <div className={`finding-card-accent ${finding.accent || (i % 2 === 0 ? 'brass' : 'teal')}`}></div>
                                <div className="finding-card-body">
                                    <div className={`finding-number ${finding.accent === 'teal' ? 'teal-num' : (finding.accent !== 'brass' && i % 2 !== 0 ? 'teal-num' : '')}`}>{finding.label || `Finding ${String(i + 1).padStart(2, '0')}`}</div>
                                    <h3 className="finding-headline">{finding.title}</h3>
                                    <div className="finding-body-container">
                                        {finding.body.split('\n\n').map((p, idx) => (
                                            <p key={idx} className="finding-body" dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                                        ))}
                                    </div>
                                    <div className="finding-impact">
                                        <span className="finding-impact-icon">{finding.icon || (i % 2 === 0 ? '💼' : '👤')}</span>
                                        <span className="finding-impact-text" dangerouslySetInnerHTML={{ __html: finding.impact.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* AI Roadmap (Roadmap Section) */}
            <section className="roadmap-section" id="roadmap">
                <div className="roadmap-inner">
                    <div className="roadmap-card">
                        <div className="roadmap-card-bg"></div>
                        <div className="roadmap-grid">
                            <div className="roadmap-left">
                                <div className="roadmap-eyebrow">
                                    <span className="roadmap-ey-line"></span>
                                    <span className="roadmap-ey-text">{data.roadmap_eyebrow || 'Your Personalised Roadmap'}</span>
                                </div>
                                <h2 className="roadmap-title">
                                    {data.roadmap_title_main || 'A full AI procurement'}
                                    <br/>
                                    <em>{data.roadmap_title_highlight || `roadmap for ${data.company_name}`}</em>
                                </h2>
                                <p className="roadmap-sub">
                                    {data.roadmap_subtitle || `Beyond the findings above, our team has built a complete procurement AI readiness assessment for ${data.company_name} — calibrated to where your team is today and what would deliver the fastest, most defensible ROI.`}
                                </p>
                                <div className="roadmap-includes">
                                    <div className="roadmap-include-item">
                                        <div className="ri-icon">📊</div>
                                        <div className="ri-text">
                                            <strong>Full spend opportunity map</strong> — all 6 categories 
                                            analysed with prioritised savings levers
                                        </div>
                                    </div>
                                    <div className="roadmap-include-item">
                                        <div className="ri-icon">🗺️</div>
                                        <div className="ri-text">
                                            <strong>90-day activation plan</strong> — which Apollo agents 
                                            to deploy first and in what sequence for {data.company_name}'s 
                                            specific ERP setup
                                        </div>
                                    </div>
                                    <div className="roadmap-include-item">
                                        <div className="ri-icon">💰</div>
                                        <div className="ri-text">
                                            <strong>ROI projection</strong> — modelled savings across 
                                            Year 1, Year 2, and Year 3 based on your spend profile
                                        </div>
                                    </div>
                                    <div className="roadmap-include-item">
                                        <div className="ri-icon">🔒</div>
                                        <div className="ri-text">
                                            <strong>Data architecture note</strong> — how Apollo integrates 
                                            with SAP without any data leaving your environment
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="roadmap-right">
                                <div className="question-card">
                                    <div className="question-label" style={{textTransform: 'uppercase'}}>One quick question</div>
                                    <p className="question-text">Where is {data.company_name}'s procurement team today on AI?</p>
                                    <div className="maturity-options">
                                        {[
                                            { t: "Exploring", d: "We are evaluating what AI could do for procurement" },
                                            { t: "Piloting", d: "We have one or two AI initiatives running" },
                                            { t: "Scaling", d: "AI is deployed and we are expanding its scope" },
                                            { t: "Not started", d: "We have not formally begun an AI programme" }
                                        ].map((opt, i) => (
                                            <label key={i} className={`maturity-opt ${selectedMaturity === i ? 'selected' : ''}`} onClick={() => onMaturitySelect(i)}>
                                                <input type="radio" checked={selectedMaturity === i} readOnly />
                                                <div className="maturity-opt-content">
                                                    <div className="maturity-opt-title">{opt.t}</div>
                                                    <div className="maturity-opt-desc">{opt.d}</div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="download-area" style={{marginTop:0}}>
                                    {!downloaded && selectedMaturity === null && (
                                        <div className="download-hint" style={{display:'flex', alignItems:'center', gap:8, fontSize:'.72rem', color:'var(--slate-500)', marginBottom:12, padding:'0 4px', transition:'opacity 300ms'}}>
                                            <span className="hint-icon" style={{fontSize:'.8rem'}}>☝️</span>
                                            <span>Answer the question above to unlock your personalised roadmap</span>
                                        </div>
                                    )}

                                    {!downloaded && (
                                        <button className="btn-download" disabled={selectedMaturity === null} onClick={onDownload}>
                                            <span className="btn-download-icon" style={{fontSize:'1rem', flexShrink:0, transition:'transform 200ms', marginRight:8}}>⬇</span>
                                            Download Your Procurement AI Roadmap
                                        </button>
                                    )}

                                    {downloaded && (
                                        <div className="download-success show">
                                            <div className="ds-icon">✅</div>
                                            <div className="ds-title">Your roadmap is downloading</div>
                                            <div className="ds-sub">
                                                A copy has also been sent to our team. 
                                                Expect a call from us within 24 hours to walk you through it.
                                            </div>
                                        </div>
                                    )}

                                    <p className="privacy-note" style={{marginTop:12, fontSize:'.68rem', color:'var(--slate-500)', textAlign:'center', lineHeight:1.5}}>
                                        🔒 Your response is used only to personalise this document. 
                                        It is not shared or sold.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

             {/* Context Strip */}
             <section className="context-strip">
                <div className="context-inner">
                    <div className="context-item">
                        <div className="context-icon">🏗️</div>
                        <div className="context-title">Works alongside your ERP — not instead of it</div>
                        <div className="context-body">Apollo connects to your existing systems via secure APIs. No data migration, no rip-and-replace, no retraining your team on a new system.</div>
                    </div>
                    <div className="context-item">
                        <div className="context-icon">🔒</div>
                        <div className="context-title">Your data never leaves your environment</div>
                        <div className="context-body">Apollo runs inside your own infrastructure — on-premise or private cloud. No spend data is ever sent to external servers or used to train any model.</div>
                    </div>
                    <div className="context-item">
                        <div className="context-icon">⚡</div>
                        <div className="context-title">Live in 60–90 days</div>
                        <div className="context-body">Our Forward Deployed Engineers handle the full configuration. First agents running within 90 days of contract signing — not 18 months of implementation.</div>
                    </div>
                </div>
            </section>

            {/* CTA Strip */}
            <section className="cta-strip">
                <div className="cta-inner">
                    <div className="cta-left">
                        <div className="cta-eyebrow">
                            <span className="ey-teal-line" style={{width:24, height:1, background:'var(--teal)', opacity:.6, marginRight:10, display:'inline-block', verticalAlign:'middle'}}></span>
                            <span style={{fontSize:'.65rem', fontWeight:500, letterSpacing:'.18em', color:'var(--teal)', textTransform:'uppercase'}}>Next Step</span>
                        </div>
                        <h2 className="cta-title">See Apollo on<br/><em>{data.company_name}'s spend.</em></h2>
                        <p className="cta-sub">
                            30 minutes. We connect Apollo to a sample of your acetic acid and 
                            molasses procurement data and show you — live — what the category 
                            intelligence looks like. No slides. No generic demo.
                        </p>
                    </div>
                    <div className="cta-right">
                        <div className="cta-buttons">
                            <button className="btn-primary" style={{textTransform:'uppercase'}} onClick={() => window.location.href='https://outlook.office.com/book/RequestDemoSchedulingPage@scmmax.com/?ismsaljsauthenabled'}>Book a 30-Minute Session →</button>
                            <button className="btn-ghost" style={{textTransform:'uppercase'}} onClick={() => window.location.href='https://outlook.office.com/book/RequestDemoSchedulingPage@scmmax.com/?ismsaljsauthenabled'}>Talk to Our Team First</button>
                        </div>
                        <p className="cta-reassurance" style={{fontSize:'.65rem', color:'var(--slate-500)', textAlign:'right', marginTop:12, letterSpacing:'.01em'}}>No commitment. No follow-up sequence.</p>
                    </div>
                </div>
            </section>

            <footer className="footer" style={{paddingTop:64, paddingBottom:64}}>
                <div className="footer-brand" style={{display:'flex', alignItems:'center', gap:4}}>
                    <span className="brand-w" style={{fontSize:'.85rem', fontWeight:600, letterSpacing:'.05em', color:'#fff'}}>SCMM<span style={{color:'var(--brass)'}}>A</span>X</span>
                    <span className="brand-a" style={{fontSize:'.85rem', color:'var(--brass)', fontFamily:'var(--font-d)', fontStyle:'italic', marginLeft:4}}>Apollo</span>
                </div>
                <span className="footer-copy" style={{maxWidth:600, textAlign:'center'}}>
                    Strictly private and confidential. This document is intended solely for {data.exec_name || 'the recipient'} at {data.company_name} and contains proprietary strategy insights.
                </span>
                <div className="footer-links">
                    <a href="#" className="footer-link">Privacy</a>
                    <a href="https://scmmax.com" className="footer-link">scmmax.com</a>
                </div>
            </footer>
        </div>
    );
};

export default PersonalizedTemplate;
