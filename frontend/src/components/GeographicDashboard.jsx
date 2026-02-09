import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line
} from 'recharts';
import {
    DollarSign, Users, ShoppingCart, FileText, Globe, MapPin, Navigation,
    IndianRupee, Calendar, UserCheck, TrendingUp, Flag
} from 'lucide-react';

// Component to fit map bounds to markers
const FitBounds = ({ suppliers }) => {
    const map = useMap();

    useEffect(() => {
        if (suppliers && suppliers.length > 0) {
            const bounds = suppliers.map(s => [s.latitude, s.longitude]);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [suppliers, map]);

    return null;
};

const GeographicDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedRegion, setSelectedRegion] = useState(null);
    const [mapData, setMapData] = useState(null);
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
                const [dashboardRes, mapRes] = await Promise.all([
                    fetch(`/api/spend-analysis/dashboard${queryParams}`),
                    fetch(`/api/spend-analysis/suppliers-map${queryParams}`)
                ]);

                if (!dashboardRes.ok || !mapRes.ok) throw new Error('Failed to fetch data');

                const dashboardJson = await dashboardRes.json();
                const mapJson = await mapRes.json();

                setData(dashboardJson);
                setMapData(mapJson);
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
    if (!data || !mapData) return null;

    const { kpis, region_data, trend_data } = data;
    const { suppliers, summary } = mapData;

    const formatCurrency = (val) => {
        if (!val) return '₹0';
        if (val >= 1000000000) return `₹${(val / 1000000000).toFixed(2)}B`;
        if (val >= 1000000) return `₹${(val / 1000000).toFixed(2)}M`;
        if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
        return `₹${val.toFixed(0)}`;
    };

    const getMarkerColor = (category) => {
        const colors = {
            'very_high': '#ef4444',
            'high': '#f97316',
            'medium': '#eab308',
            'low': '#22c55e'
        };
        return colors[category] || '#64748b';
    };

    const getMarkerRadius = (category) => {
        const sizes = {
            'very_high': 15,
            'high': 12,
            'medium': 9,
            'low': 6
        };
        return sizes[category] || 6;
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Geographic Dashboard</h2>
                    <p className="text-slate-400">Location-based insights and supplier distribution analysis</p>
                </div>

                <div className="flex flex-col md:flex-row items-end gap-3 w-full md:w-auto">
                    <div className="flex flex-col gap-1 w-full md:w-64">
                        <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold ml-1">Enriched Description</label>
                        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 shadow-inner">
                            <Globe className="w-4 h-4 text-cyan-400" />
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
                            <Navigation className="w-4 h-4 text-orange-400" />
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
                <KPICard title="Total Spend" value={formatCurrency(summary?.total_spend || 0)} icon={IndianRupee} color="bg-blue-500 text-blue-400" />
                <KPICard title="Suppliers" value={(summary?.total_suppliers || 0).toLocaleString()} icon={Users} color="bg-orange-500 text-orange-400" />
                <KPICard title="Buyers" value={(kpis?.buyers || 0).toLocaleString()} icon={UserCheck} color="bg-indigo-500 text-indigo-400" />
                <KPICard title="PO Count" value={(kpis?.po_count || kpis?.total_pos || 0).toLocaleString()} icon={ShoppingCart} color="bg-yellow-500 text-yellow-400" />
                <KPICard title="PR Count" value={(kpis?.pr_count || 0).toLocaleString()} icon={FileText} color="bg-emerald-500 text-emerald-400" />
            </div>

            {/* Row 1: Large Map + Supplier List */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Map Container */}
                <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-cyan-400" />
                        Global Supplier Distribution
                    </h3>

                    <div className="relative w-full h-[500px] bg-slate-900 rounded-lg overflow-hidden">
                        <MapContainer
                            center={[20, 0]}
                            zoom={2}
                            style={{ height: '100%', width: '100%' }}
                            className="z-0"
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            <FitBounds suppliers={suppliers} />

                            {suppliers.map((supplier, idx) => (
                                <CircleMarker
                                    key={idx}
                                    center={[supplier.latitude, supplier.longitude]}
                                    radius={getMarkerRadius(supplier.spend_category)}
                                    fillColor={getMarkerColor(supplier.spend_category)}
                                    color="#fff"
                                    weight={2}
                                    opacity={1}
                                    fillOpacity={0.8}
                                    eventHandlers={{
                                        click: () => setSelectedRegion(supplier)
                                    }}
                                >
                                    <Popup>
                                        <div className="text-xs">
                                            <p className="font-bold text-sm mb-1">{supplier.vendor_name}</p>
                                            <div className="space-y-0.5">
                                                <p className="text-slate-600 font-medium">Site: {supplier.supplier_site}</p>
                                                <p className="text-slate-500">OU: {supplier.operating_unit}</p>
                                                <p className="text-blue-600 font-bold mt-1">
                                                    {formatCurrency(supplier.total_spend)}
                                                </p>
                                                <p className="text-slate-500 text-[10px]">
                                                    {supplier.transaction_count} transactions
                                                </p>
                                            </div>
                                        </div>
                                    </Popup>
                                </CircleMarker>
                            ))}
                        </MapContainer>

                        {/* Legend */}
                        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm border border-slate-300 rounded-lg p-3 z-[1000]">
                            <p className="text-xs font-semibold text-slate-700 mb-2">Spend Level</p>
                            <div className="space-y-1">
                                {[
                                    { label: 'Very High (>₹10M)', category: 'very_high' },
                                    { label: 'High (₹1M-10M)', category: 'high' },
                                    { label: 'Medium (₹100K-1M)', category: 'medium' },
                                    { label: 'Low (<₹100K)', category: 'low' }
                                ].map(({ label, category }) => (
                                    <div key={category} className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full border-2 border-white"
                                            style={{ backgroundColor: getMarkerColor(category) }}
                                        />
                                        <span className="text-xs text-slate-600">{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Supplier Details Panel */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-4">
                        {selectedRegion ? 'Supplier Details' : 'Top Suppliers by Location'}
                    </h3>

                    {selectedRegion ? (
                        <div className="space-y-4">
                            <button
                                onClick={() => setSelectedRegion(null)}
                                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                            >
                                ← Back to list
                            </button>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Vendor Name</p>
                                    <p className="text-sm font-semibold text-white">{selectedRegion.vendor_name}</p>
                                </div>

                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Site & Unit</p>
                                    <p className="text-sm text-slate-300">Site: {selectedRegion.supplier_site}</p>
                                    <p className="text-xs text-slate-500 mt-1">Unit: {selectedRegion.operating_unit}</p>
                                </div>

                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Spend</p>
                                    <p className="text-xl font-bold text-cyan-400">
                                        {formatCurrency(selectedRegion.total_spend)}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Transactions</p>
                                    <p className="text-sm text-slate-300">
                                        {selectedRegion.transaction_count.toLocaleString()} orders
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Coordinates</p>
                                    <p className="text-xs text-slate-400 font-mono">
                                        {selectedRegion.latitude.toFixed(4)}°, {selectedRegion.longitude.toFixed(4)}°
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                            {suppliers.slice(0, 15).map((supplier, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedRegion(supplier)}
                                    className="p-3 bg-slate-900/50 hover:bg-slate-700/50 rounded-lg cursor-pointer transition-colors border border-slate-700/50"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-white truncate flex items-center gap-2">
                                                <MapPin className="w-3 h-3 text-cyan-400" />
                                                {supplier.vendor_name}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                Site: {supplier.supplier_site} | Unit: {supplier.operating_unit}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-cyan-400">
                                                {formatCurrency(supplier.total_spend)}
                                            </p>
                                            <div
                                                className="w-2 h-2 rounded-full mt-1 ml-auto"
                                                style={{ backgroundColor: getMarkerColor(supplier.spend_category) }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Row 2: Regional Breakdown Table + Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Regional Table */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Flag className="w-5 h-5 text-yellow-400" />
                        Regional Spend Breakdown
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-900/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Region</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Spend</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">% Share</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {region_data.map((region, idx) => {
                                    const percentage = (region.value / kpis.spend * 100).toFixed(1);
                                    return (
                                        <tr key={idx} className="hover:bg-slate-700/30 transition-colors">
                                            <td className="px-4 py-3 text-slate-200 font-medium flex items-center gap-2">
                                                <Globe className="w-4 h-4 text-cyan-400" />
                                                {region.name}
                                            </td>
                                            <td className="px-4 py-3 text-right text-cyan-400 font-bold">
                                                {formatCurrency(region.value)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-300">{percentage}%</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${parseFloat(percentage) > 20 ? 'bg-green-500/20 text-green-400' :
                                                    parseFloat(percentage) > 10 ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-slate-500/20 text-slate-400'
                                                    }`}>
                                                    {parseFloat(percentage) > 20 ? 'Major' : parseFloat(percentage) > 10 ? 'Moderate' : 'Minor'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Regional Trend */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                        Geographic Spend Trend
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trend_data} margin={{ top: 10, right: 10, left: 20, bottom: 25 }}>
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
                                <Line type="monotone" dataKey="value" name="Total Spend" stroke="#8884d8" strokeWidth={3} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Row 3: Country Distribution */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg">
                <h3 className="text-lg font-bold text-white mb-4">Top Regions by Spend</h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={region_data} layout="horizontal" margin={{ top: 10, right: 10, left: 20, bottom: 25 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis
                                dataKey="name"
                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                                label={{ value: 'Region', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                            />
                            <YAxis
                                tickFormatter={formatCurrency}
                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                                width={70}
                                label={{ value: 'Spend Amount (₹)', angle: -90, position: 'insideLeft', offset: -10, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" name="Spend" fill="#FFBB28" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default GeographicDashboard;
