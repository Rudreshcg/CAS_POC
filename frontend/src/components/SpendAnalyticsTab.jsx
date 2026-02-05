import React, { useState, useEffect } from 'react';
import ExecutiveDashboard from './ExecutiveDashboard';
import AnalyticalDashboard from './AnalyticalDashboard';
import GeographicDashboard from './GeographicDashboard';
import { BarChart3, Table2, Globe, Settings, Check } from 'lucide-react';

const SpendAnalyticsTab = () => {
    const [activeStyle, setActiveStyle] = useState('executive'); // executive, analytical, geographic
    const [showStyleSelector, setShowStyleSelector] = useState(false);
    const [savedPreference, setSavedPreference] = useState(null);

    // Load saved preference on mount
    useEffect(() => {
        const fetchPreference = async () => {
            try {
                const res = await fetch('/api/user-preferences?key=dashboard_style_preference');
                if (res.ok) {
                    const json = await res.json();
                    if (json && json.value) {
                        setSavedPreference(json.value);
                        setActiveStyle(json.value);
                    } else {
                        // Fallback to localStorage if server has no pref yet (migration)
                        const saved = localStorage.getItem('dashboard_style_preference');
                        if (saved) {
                            setSavedPreference(saved);
                            setActiveStyle(saved);
                            // Optionally sync back to DB
                            savePreference(saved);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to fetch preferences:", err);
            }
        };
        fetchPreference();
    }, []);

    const dashboardStyles = [
        {
            id: 'executive',
            name: 'Executive Dashboard',
            description: 'Chart-heavy visualizations with high-level insights',
            icon: BarChart3,
            color: 'from-blue-500 to-cyan-500',
            features: ['KPI Cards', 'Treemaps', 'Trend Charts', 'Pareto Analysis']
        },
        {
            id: 'analytical',
            name: 'Analytical Dashboard',
            description: 'Detailed tables with inline charts and drill-down',
            icon: Table2,
            color: 'from-purple-500 to-pink-500',
            features: ['Data Tables', 'Sortable Columns', 'Mixed Charts', 'Trend Indicators']
        },
        {
            id: 'geographic',
            name: 'Geographic Dashboard',
            description: 'Map-focused with location-based insights',
            icon: Globe,
            color: 'from-green-500 to-emerald-500',
            features: ['Interactive Map', 'Regional Analysis', 'Location Markers', 'Heat Maps']
        }
    ];

    const handleStyleChange = (styleId) => {
        setActiveStyle(styleId);
        setShowStyleSelector(false);
    };

    const savePreference = async (styleId) => {
        try {
            const res = await fetch('/api/user-preferences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    key: 'dashboard_style_preference',
                    value: styleId
                })
            });
            if (res.ok) {
                localStorage.setItem('dashboard_style_preference', styleId); // Keep local as cache
                setSavedPreference(styleId);
                setActiveStyle(styleId);
            }
        } catch (err) {
            console.error("Failed to save preference:", err);
        }
    };

    return (
        <div className="p-6 bg-slate-900 min-h-screen">
            {/* Header with Style Selector */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Spend Analytics</h1>
                    <p className="text-slate-400">
                        Comprehensive procurement spend analysis - Choose your preferred visualization style
                    </p>
                </div>
                <button
                    onClick={() => setShowStyleSelector(!showStyleSelector)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors text-white"
                >
                    <Settings className="w-5 h-5" />
                    <span className="text-sm font-medium">Change Style</span>
                </button>
            </div>

            {/* Style Selector Modal/Panel */}
            {showStyleSelector && (
                <div className="mb-6 bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white">Choose Visualization Style</h3>
                        <button
                            onClick={() => setShowStyleSelector(false)}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {dashboardStyles.map((style) => {
                            const Icon = style.icon;
                            const isActive = activeStyle === style.id;
                            const isSaved = savedPreference === style.id;

                            return (
                                <div
                                    key={style.id}
                                    className={`
                                        relative bg-slate-900 border-2 rounded-xl p-6 cursor-pointer transition-all
                                        ${isActive
                                            ? 'border-cyan-500 shadow-lg shadow-cyan-500/20'
                                            : 'border-slate-700 hover:border-slate-600'
                                        }
                                    `}
                                    onClick={() => handleStyleChange(style.id)}
                                >
                                    {/* Saved Badge */}
                                    {isSaved && (
                                        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                                            <Check className="w-3 h-3" />
                                            Default
                                        </div>
                                    )}

                                    {/* Icon with Gradient */}
                                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${style.color} p-4 mb-4`}>
                                        <Icon className="w-full h-full text-white" />
                                    </div>

                                    {/* Title and Description */}
                                    <h4 className="text-lg font-bold text-white mb-2">{style.name}</h4>
                                    <p className="text-sm text-slate-400 mb-4">{style.description}</p>

                                    {/* Features */}
                                    <div className="space-y-2 mb-4">
                                        {style.features.map((feature, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                                {feature}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleStyleChange(style.id);
                                            }}
                                            className={`
                                                flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors
                                                ${isActive
                                                    ? 'bg-cyan-600 text-white'
                                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                                }
                                            `}
                                        >
                                            {isActive ? 'Active' : 'Select'}
                                        </button>
                                        {!isSaved && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    savePreference(style.id);
                                                }}
                                                className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors"
                                                title="Set as default"
                                            >
                                                Set Default
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}


            {/* Dashboard Content with Fade Transition */}
            <div className="transition-opacity duration-300">
                {activeStyle === 'executive' && <ExecutiveDashboard />}
                {activeStyle === 'analytical' && <AnalyticalDashboard />}
                {activeStyle === 'geographic' && <GeographicDashboard />}
            </div>
        </div>
    );
};

export default SpendAnalyticsTab;
