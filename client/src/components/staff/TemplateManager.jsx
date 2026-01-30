import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Plus, Edit2, Trash2, Save, X, FileText, Loader2, Eye, EyeOff, Archive } from 'lucide-react';
import RichTextEditor from '../common/RichTextEditor';
import { useModal } from '../../context/ModalContext';
import DataTable from '../common/DataTable';

const TemplateManager = ({ isMobile }) => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState({ title: '', content: '', amount: 2000, status: 'active' });
    const { showModal } = useModal();

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await api.get('/affidavits/templates');
            setTemplates(res.data);
        } catch (error) {
            console.error('Error fetching templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!currentTemplate.title || !currentTemplate.content) {
            showModal({
                type: 'warning',
                title: 'Missing Fields',
                message: 'Title and Content are required to save a template.'
            });
            return;
        }

        setSaving(true);
        try {
            const data = {
                ...currentTemplate,
                amount: parseFloat(currentTemplate.amount) || 0
            };

            if (currentTemplate.id) {
                await api.put(`/affidavits/templates/${currentTemplate.id}`, data);
            } else {
                await api.post('/affidavits/templates', data);
            }
            showModal({
                type: 'success',
                title: 'Success',
                message: 'Template saved successfully!'
            });
            setIsEditing(false);
            fetchTemplates();
            setCurrentTemplate({ title: '', content: '', amount: 2000, status: 'active' });
        } catch (error) {
            console.error('Error saving template:', error);
            const msg = error.response?.data?.error || error.message;
            showModal({
                type: 'error',
                title: 'Save Failed',
                message: `Failed to save template: ${msg}. If you included large images, they might exceed server limits.`
            });
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = async (template) => {
        const newStatus = template.status === 'active' ? 'draft' : 'active';
        try {
            await api.put(`/affidavits/templates/${template.id}`, {
                ...template,
                status: newStatus
            });
            setTemplates(prev => prev.map(t => t.id === template.id ? { ...t, status: newStatus } : t));
        } catch (error) {
            console.error("Failed to toggle status", error);
            showModal({ type: 'error', title: 'Error', message: 'Failed to update status' });
        }
    };

    const handleDelete = async (id) => {
        showModal({
            type: 'warning',
            title: 'Delete Template?',
            message: 'Are you sure you want to delete this template? This action cannot be undone.',
            showCancel: true,
            confirmText: 'Yes, Delete',
            onConfirm: async () => {
                try {
                    await api.delete(`/affidavits/templates/${id}`);
                    fetchTemplates();
                    showModal({
                        type: 'success',
                        title: 'Deleted',
                        message: 'Template deleted successfully.'
                    });
                } catch (error) {
                    console.error('Error deleting template:', error);
                    showModal({
                        type: 'error',
                        title: 'Action Failed',
                        message: 'Failed to delete template.'
                    });
                }
            }
        });
    };

    if (isEditing) {
        return (
            <div className="glass-card" style={{ background: 'white', padding: isMobile ? '1rem' : '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                    <h2>{currentTemplate.id ? 'Edit Template' : 'Create New Template'}</h2>
                    <button onClick={() => setIsEditing(false)} className="btn btn-secondary">
                        <X size={20} /> Cancel
                    </button>
                </div>

                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Template Title</label>
                            <input
                                type="text"
                                value={currentTemplate.title}
                                onChange={(e) => setCurrentTemplate({ ...currentTemplate, title: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                placeholder="e.g. Affidavit of Good Conduct"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Status</label>
                            <select
                                value={currentTemplate.status || 'draft'}
                                onChange={(e) => setCurrentTemplate({ ...currentTemplate, status: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            >
                                <option value="draft">Draft (Hidden)</option>
                                <option value="active">Active (Public)</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Amount (₦)</label>
                        <input
                            type="number"
                            value={currentTemplate.amount}
                            onChange={(e) => setCurrentTemplate({ ...currentTemplate, amount: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Template Content</label>
                        <RichTextEditor
                            value={currentTemplate.content}
                            onChange={(html) => setCurrentTemplate({ ...currentTemplate, content: html })}
                            placeholder="Design your template here..."
                        />
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn btn-primary"
                        style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: saving ? 0.7 : 1 }}
                    >
                        {saving ? (
                            <><Loader2 size={20} className="animate-spin" /> Saving Template...</>
                        ) : (
                            <><Save size={20} /> Save Template</>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card" style={{ background: 'white', padding: isMobile ? '1rem' : '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0 }}>Affidavit Template Management</h2>
                    <p style={{ color: '#778eaeff', margin: '0.5rem 0 0' }}>Pre-load and manage official court templates</p>
                </div>
                <button
                    onClick={() => {
                        setCurrentTemplate({ title: '', content: '', amount: 2000, status: 'active' });
                        setIsEditing(true);
                    }}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Plus size={20} /> New Template
                </button>
            </div>
            {/* Templates List */}
            {!isEditing && (
                <DataTable
                    columns={[
                        {
                            key: 'title',
                            label: 'Affidavit Title',
                            sortable: true,
                            render: (val) => (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '8px', color: '#3b82f6' }}>
                                        <FileText size={20} />
                                    </div>
                                    <span style={{ fontWeight: '600', color: 'rgb\(18 37 74\)' }}>{val}</span>
                                </div>
                            )
                        },
                        {
                            key: 'status',
                            label: 'Status',
                            sortable: true,
                            render: (val) => {
                                const map = {
                                    active: { color: '#10b981', bg: '#ecfdf5', label: 'Active' },
                                    draft: { color: '#f59e0b', bg: '#fffbeb', label: 'Draft' },
                                    archived: { color: '#778eaeff', bg: '#f1f5f9', label: 'Archived' }
                                };
                                const style = map[val] || map['draft'];
                                return (
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '11px',
                                        fontWeight: 'bold',
                                        color: style.color,
                                        background: style.bg
                                    }}>
                                        {style.label.toUpperCase()}
                                    </span>
                                );
                            }
                        },
                        {
                            key: 'amount',
                            label: 'Fee (₦)',
                            sortable: true,
                            render: (val) => (
                                <span style={{ fontWeight: 'bold', color: '#10b981' }}>
                                    ₦{Number(val).toLocaleString()}
                                </span>
                            )
                        }
                    ]}
                    data={templates}
                    loading={loading}
                    searchPlaceholder="Search templates by title..."
                    actions={(row) => (
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => toggleStatus(row)}
                                style={{ padding: '8px', background: row.status === 'active' ? '#fffbeb' : '#ecfdf5', color: row.status === 'active' ? '#f59e0b' : '#10b981', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                title={row.status === 'active' ? "Unpublish (Draft)" : "Publish (Active)"}
                            >
                                {row.status === 'active' ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                            <button
                                onClick={() => { setCurrentTemplate(row); setIsEditing(true); }}
                                style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                title="Edit Template"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button
                                onClick={() => handleDelete(row.id)}
                                style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                title="Delete Template"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    )}
                />
            )}
        </div>
    );
};

export default TemplateManager;
