import React, { useState, useEffect, useRef } from 'react';
import { DendrogramProvider, useDendrogram } from './dendrogram/DendrogramContext';
import { TreeNode } from './dendrogram/TreeNode';
import { AlertCircle, Sliders, Undo } from 'lucide-react';
import GroupingConfigModal from './GroupingConfigModal';

function DendrogramView({ initialData, onRefresh, subcategories, selectedSubcategory, setSelectedSubcategory }) {
    const { tree, setTree, setSelectedNodeId, undo, canUndo, moveNode, dragState, saveLayout } = useDendrogram();
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const scrollContainerRef = useRef(null);

    const scrollSpeedRef = useRef(0);
    const rafRef = useRef(null);

    // Global auto-scroll handler using window listener for better coverage
    useEffect(() => {
        if (!dragState.draggedNodeId) return;

        const handleWindowDragOver = (e) => {
            e.preventDefault();
            const container = scrollContainerRef.current;
            if (!container) return;

            // Use viewport coordinates for maximum reliability
            const y = e.clientY;
            const viewportHeight = window.innerHeight;

            // Large active zones at top/bottom of screen. 
            // 200px guarantees we cover headers/toolbars at the top.
            const topZone = 200;
            const bottomZone = 200;
            const maxSpeed = 50;

            if (y < topZone) {
                // Scroll Up (Top of Screen)
                // Distance from top edge
                const distance = Math.max(0, topZone - y);
                // Normalized intensity (0 to 1)
                const intensity = Math.min(1, distance / topZone);
                // Aggressive response: start at 30% speed immediately
                scrollSpeedRef.current = -maxSpeed * (0.3 + 0.7 * intensity);
            } else if (y > viewportHeight - bottomZone) {
                // Scroll Down (Bottom of Screen)
                // Distance from bottom edge
                const distance = Math.max(0, y - (viewportHeight - bottomZone));
                const intensity = Math.min(1, distance / bottomZone);
                scrollSpeedRef.current = maxSpeed * (0.3 + 0.7 * intensity);
            } else {
                scrollSpeedRef.current = 0;
            }

            // Start loop if needed
            if (scrollSpeedRef.current !== 0 && !rafRef.current) {
                performScroll();
            }
        };

        const performScroll = () => {
            if (scrollContainerRef.current && scrollSpeedRef.current !== 0) {
                scrollContainerRef.current.scrollTop += scrollSpeedRef.current;
                rafRef.current = requestAnimationFrame(performScroll);
            } else {
                rafRef.current = null;
                scrollSpeedRef.current = 0;
            }
        };

        // Use capture phase to ensure we catch events even if stopped by children
        window.addEventListener('dragover', handleWindowDragOver, true);

        return () => {
            window.removeEventListener('dragover', handleWindowDragOver, true);
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            scrollSpeedRef.current = 0;
        };
    }, [dragState.draggedNodeId]);

    const handleDragLeave = () => {
        scrollSpeedRef.current = 0;
    };

    // Cleanup RAF on unmount
    useEffect(() => {
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    useEffect(() => {
        if (initialData) {
            setTree(initialData);
        }
    }, [initialData, setTree]);

    return (
        <div
            ref={scrollContainerRef}
            className="h-full w-full bg-slate-950 p-6 md:p-10 overflow-auto custom-scrollbar relative"
        >
            {/* Header */}
            <div className="max-w-5xl mx-auto mb-8">


                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-cyan-900/30 border border-cyan-500/30 backdrop-blur-sm">
                                <AlertCircle className="w-5 h-5 text-cyan-400" />
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                                Material Clusters
                            </h1>
                        </div>
                        <p className="text-slate-400 text-sm md:text-base mb-6 max-w-2xl">
                            Interactive material grouping. Drag to reorganize. Click to annotate.
                            Manual save required to persist changes.
                        </p>

                        {/* SubCategory Filter */}
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-500 font-medium">Filter by:</span>
                            <select
                                value={selectedSubcategory}
                                onChange={(e) => setSelectedSubcategory(e.target.value)}
                                className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2 min-w-[200px]"
                            >
                                <option value="All">All Subcategories</option>
                                {subcategories.map(sub => (
                                    <option key={sub} value={sub}>{sub}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                        <button
                            onClick={undo}
                            disabled={!canUndo}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 rounded-lg border border-slate-700 transition-colors shadow-sm"
                            title="Undo last action"
                        >
                            <Undo className="w-4 h-4" />
                            <span>Undo</span>
                        </button>
                        <button
                            onClick={saveLayout}
                            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg border border-cyan-500 transition-colors shadow-sm font-medium"
                        >
                            <span>Save Layout</span>
                        </button>
                        <button
                            onClick={() => setIsConfigOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors shadow-sm"
                        >
                            <Sliders className="w-4 h-4" />
                            <span>Configure Grouping</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Dendrogram Container */}
            <div className="max-w-5xl mx-auto">
                <div
                    className="p-6 md:p-8 bg-slate-900/50 border border-slate-800 rounded-xl shadow-2xl backdrop-blur-sm min-h-[600px] relative"
                    onClick={() => setSelectedNodeId(null)}
                >
                    {/* Decorative background elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl">
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl opacity-50" />
                        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl opacity-50" />
                    </div>

                    {/* Tree visualization */}
                    <div className="relative z-10">
                        <TreeNode
                            node={tree}
                            depth={0}
                            isLast={true}
                            parentPath={[]}
                        />
                    </div>
                </div>
            </div>

            <GroupingConfigModal
                isOpen={isConfigOpen}
                onClose={() => setIsConfigOpen(false)}
                onSave={onRefresh} // Trigger refresh on save
            />
        </div>
    );
}

export default function ClusterVisualizer() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [subcategories, setSubcategories] = useState([]);
    const [selectedSubcategory, setSelectedSubcategory] = useState('All');

    // Fetch subcategories
    useEffect(() => {
        fetch('/api/subcategories')
            .then(res => res.json())
            .then(data => setSubcategories(data))
            .catch(err => console.error(err));
    }, []);

    const fetchClusters = async () => {
        setLoading(true);
        try {
            let url = '/api/clusters';
            if (selectedSubcategory && selectedSubcategory !== 'All') {
                url += `?subcategory=${encodeURIComponent(selectedSubcategory)}`;
            }

            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch');
            const json = await res.json();
            setData(json);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClusters();
    }, [selectedSubcategory]);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-950 text-cyan-500">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current"></div>
            </div>
        );
    }

    return (
        <DendrogramProvider>
            <DendrogramView
                initialData={data}
                onRefresh={fetchClusters}
                subcategories={subcategories}
                selectedSubcategory={selectedSubcategory}
                setSelectedSubcategory={setSelectedSubcategory}
            />
        </DendrogramProvider>
    );
}
