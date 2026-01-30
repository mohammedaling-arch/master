import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            setSubmitted(true);
        } catch (err) {
            console.error('Forgot password error:', err);
            // Even if it fails, we show the same message for security
            setSubmitted(true);
        } finally {
            setLoading(false);
        }
    };

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
                initial={{ opacity: 0, rotateY: 45, x: -30 }}
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
                <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#778eaeff', textDecoration: 'none', fontSize: '14px', marginBottom: '2rem', fontWeight: '600' }}>
                    <ArrowLeft size={16} /> Back to Login
                </Link>

                {submitted ? (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                            <CheckCircle size={40} color="#10b981" />
                        </div>
                        <h1 style={{ color: 'rgb\(18 37 74\)', fontSize: '1.75rem', marginBottom: '1rem', fontWeight: '800' }}>Check your email</h1>
                        <p style={{ color: '#778eaeff', lineHeight: 1.6, marginBottom: '2rem' }}>
                            We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the instructions.
                        </p>
                        <p style={{ fontSize: '14px', color: '#94a3b8' }}>
                            Didn't receive the email? <button onClick={() => setSubmitted(false)} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: '700', cursor: 'pointer' }}>Try again</button>
                        </p>
                    </motion.div>
                ) : (
                    <>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                            <Mail size={40} color="#f97316" />
                        </div>
                        <h1 style={{ color: 'rgb\(18 37 74\)', fontSize: '1.75rem', marginBottom: '0.4rem', fontWeight: '800' }}>Forgot password?</h1>
                        <p style={{ color: '#778eaeff', marginBottom: '2.5rem', fontSize: '14px' }}>No worries, we'll send you reset instructions.</p>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Email Address</label>
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    style={{
                                        width: '100%',
                                        padding: '14px 20px',
                                        borderRadius: '30px',
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '14px',
                                        outline: 'none'
                                    }}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                style={{
                                    height: '54px',
                                    borderRadius: '30px',
                                    background: 'linear-gradient(to right, #10b981, #059669)',
                                    color: 'white',
                                    fontWeight: '700',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '15px',
                                    boxShadow: '0 8px 16px -4px rgba(16, 185, 129, 0.4)',
                                    transition: 'all 0.2s',
                                    marginTop: '1rem'
                                }}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="animate-spin" style={{ margin: '0 auto' }} /> : 'Reset Password'}
                            </button>
                        </form>
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
