import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    ChevronRight,
    ChevronDown,
    Hexagon,
    Database,
    FolderTree,
    Layers,
    AlertCircle,
    BarChart3,
    TrendingUp,
    Package,
    ArrowLeft
} from 'lucide-react';

/* ---------------- Helper: Tree stats ---------------- */
const getNodeStats = (node) => {
    let leaves = 0;
    let depth = 0;
    let totalNodes = 0;

    const walk = (n, d) => {
        totalNodes++;
        depth = Math.max(depth, d);
        if (!n.children || n.children.length === 0) {
            leaves++;
        } else {
            n.children.forEach(c => walk(c, d + 1));
        }
    };

    walk(node, 1);
    return { leaves, depth, totalNodes };
};

/* ---------------- Tree Node ---------------- */
const TreeNode = ({ node, level = 0, onSelect, selectedId, path = [] }) => {
    const [isOpen, setIsOpen] = useState(level < 1);
    const hasChildren = node.children?.length > 0;
    const stats = useMemo(() => getNodeStats(node), [node]);

    const iconByLevel = useMemo(() => {
        if (level === 0) return <Hexagon size={16} className="text-fuchsia-400" />;
        if (level === 1) return <Database size={16} className="text-cyan-400" />;
        if (level === 2) return <FolderTree size={16} className="text-emerald-400" />;
        return <Package size={14} className="text-amber-400" />;
    }, [level]);

    const isSelected = selectedId === node.name;
    const currentPath = [...path, node.name];

    const handleClick = useCallback(() => {
        onSelect(node, stats, currentPath, level);
    }, [node, stats, currentPath, level, onSelect]);

    const toggleOpen = useCallback((e) => {
        e.stopPropagation();
        if (hasChildren) setIsOpen(prev => !prev);
    }, [hasChildren]);

    return (
        <div>
            <div
                className={`group flex items-center justify-between px-3 py-2.5 cursor-pointer border-l-2 transition-all
          ${isSelected
                        ? 'border-cyan-400 bg-gradient-to-r from-cyan-950/40 to-transparent'
                        : 'border-slate-800 hover:bg-slate-800/40 hover:border-slate-700'
                    }`}
                style={{ paddingLeft: `${level * 16 + 12}px` }}
                onClick={handleClick}
            >
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <div
                        className={`p-0.5 rounded hover:bg-slate-700 transition-colors ${hasChildren ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                        onClick={toggleOpen}
                    >
                        {isOpen
                            ? <ChevronDown size={14} className="text-slate-400" />
                            : <ChevronRight size={14} className="text-slate-600" />}
                    </div>

                    {iconByLevel}

                    <span className={`text-sm truncate ${level === 0 ? 'font-bold text-slate-100' : 'text-slate-300'} ${isSelected ? 'text-cyan-300' : ''}`}>
                        {node.name}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-mono opacity-60 group-hover:opacity-100 transition-opacity">
                        {stats.leaves}
                    </span>
                    {level === 0 && (
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 animate-pulse" />
                    )}
                </div>
            </div>

            {hasChildren && isOpen && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                    {node.children.map((child, idx) => (
                        <TreeNode
                            key={`${child.name}-${idx}`}
                            node={child}
                            level={level + 1}
                            onSelect={onSelect}
                            selectedId={selectedId}
                            path={currentPath}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

/* ---------------- Right Panel (Enhanced Details) ---------------- */
const DetailsPanel = ({ node, stats, path, level }) => {
    if (!node) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8">
                <div className="relative">
                    <Hexagon size={64} className="opacity-10 mb-4" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Database size={32} className="text-slate-600 animate-pulse" />
                    </div>
                </div>
                <p className="text-sm mt-4">Select a node to explore hierarchy details</p>
                <p className="text-xs text-slate-600 mt-2">Click any item in the tree to begin</p>
            </div>
        );
    }

    const getLevelName = () => {
        if (level === 0) return 'Brand';
        if (level === 1) return 'Category';
        if (level === 2) return 'Material';
        return 'Location';
    };

    const getProgressPercentage = () => {
        return Math.min(100, (stats.leaves / 100) * 100);
    };

    return (
        <div className="p-8 h-full overflow-y-auto">
            {/* Breadcrumb */}
            {path && path.length > 0 && (
                <div className="mb-6 flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                    <Database size={12} className="text-cyan-400" />
                    {path.map((p, i) => (
                        <React.Fragment key={i}>
                            <span className={i === path.length - 1 ? 'text-cyan-400 font-medium' : ''}>
                                {p}
                            </span>
                            {i < path.length - 1 && <ChevronRight size={12} />}
                        </React.Fragment>
                    ))}
                </div>
            )}

            {/* Header Card */}
            <div className="mb-8 p-6 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-2xl border border-slate-700/50 relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Hexagon size={150} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-fuchsia-500/5" />

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-1 text-xs font-mono bg-slate-700/50 text-cyan-400 rounded border border-cyan-500/20">
                            {getLevelName()}
                        </span>
                        <span className="text-xs text-slate-500">Level {level + 1}</span>
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">
                        {node.name}
                    </h2>

                    <div className="flex flex-wrap gap-2">
                        {node.children && node.children.length > 0 && (
                            <span className="px-3 py-1.5 rounded-lg text-sm border border-slate-600 bg-slate-700/50 text-slate-200 flex items-center gap-2">
                                <FolderTree size={14} />
                                {node.children.length} Direct Children
                            </span>
                        )}
                        <span className="px-3 py-1.5 rounded-lg text-sm border border-cyan-600/30 bg-cyan-500/10 text-cyan-300 flex items-center gap-2">
                            <TrendingUp size={14} />
                            {stats.leaves} Total Items
                        </span>
                        <span className="px-3 py-1.5 rounded-lg text-sm border border-purple-600/30 bg-purple-500/10 text-purple-300 flex items-center gap-2">
                            <Layers size={14} />
                            Depth: {stats.depth}
                        </span>
                    </div>
                </div>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-xl border border-slate-700 hover:border-cyan-500/30 transition-all shadow-lg group">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-slate-500 font-medium">Leaf Nodes</div>
                        <BarChart3 size={16} className="text-cyan-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-3xl font-bold text-cyan-400 mb-1">{stats.leaves}</div>
                    <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-1000"
                            style={{ width: `${getProgressPercentage()}%` }}
                        />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-xl border border-slate-700 hover:border-purple-500/30 transition-all shadow-lg group">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-slate-500 font-medium">Tree Depth</div>
                        <Layers size={16} className="text-purple-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-3xl font-bold text-purple-400 mb-1">{stats.depth}</div>
                    <div className="text-xs text-slate-500">hierarchy levels</div>
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-xl border border-slate-700 hover:border-emerald-500/30 transition-all shadow-lg group">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-slate-500 font-medium">Total Nodes</div>
                        <Database size={16} className="text-emerald-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-3xl font-bold text-emerald-400 mb-1">{stats.totalNodes}</div>
                    <div className="text-xs text-slate-500">in subtree</div>
                </div>
            </div>

            {/* Children List */}
            {node.children && node.children.length > 0 && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                            <Package size={16} className="text-cyan-400" />
                            Child Nodes
                        </h4>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
                            {node.children.length} items
                        </span>
                    </div>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {node.children.map((c, i) => {
                            const childStats = getNodeStats(c);
                            return (
                                <div
                                    key={i}
                                    className="group p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-cyan-500/30 hover:bg-slate-800 transition-all cursor-pointer"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                            {c.children && c.children.length > 0 ? (
                                                <FolderTree size={14} className="text-emerald-400 flex-shrink-0" />
                                            ) : (
                                                <Package size={14} className="text-slate-500 flex-shrink-0" />
                                            )}
                                            <span className="text-sm text-slate-200 truncate group-hover:text-cyan-300 transition-colors">
                                                {c.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            {c.children && c.children.length > 0 && (
                                                <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded">
                                                    {childStats.leaves} items
                                                </span>
                                            )}
                                            <ChevronRight size={14} className="text-slate-600 group-hover:text-cyan-400 transition-colors" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Empty State for Leaf Nodes */}
            {(!node.children || node.children.length === 0) && (
                <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-8 text-center">
                    <Package size={48} className="mx-auto mb-4 text-slate-700" />
                    <p className="text-slate-400 font-medium mb-1">Leaf Node</p>
                    <p className="text-sm text-slate-600">This node has no children in the hierarchy</p>
                </div>
            )}
        </div>
    );
};

/* ---------------- Main Component ---------------- */
export default function ClusterVisualizer() {
    const [data, setData] = useState(null);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('/api/clusters')
            .then(res => {
                if (!res.ok) throw new Error('Failed to load cluster data');
                return res.json();
            })
            .then(data => {
                setData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Cluster load error:', err);
                setError(err.message);
                setLoading(false);
            });
    }, []);

    const handleSelect = useCallback((node, stats, path, level) => {
        setSelected({ node, stats, path, level });
    }, []);

    if (loading) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-slate-950">
                <div className="text-center">
                    <div className="relative inline-block mb-6">
                        <Layers size={64} className="text-cyan-400 animate-pulse" />
                        <div className="absolute inset-0 bg-cyan-400/20 blur-xl animate-pulse" />
                    </div>
                    <p className="text-slate-400 text-lg font-medium">Loading Material Clusters</p>
                    <p className="text-slate-600 text-sm mt-2">Preparing hierarchy visualization...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-slate-950">
                <div className="text-center">
                    <AlertCircle size={64} className="mx-auto mb-4 text-red-400" />
                    <p className="text-lg font-semibold text-red-400 mb-2">Failed to Load Data</p>
                    <p className="text-sm text-slate-500">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-slate-950">
                <p className="text-slate-500">No data available</p>
            </div>
        );
    }

    return (
        <div className="w-full h-screen flex bg-slate-950 text-slate-200">
            {/* Left Panel: Tree */}
            <div className="w-1/2 lg:w-2/5 border-r border-slate-800 bg-slate-900/50 flex flex-col">
                <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-800 flex-shrink-0">
                    {/* Back Button */}
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 bg-slate-800 text-cyan-400 rounded-lg border border-slate-700 text-sm font-semibold hover:bg-slate-700 transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Back to Lookup
                    </Link>

                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                            <Database size={20} className="text-cyan-400" />
                            Material Clusters
                        </h2>
                        <span className="text-xs bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded border border-cyan-500/20">
                            Live Data
                        </span>
                    </div>
                    <p className="text-xs text-slate-500">
                        {data.name} • Hierarchical Structure
                    </p>
                </div>

                <div className="p-2 overflow-y-auto flex-1 custom-scrollbar">
                    {data.children?.map((node, idx) => (
                        <TreeNode
                            key={`${node.name}-${idx}`}
                            node={node}
                            onSelect={handleSelect}
                            selectedId={selected?.node?.name}
                        />
                    ))}
                </div>
            </div>

            {/* Right Panel: Details */}
            <div className="flex-1 bg-slate-950 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/10 via-slate-950 to-slate-950 pointer-events-none" />
                <div className="relative z-10 h-full">
                    <DetailsPanel
                        node={selected?.node}
                        stats={selected?.stats}
                        path={selected?.path}
                        level={selected?.level}
                    />
                </div>
            </div>

            {/* Custom Scrollbar Styles */}
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgb(15 23 42);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgb(51 65 85);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgb(71 85 105);
                }
            `}</style>
        </div>
    );
}
