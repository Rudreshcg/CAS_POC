import React, { useState, useMemo } from 'react';
import { X, Search, CheckCircle, AlertCircle, Upload } from 'lucide-react';

export default function ResultsTable({ results, totalRows }) {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [localResults, setLocalResults] = useState(results);

    // Sync local state when props change
    useMemo(() => {
        setLocalResults(results);
    }, [results]);

    const [filters, setFilters] = useState({
        commodity: '',
        sub_category: '',
        item_description: '',
        enriched_description: '',
        final_search_term: '',
        cas_number: '',
        inci_name: '',
        synonyms: '',
        validation_status: ''
    });
    const [modalContent, setModalContent] = useState(null);
    const [uploadingId, setUploadingId] = useState(null);
    const [validationMessage, setValidationMessage] = useState(null);

    // Editing state
    const [editingCell, setEditingCell] = useState(null); // {rowId, field}
    const [editValues, setEditValues] = useState({});
    const [savingRows, setSavingRows] = useState(new Set());

    // Filter and sort results
    const filteredAndSortedResults = useMemo(() => {
        let items = [...localResults];

        // Apply filters
        items = items.filter(row => {
            return Object.keys(filters).every(key => {
                if (!filters[key]) return true;
                const value = String(row[key] || '').toLowerCase();
                return value.includes(filters[key].toLowerCase());
            });
        });

        // Apply sorting
        if (sortConfig.key !== null) {
            items.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return items;
    }, [localResults, sortConfig, filters]);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleValidationUpload = async (rowId, file, documentType) => {
        setUploadingId(rowId);

        try {
            const formData = new FormData();
            if (file) {
                formData.append('file', file);
            }
            formData.append('document_type', documentType);

            const res = await fetch(`/api/validate/${rowId}`, {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (res.ok) {
                // Optimistic Update
                setLocalResults(prev => prev.map(r =>
                    r.row_number === rowId ? { ...r, ...data } : r
                ));
                const message = documentType === 'manual' ? 'Manually validated!' : `${documentType} verified!`;
                setValidationMessage({ id: rowId, type: 'success', text: message });
            } else {
                setValidationMessage({ id: rowId, type: 'error', text: data.error });
            }
        } catch (error) {
            setValidationMessage({ type: 'error', text: 'Upload failed' });
            setTimeout(() => setValidationMessage(null), 3000);
        } finally {
            setUploadingId(null);
        }
    };

    // Edit handlers
    const handleCellDoubleClick = (rowId, field) => {
        const row = localResults.find(r => r.id === rowId);
        if (row) {
            setEditingCell({ rowId, field });
            setEditValues(prev => ({ ...prev, [`${rowId}-${field}`]: row[field] || '' }));
        }
    };

    const handleEditChange = (rowId, field, value) => {
        setEditValues(prev => ({ ...prev, [`${rowId}-${field}`]: value }));
    };

    const handleSaveEdit = async (rowId) => {
        setSavingRows(prev => new Set(prev).add(rowId));

        try {
            const updates = {};
            ['enriched_description', 'cas_number', 'inci_name', 'synonyms'].forEach(field => {
                const key = `${rowId}-${field}`;
                if (editValues[key] !== undefined) {
                    updates[field] = editValues[key];
                }
            });

            const response = await fetch(`/api/results/${rowId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            if (response.ok) {
                const updatedRow = await response.json();
                setLocalResults(prev => prev.map(r => r.id === rowId ? updatedRow : r));
                setEditingCell(null);
                // Clear edit values for this row
                const newEditValues = { ...editValues };
                ['enriched_description', 'cas_number', 'inci_name', 'synonyms'].forEach(field => {
                    delete newEditValues[`${rowId}-${field}`];
                });
                setEditValues(newEditValues);
                setValidationMessage({ type: 'success', text: '✓ Changes saved!' });
                setTimeout(() => setValidationMessage(null), 3000);
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            setValidationMessage({ type: 'error', text: 'Failed to save changes' });
            setTimeout(() => setValidationMessage(null), 3000);
        } finally {
            setSavingRows(prev => {
                const newSet = new Set(prev);
                newSet.delete(rowId);
                return newSet;
            });
        }
    };

    const handleCancelEdit = (rowId) => {
        setEditingCell(null);
        const newEditValues = { ...editValues };
        ['enriched_description', 'cas_number', 'inci_name', 'synonyms'].forEach(field => {
            delete newEditValues[`${rowId}-${field}`];
        });
        setEditValues(newEditValues);
    };

    const hasUnsavedChanges = (rowId) => {
        return ['enriched_description', 'cas_number', 'inci_name', 'synonyms'].some(field => {
            return editValues[`${rowId}-${field}`] !== undefined;
        });
    };

    // Render editable cell
    const renderEditableCell = (row, field, className = "", modalTitle = null) => {
        const isEditing = editingCell?.rowId === row.id && editingCell?.field === field;
        const editKey = `${row.id}-${field}`;
        const value = editValues[editKey] !== undefined ? editValues[editKey] : row[field];

        if (isEditing) {
            return (
                <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => handleEditChange(row.id, field, e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(row.id);
                        if (e.key === 'Escape') handleCancelEdit(row.id);
                    }}
                    className="w-full bg-slate-700 border border-cyan-500 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400"
                    autoFocus
                />
            );
        }

        return (
            <span
                onClick={() => modalTitle && openModal(modalTitle, value)}
                onDoubleClick={() => handleCellDoubleClick(row.id, field)}
                className={`cursor-pointer hover:bg-slate-600/30 px-2 py-1 rounded ${editValues[editKey] !== undefined ? 'bg-yellow-900/20' : ''} ${className} ${modalTitle ? 'hover:text-cyan-400' : ''}`}
                title={modalTitle ? "Click to view, Double-click to edit" : "Double-click to edit"}
            >
                {value || ''}
            </span>
        );
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <span className="ml-2 opacity-30">↕</span>;
        return <span className="ml-2 text-cyan-400">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
    };

    const handleFilterChange = (column, value) => {
        setFilters(prev => ({ ...prev, [column]: value }));
    };

    const clearFilters = () => {
        setFilters({
            commodity: '',
            sub_category: '',
            item_description: '',
            enriched_description: '',
            final_search_term: '',
            cas_number: '',
            inci_name: '',
            synonyms: ''
        });
    };

    const openModal = (title, content) => {
        setModalContent({ title, content });
    };

    const closeModal = () => {
        setModalContent(null);
    };

    const hasActiveFilters = Object.values(filters).some(f => f !== '');

    return (
        <>
            <div className="bg-slate-800 rounded-xl shadow-xl overflow-hidden border border-slate-700 mt-8">
                {/* Filter Summary */}
                {hasActiveFilters && (
                    <div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                        <span className="text-sm text-cyan-400">
                            <Search className="inline w-4 h-4 mr-2" />
                            Showing {filteredAndSortedResults.length} of {results.length} rows (filtered)
                        </span>
                        <button
                            onClick={clearFilters}
                            className="text-xs text-slate-400 hover:text-white transition-colors px-3 py-1 rounded bg-slate-800 hover:bg-slate-700"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}

                <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-sm text-left text-slate-300">
                        <thead className="text-xs text-cyan-400 uppercase bg-slate-900 sticky top-0 z-10 shadow-sm">
                            {/* Column Headers */}
                            <tr>
                                <th className="px-6 py-3 cursor-pointer hover:bg-slate-800 select-none" onClick={() => requestSort('row_number')}>
                                    # {getSortIcon('row_number')}
                                </th>
                                <th className="px-6 py-3 cursor-pointer hover:bg-slate-800 select-none" onClick={() => requestSort('commodity')}>
                                    Commodity {getSortIcon('commodity')}
                                </th>
                                <th className="px-6 py-3 cursor-pointer hover:bg-slate-800 select-none" onClick={() => requestSort('sub_category')}>
                                    Sub-Category {getSortIcon('sub_category')}
                                </th>
                                <th className="px-6 py-3 cursor-pointer hover:bg-slate-800 select-none" onClick={() => requestSort('item_description')}>
                                    Item Description {getSortIcon('item_description')}
                                </th>
                                <th className="px-6 py-3 cursor-pointer hover:bg-slate-800 select-none" onClick={() => requestSort('enriched_description')}>
                                    Enriched Description {getSortIcon('enriched_description')}
                                </th>
                                <th className="px-6 py-3 cursor-pointer hover:bg-slate-800 select-none" onClick={() => requestSort('final_search_term')}>
                                    Search Term {getSortIcon('final_search_term')}
                                </th>
                                <th className="px-6 py-3 cursor-pointer hover:bg-slate-800 select-none" onClick={() => requestSort('cas_number')}>
                                    CAS Number {getSortIcon('cas_number')}
                                </th>
                                <th className="px-6 py-3 cursor-pointer hover:bg-slate-800 select-none" onClick={() => requestSort('inci_name')}>
                                    INCI Name {getSortIcon('inci_name')}
                                </th>
                                <th className="px-6 py-3 cursor-pointer hover:bg-slate-800 select-none" onClick={() => requestSort('synonyms')}>
                                    Synonyms {getSortIcon('synonyms')}
                                </th>
                                <th className="px-6 py-3 cursor-pointer hover:bg-slate-800 select-none" onClick={() => requestSort('confidence_score')}>
                                    Conf. {getSortIcon('confidence_score')}
                                </th>
                                <th className="px-6 py-3">
                                    Validate
                                </th>
                                <th className="px-6 py-3">
                                    Actions
                                </th>
                            </tr>

                            {/* Filter Row */}
                            <tr className="bg-slate-800/50">
                                {/* ... existing filters ... */}
                                <th className="px-6 py-2" colSpan={8}></th>
                                <th className="px-6 py-2">
                                    {/* Confidence Filter Space */}
                                </th>
                                <th className="px-6 py-2"></th>
                                <th className="px-6 py-2"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSortedResults.map((row, idx) => {
                                const found = row.cas_number !== 'NOT FOUND';
                                const isValidated = row.confidence_score === 100;

                                return (
                                    <tr key={idx} className={`border-b border-slate-700 hover:bg-slate-700/50 ${!found ? 'opacity-70' : ''}`}>
                                        <td className="px-6 py-4 font-mono text-slate-500">{row.row_number}</td>
                                        <td className="px-6 py-4 truncate max-w-[150px] cursor-pointer hover:text-cyan-400" onClick={() => openModal('Commodity', row.commodity)}>{row.commodity}</td>
                                        <td className="px-6 py-4 truncate max-w-[150px] cursor-pointer hover:text-cyan-400" onClick={() => openModal('Sub-Category', row.sub_category)}>{row.sub_category}</td>
                                        <td className="px-6 py-4 truncate max-w-[200px] cursor-pointer hover:text-cyan-400" onClick={() => openModal('Item Description', row.item_description)}>{row.item_description}</td>
                                        <td className="px-6 py-4 truncate max-w-[200px] cursor-pointer hover:text-cyan-400" onClick={() => openModal('Enriched Description', row.enriched_description)}>{row.enriched_description}</td>
                                        <td className="px-6 py-4 truncate max-w-[150px] cursor-pointer hover:text-cyan-400" onClick={() => openModal('Search Term', row.final_search_term)}>{row.final_search_term}</td>
                                        <td className="px-6 py-4 font-mono">{renderEditableCell(row, 'cas_number', 'text-cyan-400')}</td>
                                        <td className="px-6 py-4 truncate max-w-[150px]">{renderEditableCell(row, 'inci_name', 'text-slate-400', 'INCI Name')}</td>
                                        <td className="px-6 py-4 truncate max-w-[150px]">{renderEditableCell(row, 'synonyms', 'text-slate-500', 'Synonyms')}</td>

                                        {/* Confidence Column */}
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${isValidated ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
                                                {row.confidence_score || 0}%
                                            </span>
                                        </td>

                                        {/* Validation Column */}
                                        <td className="px-6 py-4">
                                            {isValidated ? (
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center text-green-400 gap-1">
                                                        <CheckCircle size={16} />
                                                        <span className="text-xs font-bold">{row.validation_status}</span>
                                                    </div>
                                                    {/* Display uploaded documents */}
                                                    {row.validation_documents && row.validation_documents.length > 0 && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {row.validation_documents.map((doc, docIdx) => (
                                                                <span key={docIdx} className="text-[10px] px-2 py-0.5 rounded bg-green-900/30 text-green-300 border border-green-700">
                                                                    {doc.type}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {/* Add more documents */}
                                                    <div className="flex gap-1">
                                                        {['MSDS', 'CoS'].map(docType => (
                                                            <label key={docType} className={`cursor-pointer inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-slate-700 hover:bg-slate-600 text-white transition-colors ${uploadingId === row.row_number ? 'opacity-50 pointer-events-none' : ''}`}>
                                                                +{docType}
                                                                <input
                                                                    type="file"
                                                                    className="hidden"
                                                                    accept=".pdf"
                                                                    onChange={(e) => {
                                                                        if (e.target.files?.[0]) handleValidationUpload(row.row_number, e.target.files[0], docType);
                                                                    }}
                                                                />
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : found ? (
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex gap-1">
                                                        {['MSDS', 'CoS', 'Other'].map(docType => (
                                                            <label key={docType} className={`cursor-pointer inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors ${uploadingId === row.row_number ? 'opacity-50 pointer-events-none' : ''}`}>
                                                                {uploadingId === row.row_number ? 'Verifying...' : docType}
                                                                {!uploadingId && <Upload size={10} />}
                                                                <input
                                                                    type="file"
                                                                    className="hidden"
                                                                    accept=".pdf"
                                                                    onChange={(e) => {
                                                                        if (e.target.files?.[0]) handleValidationUpload(row.row_number, e.target.files[0], docType);
                                                                    }}
                                                                />
                                                            </label>
                                                        ))}
                                                    </div>
                                                    {/* Manual Confirm Button */}
                                                    <button
                                                        onClick={() => handleValidationUpload(row.row_number, null, 'manual')}
                                                        className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold"
                                                    >
                                                        ✓ Confirm
                                                    </button>
                                                    {validationMessage?.id === row.row_number && (
                                                        <span className={`text-[10px] ${validationMessage.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                                                            {validationMessage.text}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-slate-600 text-xs">-</span>
                                            )}
                                        </td>

                                        {/* Actions Column */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-2">
                                                {/* Save/Cancel buttons for edited rows */}
                                                {hasUnsavedChanges(row.id) && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleSaveEdit(row.id)}
                                                            disabled={savingRows.has(row.id)}
                                                            className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-semibold disabled:opacity-50"
                                                        >
                                                            {savingRows.has(row.id) ? 'Saving...' : '✓ Save'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleCancelEdit(row.id)}
                                                            disabled={savingRows.has(row.id)}
                                                            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-semibold disabled:opacity-50"
                                                        >
                                                            ✗ Cancel
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="bg-slate-900 p-4 text-center text-slate-400 text-xs">
                    Showing {filteredAndSortedResults.length} of {totalRows} rows
                    {hasActiveFilters && ` (${results.length - filteredAndSortedResults.length} filtered out)`}
                </div>
            </div >

            {/* Modal */}
            {
                modalContent && (
                    <div
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={closeModal}
                    >
                        <div
                            className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 max-w-3xl w-full max-h-[80vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-6 border-b border-slate-700">
                                <h3 className="text-xl font-bold text-cyan-400">{modalContent.title}</h3>
                                <button
                                    onClick={closeModal}
                                    className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 overflow-y-auto flex-1">
                                <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                                    <p className="text-slate-200 whitespace-pre-wrap break-words leading-relaxed">
                                        {modalContent.content}
                                    </p>
                                </div>

                                {/* For synonyms, show them as a list */}
                                {modalContent.title === 'Synonyms' && modalContent.content && modalContent.content !== 'N/A' && (
                                    <div className="mt-4">
                                        <h4 className="text-sm font-semibold text-slate-400 mb-2">Synonym List:</h4>
                                        <ul className="space-y-1">
                                            {modalContent.content.split('|').map((syn, i) => (
                                                <li key={i} className="text-sm text-slate-300 bg-slate-900/50 px-3 py-2 rounded border-l-2 border-cyan-500">
                                                    {syn.trim()}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-slate-700 flex justify-end">
                                <button
                                    onClick={closeModal}
                                    className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors font-medium"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
}
