import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Settings, Plus, Trash2, Save, X, ArrowLeft } from 'lucide-react';

export default function EnrichmentRules() {
    const [rules, setRules] = useState([]);
    const [formData, setFormData] = useState({
        sub_category: '',
        identifier_name: 'CAS',
        parameters: []
    });
    const [newParam, setNewParam] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            const res = await fetch('/api/rules');
            const data = await res.json();
            setRules(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddParam = () => {
        if (newParam.trim()) {
            setFormData({
                ...formData,
                parameters: [...formData.parameters, newParam.trim()]
            });
            setNewParam('');
        }
    };

    const handleRemoveParam = (index) => {
        const newParams = formData.parameters.filter((_, i) => i !== index);
        setFormData({ ...formData, parameters: newParams });
    };

    const handleSave = async () => {
        try {
            const res = await fetch('/api/rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                setMessage({ type: 'success', text: 'Rule saved successfully!' });
                fetchRules();
                setFormData({ sub_category: '', identifier_name: 'CAS', parameters: [] });
            } else {
                setMessage({ type: 'error', text: data.error });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save rule' });
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this rule?')) return;
        try {
            const res = await fetch(`/api/rules/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchRules();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleEdit = (rule) => {
        setFormData({
            sub_category: rule.sub_category,
            identifier_name: rule.identifier_name,
            parameters: rule.parameters
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl text-slate-300">
            <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
                <ArrowLeft size={20} /> Back to Dashboard
            </Link>

            <h1 className="text-3xl font-bold mb-8 flex items-center text-white">
                <Settings className="mr-3 text-cyan-400" /> Enrichment Rules
            </h1>

            {message && (
                <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                    {message.text}
                </div>
            )}

            {/* Form */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg mb-8">
                <h2 className="text-xl font-bold text-white mb-4">Add / Edit Rule</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">Sub-Category (Exact Match)</label>
                        <input
                            type="text"
                            value={formData.sub_category}
                            onChange={(e) => setFormData({ ...formData, sub_category: e.target.value })}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                            placeholder="e.g. Glycerin"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Identifier Name</label>
                        <input
                            type="text"
                            value={formData.identifier_name}
                            onChange={(e) => setFormData({ ...formData, identifier_name: e.target.value })}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                            placeholder="e.g. CAS"
                        />
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Parameters</label>
                    <div className="flex gap-2 mb-3">
                        <input
                            type="text"
                            value={newParam}
                            onChange={(e) => setNewParam(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddParam()}
                            className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                            placeholder="Add a parameter (e.g. Purity, Grade)"
                        />
                        <button
                            onClick={handleAddParam}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {formData.parameters.map((param, idx) => (
                            <span key={idx} className="bg-slate-900 border border-slate-600 px-3 py-1 rounded-full text-sm flex items-center">
                                {param}
                                <button onClick={() => handleRemoveParam(idx)} className="ml-2 text-red-400 hover:text-red-300">
                                    <X size={14} />
                                </button>
                            </span>
                        ))}
                        {formData.parameters.length === 0 && <span className="text-slate-500 text-sm italic">No parameters added</span>}
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg flex justify-center items-center gap-2"
                >
                    <Save size={18} /> Save Rule
                </button>
            </div>

            {/* List */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white mb-4">Existing Rules</h2>
                {rules.map(rule => (
                    <div key={rule.id} className="bg-slate-800 rounded-xl p-6 border border-slate-700 flex justify-between items-center group hover:border-cyan-500/50 transition-colors">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-bold text-cyan-400">{rule.sub_category}</h3>
                                <span className="bg-slate-900 text-xs px-2 py-1 rounded border border-slate-600">ID: {rule.identifier_name}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {rule.parameters.map((p, i) => (
                                    <span key={i} className="text-sm text-slate-400 bg-slate-900/50 px-2 py-0.5 rounded">{p}</span>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(rule)} className="p-2 text-slate-400 hover:text-cyan-400 transition-colors">
                                <Settings size={18} />
                            </button>
                            <button onClick={() => handleDelete(rule.id)} className="p-2 text-slate-400 hover:text-red-400 transition-colors">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
                {rules.length === 0 && <p className="text-center text-slate-500">No enrichment rules defined.</p>}
            </div>
        </div>
    );
}
