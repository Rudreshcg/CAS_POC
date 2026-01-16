import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Database } from 'lucide-react';

export default function ClusterVisualizer() {
    const [data, setData] = useState(null);
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

    // Calculate clean hierarchical layout
    const dendrogramData = useMemo(() => {
        if (!data || !data.children) return null;

        const allNodes = [];
        let leafCount = 0;

        // Collect all nodes with proper IDs
        const collectNodes = (node, depth = 0, parentId = null) => {
            const nodeId = `node-${allNodes.length}`;
            const nodeData = {
                id: nodeId,
                name: node.name,
                depth,
                parentId,
                childIds: [],
                isLeaf: !node.children || node.children.length === 0
            };

            if (nodeData.isLeaf) {
                nodeData.leafIndex = leafCount++;
            }

            allNodes.push(nodeData);

            if (node.children) {
                node.children.forEach(child => {
                    const childId = collectNodes(child, depth + 1, nodeId);
                    nodeData.childIds.push(childId);
                });
            }

            return nodeId;
        };

        // Build node tree
        data.children.forEach(child => collectNodes(child, 0));

        // Layout configuration
        const VERTICAL_SPACING = 30;
        const HORIZONTAL_SPACING = 250;
        const maxDepth = Math.max(...allNodes.map(n => n.depth));

        // Position leaf nodes vertically
        allNodes.filter(n => n.isLeaf).forEach(node => {
            node.x = maxDepth * HORIZONTAL_SPACING;
            node.y = node.leafIndex * VERTICAL_SPACING + 50;
        });

        // Position parent nodes (from deepest to root)
        for (let d = maxDepth - 1; d >= 0; d--) {
            allNodes.filter(n => n.depth === d).forEach(node => {
                if (node.childIds.length > 0) {
                    const children = node.childIds.map(id => allNodes.find(n => n.id === id));
                    const avgY = children.reduce((sum, c) => sum + c.y, 0) / children.length;
                    node.x = d * HORIZONTAL_SPACING;
                    node.y = avgY;
                }
            });
        }

        // Create connections with right-angle paths
        const links = [];
        allNodes.forEach(node => {
            node.childIds.forEach(childId => {
                const child = allNodes.find(n => n.id === childId);
                if (child) {
                    const midX = (node.x + child.x) / 2;
                    links.push({
                        source: node,
                        target: child,
                        // Right-angle connection for clarity
                        path: `M ${node.x},${node.y} H ${midX} V ${child.y} H ${child.x}`
                    });
                }
            });
        });

        const height = leafCount * VERTICAL_SPACING + 100;
        const width = maxDepth * HORIZONTAL_SPACING + 400;

        // Debug: log nodes to see what's happening
        console.log('Dendrogram nodes:', allNodes.filter(n => n.depth === 0));
        console.log('Total nodes:', allNodes.length, 'Leaf count:', leafCount);

        return { nodes: allNodes, links, width, height, leafCount };
    }, [data]);

    if (loading) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-slate-950">
                <div className="text-center">
                    <Database size={64} className="mx-auto mb-4 text-cyan-400 animate-pulse" />
                    <p className="text-slate-400 text-lg font-medium">Loading Cluster Dendrogram</p>
                    <p className="text-slate-600 text-sm mt-2">Preparing visualization...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-slate-950">
                <div className="text-center text-red-400">
                    <p className="text-lg font-semibold mb-2">Failed to Load Data</p>
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

    if (!dendrogramData) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-slate-950">
                <p className="text-slate-500">No data available</p>
            </div>
        );
    }

    return (
        <div className="w-full h-screen bg-slate-950 text-slate-200 flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-800 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-cyan-400 rounded-lg border border-slate-700 text-sm font-semibold hover:bg-slate-700 transition-colors"
                        >
                            <ArrowLeft size={16} />
                            Back to Lookup
                        </Link>
                        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                            <Database size={20} className="text-cyan-400" />
                            Cluster Dendrogram
                        </h2>
                    </div>
                    <span className="text-xs bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded border border-cyan-500/20">
                        {dendrogramData.leafCount} Materials
                    </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                    Hierarchical clustering visualization • {data.name}
                </p>
            </div>

            {/* Dendrogram */}
            <div className="flex-1 overflow-auto p-8 bg-slate-950">
                <svg
                    width={dendrogramData.width + 120}
                    height={dendrogramData.height}
                    viewBox={`-120 0 ${dendrogramData.width + 120} ${dendrogramData.height}`}
                    className="mx-auto"
                >
                    <g transform="translate(120, 0)">
                        {/* Connections */}
                        <g className="links">
                            {dendrogramData.links.map((link, i) => (
                                <path
                                    key={i}
                                    d={link.path}
                                    stroke="rgb(100, 116, 139)"
                                    strokeWidth="1.5"
                                    fill="none"
                                    opacity="0.7"
                                />
                            ))}
                        </g>

                        {/* Nodes and Labels */}
                        <g className="nodes">
                            {dendrogramData.nodes.map((node, i) => (
                                <g key={i} transform={`translate(${node.x}, ${node.y})`}>
                                    {/* Node circle */}
                                    <circle
                                        r={node.isLeaf ? 4 : 5}
                                        fill={node.isLeaf ? 'rgb(34, 211, 238)' : 'rgb(168, 85, 247)'}
                                        stroke="rgb(15, 23, 42)"
                                        strokeWidth="2"
                                    />

                                    {/* Node label */}
                                    {node.depth === 0 && node.name.length > 20 ? (
                                        // Split long brand names into two lines
                                        <text
                                            x="-15"
                                            y="0"
                                            fill="rgb(148, 163, 184)"
                                            fontSize="13"
                                            fontWeight="bold"
                                            textAnchor="end"
                                            className="select-none"
                                        >
                                            <tspan x="-15" dy="-0.3em">{node.name.substring(0, 20)}</tspan>
                                            <tspan x="-15" dy="1.2em">{node.name.substring(20)}</tspan>
                                        </text>
                                    ) : (
                                        <text
                                            x={node.isLeaf ? 10 : (node.depth === 0 ? -15 : 10)}
                                            y="4"
                                            fill={node.depth === 0 ? 'rgb(148, 163, 184)' : 'rgb(203, 213, 225)'}
                                            fontSize={node.depth === 0 ? '14' : '11'}
                                            fontWeight={node.depth === 0 ? 'bold' : 'normal'}
                                            textAnchor={node.isLeaf ? 'start' : (node.depth === 0 ? 'end' : 'start')}
                                            className="select-none"
                                        >
                                            {node.name}
                                        </text>
                                    )}
                                </g>
                            ))}
                        </g>
                    </g>
                </svg>
            </div>
        </div>
    );
}
