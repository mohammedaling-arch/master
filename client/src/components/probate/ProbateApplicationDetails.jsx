import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, User, Users, Shield, Home, Briefcase,
    Calendar, MapPin, Download, ArrowLeft, Loader2,
    CheckCircle, Clock, XCircle, Pencil, Trash2, Plus, X,
    Phone, Mail, Target, Upload, CreditCard, Camera, Eye
} from 'lucide-react';
import api from '../../utils/api';
import { generateBankRequestLetterPDF, generatePaymentReceiptPDF, generateSuretyFormPDF } from '../../utils/pdfGenerator';
import { formatDate } from '../../utils/dateUtils';
import PaymentGateway from '../common/PaymentGateway';
import ImageCapture from '../common/ImageCapture';
import UniversalUploader from '../common/UniversalUploader';

// --- Sub-components ---

const Modal = ({ title, children, onSave, onClose, saving }) => (
    <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 100, display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: '1rem'
        }}
        onClick={onClose}
    >
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            style={{
                background: 'white', padding: '2rem', borderRadius: '16px',
                maxWidth: '600px', width: '100%', position: 'relative',
                maxHeight: '90vh', overflowY: 'auto'
            }}
            onClick={e => e.stopPropagation()}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>{title}</h3>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={onSave}>
                {children}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                    <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white' }}>Cancel</button>
                    <button type="submit" disabled={saving} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', background: '#3d2b1f', color: 'white', fontWeight: 'bold' }}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </motion.div>
    </motion.div>
);

const Section = ({ title, icon, children, onAdd, extraAction }) => (
    <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', background: '#f3f4f6', borderRadius: '8px', color: '#374151' }}>{icon}</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>{title}</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {extraAction}
                {onAdd && (
                    <button
                        onClick={onAdd}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            fontSize: '13px', color: 'white', fontWeight: '600',
                            background: '#3b82f6', border: 'none', cursor: 'pointer',
                            padding: '8px 16px', borderRadius: '8px',
                            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                        }}
                    >
                        <Plus size={16} /> Add New
                    </button>
                )}
            </div>
        </div>
        {children}
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', marginTop: '2.5rem' }} />
    </div>
);

const DocumentViewer = ({ doc, onClose }) => {
    if (!doc) return null;
    const fullPath = `${api.defaults.baseURL.replace('/api', '')}${doc.document_path}`;
    const isPdf = doc.document_path.toLowerCase().endsWith('.pdf');

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
            <div style={{ width: '100%', maxWidth: '1000px', height: '90%', background: 'white', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <div style={{ padding: '15px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText size={20} color="#3b82f6" /> {doc.document_name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <a
                            href={fullPath}
                            download
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                background: '#3b82f6', color: 'white', border: 'none',
                                padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                                fontSize: '13px', fontWeight: 'bold', textDecoration: 'none'
                            }}
                        >
                            <Download size={16} /> Download
                        </a>
                        <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                            <X size={24} />
                        </button>
                    </div>
                </div>
                <div style={{ flex: 1, overflow: 'hidden', background: '#525659', position: 'relative' }}>
                    {isPdf ? (
                        <iframe src={`${fullPath}${fullPath.includes('#') ? '' : '#view=FitH'}`} style={{ width: '100%', height: '100%', border: 'none' }} title="Document Viewer"></iframe>
                    ) : (
                        <div style={{ width: '100%', height: '100%', overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                            <img src={fullPath} alt="Document" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', borderRadius: '4px' }} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---

const ProbateApplicationDetails = ({ applicationId, onBack, isMobile, user, staffMode = false }) => {
    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    // Modal States
    const [activeModal, setActiveModal] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({});
    const [configs, setConfigs] = useState([]);
    const [uploadingDoc, setUploadingDoc] = useState(null);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingDocId, setDeletingDocId] = useState(null);
    const [viewingDoc, setViewingDoc] = useState(null);
    const [modalError, setModalError] = useState("");
    const [payingDoc, setPayingDoc] = useState(null);
    const [showSuretyCapture, setShowSuretyCapture] = useState(false);
    const [uploadModalTarget, setUploadModalTarget] = useState(null);

    const fetchDetails = async () => {
        try {
            const appEndpoint = staffMode ? `/staff/probate/${applicationId}` : `/user/probate-applications/${applicationId}`;
            const [appRes, configRes] = await Promise.all([
                api.get(appEndpoint),
                api.get('/public/probate-config')
            ]);
            setApplication(appRes.data);
            setConfigs(configRes.data.filter(c => c.type === 'upload'));
        } catch (err) {
            console.error("Failed to fetch application details", err);
            setError(err.response?.data?.error || "Failed to load application details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [applicationId]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            case 'pending_registrar':
            case 'pending_judge': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleUpload = async (docName, file) => {
        if (!file) return;
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('documentName', docName);

            await api.post(`/public/probate/${applicationId}/documents`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            await fetchDetails();
            setActiveModal(null);
            setUploadingDoc(null);

            // Fetch the updated application to find the newly uploaded document's details (like ID and fee)
            const updatedApp = await api.get(`/user/probate-applications/${applicationId}`);
            const newlyUploaded = updatedApp.data.documents?.find(d => d.document_name === docName);

            if (newlyUploaded && newlyUploaded.document_pay > 0 && newlyUploaded.pay_status === 'unpaid') {
                setPayingDoc(newlyUploaded);
            }
        } catch (err) {
            alert(err.response?.data?.error || "Upload failed");
        } finally {
            setSaving(false);
        }
    };

    const handlePaymentSuccess = async (paymentData) => {
        if (!payingDoc) return;
        setSaving(true);
        try {
            await api.post(`/public/probate-document-payment/${payingDoc.id}`, {
                transaction_id: paymentData.reference,
                amount: payingDoc.document_pay,
                payment_gateway: 'paystack' // Defaulting for now
            });
            await fetchDetails();
            setPayingDoc(null);
        } catch (err) {
            alert(err.response?.data?.error || "Payment record failed");
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!deletingDocId) return;
        setSaving(true);
        try {
            await api.delete(`/public/probate/documents/${deletingDocId}`);
            await fetchDetails();
            setShowDeleteModal(false);
            setDeletingDocId(null);
        } catch (err) {
            setModalError(err.response?.data?.error || err.response?.data?.message || err.message || "Deletion failed");
            setShowErrorModal(true);
            setShowDeleteModal(false);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteDocument = (docId) => {
        setDeletingDocId(docId);
        setShowDeleteModal(true);
    };

    const handleSaveMain = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put(`/user/probate-applications/${applicationId}`, formData);
            await fetchDetails();
            setActiveModal(null);
        } catch (err) {
            alert(err.response?.data?.error || "Failed to update application");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveRelational = async (type, e) => {
        e.preventDefault();
        setSaving(true);
        const endpoint = `/user/probate-applications/${applicationId}/${type}`;
        try {
            let data = formData;
            let headers = {};

            if (type === 'sureties' && formData.picture) {
                const fd = new FormData();
                Object.keys(formData).forEach(key => {
                    if (formData[key] !== null && formData[key] !== undefined) {
                        fd.append(key, formData[key]);
                    }
                });
                data = fd;
                headers = { 'Content-Type': 'multipart/form-data' };
            }

            console.log(`[FRONTEND SAVE] Type: ${type}, Data:`, data);
            if (editingItem) {
                await api.put(`${endpoint}/${editingItem.id}`, data, { headers });
            } else {
                await api.post(endpoint, data, { headers });
            }
            await fetchDetails();
            setActiveModal(null);
            setEditingItem(null);
        } catch (err) {
            alert(err.response?.data?.error || `Failed to save ${type}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (type, id) => {
        if (!window.confirm(`Are you sure you want to delete this ${type.slice(0, -1)}?`)) return;
        try {
            await api.delete(`/user/probate-applications/${applicationId}/${type}/${id}`);
            await fetchDetails();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to delete item");
        }
    };

    const openModal = (type, item = null) => {
        setActiveModal(type);
        setEditingItem(item);
        if (type === 'deceased') {
            setFormData({
                deceased_name: application.deceased_name,
                date_of_death: application.date_of_death?.split('T')[0],
                home_address: application.home_address,
                death_location_address: application.death_location_address,
                occupation: application.occupation,
                relationship_to_nok: application.relationship_to_nok,
                employer_name: application.employer_name,
                employer_address: application.employer_address
            });
        } else if (item) {
            setFormData({ ...item });
        } else {
            setFormData({});
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 text-gray-500">
            <Loader2 className="animate-spin mb-4" size={48} />
            <p>Loading application details...</p>
        </div>
    );

    if (error) return (
        <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl">
            <XCircle size={48} className="mx-auto mb-4" />
            <p>{error}</p>
            <button onClick={onBack} className="mt-4 px-6 py-2 bg-gray-800 text-white rounded-lg">Go Back</button>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm overflow-hidden"
            style={{ padding: isMobile ? '1rem' : '2rem' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={onBack} style={{ padding: '0.5rem', borderRadius: '50%', background: '#f3f4f6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowLeft size={20} /></button>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Application Details</h2>
                    <p style={{ color: '#6b7280', fontSize: '14px' }}>PRB-{application.id} • Filed on {formatDate(application.created_at)}</p>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Gazette Status */}
                        {(application.approval_date || (application.status === 'approved' && application.updated_at)) && (() => {
                            const dateVal = application.approval_date || application.updated_at;
                            const approval = new Date(dateVal);
                            const today = new Date();
                            approval.setHours(0, 0, 0, 0);
                            today.setHours(0, 0, 0, 0);
                            const diffTime = today - approval;
                            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                            const isMatured = diffDays >= 21;
                            return (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                    <span style={{
                                        padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase',
                                        background: isMatured ? '#dcfce7' : '#fef9c3',
                                        color: isMatured ? '#166534' : '#854d0e',
                                        border: `1px solid ${isMatured ? '#bbf7d0' : '#fde047'}`,
                                        marginBottom: '2px'
                                    }}>
                                        Gazette: {isMatured ? 'Matured' : 'Process'}
                                    </span>
                                    <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: '500' }}>
                                        {diffDays} Day{diffDays !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            );
                        })()}

                        <span style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            background: application.status === 'approved' ? '#dcfce7' :
                                application.status === 'completed' ? '#dcfce7' :
                                    application.status === 'under_processing' ? '#dbeafe' :
                                        application.status === 'cr_pending' ? '#fef9c3' :
                                            application.status === 'pending_registrar' ? '#e0f2fe' :
                                                application.status === 'rejected' ? '#fee2e2' : '#f1f5f9',
                            color: application.status === 'approved' ? '#15803d' :
                                application.status === 'completed' ? '#15803d' :
                                    application.status === 'under_processing' ? '#1e40af' :
                                        application.status === 'cr_pending' ? '#854d0e' :
                                            application.status === 'pending_registrar' ? '#0369a1' :
                                                application.status === 'rejected' ? '#b91c1c' : '#778eaeff',
                            border: '1px solid currentColor'
                        }}>
                            {(application.status || 'pending').replace('_', ' ')}
                        </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                        {application.acceptance && (
                            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
                                <span style={{ color: '#6b7280', marginRight: '4px' }}>Acceptance:</span>
                                <span style={{ color: application.acceptance === 'Accepted' ? '#059669' : '#ef4444' }}>
                                    {application.acceptance}
                                </span>
                                {application.acceptance_date && (
                                    <span style={{ color: '#6b7280', marginLeft: '8px' }}>
                                        on {formatDate(application.acceptance_date)}
                                    </span>
                                )}
                            </div>
                        )}
                        {application.approval && (
                            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
                                <span style={{ color: '#6b7280', marginRight: '4px' }}>Approval:</span>
                                <span style={{ color: application.approval === 'Approved' ? '#059669' : '#ef4444' }}>
                                    {application.approval}
                                </span>
                                {application.approval_date && (
                                    <span style={{ color: '#6b7280', marginLeft: '8px' }}>
                                        on {formatDate(application.approval_date)}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Deceased Details */}
            <Section title="Deceased Details" icon={<User size={20} />}>
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => openModal('deceased')}
                        style={{ position: 'absolute', top: '-3rem', right: 0, padding: '0.5rem', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '12px' }}
                    >
                        <Pencil size={14} /> Edit Details
                    </button>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1.5rem' }}>
                        <div><p style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Full Name</p><p style={{ fontWeight: '600', textTransform: 'uppercase' }}>{application.deceased_name}</p></div>
                        <div><p style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Date of Death</p><p style={{ fontWeight: '600' }}>{formatDate(application.date_of_death).split(' ')[0]}</p></div>
                        <div><p style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Occupation</p><p style={{ fontWeight: '600' }}>{application.occupation}</p></div>
                        {application.employer_name && <div style={{ gridColumn: isMobile ? 'auto' : 'span 3' }}><p style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Employer</p><p style={{ fontWeight: '600' }}>{application.employer_name} ({application.employer_address})</p></div>}
                        <div style={{ gridColumn: isMobile ? 'auto' : 'span 3' }}><p style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Home Address</p><p style={{ fontWeight: '600' }}>{application.home_address}</p></div>
                        <div style={{ gridColumn: isMobile ? 'auto' : 'span 3' }}><p style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Place of Death</p><p style={{ fontWeight: '600' }}>{application.death_location_address || 'Not specified'}</p></div>
                    </div>
                </div>
            </Section>

            {/* Next of Kin */}
            <Section title="Next of Kin Information" icon={<Briefcase size={20} />}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-start' }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '12px',
                            background: '#f3f4f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            border: '1px solid #e5e7eb'
                        }}>
                            {application.applicant_profile_pic ? (
                                <img
                                    src={application.applicant_profile_pic}
                                    alt="Applicant"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <div style={{ textAlign: 'center', padding: '10px' }}>
                                    <User size={30} color="#9ca3af" />
                                    <p style={{ color: '#ef4444', fontSize: '10px', fontWeight: 'bold', marginTop: '4px', lineHeight: '1.2' }}>PICTURE IS MANDATORY</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1.5rem' }}>
                        <div style={{ gridColumn: isMobile ? 'auto' : 'span 1' }}><p style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Applicant Name</p><p style={{ fontWeight: '600', textTransform: 'uppercase' }}>{application.applicant_first_name || application.first_name} {application.applicant_surname || application.surname}</p></div>
                        <div style={{ gridColumn: isMobile ? 'auto' : 'span 1' }}><p style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Relationship</p><p style={{ fontWeight: '600' }}>{application.relationship_to_nok}</p></div>
                        <div style={{ gridColumn: isMobile ? 'auto' : 'span 1' }}><p style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>NIN Number</p><p style={{ fontWeight: '600' }}>{application.applicant_nin || application.nin}</p></div>

                        <div><p style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Gender</p><p style={{ fontWeight: '600', textTransform: 'capitalize' }}>{application.applicant_gender || application.gender}</p></div>
                        <div><p style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Age</p><p style={{ fontWeight: '600' }}>{application.applicant_age || application.age} Years</p></div>
                        <div><p style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Phone</p><p style={{ fontWeight: '600' }}>{application.applicant_phone || application.phone}</p></div>

                        <div style={{ gridColumn: isMobile ? 'auto' : 'span 2' }}><p style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Email</p><p style={{ fontWeight: '600' }}>{application.applicant_email || application.email}</p></div>
                        <div><p style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Filed By</p><p style={{ fontWeight: '600', color: application.filed_by_name ? '#10b981' : '#778eaeff', textTransform: 'uppercase' }}>{application.filed_by_name ? 'Registry' : 'Self (Online)'}</p></div>
                        <div style={{ gridColumn: isMobile ? 'auto' : 'span 3' }}><p style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Residential Address</p><p style={{ fontWeight: '600' }}>{application.applicant_address || application.address}</p></div>
                    </div>
                </div>
            </Section>

            {/* Beneficiaries */}
            <Section title="Beneficiaries" icon={<Users size={20} />} onAdd={() => openModal('beneficiary')}>
                {application.beneficiaries?.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                                    <th style={{ padding: '0.75rem', fontSize: '12px', color: '#4b5563' }}>Name</th>
                                    <th style={{ padding: '0.75rem', fontSize: '12px', color: '#4b5563' }}>Relationship</th>
                                    <th style={{ padding: '0.75rem', fontSize: '12px', color: '#4b5563' }}>Age/Gender</th>
                                    <th style={{ padding: '0.75rem', fontSize: '12px', color: '#4b5563' }}>Phone</th>
                                    <th style={{ padding: '0.75rem', fontSize: '12px', color: '#4b5563', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {application.beneficiaries.map(b => (
                                    <tr key={b.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '0.75rem', textTransform: 'uppercase' }}>{b.name}</td>
                                        <td style={{ padding: '0.75rem' }}>{b.relationship}</td>
                                        <td style={{ padding: '0.75rem' }}>{b.age}Y • {b.gender}</td>
                                        <td style={{ padding: '0.75rem' }}>{b.phone || 'N/A'}</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                            <button onClick={() => openModal('beneficiary', b)} style={{ color: '#3b82f6', marginRight: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}><Pencil size={14} /></button>
                                            <button onClick={() => handleDelete('beneficiaries', b.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No beneficiaries listed yet.</p>}
            </Section>

            {/* Sureties */}
            <Section
                title="Sureties (Minimum 2)"
                icon={<Shield size={20} />}
                onAdd={() => openModal('surety')}
                extraAction={application.sureties?.length >= 2 && (
                    <button
                        onClick={() => generateSuretyFormPDF({ application, sureties: application.sureties })}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            fontSize: '13px', color: 'white', fontWeight: 'bold',
                            background: '#2ecc71', border: 'none', cursor: 'pointer',
                            padding: '8px 16px', borderRadius: '8px',
                            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                        }}
                    >
                        <Download size={16} /> Download Surety Form
                    </button>
                )}
            >
                {application.sureties?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {application.sureties.map(s => (
                            <div key={s.id} style={{
                                display: 'flex',
                                flexDirection: isMobile ? 'column' : 'row',
                                gap: '1.5rem',
                                padding: '1.5rem',
                                background: '#f9fafb',
                                borderRadius: '16px',
                                border: '1px solid #e5e7eb',
                                position: 'relative'
                            }}>
                                <div style={{
                                    width: '120px',
                                    height: '120px',
                                    borderRadius: '12px',
                                    background: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    border: '1px solid #e5e7eb',
                                    flexShrink: 0
                                }}>
                                    {s.picture_path ? (
                                        <img src={s.picture_path} alt="Surety" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '10px' }}>
                                            <User size={30} color="#9ca3af" />
                                            <p style={{ color: '#ef4444', fontSize: '10px', fontWeight: 'bold', marginTop: '4px', lineHeight: '1.2' }}>PICTURE IS MANDATORY</p>
                                        </div>
                                    )}
                                </div>
                                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1.25rem' }}>
                                    <div style={{ gridColumn: isMobile ? 'auto' : 'span 2' }}>
                                        <p style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Full Name</p>
                                        <p style={{ fontWeight: '700', fontSize: '16px', textTransform: 'uppercase' }}>{s.name}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Status</p>
                                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                            <span style={{
                                                fontSize: '11px',
                                                padding: '4px 10px',
                                                borderRadius: '12px',
                                                fontWeight: '600',
                                                background: s.acceptance === 'accepted' ? '#dcfce7' : s.acceptance === 'rejected' ? '#fee2e2' : '#f1f5f9',
                                                color: s.acceptance === 'accepted' ? '#166534' : s.acceptance === 'rejected' ? '#991b1b' : '#778eaeff',
                                                display: 'inline-block'
                                            }}>
                                                {s.acceptance ? s.acceptance.charAt(0).toUpperCase() + s.acceptance.slice(1) : 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Networth</p>
                                        <p style={{ fontWeight: '600', color: '#059669' }}>₦{Number(s.networth).toLocaleString()}</p>
                                    </div>
                                    <div style={{ gridColumn: isMobile ? 'auto' : 'span 2' }}>
                                        <p style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Residential Address</p>
                                        <p style={{ fontSize: '14px' }}>{s.address}</p>
                                    </div>
                                    <div style={{ gridColumn: isMobile ? 'auto' : 'span 3' }}>
                                        <p style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Remark / Notes</p>
                                        <p style={{ fontSize: '13px', color: '#4b5563', fontStyle: 'italic' }}>{s.remark || 'No additional remarks.'}</p>
                                    </div>
                                </div>
                                {(!s.acceptance || s.acceptance !== 'Accepted') && (
                                    <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => openModal('surety', s)} style={{ padding: '0.5rem', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', color: '#3b82f6', cursor: 'pointer' }}><Pencil size={14} /></button>
                                        <button onClick={() => handleDelete('sureties', s.id)} style={{ padding: '0.5rem', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No sureties provided yet.</p>}
            </Section>

            {/* Estate / Properties */}
            <Section title="Estate / Properties" icon={<Home size={20} />} onAdd={() => openModal('property')}>
                {application.properties?.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '1.25rem' }}>
                        {application.properties.map(p => (
                            <div key={p.id} style={{
                                padding: '1.25rem',
                                background: '#f9fafb',
                                borderRadius: '16px',
                                border: '1px solid #e5e7eb',
                                position: 'relative'
                            }}>
                                <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => openModal('property', p)} style={{ color: '#3b82f6', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '6px' }}><Pencil size={14} /></button>
                                    <button onClick={() => handleDelete('properties', p.id)} style={{ color: '#ef4444', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '6px' }}><Trash2 size={14} /></button>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        background: p.estate_type === 'Property' ? '#dcfce7' : p.estate_type === 'Bank/Pension Account' ? '#eff6ff' : '#fef2f2',
                                        color: p.estate_type === 'Property' ? '#166534' : p.estate_type === 'Bank/Pension Account' ? '#1e40af' : '#991b1b',
                                        textTransform: 'uppercase'
                                    }}>
                                        {p.estate_type}
                                    </span>
                                </div>

                                {p.estate_type === 'Property' && (
                                    <>
                                        <p style={{ fontWeight: '700', fontSize: '16px', marginBottom: '0.25rem' }}>{p.property_name}</p>
                                        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '1rem' }}>{p.property_address}</p>
                                        {(p.property_value !== null && p.property_value !== '' && p.property_value !== undefined) && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb', paddingTop: '0.75rem' }}>
                                                <span style={{ fontSize: '12px', color: '#6b7280' }}>Value:</span>
                                                <span style={{ fontWeight: '600', color: '#059669' }}>₦{Number(p.property_value).toLocaleString()}</span>
                                            </div>
                                        )}
                                    </>
                                )}

                                {p.estate_type === 'Bank/Pension Account' && (
                                    <>
                                        <p style={{ fontWeight: '700', fontSize: '16px', marginBottom: '0.25rem' }}>{p.bank_name}</p>
                                        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '0.25rem' }}>Acc Name: <b>{p.bank_account_name}</b></p>
                                        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '1rem' }}>Acc No: <b>{p.bank_account}</b></p>
                                        {(p.bank_balance !== null && p.bank_balance !== '' && p.bank_balance !== undefined) && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb', paddingTop: '0.75rem' }}>
                                                <span style={{ fontSize: '12px', color: '#6b7280' }}>Balance/Value:</span>
                                                <span style={{ fontWeight: '600', color: '#059669' }}>₦{Number(p.bank_balance).toLocaleString()}</span>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => generateBankRequestLetterPDF({ application, bankInfo: p })}
                                            style={{
                                                marginTop: '1rem',
                                                width: '100%',
                                                padding: '0.6rem',
                                                background: '#3b82f6',
                                                color: 'white',
                                                borderRadius: '8px',
                                                border: 'none',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.5rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <Download size={14} /> Download Balance Request Letter
                                        </button>
                                    </>
                                )}

                                {p.estate_type === 'Share Divident' && (
                                    <>
                                        <p style={{ fontWeight: '700', fontSize: '16px', marginBottom: '0.25rem' }}>{p.broker_name}</p>
                                        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '0.25rem' }}>Reg Name: <b>{p.broker_account_name}</b></p>
                                        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '1rem' }}>Reg No: <b>{p.broker_account}</b></p>
                                        {(p.share_value !== null && p.share_value !== '' && p.share_value !== undefined) && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb', paddingTop: '0.75rem' }}>
                                                <span style={{ fontSize: '12px', color: '#6b7280' }}>Market Value:</span>
                                                <span style={{ fontWeight: '600', color: '#059669' }}>₦{Number(p.share_value).toLocaleString()}</span>
                                            </div>
                                        )}
                                    </>
                                )}

                                {p.remark && (
                                    <p style={{ marginTop: '0.75rem', fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Note: {p.remark}</p>
                                )}
                            </div>
                        ))}
                    </div>
                ) : <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No estate or property details added yet.</p>}
            </Section>

            {/* Documents */}
            <Section title="Required Documents" icon={<FileText size={20} />} onAdd={() => openModal('new_doc')}>
                <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                <th style={{ padding: '1rem', fontSize: '13px', fontWeight: 'bold', color: '#374151' }}>Document Name</th>
                                <th style={{ padding: '1rem', fontSize: '13px', fontWeight: 'bold', color: '#374151' }}>Requirement</th>
                                <th style={{ padding: '1rem', fontSize: '13px', fontWeight: 'bold', color: '#374151' }}>Fee</th>
                                <th style={{ padding: '1rem', fontSize: '13px', fontWeight: 'bold', color: '#374151' }}>Status</th>
                                <th style={{ padding: '1rem', fontSize: '13px', fontWeight: 'bold', color: '#374151' }}>Remarks</th>
                                <th style={{ padding: '1rem', fontSize: '13px', fontWeight: 'bold', color: '#374151', textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {configs.map(config => {
                                const uploaded = application.documents?.find(d => d.document_name === config.document_name);
                                return (
                                    <tr key={config.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{config.document_name}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                fontSize: '11px',
                                                fontWeight: 'bold',
                                                color: config.is_required ? '#ef4444' : '#6b7280',
                                                background: config.is_required ? '#fef2f2' : '#f3f4f6',
                                                padding: '4px 8px',
                                                borderRadius: '4px'
                                            }}>
                                                {config.is_required ? 'REQUIRED' : 'OPTIONAL'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                                                {config.document_fee > 0 ? `₦${config.document_fee.toLocaleString()}` : 'Free'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div style={{
                                                    fontSize: '11px',
                                                    fontWeight: 'bold',
                                                    color: uploaded ? '#059669' : '#9ca3af',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}>
                                                    {uploaded ? <CheckCircle size={14} /> : <Clock size={14} />}
                                                    {uploaded ? 'UPLOADED' : 'NOT UPLOADED'}
                                                </div>
                                                {uploaded && uploaded.document_pay > 0 && (
                                                    <div style={{
                                                        fontSize: '10px',
                                                        fontWeight: 'bold',
                                                        color: uploaded.pay_status === 'paid' ? '#059669' : '#ef4444',
                                                        background: uploaded.pay_status === 'paid' ? '#ecfdf5' : '#fef2f2',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        display: 'inline-block',
                                                        width: 'fit-content'
                                                    }}>
                                                        {uploaded.pay_status?.toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontSize: '12px', color: '#4b5563', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={uploaded?.remark || ''}>
                                                {uploaded?.remark || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No remarks</span>}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                {uploaded ? (
                                                    <>
                                                        <button
                                                            onClick={() => setViewingDoc(uploaded)}
                                                            style={{
                                                                color: '#3b82f6',
                                                                fontSize: '13px',
                                                                fontWeight: '600',
                                                                textDecoration: 'none',
                                                                padding: '6px 12px',
                                                                border: '1px solid #3b82f6',
                                                                borderRadius: '6px',
                                                                background: 'transparent',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            <Eye size={14} /> View
                                                        </button>
                                                        {uploaded.pay_status === 'unpaid' && (
                                                            <button
                                                                onClick={() => setPayingDoc(uploaded)}
                                                                style={{ background: '#27ae60', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}
                                                            >
                                                                Pay Fee
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteDocument(uploaded.id)}
                                                            disabled={saving}
                                                            title="Delete Document"
                                                            style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', padding: '8px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => setUploadModalTarget(config.document_name)}
                                                        disabled={saving}
                                                        style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                                                    >
                                                        Upload
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {/* Additional Documents */}
                            {application.documents?.filter(d => !configs.find(c => c.document_name === d.document_name)).map(doc => (
                                <tr key={doc.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{doc.document_name}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            fontSize: '11px',
                                            fontWeight: 'bold',
                                            color: '#778eaeff',
                                            background: '#f1f5f9',
                                            padding: '4px 8px',
                                            borderRadius: '4px'
                                        }}>ADDITIONAL</span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <CheckCircle size={14} /> UPLOADED
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontSize: '12px', color: '#4b5563', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={doc.remark || ''}>
                                            {doc.remark || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No remarks</span>}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                                            <a href={`${api.defaults.baseURL.replace('/api', '')}${doc.document_path}`} target="_blank" rel="noreferrer" style={{
                                                color: '#3b82f6',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                textDecoration: 'none',
                                                padding: '6px 12px',
                                                border: '1px solid #3b82f6',
                                                borderRadius: '6px'
                                            }}>View</a>
                                            <button
                                                onClick={() => handleDeleteDocument(doc.id)}
                                                disabled={saving}
                                                title="Delete Document"
                                                style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', padding: '8px', borderRadius: '6px' }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Section>

            {/* Payments */}
            <Section title="Payment History" icon={<CreditCard size={20} />}>
                {application.payments?.length > 0 ? (
                    <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                    <th style={{ padding: '1rem', fontSize: '13px', fontWeight: 'bold', color: '#374151' }}>Transaction ID</th>
                                    <th style={{ padding: '1rem', fontSize: '13px', fontWeight: 'bold', color: '#374151' }}>Item Details</th>
                                    <th style={{ padding: '1rem', fontSize: '13px', fontWeight: 'bold', color: '#374151' }}>Amount</th>
                                    <th style={{ padding: '1rem', fontSize: '13px', fontWeight: 'bold', color: '#374151' }}>Status</th>
                                    <th style={{ padding: '1rem', fontSize: '13px', fontWeight: 'bold', color: '#374151', textAlign: 'right' }}>Receipt</th>
                                </tr>
                            </thead>
                            <tbody>
                                {application.payments.map(p => (
                                    <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{p.transaction_id || 'N/A'}</div>
                                            <div style={{ fontSize: '11px', color: '#6b7280' }}>{new Date(p.payment_date).toLocaleDateString()}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontSize: '14px', color: '#374151' }}>{p.item_paid}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: '700', fontSize: '14px', color: '#10b981' }}>₦{Number(p.amount).toLocaleString()}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                fontSize: '11px',
                                                fontWeight: 'bold',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                background: p.payment_status === 'completed' ? '#dcfce7' : '#fee2e2',
                                                color: p.payment_status === 'completed' ? '#166534' : '#991b1b'
                                            }}>
                                                {p.payment_status?.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            {p.payment_status === 'completed' && (
                                                <button
                                                    onClick={() => generatePaymentReceiptPDF({
                                                        user: {
                                                            first_name: application.applicant_first_name,
                                                            surname: application.applicant_surname,
                                                            email: application.applicant_email,
                                                            phone: application.applicant_phone
                                                        },
                                                        payment: p
                                                    })}
                                                    style={{
                                                        background: 'none',
                                                        border: '1px solid #e5e7eb',
                                                        padding: '6px 12px',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        fontSize: '12px',
                                                        color: '#4b5563'
                                                    }}
                                                >
                                                    <Download size={14} /> Receipt
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No payment records found for this application.</p>}
            </Section>

            {/* Error Modal */}
            {showErrorModal && (
                <Modal
                    title="Error Message"
                    onClose={() => setShowErrorModal(false)}
                    onSave={(e) => { e.preventDefault(); setShowErrorModal(false); }}
                >
                    <div style={{ textAlign: 'center', padding: '1rem' }}>
                        <div style={{ color: '#ef4444', marginBottom: '1rem' }}>
                            <XCircle size={48} style={{ margin: '0 auto' }} />
                        </div>
                        <p style={{ fontSize: '16px', color: '#374151', marginBottom: '1.5rem' }}>
                            {modalError}
                        </p>
                    </div>
                </Modal>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <Modal
                    title="Confirm Deletion"
                    onClose={() => setShowDeleteModal(false)}
                    onSave={(e) => { e.preventDefault(); confirmDelete(); }}
                >
                    <div style={{ textAlign: 'center', padding: '1rem' }}>
                        <div style={{ color: '#ef4444', marginBottom: '1rem' }}>
                            <Trash2 size={48} style={{ margin: '0 auto' }} />
                        </div>
                        <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
                            Delete Document?
                        </p>
                        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '1.5rem' }}>
                            Are you sure you want to delete this document? This action cannot be undone and the file will be permanently removed from our servers.
                        </p>
                    </div>
                </Modal>
            )}

            {/* MODALS */}
            <AnimatePresence>
                {activeModal === 'deceased' && (
                    <Modal title="Edit Deceased Details" saving={saving} onClose={() => setActiveModal(null)} onSave={handleSaveMain}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ gridColumn: 'span 2' }}><label style={modalLabel}>Deceased Name</label><input type="text" value={formData.deceased_name || ''} onChange={e => setFormData({ ...formData, deceased_name: e.target.value })} style={modalInput} required /></div>
                            <div><label style={modalLabel}>Date of Death</label><input type="date" value={formData.date_of_death || ''} onChange={e => setFormData({ ...formData, date_of_death: e.target.value })} style={modalInput} required /></div>
                            <div><label style={modalLabel}>Occupation</label><input type="text" value={formData.occupation || ''} onChange={e => setFormData({ ...formData, occupation: e.target.value })} style={modalInput} required /></div>
                            <div><label style={modalLabel}>Employer Name</label><input type="text" value={formData.employer_name || ''} onChange={e => setFormData({ ...formData, employer_name: e.target.value })} style={modalInput} /></div>
                            <div><label style={modalLabel}>Employer Address</label><input type="text" value={formData.employer_address || ''} onChange={e => setFormData({ ...formData, employer_address: e.target.value })} style={modalInput} /></div>
                            <div style={{ gridColumn: 'span 2' }}><label style={modalLabel}>Home Address</label><textarea value={formData.home_address || ''} onChange={e => setFormData({ ...formData, home_address: e.target.value })} style={modalInput} rows={2} required /></div>
                            <div style={{ gridColumn: 'span 2' }}><label style={modalLabel}>Death Location Address</label><textarea value={formData.death_location_address || ''} onChange={e => setFormData({ ...formData, death_location_address: e.target.value })} style={modalInput} rows={2} required /></div>
                            <div style={{ gridColumn: 'span 2' }}><label style={modalLabel}>Relationship to Applicant</label><input type="text" value={formData.relationship_to_nok || ''} onChange={e => setFormData({ ...formData, relationship_to_nok: e.target.value })} style={modalInput} required /></div>
                        </div>
                    </Modal>
                )}

                {activeModal === 'beneficiary' && (
                    <Modal title={editingItem ? "Edit Beneficiary" : "Add Beneficiary"} saving={saving} onClose={() => setActiveModal(null)} onSave={(e) => handleSaveRelational('beneficiaries', e)}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={modalLabel}>Full Name</label>
                                <input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} style={modalInput} required />
                            </div>
                            <div>
                                <label style={modalLabel}>Relationship</label>
                                <select value={formData.relationship || ''} onChange={e => setFormData({ ...formData, relationship: e.target.value })} style={modalInput} required>
                                    <option value="">Select...</option>
                                    {['Son', 'Daughter', 'Husband', 'Wife', 'Father', 'Mother', 'Brother', 'Sister', 'GrandParent', 'Others'].map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={modalLabel}>Age</label>
                                    <input type="number" value={formData.age || ''} onChange={e => setFormData({ ...formData, age: e.target.value })} style={modalInput} required />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={modalLabel}>Gender</label>
                                    <select value={formData.gender || ''} onChange={e => setFormData({ ...formData, gender: e.target.value })} style={modalInput} required>
                                        <option value="">Select...</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={modalLabel}>Phone Number</label>
                                <input type="tel" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={modalInput} />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={modalLabel}>Home Address</label>
                                <textarea value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} style={modalInput} rows={2} />
                            </div>
                        </div>
                    </Modal>
                )}

                {activeModal === 'surety' && (
                    <Modal title={editingItem ? "Edit Surety" : "Add Surety"} saving={saving} onClose={() => setActiveModal(null)} onSave={(e) => handleSaveRelational('sureties', e)}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                                <div style={{
                                    width: '120px',
                                    height: '120px',
                                    borderRadius: '12px',
                                    background: '#f3f4f6',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    border: '1px solid #e5e7eb'
                                }}>
                                    {formData.picture ? (
                                        <img src={URL.createObjectURL(formData.picture)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : editingItem?.picture_path ? (
                                        <img src={editingItem.picture_path} alt="Current" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <User size={50} color="#9ca3af" />
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowSuretyCapture(true)}
                                        style={{ fontSize: '12px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        <Camera size={14} /> {formData.picture || editingItem?.picture_path ? 'Change Photo' : 'Take/Upload Photo'}
                                    </button>
                                </div>
                            </div>
                            {showSuretyCapture && (
                                <ImageCapture
                                    onClose={() => setShowSuretyCapture(false)}
                                    onImageCaptured={(file) => setFormData({ ...formData, picture: file })}
                                    title="Capture Surety Photo"
                                />
                            )}
                            <div><label style={modalLabel}>Full Name</label><input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} style={modalInput} required /></div>
                            <div><label style={modalLabel}>Networth (₦)</label><input type="number" value={formData.networth || ''} onChange={e => setFormData({ ...formData, networth: e.target.value })} style={modalInput} required /></div>
                            <div><label style={modalLabel}>Address</label><textarea value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} style={modalInput} rows={2} required /></div>
                        </div>
                    </Modal>
                )}

                {activeModal === 'property' && (
                    <Modal title={editingItem ? "Edit Estate Item" : "Add Estate Item"} saving={saving} onClose={() => setActiveModal(null)} onSave={(e) => handleSaveRelational('properties', e)}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={modalLabel}>Estate Type</label>
                                <select
                                    value={formData.estate_type || ''}
                                    onChange={e => setFormData({ ...formData, estate_type: e.target.value })}
                                    style={modalInput}
                                    required
                                >
                                    <option value="">Select Type...</option>
                                    <option value="Property">Property (Land/House)</option>
                                    <option value="Bank/Pension Account">Bank / Pension Account</option>
                                    <option value="Share Divident">Share / Dividend</option>
                                </select>
                            </div>

                            {formData.estate_type === 'Property' && (
                                <>
                                    <div><label style={modalLabel}>Property Name / Title</label><input type="text" value={formData.property_name || ''} onChange={e => setFormData({ ...formData, property_name: e.target.value })} style={modalInput} placeholder="e.g. 4 Bedroom Bungalow" required /></div>
                                    <div><label style={modalLabel}>Property Address / Location</label><textarea value={formData.property_address || ''} onChange={e => setFormData({ ...formData, property_address: e.target.value })} style={modalInput} rows={2} required /></div>
                                    <div><label style={modalLabel}>Estimated Market Value (₦)</label><input type="number" value={formData.property_value || ''} onChange={e => setFormData({ ...formData, property_value: e.target.value })} style={modalInput} /></div>
                                </>
                            )}

                            {formData.estate_type === 'Bank/Pension Account' && (
                                <>
                                    <div><label style={modalLabel}>Bank / Institution Name</label><input type="text" value={formData.bank_name || ''} onChange={e => setFormData({ ...formData, bank_name: e.target.value })} style={modalInput} required /></div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div><label style={modalLabel}>Account Name</label><input type="text" value={formData.bank_account_name || ''} onChange={e => setFormData({ ...formData, bank_account_name: e.target.value })} style={modalInput} required /></div>
                                        <div><label style={modalLabel}>Account Number</label><input type="text" value={formData.bank_account || ''} onChange={e => setFormData({ ...formData, bank_account: e.target.value })} style={modalInput} required /></div>
                                    </div>
                                    <div><label style={modalLabel}>Current Balance / Value (₦)</label><input type="number" value={formData.bank_balance || ''} onChange={e => setFormData({ ...formData, bank_balance: e.target.value })} style={modalInput} /></div>
                                </>
                            )}

                            {formData.estate_type === 'Share Divident' && (
                                <>
                                    <div><label style={modalLabel}>Company / Broker Name</label><input type="text" value={formData.broker_name || ''} onChange={e => setFormData({ ...formData, broker_name: e.target.value })} style={modalInput} required /></div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div><label style={modalLabel}>Shareholder Name</label><input type="text" value={formData.broker_account_name || ''} onChange={e => setFormData({ ...formData, broker_account_name: e.target.value })} style={modalInput} required /></div>
                                        <div><label style={modalLabel}>Registration / CHN No.</label><input type="text" value={formData.broker_account || ''} onChange={e => setFormData({ ...formData, broker_account: e.target.value })} style={modalInput} required /></div>
                                    </div>
                                    <div><label style={modalLabel}>Estimated Market Value (₦)</label><input type="number" value={formData.share_value || ''} onChange={e => setFormData({ ...formData, share_value: e.target.value })} style={modalInput} /></div>
                                </>
                            )}

                            {formData.estate_type && (
                                <div><label style={modalLabel}>Additional Remarks</label><textarea value={formData.remark || ''} onChange={e => setFormData({ ...formData, remark: e.target.value })} style={modalInput} rows={2} /></div>
                            )}
                        </div>
                    </Modal>
                )}

                {activeModal === 'new_doc' && (
                    <Modal title="Add Additional Document" saving={saving} onClose={() => setActiveModal(null)} onSave={(e) => {
                        e.preventDefault();
                        if (!formData.docName || !formData.file) {
                            alert("Please provide both name and file");
                            return;
                        }
                        handleUpload(formData.docName, formData.file);
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={modalLabel}>Document Name / Type</label>
                                <input
                                    type="text"
                                    value={formData.docName || ''}
                                    onChange={e => setFormData({ ...formData, docName: e.target.value })}
                                    style={modalInput}
                                    placeholder="e.g. Affidavit of Means, Search Report..."
                                    required
                                />
                            </div>
                            <div>
                                <label style={modalLabel}>Select File</label>
                                <input
                                    type="file"
                                    onChange={e => setFormData({ ...formData, file: e.target.files[0] })}
                                    style={{ ...modalInput, border: 'none', paddingLeft: 0 }}
                                    required
                                />
                            </div>
                        </div>
                    </Modal>
                )}

                {/* Payment Modal */}
                {payingDoc && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                            zIndex: 1000, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', padding: '1rem'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            style={{
                                background: '#0f172a', padding: '2rem', borderRadius: '24px',
                                maxWidth: '500px', width: '100%', position: 'relative',
                                color: 'white', border: '1px solid #334155'
                            }}
                        >
                            <button
                                onClick={() => setPayingDoc(null)}
                                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                            >
                                <X size={24} />
                            </button>

                            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                <div style={{ width: '60px', height: '60px', background: 'rgba(46, 204, 113, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                    <CreditCard size={30} color="#2ecc71" />
                                </div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Document Fee</h3>
                                <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>{payingDoc.document_name}</p>
                            </div>

                            <div style={{ margin: '2rem 0', textAlign: 'center' }}>
                                <span style={{ fontSize: '1.25rem', color: '#94a3b8', verticalAlign: 'top', marginTop: '4px', display: 'inline-block' }}>₦</span>
                                <span style={{ fontSize: '3rem', fontWeight: '800', color: '#2ecc71' }}>{payingDoc.document_pay?.toLocaleString()}</span>
                            </div>

                            <PaymentGateway
                                amount={payingDoc.document_pay}
                                user={user}
                                itemDescription={`Probate Document Fee: ${payingDoc.document_name}`}
                                onSuccess={handlePaymentSuccess}
                                onCancel={() => setPayingDoc(null)}
                            />
                        </motion.div>
                    </motion.div>
                )}
                {viewingDoc && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'relative', zIndex: 9999 }}>
                        <DocumentViewer doc={viewingDoc} onClose={() => setViewingDoc(null)} />
                    </motion.div>
                )}
                {uploadModalTarget && (
                    <UniversalUploader
                        onClose={() => setUploadModalTarget(null)}
                        onFileSelect={(file) => {
                            handleUpload(uploadModalTarget, file);
                            setUploadModalTarget(null);
                        }}
                        title={`Upload ${uploadModalTarget}`}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const modalLabel = { fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' };
const modalInput = { width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e5e7eb', outline: 'none' };

export default ProbateApplicationDetails;
