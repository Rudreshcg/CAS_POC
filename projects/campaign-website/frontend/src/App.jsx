import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CampaignPage from './CampaignPage';
import AdminPortal from './admin/AdminPortal';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Supporting both /p/:slug and /i/:slug as specified */}
        <Route path="/p/:slug" element={<CampaignPage />} />
        <Route path="/i/:slug" element={<CampaignPage />} />
        
        {/* Admin Route for Marketing Team */}
        <Route path="/admin/ingest" element={<AdminPortal />} />
        
        {/* Simple landing or redirect if no slug */}
        <Route path="/" element={<div style={{padding: '100px', textAlign: 'center', background: 'var(--slate-900)', height: '100vh', color: '#fff'}}><h1>SCMmax Campaign Portal</h1><p style={{color: 'var(--slate-400)'}}>Please use your personalized access link.</p></div>} />
      </Routes>
    </Router>
  );
}

export default App;
