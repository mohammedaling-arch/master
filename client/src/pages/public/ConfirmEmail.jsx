import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';

const ConfirmEmail = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link.');
            return;
        }

        const verifyEmail = async () => {
            try {
                const res = await api.get(`/auth/verify-email?token=${token}`);
                setStatus('success');
                setMessage(res.data.message);
                setTimeout(() => navigate('/login'), 5000);
            } catch (err) {
                console.error('Email verification error:', err);
                setStatus('error');
                setMessage(err.response?.data?.error || 'Verification failed. The link may have expired.');
            }
        };

        verifyEmail();
    }, [token, navigate]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, rgb\(18 37 74\) 0%, #080c14 100%)',
            padding: '1.5rem',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                    width: '100%',
                    maxWidth: '450px',
                    background: 'white',
                    borderRadius: '40px',
                    padding: '4rem',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    zIndex: 10,
                    textAlign: 'center'
                }}
            >
                {status === 'verifying' && (
                    <>
                        <Loader2 size={64} color="#3b82f6" className="animate-spin" style={{ margin: '0 auto 2rem' }} />
                        <h1 style={{ color: 'rgb\(18 37 74\)', fontSize: '1.75rem', fontWeight: '800' }}>Verifying email...</h1>
                        <p style={{ color: '#778eaeff' }}>Please wait while we confirm your account.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                            <CheckCircle size={40} color="#10b981" />
                        </div>
                        <h1 style={{ color: 'rgb\(18 37 74\)', fontSize: '1.75rem', fontWeight: '800', marginBottom: '1rem' }}>Great Success!</h1>
                        <p style={{ color: '#778eaeff', lineHeight: 1.6, marginBottom: '2rem' }}>{message}</p>
                        <button
                            onClick={() => navigate('/login')}
                            style={{
                                width: '100%',
                                padding: '14px',
                                background: '#10b981',
                                border: 'none',
                                borderRadius: '30px',
                                color: 'white',
                                fontWeight: '700',
                                cursor: 'pointer'
                            }}
                        >
                            Log in Now
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                            <AlertCircle size={40} color="#ef4444" />
                        </div>
                        <h1 style={{ color: 'rgb\(18 37 74\)', fontSize: '1.75rem', fontWeight: '800', marginBottom: '1rem' }}>Verification Failed</h1>
                        <p style={{ color: '#778eaeff', lineHeight: 1.6, marginBottom: '2rem' }}>{message}</p>
                        <button
                            onClick={() => navigate('/login')}
                            style={{
                                width: '100%',
                                padding: '14px',
                                background: '#778eaeff',
                                border: 'none',
                                borderRadius: '30px',
                                color: 'white',
                                fontWeight: '700',
                                cursor: 'pointer'
                            }}
                        >
                            Back to Login
                        </button>
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default ConfirmEmail;
