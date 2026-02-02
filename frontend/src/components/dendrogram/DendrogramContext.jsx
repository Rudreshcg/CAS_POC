import React, { createContext, useContext, useState, useCallback } from 'react';

const DendrogramContext = createContext(null);

export function useDendrogram() {
    const context = useContext(DendrogramContext);
    if (!context) {
        throw new Error('useDendrogram must be used within a DendrogramProvider');
    }
    return context;
}

function findNode(node, id) {
    if (node.id === id) return node;
    if (node.children) {
        for (const child of node.children) {
            const found = findNode(child, id);
            if (found) return found;
        }
    }
    return null;
}

function removeNode(node, id) {
    if (!node.children) return node;
    return {
        ...node,
        children: node.children
            .filter(child => child.id !== id)
            .map(child => removeNode(child, id))
    };
}

function isDescendant(node, ancestorId, descendantId) {
    const ancestor = findNode(node, ancestorId);
    if (!ancestor) return false;
    return findNode(ancestor, descendantId) !== null;
}

function updateNode(node, id, updater) {
    if (node.id === id) {
        const updates = updater(node);
        // Auto-recalculate summary fields if annotations changed
        if (updates.annotations) {
            const anns = updates.annotations;
            const has_open = anns.some(a => a.annotation_type === 'qa' && a.is_open);
            const count = anns.length;
            let comment = "";
            if (count === 1) {
                const first = anns[0];
                comment = first.annotation_type === 'qa'
                    ? `Q: ${first.question}`
                    : first.content;
            } else if (count > 0) {
                comment = `${count} annotations`;
            }

            return { ...node, ...updates, has_open_qa: has_open, comment };
        }
        return { ...node, ...updates };
    }
    if (node.children) {
        return {
            ...node,
            children: node.children.map(child => updateNode(child, id, updater))
        };
    }
    return node;
}

function insertNode(tree, nodeToInsert, targetId, position) {
    if (position === 'inside') {
        if (tree.id === targetId) {
            return {
                ...tree,
                children: [...(tree.children || []), nodeToInsert]
            };
        }
        if (tree.children) {
            return {
                ...tree,
                children: tree.children.map(child => insertNode(child, nodeToInsert, targetId, position))
            };
        }
        return tree;
    }

    if (tree.children) {
        const targetIndex = tree.children.findIndex(child => child.id === targetId);
        if (targetIndex !== -1) {
            const newChildren = [...tree.children];
            const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
            newChildren.splice(insertIndex, 0, nodeToInsert);
            return { ...tree, children: newChildren };
        }
        return {
            ...tree,
            children: tree.children.map(child => insertNode(child, nodeToInsert, targetId, position))
        };
    }
    return tree;
}

// Initial placeholder tree
const initialTree = {
    id: 'root',
    name: 'Material Clusters',
    children: []
};

export function DendrogramProvider({ children }) {
    // Standard setTree
    const [tree, setTree] = useState(initialTree);
    const [history, setHistory] = useState([]);
    const [selectedNodeId, setSelectedNodeId] = useState(null);

    // Helper to push to history manually
    const pushHistory = useCallback((oldTree) => {
        setHistory(prev => [...prev, oldTree]);
    }, []);

    const undo = useCallback(() => {
        setHistory(prev => {
            if (prev.length === 0) return prev;
            const previousTree = prev[prev.length - 1];
            const newHistory = prev.slice(0, -1);
            setTree(previousTree);
            return newHistory;
        });
    }, []);

    const canUndo = history.length > 0;
    const [dragState, setDragState] = useState({
        draggedNodeId: null,
        targetNodeId: null,
        targetPosition: null
    });

    const addNodeAnnotation = useCallback(async (node, data) => {
        // data: { isQuestion, text, answer }
        if (!node.type || !node.identifier) {
            console.warn("Cannot save annotation: Missing node type/identifier", node);
            return;
        }

        const payload = {
            node_type: node.type,
            node_identifier: node.identifier,
            annotation_type: data.isQuestion ? 'qa' : 'info',
            [data.isQuestion ? 'question' : 'content']: data.text,
            answer: data.isQuestion ? data.answer : null
        };

        // Optimistic Update can be tricky without an ID. 
        // We'll generate a temp ID or just wait for server? 
        // Let's wait for server for 'add' to get the real ID for deletion.
        // Or assume success and reload tree? Reloading is safest but potentially slow.
        // Let's try to update state with a temp ID if possible, or just append.

        try {
            const res = await fetch('/api/annotations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('Failed to save annotation');
            const newAnn = await res.json();

            // Push history before update
            pushHistory(tree);
            // Update local tree with new annotation
            setTree(prev => updateNode(prev, node.id, (n) => ({
                annotations: [...(n.annotations || []), newAnn]
            })));
        } catch (err) {
            console.error(err);
        }
    }, [tree, pushHistory]);

    const deleteNodeAnnotation = useCallback(async (node, annotationId) => {
        // Optimistic delete
        setTree(prev => updateNode(prev, node.id, (n) => ({
            annotations: (n.annotations || []).filter(a => a.id !== annotationId)
        })));

        try {
            await fetch(`/api/annotations/${annotationId}`, { method: 'DELETE' });
        } catch (err) {
            console.error(err);
            // Revert?
        }
    }, [tree, pushHistory]);

    const updateNodeAnnotation = useCallback(async (node, annotationId, updates) => {
        // updates: { answer: "..." }
        // Optimistic Update
        setTree(prev => updateNode(prev, node.id, (n) => ({
            annotations: (n.annotations || []).map(a =>
                a.id === annotationId ? { ...a, ...updates, is_open: !updates.answer } : a
            )
        })));

        try {
            const res = await fetch(`/api/annotations/${annotationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            if (!res.ok) throw new Error('Failed to update annotation');
        } catch (err) {
            console.error(err);
        }
    }, [tree, pushHistory]);

    const updateNodeName = useCallback(async (node, newName) => {
        if (!node.identifier || node.type !== 'material') return;

        // Optimistic update
        setTree(prev => updateNode(prev, node.id, (n) => ({
            name: newName
        })));

        try {
            const targetId = node.db_id || node.id;
            const res = await fetch(`/api/results/${targetId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ item_description: newName })
            });
            if (!res.ok) throw new Error('Failed to update node name');
        } catch (err) {
            console.error(err);
            // Revert?
        }
    }, [tree, pushHistory]);

    const moveNode = useCallback((sourceId, targetId, position) => {
        if (sourceId === targetId) return;
        if (sourceId === 'root') return;

        // Calculate new tree from current tree (closure) to check validity
        // Note: We need 'tree' in dependency to have fresh closure

        // Prevent moving a node into its own descendant
        if (isDescendant(tree, sourceId, targetId)) return;

        const nodeToMove = findNode(tree, sourceId);
        if (!nodeToMove) return;

        // Push history
        pushHistory(tree);

        setTree(prev => {
            console.log(`[Dendrogram] Moving ${sourceId} to ${targetId} (${position})`);

            // Remove the node from its current position
            const treeWithoutNode = removeNode(prev, sourceId);
            console.log('[Dendrogram] Tree after removal:', treeWithoutNode);

            // Insert the node at the new position
            const newTree = insertNode(treeWithoutNode, nodeToMove, targetId, position);
            console.log('[Dendrogram] Tree after insertion:', newTree);

            return newTree;
        });

        // AUTO-SAVE REMOVED.
        // User must click "Save Layout" to persist.
    }, [tree, pushHistory]);

    // Manual Save Function
    const saveLayout = useCallback(async () => {
        // We need to extract all Manual Overrides from the current tree.
        // Traverse tree, finding all 'material' nodes (or any moved node).
        // Since we don't track *which* are moved locally vs original, 
        // we can just sync ALL material positions.
        // Or better: We specifically look for materials and send their current parent.

        const overrides = [];

        const traverse = (node, parentId) => {
            if (node.id !== 'root' && parentId) {
                // Save ALL nodes allowing groups/params to be moved and persisted.
                // We capture the entire current state.
                overrides.push({ node_id: node.id, parent_id: parentId });
            }
            if (node.children) {
                node.children.forEach(child => traverse(child, node.id));
            }
        };

        if (tree.children) {
            tree.children.forEach(child => traverse(child, tree.id));
        }

        console.log("Saving Layout Overrides:", overrides);

        try {
            const res = await fetch('/api/clusters/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(overrides)
            });
            if (!res.ok) throw new Error("Failed to save layout");
            alert("Layout saved successfully!");
        } catch (e) {
            console.error(e);
            alert("Error saving layout.");
        }
    }, [tree]);

    return (
        <DendrogramContext.Provider
            value={{
                tree,
                setTree,
                dragState,
                setDragState,
                addNodeAnnotation,
                deleteNodeAnnotation,
                updateNodeAnnotation,
                updateNodeName,
                moveNode,
                selectedNodeId,
                setSelectedNodeId,
                undo,
                canUndo,
                saveLayout // Exported
            }}
        >
            {children}
        </DendrogramContext.Provider>
    );
}
