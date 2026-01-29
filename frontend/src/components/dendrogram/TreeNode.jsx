import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { useDendrogram } from './DendrogramContext';
import { ChevronRight, MessageSquare, GripVertical, Plus, AlertCircle } from 'lucide-react';
import { CommentPopover } from './CommentPopover';

export function TreeNode({ node, depth, isLast, parentPath }) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [showComment, setShowComment] = useState(false);
    const nodeRef = useRef(null);

    const {
        dragState,
        setDragState,
        moveNode,
        updateNodeName,
        selectedNodeId,
        setSelectedNodeId
    } = useDendrogram();

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(node.name);

    // Sync edit name if node updates from outside
    useEffect(() => {
        setEditName(node.name);
    }, [node.name]);

    const handleSaveEdit = () => {
        if (editName.trim() && editName !== node.name) {
            updateNodeName(node, editName.trim());
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSaveEdit();
        } else if (e.key === 'Escape') {
            setEditName(node.name);
            setIsEditing(false);
        }
    };

    const hasChildren = node.children && node.children.length > 0;
    // Determine if it's a leaf node. In our new hierarchy (Brand -> SubCat -> ... -> Material), 
    // theoretically only the last level is a 'leaf', but users might want to annotate any level.
    // The design implies leaves are draggable and commentable.
    // Let's assume ANY node can be annotated, but maybe only leaves are draggable?
    // Design said "Click leaf nodes to add comments".
    // Note: we will rely on checking children count or node type if available.
    const isLeaf = !hasChildren;

    const isDragging = dragState.draggedNodeId === node.id;
    const isDropTarget = dragState.targetNodeId === node.id;

    const handleDragStart = (e) => {
        if (node.id === 'root') return;
        e.dataTransfer.setData('text/plain', node.id);
        e.dataTransfer.effectAllowed = 'move';
        setDragState({
            draggedNodeId: node.id,
            targetNodeId: null,
            targetPosition: null
        });
    };

    const handleDragEnd = () => {
        if (dragState.targetNodeId && dragState.targetPosition && dragState.draggedNodeId) {
            moveNode(dragState.draggedNodeId, dragState.targetNodeId, dragState.targetPosition);
        }
        setDragState({ draggedNodeId: null, targetNodeId: null, targetPosition: null });
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        if (!dragState.draggedNodeId || dragState.draggedNodeId === node.id) return;

        const rect = nodeRef.current?.getBoundingClientRect();
        if (!rect) return;

        const y = e.clientY - rect.top;
        const height = rect.height;

        let position;
        if (y < height * 0.25) {
            position = 'before';
        } else if (y > height * 0.75) {
            position = 'after';
        } else {
            position = 'inside';
        }

        setDragState(prev => ({
            ...prev,
            targetNodeId: node.id,
            targetPosition: position
        }));
    };

    const handleDragLeave = () => {
        // Basic debounce or check if we are actually leaving the node could be added
    };

    const handleNodeClick = (e) => {
        e.stopPropagation();
        setSelectedNodeId(selectedNodeId === node.id ? null : node.id);
    };

    const isSelected = selectedNodeId === node.id;

    return (
        <div className="relative">
            {/* Connecting lines */}
            {depth > 0 && (
                <div className="absolute left-0 top-0 bottom-0 pointer-events-none">
                    {parentPath.map((showLine, index) => (
                        showLine && (
                            <div
                                key={index}
                                className="absolute border-l border-slate-700/50"
                                style={{
                                    left: `${(index + 1) * 28 - 14}px`,
                                    top: 0,
                                    bottom: isLast && index === parentPath.length - 1 ? '50%' : 0
                                }}
                            />
                        )
                    ))}
                    <div
                        className="absolute border-t border-slate-700/50"
                        style={{
                            left: `${depth * 28 - 14}px`,
                            top: '18px', // Adjusted for visual alignment
                            width: '14px'
                        }}
                    />
                </div>
            )}

            {/* Drop indicator lines */}
            {isDropTarget && dragState.targetPosition === 'before' && (
                <div
                    className="absolute left-0 right-4 h-0.5 bg-cyan-500 rounded-full z-10 animate-pulse"
                    style={{ top: '-1px', marginLeft: `${depth * 28}px` }}
                />
            )}
            {isDropTarget && dragState.targetPosition === 'after' && !hasChildren && (
                <div
                    className="absolute left-0 right-4 h-0.5 bg-cyan-500 rounded-full z-10 animate-pulse"
                    style={{ bottom: '-1px', marginLeft: `${depth * 28}px` }}
                />
            )}

            {/* Node content */}
            <div
                ref={nodeRef}
                draggable={!isEditing && node.id !== 'root'}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={handleNodeClick}
                className={cn(
                    "group relative flex items-center gap-2 py-1.5 px-2 rounded-lg transition-all duration-200 cursor-pointer select-none",
                    "hover:bg-slate-800/50",
                    isDragging && "opacity-50 scale-95",
                    isDropTarget && dragState.targetPosition === 'inside' && "bg-cyan-900/20 ring-1 ring-cyan-500/50",
                    isSelected && "bg-cyan-900/10 ring-1 ring-cyan-500/30"
                )}
                style={{ marginLeft: `${depth * 28}px` }}
            >
                {/* Drag handle */}
                {node.id !== 'root' && (
                    <GripVertical
                        className="w-4 h-4 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                    />
                )}

                {/* Expand/collapse button */}
                {hasChildren ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                        }}
                        className="p-0.5 hover:bg-slate-700 rounded transition-colors"
                    >
                        <ChevronRight
                            className={cn(
                                "w-4 h-4 text-slate-400 transition-transform duration-200",
                                isExpanded && "rotate-90"
                            )}
                        />
                    </button>
                ) : (
                    <div className="w-5" /> // Spacer
                )}

                {/* Node indicator */}
                <div
                    className={cn(
                        "w-2.5 h-2.5 rounded-full transition-all duration-300 shadow-sm",
                        isLeaf
                            ? "bg-cyan-500 shadow-cyan-500/20"
                            : "bg-indigo-500 shadow-indigo-500/20",
                        isSelected && "ring-2 ring-offset-2 ring-offset-slate-900 ring-cyan-500"
                    )}
                />

                {/* Node name */}
                {/* Node name or Edit Input */}
                {isEditing ? (
                    <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={handleSaveEdit}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="min-w-[100px] max-w-[300px] bg-slate-900 text-sm text-cyan-400 border border-cyan-500 rounded px-1 -ml-1 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <span
                        onDoubleClick={(e) => {
                            e.stopPropagation();
                            // Only allow editing leaf materials
                            if (node.type === 'material' || (!hasChildren && node.id !== 'root')) {
                                setIsEditing(true);
                            }
                        }}
                        className={cn(
                            "font-medium text-sm transition-colors",
                            isLeaf ? "text-slate-200" : "text-slate-300",
                            isSelected && "text-cyan-400"
                        )}>
                        {node.name}
                    </span>
                )}

                {/* Comment indicator and popover */}
                {/* Allow comments on any node for now */}
                <div onClick={e => e.stopPropagation()}>
                    <CommentPopover
                        node={node}
                        open={showComment}
                        onOpenChange={setShowComment}
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowComment(true);
                            }}
                            className={cn(
                                "p-1 rounded-md transition-all duration-200 ml-auto",
                                node.has_open_qa
                                    ? "text-amber-500 hover:bg-amber-900/20 opacity-100"
                                    : node.comment
                                        ? "text-cyan-400 hover:bg-cyan-900/20"
                                        : "text-slate-600 hover:text-slate-400 hover:bg-slate-800 opacity-0 group-hover:opacity-100"
                            )}
                        >
                            {node.has_open_qa ? (
                                <AlertCircle className="w-3.5 h-3.5 fill-current" />
                            ) : node.comment ? (
                                <MessageSquare className="w-3.5 h-3.5 fill-current" />
                            ) : (
                                <Plus className="w-3.5 h-3.5" />
                            )}
                        </button>
                    </CommentPopover>
                </div>

                {/* Comment preview badge */}
                {node.comment && (
                    <span className="ml-2 text-[10px] text-slate-500 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/50 max-w-[120px] truncate hidden sm:inline-block">
                        {node.comment}
                    </span>
                )}
            </div>

            {/* Children */}
            {hasChildren && isExpanded && (
                <div className={cn(
                    "overflow-hidden transition-all duration-300",
                    // Simple animation simulation or omit for perf
                )}>
                    {node.children.map((child, index) => (
                        <TreeNode
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            isLast={index === node.children.length - 1}
                            parentPath={[...parentPath, !isLast]}
                        />
                    ))}
                </div>
            )}

            {/* Drop after indicator for parent nodes */}
            {isDropTarget && dragState.targetPosition === 'after' && hasChildren && isExpanded && (
                <div
                    className="absolute left-0 right-4 h-0.5 bg-cyan-500 rounded-full z-10 animate-pulse"
                    style={{
                        bottom: '-1px',
                        marginLeft: `${(depth + 1) * 28}px`
                    }}
                />
            )}
        </div>
    );
}
