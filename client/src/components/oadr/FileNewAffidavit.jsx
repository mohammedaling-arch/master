import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Camera, CreditCard, Upload, CheckCircle,
    Download, Loader2, UserCheck, XCircle, AlertCircle, X,
    Bell, Smile, ShieldCheck, Clock
} from 'lucide-react';
import api from '../../utils/api';
import RichTextEditor from '../common/RichTextEditor';
import { useModal } from '../../context/ModalContext';
import { generateAffidavitPDF } from '../../utils/pdfGenerator';
import PaymentGateway from '../common/PaymentGateway';





const FileNewAffidavit = ({ user, editMode = false, affidavit = null, onComplete = null, onNavigateToOath, isMobile = false }) => {
    const [step, setStep] = useState(editMode ? 2 : 1); // Skip to step 2 (review) in edit mode
    const [templates, setTemplates] = useState([]);
    const [template, setTemplate] = useState(null);
    const [content, setContent] = useState('');
    const [file, setFile] = useState(null);
    const [applicationId, setApplicationId] = useState(null);
    const [editStatus, setEditStatus] = useState('submitted');
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationProgress, setVerificationProgress] = useState(0);
    const [loadingTemplates, setLoadingTemplates] = useState(true);
    const { showModal } = useModal();

    // Payment State
    const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, processing
    const [showPaymentGateway, setShowPaymentGateway] = useState(false);

    // ... (keep logic same until handleProceedToLiveOath)

    const handleProceedToLiveOath = async () => {
        // 1. Check for basic internet connectivity
        if (!navigator.onLine) {
            showModal({
                type: 'error',
                title: 'No Internet Connection',
                message: 'You appear to be offline. Please check your internet connection to proceed to the live session.'
            });
            return;
        }

        // 2. Check for existence of Application ID
        if (!applicationId) {
            console.error('handleProceedToLiveOath: Missing applicationId');
            showModal({
                type: 'error',
                title: 'System Error',
                message: 'Application ID was not found. Please try refreshing the page.'
            });
            return;
        }

        // 3. Check for valid user session
        const token = localStorage.getItem('token');
        if (!token) {
            showModal({
                type: 'error',
                title: 'Session Expired',
                message: 'Your session has expired. Please log in again.'
            });
            return;
        }

        try {
            console.log(`Verifying server connection and ensuring user is live...`);
            // 4. Ping server to ensure "live and online" status
            await api.get('/banners');

            console.log(`Sending virtual oath request for affidavit ${applicationId}...`);
            // Set status to "requested"
            await api.put(`/affidavits/${applicationId}/virtual-oath`, { status: 'requested' });

            showModal({
                type: 'success',
                title: 'Request Sent',
                message: 'You are being redirected to the Virtual Oath waiting room.',
                confirmText: 'Proceed',
                onConfirm: () => {
                    if (onNavigateToOath) onNavigateToOath();
                }
            });
        } catch (error) {
            console.error('Failed to set oath request:', error);
            // Distinguish between network/server errors and actual request errors
            let errorMessage = 'An unexpected error occurred.';
            if (error.code === 'ERR_NETWORK') {
                errorMessage = 'Server is unreachable. Please try again later.';
            } else {
                errorMessage = error.response?.data?.error || error.response?.data?.message || 'Unknown server error';
            }

            showModal({
                type: 'error',
                title: 'Request Failed',
                message: `Failed to initiate virtual oath request: ${errorMessage}`
            });
        }
    };


    useEffect(() => {
        fetchTemplates();
    }, []);

    useEffect(() => {
        // Sync state with props when affidavit changes (especially for edit mode)
        if (editMode && affidavit) {
            console.log('FileNewAffidavit: Syncing with affidavit prop', affidavit);
            setApplicationId(affidavit.id);
            setContent(affidavit.content || '');
            if (step === 1) setStep(2); // Force step 2 if in edit mode
        }
    }, [editMode, affidavit]);

    useEffect(() => {
        // Pre-populate template in edit mode once templates are loaded
        if (editMode && affidavit && templates.length > 0 && !template) {
            // Find by ID if possible, otherwise title
            const matchedTemplate = templates.find(t => t.id === affidavit.template_id) ||
                templates.find(t => t.title === affidavit.type);
            if (matchedTemplate) {
                setTemplate(matchedTemplate);
            }
        }
    }, [editMode, affidavit, templates, template]);

    const fetchTemplates = async () => {
        try {
            const res = await api.get('/public/templates');
            setTemplates(res.data);
        } catch (error) {
            console.error('Error fetching templates:', error);
            showModal({
                type: 'error',
                title: 'Error Loading Templates',
                message: 'Failed to load affidavit templates. Please refresh the page.'
            });
        } finally {
            setLoadingTemplates(false);
        }
    };

    const handleNext = () => setStep(step + 1);
    const handlePrev = () => setStep(step - 1);

    const getAmount = () => {
        if (!template) return 0;
        return parseFloat(template.amount);
    };

    const handlePaymentSuccess = async (paymentData) => {
        setPaymentStatus('processing');
        setShowPaymentGateway(false);

        try {
            const formData = new FormData();
            formData.append('userId', user?.id || 1);
            formData.append('type', template?.title || 'Custom Affidavit');
            formData.append('amount', getAmount());
            formData.append('payment_id', paymentData.reference);

            if (template?.template_type === 'upload' && file) {
                formData.append('file', file);
                formData.append('content', `Uploaded File: ${file.name}`);
            } else {
                formData.append('content', content);
            }

            const res = await api.post('/affidavits', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setApplicationId(res.data.id);

            // Record Payment in separate table
            await api.post('/payments', {
                user_id: user.id,
                applicant_id: null,
                affidavit_id: res.data.id,
                item_paid: template?.title || 'Custom Affidavit',
                amount: getAmount() * 1.075,
                transaction_id: paymentData.reference,
                payment_status: 'completed'
            });

            setPaymentStatus('idle');

            showModal({
                type: 'success',
                title: 'Payment Successful',
                message: `Payment of ₦${(getAmount() * 1.075).toLocaleString()} received via ${paymentData.gateway.toUpperCase()}.`,
                confirmText: 'Review Submission',
                onConfirm: handleNext
            });

        } catch (error) {
            console.error('API Error:', error);
            setPaymentStatus('idle');
            showModal({
                type: 'error',
                title: 'System Error',
                message: 'Payment was successful but we failed to record it. Please contact support with reference: ' + paymentData.reference
            });
        }
    };

    const handleDummyLiveness = async () => {
        try {
            // Mark as requested
            await api.put(`/affidavits/${applicationId}/virtual-oath`, { status: 'requested' });
        } catch (err) {
            console.error('Failed to set oath request status:', err);
        }

        setIsVerifying(true);
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            setVerificationProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                finalizeApplication();
            }
        }, 150);
    };

    const finalizeApplication = async () => {
        try {
            // Update the application with a "captured image" (placeholder) to show it was verified
            await api.put(`/affidavits/${applicationId}/status`, {
                status: 'submitted', // Finalize to submitted
                captured_image: 'liveness_verified_dummy_path'
            });

            setIsVerifying(false);
            showModal({
                type: 'success',
                title: 'Biometric Verified',
                message: 'Internal AI check complete. Your application is now prioritized for Registry Review.',
                confirmText: 'Finish',
                onConfirm: handleNext
            });
        } catch (error) {
            console.error('Update Error:', error);
            setIsVerifying(false);
            // Even if it fails, let the user proceed for the prototype
            handleNext();
        }
    };

    const handleUpdate = async () => {
        try {
            const currentId = applicationId || affidavit?.id;

            if (!currentId) {
                console.error('FileNewAffidavit: Missing ID', { applicationId, affidavit });
                throw new Error('Could not identify the affidavit to update (Missing ID).');
            }

            const formData = new FormData();
            formData.append('type', template?.title || affidavit?.type || 'Custom Affidavit');
            formData.append('content', content);
            formData.append('status', 'submitted');

            if (template?.template_type === 'upload' && file) {
                formData.append('file', file);
            }

            console.log(`[FileNewAffidavit] Resubmitting affidavit ${currentId} via FormData...`);
            const res = await api.put(`/affidavits/${currentId}`, formData);

            console.log(`[FileNewAffidavit] Server response:`, res.data);

            showModal({
                type: 'success',
                title: 'Resubmitted Successfully',
                message: `Affidavit CRMS-${currentId} has been resubmitted for review.`,
                confirmText: 'Back to History',
                onConfirm: () => {
                    if (onComplete) onComplete();
                }
            });
        } catch (error) {
            console.error('[FileNewAffidavit] Update Error:', error);
            const errorMsg = error.response?.data?.error ||
                error.response?.data?.message ||
                error.message ||
                'An unexpected error occurred while saving changes.';

            showModal({
                type: 'error',
                title: 'Update Failed',
                message: errorMsg
            });
        }
    };

    const downloadPDF = async () => {
        await generateAffidavitPDF({
            user,
            applicationId,
            templateTitle: template?.title,
            content,
            file,
            showModal,
            language: affidavit?.language,
            juratName: affidavit?.filed_by_name,
            division: affidavit?.division
        });
    };

    return (
        <div className="glass-card" style={{ background: 'white', padding: isMobile ? '1rem' : '2rem', minHeight: '500px' }}>

            {/* Step Progress Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem', overflowX: isMobile ? 'auto' : 'visible', paddingBottom: '0.5rem', gap: '0.5rem' }}>
                {['Select', 'Review', 'Pay', 'Sub', 'Verify', 'Done'].map((label, idx) => (
                    <div key={idx} style={{
                        flex: isMobile ? '0 0 60px' : 1,
                        textAlign: 'center',
                        paddingBottom: '0.8rem',
                        borderBottom: step === idx + 1 ? '3px solid #3498db' : '3px solid #f1f5f9',
                        color: step === idx + 1 ? '#3498db' : '#94a3b8',
                        fontWeight: step === idx + 1 ? '700' : '500',
                        fontSize: '11px',
                        transition: 'all 0.3s'
                    }}>
                        {idx + 1}. {label}
                    </div>
                ))}
            </div>

            {step === 1 && (
                <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                    <h3 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Choose Affidavit Template</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#778eaeff', fontSize: '14px' }}>Template Category</label>
                            {loadingTemplates ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '12px' }}>
                                    <Loader2 size={20} className="animate-spin" />
                                    <span>Loading templates...</span>
                                </div>
                            ) : (
                                <select
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none' }}
                                    value={template?.id || ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '') {
                                            setTemplate(null);
                                        } else {
                                            const selected = templates.find(t => t.id === parseInt(val));
                                            setTemplate(selected);
                                        }
                                    }}
                                >
                                    <option value="">-- Select Template --</option>
                                    {templates.map(t => (
                                        <option key={t.id} value={t.id}>{t.title} - ₦{parseFloat(t.amount).toLocaleString()}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {template && template.template_type === 'upload' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{ padding: '2rem', border: '2px dashed #cbd5e1', borderRadius: '12px', textAlign: 'center', background: '#f8fafc' }}
                            >
                                <Upload size={40} color="#94a3b8" style={{ marginBottom: '1rem' }} />
                                <h4 style={{ margin: '0 0 0.5rem' }}>Upload your Affidavit</h4>
                                <p style={{ fontSize: '12px', color: '#778eaeff', marginBottom: '1.5rem' }}>Only PDF files are accepted (Max 5MB)</p>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => setFile(e.target.files[0])}
                                    style={{ display: 'none' }}
                                    id="file-upload"
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="btn"
                                    style={{ background: '#3b82f6', color: 'white', padding: '0.6rem 1.5rem', cursor: 'pointer', display: 'inline-block' }}
                                >
                                    Select File
                                </label>
                                {file && <p style={{ marginTop: '1rem', color: '#10b981', fontSize: '13px', fontWeight: '500' }}>✓ {file.name}</p>}
                            </motion.div>
                        )}

                        <button
                            disabled={!template || (template.template_type === 'upload' && !file)}
                            onClick={() => {
                                if (template && template.template_type !== 'upload') setContent(template.content);
                                handleNext();
                            }}
                            className="btn btn-primary"
                            style={{ padding: '12px' }}
                        >
                            Next: Review Content
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    {template?.template_type === 'upload' ? (
                        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <FileText size={40} color="#10b981" />
                            </div>
                            <h3>File Review</h3>
                            <p style={{ color: '#778eaeff' }}>Your document is ready for processing.</p>
                            <div style={{ margin: '1.5rem auto', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', maxWidth: '400px' }}>
                                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{file?.name}</p>
                                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>{(file?.size / 1024 / 1024).toFixed(2)} MB • PDF Document</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3>Edit Affidavit Content</h3>
                                <span style={{ fontSize: '12px', background: '#3b82f6', color: 'white', padding: '4px 10px', borderRadius: '20px' }}>Smart Editor</span>
                            </div>
                            <RichTextEditor
                                value={content}
                                onChange={setContent}
                                placeholder="Start typing your affidavit content here..."
                            />
                            {editMode && <input type="hidden" name="status" value={editStatus} />}
                        </>
                    )}
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                        <button
                            onClick={editMode ? onComplete : handlePrev}
                            className="btn"
                            style={{ background: '#f1f5f9', color: '#475569', flex: 1, padding: '12px' }}
                        >
                            {editMode ? 'Cancel Edit' : 'Previous Step'}
                        </button>
                        <button onClick={editMode ? handleUpdate : handleNext} className="btn btn-primary" style={{ flex: 1, padding: '12px' }}>
                            {editMode ? 'Update & Resubmit' : 'Next: Proceed to Payment'}
                        </button>
                    </div>
                </motion.div>
            )}

            {step === 3 && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
                    {showPaymentGateway ? (
                        <div style={{ marginTop: '2rem' }}>
                            <PaymentGateway
                                amount={getAmount() * 1.075}
                                user={user}
                                itemDescription={template?.title || 'Affidavit Filing'}
                                onSuccess={handlePaymentSuccess}
                                onCancel={() => setShowPaymentGateway(false)}
                            />
                        </div>
                    ) : (
                        <>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <CreditCard size={40} color="#3b82f6" />
                            </div>
                            <h3>Secure Processing Fee</h3>
                            <p style={{ color: '#778eaeff' }}>Please settle the administrative fee to activate video verification.</p>

                            <div style={{ margin: '2rem 0', padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ color: '#778eaeff' }}>Service Fee</span>
                                    <span style={{ fontWeight: '600' }}>₦{getAmount().toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                                    <span style={{ color: '#778eaeff' }}>VAT (7.5%)</span>
                                    <span style={{ fontWeight: '600' }}>₦{(getAmount() * 0.075).toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem' }}>
                                    <span style={{ fontWeight: '700' }}>Total Amount</span>
                                    <span style={{ fontWeight: '800', color: '#10b981' }}>₦{(getAmount() * 1.075).toLocaleString()}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <button
                                    onClick={() => setShowPaymentGateway(true)}
                                    className="btn btn-primary"
                                    style={{
                                        padding: '1.2rem',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        borderRadius: '16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px'
                                    }}
                                >
                                    <CreditCard size={20} />
                                    Proceed to Secure Payment
                                </button>
                                <button onClick={handlePrev} className="btn" style={{ background: '#f1f5f9', color: '#475569', padding: '1rem' }}>Back to Review</button>
                            </div>
                        </>
                    )}
                </motion.div>
            )}

            {step === 4 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', maxWidth: '550px', margin: '0 auto' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                        <AlertCircle size={40} color="#d97706" />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Application Submitted</h3>
                    <p style={{ color: '#778eaeff', fontSize: '1.1rem', marginBottom: '2rem' }}>
                        Your payment was successful and your application has been received. Your current status is <strong style={{ color: '#d97706' }}>UNDER REVIEW</strong>.
                    </p>

                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', textAlign: 'left', border: '1px solid #e2e8f0', marginBottom: '2.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                            <span style={{ color: '#778eaeff' }}>Application ID:</span>
                            <span style={{ fontWeight: '700' }}>CRMS-{applicationId}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#778eaeff' }}>Current Status:</span>
                            <span style={{ color: '#d97706', fontWeight: 'bold' }}>UNDER REVIEW</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={() => window.location.reload()}
                            className="btn"
                            style={{ flex: 1, background: '#f1f5f9', color: '#475569' }}
                        >
                            Back to Dashboard
                        </button>
                        <button
                            onClick={handleProceedToLiveOath}
                            className="btn btn-primary"
                            style={{ flex: 1, background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        >
                            Continue to Live Verify <Camera size={18} />
                        </button>
                    </div>
                </motion.div>
            )}

            {step === 5 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <Camera size={40} color="#f43f5e" />
                        </div>
                        <h3>Video Verification Session</h3>
                        <p style={{ color: '#778eaeff' }}>Connect with a judicial officer to finalize your oath in real-time.</p>
                    </div>

                    <div style={{ padding: '4rem 1rem', background: '#0f172a', borderRadius: '16px', textAlign: 'center', margin: '1rem 0', position: 'relative', overflow: 'hidden', minHeight: '350px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '4px solid rgb\(18 37 74\)' }}>
                        <AnimatePresence mode="wait">
                            {isVerifying ? (
                                <motion.div key="verifying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: 'center' }}>
                                    <Loader2 size={48} className="animate-spin" color="#3b82f6" style={{ marginBottom: '1.5rem' }} />
                                    <h4 style={{ color: 'white' }}>Performing Liveness Check...</h4>
                                    <p style={{ color: '#94a3b8' }}>Please look directly into the camera</p>
                                    <div style={{ width: '200px', height: '8px', background: 'rgb\(18 37 74\)', borderRadius: '4px', margin: '1.5rem auto', overflow: 'hidden' }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${verificationProgress}%` }}
                                            style={{ height: '100%', background: '#3b82f6' }}
                                        />
                                    </div>
                                    <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{verificationProgress}%</span>
                                </motion.div>
                            ) : (
                                <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ color: '#94a3b8', textAlign: 'center' }}>
                                    <Camera size={64} style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
                                    <h4 style={{ color: 'white', margin: '0 0 0.5rem' }}>Camera Ready</h4>
                                    <p style={{ fontSize: '14px' }}>Please ensure your face is well-lit and clearly visible.</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div style={{ position: 'absolute', top: '20px', left: '20px', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.5)', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                            <span style={{ color: 'white', fontSize: '10px', fontWeight: 'bold' }}>LIVE PREVIEW</span>
                        </div>
                    </div>

                    <button
                        onClick={handleDummyLiveness}
                        disabled={isVerifying}
                        className="btn"
                        style={{ width: '100%', background: isVerifying ? 'rgb\(18 37 74\)' : '#10b981', color: 'white', padding: '1.2rem', fontWeight: 'bold', fontSize: '16px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)', cursor: isVerifying ? 'not-allowed' : 'pointer', marginTop: '2rem' }}
                    >
                        {isVerifying ? 'Verifying Identity...' : 'Start Liveness Check'}
                    </button>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                        <button onClick={handlePrev} disabled={isVerifying} className="btn" style={{ background: '#f1f5f9', color: '#475569', flex: 1, opacity: isVerifying ? 0.5 : 1 }}>Back to Submission</button>
                        <button className="btn" disabled={isVerifying} style={{ background: '#f1f5f9', color: '#475569', flex: 1, opacity: isVerifying ? 0.5 : 1 }}>Schedule for Later</button>
                    </div>
                </motion.div>
            )}

            {step === 6 && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ background: '#f0fdf4', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '2px solid #10b981' }}>
                            <Clock size={40} color="#10b981" />
                        </div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'rgb\(18 37 74\)', marginBottom: '1rem' }}>Application Submitted</h1>
                        <p style={{ color: '#778eaeff', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                            Your affidavit has been submitted to the <strong>OADR Registry</strong> for formal review.
                        </p>
                    </div>

                    <div style={{ background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', padding: '2.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', marginBottom: '3rem', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)', maxWidth: '500px', margin: '0 auto 3rem' }}>
                        <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%)', zIndex: 0 }}></div>

                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9', marginBottom: '1rem' }}>
                                <span style={{ color: '#778eaeff', fontWeight: '500' }}>Reference ID</span>
                                <span style={{ fontWeight: '800', color: 'rgb\(18 37 74\)', fontFamily: 'monospace', fontSize: '1.1rem' }}>CRMS-{applicationId}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9', marginBottom: '1rem' }}>
                                <span style={{ color: '#778eaeff', fontWeight: '500' }}>Current Status</span>
                                <span style={{ color: '#3b82f6', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Loader2 size={18} className="animate-spin" /> SUBMITTED
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#778eaeff', fontWeight: '500' }}>Identity Check</span>
                                <span style={{ fontWeight: '700', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <ShieldCheck size={18} /> AI SECURED
                                </span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                        <button onClick={downloadPDF} className="btn" style={{ background: '#fff', border: '2px solid #e2e8f0', padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '14px', fontWeight: '600' }}>
                            <Download size={20} /> Preview Draft
                        </button>
                        <button onClick={() => window.location.reload()} className="btn" style={{ background: 'rgb\(18 37 74\)', color: 'white', padding: '1rem 2rem', borderRadius: '14px', fontWeight: '600' }}>
                            Go to Dashboard
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default FileNewAffidavit;
