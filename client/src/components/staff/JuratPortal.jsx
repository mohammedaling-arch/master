import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, FileText, X, Loader2, CheckCircle,
    Edit2, CreditCard, Eye, LayoutDashboard, ChevronRight, Upload
} from 'lucide-react';
import ApplicantManager from './ApplicantManager';
import JuratAnalytics from './JuratAnalytics';
import PaymentManager from './PaymentManager';
import StaffProfile from './StaffProfile';
import { JuratAffidavitsTable } from './JuratDataTables';
import api from '../../utils/api';
import { useModal } from '../../context/ModalContext';
import RichTextEditor from '../common/RichTextEditor';
import { generateAffidavitPDF } from '../../utils/pdfGenerator';
import SupportTickets from '../common/SupportTickets';
import PaymentGateway from '../common/PaymentGateway';

const JuratPortal = ({ isMobile: isMobileProp, activeTab, staff, onUpdate }) => {
    const [view, setView] = useState('main'); // 'main', 'select_filing_type', 'file_affidavit', 'file_probate'
    const [selectedApplicant, setSelectedApplicant] = useState(null);
    const [isMobileInternal, setIsMobileInternal] = useState(window.innerWidth <= 1024);
    const isMobile = isMobileProp !== undefined ? isMobileProp : isMobileInternal;
    const { showModal } = useModal();

    // Reset view when tab changes
    React.useEffect(() => {
        setView('main');
        setSelectedApplicant(null);
    }, [activeTab]);

    // Filing State
    const [step, setStep] = useState(1);
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [content, setContent] = useState('');
    const [amount, setAmount] = useState(0);
    const [language, setLanguage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [paymentProcessing, setPaymentProcessing] = useState(false);

    const fetchTemplates = async () => {
        try {
            const res = await api.get('/affidavits/templates');
            setTemplates(res.data);
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    };

    React.useEffect(() => {
        if (view === 'file_affidavit') {
            fetchTemplates();
        }
    }, [view]);

    const handleFileFor = (applicant) => {
        setSelectedApplicant(applicant);
        setView('select_filing_type');
    };

    const handleSelectTemplate = (tpl) => {
        setSelectedTemplate(tpl);
        setContent(tpl.content);
        setAmount(tpl.amount);
        setStep(2);
    };

    const handlePaymentSuccess = async (paymentData) => {
        setPaymentProcessing(true);
        try {
            const finalAmount = Math.round(amount * 1.075);
            // 1. Save Affidavit
            const res = await api.post(`/applicants/${selectedApplicant.id}/affidavit`, {
                type: selectedTemplate.title,
                content: content,
                amount: amount,
                language: language
            });

            const affidavitId = res.data.id;

            // 2. Record Payment
            await api.post('/payments', {
                applicant_id: selectedApplicant.id,
                affidavit_id: affidavitId,
                item_paid: selectedTemplate.title,
                amount: finalAmount,
                transaction_id: paymentData.reference,
                payment_status: 'paid',
                gateway: paymentData.gateway
            });

            showModal({
                type: 'success',
                title: 'Filing Complete',
                message: `Affidavit for ${selectedApplicant.first_name} has been filed and payment of ₦${finalAmount.toLocaleString()} recorded.`
            });

            setStep(5); // Success step
        } catch (error) {
            console.error("Filing error after payment:", error);
            showModal({
                type: 'error',
                title: 'Filing Failed',
                message: error.response?.data?.error || 'Failed to complete filing after payment was processed. Please contact admin with your reference: ' + paymentData.reference
            });
        } finally {
            setPaymentProcessing(false);
        }
    };

    const resetFiling = () => {
        setView('main');
        setStep(1);
        setSelectedTemplate(null);
        setContent('');
        setLanguage('');
        setSelectedApplicant(null);
    };

    const goBack = () => {
        if (view === 'file_affidavit') {
            if (step > 1 && step < 5) setStep(step - 1);
            else {
                setView('select_filing_type');
                setStep(1);
            }
        } else if (view === 'select_filing_type') {
            setView('main');
            setSelectedApplicant(null);
        }
    };

    const renderMainContent = () => {
        switch (activeTab) {
            case 'overview':
            case 'dashboard':
                return <JuratAnalytics isMobile={isMobile} />;
            case 'applicants':
                return <ApplicantManager isMobile={isMobile} onFileFor={handleFileFor} />;
            case 'affidavits':
                return <JuratAffidavitsTable isMobile={isMobile} staff={staff} />;
            case 'payments':
                return <PaymentManager isMobile={isMobile} />;
            case 'support':
                return <SupportTickets user={staff} isMobile={isMobile} isStaff={true} />;
            case 'profile':
                return <StaffProfile staff={staff} isMobile={isMobile} onUpdate={onUpdate} />;
            default:
                return <JuratAnalytics isMobile={isMobile} />;
        }
    };

    return (
        <div style={{ minHeight: '100vh' }}>
            <AnimatePresence mode="wait">
                {view === 'main' && (
                    <motion.div
                        key="main_content"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        {renderMainContent()}
                    </motion.div>
                )}

                {view === 'select_filing_type' && selectedApplicant && (
                    <motion.div
                        key="select_filing"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="glass-card"
                        style={{ background: 'rgb\(18 37 74\)', border: 'none', padding: isMobile ? '1.5rem' : '3rem', color: 'white' }}
                    >
                        <button onClick={goBack} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            <ArrowLeft size={18} /> Back to Applicants
                        </button>
                        <div style={{ marginBottom: '2.5rem' }}>
                            <h2 style={{ fontSize: isMobile ? '1.8rem' : '2.5rem', margin: '0 0 0.5rem 0' }}>Select Filing Type</h2>
                            <p style={{ color: '#94a3b8' }}>Filing for: <strong style={{ color: '#3b82f6', textTransform: 'capitalize' }}>{selectedApplicant.first_name} {selectedApplicant.surname}</strong></p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', maxWidth: '600px', margin: '0 auto' }}>
                            <motion.div whileHover={{ y: -5 }} onClick={() => setView('file_affidavit')} style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', borderRadius: '24px', padding: '2.5rem', cursor: 'pointer', textAlign: 'center' }}>
                                <FileText size={48} color="#3b82f6" style={{ margin: '0 auto 1.5rem' }} />
                                <h3 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0' }}>OADR Registry Filing</h3>
                                <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>File Oaths, Affidavits and Declarations on behalf of Applicant</p>
                            </motion.div>
                        </div>
                    </motion.div>
                )}

                {view === 'file_affidavit' && selectedApplicant && (
                    <motion.div
                        key="file_affidavit"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="glass-card"
                        style={{ background: 'rgb\(18 37 74\)', border: 'none', padding: isMobile ? '1.5rem' : '3rem', color: 'white' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                            <button onClick={goBack} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <ArrowLeft size={18} /> {step === 5 ? 'Done' : 'Back'}
                            </button>
                            <div style={{ display: 'flex', flex: 1, justifyContent: 'center', gap: '1rem', marginLeft: '2rem', marginRight: '2rem' }}>
                                {['Select', 'Review', 'Pay', 'Finalize', 'Success'].map((label, idx) => (
                                    <div key={idx} style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        opacity: step === idx + 1 ? 1 : 0.4,
                                        transition: 'all 0.3s'
                                    }}>
                                        <div style={{
                                            width: '24px', height: '24px', borderRadius: '50%',
                                            background: step >= idx + 1 ? '#3b82f6' : '#334155',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '11px', fontWeight: 'bold'
                                        }}>
                                            {idx + 1}
                                        </div>
                                        <span style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: step === idx + 1 ? '#3b82f6' : '#94a3b8' }}>{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {step === 1 && (
                            <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                                <h3 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Choose Affidavit Template</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '14px' }}>Template Category</label>
                                        <select
                                            style={{
                                                width: '100%',
                                                padding: '14px',
                                                borderRadius: '12px',
                                                border: '1px solid #334155',
                                                background: '#0f172a',
                                                color: 'white',
                                                outline: 'none',
                                                fontSize: '15px'
                                            }}
                                            value={selectedTemplate?.id || ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val) {
                                                    const selected = templates.find(t => t.id === parseInt(val));
                                                    handleSelectTemplate(selected);
                                                }
                                            }}
                                        >
                                            <option value="">-- Select Template --</option>
                                            {templates.map(t => (
                                                <option key={t.id} value={t.id}>{t.title} - ₦{Number(t.amount).toLocaleString()}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {selectedTemplate && (
                                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#94a3b8' }}>Selected Fee:</span>
                                                <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#3b82f6' }}>₦{Number(selectedTemplate.amount).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        disabled={!selectedTemplate}
                                        onClick={() => setStep(2)}
                                        className="btn btn-primary"
                                        style={{ padding: '14px', borderRadius: '12px', background: '#3b82f6', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', opacity: selectedTemplate ? 1 : 0.5 }}
                                    >
                                        Next: Review Content
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div>
                                <h2 style={{ marginBottom: '1.5rem' }}>Edit Affidavit Content</h2>
                                <div style={{ background: 'white', borderRadius: '12px', padding: '1px', marginBottom: '2rem' }}>
                                    <RichTextEditor value={content} onChange={setContent} />
                                </div>
                                <button onClick={() => setStep(3)} style={{ width: '100%', padding: '16px', borderRadius: '12px', background: '#3b82f6', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                                    Review Application
                                </button>
                            </div>
                        )}

                        {step === 3 && (
                            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                                <h2 style={{ marginBottom: '1.5rem' }}>Review Filing</h2>
                                <div style={{ background: 'white', color: 'rgb\(18 37 74\)', padding: isMobile ? '1.5rem' : '4rem', borderRadius: '12px', fontFamily: "'Times New Roman', serif", boxShadow: '0 10px 25px rgba(0,0,0,0.2)', marginBottom: '1.5rem' }}>
                                    <div dangerouslySetInnerHTML={{ __html: content }} style={{ lineHeight: '1.8', textAlign: 'justify', fontSize: '15px' }} />
                                </div>
                                <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.1)', marginBottom: '2rem' }}>
                                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>This content was translated to the Deponent from English to:</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Hausa, Kanuri (leave blank if not translated)"
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                        style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: 'white', outline: 'none' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button onClick={() => setStep(2)} style={{ flex: 1, padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 'bold', cursor: 'pointer' }}>
                                        Edit Content
                                    </button>
                                    <button onClick={() => setStep(4)} style={{ flex: 2, padding: '16px', borderRadius: '12px', background: '#3b82f6', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                        Confirm & Proceed to Payment <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto', padding: '2rem 0' }}>
                                <div style={{ width: '80px', height: '80px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', color: '#3b82f6' }}>
                                    <CreditCard size={40} />
                                </div>
                                <h2 style={{ marginBottom: '1rem' }}>Payment Confirmation</h2>
                                <p style={{ color: '#94a3b8', marginBottom: '2.5rem' }}>Confirm that the amount of <strong>₦{amount}</strong> has been received for this filing.</p>

                                <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '2.5rem', marginBottom: '2.5rem', textAlign: 'left', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                                        <span style={{ color: '#94a3b8' }}>Template Type</span>
                                        <span style={{ fontWeight: '600' }}>{selectedTemplate.title}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                                        <span style={{ color: '#94a3b8' }}>Filing For</span>
                                        <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>{selectedApplicant.first_name} {selectedApplicant.surname}</span>
                                    </div>

                                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '1.5rem 0' }} />

                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                        <span style={{ color: '#94a3b8' }}>Administrative Fee</span>
                                        <span style={{ fontWeight: '600' }}>₦{Number(amount).toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                                        <span style={{ color: '#94a3b8' }}>Tax/VAT (7.5%)</span>
                                        <span style={{ fontWeight: '600' }}>₦{(amount * 0.075).toLocaleString()}</span>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.5rem', borderTop: '2px dashed rgba(255,255,255,0.1)' }}>
                                        <span style={{ color: '#f1f5f9', fontWeight: 'bold', fontSize: '1.1rem' }}>Total Received</span>
                                        <span style={{ fontWeight: '900', color: '#3b82f6', fontSize: '1.75rem' }}>₦{(amount * 1.075).toLocaleString()}</span>
                                    </div>
                                </div>

                                {paymentProcessing ? (
                                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                                        <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 1rem' }} />
                                        <p>Finalizing your filing, please wait...</p>
                                    </div>
                                ) : (
                                    <PaymentGateway
                                        amount={amount * 1.075}
                                        user={selectedApplicant}
                                        onSuccess={handlePaymentSuccess}
                                        onCancel={() => setStep(3)}
                                        itemDescription={`Jurat Filing: ${selectedTemplate.title}`}
                                        metadata={{
                                            applicant_id: selectedApplicant.id,
                                            staff_id: staff.id,
                                            filing_type: 'affidavit'
                                        }}
                                    />
                                )}
                            </div>
                        )}

                        {step === 5 && (
                            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                                <div style={{ width: '100px', height: '100px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', color: '#10b981' }}>
                                    <CheckCircle size={60} />
                                </div>
                                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Filing Successful!</h1>
                                <p style={{ color: '#94a3b8', fontSize: '1.2rem', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
                                    The affidavit has been successfully filed on behalf of <span style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{selectedApplicant.first_name} {selectedApplicant.surname}</span>.
                                    A confirmation email has been sent to <strong style={{ color: 'white' }}>{selectedApplicant.email || 'the applicant'}</strong>.
                                </p>
                                <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                                    <button onClick={resetFiling} style={{ padding: '16px 40px', borderRadius: '16px', background: '#3b82f6', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s' }}>
                                        Go to Dashboard
                                    </button>
                                    <button
                                        onClick={() => window.location.reload()}
                                        style={{ padding: '16px 40px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s' }}
                                    >
                                        File Another
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {view === 'file_probate' && selectedApplicant && (
                    <motion.div
                        key="file_probate"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="glass-card"
                        style={{ background: 'rgb\(18 37 74\)', border: 'none', padding: isMobile ? '1.5rem' : '3rem', color: 'white' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <button onClick={goBack} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <ArrowLeft size={18} /> {step === 5 ? 'Close' : 'Back'}
                            </button>
                            {step < 5 && (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {[1, 2, 3, 4].map(s => (
                                        <div key={s} style={{ width: '30px', height: '4px', background: step >= s ? '#10b981' : '#334155', borderRadius: '2px' }} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {step === 1 && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                <h2 style={{ marginBottom: '0.5rem' }}>Deceased Person Details</h2>
                                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '2.5rem' }}>Filing for: <strong style={{ color: '#10b981', textTransform: 'capitalize' }}>{selectedApplicant.first_name} {selectedApplicant.surname}</strong></p>

                                <div style={{ display: 'grid', gap: '1.5rem' }}>
                                    <div>
                                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Full Name of Deceased *</label>
                                        <input type="text" value={probateData.deceasedName} onChange={e => setProbateData({ ...probateData, deceasedName: e.target.value })} style={{ width: '100%', padding: '14px', background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: 'white' }} placeholder="Enter full name" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Date of Death</label>
                                        <input type="date" style={{ width: '100%', padding: '14px', background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: 'white' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Last Known Address</label>
                                        <textarea style={{ width: '100%', padding: '14px', background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: 'white', minHeight: '100px' }} placeholder="Enter address"></textarea>
                                    </div>
                                </div>
                                <button onClick={() => setStep(2)} disabled={!probateData.deceasedName} style={{ width: '100%', marginTop: '2.5rem', padding: '16px', borderRadius: '12px', background: '#10b981', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', opacity: probateData.deceasedName ? 1 : 0.5 }}>
                                    Continue to Next of Kin
                                </button>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                <h2 style={{ marginBottom: '0.5rem' }}>Beneficiaries & Next of Kin</h2>
                                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '2rem' }}>Add individuals related to the deceased.</p>

                                <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '1.5rem', borderRadius: '16px', border: '1px solid #334155', marginBottom: '2rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                                        <div>
                                            <label style={{ display: 'block', color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}>Name</label>
                                            <input type="text" style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}>Relationship</label>
                                            <input type="text" style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white' }} />
                                        </div>
                                        <button style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>Add</button>
                                    </div>
                                </div>

                                <button onClick={() => setStep(3)} style={{ width: '100%', padding: '16px', borderRadius: '12px', background: '#10b981', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                                    Continue to Documents
                                </button>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                <h2 style={{ marginBottom: '0.5rem' }}>Supporting Documents</h2>
                                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '2.5rem' }}>Upload certificates and letters.</p>

                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    {['Death Certificate', 'Introduction Letter'].map(doc => (
                                        <div key={doc} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', background: '#0f172a', borderRadius: '12px', border: '1px solid #334155' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ width: '40px', height: '40px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                                                    <Upload size={20} />
                                                </div>
                                                <span>{doc}</span>
                                            </div>
                                            <button style={{ background: '#334155', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12px' }}>Upload</button>
                                        </div>
                                    ))}
                                </div>

                                <button onClick={() => setStep(4)} style={{ width: '100%', marginTop: '3rem', padding: '16px', borderRadius: '12px', background: '#10b981', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                                    Proceed to Payment
                                </button>
                            </motion.div>
                        )}

                        {step === 4 && (
                            <div style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto', padding: '2rem 0' }}>
                                <div style={{ width: '80px', height: '80px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', color: '#10b981' }}>
                                    <CreditCard size={40} />
                                </div>
                                <h2 style={{ marginBottom: '1rem' }}>Payment Confirmation</h2>
                                <p style={{ color: '#94a3b8', marginBottom: '2.5rem' }}>Probate Fee: <strong style={{ color: 'white', fontSize: '1.5rem' }}>₦15,000</strong></p>

                                <button
                                    onClick={handleFileProbate}
                                    disabled={submittingProbate}
                                    style={{ width: '100%', padding: '16px', borderRadius: '12px', background: '#10b981', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                >
                                    {submittingProbate ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                                    Confirm Payment & Finalize
                                </button>
                            </div>
                        )}

                        {step === 5 && (
                            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                                <div style={{ width: '100px', height: '100px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', color: '#10b981' }}>
                                    <CheckCircle size={60} />
                                </div>
                                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Application Submitted!</h1>
                                <p style={{ color: '#94a3b8', fontSize: '1.2rem', marginBottom: '3rem' }}>The probate application for <span style={{ textTransform: 'capitalize', fontWeight: 'bold', color: 'white' }}>{probateData.deceasedName}</span> has been received.</p>
                                <button onClick={resetFiling} style={{ padding: '16px 40px', borderRadius: '12px', background: '#3b82f6', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                                    Back to Dashboard
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default JuratPortal;
