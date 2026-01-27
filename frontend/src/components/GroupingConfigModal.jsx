import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, ArrowUp, ArrowDown, Settings } from 'lucide-react';

export default function GroupingConfigModal({ isOpen, onClose, onSave }) {
    if (!isOpen) return null;

    const [subcategories, setSubcategories] = useState([]);
    const [selectedSubcategory, setSelectedSubcategory] = useState('');

    // Parameters state
    const [parameters, setParameters] = useState([]); // List of strings
    const [newParam, setNewParam] = useState('');
    const [identifierName, setIdentifierName] = useState('CAS'); // Default, though usually static

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        // Fetch Subcategories
        fetch('/api/subcategories')
            .then(res => res.json())
            .then(data => {
                setSubcategories(data);
                if (data.length > 0 && !selectedSubcategory) {
                    // Don't auto-select to avoid confusion, let user pick
                }
            })
            .catch(err => console.error(err));
    }, []);

    // Fetch existing rule when subcategory changes
    useEffect(() => {
        if (!selectedSubcategory) {
            setParameters(['Grade', 'Purity', 'Color']); // Default defaults
            return;
        }

        setLoading(true);
        fetch('/api/rules')
            .then(res => res.json())
            .then(rules => {
                const rule = rules.find(r => r.sub_category === selectedSubcategory);
                if (rule) {
                    setParameters(rule.parameters || []);
                    setIdentifierName(rule.identifier_name || 'CAS');
                } else {
                    // Default if no rule exists yet
                    setParameters(['Grade', 'Purity', 'Color']);
                    setIdentifierName('CAS');
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [selectedSubcategory]);

    const handleAddParam = () => {
        if (newParam.trim()) {
            setParameters([...parameters, newParam.trim()]);
            setNewParam('');
        }
    };

    const handleRemoveParam = (index) => {
        const newParams = parameters.filter((_, i) => i !== index);
        setParameters(newParams);
    };

    const handleMoveUp = (index) => {
        if (index === 0) return;
        const newParams = [...parameters];
        [newParams[index - 1], newParams[index]] = [newParams[index], newParams[index - 1]];
        setParameters(newParams);
    };

    const handleMoveDown = (index) => {
        if (index === parameters.length - 1) return;
        const newParams = [...parameters];
        [newParams[index + 1], newParams[index]] = [newParams[index], newParams[index + 1]];
        setParameters(newParams);
    };

    const handleSaveConfig = async () => {
        if (!selectedSubcategory) {
            setMessage({ type: 'error', text: 'Please select a subcategory.' });
            return;
        }

        try {
            const payload = {
                sub_category: selectedSubcategory,
                identifier_name: identifierName,
                parameters: parameters
            };

            const res = await fetch('/api/rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                setMessage({ type: 'success', text: 'Configuration saved!' });
                if (onSave) onSave(); // Check if we should close or just notify
                setTimeout(() => setMessage(null), 2000);
            } else {
                setMessage({ type: 'error', text: data.error });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save configuration.' });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Settings className="text-cyan-400" size={20} />
                        Configure Grouping
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">

                    {message && (
                        <div className={`p-3 rounded-lg mb-4 text-sm font-medium ${message.type === 'success' ? 'bg-green-900/30 text-green-400 border border-green-500/30' : 'bg-red-900/30 text-red-400 border border-red-500/30'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-300 mb-2">Select Subcategory to Configure</label>
                        <select
                            value={selectedSubcategory}
                            onChange={(e) => setSelectedSubcategory(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                        >
                            <option value="">-- Select Subcategory --</option>
                            {subcategories.map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-2">
                            Rules define the hierarchy: Brand → CAS → <span className="text-cyan-400">[Your Params]</span> → Material
                        </p>
                    </div>

                    {selectedSubcategory && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-300 mb-2">Hierarchy Parameters (In Order)</label>

                                <div className="space-y-2 mb-4">
                                    {parameters.map((param, index) => (
                                        <div key={index} className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 p-2 rounded-lg group hover:border-slate-600 transition-colors">
                                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 text-xs text-slate-400 font-mono">
                                                {index + 1}
                                            </span>
                                            <span className="flex-1 font-medium text-slate-200">{param}</span>

                                            <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleMoveUp(index)}
                                                    disabled={index === 0}
                                                    className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-cyan-400 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                                                >
                                                    <ArrowUp size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleMoveDown(index)}
                                                    disabled={index === parameters.length - 1}
                                                    className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-cyan-400 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                                                >
                                                    <ArrowDown size={16} />
                                                </button>
                                                <div className="w-px h-4 bg-slate-700 mx-1"></div>
                                                <button
                                                    onClick={() => handleRemoveParam(index)}
                                                    className="p-1 hover:bg-red-900/30 rounded text-slate-400 hover:text-red-400"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {parameters.length === 0 && (
                                        <div className="text-center p-4 border border-dashed border-slate-700 rounded-lg text-slate-500 text-sm">
                                            No parameters defined. Hierarchy will be flat after CAS.
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newParam}
                                        onChange={(e) => setNewParam(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddParam()}
                                        className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                        placeholder="Add parameter (e.g. Viscosity)"
                                    />
                                    <button
                                        onClick={handleAddParam}
                                        disabled={!newParam.trim()}
                                        className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>

                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 bg-slate-800/50 flex justify-end gap-3 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-400 hover:text-white font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveConfig}
                        disabled={!selectedSubcategory || loading}
                        className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg shadow-lg hover:shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Save size={18} />
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
}
