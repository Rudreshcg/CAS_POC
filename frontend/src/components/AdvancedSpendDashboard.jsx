import React, { useEffect, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, ComposedChart, Area, PieChart, Pie, Cell, Treemap, AreaChart
} from 'recharts';
import {
    DollarSign, Users, ShoppingCart, FileText, FileBarChart, Receipt,
    ArrowUpRight, ArrowDownRight, Printer
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

const AdvancedSpendDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/spend-analysis/dashboard');
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
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-400 animate-pulse">Loading Dashboard...</div>;
    if (error) return <div className="p-8 text-center text-red-400">Error: {error}</div>;
    if (!data) return null;

    const { kpis, category_data, trend_data, region_data, supplier_data, pareto_data, contract_data } = data;

    const formatCurrency = (val) => {
        if (val >= 1000000000) return `$${(val / 1000000000).toFixed(2)}bn`;
        if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
        if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
        return `$${val.toFixed(0)}`;
    };

    const KPICard = ({ title, value, icon: Icon, color }) => (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center justify-between shadow-lg hover:border-cyan-500/50 transition-colors">
            <div>
                <p className="text-sm text-slate-400 uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-white">{value}</h3>
            </div>
            <div className={`p-3 rounded-lg bg-opacity-20 ${color}`}>
                <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
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

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Procurement Spend Analytics</h2>
                    <p className="text-slate-400">Comprehensive overview of procurement activities, expenditures, and supplier performance.</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-slate-500">Data Source: Purchase History</p>
                    <p className="text-xs text-cyan-500 font-mono mt-1">LIVE DATA</p>
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <KPICard title="Total Spend" value={formatCurrency(kpis.spend)} icon={DollarSign} color="bg-blue-500 text-blue-400" />
                <KPICard title="Suppliers" value={kpis.suppliers.toLocaleString()} icon={Users} color="bg-orange-500 text-orange-400" />
                <KPICard title="Transactions" value={kpis.transactions.toLocaleString()} icon={ArrowUpRight} color="bg-indigo-500 text-indigo-400" />
                <KPICard title="PO Count" value={kpis.po_count.toLocaleString()} icon={ShoppingCart} color="bg-yellow-500 text-yellow-400" />
                <KPICard title="PR Count" value={kpis.pr_count.toLocaleString()} icon={FileText} color="bg-emerald-500 text-emerald-400" />
                <KPICard title="Invoices" value={kpis.invoice_count.toLocaleString()} icon={Receipt} color="bg-pink-500 text-pink-400" />
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
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                            <AreaChart data={trend_data}>
                                <defs>
                                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <YAxis tickFormatter={formatCurrency} tick={{ fill: '#94a3b8', fontSize: 10 }} width={60} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="value" name="Spend" stroke="#8884d8" fillOpacity={1} fill="url(#colorSpend)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Row 2: Region, Supplier, Pareto */}
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
                                <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v}%`} tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[0, 100]} width={40} />
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
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#FFBB28' : '#2e3b55'} />
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

export default AdvancedSpendDashboard;
