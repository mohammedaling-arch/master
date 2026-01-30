import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, FileText, CheckCircle,
    LayoutDashboard, History, Search, Eye
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

const PDPortal = ({ isMobile, activeTab, staff, onUpdate, onTabChange }) => {
    const [view, setView] = useState('main'); // 'main', 'file_probate', 'details'
    const [selectedApplicant, setSelectedApplicant] = useState(null);
    const [selectedAppId, setSelectedAppId] = useState(null);
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
                    />
                );
            case 'letters':
                return (
                    <ProbateApplicationsList
                        isMobile={isMobile}
                        onSelect={handleSelectApp}
                        filterStatus="under_processing,completed"
                        title="Letters of Administration Queue"
                        staffMode={true}
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
        </div>
    );
};

export default PDPortal;
