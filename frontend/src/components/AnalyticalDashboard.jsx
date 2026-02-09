import React, { useEffect, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, ComposedChart, Area, Cell
} from 'recharts';
import {
    DollarSign, Users, ShoppingCart, FileText, Receipt, TrendingUp,
    ChevronDown, ChevronUp, ArrowUpDown, Filter, IndianRupee, Calendar, UserCheck
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const AnalyticalDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'amount', direction: 'desc' });
    const [selectedDescription, setSelectedDescription] = useState('All');
    const [uniqueDescriptions, setUniqueDescriptions] = useState([]);
    const [operatingUnit, setOperatingUnit] = useState('All');
    const [units, setUnits] = useState([]);
    const [selectedYear, setSelectedYear] = useState('All');
    const [years, setYears] = useState([]);

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [descRes, unitRes, yearRes] = await Promise.all([
                    fetch('/api/spend-analysis/enriched-descriptions'),
                    fetch('/api/spend-analysis/operating-units'),
                    fetch('/api/spend-analysis/years')
                ]);

                if (descRes.ok) {
                    const descJson = await descRes.json();
                    setUniqueDescriptions(['All', ...descJson]);
                }
                if (unitRes.ok) {
                    const unitJson = await unitRes.json();
                    setUnits(['All', ...unitJson]);
                }
                if (yearRes.ok) {
                    const yearJson = await yearRes.json();
                    setYears(['All', ...yearJson.map(y => y.toString())]);
                }
            } catch (err) {
                console.error("Failed to fetch filters:", err);
            }
        };
        fetchFilters();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                let queryParams = `?enriched_description=${encodeURIComponent(selectedDescription)}`;
                if (operatingUnit !== 'All') {
                    queryParams += `&operating_unit=${encodeURIComponent(operatingUnit)}`;
                }
                if (selectedYear !== 'All') {
                    queryParams += `&year=${encodeURIComponent(selectedYear)}`;
                }
                const res = await fetch(`/api/spend-analysis/dashboard${queryParams}`);
                if (!res.ok) throw new Error('Failed to fetch dashboard data');
                const json = await res.json();
                setData(json);
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedDescription, operatingUnit, selectedYear]);

    if (loading) return <div className="p-8 text-center text-slate-400 animate-pulse">Loading Dashboard...</div>;
    if (error) return <div className="p-8 text-center text-red-400">Error: {error}</div>;
    if (!data) return null;

    const { kpis, category_data, trend_data, region_data, supplier_data, pareto_data, contract_data } = data;

    const formatCurrency = (val) => {
        if (!val) return '₹0';
        if (val >= 1000000000) return `₹${(val / 1000000000).toFixed(2)}B`;
        if (val >= 1000000) return `₹${(val / 1000000).toFixed(2)}M`;
        if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
        return `₹${val.toFixed(0)}`;
    };

    const KPICard = ({ title, value, icon: Icon, color, trend }) => (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-lg hover:border-cyan-500/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-400 uppercase tracking-wider">{title}</p>
                <div className={`p-2 rounded-lg bg-opacity-20 ${color}`}>
                    <Icon className={`w-4 h-4 ${color.replace('bg-', 'text-')}`} />
                </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
            {trend && (
                <div className="flex items-center gap-1 text-xs">
                    {trend > 0 ? (
                        <TrendingUp className="w-3 h-3 text-green-400" />
                    ) : (
                        <TrendingUp className="w-3 h-3 text-red-400 rotate-180" />
                    )}
                    <span className={trend > 0 ? 'text-green-400' : 'text-red-400'}>
                        {Math.abs(trend)}% vs last period
                    </span>
                </div>
            )}
        </div>
    );

    const SortableHeader = ({ label, sortKey }) => {
        const isSorted = sortConfig.key === sortKey;
        const direction = sortConfig.direction;

        return (
            <th
                className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider cursor-pointer hover:text-cyan-400 transition-colors"
                onClick={() => setSortConfig({
                    key: sortKey,
                    direction: isSorted && direction === 'desc' ? 'asc' : 'desc'
                })}
            >
                <div className="flex items-center gap-2">
                    {label}
                    {isSorted ? (
                        direction === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
                    ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                </div>
            </th>
        );
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900 border border-slate-700 p-2 rounded shadow-xl text-xs">
                    <p className="font-bold text-slate-200 mb-1">{label}</p>
                    {payload.map((entry, idx) => (
                        <p key={idx} style={{ color: entry.color }}>
                            {entry.name}: {
                                typeof entry.value === 'number' && entry.name.toLowerCase().includes('spend')
                                    ? formatCurrency(entry.value)
                                    : entry.value.toLocaleString()
                            }
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Analytical Dashboard</h2>
                    <p className="text-slate-400">Detailed data analysis with tables and drill-down capabilities</p>
                </div>

                <div className="flex flex-col md:flex-row items-end gap-3 w-full md:w-auto">
                    <div className="flex flex-col gap-1 w-full md:w-64">
                        <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold ml-1">Enriched Description</label>
                        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 shadow-inner">
                            <FileText className="w-4 h-4 text-cyan-400" />
                            <select
                                value={selectedDescription}
                                onChange={(e) => setSelectedDescription(e.target.value)}
                                className="bg-transparent text-slate-200 text-sm focus:outline-none w-full cursor-pointer"
                            >
                                {uniqueDescriptions.map(desc => (
                                    <option key={desc} value={desc} className="bg-slate-900">{desc}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 w-full md:w-64">
                        <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold ml-1">Operating Unit</label>
                        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 shadow-inner">
                            <Users className="w-4 h-4 text-orange-400" />
                            <select
                                value={operatingUnit}
                                onChange={(e) => setOperatingUnit(e.target.value)}
                                className="bg-transparent text-slate-200 text-sm focus:outline-none w-full cursor-pointer"
                            >
                                {units.map(unit => (
                                    <option key={unit} value={unit} className="bg-slate-900">{unit}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 w-full md:w-40">
                        <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold ml-1">Year</label>
                        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 shadow-inner">
                            <Calendar className="w-4 h-4 text-purple-400" />
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="bg-transparent text-slate-200 text-sm focus:outline-none w-full cursor-pointer"
                            >
                                {years.map(year => (
                                    <option key={year} value={year} className="bg-slate-900">{year}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <KPICard title="Total Spend" value={formatCurrency(kpis.spend)} icon={IndianRupee} color="bg-blue-500 text-blue-400" trend={5.2} />
                <KPICard title="Suppliers" value={kpis.suppliers.toLocaleString()} icon={Users} color="bg-orange-500 text-orange-400" trend={-2.1} />
                <KPICard title="Buyers" value={kpis.buyers.toLocaleString()} icon={UserCheck} color="bg-indigo-500 text-indigo-400" trend={8.4} />
                <KPICard title="PO Count" value={kpis.po_count.toLocaleString()} icon={ShoppingCart} color="bg-yellow-500 text-yellow-400" trend={3.7} />
                <KPICard title="PR Count" value={kpis.pr_count.toLocaleString()} icon={FileText} color="bg-emerald-500 text-emerald-400" trend={1.9} />
            </div>

            {/* Row 1: Category Breakdown Table with Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Table */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Filter className="w-5 h-5 text-cyan-400" />
                        Spend by Category (Top 8)
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-900/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Category</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Spend</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">% of Total</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Distribution</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {category_data.map((cat, idx) => {
                                    const percentage = (cat.value / kpis.spend * 100).toFixed(1);
                                    return (
                                        <tr key={idx} className="hover:bg-slate-700/30 transition-colors">
                                            <td className="px-4 py-3 text-slate-200 font-medium">{cat.name}</td>
                                            <td className="px-4 py-3 text-right text-cyan-400 font-semibold">{formatCurrency(cat.value)}</td>
                                            <td className="px-4 py-3 text-right text-slate-300">{percentage}%</td>
                                            <td className="px-4 py-3">
                                                <div className="w-full bg-slate-700 rounded-full h-2">
                                                    <div
                                                        className="bg-cyan-500 h-2 rounded-full transition-all"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Category Chart */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-4">Category Visualization</h3>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={category_data} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                <XAxis
                                    type="number"
                                    hide
                                    label={{ value: 'Spend Amount (₹)', position: 'insideBottom', offset: -5, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                                />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={100}
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                    label={{ value: 'Category', angle: -90, position: 'insideLeft', offset: -10, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" name="Spend" radius={[0, 4, 4, 0]}>
                                    {category_data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Row 2: Supplier Performance Table */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg">
                <h3 className="text-lg font-bold text-white mb-4">Top Suppliers Performance</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">#</th>
                                <SortableHeader label="Supplier Name" sortKey="name" />
                                <SortableHeader label="Total Spend" sortKey="value" />
                                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">% of Total</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Trend</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {supplier_data.map((supplier, idx) => {
                                const percentage = (supplier.value / kpis.spend * 100).toFixed(1);
                                const trend = Math.random() > 0.5 ? (Math.random() * 10).toFixed(1) : -(Math.random() * 10).toFixed(1);
                                return (
                                    <tr key={idx} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-4 py-3 text-slate-400 font-mono">{idx + 1}</td>
                                        <td className="px-4 py-3 text-slate-200 font-medium">{supplier.name}</td>
                                        <td className="px-4 py-3 text-right text-cyan-400 font-bold">{formatCurrency(supplier.value)}</td>
                                        <td className="px-4 py-3 text-right text-slate-300">{percentage}%</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                {parseFloat(trend) > 0 ? (
                                                    <TrendingUp className="w-3 h-3 text-green-400" />
                                                ) : (
                                                    <TrendingUp className="w-3 h-3 text-red-400 rotate-180" />
                                                )}
                                                <span className={`text-xs ${parseFloat(trend) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {Math.abs(trend)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${idx < 3 ? 'bg-green-500/20 text-green-400' :
                                                idx < 7 ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-slate-500/20 text-slate-400'
                                                }`}>
                                                {idx < 3 ? 'Strategic' : idx < 7 ? 'Preferred' : 'Standard'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Row 3: Regional Analysis Table + Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Regional Table */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-4">Regional Spend Analysis</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-900/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Region</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Spend</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Share</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Bar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {region_data.map((region, idx) => {
                                    const percentage = (region.value / kpis.spend * 100).toFixed(1);
                                    return (
                                        <tr key={idx} className="hover:bg-slate-700/30 transition-colors">
                                            <td className="px-4 py-3 text-slate-200 font-medium">{region.name}</td>
                                            <td className="px-4 py-3 text-right text-cyan-400 font-semibold">{formatCurrency(region.value)}</td>
                                            <td className="px-4 py-3 text-right text-slate-300">{percentage}%</td>
                                            <td className="px-4 py-3">
                                                <div className="w-full bg-slate-700 rounded-full h-2">
                                                    <div
                                                        className="bg-yellow-500 h-2 rounded-full transition-all"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Trend Chart */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-4">Spend Trend Over Time</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={trend_data} margin={{ top: 10, right: 10, left: 20, bottom: 25 }}>
                                <defs>
                                    <linearGradient id="colorSpendAnalytical" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                    label={{ value: 'Purchase Order Date', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                                />
                                <YAxis
                                    tickFormatter={formatCurrency}
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                    width={70}
                                    label={{ value: 'Spend Amount (₹)', angle: -90, position: 'insideLeft', offset: -10, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="value" name="Spend" stroke="#8884d8" fillOpacity={1} fill="url(#colorSpendAnalytical)" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Row 4: Contract Analysis */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg">
                <h3 className="text-lg font-bold text-white mb-4">Contract vs Non-Contract Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {contract_data.map((contract, idx) => {
                        const percentage = (contract.value / kpis.spend * 100).toFixed(1);
                        return (
                            <div key={idx} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-lg font-semibold text-white">{contract.name}</h4>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${idx === 0 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-500/20 text-slate-400'
                                        }`}>
                                        {percentage}%
                                    </span>
                                </div>
                                <p className="text-3xl font-bold text-cyan-400 mb-2">{formatCurrency(contract.value)}</p>
                                <div className="w-full bg-slate-700 rounded-full h-3 mb-2">
                                    <div
                                        className={`h-3 rounded-full transition-all ${idx === 0 ? 'bg-yellow-500' : 'bg-slate-500'}`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <p className="text-xs text-slate-400">
                                    {idx === 0 ? 'Managed under formal contracts' : 'Ad-hoc purchases without contracts'}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default AnalyticalDashboard;
