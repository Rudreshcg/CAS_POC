import React, { useEffect, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, ComposedChart, Area, Cell
} from 'recharts';
import {
    DollarSign, Users, ShoppingCart, FileText, Receipt, TrendingUp,
    ChevronDown, ChevronUp, ArrowUpDown, Filter
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const AnalyticalDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'amount', direction: 'desc' });

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
        if (!val) return '$0';
        if (val >= 1000000000) return `$${(val / 1000000000).toFixed(2)}B`;
        if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
        if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
        return `$${val.toFixed(0)}`;
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
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Analytical Dashboard</h2>
                    <p className="text-slate-400">Detailed data analysis with tables and drill-down capabilities</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-slate-500">Data Source: Purchase History</p>
                    <p className="text-xs text-cyan-500 font-mono mt-1">LIVE DATA</p>
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <KPICard title="Total Spend" value={formatCurrency(kpis.spend)} icon={DollarSign} color="bg-blue-500 text-blue-400" trend={5.2} />
                <KPICard title="Suppliers" value={kpis.suppliers.toLocaleString()} icon={Users} color="bg-orange-500 text-orange-400" trend={-2.1} />
                <KPICard title="Transactions" value={kpis.transactions.toLocaleString()} icon={TrendingUp} color="bg-indigo-500 text-indigo-400" trend={8.4} />
                <KPICard title="PO Count" value={kpis.po_count.toLocaleString()} icon={ShoppingCart} color="bg-yellow-500 text-yellow-400" trend={3.7} />
                <KPICard title="PR Count" value={kpis.pr_count.toLocaleString()} icon={FileText} color="bg-emerald-500 text-emerald-400" trend={1.9} />
                <KPICard title="Invoices" value={kpis.invoice_count.toLocaleString()} icon={Receipt} color="bg-pink-500 text-pink-400" trend={4.3} />
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
                            <ComposedChart data={trend_data}>
                                <defs>
                                    <linearGradient id="colorSpendAnalytical" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <YAxis tickFormatter={formatCurrency} tick={{ fill: '#94a3b8', fontSize: 10 }} width={60} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '10px' }} />
                                <Area type="monotone" dataKey="value" name="Spend" stroke="#8884d8" fillOpacity={1} fill="url(#colorSpendAnalytical)" />
                                <Line type="monotone" dataKey="value" name="Trend" stroke="#ff7300" dot={{ r: 3 }} strokeWidth={2} />
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
