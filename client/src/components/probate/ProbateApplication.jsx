import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Upload, CreditCard, ChevronRight, FileText, Loader2, CheckCircle, User, MapPin, Briefcase, Camera } from 'lucide-react';
import api from '../../utils/api';
import PaymentGateway from '../common/PaymentGateway';
import ImageCapture from '../common/ImageCapture';
import UniversalUploader from '../common/UniversalUploader';

const ProbateApplication = ({ user, isMobile = false, onComplete = null, isStaffFiling = false }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [showPaymentGateway, setShowPaymentGateway] = useState(false);
    const [showNokCapture, setShowNokCapture] = useState(false);
    const [activeUploadField, setActiveUploadField] = useState(null);

    const handleUniversalUpload = (file) => {
        if (activeUploadField && file) {
            setFiles(prev => ({ ...prev, [activeUploadField]: file }));
        }
        setActiveUploadField(null);
    };

    // Step 1: Deceased Info
    const [formData, setFormData] = useState({
        deceasedName: '',
        dateOfDeath: '',
        homeAddress: '',
        deathLocation: '',
        occupation: '',
        employerName: '',
        employerAddress: ''
    });

    // Step 2: Next of Kin (User Profile)
    const [nokData, setNokData] = useState({
        fullName: user?.full_name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        relationshipToDeceased: '',
        profilePic: null // For upload if needed
    });

    // Step 3: Files
    const [files, setFiles] = useState({
        deathCertificate: null,
        introLetter: null
    });

    // Config & Fee
    const [configs, setConfigs] = useState([]);
    const [applicationFee, setApplicationFee] = useState(0);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await api.get('/public/probate-config');
                setConfigs(res.data);
                // Calculate Fee: Sum of 'item' types (e.g. Application Fee, Processing Fee)
                // Filter for items that are fees/services
                const feeItems = res.data.filter(c => c.type === 'item');
                const total = feeItems.reduce((sum, item) => sum + Number(item.document_fee), 0);
                setApplicationFee(total > 0 ? total : 15000); // Default fallback
            } catch (error) {
                console.error('Failed to load config', error);
            }
        };
        fetchConfig();
    }, []);

    const handleFileUpload = (key, e) => {
        if (e.target.files[0]) {
            setFiles(prev => ({ ...prev, [key]: e.target.files[0] }));
        }
    };

    const handleStep1Next = () => {
        if (!formData.deceasedName || !formData.dateOfDeath || !formData.homeAddress || !formData.occupation || !formData.deathLocation) {
            alert('Please fill all required fields (*) in Step 1, including Place of Death.');
            return;
        }
        setStep(2);
    };

    const handleStep2Next = () => {
        if (!nokData.relationshipToDeceased) {
            alert('Please specify the Relationship to Deceased.');
            return;
        }
        setStep(3);
    };

    const handlePaymentSuccess = async (paymentData) => {
        setLoading(true);
        setShowPaymentGateway(false);
        try {
            // 1. Create Probate Application
            const appPayload = {
                deceasedName: formData.deceasedName,
                dateOfDeath: formData.dateOfDeath,
                homeAddress: formData.homeAddress,
                deathLocation: formData.deathLocation,
                occupation: formData.occupation,
                employerName: formData.employerName,
                employerAddress: formData.employerAddress,
                relationshipToNok: nokData.relationshipToDeceased,
                applicantId: user.is_applicant_manager_user ? user.id : null
            };

            let probateRes;
            if (isStaffFiling && user.is_applicant_manager_user) {
                // Staff filing for an applicant
                probateRes = await api.post(`/applicants/${user.id}/probate`, appPayload);
            } else {
                // Public user self-filing
                probateRes = await api.post('/public/probate', appPayload);
            }
            const probateId = probateRes.data.id;

            // 2. Upload Documents
            const uploadPromises = [];
            const uploadEndpoint = isStaffFiling
                ? `/applicants/${user.id}/probate/${probateId}/documents`
                : `/public/probate/${probateId}/documents`;

            if (files.deathCertificate) {
                const formData = new FormData();
                formData.append('file', files.deathCertificate);
                formData.append('documentName', 'Death Certificate');
                uploadPromises.push(api.post(uploadEndpoint, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                }));
            }

            if (files.introLetter) {
                const formData = new FormData();
                formData.append('file', files.introLetter);
                formData.append('documentName', 'Introduction Letter');
                uploadPromises.push(api.post(uploadEndpoint, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                }));
            }

            await Promise.all(uploadPromises);

            // 3. Record Payment
            await api.post('/payments', {
                user_id: isStaffFiling ? null : user.id,
                applicant_id: user.is_applicant_manager_user ? user.id : null,
                probate_application_id: probateId,
                item_paid: 'Probate Application Fee',
                amount: applicationFee,
                transaction_id: paymentData.reference,
                payment_status: 'completed'
            });

            setStep(5);
        } catch (error) {
            console.error('Probate filing error:', error);
            alert(`Filing Failed: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const occupations = ['Merchant', 'Trader', 'Civil Servant', 'Public Servant', 'Student', 'Unemployed'];
    const showEmployer = ['Civil Servant', 'Public Servant'].includes(formData.occupation);

    return (
        <div className="glass-card" style={{ background: 'rgb\(18 37 74\)', border: 'none', color: 'white', padding: isMobile ? '1rem' : '2.5rem' }}>
            {/* Stepper Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', borderBottom: '1px solid #334155', paddingBottom: '1rem', overflowX: isMobile ? 'auto' : 'visible', gap: '1rem' }}>
                {['Deceased Info', 'Next of Kin', 'Documents', 'Payment'].map((s, i) => (
                    <div key={s} style={{
                        color: step === i + 1 ? '#2ecc71' : '#778eaeff',
                        fontWeight: step === i + 1 ? 'bold' : 'normal',
                        borderBottom: step === i + 1 ? '2px solid #2ecc71' : 'none',
                        paddingBottom: '0.5rem',
                        whiteSpace: 'nowrap',
                        fontSize: isMobile ? '12px' : '14px',
                        cursor: step > i + 1 ? 'pointer' : 'default'
                    }} onClick={() => step > i + 1 && setStep(i + 1)}>
                        <span style={{ marginRight: '4px', opacity: 0.5 }}>{i + 1}.</span> {s}
                    </div>
                ))}
            </div>

            {/* Step 1: Deceased Info */}
            {step === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <h3 style={{ marginBottom: '0.5rem' }}>Deceased Person Details</h3>
                    <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '2rem' }}>Please provide the official details of the deceased individual.</p>

                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <div>
                            <label style={labelStyle}>Full Name *</label>
                            <input
                                type="text"
                                style={darkInputStyle}
                                value={formData.deceasedName}
                                onChange={e => setFormData({ ...formData, deceasedName: e.target.value })}
                                placeholder="e.g. Alhaji Ibrahim Mohammed"
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={labelStyle}>Date of Death *</label>
                                <input
                                    type="date"
                                    style={darkInputStyle}
                                    value={formData.dateOfDeath}
                                    onChange={e => setFormData({ ...formData, dateOfDeath: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Occupation *</label>
                                <select
                                    style={darkInputStyle}
                                    value={formData.occupation}
                                    onChange={e => setFormData({ ...formData, occupation: e.target.value })}
                                >
                                    <option value="">Select Occupation...</option>
                                    {occupations.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {showEmployer && (
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem', background: 'rgba(15,23,42,0.3)', padding: '1rem', borderRadius: '8px' }}>
                                <div>
                                    <label style={labelStyle}>Employer Name</label>
                                    <input
                                        type="text"
                                        style={darkInputStyle}
                                        value={formData.employerName}
                                        onChange={e => setFormData({ ...formData, employerName: e.target.value })}
                                        placeholder="Organization / Company"
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Employer Address</label>
                                    <input
                                        type="text"
                                        style={darkInputStyle}
                                        value={formData.employerAddress}
                                        onChange={e => setFormData({ ...formData, employerAddress: e.target.value })}
                                        placeholder="Office Location"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label style={labelStyle}>Home Address *</label>
                            <textarea
                                style={{ ...darkInputStyle, height: '80px' }}
                                value={formData.homeAddress}
                                onChange={e => setFormData({ ...formData, homeAddress: e.target.value })}
                                placeholder="Permanent Residential address"
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>Place of Death Address *</label>
                            <textarea
                                style={{ ...darkInputStyle, height: '80px' }}
                                value={formData.deathLocation}
                                onChange={e => setFormData({ ...formData, deathLocation: e.target.value })}
                                placeholder="Hospital or Logic address where death occurred"
                            />
                        </div>
                    </div>
                    <button onClick={handleStep1Next} className="btn btn-primary" style={nextBtnStyle(isMobile)}>
                        Continue <ChevronRight size={18} />
                    </button>
                </motion.div>
            )}

            {/* Step 2: Next of Kin */}
            {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <h3 style={{ marginBottom: '0.5rem' }}>Next of Kin (Applicant)</h3>
                    <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '2rem' }}>Review your details as the primary applicant/Next of Kin.</p>

                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                {user?.profile_pic || nokData.profilePic ? (
                                    <img src={nokData.profilePic ? URL.createObjectURL(nokData.profilePic) : (user.profile_pic || '/assets/avatar-placeholder.png')} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <User size={40} color="#94a3b8" />
                                )}
                            </div>
                            <div>
                                <button
                                    type="button"
                                    onClick={() => setShowNokCapture(true)}
                                    className="btn"
                                    style={{ background: '#3b82f6', border: 'none', color: 'white', cursor: 'pointer', fontSize: '13px', padding: '8px 16px', borderRadius: '8px' }}
                                >
                                    <Camera size={14} style={{ marginRight: '6px' }} /> {nokData.profilePic ? 'Change Photo' : 'Take/Upload Photo'}
                                </button>
                                {showNokCapture && (
                                    <ImageCapture
                                        onClose={() => setShowNokCapture(false)}
                                        onImageCaptured={(file) => setNokData({ ...nokData, profilePic: file })}
                                        title="Next of Kin Photo"
                                    />
                                )}
                                <p style={{ fontSize: '12px', color: '#778eaeff', marginTop: '4px' }}>Passport photograph required if not on profile.</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={labelStyle}>Full Name</label>
                                <input
                                    type="text"
                                    style={darkInputStyle}
                                    value={nokData.fullName}
                                    onChange={e => setNokData({ ...nokData, fullName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Relationship to Deceased *</label>
                                <input
                                    type="text"
                                    style={darkInputStyle}
                                    value={nokData.relationshipToDeceased}
                                    onChange={e => setNokData({ ...nokData, relationshipToDeceased: e.target.value })}
                                    placeholder="e.g. Son, Daughter, Wife, Brother"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={labelStyle}>Email</label>
                                <input
                                    type="email"
                                    style={{ ...darkInputStyle, opacity: 0.7 }}
                                    value={nokData.email}
                                    readOnly
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Phone Number</label>
                                <input
                                    type="tel"
                                    style={darkInputStyle}
                                    value={nokData.phone}
                                    onChange={e => setNokData({ ...nokData, phone: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={navBtnContainer(isMobile)}>
                        <button onClick={() => setStep(1)} className="btn" style={backBtnStyle}>Back</button>
                        <button onClick={handleStep2Next} className="btn btn-primary" style={nextBtnStyle(false)}>Next: Documents</button>
                    </div>
                </motion.div>
            )}

            {/* Step 3: Documents */}
            {step === 3 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <h3 style={{ marginBottom: '0.5rem' }}>Supporting Documentation</h3>
                    <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '2rem' }}>Upload scan of required/optional legal documents.</p>

                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        {/* Death Certificate */}
                        <div style={darkUploadBox(isMobile)}>
                            <div style={iconBoxStyle('#2ecc71')}>
                                <FileText size={24} color="#2ecc71" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontWeight: '600', color: '#f1f5f9' }}>Death Certificate <span style={{ color: '#ef4444' }}>*</span></p>
                                <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                                    {files.deathCertificate ? files.deathCertificate.name : 'Required proof of death'}
                                </p>
                            </div>
                            <button
                                className="btn"
                                style={uploadBtnStyle}
                                onClick={() => setActiveUploadField('deathCertificate')}
                            >
                                <Upload size={16} /> {files.deathCertificate ? 'Change' : 'Upload'}
                            </button>
                        </div>

                        {/* Introduction Letter */}
                        <div style={darkUploadBox(isMobile)}>
                            <div style={iconBoxStyle('#3b82f6')}>
                                <FileText size={24} color="#3b82f6" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontWeight: '600', color: '#f1f5f9' }}>Introduction Letter</p>
                                <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                                    {files.introLetter ? files.introLetter.name : 'Optional (Required if Employee)'}
                                </p>
                            </div>
                            <button
                                className="btn"
                                style={{ ...uploadBtnStyle, background: '#334155' }}
                                onClick={() => setActiveUploadField('introLetter')}
                            >
                                <Upload size={16} /> {files.introLetter ? 'Change' : 'Upload'}
                            </button>
                        </div>
                    </div>

                    <div style={navBtnContainer(isMobile)}>
                        <button onClick={() => setStep(2)} className="btn" style={backBtnStyle}>Back</button>
                        <button
                            onClick={() => {
                                if (!files.deathCertificate) { alert('Death Certificate is required.'); return; }
                                setStep(4);
                            }}
                            className="btn btn-primary"
                            style={nextBtnStyle(false)}
                        >
                            Next: Payment
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Step 4: Payment */}
            {step === 4 && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
                    <div style={{ padding: isMobile ? '2rem 1rem' : '4rem 2rem', background: '#0f172a', borderRadius: '24px', border: '1px solid #334155' }}>
                        {showPaymentGateway ? (
                            <PaymentGateway
                                amount={applicationFee}
                                user={user}
                                itemDescription="Probate Application Fee"
                                onSuccess={handlePaymentSuccess}
                                onCancel={() => setShowPaymentGateway(false)}
                            />
                        ) : (
                            <>
                                <div style={{ width: '80px', height: '80px', background: 'rgba(46, 204, 113, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                                    <CreditCard size={40} color="#2ecc71" />
                                </div>
                                <h2 style={{ color: 'white' }}>Application Fee</h2>
                                <div style={{ margin: '1.5rem 0' }}>
                                    <span style={{ fontSize: '1.5rem', color: '#94a3b8', verticalAlign: 'top', marginTop: '8px', display: 'inline-block' }}>₦</span>
                                    <span style={{ fontSize: isMobile ? '3rem' : '4rem', fontWeight: '800', color: '#2ecc71' }}>{applicationFee.toLocaleString()}</span>
                                </div>
                                <p style={{ color: '#94a3b8', maxWidth: '400px', margin: '0 auto 3rem' }}>
                                    Standard probate application processing fee as per state regulations.
                                </p>

                                <button onClick={() => setShowPaymentGateway(true)} disabled={loading} className="btn btn-primary" style={{ background: '#27ae60', padding: '1rem 3rem', fontSize: '16px', width: isMobile ? '100%' : 'auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    {loading ? <Loader2 className="animate-spin" /> : 'Proceed to Payment Gateways'}
                                </button>
                            </>
                        )}
                    </div>
                    {!showPaymentGateway && <button onClick={() => setStep(3)} className="btn" style={{ ...backBtnStyle, marginTop: '2rem', border: 'none' }}>Back to Documents</button>}
                </motion.div>
            )}

            {/* Step 5: Success */}
            {step === 5 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <div style={{ width: '80px', height: '80px', background: 'rgba(46, 204, 113, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                        <CheckCircle size={40} color="#2ecc71" />
                    </div>
                    <h2 style={{ color: 'white', marginBottom: '1rem' }}>Application Submitted!</h2>
                    <p style={{ color: '#94a3b8', marginBottom: '2.5rem' }}>
                        Your probate application for <strong>{formData.deceasedName}</strong> has been received by the Probate Registry.
                        <br />Fee of ₦{applicationFee.toLocaleString()} has been recorded.
                    </p>
                    <button
                        onClick={() => {
                            if (onComplete) onComplete();
                            else window.location.href = isStaffFiling ? '/staff/pd' : '/probate';
                        }}
                        className="btn btn-primary"
                        style={{ background: '#2ecc71', padding: '1rem 3rem' }}
                    >
                        Return to Dashboard
                    </button>
                </motion.div>
            )}
            {activeUploadField && (
                <UniversalUploader
                    onClose={() => setActiveUploadField(null)}
                    onFileSelect={handleUniversalUpload}
                    title={activeUploadField === 'deathCertificate' ? 'Upload Death Certificate' : 'Upload Document'}
                />
            )}
        </div>
    );
};

// Styles
const labelStyle = { display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '13px', fontWeight: '500' };
const darkInputStyle = { width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #334155', background: '#0f172a', color: 'white', outline: 'none', fontSize: '15px' };
const nextBtnStyle = (isMobile) => ({ background: '#2ecc71', marginTop: '0', width: isMobile ? '100%' : '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '48px' });
const backBtnStyle = { background: 'transparent', color: '#94a3b8', border: '1px solid #334155', height: '48px', padding: '0 2rem' };
const navBtnContainer = (isMobile) => ({ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem', marginTop: '2.5rem', justifyContent: 'space-between' });
const darkUploadBox = (isMobile) => ({ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', gap: '1.5rem', padding: '1.5rem', border: '1px solid #334155', borderRadius: '16px', background: 'rgba(15, 23, 42, 0.3)', textAlign: isMobile ? 'center' : 'left' });
const iconBoxStyle = (color) => ({ width: '48px', height: '48px', background: `${color}1a`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' });
const uploadBtnStyle = { background: '#3b82f6', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' };

export default ProbateApplication;
