import React, { useEffect, useState } from 'react';
import { MapPin, TrendingUp, Users, DollarSign } from 'lucide-react';

const SpendMapView = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSupplier, setSelectedSupplier] = useState(null);

    useEffect(() => {
        fetchMapData();
    }, []);

    const fetchMapData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/spend-analysis/suppliers-map');
            if (!res.ok) throw new Error('Failed to fetch map data');
            const json = await res.json();
            setData(json);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) => {
        if (!val) return '₹0';
        if (val >= 1000000000) return `₹${(val / 1000000000).toFixed(2)}B`;
        if (val >= 1000000) return `₹${(val / 1000000).toFixed(2)}M`;
        if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
        return `₹${val.toFixed(0)}`;
    };

    const getMarkerColor = (category) => {
        const colors = {
            'very_high': '#ef4444', // red
            'high': '#f97316',      // orange
            'medium': '#eab308',    // yellow
            'low': '#22c55e'        // green
        };
        return colors[category] || '#64748b';
    };

    const getMarkerSize = (category) => {
        const sizes = {
            'very_high': 24,
            'high': 20,
            'medium': 16,
            'low': 12
        };
        return sizes[category] || 12;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-400">
                Error loading map data: {error}
            </div>
        );
    }

    if (!data) return null;

    const { suppliers, summary } = data;

    // Group suppliers by location for better visualization
    const locationGroups = suppliers.reduce((acc, supplier) => {
        const key = `${supplier.latitude.toFixed(1)},${supplier.longitude.toFixed(1)}`;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(supplier);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-400 uppercase tracking-wider mb-1">Total Spend</p>
                            <h3 className="text-2xl font-bold text-white">{formatCurrency(summary.total_spend)}</h3>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-500/20">
                            <DollarSign className="w-6 h-6 text-blue-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-400 uppercase tracking-wider mb-1">Total Suppliers</p>
                            <h3 className="text-2xl font-bold text-white">{summary.total_suppliers.toLocaleString()}</h3>
                        </div>
                        <div className="p-3 rounded-lg bg-orange-500/20">
                            <Users className="w-6 h-6 text-orange-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-400 uppercase tracking-wider mb-1">Mapped Locations</p>
                            <h3 className="text-2xl font-bold text-white">{summary.mapped_suppliers}</h3>
                        </div>
                        <div className="p-3 rounded-lg bg-green-500/20">
                            <MapPin className="w-6 h-6 text-green-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Map Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Map Container */}
                <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-cyan-400" />
                        Supplier Geographic Distribution
                    </h3>

                    {/* Simple SVG-based World Map Visualization */}
                    <div className="relative w-full h-[500px] bg-slate-900 rounded-lg overflow-hidden">
                        {/* World Map Background (Simplified) */}
                        <svg viewBox="0 0 1000 500" className="w-full h-full">
                            {/* Background */}
                            <rect width="1000" height="500" fill="#0f172a" />

                            {/* Grid lines */}
                            {[...Array(10)].map((_, i) => (
                                <line
                                    key={`h-${i}`}
                                    x1="0"
                                    y1={i * 50}
                                    x2="1000"
                                    y2={i * 50}
                                    stroke="#1e293b"
                                    strokeWidth="1"
                                />
                            ))}
                            {[...Array(20)].map((_, i) => (
                                <line
                                    key={`v-${i}`}
                                    x1={i * 50}
                                    y1="0"
                                    x2={i * 50}
                                    y2="500"
                                    stroke="#1e293b"
                                    strokeWidth="1"
                                />
                            ))}

                            {/* Supplier Markers */}
                            {suppliers.map((supplier, idx) => {
                                // Convert lat/lng to SVG coordinates
                                // Longitude: -180 to 180 -> 0 to 1000
                                // Latitude: 90 to -90 -> 0 to 500
                                const x = ((supplier.longitude + 180) / 360) * 1000;
                                const y = ((90 - supplier.latitude) / 180) * 500;
                                const size = getMarkerSize(supplier.spend_category);
                                const color = getMarkerColor(supplier.spend_category);

                                return (
                                    <g
                                        key={idx}
                                        className="cursor-pointer transition-transform hover:scale-125"
                                        onClick={() => setSelectedSupplier(supplier)}
                                    >
                                        {/* Glow effect */}
                                        <circle
                                            cx={x}
                                            cy={y}
                                            r={size + 4}
                                            fill={color}
                                            opacity="0.3"
                                        />
                                        {/* Main marker */}
                                        <circle
                                            cx={x}
                                            cy={y}
                                            r={size}
                                            fill={color}
                                            stroke="#fff"
                                            strokeWidth="2"
                                            opacity="0.9"
                                        />
                                        {/* Pulse animation for high spend */}
                                        {supplier.spend_category === 'very_high' && (
                                            <circle
                                                cx={x}
                                                cy={y}
                                                r={size}
                                                fill="none"
                                                stroke={color}
                                                strokeWidth="2"
                                                opacity="0.6"
                                            >
                                                <animate
                                                    attributeName="r"
                                                    from={size}
                                                    to={size + 10}
                                                    dur="2s"
                                                    repeatCount="indefinite"
                                                />
                                                <animate
                                                    attributeName="opacity"
                                                    from="0.6"
                                                    to="0"
                                                    dur="2s"
                                                    repeatCount="indefinite"
                                                />
                                            </circle>
                                        )}
                                    </g>
                                );
                            })}
                        </svg>

                        {/* Legend */}
                        <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg p-3">
                            <p className="text-xs font-semibold text-slate-300 mb-2">Spend Level</p>
                            <div className="space-y-1">
                                {[
                                    { label: 'Very High (>₹10M)', category: 'very_high' },
                                    { label: 'High (₹1M-10M)', category: 'high' },
                                    { label: 'Medium (₹100K-1M)', category: 'medium' },
                                    { label: 'Low (<₹100K)', category: 'low' }
                                ].map(({ label, category }) => (
                                    <div key={category} className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: getMarkerColor(category) }}
                                        />
                                        <span className="text-xs text-slate-400">{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Supplier Details Panel */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-4">
                        {selectedSupplier ? 'Supplier Details' : 'Top Suppliers'}
                    </h3>

                    {selectedSupplier ? (
                        <div className="space-y-4">
                            <button
                                onClick={() => setSelectedSupplier(null)}
                                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                            >
                                ← Back to list
                            </button>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Vendor Name</p>
                                    <p className="text-sm font-semibold text-white">{selectedSupplier.vendor_name}</p>
                                </div>

                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Location</p>
                                    <p className="text-sm text-slate-300">{selectedSupplier.location_name}</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {selectedSupplier.operating_unit}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Spend</p>
                                    <p className="text-xl font-bold text-cyan-400">
                                        {formatCurrency(selectedSupplier.total_spend)}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Transactions</p>
                                    <p className="text-sm text-slate-300">
                                        {selectedSupplier.transaction_count.toLocaleString()} orders
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Spend Category</p>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: getMarkerColor(selectedSupplier.spend_category) }}
                                        />
                                        <span className="text-sm text-slate-300 capitalize">
                                            {selectedSupplier.spend_category.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                            {suppliers.slice(0, 20).map((supplier, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedSupplier(supplier)}
                                    className="p-3 bg-slate-900/50 hover:bg-slate-700/50 rounded-lg cursor-pointer transition-colors border border-slate-700/50"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-white truncate">
                                                {supplier.vendor_name}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {supplier.location_name}
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
        </div>
    );
};

export default SpendMapView;
