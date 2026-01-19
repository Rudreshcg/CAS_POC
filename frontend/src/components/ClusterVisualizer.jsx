import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Database, Save, X, Edit2 } from 'lucide-react';

export default function ClusterVisualizer() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Editing and drag-drop state
    const [pendingChanges, setPendingChanges] = useState([]);
    const [editingNode, setEditingNode] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [draggedNode, setDraggedNode] = useState(null);
    const [dropTarget, setDropTarget] = useState(null);

    const fetchClusters = () => {
        setLoading(true);
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
    };

    useEffect(() => {
        fetchClusters();
    }, []);

    // Inline editing handlers
    const handleDoubleClick = (node, nodeData) => {
        // Only allow editing plant (Depth 2) and material (Leaf/Depth 3)
        // Note: Plant names usually have '📍 ' prefix in visualization, but raw name in nodeData.plant might be clean.
        // Let's use clean name.
        if (node.isLeaf || node.depth === 2) {
            const cleanName = node.name.replace('📍 ', '');
            setEditingNode({ ...node, ...nodeData });
            setEditValue(cleanName);
        }
    };

    const handleEditSave = () => {
        if (!editingNode || !editValue.trim()) {
            setEditingNode(null);
            return;
        }

        const cleanOldName = editingNode.name.replace('📍 ', '');
        if (cleanOldName === editValue.trim()) {
            setEditingNode(null);
            return;
        }

        // Add to pending changes
        const change = {
            type: 'rename',
            node_type: editingNode.isLeaf ? 'material' : 'plant',
            old_name: cleanOldName,
            new_name: editValue.trim(),
            brand: editingNode.brand,
            subcategory: editingNode.subcategory,
            // For material rename, we need its name. For plant rename, we need its name.
            // But we also need context. 
            // - If renaming Plant: Need Brand, SubCat, OldName. 
            // - If renaming Material: Need Brand, SubCat, OldName.
        };

        setPendingChanges(prev => [...prev, change]);
        setEditingNode(null);
        setEditValue('');
    };

    const handleEditCancel = () => {
        setEditingNode(null);
        setEditValue('');
    };

    // Drag and drop handlers
    const handleDragStart = (e, node, nodeData) => {
        if (!node.isLeaf) return; // Only Materials (leaves) are draggable

        e.stopPropagation();
        e.preventDefault(); // Prevent native drag behavior
        setIsDragging(true);
        setDraggedNode({ ...node, ...nodeData });
    };

    const handleDragOver = (e, node) => {
        // Only Plants (Depth 2) are drop targets
        if (node.depth !== 2) return;
        e.preventDefault();
    };

    const handleDragEnter = (node) => {
        // If we are dragging a Leaf, and entering a Plant different from its current parent
        if (isDragging && draggedNode && node.depth === 2) {
            // Check if this plant is the one it currently belongs to?
            // Actually, we can move it to same plant (no-op) or different.
            // Visual feedback is good.
            setDropTarget(node.id);
        }
    };

    const handleDragLeave = () => {
        setDropTarget(null);
    };

    const handleDrop = (e, targetNode, targetData) => {
        e.preventDefault();
        setDropTarget(null);

        if (!isDragging || !draggedNode) {
            setIsDragging(false);
            setDraggedNode(null);
            return;
        }

        // We are dragging a Material (draggedNode) to a Plant (targetNode)

        // Prevent dropping on non-plant nodes
        if (targetNode.depth !== 2) {
            setIsDragging(false);
            setDraggedNode(null);
            return;
        }

        const fromPlant = draggedNode.plant;
        const toPlant = targetNode.name.replace('📍 ', '');

        // Don't allow dropping on same plant
        if (fromPlant === toPlant && draggedNode.subcategory === targetNode.subcategory) {
            setIsDragging(false);
            setDraggedNode(null);
            return;
        }

        // Move Material from Plant A to Plant B
        const change = {
            type: 'move',
            node_type: 'material',
            name: draggedNode.name, // Material Name
            brand: draggedNode.brand,
            from_subcategory: draggedNode.subcategory,
            to_subcategory: targetNode.subcategory,
            from_plant: fromPlant,
            to_plant: toPlant
        };

        setPendingChanges(prev => [...prev, change]);
        setIsDragging(false);
        setDraggedNode(null);
    };

    // Save all pending changes
    const handleSaveAll = async () => {
        if (pendingChanges.length === 0) return;

        try {
            const response = await fetch('/api/clusters/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ changes: pendingChanges })
            });

            if (response.ok) {
                const res = await response.json();
                alert(`✅ ${res.message || 'Saved successfully!'}`);
                setPendingChanges([]);
                fetchClusters();
            } else {
                const error = await response.json();
                alert(`❌ Error: ${error.error}`);
            }
        } catch (err) {
            alert(`❌ Error: ${err.message}`);
        }
    };

    // Cancel all pending changes
    const handleCancelAll = () => {
        setPendingChanges([]);
        fetchClusters();
    };

    // Calculate clean hierarchical layout
    const dendrogramData = useMemo(() => {
        if (!data || !data.children) return null;

        const allNodes = [];
        let leafCount = 0;

        // Collect all nodes with proper IDs and hierarchy tracking
        // Collect all nodes with proper IDs and hierarchy tracking
        const collectNodes = (node, depth = 0, parentId = null, brand = null, subcategory = null, plant = null) => {
            const nodeId = `node-${allNodes.length}`;
            const nodeData = {
                id: nodeId,
                name: node.name,
                depth,
                parentId,
                childIds: [],
                isLeaf: !node.children || node.children.length === 0,
                brand: brand || (depth === 0 ? node.name : null),
                subcategory: subcategory || (depth === 1 ? node.name : null),
                plant: plant || (depth === 2 ? node.name.replace('📍 ', '') : null),
                material: depth === 3 ? node.name : null
            };

            if (nodeData.isLeaf) {
                nodeData.leafIndex = leafCount++;
            }

            allNodes.push(nodeData);

            if (node.children) {
                node.children.forEach(child => {
                    const childId = collectNodes(
                        child,
                        depth + 1,
                        nodeId,
                        brand || (depth === 0 ? node.name : null),
                        subcategory || (depth === 1 ? node.name : null),
                        plant || (depth === 2 ? node.name.replace('📍 ', '') : null)
                    );
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
            <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-800 flex-shrink-0 select-none">
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

            {/* Action Bar */}
            {pendingChanges.length > 0 && (
                <div className="sticky top-0 z-10 bg-amber-500/10 border-b border-amber-500/30 px-6 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-amber-400 font-semibold">
                                {pendingChanges.length} Pending Change{pendingChanges.length !== 1 ? 's' : ''}
                            </span>
                            <span className="text-slate-400 text-sm">
                                (Double-click to edit • Drag materials to move)
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleCancelAll}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                            >
                                <X size={16} />
                                Cancel All
                            </button>
                            <button
                                onClick={handleSaveAll}
                                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors font-semibold"
                            >
                                <Save size={16} />
                                Save All Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Instructions */}
            {pendingChanges.length === 0 && (
                <div className="px-6 py-3 bg-slate-800/50 border-b border-slate-700">
                    <p className="text-slate-400 text-sm text-center">
                        💡 <span className="text-cyan-400">Double-click</span> plant or material names to edit •
                        <span className="text-cyan-400 ml-1">Drag</span> material nodes to plants to move
                    </p>
                </div>
            )}

            {/* Dendrogram */}
            <div className="flex-1 overflow-auto p-8 bg-slate-950">
                <svg
                    width={dendrogramData.width + 120}
                    height={dendrogramData.height}
                    viewBox={`-120 0 ${dendrogramData.width + 120} ${dendrogramData.height}`}
                    className="mx-auto select-none"
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
                            {dendrogramData.nodes.map((node, i) => {
                                const isEditing = editingNode && editingNode.id === node.id;
                                const isDragged = draggedNode && draggedNode.id === node.id;
                                const isDropTarget = dropTarget === node.id;
                                const isEditable = node.isLeaf || node.depth === 2;
                                const isDraggable = node.isLeaf;

                                return (
                                    <g
                                        key={i}
                                        transform={`translate(${node.x}, ${node.y})`}
                                        style={{ cursor: isDraggable ? 'grab' : isEditable ? 'pointer' : 'default' }}
                                        onDoubleClick={() => handleDoubleClick(node, node)}
                                        onMouseDown={(e) => isDraggable && handleDragStart(e, node, node)}
                                        onMouseEnter={() => handleDragEnter(node)}
                                        onMouseLeave={handleDragLeave}
                                        onMouseUp={(e) => handleDrop(e, node, node)}
                                        onDragOver={(e) => handleDragOver(e, node)}
                                    >
                                        {/* Node circle */}
                                        <circle
                                            r={node.isLeaf ? 4 : 5}
                                            fill={
                                                isDragged ? 'rgb(251, 191, 36)' : // Amber for dragged
                                                    isDropTarget ? 'rgb(6, 182, 212)' : // Bright cyan for drop target
                                                        isEditing ? 'rgb(234, 179, 8)' : // Yellow for editing
                                                            node.isLeaf ? 'rgb(34, 211, 238)' : 'rgb(168, 85, 247)'
                                            }
                                            stroke={
                                                isDragged || isEditing ? 'rgb(245, 158, 11)' :
                                                    isDropTarget ? 'rgb(6, 182, 212)' :
                                                        'rgb(15, 23, 42)'
                                            }
                                            strokeWidth={isDragged || isEditing || isDropTarget ? '3' : '2'}
                                        />

                                        {/* Node label or input */}
                                        {isEditing ? (
                                            <foreignObject x={node.isLeaf ? 10 : (node.depth === 0 ? -150 : 10)} y="-12" width="140" height="24">
                                                <input
                                                    type="text"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleEditSave();
                                                        if (e.key === 'Escape') handleEditCancel();
                                                    }}
                                                    onBlur={handleEditSave}
                                                    autoFocus
                                                    className="w-full px-2 py-1 text-xs bg-slate-800 text-white border border-amber-500 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
                                                />
                                            </foreignObject>
                                        ) : node.depth === 0 && node.name.length > 20 ? (
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
                                );
                            })}
                        </g>
                    </g>
                </svg>
            </div>
        </div>
    );
}
