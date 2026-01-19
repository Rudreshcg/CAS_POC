import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import FileUpload from './components/FileUpload';
import ResultsTable from './components/ResultsTable';
import LogConsole from './components/LogConsole';
import ClusterVisualizer from './components/ClusterVisualizer';
import { Boxes } from 'lucide-react';

function Dashboard() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [originalFilename, setOriginalFilename] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [results, setResults] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [foundCount, setFoundCount] = useState(0);
  const [completionData, setCompletionData] = useState(null);

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
    setLogs([{ message: 'Initializing connection...', type: 'info' }]);

    const eventSource = new EventSource(`/process/${uploadedFile}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'log') {
        setLogs(prev => [...prev, data]);
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">
          <span className="text-white">Golden Record</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Generator</span>
        </h1>
        <p className="text-slate-400">Intelligent Chemical Identification by SCM-MAX</p>

        <Link to="/clusters" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-slate-800 rounded-full text-cyan-400 text-sm font-semibold hover:bg-slate-700 transition-colors">
          <Boxes size={16} /> View Material Clusters
        </Link>
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
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clusters" element={<ClustersPage />} />
      </Routes>
    </Router>
  );
}

export default App;
