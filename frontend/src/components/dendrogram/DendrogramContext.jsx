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
    const [tree, setTree] = useState(initialTree);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
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

            // Update local tree with new annotation
            setTree(prev => updateNode(prev, node.id, (n) => ({
                annotations: [...(n.annotations || []), newAnn]
            })));
        } catch (err) {
            console.error(err);
        }
    }, []);

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
    }, []);

    const moveNode = useCallback((sourceId, targetId, position) => {
        if (sourceId === targetId) return;
        if (sourceId === 'root') return;

        setTree(prev => {
            // Prevent moving a node into its own descendant
            if (isDescendant(prev, sourceId, targetId)) return prev;

            const nodeToMove = findNode(prev, sourceId);
            if (!nodeToMove) return prev;

            // Remove the node from its current position
            const treeWithoutNode = removeNode(prev, sourceId);

            // Insert the node at the new position
            return insertNode(treeWithoutNode, nodeToMove, targetId, position);
        });
    }, []);

    return (
        <DendrogramContext.Provider
            value={{
                tree,
                setTree,
                dragState,
                setDragState,
                addNodeAnnotation,
                deleteNodeAnnotation,
                moveNode,
                selectedNodeId,
                setSelectedNodeId
            }}
        >
            {children}
        </DendrogramContext.Provider>
    );
}
