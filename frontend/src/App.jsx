import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import FileUpload from './components/FileUpload';
import ResultsTable from './components/ResultsTable';
import LogConsole from './components/LogConsole';
import EnrichmentRules from './components/EnrichmentRules';
import ClusterVisualizer from './components/ClusterVisualizer';
import { Boxes, Settings } from 'lucide-react';

// Dashboard Component - Pure UI now
function Dashboard({
  uploadedFile, setUploadedFile,
  originalFilename, setOriginalFilename,
  isProcessing, startProcessing,
  logs, results, totalRows, foundCount, completionData, handleUploadComplete
}) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">
          <span className="text-white">Golden Record</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Generator</span>
        </h1>
        <p className="text-slate-400">Intelligent Chemical Identification by SCM-MAX</p>

        <div className="flex justify-center gap-4 mt-4">
          <Link to="/clusters" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-full text-cyan-400 text-sm font-semibold hover:bg-slate-700 transition-colors">
            <Boxes size={16} /> View Material Clusters
          </Link>
          <Link to="/rules" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-full text-cyan-400 text-sm font-semibold hover:bg-slate-700 transition-colors">
            <Settings size={16} /> Enrichment Rules
          </Link>
        </div>
      </div>

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
                <div className="text-3xl font-bold text-cyan-400">{Math.round((results.length / (totalRows || 1)) * 100)}%</div>
                <div className="text-xs text-slate-500">{results.length} / {totalRows} processed</div>
              </div>
            </div>

            <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-8">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300 ease-out"
                style={{ width: `${(results.length / (totalRows || 1)) * 100}%` }}
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

function ClustersPage() {
  return <ClusterVisualizer />;
}

function App() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [originalFilename, setOriginalFilename] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [results, setResults] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [foundCount, setFoundCount] = useState(0);
  const [completionData, setCompletionData] = useState(null);

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
    setCompletionData(null);
  };

  const startProcessing = () => {
    if (!uploadedFile) return;
    setIsProcessing(true);
    setResults([]); // Clear previous results to avoid duplication
    setLogs([{ message: 'Initializing connection...', type: 'info' }]);

    const eventSource = new EventSource(`/process/${uploadedFile}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'log') {
        setLogs(prev => [...prev.slice(-99), data]); // Keep last 100 logs
      }

      if (data.type === 'start') {
        setTotalRows(data.total);
        setLogs(prev => [...prev, { message: `Processing started for ${data.total} rows`, type: 'success' }]);
      }

      if (data.type === 'row') {
        setResults(prev => [...prev, data.data]);
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
      <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30">
        <Routes>
          <Route path="/" element={
            <Dashboard
              uploadedFile={uploadedFile}
              setUploadedFile={setUploadedFile}
              originalFilename={originalFilename}
              setOriginalFilename={setOriginalFilename}
              isProcessing={isProcessing}
              startProcessing={startProcessing}
              logs={logs}
              results={results}
              totalRows={totalRows}
              foundCount={foundCount}
              completionData={completionData}
              handleUploadComplete={handleUploadComplete}
            />
          } />
          <Route path="/clusters" element={<ClustersPage />} />
          <Route path="/rules" element={<EnrichmentRules />} />
        </Routes>

        {/* Global Progress Indicator (Toast style) */}
        {isProcessing && (
          <div className="fixed bottom-4 right-4 bg-slate-800 border border-cyan-500/50 p-4 rounded-xl shadow-2xl z-50 flex items-center gap-4 animate-slide-up">
            <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin"></div>
            <div>
              <p className="text-white font-bold text-sm">Processing Data...</p>
              <p className="text-xs text-slate-400">{results.length} / {totalRows}</p>
            </div>
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;
