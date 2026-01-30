import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Search, CheckCircle, XCircle, FileText, User, Calendar, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import api from '../../utils/api';
import { formatDate } from '../../utils/dateUtils';

const Verification = () => {
    const { type } = useParams(); // 'affidavit' or 'probate'
    const navigate = useNavigate();
    const [appId, setAppId] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [result, setResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        // Reset state when type changes
        setStatus('idle');
        setResult(null);
        setAppId('');
        setErrorMsg('');
    }, [type]);

    const handleVerify = async (e) => {
        e.preventDefault();
        if (!appId.trim()) return;

        setStatus('loading');
        setErrorMsg('');
        setResult(null);

        try {
            const endpoint = type === 'affidavit'
                ? `/verify/affidavit/${encodeURIComponent(appId)}`
                : `/verify/probate/${encodeURIComponent(appId)}`;

            const res = await api.get(endpoint);
            setResult(res.data);
            setStatus('success');
        } catch (err) {
            console.error('Verification failed:', err);
            setStatus('error');
            setErrorMsg(err.response?.data?.error || 'Verification failed. Specific record not found or invalid ID.');
        }
    };

    const isAffidavit = type === 'affidavit';
    const title = isAffidavit ? 'Affidavit Verification' : 'Probate Verification';

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
            {/* Navbar Simple */}
            <nav style={{ padding: '1rem 2rem', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#778eaeff', fontWeight: '600' }}>
                        <ArrowLeft size={20} /> Back
                    </button>
                    <div style={{ width: '1px', height: '24px', background: '#e2e8f0' }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Shield size={24} className={isAffidavit ? "text-blue-500" : "text-green-500"} />
                        <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'rgb\(18 37 74\)' }}>Official Document Verification</h2>
                    </div>
                </div>
            </nav>

            <div style={{ flex: 1, padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ width: '100%', maxWidth: '600px' }}
                >
                    <div className="glass-card" style={{ background: 'white', borderRadius: '24px', padding: '3rem', BoxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0' }}>
                        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                            <div style={{
                                width: '64px', height: '64px', borderRadius: '20px',
                                background: isAffidavit ? 'rgba(59, 130, 246, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                color: isAffidavit ? '#3b82f6' : '#22c55e',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto'
                            }}>
                                {isAffidavit ? <FileText size={32} /> : <Shield size={32} />}
                            </div>
                            <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'rgb\(18 37 74\)', marginBottom: '0.5rem' }}>{title}</h1>
                            <p style={{ color: '#778eaeff' }}>Enter the Application ID located on the document to verify its authenticity.</p>
                        </div>

                        <form onSubmit={handleVerify} style={{ marginBottom: '2rem' }}>
                            <div style={{ position: 'relative' }}>
                                <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input
                                    type="text"
                                    placeholder={isAffidavit ? "Enter ID (e.g., CRMS-153 or 153)" : "Enter ID (e.g., PRO-2023-ABC789)"}
                                    value={appId}
                                    onChange={(e) => setAppId(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '16px 16px 16px 50px',
                                        fontSize: '16px',
                                        borderRadius: '16px',
                                        border: '2px solid #e2e8f0',
                                        outline: 'none',
                                        transition: 'all 0.2s',
                                        background: '#f8fafc'
                                    }}
                                    className="focus:border-blue-500 focus:bg-white"
                                />
                                <button
                                    type="submit"
                                    disabled={status === 'loading'}
                                    style={{
                                        position: 'absolute',
                                        right: '8px',
                                        top: '8px',
                                        bottom: '8px',
                                        padding: '0 24px',
                                        borderRadius: '12px',
                                        background: isAffidavit ? '#3b82f6' : '#22c55e',
                                        color: 'white',
                                        border: 'none',
                                        fontWeight: '600',
                                        cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                                        transition: 'transform 0.1s'
                                    }}
                                    className="hover:scale-105 active:scale-95"
                                >
                                    {status === 'loading' ? <Loader2 className="animate-spin" /> : 'Verify'}
                                </button>
                            </div>
                        </form>

                        {/* Instructions Section */}
                        <div style={{
                            background: '#eff6ff',
                            borderRadius: '16px',
                            padding: '1.5rem',
                            marginBottom: '2rem',
                            border: '1px solid #dbeafe',
                            display: 'flex',
                            gap: '1rem'
                        }}>
                            <div style={{ flexShrink: 0, marginTop: '2px' }}>
                                <AlertCircle size={24} className="text-blue-500" />
                            </div>
                            <div>
                                <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e40af', fontSize: '1rem', fontWeight: 'bold' }}>How to Verify</h3>
                                <p style={{ margin: '0 0 0.5rem 0', color: '#1e3a8a', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                    Locate the <strong>Application ID</strong> on the top-right corner of your official document.
                                    It typically follows the format <code>{isAffidavit ? 'AD...' : 'PRO...'}</code>.
                                </p>
                                <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#1e3a8a', fontSize: '0.9rem', lineHeight: '1.4' }}>
                                    <li>Enter the ID exactly as shown, including any dashes.</li>
                                    <li>Verification confirms that the document was officially issued by the Borno State High Court.</li>
                                    <li>If the document is not found, please double-check the ID or contact support.</li>
                                </ul>
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            {status === 'error' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '16px', padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}
                                >
                                    <XCircle className="text-red-500 flex-shrink-0" size={24} />
                                    <div>
                                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#991b1b', fontSize: '1rem' }}>Verification Failed</h3>
                                        <p style={{ margin: 0, color: '#b91c1c', fontSize: '0.9rem' }}>{errorMsg}</p>
                                    </div>
                                </motion.div>
                            )}

                            {status === 'success' && result && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    style={{ background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '24px', padding: '2rem', position: 'relative', overflow: 'hidden' }}
                                >
                                    {/* Watermark */}
                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)', fontSize: '5rem', fontWeight: '900', color: 'rgba(34, 197, 94, 0.05)', whiteSpace: 'nowrap', pointerEvents: 'none', userSelect: 'none' }}>
                                        VERIFIED VALID
                                    </div>

                                    <div style={{ textAlign: 'center', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', borderRadius: '50%', background: '#22c55e', color: 'white', marginBottom: '1rem', boxShadow: '0 10px 25px -5px rgba(34, 197, 94, 0.5)' }}>
                                            <CheckCircle size={32} />
                                        </div>
                                        <h2 style={{ margin: 0, color: '#166534', fontSize: '1.5rem', fontWeight: '800' }}>Document Verified</h2>
                                        <p style={{ margin: '0.5rem 0 0 0', color: '#15803d', fontSize: '0.9rem' }}>This document is a valid official record.</p>
                                    </div>

                                    <div style={{ display: 'grid', gap: '1rem', position: 'relative', zIndex: 1 }}>
                                        {isAffidavit ? (
                                            <>
                                                <InfoRow label="Application ID" value={result.application_id} />
                                                <InfoRow label="Deponent Name" value={result.deponent_name} icon={<User size={16} />} />
                                                <InfoRow label="Date Modified" value={formatDate(result.date_modified)} icon={<Calendar size={16} />} />
                                                <div style={{ marginTop: '1rem', padding: '1.5rem', background: 'rgba(255,255,255,0.6)', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                                                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#778eaeff', fontWeight: 'bold', marginBottom: '0.75rem' }}>Affidavit Content</div>
                                                    <div style={{ color: '#334155', fontSize: '0.95rem', lineHeight: '1.6' }} dangerouslySetInnerHTML={{ __html: result.content }} />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <InfoRow label="Probate ID" value={result.application_id} />
                                                <InfoRow label="Deceased Name" value={result.deceased_name} icon={<User size={16} />} />
                                                <InfoRow label="Next of Kin" value={result.applicant_name} icon={<User size={16} />} />
                                                <InfoRow label="Date Completed" value={formatDate(result.completed_at)} icon={<Calendar size={16} />} />
                                                <InfoRow label="Estate Type" value={result.estate_type || 'N/A'} />
                                            </>
                                        )}
                                    </div>

                                    <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.8rem', color: '#778eaeff' }}>
                                        Verified by Borno State High Court Registry System
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

const InfoRow = ({ label, value, icon }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#778eaeff', fontSize: '0.9rem' }}>
            {icon}
            {label}
        </div>
        <div style={{ fontWeight: '600', color: 'rgb\(18 37 74\)' }}>{value}</div>
    </div>
);

export default Verification;
