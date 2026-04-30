import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle } from 'lucide-react';

// Templating
import IndustrialTemplate from './components/IndustrialTemplate';
import PersonalizedTemplate from './components/PersonalizedTemplate';

const API_BASE = import.meta.env.VITE_API_URL || '';

const CampaignPage = () => {
    const { slug } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedMaturity, setSelectedMaturity] = useState(null);
    const [downloaded, setDownloaded] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // 1. Fetch Campaign Data
                const res = await axios.get(`${API_BASE}/api/campaign/${slug}`);
                setData(res.data);
                setLoading(false);

                // 2. Track Visit
                await axios.post(`${API_BASE}/api/track`, {
                    slug: slug,
                    event_type: 'visit'
                });
            } catch (err) {
                console.error("Fetch Error:", err);
                setError(err.response?.data?.detail || "Campaign data not found on server.");
                setLoading(false);
            }
        };
        fetchData();
    }, [slug]);

    const handleMaturitySelect = async (index) => {
        setSelectedMaturity(index);
        // Silently track stage selection
        try {
            await axios.post(`${API_BASE}/api/track`, {
                slug: slug,
                event_type: 'stage_select',
                detail: `Maturity Stage ${index + 1}`
            });
        } catch (e) { console.warn("Tracking failed"); }
    };

    const handleDownload = async () => {
        if (selectedMaturity === null) return;

        const pdfUrl = data[`pdf_${selectedMaturity + 1}`];
        setDownloaded(true);

        // 1. Track Download Clicks
        const maturityLabels = ["Exploring", "Piloting", "Scaling", "Not started"];
        const maturityValue = selectedMaturity !== null ? maturityLabels[selectedMaturity] : "None";

        try {
            await axios.post(`${API_BASE}/api/track`, {
                slug: slug,
                event_type: 'download_click',
                detail: `PDF Stage ${selectedMaturity + 1}`,
                maturity: maturityValue
            });
        } catch (e) { console.warn("Tracking failed"); }

        // 2. Open PDF in new tab
        if (pdfUrl) {
            window.open(pdfUrl, '_blank');
        }
    };

    if (loading) return (
        <div style={{ background: 'var(--slate-900)', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', textAlign: 'center' }}>
            <div>
                <div style={{ fontSize: '1.2rem', fontFamily: 'var(--font-d)', fontStyle: 'italic', color: 'var(--brass)', marginBottom: '12px' }}>Preparing Research...</div>
                <div style={{ fontSize: '.7rem', letterSpacing: '.1em', textTransform: 'uppercase', opacity: 0.5 }}>Apollo Procurement Intelligence</div>
            </div>
        </div>
    );

    if (error) return (
        <div style={{ background: 'var(--slate-900)', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', textAlign: 'center', padding: '40px' }}>
            <div style={{ maxWidth: '400px' }}>
                <AlertCircle size={40} color="var(--brass)" style={{ marginBottom: '20px' }} />
                <h1 style={{ fontFamily: 'var(--font-d)', fontWeight: 300, marginBottom: '12px' }}>{error}</h1>
                <p style={{ fontSize: '.9rem', color: 'var(--slate-400)', lineHeight: 1.6 }}>This campaign may have expired or the link is incorrect. Please contact your account representative.</p>
                <div style={{ marginTop: '32px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                    <a href="https://scmmax.com" style={{ color: 'var(--brass)', textDecoration: 'none', fontSize: '.8rem' }}>Return to scmmax.com</a>
                </div>
            </div>
        </div>
    );

    // Dynamic Template Selection: 
    // 'i' = IndustrialTemplate (Type 2 Prototype)
    // 'p' = PersonalizedTemplate (Type 1 Prototype)
    const Template = data.type === 'i' ? IndustrialTemplate : PersonalizedTemplate;

    return (
        <Template
            data={data}
            selectedMaturity={selectedMaturity}
            onMaturitySelect={handleMaturitySelect}
            onDownload={handleDownload}
            downloaded={downloaded}
        />
    );
};

export default CampaignPage;
