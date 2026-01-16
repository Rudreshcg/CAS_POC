import React, { useMemo } from 'react';

const DendrogramView = ({ data, onNodeClick }) => {
    // Convert hierarchical data to dendrogram layout
    const dendrogramData = useMemo(() => {
        if (!data) return null;

        const levels = [];
        const nodePositions = new Map();
        let leafIndex = 0;

        // Traverse tree and assign positions
        const traverse = (node, depth = 0, parentX = null) => {
            if (!levels[depth]) levels[depth] = [];

            if (!node.children || node.children.length === 0) {
                // Leaf node
                const x = leafIndex * 80 + 40;
                leafIndex++;
                const y = 400; // Bottom of chart
                nodePositions.set(node.name, { x, y, depth, isLeaf: true });
                levels[depth].push({ ...node, x, y, isLeaf: true });
                return { x, y };
            }

            // Process children first
            const childPositions = node.children.map(child =>
                traverse(child, depth + 1, null)
            );

            // Parent position is average of children
            const avgX = childPositions.reduce((sum, pos) => sum + pos.x, 0) / childPositions.length;
            const y = 400 - (depth + 1) * 80; // Move up for each level

            nodePositions.set(node.name, { x: avgX, y, depth, isLeaf: false, children: node.children });
            levels[depth].push({ ...node, x: avgX, y, isLeaf: false, childPositions });

            return { x: avgX, y };
        };

        // Start traversal from root's children
        if (data.children) {
            data.children.forEach(child => traverse(child, 0));
        }

        return { levels, nodePositions, leafCount: leafIndex };
    }, [data]);

    if (!dendrogramData) return null;

    const { levels, nodePositions, leafCount } = dendrogramData;
    const width = Math.max(800, leafCount * 80);
    const height = 500;

    // Generate connection lines
    const connections = [];
    nodePositions.forEach((pos, nodeName) => {
        if (pos.children) {
            pos.children.forEach(child => {
                const childPos = nodePositions.get(child.name);
                if (childPos) {
                    connections.push({
                        x1: pos.x,
                        y1: pos.y,
                        x2: childPos.x,
                        y2: childPos.y,
                        parentName: nodeName,
                        childName: child.name
                    });
                }
            });
        }
    });

    return (
        <div className="w-full h-full overflow-auto bg-slate-950 p-8">
            <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Cluster Dendrogram</h3>
                <p className="text-slate-400 text-sm">Hierarchical visualization of material clusters</p>
            </div>

            <svg width={width} height={height} className="mx-auto">
                {/* Draw connections */}
                {connections.map((conn, i) => (
                    <g key={i}>
                        {/* Vertical line from parent */}
                        <line
                            x1={conn.x1}
                            y1={conn.y1}
                            x2={conn.x1}
                            y2={(conn.y1 + conn.y2) / 2}
                            stroke="rgb(71, 85, 105)"
                            strokeWidth="2"
                        />
                        {/* Horizontal line */}
                        <line
                            x1={conn.x1}
                            y1={(conn.y1 + conn.y2) / 2}
                            x2={conn.x2}
                            y2={(conn.y1 + conn.y2) / 2}
                            stroke="rgb(71, 85, 105)"
                            strokeWidth="2"
                        />
                        {/* Vertical line to child */}
                        <line
                            x1={conn.x2}
                            y1={(conn.y1 + conn.y2) / 2}
                            x2={conn.x2}
                            y2={conn.y2}
                            stroke="rgb(71, 85, 105)"
                            strokeWidth="2"
                        />
                    </g>
                ))}

                {/* Draw nodes */}
                {Array.from(nodePositions.entries()).map(([name, pos]) => (
                    <g
                        key={name}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        onClick={() => onNodeClick && onNodeClick(name)}
                        className="cursor-pointer"
                    >
                        <circle
                            r={pos.isLeaf ? 4 : 6}
                            fill={pos.isLeaf ? 'rgb(34, 211, 238)' : 'rgb(168, 85, 247)'}
                            stroke="rgb(15, 23, 42)"
                            strokeWidth="2"
                            className="hover:r-8 transition-all"
                        />
                        <text
                            y={pos.isLeaf ? 20 : -15}
                            textAnchor="middle"
                            fill="rgb(203, 213, 225)"
                            fontSize="11"
                            className="pointer-events-none select-none"
                            transform={pos.isLeaf ? 'rotate(45)' : ''}
                        >
                            {name.length > 15 ? name.substring(0, 15) + '...' : name}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    );
};

export default DendrogramView;
