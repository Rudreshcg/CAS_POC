import React, { useEffect, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import {
    AlertTriangle, ShieldAlert, Globe, DollarSign, Activity,
    ArrowUpRight, AlertCircle, TrendingDown, Info, Calendar,
    Settings, X, Plus, Trash2, Save
} from 'lucide-react';

const COLORS = {
    High: '#ef4444',   // red-500
    Medium: '#f59e0b', // amber-500
    Low: '#3b82f6',    // blue-500
    Total: '#8b5cf6'   // violet-500
};

const RISK_LOGIC = [
    {
        risk: "Single Source",
        level: "High",
        impact: "Only one vendor globally can lead to risk for business continuity if any issue happens to that supplier",
        identification: "Material code will have only one vendor code"
    },
    {
        risk: "Country Risk",
        level: "Medium",
        impact: "Single source from sensitive countries OR >X% of vendors are based out of sensitive country",
        identification: "Single source is from sensitive country OR concentration threshold exceeded for sensitive country"
    },
    {
        risk: "Geo Political",
        level: "Medium/High",
        impact: "Sourcing from sensitive countries like Iran, Russia, Ukraine, Israel",
        identification: "Country of vendor is in sensitive or high-risk list"
    },
    {
        risk: "Natural Disaster",
        level: "High",
        impact: "Tsunami, earthquake, snow blizzard etc. disrupting supply",
        identification: "Country is in disaster-affected list (user-configured)"
    }
];

const RiskDashboard = () => {
    const [riskData, setRiskData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [operatingUnit, setOperatingUnit] = useState('All');
    const [selectedYear, setSelectedYear] = useState('All');
    const [selectedRiskType, setSelectedRiskType] = useState('All');
    const [units, setUnits] = useState(['All']);
    const [years, setYears] = useState(['All']);
    const [config, setConfig] = useState({
        sensitive_countries: [],
        high_risk_countries: [],
        concentration_threshold: 75,
        natural_disaster_countries: []
    });
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [newSensitiveCountry, setNewSensitiveCountry] = useState('');
    const [newHighRiskCountry, setNewHighRiskCountry] = useState('');
    const [newDisasterCountry, setNewDisasterCountry] = useState('');

    const RISK_TYPES = ['All', 'Single Source', 'Geo Political', 'Country Risk', 'Natural Disaster'];

    useEffect(() => {
        fetchFilters();
        fetchConfig();
    }, []);

    useEffect(() => {
        fetchRiskData();
    }, [operatingUnit, selectedYear]);

    const fetchFilters = async () => {
        try {
            const [unitRes, yearRes] = await Promise.all([
                fetch('/api/spend-analysis/operating-units'),
                fetch('/api/spend-analysis/years')
            ]);
            if (unitRes.ok) {
                const unitJson = await unitRes.json();
                setUnits(['All', ...unitJson]);
            }
            if (yearRes.ok) {
                const yearJson = await yearRes.json();
                setYears(['All', ...yearJson]);
            }
        } catch (e) {
            console.error("Failed to fetch filters", e);
        }
    };

    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/spend-analysis/risk-config');
            if (res.ok) {
                const json = await res.json();
                setConfig(json);
            }
        } catch (e) {
            console.error("Failed to fetch risk config", e);
        }
    };

    const saveConfig = async (newConfig) => {
        try {
            const res = await fetch('/api/spend-analysis/risk-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig)
            });
            if (res.ok) {
                fetchRiskData(); // Refresh data with new config
                setIsSettingsOpen(false);
            }
        } catch (e) {
            console.error("Failed to save risk config", e);
        }
    };

    const fetchRiskData = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/spend-analysis/risk-analysis?operating_unit=${operatingUnit}&year=${selectedYear}`);
            if (!res.ok) throw new Error('Failed to fetch risk analysis');
            const json = await res.json();
            setRiskData(json);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse text-slate-400">
            <Activity className="animate-spin mb-4" size={48} />
            <p className="text-xl font-medium">Analyzing Sourcing Risks...</p>
        </div>
    );

    if (error) return (
        <div className="p-8 bg-red-900/20 border border-red-500/50 rounded-2xl text-red-400 flex items-center gap-4">
            <AlertCircle size={32} />
            <div>
                <h3 className="font-bold">Error Loading Risk Analysis</h3>
                <p>{error}</p>
            </div>
        </div>
    );

    const chartData = [
        { name: 'High Risk', value: riskData.summary.high_risk_count, fill: COLORS.High },
        { name: 'Medium Risk', value: riskData.summary.medium_risk_count, fill: COLORS.Medium },
        { name: 'Low Risk', value: riskData.summary.low_risk_count, fill: COLORS.Low }
    ];

    const filteredRisks = riskData.material_risks.filter(row => {
        if (selectedRiskType === 'All') return true;
        return row.risks.some(r => r.type === selectedRiskType);
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
                        <ShieldAlert className="text-amber-500" size={32} />
                        Sourcing Risk Analysis
                    </h1>
                    <p className="text-slate-400 mt-1">Sourcing intelligence and supply chain vulnerability assessment</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-slate-900/50 p-2 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2 px-3 py-1.5 border-r border-slate-800">
                        <Activity size={16} className="text-cyan-400" />
                        <select
                            className="bg-transparent text-sm font-semibold text-slate-200 outline-none"
                            value={operatingUnit}
                            onChange={(e) => setOperatingUnit(e.target.value)}
                        >
                            {units.map(unit => <option key={unit} value={unit} className="bg-slate-900">{unit}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 border-r border-slate-800">
                        <Calendar size={16} className="text-cyan-400" />
                        <select
                            className="bg-transparent text-sm font-semibold text-slate-200 outline-none cursor-pointer"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                        >
                            {years.map(year => <option key={year} value={year} className="bg-slate-900">{year}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 border-r border-slate-800">
                        <AlertTriangle size={16} className="text-amber-500" />
                        <select
                            className="bg-transparent text-sm font-semibold text-slate-200 outline-none cursor-pointer"
                            value={selectedRiskType}
                            onChange={(e) => setSelectedRiskType(e.target.value)}
                        >
                            {RISK_TYPES.map(type => <option key={type} value={type} className="bg-slate-900">{type}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
                        title="Risk Configuration"
                    >
                        <Settings size={18} />
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-violet-500/50 transition-all duration-300">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <AlertTriangle size={80} className="text-violet-500" />
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Total Risky Materials</p>
                    <h3 className="text-3xl font-bold text-white mt-2 font-mono">
                        {riskData.summary.total_risky_materials}
                    </h3>
                    <div className="flex items-center gap-2 mt-4 text-violet-400 text-xs font-bold">
                        <Activity size={14} />
                        <span>ACROSS CATEGORIES</span>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-red-500/50 transition-all duration-300">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <ShieldAlert size={80} className="text-red-500" />
                    </div>
                    <p className="text-slate-400 text-sm font-medium">High Risk Materials</p>
                    <h3 className="text-3xl font-bold text-red-500 mt-2 font-mono">
                        {riskData.summary.high_risk_count}
                    </h3>
                    <div className="flex items-center gap-2 mt-4 text-red-500 text-xs font-bold uppercase tracking-wider">
                        <TrendingDown size={14} />
                        <span>Critical Priority</span>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-amber-500/50 transition-all duration-300">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Globe size={80} className="text-amber-500" />
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Medium Risk Materials</p>
                    <h3 className="text-3xl font-bold text-amber-500 mt-2 font-mono">
                        {riskData.summary.medium_risk_count}
                    </h3>
                    <div className="flex items-center gap-2 mt-4 text-amber-500 text-xs font-bold">
                        <Globe size={14} />
                        <span>GEOPOLITICAL / CONCENTRATION</span>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-blue-500/50 transition-all duration-300">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <DollarSign size={80} className="text-blue-500" />
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Low Risk / Currency exposure</p>
                    <h3 className="text-3xl font-bold text-blue-500 mt-2 font-mono">
                        {riskData.summary.low_risk_count}
                    </h3>
                    <div className="flex items-center gap-2 mt-4 text-blue-500 text-xs font-bold">
                        <Activity size={14} />
                        <span>NON-LOCAL CURRENCY</span>
                    </div>
                </div>
            </div>

            {/* Risk Logic Reference & Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-slate-800 rounded-lg">
                            <Info size={20} className="text-cyan-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white uppercase tracking-tight">Sourcing Risk Logic Framework</h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-800">
                                    <th className="py-3 px-4 font-bold text-slate-300">Risk Type</th>
                                    <th className="py-3 px-4 font-bold text-slate-300">Level</th>
                                    <th className="py-3 px-4 font-bold text-slate-300">Description</th>
                                    <th className="py-3 px-4 font-bold text-slate-300">Identification Logic</th>
                                </tr>
                            </thead>
                            <tbody>
                                {RISK_LOGIC.map((r, idx) => (
                                    <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                        <td className="py-4 px-4 font-bold text-slate-200">{r.risk}</td>
                                        <td className="py-4 px-4 font-mono font-bold">
                                            <span className={`px-2 py-0.5 rounded text-[10px] ${r.level === 'High' ? 'bg-red-900/30 text-red-500' :
                                                r.level === 'Medium' ? 'bg-amber-900/30 text-amber-500' :
                                                    'bg-blue-900/30 text-blue-500'
                                                }`}>
                                                {r.level}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-slate-400 text-xs max-w-xs">{r.impact}</td>
                                        <td className="py-4 px-4 text-slate-500 italic text-[11px]">{r.identification}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col items-center">
                    <h3 className="text-lg font-bold text-white mb-6 uppercase">Risk Distribution</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-4 justify-center">
                        {chartData.map((d, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.fill }}></div>
                                <span className="text-xs text-slate-400 font-medium">{d.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Material Risk Table */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-3">
                            Top Risky Materials by Spend
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Identified using Transaction Intelligence</p>
                    </div>
                </div>

                <div className="overflow-x-auto -mx-6">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-800/50 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="py-4 px-6 font-bold text-slate-300">Item Code</th>
                                <th className="py-4 px-6 font-bold text-slate-300">Material Description</th>
                                <th className="py-4 px-6 font-bold text-slate-300">Primary Site</th>
                                <th className="py-4 px-6 font-bold text-slate-300 text-center">Vendors</th>
                                <th className="py-4 px-6 font-bold text-slate-300 text-right">Total Spend (INR)</th>
                                <th className="py-4 px-6 font-bold text-slate-300">Risk Indicators</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRisks.map((row, idx) => (
                                <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                    <td className="py-4 px-6">
                                        <div className="text-[10px] items-center gap-1 font-mono text-cyan-500 font-bold bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20">
                                            {row.item_code}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="font-bold text-slate-200 max-w-xs truncate" title={row.material}>
                                            {row.material}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Globe size={14} className={row.dominant_site === 'Unknown' ? 'text-slate-600' : 'text-cyan-500'} />
                                            <span className={row.dominant_site === 'Unknown' ? 'text-slate-500 italic' : ''}>
                                                {row.dominant_site}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 font-mono text-slate-400 text-center">
                                        {row.supplier_count}
                                    </td>
                                    <td className="py-4 px-6 text-right font-mono font-bold text-white">
                                        ₹{row.total_spend.toLocaleString()}
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex flex-wrap gap-2">
                                            {row.risks.map((risk, ridx) => (
                                                <span key={ridx} className={`px-2 py-0.5 rounded text-[10px] font-bold border ${risk.severity === 'High' ? 'bg-red-900/20 text-red-400 border-red-500/30' :
                                                    risk.severity === 'Medium' ? 'bg-amber-900/20 text-amber-400 border-amber-500/30' :
                                                        'bg-blue-900/20 text-blue-400 border-blue-500/30'
                                                    }`} title={risk.description}>
                                                    {risk.type}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Risk Configuration Modal */}
            {isSettingsOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                <Settings className="text-cyan-400" />
                                Risk Configuration Settings
                            </h3>
                            <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-8">
                            {/* Sensitive Countries */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                    <Globe size={16} className="text-amber-500" />
                                    Sensitive Countries
                                    <span className="text-[10px] lowercase font-normal text-slate-500 italic">(Moderate Geopolitical Risk)</span>
                                </h4>
                                <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                                    {config.sensitive_countries.map(c => (
                                        <span key={c} className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-slate-200 text-xs rounded-full border border-slate-700 group">
                                            {c}
                                            <button
                                                onClick={() => setConfig({ ...config, sensitive_countries: config.sensitive_countries.filter(sc => sc !== c) })}
                                                className="text-slate-500 hover:text-red-400"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Add sensitive country..."
                                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none"
                                        value={newSensitiveCountry}
                                        onChange={(e) => setNewSensitiveCountry(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && newSensitiveCountry) {
                                                setConfig({ ...config, sensitive_countries: [...config.sensitive_countries, newSensitiveCountry] });
                                                setNewSensitiveCountry('');
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            if (newSensitiveCountry) {
                                                setConfig({ ...config, sensitive_countries: [...config.sensitive_countries, newSensitiveCountry] });
                                                setNewSensitiveCountry('');
                                            }
                                        }}
                                        className="p-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg border border-slate-700"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* High Risk Countries */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                    <ShieldAlert size={16} className="text-red-500" />
                                    High Risk Countries
                                    <span className="text-[10px] lowercase font-normal text-slate-500 italic">(Critical Vulnerability)</span>
                                </h4>
                                <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                                    {config.high_risk_countries.map(c => (
                                        <span key={c} className="flex items-center gap-1.5 px-3 py-1 bg-red-900/10 text-red-300 text-xs rounded-full border border-red-500/20 group">
                                            {c}
                                            <button
                                                onClick={() => setConfig({ ...config, high_risk_countries: config.high_risk_countries.filter(hc => hc !== c) })}
                                                className="text-red-500/50 hover:text-red-400"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Add high risk country..."
                                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-red-500/50 outline-none"
                                        value={newHighRiskCountry}
                                        onChange={(e) => setNewHighRiskCountry(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && newHighRiskCountry) {
                                                setConfig({ ...config, high_risk_countries: [...config.high_risk_countries, newHighRiskCountry] });
                                                setNewHighRiskCountry('');
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            if (newHighRiskCountry) {
                                                setConfig({ ...config, high_risk_countries: [...config.high_risk_countries, newHighRiskCountry] });
                                                setNewHighRiskCountry('');
                                            }
                                        }}
                                        className="p-2 bg-slate-800 hover:bg-slate-700 text-red-400 rounded-lg border border-slate-700"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Concentration Threshold */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                    <Activity size={16} className="text-cyan-400" />
                                    Concentration Threshold
                                    <span className="text-[10px] lowercase font-normal text-slate-500 italic">(% of spend to trigger Country Risk)</span>
                                </h4>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="50"
                                        max="100"
                                        value={config.concentration_threshold}
                                        onChange={(e) => setConfig({ ...config, concentration_threshold: parseInt(e.target.value) })}
                                        className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                    />
                                    <div className="flex items-center gap-2 min-w-[80px]">
                                        <input
                                            type="number"
                                            min="50"
                                            max="100"
                                            value={config.concentration_threshold}
                                            onChange={(e) => setConfig({ ...config, concentration_threshold: parseInt(e.target.value) || 75 })}
                                            className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-sm text-white text-center focus:border-cyan-500 outline-none"
                                        />
                                        <span className="text-slate-400 text-sm">%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Natural Disaster Countries */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                    <AlertTriangle size={16} className="text-orange-500" />
                                    Natural Disaster Affected Countries
                                    <span className="text-[10px] lowercase font-normal text-slate-500 italic">(Currently experiencing disruptions)</span>
                                </h4>
                                <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                                    {config.natural_disaster_countries.map(c => (
                                        <span key={c} className="flex items-center gap-1.5 px-3 py-1 bg-orange-900/10 text-orange-300 text-xs rounded-full border border-orange-500/20 group">
                                            {c}
                                            <button
                                                onClick={() => setConfig({ ...config, natural_disaster_countries: config.natural_disaster_countries.filter(dc => dc !== c) })}
                                                className="text-orange-500/50 hover:text-orange-400"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Add disaster-affected country..."
                                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500/50 outline-none"
                                        value={newDisasterCountry}
                                        onChange={(e) => setNewDisasterCountry(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && newDisasterCountry) {
                                                setConfig({ ...config, natural_disaster_countries: [...config.natural_disaster_countries, newDisasterCountry] });
                                                setNewDisasterCountry('');
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            if (newDisasterCountry) {
                                                setConfig({ ...config, natural_disaster_countries: [...config.natural_disaster_countries, newDisasterCountry] });
                                                setNewDisasterCountry('');
                                            }
                                        }}
                                        className="p-2 bg-slate-800 hover:bg-slate-700 text-orange-400 rounded-lg border border-slate-700"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-800 bg-slate-950/30 flex justify-end gap-3">
                            <button
                                onClick={() => setIsSettingsOpen(false)}
                                className="px-5 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => saveConfig(config)}
                                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-cyan-900/20 transition-all"
                            >
                                <Save size={18} />
                                Save & Analyze
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default RiskDashboard;
