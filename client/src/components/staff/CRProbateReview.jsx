import React, { useState, useEffect } from 'react';
import { formatDate } from '../../utils/dateUtils';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check, X, Eye, FileText, User, Loader2,
    AlertCircle, Briefcase, Users, CheckCircle2, ClipboardCheck,
    Search, ArrowLeft, ChevronRight, ChevronLeft, Shield, Download
} from 'lucide-react';
import api from '../../utils/api';
import { useModal } from '../../context/ModalContext';

const DocumentViewer = ({ doc, onClose }) => {
    if (!doc) return null;
    const path = doc.document_path || doc.file_path;
    const fullPath = path.startsWith('http') ? path : `${api.defaults.baseURL.replace('/api', '')}${path}`;
    const isPdf = path.toLowerCase().endsWith('.pdf');

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
            <div style={{ width: '100%', maxWidth: '1000px', height: '90%', background: 'white', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <div style={{ padding: '15px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText size={20} color="#3b82f6" /> {doc.document_name || doc.document_type}
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
                                padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
                                fontSize: '13px', fontWeight: 'bold', textDecoration: 'none'
                            }}
                        >
                            <Download size={16} /> Download
                        </a>
                        <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px' }}>
                            <X size={24} color="#6b7280" />
                        </button>
                    </div>
                </div>
                <div style={{ flex: 1, overflow: 'hidden', background: '#525659' }}>
                    {isPdf ? (
                        <iframe src={`${fullPath}${fullPath.includes('#') ? '' : '#view=FitH'}`} style={{ width: '100%', height: '100%', border: 'none' }} title="Document Viewer"></iframe>
                    ) : (
                        <div style={{ width: '100%', height: '100%', overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                            <img src={fullPath} alt="Document" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const CRApplicationDetails = ({ appId, onBack, onSuccess }) => {
    const [loading, setLoading] = useState(true);
    const [application, setApplication] = useState(null);
    const [remarks, setRemarks] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { showModal } = useModal();
    const [viewingDoc, setViewingDoc] = useState(null);

    useEffect(() => {
        fetchDetails();
    }, [appId]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/staff/probate/${appId}`);
            setApplication(res.data);
        } catch (err) {
            console.error("Failed to fetch probate details:", err);
            showModal({
                type: 'error',
                title: 'Error',
                message: 'Failed to load application details.'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        setSubmitting(true);
        try {
            await api.put(`/staff/probate/${appId}/approve`, { remarks });
            showModal({
                type: 'success',
                title: 'Application Approved',
                message: 'Probate application has been approved. Letter of Administration is now under processing.'
            });
            onSuccess();
        } catch (err) {
            console.error("Failed to approve application:", err);
            showModal({
                type: 'error',
                title: 'Action Failed',
                message: 'Failed to approve application.'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!remarks) {
            showModal({
                type: 'warning',
                title: 'Remarks Required',
                message: 'Please provide a reason for rejection in the remarks field.'
            });
            return;
        }

        setSubmitting(true);
        try {
            await api.put(`/staff/probate/${appId}/reject`, { remarks });
            showModal({
                type: 'error',
                title: 'Application Rejected',
                message: 'Probate application has been rejected and the applicant has been notified.'
            });
            onSuccess();
        } catch (err) {
            console.error("Failed to reject application:", err);
            showModal({
                type: 'error',
                title: 'Action Failed',
                message: 'Failed to reject application.'
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
            <Loader2 className="animate-spin" size={48} color="#3b82f6" />
        </div>
    );

    if (!application) return (
        <div style={{ textAlign: 'center', padding: '5rem', color: '#94a3b8' }}>
            <AlertCircle size={48} style={{ marginBottom: '1rem' }} />
            <p>Application details not found.</p>
            <button onClick={onBack} className="btn btn-secondary" style={{ marginTop: '1rem' }}>Go Back</button>
        </div>
    );

    const Section = ({ title, icon, children, fullWidth = false }) => (
        <div className="glass-card" style={{ background: '#ffffff', border: '1px solid #f1f5f9', marginBottom: '1.5rem', padding: '1.5rem', gridColumn: fullWidth ? '1 / -1' : 'span 1', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '8px', borderRadius: '8px', color: '#3b82f6' }}>
                    {icon}
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'rgb\(18 37 74\)' }}>{title}</h3>
            </div>
            {children}
        </div>
    );

    const DetailRow = ({ label, value }) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '14px', borderBottom: '1px solid #f8fafc' }}>
            <span style={{ color: '#778eaeff' }}>{label}</span>
            <span style={{ color: 'rgb\(18 37 74\)', fontWeight: '500', textAlign: 'right' }}>{value || 'N/A'}</span>
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {viewingDoc && <DocumentViewer doc={viewingDoc} onClose={() => setViewingDoc(null)} />}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: 'none', color: '#778eaeff', cursor: 'pointer', fontWeight: 'bold' }}>
                    <ArrowLeft size={18} /> Back to List
                </button>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                    {/* Gazette Status Calculation */}
                    {(application.approval_date || (application.status === 'approved' && application.updated_at) || application.status === 'under_processing' || application.status === 'completed') && (() => {
                        // Use updated_at as fallback for approval date if status implies approval
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
                        background: application.status === 'under_processing' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(133, 77, 14, 0.1)',
                        color: application.status === 'under_processing' ? '#059669' : '#854d0e',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        border: `1px solid ${application.status === 'under_processing' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(133, 77, 14, 0.2)'}`
                    }}>
                        {application.status === 'under_processing' ? 'APPROVED / PROCESSING' : application.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '12px' }}>ID: PRB-{application.id}</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                {/* Deceased Details */}
                <Section title="Deceased Information" icon={<User size={20} />}>
                    <DetailRow label="Full Name" value={<span style={{ textTransform: 'capitalize' }}>{application.deceased_name}</span>} />
                    <DetailRow label="Date of Death" value={formatDate(application.date_of_death)} />
                    <DetailRow label="Home Address" value={application.home_address} />
                    <DetailRow label="Death Location" value={application.death_location_address} />
                    <DetailRow label="Occupation" value={application.occupation} />
                    <DetailRow label="Employer" value={application.employer_name} />
                    <DetailRow label="Employer Address" value={application.employer_address} />
                </Section>

                {/* Applicant/Next of Kin Profile */}
                <Section title="Applicant/Next of Kin" icon={<Users size={20} />}>
                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', background: '#f1f5f9', border: '1px solid #e2e8f0', flexShrink: 0 }}>
                            {(application.applicant_profile_pic || application.profile_pic) ? (
                                <img
                                    src={(application.applicant_profile_pic || application.profile_pic).startsWith('http') ? (application.applicant_profile_pic || application.profile_pic) : `${api.defaults.baseURL?.replace('/api', '') || ''}${(application.applicant_profile_pic || application.profile_pic)}`}
                                    alt="Applicant"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                    <User size={32} />
                                </div>
                            )}
                        </div>
                        <div style={{ flex: 1 }}>
                            <DetailRow label="Full Name" value={<span style={{ textTransform: 'capitalize' }}>{`${application.applicant_first_name || application.first_name || ''} ${application.applicant_surname || application.surname || ''}`}</span>} />
                            <DetailRow label="Gender" value={application.applicant_gender || application.gender} />
                            <DetailRow label="Age" value={application.applicant_age || application.age ? `${application.applicant_age || application.age} Years` : null} />
                            <DetailRow label="Email" value={application.applicant_email || application.email} />
                            <DetailRow label="Phone" value={application.applicant_phone || application.phone} />
                        </div>
                    </div>
                    <DetailRow label="Relationship" value={application.relationship_to_nok} />
                    <DetailRow label="Address" value={application.applicant_address || application.address} />
                    {application.filed_by_name && <DetailRow label="Filed By" value={<span style={{ textTransform: 'capitalize' }}>{application.filed_by_name}</span>} />}
                </Section>

                {/* Beneficiaries */}
                <Section title="Beneficiaries" icon={<Users size={20} />} fullWidth>
                    {application.beneficiaries?.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                                        <th style={{ padding: '12px', color: '#778eaeff' }}>Name</th>
                                        <th style={{ padding: '12px', color: '#778eaeff' }}>Relationship</th>
                                        <th style={{ padding: '12px', color: '#778eaeff' }}>Age/Gender</th>
                                        <th style={{ padding: '12px', color: '#778eaeff' }}>Contact</th>
                                        <th style={{ padding: '12px', color: '#778eaeff' }}>Address</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {application.beneficiaries.map((b, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                                            <td style={{ padding: '12px', fontWeight: 'bold', color: 'rgb\(18 37 74\)', textTransform: 'capitalize' }}>{b.name}</td>
                                            <td style={{ padding: '12px', color: 'rgb\(18 37 74\)' }}>{b.relationship}</td>
                                            <td style={{ padding: '12px', color: 'rgb\(18 37 74\)' }}>{b.age}Y / {b.gender}</td>
                                            <td style={{ padding: '12px', color: 'rgb\(18 37 74\)' }}>{b.phone || 'N/A'}</td>
                                            <td style={{ padding: '12px', color: '#778eaeff' }}>{b.address || 'N/A'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : <p style={{ color: '#778eaeff', fontSize: '13px' }}>No beneficiaries listed</p>}
                </Section>

                {/* Estate Assets */}
                <Section title="Estate Assets" icon={<Briefcase size={20} />} fullWidth>
                    {application.assets?.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
                            {application.assets.map((a, i) => (
                                <div key={i} style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div>
                                            <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#3b82f6', textTransform: 'uppercase', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                                                {a.estate_type || a.asset_type || 'Asset'}
                                            </span>
                                            <h4 style={{ margin: '8px 0 0', color: 'rgb\(18 37 74\)' }}>{a.property_name || a.bank_name || a.broker_name || 'Asset Entry'}</h4>
                                        </div>
                                        <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                            ₦{(a.property_value || a.bank_balance || a.share_value || a.estimated_value || 0).toLocaleString()}
                                        </div>
                                    </div>

                                    <div style={{ fontSize: '12px', color: '#778eaeff', display: 'grid', gap: '4px' }}>
                                        {a.property_address && <div><strong>Address:</strong> {a.property_address}</div>}
                                        {a.bank_account && <div><strong>Account:</strong> {a.bank_account} ({a.bank_account_name})</div>}
                                        {a.broker_account && <div><strong>Broker A/C:</strong> {a.broker_account} ({a.broker_account_name})</div>}
                                        {a.remark && <div style={{ marginTop: '8px', fontStyle: 'italic' }}>"{a.remark}"</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <p style={{ color: '#778eaeff', fontSize: '13px' }}>No estate assets listed</p>}
                </Section>

                {/* Sureties */}
                <Section title="Sureties" icon={<Shield size={20} />}>
                    {application.sureties?.length > 0 ? (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {application.sureties.map((s, i) => (
                                <div key={i} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', background: '#e2e8f0', flexShrink: 0 }}>
                                        {s.picture_path ? (
                                            <img
                                                src={s.picture_path.startsWith('http') ? s.picture_path : `${api.defaults.baseURL?.replace('/api', '') || ''}${s.picture_path}`}
                                                alt={s.name}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                                <User size={24} />
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: 'rgb\(18 37 74\)', fontWeight: 'bold', marginBottom: '2px', textTransform: 'capitalize' }}>{s.name}</div>
                                        <div style={{ color: '#778eaeff', fontSize: '12px' }}>{s.occupation || 'N/A'} • {s.phone || 'No phone'}</div>
                                        <div style={{ color: '#10b981', fontSize: '11px', fontWeight: '600', marginTop: '2px' }}>Net Worth: ₦{s.networth?.toLocaleString() || 0}</div>
                                        <div style={{ marginTop: '8px', fontSize: '12px' }}>
                                            <span style={{
                                                padding: '2px 6px', borderRadius: '4px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold',
                                                background: s.acceptance === 'accepted' ? '#dcfce7' : '#f1f5f9',
                                                color: s.acceptance === 'accepted' ? '#15803d' : '#778eaeff'
                                            }}>
                                                {s.acceptance || 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <p style={{ color: '#778eaeff', fontSize: '13px' }}>No sureties provided</p>}
                </Section>



                {/* Attached Documents */}
                <Section title="Attached Documents" icon={<FileText size={20} />}>
                    {application.documents?.length > 0 ? (
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            {application.documents.map((d, i) => (
                                <button
                                    key={i}
                                    onClick={() => setViewingDoc(d)}
                                    style={{
                                        padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', fontSize: '13px',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#3b82f6', textDecoration: 'none',
                                        border: '1px solid #f1f5f9', width: '100%', cursor: 'pointer'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <FileText size={16} />
                                        <span>{d.document_name || d.document_type}</span>
                                    </div>
                                    <ChevronRight size={16} />
                                </button>
                            ))}
                        </div>
                    ) : <p style={{ color: '#778eaeff', fontSize: '13px' }}>No documents uploaded</p>}
                </Section>
            </div>

            {/* PR Remarks */}
            <Section title="Registrar's Remarks" icon={<ClipboardCheck size={20} />} fullWidth>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#334155', fontStyle: 'italic' }}>
                    "{application.registrar_remarks || 'No remarks from Registrar.'}"
                </div>
            </Section>
            {/* Approval Action */}
            {application.status !== 'under_processing' && application.status !== 'completed' && application.status !== 'rejected' ? (
                <div className="glass-card" style={{ background: '#ffffff', border: '1px solid #f1f5f9', marginTop: '2rem', padding: '2rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ color: 'rgb\(18 37 74\)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle2 size={20} color="#10b981" />
                        Final Approval
                    </h3>
                    <p style={{ color: '#778eaeff', fontSize: '14px', marginBottom: '1.5rem' }}>
                        Add any remarks and approve the application. This will initiate the processing of the Letter of Administration for the applicant.
                    </p>

                    <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Add final approval remarks (optional)..."
                        style={{
                            width: '100%', minHeight: '120px', padding: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0',
                            borderRadius: '12px', color: 'rgb\(18 37 74\)', outline: 'none', fontSize: '14px', marginBottom: '1.5rem'
                        }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button onClick={onBack} disabled={submitting} className="btn-secondary" style={{ padding: '0.8rem 2rem', borderRadius: '8px' }}>
                            Cancel
                        </button>
                        <button
                            onClick={handleReject}
                            disabled={submitting}
                            className="btn"
                            style={{ padding: '0.8rem 2rem', borderRadius: '8px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                        >
                            {submitting ? <Loader2 className="animate-spin" size={18} /> : <X size={18} />}
                            Return for Correction
                        </button>
                        <button
                            onClick={handleApprove}
                            disabled={submitting}
                            className="btn btn-primary"
                            style={{ padding: '0.8rem 3rem', borderRadius: '8px', background: '#10b981', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: submitting ? 'not-allowed' : 'pointer' }}
                        >
                            {submitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                            Approve & Sign
                        </button>
                    </div>
                </div>
            ) : (
                <div className="glass-card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', marginTop: '2rem', padding: '2rem', textAlign: 'center' }}>
                    <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 1rem' }} />
                    <h3 style={{ color: 'rgb\(18 37 74\)', marginBottom: '0.5rem' }}>Application Already {application.status.replace('_', ' ').toUpperCase()}</h3>
                    <p style={{ color: '#778eaeff', fontSize: '14px', marginBottom: '1.5rem' }}>
                        This application has already been processed and is currently marked as <strong>{application.status.replace('_', ' ')}</strong>.
                    </p>
                    <button onClick={onBack} className="btn-secondary" style={{ padding: '0.8rem 2rem', borderRadius: '8px' }}>
                        Back to List
                    </button>
                </div>
            )}
        </motion.div>
    );
};

import DataTable from '../common/DataTable';

const CRProbateReview = ({ isMobile, mode = 'cr_pending', title: pageTitle }) => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState(null);
    const [viewingDoc, setViewingDoc] = useState(null);
    const [loadingPrayers, setLoadingPrayers] = useState(null);
    const { showModal } = useModal();

    useEffect(() => {
        fetchApplications();
    }, [mode]);

    const fetchApplications = async () => {
        setLoading(true);
        try {
            let endpoint = '/staff/probate/cr-pending';
            if (mode === 'history') endpoint = '/staff/probate/letters';
            else if (mode === 'all') endpoint = '/staff/probate/all';

            const res = await api.get(endpoint);
            setApplications(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Failed to fetch probate apps:", err);
            showModal({ type: 'error', title: 'Error', message: 'Failed to load applications.' });
        } finally {
            setLoading(false);
        }
    };

    if (selectedId) {
        return <CRApplicationDetails
            appId={selectedId}
            onBack={() => setSelectedId(null)}
            onSuccess={() => { setSelectedId(null); fetchApplications(); }}
        />;
    }

    const columns = [
        {
            key: 'id',
            label: 'App ID',
            sortable: true,
            render: (val) => <span style={{ fontWeight: 'bold' }}>PRB-{val}</span>
        },
        {
            key: 'deceased_name',
            label: 'Deceased Name',
            sortable: true,
            render: (val) => <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>{val}</span>
        },
        {
            key: 'applicant_first_name',
            label: 'Next of Kin',
            sortable: true,
            render: (val, row) => (
                <div>
                    <div style={{ fontWeight: '500', textTransform: 'capitalize' }}>{val || row.first_name} {row.applicant_surname || row.surname}</div>
                    <div style={{ color: '#94a3b8', fontSize: '11px' }}>{formatDate(row.created_at)}</div>
                </div>
            )
        },
        {
            key: 'filed_by_name',
            label: 'Filed By',
            sortable: true,
            render: (val) => (
                <div style={{ fontWeight: '500', color: val ? '#10b981' : '#778eaeff', fontSize: '12px', textTransform: 'capitalize' }}>
                    {val ? 'Registry' : 'Self (Online)'}
                </div>
            )
        },
        {
            key: 'gazette',
            label: 'Gazette',
            sortable: false,
            render: (_val, row) => {
                const dateVal = row.approval_date || (row.status === 'approved' && row.updated_at);
                if (!dateVal) return <span style={{ fontSize: '11px', color: '#9ca3af' }}>N/A</span>;

                const approval = new Date(dateVal);
                const today = new Date();
                approval.setHours(0, 0, 0, 0);
                today.setHours(0, 0, 0, 0);

                const diffTime = today - approval;
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                const isMatured = diffDays >= 21;

                return (
                    <div style={{ textAlign: 'center' }}>
                        <span style={{
                            padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase',
                            background: isMatured ? '#dcfce7' : '#fef9c3',
                            color: isMatured ? '#166534' : '#854d0e',
                            border: `1px solid ${isMatured ? '#bbf7d0' : '#fde047'}`
                        }}>
                            {isMatured ? 'Matured' : 'Process'}
                        </span>
                        <div style={{ fontSize: '10px', color: '#778eaeff', marginTop: '4px', fontWeight: '500' }}>
                            {diffDays} Day{diffDays !== 1 ? 's' : ''}
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (val) => (
                <span style={{
                    padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase',
                    background: val === 'approved' ? '#dcfce7' :
                        val === 'completed' ? '#dcfce7' :
                            val === 'under_processing' ? '#dbeafe' : '#fef9c3',
                    color: val === 'approved' ? '#15803d' :
                        val === 'completed' ? '#15803d' :
                            val === 'under_processing' ? '#1e40af' : '#854d0e',
                    border: '1px solid currentColor'
                }}>
                    {(val || 'pending').replace('_', ' ')}
                </span>
            )
        },
        {
            key: 'approval',
            label: 'Approval',
            sortable: true,
            render: (val, row) => (
                <div style={{ fontWeight: '500', color: val === 'approved' ? '#10b981' : '#778eaeff' }}>
                    {val ? val.charAt(0).toUpperCase() + val.slice(1) : (row.status === 'approved' || row.status === 'completed' || row.status === 'under_processing') ? 'Approved' : 'Pending'}
                </div>
            )
        },
        {
            key: 'approval_date',
            label: 'Approval Date',
            sortable: true,
            render: (val, row) => (val || (row.status === 'approved' && row.updated_at)) ? (
                <div style={{ fontSize: '12px' }}>
                    {formatDate(val || row.updated_at)}
                </div>
            ) : '---'
        }
    ];

    const actions = (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
            <button
                onClick={() => setSelectedId(row.id)}
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
                <Eye size={16} /> View
            </button>
            {(() => {
                const dateVal = row.approval_date || (row.status === 'approved' && row.updated_at);
                const isMatured = dateVal ? Math.floor((new Date() - new Date(dateVal)) / (1000 * 60 * 60 * 24)) >= 21 : false;

                // CR can ALWAYS see Prayers in history mode. PR/PD can only see if matured.
                if (mode === 'history') {
                    const isGenerating = loadingPrayers === row.id;
                    return (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (isGenerating) return;

                                const handleShowPrayers = async () => {
                                    setLoadingPrayers(row.id);
                                    try {
                                        const res = await api.get(`/staff/probate/${row.id}/prayers-pdf`);
                                        if (res.data.path) {
                                            setViewingDoc({
                                                document_name: `Prayers - ${row.deceased_name}`,
                                                document_path: res.data.path
                                            });
                                        }
                                    } catch (err) {
                                        console.error("Failed to load prayers:", err);
                                        showModal({ type: 'error', title: 'Error', message: 'Failed to load Prayers document.' });
                                    } finally {
                                        setLoadingPrayers(null);
                                    }
                                };
                                handleShowPrayers();
                            }}
                            className="btn"
                            disabled={isGenerating}
                            title="View/Download Prayers Attachment"
                            style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', cursor: isGenerating ? 'not-allowed' : 'pointer', opacity: isGenerating ? 0.7 : 1 }}
                        >
                            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                            {isGenerating ? 'Generating...' : 'Prayers'}
                        </button>
                    );
                }
                return null;
            })()}
            {row.status === 'completed' && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        const handleViewLetter = async () => {
                            setLoadingPrayers(`letter-${row.id}`);
                            try {
                                const res = await api.get(`/staff/probate/${row.id}/letter-pdf`);
                                if (res.data.path) {
                                    setViewingDoc({
                                        document_name: `Letter of Admin - ${row.deceased_name}`,
                                        document_path: res.data.path
                                    });
                                }
                            } catch (err) {
                                console.error("Failed to load letter:", err);
                                showModal({ type: 'error', title: 'Error', message: 'Failed to load Letter of Administration.' });
                            } finally {
                                setLoadingPrayers(null);
                            }
                        };
                        handleViewLetter();
                    }}
                    disabled={loadingPrayers === `letter-${row.id}`}
                    className="btn btn-secondary"
                    title="View Letter of Administration"
                    style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', color: 'rgb(18 37 74)', border: '1px solid #e2e8f0', cursor: loadingPrayers === `letter-${row.id}` ? 'not-allowed' : 'pointer' }}
                >
                    {loadingPrayers === `letter-${row.id}` ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                    {loadingPrayers === `letter-${row.id}` ? 'Loading...' : 'Letter'}
                </button>
            )}
        </div>
    );

    return (
        <div style={{ padding: isMobile ? '0' : '1rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: 'rgb\(18 37 74\)', margin: 0 }}>{pageTitle || 'Probate Approvals'}</h2>
                <p style={{ color: '#778eaeff', fontSize: '14px' }}>
                    {mode === 'history' ? 'View approved letters of administration' : 'Review and give final approval for probate applications'}
                </p>
            </div>

            <DataTable
                columns={columns}
                data={applications}
                loading={loading}
                actions={actions}
                isMobile={isMobile}
                searchPlaceholder="Search by ID or name..."
            />
            {/* Prayers & Letter Preview Modal */}
            <AnimatePresence>
                {viewingDoc && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <DocumentViewer doc={viewingDoc} onClose={() => setViewingDoc(null)} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CRProbateReview;
