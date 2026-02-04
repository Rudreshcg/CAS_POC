import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import FileUpload from './components/FileUpload';
import ResultsTable from './components/ResultsTable';
import LogConsole from './components/LogConsole';
import EnrichmentRules from './components/EnrichmentRules';
import ClusterVisualizer from './components/ClusterVisualizer';
import SpendAnalyticsTab from './components/SpendAnalyticsTab';
import { Boxes, Settings, PieChart, FileText, AlertTriangle, ArrowRightLeft } from 'lucide-react';

// --- Tab Components ---

function EnrichedDescriptionTab({
  uploadedFile, setUploadedFile, originalFilename, setOriginalFilename,
  isProcessing, startProcessing, logs, results, totalRows, processedCount,
  foundCount, completionData, handleUploadComplete
}) {
  const [showRules, setShowRules] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Enriched Description & Analysis</h2>
          <p className="text-slate-400">Upload data to generate golden records and view enrichment details.</p>
        </div>
        <button
          onClick={() => setShowRules(!showRules)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${showRules
            ? 'bg-cyan-900/30 border-cyan-500 text-cyan-400'
            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
        >
          <Settings size={18} />
          {showRules ? 'Hide Rules' : 'Configure Enrichment Rules'}
        </button>
      </div>

      {/* Rules Sub-section */}
      {showRules && (
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 mb-8 animate-in slide-in-from-top-4 fade-in duration-300">
          <EnrichmentRules />
        </div>
      )}

      {/* Main Dashboard Content */}
      <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 backdrop-blur-sm shadow-2xl">
        {!isProcessing && !completionData ? (
          <div className="max-w-xl mx-auto">
            <FileUpload onUploadComplete={handleUploadComplete} />
            {uploadedFile && (
              <div className="mt-6 text-center">
                <p className="text-green-400 mb-4">Ready to process: {originalFilename}</p>
                <button onClick={startProcessing} className="btn">
                  Start Processing
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Processing...</h2>
                <p className="text-slate-400 text-sm">Validating chemical data with AI</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-cyan-400">{Math.round((processedCount / (totalRows || 1)) * 100)}%</div>
                <div className="text-xs text-slate-500">{processedCount} / {totalRows} processed</div>
              </div>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-8">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300 ease-out"
                style={{ width: `${(processedCount / (totalRows || 1)) * 100}%` }}
              />
            </div>
            <LogConsole logs={logs} />
          </div>
        )}
      </div>

      {results.length > 0 && <ResultsTable results={results} totalRows={totalRows} />}

      {completionData && (
        <div className="mt-8 text-center bg-green-900/20 border border-green-500/30 rounded-xl p-8">
          <h3 className="text-2xl font-bold text-green-400 mb-2">Processing Complete!</h3>
          <p className="text-green-200 mb-6">
            Found {completionData.found} CAS numbers out of {completionData.total} items.
          </p>
          <a href={`/download/${completionData.output_file}`} className="btn bg-green-600 hover:bg-green-500 text-white">
            Download Results CSV
          </a>
        </div>
      )}
    </div>
  );
}

function RiskTab() {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-slate-800/30 rounded-2xl border border-slate-700/50 border-dashed">
      <AlertTriangle size={64} className="text-amber-500/50 mb-4" />
      <h2 className="text-2xl font-bold text-slate-300">Risk Assessment</h2>
      <p className="text-slate-500 mt-2">Identify supply chain risks and compliance issues.</p>
      <span className="mt-4 px-3 py-1 bg-slate-800 text-slate-400 text-xs rounded-full border border-slate-700">Coming Soon</span>
    </div>
  );
}

function SubstitutionTab() {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-slate-800/30 rounded-2xl border border-slate-700/50 border-dashed">
      <ArrowRightLeft size={64} className="text-emerald-500/50 mb-4" />
      <h2 className="text-2xl font-bold text-slate-300">Substitution Business Case</h2>
      <p className="text-slate-500 mt-2">Evaluate alternatives and potential savings.</p>
      <span className="mt-4 px-3 py-1 bg-slate-800 text-slate-400 text-xs rounded-full border border-slate-700">Coming Soon</span>
    </div>
  );
}

// --- Main Layout ---

function Layout({ children }) {
  const location = useLocation();

  const tabs = [
    { name: 'Enriched Description', path: '/', icon: FileText },
    { name: 'Material Clusters', path: '/clusters', icon: Boxes },
    { name: 'Spend Analytics', path: '/spend', icon: PieChart },
    { name: 'Risk', path: '/risk', icon: AlertTriangle },
    { name: 'Substitution Business Case', path: '/substitution', icon: ArrowRightLeft },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <h1 className="text-2xl font-bold truncate">
              <span className="text-white">Material</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">De-duplication & Substitution</span>
            </h1>
            <div className="text-xs text-slate-500">Powered by SCM-MAX</div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 overflow-x-auto pb-0 custom-scrollbar">
            {tabs.map((tab) => {
              // Simple path matching
              // For spend, we match prefix
              const isActive = tab.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(tab.path.split('/')[1] ? `/${tab.path.split('/')[1]}` : tab.path);

              const Icon = tab.icon;
              return (
                <Link
                  key={tab.name}
                  to={tab.path}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${isActive
                    ? 'border-cyan-500 text-cyan-400 bg-cyan-950/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                >
                  <Icon size={16} />
                  {tab.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {children}
      </div>

      {/* Progress Toast */}
    </div>
  );
}

// --- App Component ---

function App() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [originalFilename, setOriginalFilename] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [results, setResults] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [foundCount, setFoundCount] = useState(0);
  const [completionData, setCompletionData] = useState(null);
  const [processedRowIndices, setProcessedRowIndices] = useState(new Set());

  useEffect(() => {
    fetchSessionData();
  }, []);

  const fetchSessionData = async () => {
    try {
      const res = await fetch('/api/results');
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setResults(data);
        setTotalRows(data.length);
        setProcessedRowIndices(new Set(data.map(r => r.row_number)));
        setFoundCount(data.filter(r => r.cas_number !== 'NOT FOUND').length);
        setOriginalFilename(data[0].filename);
        setUploadedFile(data[0].filename);
      }
    } catch (error) {
      console.error("Failed to load session:", error);
    }
  };

  const handleUploadComplete = (filename, originalName) => {
    setUploadedFile(filename);
    setOriginalFilename(originalName);
    setLogs([]);
    setResults([]);
    setProcessedRowIndices(new Set());
    setCompletionData(null);
  };

  const startProcessing = () => {
    if (!uploadedFile) return;
    setIsProcessing(true);
    setResults([]);
    setProcessedRowIndices(new Set());
    setLogs([{ message: 'Initializing connection...', type: 'info' }]);

    const eventSource = new EventSource(`/process/${uploadedFile}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'log') {
        setLogs(prev => [...prev.slice(-99), data]);
      }
      if (data.type === 'start') {
        setTotalRows(data.total);
        setLogs(prev => [...prev, { message: `Processing started for ${data.total} rows`, type: 'success' }]);
      }
      if (data.type === 'row') {
        setResults(prev => [...prev, data.data]);
        setProcessedRowIndices(prev => {
          const newSet = new Set(prev);
          newSet.add(data.data.row_number);
          return newSet;
        });
        if (data.data.cas_number !== 'NOT FOUND') {
          setFoundCount(prev => prev + 1);
        }
      }
      if (data.type === 'complete') {
        eventSource.close();
        setIsProcessing(false);
        setCompletionData(data);
        setLogs(prev => [...prev, { message: 'Processing Complete!', type: 'success' }]);
      }
      if (data.type === 'error') {
        eventSource.close();
        setIsProcessing(false);
        setLogs(prev => [...prev, { message: `Error: ${data.message}`, type: 'error' }]);
      }
    };
    eventSource.onerror = () => {
      eventSource.close();
      setIsProcessing(false);
    };
  };

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={
            <EnrichedDescriptionTab
              uploadedFile={uploadedFile}
              setUploadedFile={setUploadedFile}
              originalFilename={originalFilename}
              setOriginalFilename={setOriginalFilename}
              isProcessing={isProcessing}
              startProcessing={startProcessing}
              logs={logs}
              results={results}
              totalRows={totalRows}
              processedCount={processedRowIndices.size}
              foundCount={foundCount}
              completionData={completionData}
              handleUploadComplete={handleUploadComplete}
            />
          } />
          <Route path="/clusters" element={<ClusterVisualizer />} />
          <Route path="/spend" element={<SpendAnalyticsTab />} />
          <Route path="/risk" element={<RiskTab />} />
          <Route path="/substitution" element={<SubstitutionTab />} />
        </Routes>
      </Layout>

      {/* Global Progress Toast */}
      {isProcessing && (
        <div className="fixed bottom-4 right-4 bg-slate-800 border border-cyan-500/50 p-4 rounded-xl shadow-2xl z-50 flex items-center gap-4 animate-slide-up">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin"></div>
          <div>
            <p className="text-white font-bold text-sm">Processing Data...</p>
            <p className="text-xs text-slate-400">{processedRowIndices.size} / {totalRows}</p>
          </div>
        </div>
      )}
    </Router>
  );
}

export default App;
