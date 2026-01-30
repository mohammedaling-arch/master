import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Plus, Edit2, Trash2, Save, X, Loader2 } from 'lucide-react';
import { useModal } from '../../context/ModalContext';
import DataTable from '../common/DataTable';

const ProbateDocumentManager = ({ isMobile }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentDoc, setCurrentDoc] = useState({
        document_name: '',
        document_fee: 0,
        publish_status: 'active',
        is_required: false,
        type: 'upload'
    });
    const { showModal } = useModal();

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const res = await api.get('/admin/probate-documents');
            console.log(res.data);
            setDocuments(res.data);
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!currentDoc.document_name) {
            showModal({ type: 'warning', title: 'Missing Name', message: 'Document Name is required.' });
            return;
        }

        setSaving(true);
        try {
            const data = {
                ...currentDoc,
                is_required: currentDoc.is_required ? 1 : 0
            };

            if (currentDoc.id) {
                await api.put(`/admin/probate-documents/${currentDoc.id}`, data);
            } else {
                await api.post('/admin/probate-documents', data);
            }
            showModal({ type: 'success', title: 'Success', message: 'Config saved successfully!' });
            setIsEditing(false);
            fetchDocuments();
            resetForm();
        } catch (error) {
            console.error('Error saving config:', error);
            showModal({ type: 'error', title: 'Save Failed', message: error.response?.data?.error || 'Failed to save.' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        showModal({
            type: 'warning',
            title: 'Delete Config?',
            message: 'Are you sure? This will remove this document type from future applications.',
            showCancel: true,
            confirmText: 'Delete',
            onConfirm: async () => {
                try {
                    await api.delete(`/admin/probate-documents/${id}`);
                    fetchDocuments();
                } catch (error) {
                    showModal({ type: 'error', title: 'Failed', message: 'Could not delete.' });
                }
            }
        });
    };

    const resetForm = () => {
        setCurrentDoc({
            document_name: '',
            document_fee: 0,
            publish_status: 'active',
            is_required: false,
            type: 'upload',
            description: ''
        });
    };

    if (isEditing) {
        return (
            <div className="glass-card" style={{ background: 'white', padding: isMobile ? '1rem' : '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                    <h2>{currentDoc.id ? 'Edit Configuration' : 'Add New Configuration'}</h2>
                    <button onClick={() => setIsEditing(false)} className="btn btn-secondary"><X size={20} /> Cancel</button>
                </div>

                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Name *</label>
                            <input
                                type="text"
                                value={currentDoc.document_name}
                                onChange={(e) => setCurrentDoc({ ...currentDoc, document_name: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                placeholder="e.g. Death Certificate"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Type</label>
                            <select
                                value={currentDoc.type || 'upload'}
                                onChange={(e) => setCurrentDoc({ ...currentDoc, type: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            >
                                <option value="upload">Document Upload</option>
                                <option value="item">Payment Item (Service)</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Fee Amount (₦)</label>
                            <input
                                type="number"
                                value={currentDoc.document_fee}
                                onChange={(e) => setCurrentDoc({ ...currentDoc, document_fee: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Publish Status</label>
                            <select
                                value={currentDoc.publish_status}
                                onChange={(e) => setCurrentDoc({ ...currentDoc, publish_status: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Description / Context</label>
                        <textarea
                            value={currentDoc.description || ''}
                            onChange={(e) => setCurrentDoc({ ...currentDoc, description: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '80px' }}
                            placeholder="Optional explanation visible to user..."
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                            type="checkbox"
                            id="reqCheck"
                            checked={currentDoc.is_required}
                            onChange={(e) => setCurrentDoc({ ...currentDoc, is_required: e.target.checked })}
                            style={{ width: '20px', height: '20px' }}
                        />
                        <label htmlFor="reqCheck" style={{ fontWeight: 'bold', cursor: 'pointer' }}>Is Required?</label>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn btn-primary"
                        style={{ padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', opacity: saving ? 0.7 : 1 }}
                    >
                        {saving ? <Loader2 className="animate-spin" /> : <Save />} Save Configuration
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card" style={{ background: 'white', padding: isMobile ? '1rem' : '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0 }}>Probate Configuration</h2>
                    <p style={{ color: '#778eaeff', margin: '0.5rem 0 0' }}>Manage required documents and fees for Probate applications.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsEditing(true); }}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Plus size={20} /> Add Config
                </button>
            </div>

            <DataTable
                columns={[
                    { key: 'document_name', label: 'Name', sortable: true },
                    {
                        key: 'type',
                        label: 'Type',
                        render: (val) => val === 'item' ?
                            <span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>SERVICE / FEE</span> :
                            <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>DOCUMENT</span>
                    },
                    {
                        key: 'is_required',
                        label: 'Required',
                        render: (val) => val ? <span style={{ color: '#ef4444', fontWeight: 'bold' }}>YES</span> : 'No'
                    },
                    {
                        key: 'document_fee',
                        label: 'Fee',
                        render: (val) => `₦${Number(val).toLocaleString()}`
                    },
                    {
                        key: 'publish_status',
                        label: 'Status',
                        render: (val) => (
                            <span style={{
                                padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold',
                                color: val === 'active' ? '#10b981' : '#778eaeff',
                                background: val === 'active' ? '#ecfdf5' : '#f1f5f9'
                            }}>
                                {val.toUpperCase()}
                            </span>
                        )
                    }
                ]}
                data={documents}
                loading={loading}
                searchPlaceholder="Search config..."
                actions={(row) => (
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                            onClick={() => { setCurrentDoc({ ...row, is_required: !!row.is_required }); setIsEditing(true); }}
                            className="action-btn-edit"
                            title="Edit"
                        >
                            <Edit2 size={18} />
                        </button>
                        <button
                            onClick={() => handleDelete(row.id)}
                            className="action-btn-delete"
                            title="Delete"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                )}
            />
            <style>{`
                .action-btn-edit { padding: 8px; background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: none; border-radius: 8px; cursor: pointer; }
                .action-btn-delete { padding: 8px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: none; border-radius: 8px; cursor: pointer; }
            `}</style>
        </div>
    );
};

export default ProbateDocumentManager;
