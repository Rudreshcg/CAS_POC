import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, X, Save, FileSpreadsheet, ChevronRight, Layout, Database, Users, Download } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

const AdminPortal = () => {
    const [secretKey, setSecretKey] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [view, setView] = useState('list'); // 'list', 'edit', 'upload', 'leads'
    const [campaigns, setCampaigns] = useState([]);
    const [leads, setLeads] = useState([]);
    const [currentCampaign, setCurrentCampaign] = useState(null);
    const [status, setStatus] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [modal, setModal] = useState({ isOpen: false, type: '', message: '', onConfirm: null });

    useEffect(() => {
        if (isAuthenticated) {
            if (view === 'list') fetchCampaigns();
            if (view === 'leads') fetchLeads();
        }
    }, [isAuthenticated, view]);

    const fetchCampaigns = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/admin/campaigns?key=${secretKey}`);
            setCampaigns(res.data);
        } catch (err) {
            console.error(err);
            if (err.response?.status === 403) {
                setIsAuthenticated(false);
                setModal({ isOpen: true, type: 'alert', message: "Invalid or expired session. Please login again." });
            }
        }
    };

    const fetchLeads = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/admin/leads?key=${secretKey}`);
            setLeads(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleLogin = (e) => {
        e.preventDefault();
        if (secretKey) {
            setIsAuthenticated(true);
            setStatus('');
        }
    };

    const confirmDelete = (slug) => {
        setModal({
            isOpen: true,
            type: 'confirm',
            message: `Are you sure you want to delete campaign: ${slug}?`,
            onConfirm: async () => {
                setModal({ isOpen: false });
                try {
                    await axios.delete(`${API_BASE}/api/admin/campaign/${slug}?key=${secretKey}`);
                    fetchCampaigns();
                } catch (err) {
                    setModal({ isOpen: true, type: 'alert', message: "Delete failed." });
                }
            }
        });
    };

    const startEdit = async (slug) => {
        setIsLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/api/campaign/${slug}`);
            setCurrentCampaign({ ...res.data, is_new: false });
            setView('edit');
        } catch (err) {
            setModal({ isOpen: true, type: 'alert', message: "Failed to fetch campaign details." });
        } finally {
            setIsLoading(false);
        }
    };

    const startNew = () => {
        setCurrentCampaign({
            is_new: true,
            type: 'p',
            slug: '',
            company_name: '',
            exec_name: '',
            greeting: 'Good morning,',
            intro: '',
            provenance: '',
            findings: [{ title: '', body: '', impact: '' }, { title: '', body: '', impact: '' }],
            stats: [{ num: '', label: '' }, { num: '', label: '' }, { num: '', label: '' }, { num: '', label: '' }],
            contact_email: 'sales@scmmax.com',
            pdf_1: '', pdf_2: '', pdf_3: '', pdf_4: ''
        });
        setView('edit');
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus('Saving...');
        try {
            await axios.post(`${API_BASE}/api/admin/save?key=${secretKey}`, currentCampaign);
            setStatus('Campaign saved successfully!');
            setTimeout(() => {
                setView('list');
                fetchCampaigns();
                setStatus('');
            }, 1000);
        } catch (err) {
            setStatus(`Error: ${err.response?.data?.detail || 'Save failed'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        setIsLoading(true);
        setStatus('Uploading...');
        try {
            const res = await axios.post(`${API_BASE}/api/admin/ingest?key=${secretKey}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setStatus(`Success! Processed ${res.data.processed} campaigns.`);
            setFile(null);
            setTimeout(() => { setView('list'); fetchCampaigns(); setStatus(''); }, 1500);
        } catch (err) {
            setStatus(`Error: ${err.response?.data?.detail || 'Upload failed'}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="admin-login" style={{ background: 'var(--ink)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <div style={{ background: 'var(--slate-900)', padding: '40px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-d)', fontSize: '2rem', fontStyle: 'italic', color: 'var(--brass)', marginBottom: '10px' }}>SCMM<span style={{ color: '#fff', fontStyle: 'normal' }}>A</span>X</div>
                    <h2 style={{ fontWeight: 300, marginBottom: '30px', color: 'var(--slate-300)' }}>Admin Portal</h2>
                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                            <label style={{ fontSize: '.7rem', color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '.1em', display: 'block', marginBottom: '8px' }}>Secret Key</label>
                            <input type="password" value={secretKey} onChange={(e) => setSecretKey(e.target.value)} style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                        </div>
                        <button type="submit" className="btn-primary" style={{ width: '100%' }}>Access Portal</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-portal" style={{ background: 'var(--ink)', minHeight: '100vh', color: '#fff', fontFamily: 'var(--font-b)', padding: '40px 20px' }}>
            {/* Modal Overlay */}
            {modal.isOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'var(--slate-900)', padding: '30px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                        <h3 style={{ marginBottom: '15px', color: '#fff', fontWeight: 400 }}>{modal.type === 'confirm' ? 'Confirm Action' : 'Notice'}</h3>
                        <p style={{ color: 'var(--slate-300)', marginBottom: '25px', lineHeight: '1.5' }}>{modal.message}</p>
                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                            {modal.type === 'confirm' ? (
                                <>
                                    <button className="btn-ghost" onClick={() => setModal({ isOpen: false })}>Cancel</button>
                                    <button className="btn-primary" onClick={modal.onConfirm}>Confirm</button>
                                </>
                            ) : (
                                <button className="btn-primary" onClick={() => setModal({ isOpen: false })}>OK</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                    <div style={{ cursor: 'pointer' }} onClick={() => setView('list')}>
                        <div style={{ fontFamily: 'var(--font-d)', fontSize: '1.2rem', fontStyle: 'italic', color: 'var(--brass)' }}>SCMM<span style={{ color: '#fff', fontStyle: 'normal' }}>A</span>X</div>
                        <div style={{ fontSize: '.7rem', color: 'var(--slate-500)', letterSpacing: '.1em' }}>CAMPAIGN ENGINE</div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => setView('leads')} style={{ background: view === 'leads' ? 'rgba(201,147,58,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${view === 'leads' ? 'var(--brass)' : 'rgba(255,255,255,0.1)'}`, color: view === 'leads' ? 'var(--brass-lt)' : '#fff', padding: '10px 16px', borderRadius: '6px', fontSize: '.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Users size={16} /> Report Leads
                        </button>
                        <button onClick={startNew} style={{ background: 'rgba(201,147,58,0.1)', border: '1px solid var(--brass)', color: 'var(--brass-lt)', padding: '10px 16px', borderRadius: '6px', fontSize: '.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Plus size={16} /> Create New
                        </button>
                        <button onClick={() => setView('upload')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px 16px', borderRadius: '6px', fontSize: '.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileSpreadsheet size={16} /> Bulk Ingest
                        </button>
                        <button onClick={() => setIsAuthenticated(false)} style={{ background: 'transparent', border: 'none', color: 'var(--slate-500)', fontSize: '.8rem', marginLeft: '12px' }}>Logout</button>
                    </div>
                </div>

                {/* List View */}
                {view === 'list' && (
                    <div style={{ background: 'var(--slate-900)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 300 }}>Active Campaigns</h3>
                            <span style={{ fontSize: '.7rem', color: 'var(--slate-500)' }}>{campaigns.length} total</span>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ fontSize: '.65rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--slate-500)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <th style={{ padding: '16px 24px' }}>Company</th>
                                        <th>Slug</th>
                                        <th>Type</th>
                                        <th>Last Update</th>
                                        <th style={{ textAlign: 'right', paddingRight: '24px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {campaigns.map(camp => (
                                        <tr key={camp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 200ms' }} className="admin-row">
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ fontWeight: 500 }}>{camp.company_name}</div>
                                                <div style={{ fontSize: '.7rem', color: 'var(--slate-500)' }}>{camp.exec_name || 'Generic'}</div>
                                            </td>
                                            <td style={{ fontSize: '.85rem', color: 'var(--slate-400)' }}>{camp.slug}</td>
                                            <td>
                                                <span style={{ fontSize: '.6rem', padding: '2px 8px', borderRadius: '100px', background: camp.type === 'i' ? 'rgba(0,184,160,0.1)' : 'rgba(201,147,58,0.1)', color: camp.type === 'i' ? 'var(--teal-lt)' : 'var(--brass-lt)', border: `1px solid ${camp.type === 'i' ? 'rgba(0,184,160,0.2)' : 'rgba(201,147,58,0.2)'}` }}>
                                                    {camp.type === 'i' ? 'INDUSTRIAL' : 'PERSONALIZED'}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '.75rem', color: 'var(--slate-500)' }}>{new Date(camp.updated_at).toLocaleDateString()}</td>
                                            <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                                    <a href={`/${camp.type}/${camp.slug}`} target="_blank" rel="noreferrer" style={{ color: 'var(--slate-400)', hover: { color: '#fff' } }} title="View Live"><ChevronRight size={18} /></a>
                                                    <button onClick={() => startEdit(camp.slug)} style={{ background: 'none', border: 'none', color: 'var(--slate-400)', cursor: 'pointer' }} title="Edit"><Edit2 size={16} /></button>
                                                    <button onClick={() => confirmDelete(camp.slug)} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', opacity: 0.6 }} title="Delete"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Leads View */}
                {view === 'leads' && (
                    <div style={{ background: 'var(--slate-900)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 300 }}>Report Request Leads</h3>
                                <div style={{ fontSize: '.7rem', color: 'var(--slate-500)' }}>{leads.length} total requests</div>
                            </div>
                            <a href={`${API_BASE}/api/admin/leads/csv?key=${secretKey}`} download className="btn-ghost" style={{ fontSize: '.75rem', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', padding: '8px 12px' }}>
                                <Download size={14} /> Export CSV
                            </a>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ fontSize: '.65rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--slate-500)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <th style={{ padding: '16px 24px' }}>Lead Details</th>
                                        <th>Company / Role</th>
                                        <th>Maturity</th>
                                        <th>Campaign Source</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right', paddingRight: '24px' }}>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leads.length === 0 ? (
                                        <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--slate-600)' }}>No report requests found.</td></tr>
                                    ) : (
                                        leads.map(lead => (
                                            <tr key={lead.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }} className="admin-row">
                                                <td style={{ padding: '16px 24px' }}>
                                                    <div style={{ fontWeight: 500 }}>{lead.first_name} {lead.last_name}</div>
                                                    <div style={{ fontSize: '.75rem', color: 'var(--slate-400)' }}>{lead.email}</div>
                                                </td>
                                                <td>
                                                    <div style={{ fontSize: '.85rem' }}>{lead.company}</div>
                                                    <div style={{ fontSize: '.7rem', color: 'var(--slate-500)' }}>{lead.role}</div>
                                                </td>
                                                <td>
                                                    <div style={{ fontSize: '.8rem', color: lead.maturity ? 'var(--brass-lt)' : 'var(--slate-600)' }}>
                                                        {lead.maturity || 'N/A'}
                                                    </div>
                                                </td>
                                                <td style={{ fontSize: '.8rem', color: 'var(--slate-400)' }}>
                                                    {lead.slug}
                                                </td>
                                                <td>
                                                    {lead.is_downloaded ? (
                                                        <span style={{ fontSize: '.6rem', padding: '2px 8px', borderRadius: '100px', background: 'rgba(0,184,160,0.1)', color: 'var(--teal-lt)', border: '1px solid rgba(0,184,160,0.2)' }}>
                                                            DOWNLOADED
                                                        </span>
                                                    ) : (
                                                        <span style={{ fontSize: '.6rem', padding: '2px 8px', borderRadius: '100px', background: 'rgba(255,255,255,0.05)', color: 'var(--slate-400)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                            PENDING
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'right', paddingRight: '24px', fontSize: '.75rem', color: 'var(--slate-500)' }}>
                                                    {new Date(lead.created_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Edit View */}
                {view === 'edit' && currentCampaign && (
                    <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                            {/* Main Content Card */}
                            <div style={{ background: 'var(--slate-900)', padding: '32px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <h4 style={{ fontSize: '.7rem', color: 'var(--brass)', letterSpacing: '.1em', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Layout size={14} /> {currentCampaign.type === 'i' ? 'INDUSTRIAL HERO & SECTOR CONFIG' : 'HERO CONTENT'}
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                                    <div>
                                        <label className="admin-label">Company / Sector Name</label>
                                        <input type="text" className="admin-input" value={currentCampaign.company_name} onChange={e => setCurrentCampaign({ ...currentCampaign, company_name: e.target.value })} placeholder={currentCampaign.type === 'i' ? 'e.g. Industrial Chemicals Ltd' : 'e.g. Tata Chemicals'} required />
                                    </div>
                                    <div>
                                        <label className="admin-label">Slug (Unique URL)</label>
                                        <input type="text" className="admin-input" value={currentCampaign.slug} onChange={e => setCurrentCampaign({ ...currentCampaign, slug: e.target.value })} placeholder={currentCampaign.type === 'i' ? 'e.g. industrial-chemicals-na' : 'e.g. tata-chemicals-rajesh'} required />
                                    </div>
                                    
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label className="admin-label">{currentCampaign.type === 'i' ? 'Hero Headline (Main Title)' : 'Executive Name'}</label>
                                        <input type="text" className="admin-input" value={currentCampaign.exec_name} onChange={e => setCurrentCampaign({ ...currentCampaign, exec_name: e.target.value })} placeholder={currentCampaign.type === 'i' ? 'e.g. Your margins are being decided...' : 'e.g. Rajesh'} />
                                    </div>
                                </div>

                                {currentCampaign.type === 'i' && (
                                    <div style={{ marginBottom: '24px' }}>
                                        <label className="admin-label">Industry Tags (Comma separated)</label>
                                        <input type="text" className="admin-input" value={currentCampaign.greeting} onChange={e => setCurrentCampaign({ ...currentCampaign, greeting: e.target.value })} placeholder="e.g. Specialty Chemicals, Agrochemicals, Petrochemicals" />
                                    </div>
                                )}

                                <div style={{ marginBottom: '24px' }}>
                                    <label className="admin-label">{currentCampaign.type === 'i' ? 'Sector Challenge Description' : 'Intro Text'}</label>
                                    <textarea className="admin-input" rows="4" value={currentCampaign.intro} onChange={e => setCurrentCampaign({ ...currentCampaign, intro: e.target.value })} placeholder={currentCampaign.type === 'i' ? 'Describe the core challenge for this sector...' : "e.g. Our team spent time understanding **Tata Chemicals' direct spend profile**, your supplier base, and the commodity markets you operate in. What follows are two specific opportunities where Apollo can move the needle on your procurement margins."} />
                                </div>
                                
                                <div>
                                    <label className="admin-label">{currentCampaign.type === 'i' ? 'Report Eyebrow (Top Left Title)' : 'Provenance / Prepared By'}</label>
                                    <input type="text" className="admin-input" value={currentCampaign.provenance} onChange={e => setCurrentCampaign({ ...currentCampaign, provenance: e.target.value })} placeholder={currentCampaign.type === 'i' ? 'e.g. Prepared exclusively for Industrial Chemicals Ltd' : 'e.g. Prepared exclusively for Tata Chemicals'} />
                                </div>
                            </div>

                            {/* Findings Card */}
                            {currentCampaign.type !== 'i' && (
                            <div style={{ background: 'var(--slate-900)', padding: '32px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <h4 style={{ fontSize: '.7rem', color: 'var(--brass)', letterSpacing: '.1em', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Database size={14} /> FINDINGS (2)
                                </h4>
                                {currentCampaign.findings.map((f, i) => (
                                    <div key={i} style={{ marginBottom: i === 0 ? '30px' : 0, padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ fontSize: '.6rem', color: 'var(--slate-500)', marginBottom: '15px' }}>FINDING 0{i + 1}</div>
                                        <div style={{ marginBottom: '15px' }}>
                                            <label className="admin-label">Headline</label>
                                            <input type="text" className="admin-input" placeholder={i === 0 ? "e.g. Your soda ash margins are absorbing Chinese import pressure that your contracts aren't indexed to deflect" : "e.g. Your specialty chemical supplier base has three single-source dependencies that create supply risk"} value={f.title} onChange={e => {
                                                const newF = [...currentCampaign.findings];
                                                newF[i].title = e.target.value;
                                                setCurrentCampaign({ ...currentCampaign, findings: newF });
                                            }} />
                                        </div>
                                        <div style={{ marginBottom: '15px' }}>
                                            <label className="admin-label">Body</label>
                                            <textarea className="admin-input" rows="3" placeholder={i === 0 ? "e.g. Global soda ash prices have declined 18% over the past 14 months, driven by expanded Chinese production capacity. Apollo's analysis indicates that a significant portion of your domestic soda ash purchases are on fixed-price annual contracts..." : "e.g. Analysis identified three material categories — sodium bicarbonate precursors, chlorine derivatives, and silica compounds — where your supply base shows single-source concentration..."} value={f.body} onChange={e => {
                                                const newF = [...currentCampaign.findings];
                                                newF[i].body = e.target.value;
                                                setCurrentCampaign({ ...currentCampaign, findings: newF });
                                            }} />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px' }}>
                                            <div>
                                                <label className="admin-label">Impact (Bold Value)</label>
                                                <input type="text" className="admin-input" placeholder={i === 0 ? "e.g. Estimated CPO impact:" : "e.g. Estimated CPO impact:"} 
                                                    value={f.impact ? (f.impact.match(/\*\*(.*?)\*\*/) ? f.impact.match(/\*\*(.*?)\*\*/)[1] : '') : ''} 
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        const rest = f.impact ? f.impact.replace(/\*\*(.*?)\*\*\s*/, '') : '';
                                                        const newF = [...currentCampaign.findings];
                                                        newF[i].impact = val ? `**${val}** ${rest}` : rest;
                                                        setCurrentCampaign({ ...currentCampaign, findings: newF });
                                                    }} />
                                            </div>
                                            <div>
                                                <label className="admin-label">Impact (Rest of sentence)</label>
                                                <input type="text" className="admin-input" placeholder={i === 0 ? "e.g. Transitioning 40% of fixed-price soda ash contracts to indexed structures could represent ₹28–45Cr in annual cost reduction." : "e.g. Qualifying two alternate sources per category reduces emergency sourcing premium exposure — historically 15–30% above contracted price."} 
                                                    value={f.impact ? f.impact.replace(/\*\*(.*?)\*\*\s*/, '') : ''} 
                                                    onChange={e => {
                                                        const rest = e.target.value;
                                                        const match = f.impact ? f.impact.match(/\*\*(.*?)\*\*/) : null;
                                                        const val = match ? match[1] : '';
                                                        const newF = [...currentCampaign.findings];
                                                        newF[i].impact = val ? `**${val}** ${rest}` : rest;
                                                        setCurrentCampaign({ ...currentCampaign, findings: newF });
                                                    }} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            )}

                            {/* Metrics/Stats Card */}
                            <div style={{ background: 'var(--slate-900)', padding: '32px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <h4 style={{ fontSize: '.7rem', color: 'var(--brass)', letterSpacing: '.1em', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Plus size={14} /> KEY METRICS / STATS (4)
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    {(currentCampaign.stats || [{num:'',label:''},{num:'',label:''},{num:'',label:''},{num:'',label:''}]).map((s, i) => (
                                        <div key={i} style={{ padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ fontSize: '.6rem', color: 'var(--slate-500)', marginBottom: '10px' }}>METRIC {i + 1}</div>
                                            <div style={{ marginBottom: '10px' }}>
                                                <label className="admin-label">Value (e.g. ₹120Cr)</label>
                                                <input type="text" className="admin-input" placeholder={
                                                    currentCampaign.type === 'i' 
                                                    ? (i === 0 ? "e.g. ₹180Cr" : i === 1 ? "e.g. 3–6%" : i === 2 ? "e.g. 23%" : "e.g. 90 days")
                                                    : (i === 0 ? "e.g. ₹2,400Cr" : i === 1 ? "e.g. 6" : i === 2 ? "e.g. 3–5%" : "e.g. 90 days")
                                                } value={s.num} onChange={e => {
                                                    const newS = [...(currentCampaign.stats || [])];
                                                    if (!newS[i]) newS[i] = {num:'',label:''};
                                                    newS[i].num = e.target.value;
                                                    setCurrentCampaign({ ...currentCampaign, stats: newS });
                                                }} />
                                            </div>
                                            <div>
                                                <label className="admin-label">Label</label>
                                                <input type="text" className="admin-input" placeholder={
                                                    currentCampaign.type === 'i'
                                                    ? (i === 0 ? "e.g. Avg. direct spend in mid-size Indian chemical co." : i === 1 ? "e.g. Typical margin leakage from unindexed contracts" : i === 2 ? "e.g. Of specialty chemical categories have single-source risk" : "e.g. To first agent running alongside your ERP")
                                                    : (i === 0 ? "e.g. Estimated direct spend under management" : i === 1 ? "e.g. Key commodity categories analysed" : i === 2 ? "e.g. Potential cost reduction identified" : "e.g. To first agent running alongside your ERP")
                                                } value={s.label} onChange={e => {
                                                    const newS = [...(currentCampaign.stats || [])];
                                                    if (!newS[i]) newS[i] = {num:'',label:''};
                                                    newS[i].label = e.target.value;
                                                    setCurrentCampaign({ ...currentCampaign, stats: newS });
                                                }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar: Config & Save */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ background: 'var(--slate-900)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <label className="admin-label">Template Type</label>
                                <select className="admin-input" value={currentCampaign.type} onChange={e => setCurrentCampaign({ ...currentCampaign, type: e.target.value })}>
                                    <option value="p">Personalized (Type 1)</option>
                                    <option value="i">Industrial (Type 2)</option>
                                </select>

                                <div style={{ marginTop: '20px' }}>
                                    <label className="admin-label">Notification Email</label>
                                    <input type="email" className="admin-input" value={currentCampaign.contact_email} onChange={e => setCurrentCampaign({ ...currentCampaign, contact_email: e.target.value })} />
                                </div>
                            </div>

                            <div style={{ background: 'var(--slate-900)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <h5 style={{ fontSize: '.65rem', color: 'var(--slate-500)', marginBottom: '15px' }}>PDF DOWNLOADS (S3 URLS)</h5>
                                {[1, 2, 3, 4].map(n => (
                                    <div key={n} style={{ marginBottom: '10px' }}>
                                        <label style={{ fontSize: '.6rem', color: 'var(--slate-600)' }}>PDF {n}</label>
                                        <input type="text" className="admin-input" style={{ fontSize: '.7rem', padding: '8px' }} value={currentCampaign[`pdf_${n}`] || ''} onChange={e => setCurrentCampaign({ ...currentCampaign, [`pdf_${n}`]: e.target.value })} />
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="button" onClick={() => setView('list')} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '14px', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" disabled={isLoading} className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    {isLoading ? '...' : <><Save size={16} /> Save</>}
                                </button>
                            </div>
                            {status && <div style={{ fontSize: '.8rem', color: 'var(--brass-lt)', textAlign: 'center' }}>{status}</div>}
                        </div>
                    </form>
                )}

                {/* Bulk View */}
                {view === 'upload' && (
                    <div style={{ maxWidth: '600px', margin: '0 auto', background: 'var(--slate-900)', padding: '40px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                        <div style={{ marginBottom: '32px' }}>
                            <h3 style={{ fontFamily: 'var(--font-d)', fontWeight: 300, fontSize: '1.5rem', marginBottom: '10px' }}>Bulk Spreadsheet Ingest</h3>
                            <p style={{ color: 'var(--slate-400)', fontSize: '.9rem' }}>Upload your campaign master file to sync all records at once.</p>
                            <a href={`${API_BASE}/api/admin/template?key=${secretKey}`} download className="btn-ghost" style={{ display: 'inline-block', marginTop: '15px', fontSize: '.8rem', textDecoration: 'none' }}>
                                Download Example Template (.xlsx)
                            </a>
                        </div>
                        <div style={{ border: '2px dashed rgba(201,147,58,0.2)', borderRadius: '12px', padding: '40px', background: 'rgba(201,147,58,0.02)', marginBottom: '32px' }}>
                            <input type="file" accept=".xlsx" id="bulk-up" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
                            <label htmlFor="bulk-up" style={{ cursor: 'pointer' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📄</div>
                                <div style={{ fontWeight: 500 }}>{file ? file.name : 'Choose File'}</div>
                            </label>
                        </div>
                        {status && <div style={{ marginBottom: '20px', color: status.startsWith('Error') ? '#ff6b6b' : 'var(--teal-lt)' }}>{status}</div>}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => setView('list')} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '14px', borderRadius: '8px' }}>Cancel</button>
                            <button onClick={handleUpload} disabled={!file || isLoading} className="btn-primary" style={{ flex: 1 }}>{isLoading ? 'Processing...' : 'Run Sync'}</button>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .admin-label { font-size: .65rem; color: var(--slate-500); text-transform: uppercase; letter-spacing: .1em; display: block; margin-bottom: 8px; }
                .admin-input { width: 100%; padding: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); borderRadius: 8px; color: #fff; outline: none; font-family: var(--font-b); transition: border 200ms; }
                .admin-input:focus { border-color: var(--brass); }
                .admin-row:hover { background: rgba(255,255,255,0.02); }
            `}</style>
        </div>
    );
};

export default AdminPortal;
