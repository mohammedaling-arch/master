import React, { useState, useEffect } from 'react';
import { Camera, CheckCircle, XCircle, Video, User, Loader2, AlertCircle, ShieldCheck, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';

const CFOVerification = ({ isMobile: isMobileProp }) => {
    const [filings, setFilings] = useState([]);
    const [selectedFiling, setSelectedFiling] = useState(null);
    const [callActive, setCallActive] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    const [isMobileInternal, setIsMobileInternal] = useState(window.innerWidth <= 1024);
    const isMobile = isMobileProp !== undefined ? isMobileProp : isMobileInternal;

    useEffect(() => {
        const handleResize = () => setIsMobileInternal(window.innerWidth <= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        fetchFilings();
    }, []);

    const fetchFilings = async () => {
        setLoading(true);
        try {
            const res = await api.get('/staff/affidavits/pending-verification');
            setFilings(res.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching filings:', err);
            setError('Failed to load verification requests.');
        } finally {
            setLoading(false);
        }
    };

    const handleFinalApprove = async () => {
        if (!selectedFiling) return;
        setProcessing(true);
        try {
            await api.put(`/affidavits/${selectedFiling.id}/approve`, { nextStatus: 'completed' });
            // Success
            setCallActive(false);
            setSelectedFiling(null);
            fetchFilings();
        } catch (err) {
            console.error('Error final approving:', err);
            alert('Failed to finalize affidavit.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr', gap: isMobile ? '1rem' : '2rem' }}>
            {(!selectedFiling || !isMobile) && (
                <div className="glass-card" style={{ background: 'rgb\(18 37 74\)', border: 'none', padding: '1rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Video size={20} /> Live Verification Queue
                    </h3>

                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center' }}><Loader2 className="animate-spin" color="#38bdf8" /></div>
                    ) : error ? (
                        <div style={{ padding: '1rem', color: '#ef4444', textAlign: 'center' }}>
                            <AlertCircle style={{ marginBottom: '0.5rem' }} />
                            <p style={{ fontSize: '13px' }}>{error}</p>
                        </div>
                    ) : filings.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Queue is empty</div>
                    ) : (
                        filings.map(filing => (
                            <div
                                key={filing.id}
                                onClick={() => {
                                    setSelectedFiling(filing);
                                    setCallActive(false);
                                }}
                                style={{
                                    padding: '1.2rem',
                                    background: selectedFiling?.id === filing.id ? '#334155' : 'rgba(255,255,255,0.03)',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    marginBottom: '1rem',
                                    borderLeft: selectedFiling?.id === filing.id ? '4px solid #10b981' : '4px solid transparent',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ fontWeight: 'bold', color: 'white' }}>{filing.first_name} {filing.surname}</div>
                                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{filing.type}</div>
                                <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '0.8rem', display: 'flex', gap: '8px' }}>
                                    <Loader2 size={12} className="animate-spin" /> Ready for Oath
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {(!isMobile || (selectedFiling && isMobile)) && (
                <div className="glass-card" style={{ background: 'rgb\(18 37 74\)', border: 'none', minHeight: isMobile ? 'auto' : '600px', display: 'flex', flexDirection: 'column', padding: isMobile ? '1rem' : '1.5rem' }}>
                    {selectedFiling ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem' }}>
                                {isMobile && (
                                    <button onClick={() => setSelectedFiling(null)} style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.5rem 0' }}>
                                        ← Back to Queue
                                    </button>
                                )}
                                <div>
                                    <h2 style={{ color: 'white', margin: 0, fontSize: isMobile ? '1.25rem' : '1.5rem' }}>Establish Secure Connection</h2>
                                    <p style={{ color: '#94a3b8' }}>Applicant: {selectedFiling.first_name} {selectedFiling.surname} • ID: CRMS-{selectedFiling.id}</p>
                                </div>
                                <button
                                    onClick={() => setCallActive(!callActive)}
                                    className="btn"
                                    style={{
                                        background: callActive ? '#ef4444' : '#10b981',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.8rem 1.5rem',
                                        borderRadius: '12px',
                                        boxShadow: callActive ? '0 4px 12px rgba(239, 68, 68, 0.3)' : '0 4px 12px rgba(16, 185, 129, 0.3)'
                                    }}
                                >
                                    <Video size={20} /> {callActive ? 'Terminate Call' : 'Begin Video Verification'}
                                </button>
                            </div>

                            <div style={{
                                background: '#0f172a',
                                flex: 1,
                                borderRadius: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                overflow: 'hidden',
                                border: '1px solid #334155',
                                margin: '1rem 0'
                            }}>
                                {callActive ? (
                                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                                        {/* Main Remote Video (Simulated with local for now or placeholder) */}
                                        {/* For "actual" flow, we show the camera. In a real app this is the remote user. */}
                                        <video
                                            ref={el => {
                                                if (el) {
                                                    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                                                        .then(stream => {
                                                            el.srcObject = stream;
                                                            el.play();
                                                        })
                                                        .catch(err => console.error("Camera access denied:", err));
                                                }
                                            }}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            muted
                                        />

                                        {/* Encrypted Badge */}
                                        <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', background: 'rgba(16, 185, 129, 0.2)', backdropFilter: 'blur(4px)', padding: '8px 16px', borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                                            <ShieldCheck size={16} color="#10b981" />
                                            <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold' }}>ENCRYPTED FEED</span>
                                        </div>

                                        {/* PIP (Simulating Self) */}
                                        <div style={{ position: 'absolute', bottom: '1.5rem', right: '1.5rem', width: '160px', height: '120px', background: 'rgb\(18 37 74\)', borderRadius: '12px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 15px rgba(0,0,0,0.5)' }}>
                                            <div style={{ width: '100%', height: '100%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <p style={{ fontSize: '10px', color: '#94a3b8' }}>Local View</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', color: '#334155' }}>
                                        <div style={{ background: 'rgb\(18 37 74\)', padding: '2rem', borderRadius: '50%', marginBottom: '1.5rem', display: 'inline-block' }}>
                                            <Video size={64} />
                                        </div>
                                        <h3 style={{ color: '#475569' }}>Ready for Session</h3>
                                        <p style={{ maxWidth: '300px', margin: '0.5rem auto' }}>Establish a video link with the deponent to take their oral oath.</p>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem' }}>
                                <button
                                    onClick={handleFinalApprove}
                                    disabled={!callActive || processing}
                                    className="btn"
                                    style={{
                                        flex: 1,
                                        background: '#10b981',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.75rem',
                                        padding: '1.2rem',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        opacity: (!callActive || processing) ? 0.5 : 1,
                                        cursor: (!callActive || processing) ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {processing ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={22} /> Authorize & Apply SEAL</>}
                                </button>
                                <button
                                    disabled={processing}
                                    className="btn"
                                    style={{ flex: 1, background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1.2rem', fontWeight: 'bold' }}
                                >
                                    <XCircle size={22} /> Reject Session
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#334155' }}>
                            <div style={{ background: 'rgb\(18 37 74\)', padding: '2rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
                                <User size={64} />
                            </div>
                            <h3>Selection Required</h3>
                            <p>Pick a request from the queue to start video verification.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const detailItem = {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    padding: '1.2rem',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.05)'
};

export default CFOVerification;
