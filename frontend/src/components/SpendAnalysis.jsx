import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ArrowLeft, Filter, Calendar } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show label for small slices

    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

const CustomTooltip = ({ active, payload, unit }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg shadow-xl">
                <p className="text-white font-semibold">{payload[0].name}</p>
                <p className="text-cyan-400">
                    {unit === '$' ? '$' : ''}{payload[0].value.toLocaleString()}{unit !== '$' ? ' kg' : ''}
                </p>
            </div>
        );
    }
    return null;
};

const SpendAnalysis = () => {
    const { material } = useParams(); // e.g. /spend-analysis/Glycerine
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [year, setYear] = useState('2024');

    useEffect(() => {
        if (!material) return;
        fetchData();
    }, [material, year]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // In a real app, we might pass year as a query param
            const res = await fetch(`/api/spend-analysis/${encodeURIComponent(material)}`);
            if (!res.ok) throw new Error("Failed to fetch data");
            const json = await res.json();
            setData(json);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-cyan-400">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-400 text-xl">Error: {error}</p>
                <Link to="/" className="text-cyan-400 hover:underline mt-4 inline-block">Return Home</Link>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-2 transition-colors">
                        <ArrowLeft size={16} /> Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-white">
                        Spend Analytics for: <span className="text-cyan-400">{data.material || material}</span>
                    </h1>
                </div>

                <div className="flex gap-4">
                    {/* Mock Filters */}
                    <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
                        <Calendar size={16} className="text-slate-400" />
                        <select
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            className="bg-transparent text-white outline-none text-sm"
                        >
                            <option value="2024">2024</option>
                            <option value="2023">2023</option>
                            <option value="All">All Time</option>
                        </select>
                    </div>
                    <div className="bg-slate-800 p-2 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-700 transition-colors">
                        <Filter size={20} className="text-slate-400" />
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Quantity Chart */}
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 shadow-xl">
                    <h2 className="text-lg font-semibold text-white mb-6 text-center">
                        Total Quantity of Imports by Region
                    </h2>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.quantity_data}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={renderCustomizedLabel}
                                    outerRadius={150}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {data.quantity_data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip unit="kg" />} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-center mt-4">
                        <p className="text-sm text-slate-400">Total Quantity</p>
                        <p className="text-2xl font-bold text-white">{data.total_quantity.toLocaleString()} kg</p>
                    </div>
                </div>

                {/* Value Chart */}
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 shadow-xl">
                    <h2 className="text-lg font-semibold text-white mb-6 text-center">
                        Total Value of Imports by Region
                    </h2>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.value_data}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={renderCustomizedLabel}
                                    outerRadius={150}
                                    fill="#82ca9d"
                                    dataKey="value"
                                >
                                    {data.value_data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip unit="$" />} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-center mt-4">
                        <p className="text-sm text-slate-400">Total Spend</p>
                        <p className="text-2xl font-bold text-white">${data.total_value.toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SpendAnalysis;
