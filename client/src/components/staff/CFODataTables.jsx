import React, { useState, useEffect } from 'react';
import { formatDate } from '../../utils/dateUtils';
import api from '../../utils/api';
import DataTable from '../common/DataTable';
import { useModal } from '../../context/ModalContext';
import { Eye, CheckCircle, XCircle, Download, X, User, FileText, Calendar, Mail, Phone, Hash, Video, Landmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateAffidavitPDF } from '../../utils/pdfGenerator';
import VideoCallSession from './VideoCallSession';

const DeponentProfileModal = ({ deponent, isOpen, onClose }) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const BASE_URL = API_URL.replace('/api', '');

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!deponent) return null;

    const getImgUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${BASE_URL}${path}`;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 2100, padding: isMobile ? '0.5rem' : '2rem'
                    }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: '#ffffff', borderRadius: '24px', width: '100%',
                            maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto',
                            display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                        }}
                    >
                        {/* Profile Header */}
                        <div style={{ position: 'relative', height: '140px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', display: 'flex', alignItems: 'flex-end', padding: '1.5rem', justifyContent: 'center' }}>
                            <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.2)', border: 'none', padding: '0.4rem', borderRadius: '50%', color: 'white', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                            <div style={{
                                width: '120px', height: '120px', borderRadius: '50%', border: '5px solid white',
                                background: '#f1f5f9', overflow: 'hidden', position: 'absolute', bottom: '-60px',
                                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                            }}>
                                {deponent.picture_path ? (
                                    <img src={getImgUrl(deponent.picture_path)} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                                        <User size={60} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Profile Body */}
                        <div style={{ marginTop: '70px', padding: '1.5rem', textAlign: 'center' }}>
                            <h2 style={{ margin: '0 0 0.25rem', color: 'rgb\(18 37 74\)', textTransform: 'capitalize' }}>{deponent.first_name} {deponent.middle_name ? `${deponent.middle_name} ` : ''}{deponent.surname}</h2>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', background: deponent.source === 'Jurat' ? 'rgba(14, 165, 233, 0.1)' : 'rgba(148, 163, 184, 0.1)', color: deponent.source === 'Jurat' ? '#0ea5e9' : '#778eaeff' }}>
                                    {deponent.source?.toUpperCase()} DEPONENT
                                </span>
                                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', background: deponent.status === 'active' ? '#ecfdf5' : '#fef2f2', color: deponent.status === 'active' ? '#10b981' : '#ef4444' }}>
                                    {deponent.status?.toUpperCase()}
                                </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'left', marginBottom: '1.5rem' }}>
                                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '16px' }}>
                                    <label style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Email Address</label>
                                    <div style={{ fontSize: '13px', color: 'rgb\(18 37 74\)', fontWeight: '600', wordBreak: 'break-all' }}>{deponent.email}</div>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '16px' }}>
                                    <label style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Phone Number</label>
                                    <div style={{ fontSize: '14px', color: 'rgb\(18 37 74\)', fontWeight: '600' }}>{deponent.phone || 'N/A'}</div>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '16px' }}>
                                    <label style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>NIN Identification</label>
                                    <div style={{ fontSize: '14px', color: 'rgb\(18 37 74\)', fontWeight: '600' }}>{deponent.nin || 'N/A'}</div>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '16px' }}>
                                    <label style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Gender / Age</label>
                                    <div style={{ fontSize: '14px', color: 'rgb\(18 37 74\)', fontWeight: '600' }}>{deponent.gender || 'N/A'} {deponent.age ? `• ${deponent.age} yrs` : ''}</div>
                                </div>
                            </div>

                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '16px', textAlign: 'left', marginBottom: '1.5rem' }}>
                                <label style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Physical Address</label>
                                <div style={{ fontSize: '13px', color: 'rgb\(18 37 74\)', fontWeight: '600' }}>{deponent.address || 'Address not provided'}</div>
                            </div>

                            {deponent.signature_path && (
                                <div style={{ textAlign: 'left' }}>
                                    <label style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '0.75rem' }}>Registered Signature</label>
                                    <div style={{ background: 'white', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '1rem', display: 'flex', justifyContent: 'center' }}>
                                        <img src={getImgUrl(deponent.signature_path)} alt="Signature" style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }} />
                                    </div>
                                </div>
                            )}

                            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                                <button onClick={onClose} style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', background: '#f1f5f9', border: 'none', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>Close Profile</button>
                                <button onClick={() => window.location.href = `mailto:${deponent.email}`} style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', background: '#3b82f6', border: 'none', color: 'white', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    <Mail size={16} /> Send Email
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};


const AffidavitDetailModal = ({ affidavit, isOpen, onClose, onVerify, onReject, staff }) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const { showModal } = useModal();

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!affidavit) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 2000, padding: isMobile ? '0.5rem' : '2rem'
                    }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: '#ffffff', borderRadius: '24px', width: '100%',
                            maxWidth: '900px', maxHeight: '95vh', overflow: 'hidden',
                            display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)'
                        }}
                    >
                        {/* Header */}
                        <div style={{ padding: isMobile ? '1rem' : '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '1rem' }}>
                                <div style={{ width: isMobile ? '35px' : '45px', height: isMobile ? '35px' : '45px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                                    <FileText size={isMobile ? 18 : 24} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: isMobile ? '1rem' : '1.25rem', color: 'rgb\(18 37 74\)' }}>{affidavit.type}</h3>
                                    <div style={{ fontSize: '11px', color: '#778eaeff' }}>CRMS-{affidavit.id} • {formatDate(affidavit.created_at)}</div>
                                </div>
                            </div>
                            <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', padding: '0.4rem', borderRadius: '50%', color: '#778eaeff', cursor: 'pointer' }}>
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content */}
                        <div style={{ padding: isMobile ? '1rem' : '2rem', overflowY: 'auto', flex: 1, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr', gap: isMobile ? '1.5rem' : '2rem' }}>
                            {/* Sidebar Info */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <section>
                                    <h4 style={{ color: '#778eaeff', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>Deponent Details</h4>
                                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                            <div style={{ width: '32px', height: '32px', background: '#3b82f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', color: 'white' }}>
                                                {affidavit.first_name?.[0] || '?'}{affidavit.surname?.[0] || '?'}
                                            </div>
                                            <div style={{ fontWeight: '600', color: 'rgb\(18 37 74\)', fontSize: '14px', textTransform: 'capitalize' }}>{affidavit.first_name || 'Unknown'} {affidavit.surname || ''}</div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                <Mail size={12} /> {affidavit.email || 'No Email'}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '12px' }}>
                                                <Hash size={12} /> NIN: {affidavit.nin || 'N/A'}
                                            </div>
                                            {affidavit.filed_by_name && (
                                                <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '11px', fontWeight: 'bold' }}>
                                                    <User size={12} /> Filed by: {affidavit.filed_by_name}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h4 style={{ color: '#778eaeff', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>Status History</h4>
                                    <div style={{ paddingLeft: '1rem', borderLeft: '2px dashed #e2e8f0' }}>
                                        <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
                                            <div style={{ position: 'absolute', left: '-1.4rem', top: '0', width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6', border: '2px solid #ffffff' }} />
                                            <div style={{ fontSize: '12px', color: 'rgb\(18 37 74\)', fontWeight: '600' }}>Application Submitted</div>
                                            <div style={{ fontSize: '10px', color: '#778eaeff' }}>Received by system</div>
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ position: 'absolute', left: '-1.4rem', top: '0', width: '10px', height: '10px', borderRadius: '50%', background: affidavit.status === 'completed' ? '#10b981' : '#f59e0b', border: '2px solid #ffffff' }} />
                                            <div style={{ fontSize: '12px', color: affidavit.status === 'completed' ? '#10b981' : '#f59e0b', fontWeight: '600' }}>
                                                {affidavit.status === 'completed' ? 'CFO Verified' : 'Awaiting CFO Approval'}
                                            </div>
                                            <div style={{ fontSize: '10px', color: '#778eaeff' }}>Final stage of approval</div>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Document Preview */}
                            <div style={{ background: 'white', color: 'rgb\(18 37 74\)', padding: isMobile ? '1.5rem' : '3rem', borderRadius: '12px', fontFamily: "'Times New Roman', serif", height: 'fit-content', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                                <div style={{ borderBottom: '2px solid #1e3a8a', paddingBottom: '0.75rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                                    <h4 style={{ margin: 0, textTransform: 'uppercase', color: '#1e3a8a', fontSize: '14px' }}>Affidavit Content Preview</h4>
                                </div>
                                <div dangerouslySetInnerHTML={{ __html: affidavit.content }} style={{ fontSize: '13px', lineHeight: '1.6', textAlign: 'justify' }} />
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div style={{ padding: isMobile ? '1rem' : '1.5rem 2rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            {affidavit.status === 'submitted' && staff?.role !== 'clerk' && (
                                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.75rem', width: isMobile ? '100%' : 'auto' }}>
                                    <button
                                        onClick={() => onReject(affidavit)}
                                        style={{ flex: 1, padding: '0.75rem 1.25rem', borderRadius: '12px', background: '#ef4444', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '13px' }}
                                    >
                                        <XCircle size={16} /> Reject
                                    </button>
                                    <button
                                        onClick={() => onVerify(affidavit)}
                                        style={{ flex: 1, padding: '0.75rem 1.25rem', borderRadius: '12px', background: '#10b981', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '13px' }}
                                    >
                                        <CheckCircle size={16} /> Approve
                                    </button>
                                </div>
                            )}
                            {affidavit.status === 'completed' && (
                                <button
                                    onClick={async () => {
                                        try {
                                            const response = await api.get(`/affidavits/${affidavit.id}/download`, {
                                                responseType: 'blob'
                                            });
                                            const url = window.URL.createObjectURL(new Blob([response.data]));
                                            const link = document.createElement('a');
                                            link.href = url;
                                            const fileName = affidavit.affidavit_path ? `Affidavit_${affidavit.id}_Certified.pdf` : `Affidavit_${affidavit.id}_Draft.pdf`;
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
                                    style={{ width: isMobile ? '100%' : 'auto', padding: '0.75rem 1.25rem', borderRadius: '12px', background: '#3b82f6', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '13px' }}
                                >
                                    <Download size={16} /> Download Copy
                                </button>
                            )}
                            <button onClick={onClose} style={{ width: isMobile ? '100%' : 'auto', padding: '0.75rem 1.5rem', borderRadius: '12px', background: 'white', border: '1px solid #e2e8f0', color: '#778eaeff', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>Close</button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};


export const PendingAffidavitsTable = ({ staff, isMobile }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAffidavit, setSelectedAffidavit] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sourceFilter, setSourceFilter] = useState('all');
    const { showModal } = useModal();

    const filteredData = React.useMemo(() => {
        let result = [...data];
        if (sourceFilter !== 'all') {
            result = result.filter(item => item.source?.toLowerCase() === sourceFilter.toLowerCase());
        }
        return result;
    }, [data, sourceFilter]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get('/staff/affidavits/pending-verification');
            setData(res.data);
            setError(null);
        } catch (error) {
            console.error('Error fetching pending affidavits:', error);
            setError('Failed to load pending affidavits. ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleVerify = async (affidavit) => {
        showModal({
            type: 'info',
            title: 'Approve Affidavit?',
            message: `Are you sure you want to approve ${affidavit.first_name}'s affidavit? This will mark it as officially sworn.`,
            showCancel: true,
            confirmText: 'Approve Now',
            onConfirm: async () => {
                try {
                    await api.put(`/affidavits/${affidavit.id}/approve`, { nextStatus: 'completed' });
                    showModal({ type: 'success', title: 'Affidavit Approved', message: 'The document has been approved and the deponent has been notified.' });
                    setIsModalOpen(false);
                    fetchData();
                } catch (error) {
                    showModal({ type: 'error', title: 'Verification Failed', message: error.response?.data?.error || 'Failed to update status.' });
                }
            }
        });
    };

    const handleReject = async (affidavit) => {
        showModal({
            type: 'error',
            title: 'Reject Application?',
            message: `Please provide a reason for rejecting ${affidavit.first_name}'s affidavit. This will be visible to the deponent.`,
            showCancel: true,
            showInput: true,
            inputType: 'textarea',
            inputPlaceholder: 'Enter rejection reason (e.g., identity document unclear, content error...)',
            confirmText: 'Confirm Rejection',
            onConfirm: async (remarks) => {
                if (!remarks || remarks.trim() === '') {
                    showModal({ type: 'error', title: 'Action Required', message: 'You must provide a reason for rejection.' });
                    return;
                }
                try {
                    await api.put(`/affidavits/${affidavit.id}/approve`, { nextStatus: 'rejected', remarks });
                    showModal({ type: 'success', title: 'Application Rejected', message: 'The document has been rejected and the deponent has been notified.' });
                    setIsModalOpen(false);
                    fetchData();
                } catch (error) {
                    showModal({ type: 'error', title: 'Rejection Failed', message: error.response?.data?.error || 'Failed to update status.' });
                }
            }
        });
    };

    const columns = [
        { key: 'id', label: 'ID', sortable: true, render: (val) => `CRMS-${val}`, hiddenMobile: true },
        {
            key: 'first_name',
            label: 'Deponent',
            sortable: true,
            render: (val, row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                        {val?.[0] || '?'}{row.surname?.[0] || '?'}
                    </div>
                    <div>
                        <div style={{ fontWeight: '600', color: 'rgb\(18 37 74\)', fontSize: isMobile ? '12px' : '14px', textTransform: 'capitalize' }}>{val || 'Unknown'} {row.surname || ''}</div>
                        {!isMobile && <div style={{ fontSize: '11px', color: '#778eaeff' }}>{row.email}</div>}
                    </div>
                </div>
            )
        },
        { key: 'type', label: 'Type', sortable: true },
        {
            key: 'source',
            label: 'Source',
            sortable: true,
            render: (val, row) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: val === 'Jurat' ? 'rgba(14, 165, 233, 0.1)' : 'rgba(148, 163, 184, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {val === 'Jurat' ? <Landmark size={12} color="#0ea5e9" /> : <User size={12} color="#778eaeff" />}
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: val === 'Jurat' ? '#0ea5e9' : '#778eaeff' }}>
                            {val?.toUpperCase() || 'SELF'}
                        </span>
                    </div>
                    {row.filed_by_name && <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: '28px' }}>{row.filed_by_name}</span>}
                </div>
            ),
            hiddenMobile: true
        },
        { key: 'created_at', label: 'Filed Date', sortable: true, render: (val) => formatDate(val), hiddenMobile: true },
        {
            key: 'remarks',
            label: 'Remarks/Reason',
            render: (val) => val ? (
                <div style={{ fontSize: '11px', color: '#778eaeff', fontStyle: 'italic', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={val}>
                    {val}
                </div>
            ) : '-'
        },
        {
            key: 'status',
            label: 'Process',
            render: () => (
                <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', background: '#eff6ff', color: '#3b82f6' }}>SUBMITTED</span>
            ),
            hiddenMobile: true
        },
        {
            key: 'virtual_oath_taken',
            label: 'Virtual Oath Status',
            sortable: true,
            render: (val) => {
                let color = '#778eaeff';
                let label = 'PENDING';
                const statusStr = String(val).toLowerCase();
                if (statusStr === 'requested' || val === 1) { color = '#3b82f6'; label = 'REQUESTED'; }
                if (statusStr === 'completed' || statusStr === 'complete' || val === 2) { color = '#10b981'; label = 'COMPLETE'; }
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }}></div>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: color }}>{label}</span>
                    </div>
                );
            }
        },
    ];

    const actions = (row) => (
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
                onClick={() => { setSelectedAffidavit(row); setIsModalOpen(true); }}
                style={{ padding: '0.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#778eaeff', cursor: 'pointer' }}
                title="View for Review"
            >
                <Eye size={18} />
            </button>
            {!isMobile && (
                <button
                    onClick={() => handleVerify(row)}
                    style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', border: 'none', borderRadius: '8px', color: '#10b981', cursor: 'pointer' }}
                    title="Verify Instantly"
                >
                    <CheckCircle size={18} />
                </button>
            )}
        </div>
    );

    return (
        <div className="glass-card" style={{ background: '#ffffff', border: '1px solid #f1f5f9', padding: isMobile ? '1rem' : '1.5rem', color: 'rgb\(18 37 74\)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#778eaeff' }}>Filter Source:</span>
                <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '10px', gap: '4px' }}>
                    {['all', 'self', 'jurat'].map(f => (
                        <button
                            key={f}
                            onClick={() => setSourceFilter(f)}
                            style={{
                                padding: '6px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                background: sourceFilter === f ? 'white' : 'transparent',
                                color: sourceFilter === f ? '#0284c7' : '#778eaeff',
                                boxShadow: sourceFilter === f ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            {f.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>
            {error && <div style={{ color: '#ef4444', marginBottom: '1rem', padding: '1rem', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>{error}</div>}
            <DataTable
                columns={columns}
                data={filteredData}
                loading={loading}
                actions={actions}
                searchPlaceholder="Search queue..."
                onRowClick={(row) => { setSelectedAffidavit(row); setIsModalOpen(true); }}
                isMobile={isMobile}
            />
            <AffidavitDetailModal
                affidavit={selectedAffidavit}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onVerify={handleVerify}
                onReject={handleReject}
                staff={staff}
            />
        </div>
    );
};


export const AllAffidavitsTable = ({ staff, isMobile }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAffidavit, setSelectedAffidavit] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sourceFilter, setSourceFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const filteredData = React.useMemo(() => {
        let result = [...data];
        if (sourceFilter !== 'all') {
            result = result.filter(item => item.source?.toLowerCase() === sourceFilter.toLowerCase());
        }
        if (statusFilter !== 'all') {
            result = result.filter(item => item.status?.toLowerCase() === statusFilter.toLowerCase());
        }
        return result;
    }, [data, sourceFilter, statusFilter]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get('/staff/affidavits/all');
            setData(res.data);
            setError(null);
        } catch (error) {
            console.error('Error fetching all affidavits:', error);
            setError('Failed to load records. ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const columns = [
        { key: 'id', label: 'ID', sortable: true, render: (val) => `CRMS-${val}`, hiddenMobile: true },
        {
            key: 'first_name',
            label: 'Deponent',
            sortable: true,
            render: (val, row) => (
                <div>
                    <div style={{ fontWeight: '600', color: 'rgb\(18 37 74\)', fontSize: isMobile ? '12px' : '14px', textTransform: 'capitalize' }}>{val || 'Unknown'} {row.surname || ''}</div>
                    {!isMobile && <div style={{ fontSize: '11px', color: '#778eaeff' }}>{row.email}</div>}
                </div>
            )
        },
        { key: 'type', label: 'Type', sortable: true },
        {
            key: 'source',
            label: 'Source',
            sortable: true,
            render: (val, row) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: val === 'Jurat' ? 'rgba(14, 165, 233, 0.1)' : 'rgba(148, 163, 184, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {val === 'Jurat' ? <Landmark size={12} color="#0ea5e9" /> : <User size={12} color="#778eaeff" />}
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: val === 'Jurat' ? '#0ea5e9' : '#778eaeff' }}>
                            {val?.toUpperCase() || 'SELF'}
                        </span>
                    </div>
                    {row.filed_by_name && <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: '28px' }}>{row.filed_by_name}</span>}
                </div>
            ),
            hiddenMobile: true
        },
        { key: 'created_at', label: 'Filed Date', sortable: true, render: (val) => formatDate(val), hiddenMobile: true },
        {
            key: 'remarks',
            label: 'Remarks/Reason',
            render: (val) => val ? (
                <div style={{ fontSize: '11px', color: '#778eaeff', fontStyle: 'italic', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={val}>
                    {val}
                </div>
            ) : '-'
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (val, row) => {
                let displayStatus = val.toUpperCase();
                let bg = '#f8fafc';
                let color = '#778eaeff';

                if (val === 'submitted') {
                    bg = '#eff6ff'; color = '#3b82f6'; // Blue
                } else if (val === 'completed') {
                    bg = '#ecfdf5'; color = '#10b981'; // Green
                } else if (val === 'rejected') {
                    bg = '#fef2f2'; color = '#ef4444'; // Red
                }

                return (
                    <span
                        title={val === 'rejected' ? `Reason: ${row.remarks || 'No reason provided'}` : ''}
                        style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            background: bg,
                            color: color,
                            cursor: val === 'rejected' ? 'help' : 'default',
                            border: val === 'rejected' ? '1px dashed #ef4444' : 'none'
                        }}
                    >
                        {displayStatus}
                    </span>
                );
            }
        },
        {
            key: 'virtual_oath_taken',
            label: 'Virtual Oath Status',
            render: (val) => {
                let color = '#778eaeff';
                let label = 'PENDING';
                const statusStr = String(val).toLowerCase();
                if (statusStr === 'requested' || val === 1) { color = '#3b82f6'; label = 'REQUESTED'; }
                if (statusStr === 'completed' || statusStr === 'complete' || val === 2) { color = '#10b981'; label = 'COMPLETE'; }
                return (
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: color }}>{label}</span>
                );
            },
            hiddenMobile: true
        },
    ];

    const actions = (row) => (
        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
            <button
                onClick={() => { setSelectedAffidavit(row); setIsModalOpen(true); }}
                style={{ padding: '0.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#778eaeff', cursor: 'pointer' }}
            >
                <Eye size={16} />
            </button>
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
                >
                    <Download size={16} />
                </button>
            )}
        </div>
    );

    return (
        <div className="glass-card" style={{ background: '#ffffff', border: '1px solid #f1f5f9', padding: isMobile ? '1rem' : '1.5rem', color: 'rgb\(18 37 74\)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#778eaeff' }}>Source:</span>
                    <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '10px', gap: '4px' }}>
                        {['all', 'self', 'jurat'].map(f => (
                            <button
                                key={f}
                                onClick={() => setSourceFilter(f)}
                                style={{
                                    padding: '6px 16px', borderRadius: '8px', border: 'none', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer',
                                    background: sourceFilter === f ? 'white' : 'transparent',
                                    color: sourceFilter === f ? '#0284c7' : '#778eaeff',
                                    boxShadow: sourceFilter === f ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {f.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#778eaeff' }}>Status:</span>
                    <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '10px', gap: '4px' }}>
                        {['all', 'submitted', 'completed', 'rejected'].map(s => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                style={{
                                    padding: '6px 16px', borderRadius: '8px', border: 'none', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer',
                                    background: statusFilter === s ? 'white' : 'transparent',
                                    color: statusFilter === s ? '#0284c7' : '#778eaeff',
                                    boxShadow: statusFilter === s ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {s.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            {error && <div style={{ color: '#ef4444', marginBottom: '1rem', padding: '1rem', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>{error}</div>}
            <DataTable
                columns={columns}
                data={filteredData}
                loading={loading}
                actions={actions}
                searchPlaceholder="Search all records..."
                onRowClick={(row) => { setSelectedAffidavit(row); setIsModalOpen(true); }}
                isMobile={isMobile}
            />
            <AffidavitDetailModal
                affidavit={selectedAffidavit}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onVerify={() => { }} // No verify action here
                onReject={() => { }} // No reject action here
                staff={staff}
            />
        </div>
    );
};

export const AllDeponentsTable = ({ isMobile }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDeponent, setSelectedDeponent] = useState(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const { showModal } = useModal();

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get('/staff/users/deponents');
            setData(res.data);
            setError(null);
        } catch (error) {
            console.error('Error fetching deponents:', error);
            setError('Failed to load deponents. ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const columns = [
        {
            key: 'first_name',
            label: 'Deponent',
            sortable: true,
            render: (val, row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', background: '#f1f5f9', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {row.picture_path ? (
                            <img src={row.picture_path.startsWith('http') ? row.picture_path : `${import.meta.env.VITE_API_URL.replace('/api', '')}${row.picture_path}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : <User size={16} color="#94a3b8" />}
                    </div>
                    <div>
                        <div style={{ fontWeight: '600', color: 'rgb\(18 37 74\)', fontSize: isMobile ? '12px' : '14px', textTransform: 'capitalize' }}>{val || 'Unknown'} {row.surname || ''}</div>
                        {!isMobile && <div style={{ fontSize: '11px', color: '#778eaeff' }}>{row.email}</div>}
                    </div>
                </div>
            )
        },
        {
            key: 'source',
            label: 'Source',
            sortable: true,
            render: (val) => (
                <span style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    background: val === 'Jurat' ? 'rgba(14, 165, 233, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                    color: val === 'Jurat' ? '#0ea5e9' : '#778eaeff',
                    border: `1px solid ${val === 'Jurat' ? 'rgba(14, 165, 233, 0.2)' : 'rgba(148, 163, 184, 0.2)'}`
                }}>
                    {val?.toUpperCase()}
                </span>
            )
        },
        {
            key: 'phone',
            label: 'Contact Info',
            render: (val, row) => (
                <div>
                    <div style={{ color: 'rgb\(18 37 74\)', fontSize: isMobile ? '12px' : '13px' }}>{val}</div>
                    {!isMobile && <div style={{ color: '#778eaeff', fontSize: '11px' }}>NIN: {row.nin}</div>}
                </div>
            )
        },
        {
            key: 'status',
            label: 'Account',
            sortable: true,
            render: (val) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: val === 'active' ? '#10b981' : '#ef4444' }} />
                    <span style={{ color: val === 'active' ? '#10b981' : '#ef4444', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>{val}</span>
                </div>
            ),
            hiddenMobile: true
        },
        {
            key: 'affidavit_count',
            label: 'Affidavits',
            sortable: true,
            render: (val) => (
                <div style={{ textAlign: 'center' }}>
                    <span style={{
                        background: 'rgba(59, 130, 246, 0.2)',
                        color: '#60a5fa',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                    }}>
                        {val || 0}
                    </span>
                </div>
            ),
            hiddenMobile: true
        },
        { key: 'created_at', label: 'Joined', sortable: true, render: (val) => formatDate(val), hiddenMobile: true },
    ];

    const actions = (row) => (
        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
            <button
                onClick={() => { setSelectedDeponent(row); setIsProfileModalOpen(true); }}
                style={{ padding: '0.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#778eaeff', cursor: 'pointer' }}
            >
                <User size={16} />
            </button>
            {!isMobile && (
                <button
                    onClick={() => window.location.href = `mailto:${row.email}`}
                    style={{ padding: '0.5rem', background: 'rgba(56, 189, 248, 0.1)', border: 'none', borderRadius: '8px', color: '#38bdf8', cursor: 'pointer' }}
                    title="Send Message"
                >
                    <Mail size={16} />
                </button>
            )}
        </div>
    );

    return (
        <div className="glass-card" style={{ background: '#ffffff', border: '1px solid #f1f5f9', padding: isMobile ? '1rem' : '1.5rem', color: 'rgb\(18 37 74\)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            {error && <div style={{ color: '#ef4444', marginBottom: '1rem', padding: '1rem', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>{error}</div>}
            <DataTable
                columns={columns}
                data={data}
                loading={loading}
                actions={actions}
                searchPlaceholder="Search deponents..."
                isMobile={isMobile}
            />
            <DeponentProfileModal
                deponent={selectedDeponent}
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />
        </div>
    );
};

export const VirtualOathQueue = ({ staff, isMobile: isMobileProp }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAffidavit, setSelectedAffidavit] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { showModal } = useModal();

    const [isMobileInternal, setIsMobileInternal] = useState(window.innerWidth <= 1024);
    const isMobile = isMobileProp !== undefined ? isMobileProp : isMobileInternal;

    useEffect(() => {
        const handleResize = () => setIsMobileInternal(window.innerWidth <= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get('/staff/affidavits/pending-verification?oathOnly=true');
            setData(res.data);
            setError(null);
        } catch (error) {
            console.error('Error fetching live queue:', error);
            setError('Failed to load live verification queue.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // Polling every 10s
        return () => clearInterval(interval);
    }, []);

    const handleVerify = async (affidavit) => {
        showModal({
            type: 'info',
            title: 'Approve Affidavit?',
            message: `Are you sure you want to approve ${affidavit.first_name}'s affidavit? This will compile the final certified PDF.`,
            showCancel: true,
            confirmText: 'Approve & Certify',
            onConfirm: async () => {
                try {
                    await api.put(`/affidavits/${affidavit.id}/approve`, { nextStatus: 'completed' });
                    showModal({ type: 'success', title: 'Certified & Approved', message: 'The affidavit has been certified, PDF generated, and deponent notified.' });
                    setIsModalOpen(false);
                    fetchData();
                } catch (error) {
                    console.error("Verification Process Failed:", error);
                    showModal({ type: 'error', title: 'Verification Failed', message: error.response?.data?.error || error.message || 'Failed to complete process.' });
                }
            }
        });
    };

    const handleReject = async (affidavit) => {
        showModal({
            type: 'error',
            title: 'Reject Application?',
            message: `Please provide a reason for rejecting ${affidavit.first_name}'s affidavit.`,
            showCancel: true,
            showInput: true,
            inputType: 'textarea',
            inputPlaceholder: 'Reason for rejection...',
            confirmText: 'Yes, Reject',
            onConfirm: async (remarks) => {
                if (!remarks || remarks.trim() === '') {
                    showModal({ type: 'error', title: 'Action Required', message: 'You must provide a reason for rejection.' });
                    return;
                }
                try {
                    await api.put(`/affidavits/${affidavit.id}/approve`, { nextStatus: 'rejected', remarks });
                    showModal({ type: 'success', title: 'Application Rejected', message: 'The document has been rejected.' });
                    setIsModalOpen(false);
                    fetchData();
                } catch (error) {
                    showModal({ type: 'error', title: 'Rejection Failed', message: error.response?.data?.error || 'Failed to update status.' });
                }
            }
        });
    };

    const [selectedDeponent, setSelectedDeponent] = useState(null);

    const isOnline = (lastSeen) => {
        if (!lastSeen) return false;

        // MySQL UTC_TIMESTAMP() returns a string like '2023-01-01 12:00:00'
        // We need to ensure the browser treats this as UTC by adding 'Z'
        let dateStr = lastSeen;
        if (!dateStr.includes('Z') && !dateStr.includes('+')) {
            // Check if there is a space (standard SQL format) and replace with T for ISO compliance
            dateStr = dateStr.replace(' ', 'T') + 'Z';
        }

        const lastSeenDate = new Date(dateStr);
        const now = new Date();

        // Get difference in milliseconds
        const diff = Math.abs(now.getTime() - lastSeenDate.getTime());

        // If diff is less than 90 seconds, consider online
        return diff < 90000;
    };

    const pendingRequests = data.filter(d => (d.virtual_oath_taken === 'requested' || d.virtual_oath_taken === 1) && isOnline(d.last_seen));

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'minmax(300px, 1fr) 2fr',
            gap: '1rem',
            height: isMobile ? 'calc(100vh - 120px)' : 'calc(100vh - 180px)',
            overflow: 'auto',
            padding: isMobile ? '0' : '0.5rem'
        }}>

            {/* Left Column: Waiting Queue */}
            {(!selectedDeponent || !isMobile) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ background: '#f0fdf4', border: '1px solid #dcfce7', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Video size={20} color="#10b981" />
                        <div>
                            <h4 style={{ margin: 0, color: '#10b981', fontSize: '14px' }}>Waiting Room</h4>
                            <p style={{ margin: 0, fontSize: '11px', color: '#778eaeff' }}>Deponents available online</p>
                        </div>
                        <div style={{ marginLeft: 'auto', background: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>
                            {pendingRequests.length}
                        </div>
                    </div>

                    <div className="glass-card" style={{
                        background: '#ffffff',
                        border: '1px solid #f1f5f9',
                        flex: 1,
                        overflowY: 'auto',
                        padding: '0.5rem',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                        minHeight: 0,
                        transition: 'all 0.3s ease',
                        scrollBehavior: 'smooth'
                    }}>
                        {loading ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading queue...</div>
                        ) : pendingRequests.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {pendingRequests.map(item => (
                                    <div
                                        key={item.id}
                                        onClick={async () => {
                                            setSelectedDeponent(item); // Show immediately
                                            try {
                                                const res = await api.get(`/affidavits/${item.id}`);
                                                if (res.data.meeting_id || res.data.deponent_meeting_id) {
                                                    setSelectedDeponent(prev => ({ ...prev, ...res.data }));
                                                }
                                            } catch (err) {
                                                console.error("Failed to fetch latest affidavit data", err);
                                            }
                                        }}
                                        style={{
                                            padding: '1rem',
                                            borderRadius: '8px',
                                            background: selectedDeponent?.id === item.id ? '#eff6ff' : 'white',
                                            border: selectedDeponent?.id === item.id ? '1px solid #3b82f6' : '1px solid #f1f5f9',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem'
                                        }}
                                    >
                                        <div style={{ width: '36px', height: '36px', background: '#e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#778eaeff', fontSize: '13px' }}>
                                            {item.first_name?.[0]}{item.surname?.[0]}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '600', color: 'rgb\(18 37 74\)', fontSize: '14px', textTransform: 'capitalize' }}>{item.first_name} {item.surname}</div>
                                            <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '600' }}>Online • Ready</div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSelectedAffidavit(item); setIsModalOpen(true); }}
                                            style={{ padding: '6px', background: '#f1f5f9', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', transition: 'background 0.2s', marginRight: '0.5rem' }}
                                            title="Preview Affidavit"
                                        >
                                            <Eye size={14} color="#778eaeff" />
                                        </button>
                                        <div className="animate-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '48px', height: '48px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <User size={24} color="#cbd5e1" />
                                </div>
                                <p style={{ fontSize: '14px' }}>No deponents in waiting room</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Right Column: Video Station */}
            {(!isMobile || (selectedDeponent && isMobile)) && (
                <div className="glass-card" style={{
                    background: '#ffffff',
                    border: '1px solid #f1f5f9',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'auto',
                    maxHeight: '100%',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.3s ease'
                }}>
                    {selectedDeponent ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            {/* Header */}
                            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    {isMobile && (
                                        <button onClick={() => setSelectedDeponent(null)} style={{ background: 'transparent', border: 'none', color: '#778eaeff', cursor: 'pointer', marginRight: '0.5rem' }}>
                                            ←
                                        </button>
                                    )}
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.2)' }}></div>
                                    <span style={{ fontWeight: '600', color: 'rgb\(18 37 74\)', textTransform: 'capitalize' }}>
                                        {selectedDeponent.first_name} {selectedDeponent.surname}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <button
                                        onClick={() => { setSelectedAffidavit(selectedDeponent); setIsModalOpen(true); }}
                                        style={{ padding: '0.4rem 0.8rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#778eaeff', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                    >
                                        <FileText size={14} /> Doc
                                    </button>
                                    <button
                                        onClick={() => handleVerify(selectedDeponent)}
                                        style={{ padding: '0.4rem 1rem', background: '#10b981', border: 'none', borderRadius: '16px', color: 'white', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    >
                                        <CheckCircle size={14} /> APPROVE
                                    </button>
                                </div>
                            </div>
                            <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                                <VideoCallSession
                                    deponentName={`${selectedDeponent.first_name} ${selectedDeponent.surname}`}
                                    meetingId={selectedDeponent.deponent_meeting_id || selectedDeponent.meeting_id}
                                    onEndSession={() => setSelectedDeponent(null)}
                                />
                            </div>
                        </div>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', textAlign: 'center' }}>
                            <div style={{ width: '80px', height: '80px', background: '#f0f9ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                <Video size={32} color="#0ea5e9" />
                            </div>
                            <h3 style={{ color: 'rgb\(18 37 74\)', marginBottom: '0.5rem' }}>Virtual Session Inactive</h3>
                            <p style={{ color: '#778eaeff', maxWidth: '300px', lineHeight: '1.5' }}>Select a deponent from the waiting room to start.</p>
                        </div>
                    )}
                </div>
            )}

            <AffidavitDetailModal
                affidavit={selectedAffidavit}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onVerify={handleVerify}
                onReject={handleReject}
                staff={staff}
            />
        </div>
    );
};
