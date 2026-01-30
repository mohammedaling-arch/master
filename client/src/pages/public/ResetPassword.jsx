import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, success, error
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setStatus('error');
            setMessage('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/auth/reset-password', { token, password });
            setStatus('success');
            setMessage(res.data.message);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            console.error('Reset password error:', err);
            setStatus('error');
            setMessage(err.response?.data?.error || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0f172a', color: 'white' }}>
                <div style={{ textAlign: 'center' }}>
                    <AlertCircle size={64} color="#ef4444" style={{ marginBottom: '1rem' }} />
                    <h1>Invalid Link</h1>
                    <p>This password reset link is invalid or has expired.</p>
                    <button onClick={() => navigate('/login')} style={{ marginTop: '2rem', padding: '12px 24px', background: '#3b82f6', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>Return to Login</button>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, rgb\(18 37 74\) 0%, #080c14 100%)',
            padding: '1.5rem',
            position: 'relative',
            overflow: 'hidden',
            perspective: '1200px'
        }}>
            <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '35%', height: '35%', background: 'radial-gradient(circle, rgba(96, 165, 250, 0.1) 0%, transparent 70%)', borderRadius: '50%' }} />

            <motion.div
                initial={{ opacity: 0, rotateY: -45, x: 30 }}
                animate={{ opacity: 1, rotateY: 0, x: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                    width: '100%',
                    maxWidth: '500px',
                    background: 'white',
                    borderRadius: '40px',
                    padding: isMobile ? '2.5rem 1.5rem' : '4rem',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    zIndex: 10,
                    textAlign: 'center'
                }}
            >
                {status === 'success' ? (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                            <CheckCircle size={40} color="#10b981" />
                        </div>
                        <h1 style={{ color: 'rgb\(18 37 74\)', fontSize: '1.75rem', marginBottom: '1rem', fontWeight: '800' }}>Success!</h1>
                        <p style={{ color: '#778eaeff', lineHeight: 1.6, marginBottom: '2rem' }}>{message}</p>
                        <p style={{ fontSize: '14px', color: '#94a3b8' }}>Redirecting to login...</p>
                    </motion.div>
                ) : (
                    <>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                            <Lock size={40} color="#3b82f6" />
                        </div>
                        <h1 style={{ color: 'rgb\(18 37 74\)', fontSize: '1.75rem', marginBottom: '0.4rem', fontWeight: '800' }}>Set new password</h1>
                        <p style={{ color: '#778eaeff', marginBottom: '2.5rem', fontSize: '14px' }}>Please choose a strong password for your account.</p>

                        {status === 'error' && (
                            <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '12px', fontSize: '13px', marginBottom: '1.5rem' }}>
                                {message}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>New Password</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    style={{
                                        width: '100%',
                                        padding: '14px 20px',
                                        borderRadius: '30px',
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '14px',
                                        outline: 'none'
                                    }}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Confirm Password</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    style={{
                                        width: '100%',
                                        padding: '14px 20px',
                                        borderRadius: '30px',
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '14px',
                                        outline: 'none'
                                    }}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                style={{
                                    height: '54px',
                                    borderRadius: '30px',
                                    background: 'linear-gradient(to right, #3b82f6, #2563eb)',
                                    color: 'white',
                                    fontWeight: '700',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '15px',
                                    boxShadow: '0 8px 16px -4px rgba(59, 130, 246, 0.4)',
                                    transition: 'all 0.2s',
                                    marginTop: '1rem'
                                }}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="animate-spin" style={{ margin: '0 auto' }} /> : 'Change Password'}
                            </button>
                        </form>
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default ResetPassword;
