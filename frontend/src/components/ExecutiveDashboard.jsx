import React, { useEffect, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, ComposedChart, Area, PieChart, Pie, Cell, Treemap, AreaChart
} from 'recharts';
import {
    DollarSign, Users, ShoppingCart, FileText, FileBarChart, Receipt,
    ArrowUpRight, ArrowDownRight, Printer, IndianRupee, Calendar,
    TrendingUp, Globe, UserCheck
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

const ExecutiveDashboard = () => {
    const [data, setData] = useState(null);
    const [enrichedData, setEnrichedData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDescription, setSelectedDescription] = useState('All');
    const [uniqueDescriptions, setUniqueDescriptions] = useState([]);
    const [operatingUnit, setOperatingUnit] = useState('All');
    const [units, setUnits] = useState([]);
    const [selectedYear, setSelectedYear] = useState('All');
    const [years, setYears] = useState([]);

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

                // Fetch unique descriptions and operating units once
                if (uniqueDescriptions.length === 0) {
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
                        console.error("Failed to fetch filter options:", err);
                    }
                }

                // Fetch enriched insights as well
                try {
                    const enrichedRes = await fetch(`/api/spend-analysis/enriched-insights${queryParams}`);
                    if (enrichedRes.ok) {
                        const enrichedJson = await enrichedRes.json();
                        if (Array.isArray(enrichedJson)) {
                            setEnrichedData(enrichedJson);
                        }
                    }
                } catch (err) {
                    console.error("Failed to fetch enriched insights:", err);
                }
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
        if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
        if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
        if (val >= 1000) return `₹${(val / 1000).toFixed(1)} k`;
        return `₹${val.toFixed(0)} `;
    };

    const KPICard = ({ title, value, icon: Icon, color }) => (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center justify-between shadow-lg hover:border-cyan-500/50 transition-colors">
            <div>
                <p className="text-sm text-slate-400 uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-white">{value}</h3>
            </div>
            <div className={`p - 3 rounded - lg bg - opacity - 20 ${color} `}>
                <Icon className={`w - 6 h - 6 ${color.replace('bg-', 'text-')} `} />
            </div>
        </div>
    );

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

    const CustomTreemapContent = (props) => {
        const { root, depth, x, y, width, height, index, payload, rank, name } = props;

        return (
            <g>
                <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    style={{
                        fill: depth < 2 ? COLORS[index % COLORS.length] : 'none',
                        stroke: '#1e293b',
                        strokeWidth: 2 / (depth + 1),
                        strokeOpacity: 1 / (depth + 1),
                    }}
                />
                {width > 50 && height > 30 && (
                    <text
                        x={x + width / 2}
                        y={y + height / 2 + 4}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={11}
                        fontWeight="bold"
                        className="pointer-events-none"
                    >
                        {name}
                    </text>
                )}
            </g>
        );
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Executive Dashboard</h2>
                    <p className="text-slate-400">High-level overview with visual insights and key metrics</p>
                </div>

                <div className="flex flex-col md:flex-row items-end gap-3 w-full md:w-auto">
                    <div className="flex flex-col gap-1 w-full md:w-64">
                        <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold ml-1">Enriched Description</label>
                        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 shadow-inner">
                            <FileBarChart className="w-4 h-4 text-cyan-400" />
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
                <KPICard title="Total Spend" value={formatCurrency(kpis.spend)} icon={IndianRupee} color="bg-blue-500 text-blue-400" />
                <KPICard title="Suppliers" value={kpis.suppliers.toLocaleString()} icon={Users} color="bg-orange-500 text-orange-400" />
                <KPICard title="Buyers" value={kpis.buyers.toLocaleString()} icon={UserCheck} color="bg-indigo-500 text-indigo-400" />
                <KPICard title="PO Count" value={kpis.po_count.toLocaleString()} icon={ShoppingCart} color="bg-yellow-500 text-yellow-400" />
                <KPICard title="PR Count" value={kpis.pr_count.toLocaleString()} icon={FileText} color="bg-emerald-500 text-emerald-400" />
            </div>

            {/* Row 1: Category & Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Spend by Category (Treemap-ish bar chart for better readability in Recharts) */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg lg:col-span-1">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <FileBarChart className="w-5 h-5 text-cyan-400" /> Spend by Material (Top 8)
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={category_data} margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" name="Spend" radius={[0, 4, 4, 0]}>
                                    {category_data.map((entry, index) => (
                                        <Cell key={`cell - ${index} `} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Spend Trend */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg lg:col-span-2">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <ArrowUpRight className="w-5 h-5 text-green-400" /> Spend Trend
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trend_data} margin={{ top: 10, right: 10, left: 20, bottom: 25 }}>
                                <defs>
                                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
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
                                <Area type="monotone" dataKey="value" name="Spend" stroke="#8884d8" fillOpacity={1} fill="url(#colorSpend)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Row 2: Enriched Spend & Category Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Enriched Spend Chart */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <FileBarChart className="w-5 h-5 text-cyan-400" />
                            Spend by Enriched Category
                        </h3>
                        {enrichedData.length === 0 && (
                            <span className="text-[10px] bg-slate-700 text-slate-400 px-2 py-1 rounded">
                                No mapping available
                            </span>
                        )}
                    </div>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={enrichedData} layout="vertical" margin={{ left: 40, right: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    stroke="#94a3b8"
                                    fontSize={10}
                                    width={140}
                                    tickFormatter={(value) => value.length > 25 ? `${value.substring(0, 25)}...` : value}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" name="Total Spend" radius={[0, 4, 4, 0]}>
                                    {enrichedData.map((entry, index) => (
                                        <Cell key={`cell - ${index} `} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Legacy Category Analysis (Treemap) */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-white mb-6">Spend by Item Description (Top 10)</h3>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <Treemap
                                data={category_data}
                                dataKey="value"
                                stroke="#1e293b"
                                fill="#334155"
                                content={<CustomTreemapContent />}
                            >
                                <Tooltip content={<CustomTooltip />} />
                            </Treemap>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Row 3: Region, Supplier, Pareto */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Spend by Region */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-4">Spend by Region</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={region_data} margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={80} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" name="Spend" fill="#FFBB28" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Spend by Supplier */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-4">Spend by Supplier (Top 10)</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={supplier_data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 9 }} interval={0} angle={-30} textAnchor="end" height={60} />
                                <YAxis tickFormatter={formatCurrency} tick={{ fill: '#94a3b8', fontSize: 10 }} width={60} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" name="Spend" fill="#0088FE" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pareto Analysis */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-4">Pareto Analysis (Top 20)</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={pareto_data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="name" hide />
                                <YAxis yAxisId="left" tickFormatter={formatCurrency} tick={{ fill: '#94a3b8', fontSize: 10 }} width={60} />
                                <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v}% `} tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[0, 100]} width={40} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '10px' }} />
                                <Bar yAxisId="left" dataKey="spend" name="Spend" fill="#3b82f6" barSize={20} />
                                <Line yAxisId="right" type="monotone" dataKey="cumulativePercentage" name="Cum. %" stroke="#ff7300" dot={false} strokeWidth={2} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Row 3: Contract */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-4">Spend by Contract</h3>
                    <div className="h-[250px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={contract_data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {contract_data.map((entry, index) => (
                                        <Cell key={`cell - ${index} `} fill={index === 0 ? '#FFBB28' : '#2e3b55'} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Placeholder for future expansion */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 flex items-center justify-center text-slate-500 lg:col-span-2">
                    <p className="text-sm">Additional advanced analytics modules available upon request.</p>
                </div>
            </div>
        </div>
    );
};

export default ExecutiveDashboard;
