import React, { useState, useEffect } from 'react';
import { formatDate } from '../../utils/dateUtils';
import { motion } from 'framer-motion';
import { Check, X, Eye, FileText, User, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import api from '../../utils/api';
import { useModal } from '../../context/ModalContext';

const RegistryReview = ({ role, isMobile: isMobileProp }) => {
    const [applications, setApplications] = useState([]);
    const [selectedApp, setSelectedApp] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [sourceFilter, setSourceFilter] = useState('all');
    const { showModal } = useModal();

    const filteredApplications = React.useMemo(() => {
        if (sourceFilter === 'all') return applications;
        return applications.filter(app => app.source?.toLowerCase() === sourceFilter.toLowerCase());
    }, [applications, sourceFilter]);

    useEffect(() => {
        fetchApplications();
    }, []);

    const [isMobileInternal, setIsMobileInternal] = useState(window.innerWidth <= 1024);
    const isMobile = isMobileProp !== undefined ? isMobileProp : isMobileInternal;

    useEffect(() => {
        const handleResize = () => setIsMobileInternal(window.innerWidth <= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const res = await api.get('/staff/affidavits/pending-review');
            setApplications(res.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching applications:', err);
            setError('Failed to load applications. Please ensure you are logged in.');
            setApplications([]); // Ensure applications is an array
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (nextStatus) => {
        if (!selectedApp) return;

        if (nextStatus === 'rejected') {
            showModal({
                type: 'error',
                title: 'Reject Application?',
                message: 'Please provide a reason for rejecting this affidavit.',
                showCancel: true,
                showInput: true,
                inputType: 'textarea',
                inputPlaceholder: 'Reason for rejection...',
                confirmText: 'Reject & Notify',
                onConfirm: async (remarks) => {
                    if (!remarks || remarks.trim() === '') {
                        showModal({ type: 'error', title: 'Action Required', message: 'You must provide a reason for rejection.' });
                        return;
                    }
                    performUpdate(nextStatus, remarks);
                }
            });
        } else {
            showModal({
                type: 'info',
                title: 'Confirm Approval',
                message: 'Are you sure you want to approve this application to the CFO stage?',
                showCancel: true,
                confirmText: 'Yes, Approve',
                onConfirm: () => performUpdate(nextStatus)
            });
        }
    };

    const performUpdate = async (nextStatus, remarks = null) => {
        setProcessing(true);
        try {
            await api.put(`/affidavits/${selectedApp.id}/approve`, { nextStatus, remarks });
            showModal({ type: 'success', title: 'Success', message: `Application ${nextStatus === 'rejected' ? 'rejected' : 'approved'} successfully.` });
            setSelectedApp(null);
            fetchApplications();
        } catch (err) {
            console.error('Error processing application:', err);
            showModal({ type: 'error', title: 'Error', message: 'Failed to update application status.' });
        } finally {
            setProcessing(false);
        }
    };

    if (isMobile) {
        return (
            <div style={{ padding: '0.5rem' }}>
                {!selectedApp ? (
                    <div className="glass-card" style={{ background: 'rgb\(18 37 74\)', border: 'none' }}>
                        <h3 style={{ marginBottom: '1rem', color: '#38bdf8' }}>
                            {role === 'cr' ? 'Pending Approvals' : 'Pending Initial Review'}
                        </h3>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                            {['all', 'self', 'jurat'].map(f => (
                                <button
                                    key={f}
                                    onClick={(e) => { e.stopPropagation(); setSourceFilter(f); }}
                                    style={{
                                        padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', border: 'none', cursor: 'pointer',
                                        background: sourceFilter === f ? '#38bdf8' : 'rgba(255,255,255,0.05)',
                                        color: sourceFilter === f ? 'white' : '#94a3b8'
                                    }}
                                >
                                    {f.toUpperCase()}
                                </button>
                            ))}
                        </div>
                        {loading ? (
                            <div style={{ padding: '2rem', textAlign: 'center' }}><Loader2 className="animate-spin" color="#38bdf8" /></div>
                        ) : filteredApplications.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No applications match filter</div>
                        ) : (
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {filteredApplications.map(app => (
                                    <div
                                        key={app.id}
                                        onClick={() => setSelectedApp(app)}
                                        style={{
                                            padding: '1.2rem',
                                            background: 'rgba(255,255,255,0.03)',
                                            borderRadius: '12px',
                                            border: '1px solid #334155',
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ fontWeight: 'bold', color: 'white', textTransform: 'capitalize' }}>{app.first_name} {app.surname}</div>
                                            <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: app.source === 'Jurat' ? '#075985' : '#334155', color: 'white', fontWeight: 'bold' }}>
                                                {app.source?.toUpperCase() || 'SELF'}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#94a3b8' }}>{app.type}</div>
                                        {app.remarks && (
                                            <div style={{ fontSize: '11px', color: '#f87171', fontStyle: 'italic', marginTop: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                Note: {app.remarks}
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', alignItems: 'center' }}>
                                            <span style={{ fontSize: '11px', color: '#38bdf8' }}>ID: CRMS-{app.id}</span>
                                            <button className="btn" style={{ background: '#38bdf8', color: 'white', padding: '4px 12px', fontSize: '12px' }}>Review</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="glass-card" style={{ background: 'rgb\(18 37 74\)', border: 'none', minHeight: '100vh' }}>
                        <button onClick={() => setSelectedApp(null)} className="btn" style={{ color: '#94a3b8', padding: '0', marginBottom: '1.5rem' }}>← Back to List</button>

                        <div style={{ marginBottom: '2rem' }}>
                            <h2 style={{ color: 'white', margin: 0, fontSize: '1.5rem' }}>Review Application</h2>
                            <p style={{ color: '#94a3b8', fontSize: '13px' }}>CRMS-ID: {selectedApp.id}</p>
                        </div>

                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            <div style={{ ...detailItem, flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    <User size={18} color="#3b82f6" />
                                    <p style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', margin: 0 }}>Applicant</p>
                                </div>
                                <p style={{ fontSize: '16px', fontWeight: '600', color: 'white', margin: 0, textTransform: 'capitalize' }}>{selectedApp.first_name} {selectedApp.surname}</p>
                                <p style={{ fontSize: '13px', color: '#778eaeff', margin: 0 }}>{selectedApp.email || 'No Email'}</p>
                                {selectedApp.filed_by_name && (
                                    <div style={{ padding: '6px 12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', border: '1px solid rgba(16, 185, 129, 0.2)', width: 'fit-content', marginTop: '4px' }}>
                                        Filed by: <span style={{ textTransform: 'capitalize' }}>{selectedApp.filed_by_name}</span>
                                    </div>
                                )}
                            </div>

                            <div style={{ ...detailItem, flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    <FileText size={18} color="#10b981" />
                                    <p style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', margin: 0 }}>Affidavit Content</p>
                                </div>
                                <div style={{
                                    padding: '1.25rem',
                                    background: '#0f172a',
                                    borderRadius: '12px',
                                    border: '1px solid #334155',
                                    fontSize: '14px',
                                    color: '#cbd5e1',
                                    lineHeight: '1.6'
                                }}>
                                    <div dangerouslySetInnerHTML={{ __html: selectedApp.content }} />
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <button
                                onClick={() => handleAction('pending_cfo')}
                                disabled={processing}
                                style={{ width: '100%', background: '#10b981', color: 'white', padding: '1rem', borderRadius: '12px', border: 'none', fontWeight: 'bold' }}
                            >
                                {processing ? <Loader2 className="animate-spin" size={20} /> : 'Approve to CFO'}
                            </button>
                            <button
                                onClick={() => handleAction('rejected')}
                                disabled={processing}
                                style={{ width: '100%', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '1rem', borderRadius: '12px', fontWeight: 'bold' }}
                            >
                                Reject & Notify
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
            <div className="glass-card" style={{ background: 'rgb\(18 37 74\)', border: 'none', height: 'fit-content' }}>
                <h3 style={{ marginBottom: '1rem', color: '#38bdf8' }}>
                    {role === 'cr' ? 'Pending Approvals' : 'Pending Registry Review'}
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    {['all', 'self', 'jurat'].map(f => (
                        <button
                            key={f}
                            onClick={() => setSourceFilter(f)}
                            style={{
                                padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', border: 'none', cursor: 'pointer',
                                background: sourceFilter === f ? '#38bdf8' : 'rgba(255,255,255,0.05)',
                                color: sourceFilter === f ? 'white' : '#94a3b8',
                                transition: 'all 0.2s'
                            }}
                        >
                            {f.toUpperCase()}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}><Loader2 className="animate-spin" color="#38bdf8" /></div>
                ) : error ? (
                    <div style={{ padding: '1rem', color: '#ef4444', textAlign: 'center' }}>
                        <AlertCircle style={{ marginBottom: '0.5rem' }} />
                        <p style={{ fontSize: '13px' }}>{error}</p>
                    </div>
                ) : filteredApplications.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No matches</div>
                ) : (
                    filteredApplications.map(app => (
                        <div
                            key={app.id}
                            onClick={() => setSelectedApp(app)}
                            style={{
                                padding: '1.2rem',
                                background: selectedApp?.id === app.id ? '#334155' : 'rgba(255,255,255,0.03)',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                marginBottom: '1rem',
                                border: selectedApp?.id === app.id ? '2px solid #38bdf8' : '1px solid #334155',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ fontWeight: 'bold', color: 'white', textTransform: 'capitalize' }}>{app.first_name} {app.surname}</div>
                                <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: app.source === 'Jurat' ? '#0ea5e920' : '#47556940', color: app.source === 'Jurat' ? '#38bdf8' : '#94a3b8', border: `1px solid ${app.source === 'Jurat' ? '#38bdf840' : '#47556980'}`, fontWeight: 'bold' }}>
                                    {app.source?.toUpperCase() || 'SELF'}
                                </span>
                            </div>
                            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>{app.type}</div>
                            <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span>ID: CRMS-{app.id}</span>
                                <span>{formatDate(app.created_at)}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="glass-card" style={{ background: 'rgb\(18 37 74\)', border: 'none', minHeight: '600px' }}>
                {selectedApp ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                            <div>
                                <h2 style={{ color: 'white', margin: 0 }}>Review Application</h2>
                                <p style={{ color: '#94a3b8', fontSize: '14px' }}>CRMS-ID: {selectedApp.id}</p>
                            </div>
                            <span style={{ padding: '6px 16px', background: '#38bdf820', color: '#38bdf8', borderRadius: '30px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #38bdf840' }}>
                                PENDING REVIEW
                            </span>
                        </div>

                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            <div style={detailItem}>
                                <div style={{ background: '#3b82f620', padding: '10px', borderRadius: '10px' }}>
                                    <User size={20} color="#3b82f6" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Applicant Profile</p>
                                    <p style={{ fontSize: '18px', fontWeight: '600', color: 'white', textTransform: 'capitalize' }}>{selectedApp.first_name} {selectedApp.surname}</p>
                                    <p style={{ fontSize: '14px', color: '#778eaeff' }}>{selectedApp.email || 'No Email'}</p>
                                    {selectedApp.filed_by_name && (
                                        <div style={{ padding: '4px 10px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', borderRadius: '6px', fontSize: '11px', fontWeight: '700', marginTop: '10px', width: 'fit-content', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                                            FILED BY STAFF: {selectedApp.filed_by_name.toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={detailItem}>
                                <div style={{ background: '#10b98120', padding: '10px', borderRadius: '10px' }}>
                                    <FileText size={20} color="#10b981" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Affidavit Content</p>
                                    <div style={{
                                        marginTop: '1rem',
                                        padding: '1.5rem',
                                        background: '#0f172a',
                                        borderRadius: '12px',
                                        border: '1px solid #334155',
                                        maxHeight: '300px',
                                        overflowY: 'auto',
                                        fontSize: '14px',
                                        color: '#cbd5e1',
                                        lineHeight: '1.6'
                                    }}>
                                        <div dangerouslySetInnerHTML={{ __html: selectedApp.content }} />
                                    </div>

                                    {selectedApp.pdf_path && (
                                        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#33415550', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <FileText color="#38bdf8" />
                                                <span style={{ fontSize: '14px', color: 'white' }}>Attached PDF Document</span>
                                            </div>
                                            <a
                                                href={`http://localhost:5000${selectedApp.pdf_path}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="btn"
                                                style={{ background: '#38bdf8', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '6px 15px', fontSize: '12px' }}
                                            >
                                                <Eye size={14} /> View File
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '4rem', display: 'flex', gap: '1.5rem' }}>
                            <button
                                onClick={() => handleAction('pending_cfo')}
                                disabled={processing}
                                className="btn"
                                style={{ flex: 1, background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', padding: '1rem', fontSize: '16px' }}
                            >
                                {processing ? <Loader2 className="animate-spin" size={20} /> : <><Check size={20} /> Approve to CFO</>}
                            </button>
                            <button
                                onClick={() => handleAction('rejected')}
                                disabled={processing}
                                className="btn"
                                style={{ flex: 1, background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', padding: '1rem', fontSize: '16px' }}
                            >
                                <X size={20} /> Reject & Notify
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                        <div style={{ background: '#33415530', padding: '2rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
                            <Eye size={48} />
                        </div>
                        <h3>Selection Pending</h3>
                        <p>Select an application from the sidebar to start reviewing</p>
                    </div>
                )}
            </div>
        </div>

    );
};

const detailItem = {
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start',
    padding: '1rem',
    background: '#0f172a',
    borderRadius: '12px'
};

export default RegistryReview;
