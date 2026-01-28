import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDendrogram } from './DendrogramContext';
import { MessageSquare, Check, X, Trash2, Plus } from 'lucide-react';

export function CommentPopover({ node, children, open, onOpenChange }) {
    const { addNodeAnnotation, deleteNodeAnnotation } = useDendrogram();
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'add'

    // Add Form State
    const [isQuestion, setIsQuestion] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [questionText, setQuestionText] = useState('');
    const [answerText, setAnswerText] = useState('');

    // Position state
    const [position, setPosition] = useState({ top: 0, left: 0 });

    const popoverRef = useRef(null);
    const annotations = node.annotations || [];

    // Reset state and calculate position on open
    useEffect(() => {
        if (open) {
            setViewMode(annotations.length > 0 ? 'list' : 'add');
            resetForm();

            // Calculate position
            if (popoverRef.current) {
                const rect = popoverRef.current.getBoundingClientRect();
                const POPOVER_MAX_HEIGHT = 400;
                const PADDING = 12;

                // Fixed positioning uses viewport coordinates directly
                let top = rect.top;
                const left = rect.right + 12;

                // Clamp to viewport
                const viewportHeight = window.innerHeight;
                if (top + POPOVER_MAX_HEIGHT > viewportHeight) {
                    top = Math.max(PADDING, viewportHeight - POPOVER_MAX_HEIGHT - PADDING);
                }

                setPosition({
                    top,
                    left
                });
            }
        }
    }, [open, node.id, annotations.length]);

    const resetForm = () => {
        setIsQuestion(false);
        setCommentText('');
        setQuestionText('');
        setAnswerText('');
    };

    // Close on click outside (updated for Portal)
    useEffect(() => {
        function handleClickOutside(event) {
            // Check if click is inside the trigger (popoverRef) using standard DOM check
            if (popoverRef.current && popoverRef.current.contains(event.target)) {
                return;
            }

            // For/Inside Portal content, we need to check if the target is within the portal container.
            const portalContent = document.getElementById(`popover-${node.id}`);
            if (portalContent && portalContent.contains(event.target)) {
                return;
            }

            onOpenChange(false);
        }

        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
            window.addEventListener("scroll", () => onOpenChange(false), { capture: true }); // Close on scroll
            window.addEventListener("resize", () => onOpenChange(false));
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("scroll", () => onOpenChange(false), { capture: true });
            window.removeEventListener("resize", () => onOpenChange(false));
        };
    }, [open, onOpenChange, node.id]);


    const handleSave = () => {
        addNodeAnnotation(node, {
            isQuestion,
            text: isQuestion ? questionText : commentText,
            answer: isQuestion ? answerText : null
        });
        setViewMode('list');
        resetForm();
        // Keep popover open
    };

    const handleDelete = (id) => {
        deleteNodeAnnotation(node, id);
    };

    return (
        <>
            <div ref={popoverRef} className="inline-block relative">
                {/* Trigger */}
                {children}
            </div>

            {/* Portal Content */}
            {open && createPortal(
                <div
                    id={`popover-${node.id}`}
                    style={{ top: position.top, left: position.left }}
                    className="fixed z-[9999] w-80 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[400px]"
                >
                    <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-cyan-500/20">
                                <MessageSquare className="w-4 h-4 text-cyan-500" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm text-slate-200">Annotations</h4>
                                <p className="text-xs text-slate-400 truncate max-w-[200px]">{node.name}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {viewMode === 'list' && (
                            <div className="space-y-3">
                                {annotations.length === 0 ? (
                                    <div className="text-center py-4 text-slate-500 text-sm">
                                        No annotations yet.
                                    </div>
                                ) : (
                                    annotations.map((ann, i) => (
                                        <div key={ann.id || i} className="bg-slate-800/50 rounded p-3 border border-slate-700/50 group relative">
                                            <button
                                                onClick={() => handleDelete(ann.id)}
                                                className="absolute top-2 right-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>

                                            <div className="flex items-start gap-2 pr-4">
                                                {ann.annotation_type === 'qa' ? (
                                                    <div className={`mt-0.5 w-2 h-2 rounded-full ${ann.is_open ? 'bg-amber-500' : 'bg-cyan-500'}`} />
                                                ) : (
                                                    <div className="mt-0.5 w-2 h-2 rounded-full bg-slate-400" />
                                                )}

                                                <div className="text-sm">
                                                    {ann.annotation_type === 'qa' ? (
                                                        <>
                                                            <div className="font-medium text-slate-200 mb-1">{ann.question}</div>
                                                            {ann.answer ? (
                                                                <div className="text-slate-400 text-xs border-l-2 border-slate-700 pl-2">
                                                                    {ann.answer}
                                                                </div>
                                                            ) : (
                                                                <div className="text-amber-500/70 text-xs italic">Open Question</div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <div className="text-slate-300">{ann.content}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}

                                <button
                                    onClick={() => setViewMode('add')}
                                    className="w-full py-2 flex items-center justify-center gap-2 text-xs font-medium text-cyan-400 hover:bg-cyan-950/30 border border-dashed border-cyan-900/50 rounded transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Add Note or Question
                                </button>
                            </div>
                        )}

                        {viewMode === 'add' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <input
                                        type="checkbox"
                                        id="is-question"
                                        checked={isQuestion}
                                        onChange={(e) => setIsQuestion(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-slate-900"
                                    />
                                    <label htmlFor="is-question" className="text-sm text-slate-300 select-none cursor-pointer">
                                        Mark as Question
                                    </label>
                                </div>

                                {isQuestion ? (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">Question</label>
                                            <textarea
                                                placeholder="What needs clarification?"
                                                value={questionText}
                                                onChange={(e) => setQuestionText(e.target.value)}
                                                className="w-full min-h-[60px] bg-slate-800/50 border border-slate-700 rounded-md p-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none border-l-2 border-l-amber-500/50"
                                                autoFocus
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">Answer (Optional)</label>
                                            <textarea
                                                placeholder="Add answer..."
                                                value={answerText}
                                                onChange={(e) => setAnswerText(e.target.value)}
                                                className="w-full min-h-[60px] bg-slate-800/50 border border-slate-700 rounded-md p-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1">Comment</label>
                                        <textarea
                                            placeholder="Add a note or description..."
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            className="w-full min-h-[100px] bg-slate-800/50 border border-slate-700 rounded-md p-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
                                            autoFocus
                                        />
                                    </div>
                                )}

                                <div className="flex gap-2 justify-end pt-3 mt-2 border-t border-slate-800">
                                    <button
                                        onClick={() => {
                                            if (annotations.length > 0) setViewMode('list');
                                            else onOpenChange(false);
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-cyan-600 text-white hover:bg-cyan-500 rounded transition-colors shadow-sm"
                                    >
                                        <Check className="w-4 h-4" />
                                        Save
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
