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

    // Purity Rules State
    const [purityRules, setPurityRules] = useState([]);
    const [newRule, setNewRule] = useState({ label: '', operator: '<', value: '', min: '', max: '' });

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
                    setPurityRules(rule.purity_rules || []);
                } else {
                    // Default if no rule exists yet
                    setParameters(['Grade', 'Purity', 'Color']);
                    setIdentifierName('CAS');
                    setPurityRules([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                // Fallback to defaults on error
                setParameters(['Grade', 'Purity', 'Color']);
                setIdentifierName('CAS');
                setPurityRules([]);
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

    const handleAddRule = () => {
        if (!newRule.label) return;
        const ruleToAdd = { ...newRule };
        setPurityRules([...purityRules, ruleToAdd]);
        setNewRule({ label: '', operator: '<', value: '', min: '', max: '' });
    };

    const handleRemoveRule = (index) => {
        setPurityRules(purityRules.filter((_, i) => i !== index));
    };

    const handleSaveConfig = async () => {
        if (!selectedSubcategory) {
            setMessage({ type: 'error', text: 'Please select a subcategory.' });
            return;
        }

        try {
            let finalPurityRules = [...purityRules];

            // Check if there's a pending rule that wasn't added
            let pendingRule = { ...newRule };
            let hasContent = pendingRule.label.trim() || pendingRule.value || pendingRule.min || pendingRule.max;

            if (hasContent) {
                // Auto-generate label if missing
                if (!pendingRule.label.trim()) {
                    if (pendingRule.operator === 'range') {
                        pendingRule.label = `${pendingRule.min}-${pendingRule.max}`;
                    } else {
                        pendingRule.label = `${pendingRule.operator} ${pendingRule.value}`;
                    }
                }

                // Only add if we have a valid label now
                if (pendingRule.label.trim()) {
                    finalPurityRules.push(pendingRule);
                }
            }

            const payload = {
                sub_category: selectedSubcategory,
                identifier_name: identifierName,
                parameters: parameters,
                purity_rules: finalPurityRules
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

                            {/* Purity Configuration Section */}
                            {parameters.some(p => p && p.toString().toLowerCase().trim() === 'purity') && (
                                <div className="mb-6 border-t border-slate-700 pt-4">
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Purity Grouping Rules</label>
                                    <p className="text-xs text-slate-500 mb-3">
                                        Define how purity ranges should be grouped. Rules are checked in order.
                                    </p>

                                    <div className="space-y-2 mb-3">
                                        {purityRules.length === 0 && (
                                            <div className="text-center p-3 border border-dashed border-slate-700 rounded-lg text-slate-500 text-xs">
                                                No rules defined. Exact values will be used.
                                            </div>
                                        )}
                                        {purityRules.map((rule, idx) => (
                                            <div key={idx} className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 p-2 rounded-lg text-sm group hover:border-slate-600 transition-colors">
                                                <span className="font-mono text-cyan-400 font-bold w-6">{idx + 1}.</span>
                                                <div className="flex-1 text-slate-200 flex items-center gap-2">
                                                    <span className="font-bold text-white bg-slate-700 px-2 rounded">{rule.label}</span>
                                                    <span className="text-slate-500">is</span>
                                                    <span className="font-mono text-xs bg-slate-900 px-1 py-0.5 rounded border border-slate-700 text-cyan-300">
                                                        {rule.operator === 'range'
                                                            ? `${rule.min} - ${rule.max}`
                                                            : `${rule.operator} ${rule.value}`}
                                                    </span>
                                                </div>
                                                <button onClick={() => handleRemoveRule(idx)} className="text-slate-500 hover:text-red-400 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex flex-wrap gap-2 items-end bg-slate-800/30 p-3 rounded-lg border border-slate-700/50">
                                        <div className="flex-1 min-w-[120px]">
                                            <label className="text-xs text-slate-500 block mb-1">Label (e.g. &lt; 90)</label>
                                            <input
                                                type="text"
                                                className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:ring-1 focus:ring-cyan-500 outline-none"
                                                value={newRule.label}
                                                onChange={e => setNewRule({ ...newRule, label: e.target.value })}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
                                                placeholder="Label (Optional)"
                                            />
                                        </div>
                                        <div className="w-24">
                                            <label className="text-xs text-slate-500 block mb-1">Condition</label>
                                            <select
                                                className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:ring-1 focus:ring-cyan-500 outline-none"
                                                value={newRule.operator}
                                                onChange={e => setNewRule({ ...newRule, operator: e.target.value })}
                                            >
                                                <option value="<">&lt; Less</option>
                                                <option value=">">&gt; Greater</option>
                                                <option value="range">Range</option>
                                            </select>
                                        </div>

                                        {newRule.operator === 'range' ? (
                                            <>
                                                <div className="w-20">
                                                    <label className="text-xs text-slate-500 block mb-1">Min</label>
                                                    <input
                                                        type="number"
                                                        className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:ring-1 focus:ring-cyan-500 outline-none"
                                                        value={newRule.min}
                                                        onChange={e => setNewRule({ ...newRule, min: e.target.value })}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div className="w-20">
                                                    <label className="text-xs text-slate-500 block mb-1">Max</label>
                                                    <input
                                                        type="number"
                                                        className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:ring-1 focus:ring-cyan-500 outline-none"
                                                        value={newRule.max}
                                                        onChange={e => setNewRule({ ...newRule, max: e.target.value })}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
                                                        placeholder="100"
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                            <div className="w-24">
                                                <label className="text-xs text-slate-500 block mb-1">Value</label>
                                                <input
                                                    type="number"
                                                    className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:ring-1 focus:ring-cyan-500 outline-none"
                                                    value={newRule.value}
                                                    onChange={e => setNewRule({ ...newRule, value: e.target.value })}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
                                                    placeholder="90"
                                                />
                                            </div>
                                        )}

                                        <button
                                            onClick={handleAddRule}
                                            disabled={!newRule.label}
                                            className="bg-cyan-600 hover:bg-cyan-500 text-white h-[34px] w-[34px] flex items-center justify-center rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}

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
