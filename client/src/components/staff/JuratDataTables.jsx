import React, { useState, useEffect } from 'react';
import { formatDate } from '../../utils/dateUtils';
import {
    FileText, Scale, Edit2, Eye, Trash2,
    Loader2, Download, CheckCircle, Calendar,
    User, Mail, Phone, ExternalLink, X, Save, Landmark
} from 'lucide-react';
import api from '../../utils/api';
import DataTable from '../common/DataTable';
import { useModal } from '../../context/ModalContext';
import RichTextEditor from '../common/RichTextEditor';
import { generateAffidavitPDF } from '../../utils/pdfGenerator';

export const JuratAffidavitsTable = ({ isMobile, staff }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingAffidavit, setEditingAffidavit] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const { showModal } = useModal();

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get('/staff/jurat/affidavits');
            setData(res.data);
            setError(null);
        } catch (error) {
            console.error('Error fetching affidavits:', error);
            setError('Failed to load records.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/staff/affidavits/${editingAffidavit.id}`, {
                content: editingAffidavit.content,
                type: editingAffidavit.type,
                amount: editingAffidavit.amount,
                status: 'submitted',
                remarks: editingAffidavit.remarks,
                language: editingAffidavit.language
            });
            showModal({ type: 'success', title: 'Updated', message: 'Affidavit updated successfully.' });
            setIsEditModalOpen(false);
            fetchData();
        } catch (error) {
            showModal({ type: 'error', title: 'Update Failed', message: error.response?.data?.error || 'Failed to update.' });
        }
    };

    const columns = [
        {
            key: 'first_name',
            label: 'Applicant/User',
            sortable: true,
            render: (val, row) => (
                <div>
                    <div style={{ fontWeight: '600', color: 'rgb\(18 37 74\)', textTransform: 'capitalize' }}>{val} {row.surname}</div>
                    <div style={{ fontSize: '11px', color: '#778eaeff' }}>{row.email || row.phone}</div>
                </div>
            )
        },
        { key: 'type', label: 'Affidavit Type', sortable: true },
        {
            key: 'source',
            label: 'Source',
            render: (val) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: val === 'Jurat' ? 'rgba(14, 165, 233, 0.1)' : 'rgba(148, 163, 184, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {val === 'Jurat' ? <Landmark size={12} color="#0ea5e9" /> : <User size={12} color="#778eaeff" />}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: val === 'Jurat' ? '#0ea5e9' : '#778eaeff' }}>
                        {val?.toUpperCase() || 'SELF'}
                    </span>
                </div>
            )
        },
        {
            key: 'amount',
            label: 'Amount',
            render: (val) => `₦${Number(val).toLocaleString()}`,
            hiddenMobile: true
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (val, row) => {
                const colors = {
                    'pending': { bg: '#fff7ed', text: '#9a3412' },
                    'submitted': { bg: '#eff6ff', text: '#1e40af' },
                    'completed': { bg: '#f0fdf4', text: '#166534' },
                    'rejected': { bg: '#fef2f2', text: '#991b1b' }
                };
                const style = colors[val] || { bg: '#f8fafc', text: '#778eaeff' };
                return (
                    <span
                        title={row.remarks ? `Reason: ${row.remarks}` : ''}
                        style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            background: style.bg,
                            color: style.text,
                            textTransform: 'uppercase',
                            cursor: row.remarks ? 'help' : 'default',
                            border: row.remarks ? `1px dashed ${style.text}` : 'none'
                        }}
                    >
                        {val}
                    </span>
                );
            }
        },
        {
            key: 'remarks',
            label: 'Remarks',
            render: (val) => val ? (
                <div style={{ fontSize: '11px', color: '#778eaeff', fontStyle: 'italic', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={val}>
                    {val}
                </div>
            ) : '-'
        },
        {
            key: 'created_at',
            label: 'Date',
            sortable: true,
            render: (val) => formatDate(val),
            hiddenMobile: true
        }
    ];

    const actions = (row) => (
        <div style={{ display: 'flex', gap: '0.4rem' }}>
            {(row.status === 'submitted' || row.status === 'rejected' || row.status === 'pending') && (
                <button
                    onClick={() => { setEditingAffidavit(row); setIsEditModalOpen(true); }}
                    style={{ padding: '0.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#778eaeff', cursor: 'pointer' }}
                    title="Edit Affidavit"
                >
                    <Edit2 size={16} />
                </button>
            )}
            {row.status === 'completed' && (
                <button
                    onClick={async () => {
                        try {
                            const response = await api.get(`/affidavits/${row.id}/download`, {
                                responseType: 'blob'
                            });
                            const url = window.URL.createObjectURL(new Blob([response.data]));
                            const link = document.createElement('a');
                            link.href = url;
                            const fileName = row.affidavit_path ? `Affidavit_${row.id}_Certified.pdf` : `Affidavit_${row.id}_Draft.pdf`;
                            link.setAttribute('download', fileName);
                            document.body.appendChild(link);
                            link.click();
                            link.remove();
                            window.URL.revokeObjectURL(url);
                        } catch (err) {
                            console.error("Download failed:", err);
                            showModal({ type: 'error', title: 'Download Failed', message: 'Failed to retrieve the PDF file. Please try again.' });
                        }
                    }}
                    style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', border: 'none', borderRadius: '8px', color: '#3b82f6', cursor: 'pointer' }}
                    title="Download PDF"
                >
                    <Download size={16} />
                </button>
            )}
        </div>
    );

    return (
        <div className="glass-card" style={{ background: '#ffffff', border: '1px solid #f2f4f7', borderRadius: '16px', padding: '1.5rem' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: '#101828', fontSize: '1.1rem', fontWeight: '600' }}>Affidavit Registry</h3>
                <button onClick={fetchData} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '13px' }}>Refresh</button>
            </div>

            {error && <div style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</div>}

            <DataTable
                columns={columns}
                data={data}
                loading={loading}
                actions={actions}
                searchPlaceholder="Search affidavits..."
                isMobile={isMobile}
            />

            {isEditModalOpen && editingAffidavit && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div className="modal-content" style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Edit Affidavit Content</h2>
                            <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#778eaeff' }}><X size={24} /></button>
                        </div>
                        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                            {editingAffidavit.remarks && (
                                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px' }}>
                                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#991b1b', textTransform: 'uppercase', marginBottom: '4px' }}>Rejection Reason / Remarks:</p>
                                    <p style={{ margin: 0, fontSize: '14px', color: '#b91c1c' }}>{editingAffidavit.remarks}</p>
                                </div>
                            )}
                            <form onSubmit={handleUpdate}>
                                <div style={{ marginBottom: '2rem' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#334155', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Document Content
                                    </label>
                                    <RichTextEditor
                                        value={editingAffidavit.content}
                                        onChange={val => setEditingAffidavit({ ...editingAffidavit, content: val })}
                                    />
                                </div>
                                <div style={{ marginBottom: '2rem' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#334155', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Translated From English to:
                                    </label>
                                    <input
                                        type="text"
                                        value={editingAffidavit.language || ''}
                                        onChange={val => setEditingAffidavit({ ...editingAffidavit, language: val.target.value })}
                                        placeholder="e.g. Hausa (leave blank if not translated)"
                                        style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                                    />
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: '1rem',
                                    paddingTop: '1rem',
                                    borderTop: '1px solid #f1f5f9'
                                }}>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditModalOpen(false)}
                                        style={{
                                            padding: '0.75rem 1.5rem',
                                            borderRadius: '10px',
                                            border: '1px solid #e2e8f0',
                                            background: 'white',
                                            color: '#778eaeff',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseOut={e => e.currentTarget.style.background = 'white'}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        style={{
                                            padding: '0.75rem 2rem',
                                            borderRadius: '10px',
                                            border: 'none',
                                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                            color: 'white',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.6rem',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        <Save size={18} /> Update Content
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const JuratProbateTable = ({ isMobile }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingProbate, setEditingProbate] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const { showModal } = useModal();

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get('/staff/jurat/probate');
            setData(res.data);
            setError(null);
        } catch (error) {
            console.error('Error fetching probate:', error);
            setError('Failed to load records.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/staff/probate/${editingProbate.id}`, {
                deceased_name: editingProbate.deceased_name,
                status: editingProbate.status,
                remarks: editingProbate.remarks
            });
            showModal({ type: 'success', title: 'Updated', message: 'Probate application updated successfully.' });
            setIsEditModalOpen(false);
            fetchData();
        } catch (error) {
            showModal({ type: 'error', title: 'Update Failed', message: error.response?.data?.error || 'Failed to update.' });
        }
    };

    const columns = [
        {
            key: 'first_name',
            label: 'Applicant',
            sortable: true,
            render: (val, row) => (
                <div>
                    <div style={{ fontWeight: '600', color: 'rgb\(18 37 74\)', textTransform: 'capitalize' }}>{val} {row.surname}</div>
                    <div style={{ fontSize: '11px', color: '#778eaeff' }}>{row.email || row.phone}</div>
                </div>
            )
        },
        { key: 'deceased_name', label: 'Deceased Name', sortable: true, render: (val) => <span style={{ textTransform: 'capitalize' }}>{val}</span> },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (val, row) => {
                const colors = {
                    'pending_registrar': { bg: '#eff6ff', text: '#1e40af', label: 'PENDING REGISTRAR' },
                    'query': { bg: '#fef2f2', text: '#991b1b', label: 'QUERIED' },
                    'approved': { bg: '#f0fdf4', text: '#166534', label: 'APPROVED' },
                    'completed': { bg: '#f0fdf4', text: '#166534', label: 'COMPLETED' }
                };
                const safeVal = val || 'unknown';
                const style = colors[safeVal] || { bg: '#f8fafc', text: '#778eaeff', label: safeVal.toUpperCase() };
                return (
                    <span
                        title={row.remarks ? `Reason: ${row.remarks}` : ''}
                        style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            background: style.bg,
                            color: style.text,
                            cursor: row.remarks ? 'help' : 'default',
                            border: row.remarks ? `1px dashed ${style.text}` : 'none'
                        }}
                    >
                        {style.label}
                    </span>
                );
            }
        },
        {
            key: 'remarks',
            label: 'Remarks',
            render: (val) => val ? (
                <div style={{ fontSize: '11px', color: '#778eaeff', fontStyle: 'italic', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={val}>
                    {val}
                </div>
            ) : '-'
        },
        {
            key: 'created_at',
            label: 'Date',
            sortable: true,
            render: (val) => formatDate(val),
            hiddenMobile: true
        }
    ];

    const actions = (row) => (
        <button
            onClick={() => { setEditingProbate(row); setIsEditModalOpen(true); }}
            style={{ padding: '0.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#778eaeff', cursor: 'pointer' }}
            title="Edit Application"
        >
            <Edit2 size={16} />
        </button>
    );

    return (
        <div className="glass-card" style={{ background: '#ffffff', border: '1px solid #f2f4f7', borderRadius: '16px', padding: '1.5rem' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: '#101828', fontSize: '1.1rem', fontWeight: '600' }}>Probate Administration Registry</h3>
                <button onClick={fetchData} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '13px' }}>Refresh</button>
            </div>

            {error && <div style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</div>}

            <DataTable
                columns={columns}
                data={data}
                loading={loading}
                actions={actions}
                searchPlaceholder="Search records..."
                isMobile={isMobile}
            />

            {isEditModalOpen && editingProbate && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div className="modal-content" style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '500px' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Edit Probate Status</h2>
                            <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#778eaeff' }}><X size={24} /></button>
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                            <form onSubmit={handleUpdate}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '0.5rem' }}>Deceased Name</label>
                                    <input
                                        type="text"
                                        value={editingProbate.deceased_name}
                                        onChange={e => setEditingProbate({ ...editingProbate, deceased_name: e.target.value })}
                                        className="form-input"
                                    />
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '0.5rem' }}>Application Status</label>
                                    <select
                                        value={editingProbate.status}
                                        onChange={e => setEditingProbate({ ...editingProbate, status: e.target.value })}
                                        className="form-input"
                                    >
                                        <option value="pending_registrar">Pending Registrar</option>
                                        <option value="query">Query/Correction Needed</option>
                                        <option value="approved">Approved</option>
                                        <option value="completed">Completed/Issued</option>
                                    </select>
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '0.5rem' }}>Remarks/Feedback</label>
                                    <textarea
                                        value={editingProbate.remarks || ''}
                                        onChange={e => setEditingProbate({ ...editingProbate, remarks: e.target.value })}
                                        className="form-input"
                                        placeholder="Specify reasons for query or additional info..."
                                        style={{ minHeight: '80px', paddingTop: '10px' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                    <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn-secondary">Cancel</button>
                                    <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Save size={18} /> Update Status
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
