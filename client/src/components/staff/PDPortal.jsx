import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, FileText, CheckCircle,
    LayoutDashboard, History, Search, Eye, Download, Loader2, X
} from 'lucide-react';
import ApplicantManager from './ApplicantManager';
import ProbateAnalytics from './ProbateAnalytics';
import ProbateApplicationsList from '../probate/ProbateApplicationsList';
import ProbateApplicationDetails from '../probate/ProbateApplicationDetails';
import SupportTickets from '../common/SupportTickets';
import StaffProfile from './StaffProfile';
import PaymentReceipts from '../common/PaymentReceipts';
import ProbateApplication from '../probate/ProbateApplication';
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

const PDPortal = ({ isMobile, activeTab, staff, onUpdate, onTabChange }) => {
    const [view, setView] = useState('main'); // 'main', 'file_probate', 'details'
    const [selectedApplicant, setSelectedApplicant] = useState(null);
    const [selectedAppId, setSelectedAppId] = useState(null);
    const [viewingDoc, setViewingDoc] = useState(null);
    const [loadingPrayers, setLoadingPrayers] = useState(null);
    const { showModal } = useModal();

    // Reset view when tab changes
    useEffect(() => {
        setView('main');
        setSelectedApplicant(null);
        setSelectedAppId(null);
    }, [activeTab]);

    const handleFileFor = (applicant) => {
        setSelectedApplicant(applicant);
        setView('file_probate');
    };

    const handleSelectApp = (id) => {
        setSelectedAppId(id);
        setView('details');
    };

    const renderPrayersAction = (row) => {
        const dateVal = row.approval_date || (row.status === 'approved' && row.updated_at);
        const isMatured = dateVal ? Math.floor((new Date() - new Date(dateVal)) / (1000 * 60 * 60 * 24)) >= 21 : false;

        if (isMatured) {
            const isGenerating = loadingPrayers === row.id;
            return (
                <button
                    onClick={async (e) => {
                        e.stopPropagation();
                        if (isGenerating) return;
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
                        } finally {
                            setLoadingPrayers(null);
                        }
                    }}
                    style={{
                        padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px',
                        background: '#dcfce7', color: '#166534', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
                    }}
                >
                    {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                    {isGenerating ? '...' : 'Prayers'}
                </button>
            );
        }
        return null;
    };

    const renderMainContent = () => {
        switch (activeTab) {
            case 'overview':
                return <ProbateAnalytics isMobile={isMobile} onViewProbate={() => onTabChange('probates')} />;
            case 'applicants':
                return <ApplicantManager isMobile={isMobile} onFileFor={handleFileFor} />;
            case 'probates':
                return (
                    <ProbateApplicationsList
                        isMobile={isMobile}
                        onSelect={handleSelectApp}
                        staffMode={true}
                        actions={renderPrayersAction}
                    />
                );
            case 'letters':
                return (
                    <ProbateApplicationsList
                        isMobile={isMobile}
                        onSelect={handleSelectApp}
                        filterStatus="under_processing,completed,approved"
                        title="Letters of Administration Queue"
                        staffMode={true}
                        actions={renderPrayersAction}
                    />
                );
            case 'payments':
                return <PaymentReceipts isMobile={isMobile} staffMode={true} />;
            case 'support':
                return <SupportTickets user={staff} isMobile={isMobile} isStaff={true} />;
            case 'profile':
                return <StaffProfile staff={staff} isMobile={isMobile} onUpdate={onUpdate} />;
            default:
                return <ProbateAnalytics isMobile={isMobile} onViewProbate={() => onTabChange('probates')} />;
        }
    };

    return (
        <div style={{ minHeight: '100vh' }}>
            <AnimatePresence mode="wait">
                {view === 'main' && (
                    <motion.div
                        key="main"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        {renderMainContent()}
                    </motion.div>
                )}

                {view === 'file_probate' && selectedApplicant && (
                    <motion.div
                        key="file_probate"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button
                                onClick={() => setView('main')}
                                style={{ background: 'transparent', border: 'none', color: '#778eaeff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}
                            >
                                <ArrowLeft size={18} /> Back to Applicants
                            </button>
                            <h2 style={{ margin: 0 }}>File Probate for {selectedApplicant.first_name} {selectedApplicant.surname}</h2>
                        </div>
                        <ProbateApplication
                            user={{
                                id: selectedApplicant.id,
                                full_name: `${selectedApplicant.first_name} ${selectedApplicant.surname}`,
                                email: selectedApplicant.email,
                                phone: selectedApplicant.phone,
                                is_applicant_manager_user: true // Flag to tell the component to use applicant_id
                            }}
                            isMobile={isMobile}
                            isStaffFiling={true}
                            onComplete={() => setView('main')}
                        />
                    </motion.div>
                )}

                {view === 'details' && selectedAppId && (
                    <motion.div
                        key="details"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                    >
                        <ProbateApplicationDetails
                            applicationId={selectedAppId}
                            onBack={() => setView('main')}
                            isMobile={isMobile}
                            user={staff}
                            staffMode={true}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

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

export default PDPortal;
