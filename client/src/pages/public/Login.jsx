import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useModal } from '../../context/ModalContext';
import api from '../../utils/api';
import { motion } from 'framer-motion';
import { Lock, Mail, Loader2, Eye, EyeOff } from 'lucide-react';
import ReCAPTCHA from "react-google-recaptcha";
import { GlassSpinner } from '../../components/common/LoadingOverlay';

const Login = ({ setUser }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [captchaEnabled, setCaptchaEnabled] = useState(false);
    const [captchaSiteKey, setCaptchaSiteKey] = useState('');
    const [captchaToken, setCaptchaToken] = useState(null);
    const captchaRef = useRef(null);
    const { showModal } = useModal();
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchLoginConfig = async () => {
            try {
                const res = await api.get('/settings');
                if (res.data.captcha_enabled === '1') {
                    setCaptchaEnabled(true);
                    setCaptchaSiteKey(res.data.captcha_site_key);
                }
            } catch (err) {
                console.error("Failed to load login configuration:", err);
            }
        };
        fetchLoginConfig();
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('reason') === 'timeout') {
            showModal({
                type: 'warning',
                title: 'Session Expired',
                message: 'You have been logged out due to inactivity. Please login again to continue.'
            });
        }
    }, [location, showModal]);

    const handleLogin = async (e) => {
        e.preventDefault();

        if (captchaEnabled && !captchaToken) {
            setError('Please complete the reCAPTCHA verification');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const res = await api.post('/public/login', {
                email,
                password,
                captchaToken
            });
            const userData = res.data.user;
            setUser(userData);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(userData));
            navigate('/modules');
        } catch (err) {
            console.error('Login error:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Login failed';
            setError(errorMsg);

            // Reset captcha on failure
            if (captchaRef.current) {
                captchaRef.current.reset();
                setCaptchaToken(null);
            }

            showModal({
                type: 'error',
                title: 'Login Failed',
                message: errorMsg
            });
        } finally {
            setLoading(false);
        }
    };

    const onCaptchaChange = (token) => {
        setCaptchaToken(token);
        setError('');
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
            {loading && <GlassSpinner message="Signing you in..." />}
            {/* Background decorative blurs */}
            <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '35%', height: '35%', background: 'radial-gradient(circle, rgba(96, 165, 250, 0.1) 0%, transparent 70%)', borderRadius: '50%' }} />

            <motion.div
                key="login-card"
                initial={{ opacity: 0, rotateY: 45, x: -30 }}
                animate={{ opacity: 1, rotateY: 0, x: 0 }}
                exit={{ opacity: 0, rotateY: -45, x: 30 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    width: '100%',
                    maxWidth: '1000px',
                    minHeight: isMobile ? 'auto' : '600px',
                    background: 'white',
                    borderRadius: isMobile ? '24px' : '40px',
                    overflow: 'hidden',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    zIndex: 10
                }}
            >
                {/* Left side: Form */}
                <div style={{
                    flex: '1',
                    padding: isMobile ? '3rem 1.5rem' : '3.5rem 4rem',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
                        <img src="/assets/logo.png" alt="Logo" style={{ width: '40px', height: '40px', borderRadius: '10px' }} />
                        <div>
                            <h2 style={{ margin: 0, color: 'rgb\(18 37 74\)', fontSize: '1.25rem', fontWeight: '800', lineHeight: 1 }}>CRMS</h2>
                            <p style={{ margin: 0, color: '#3b82f6', fontSize: '9px', fontWeight: 'bold', letterSpacing: '1px' }}>BORNO STATE HIGH COURT</p>
                        </div>
                    </div>

                    <h1 style={{ color: 'rgb\(18 37 74\)', fontSize: '1.75rem', marginBottom: '0.4rem', fontWeight: '800' }}>Welcome back</h1>
                    <p style={{ color: '#778eaeff', marginBottom: '2.5rem', fontSize: '14px' }}>Please enter your account details</p>

                    {error && (
                        <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '12px', fontSize: '13px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Lock size={16} /> {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Email</label>
                            <input
                                type="email"
                                placeholder="Johndoe@gmail.com"
                                style={{
                                    width: '100%',
                                    padding: '14px 20px',
                                    borderRadius: '30px',
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '14px',
                                    outline: 'none',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                                }}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    style={{
                                        width: '100%',
                                        padding: '14px 45px 14px 18px',
                                        borderRadius: '30px',
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '14px',
                                        outline: 'none',
                                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                                    }}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: 'absolute', right: '18px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#778eaeff', cursor: 'pointer' }}>
                                <input type="checkbox" style={{ borderRadius: '4px' }} />
                                Keep me logged in
                            </label>
                            <Link to="/forgot-password" style={{ fontSize: '13px', color: '#3b82f6', textDecoration: 'none', fontWeight: '600' }}>Forgot Password?</Link>
                        </div>

                        {captchaEnabled && captchaSiteKey && (
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                                <ReCAPTCHA ref={captchaRef} sitekey={captchaSiteKey} onChange={onCaptchaChange} />
                            </div>
                        )}

                        <button
                            className="btn btn-primary"
                            style={{
                                marginTop: '1rem',
                                height: '54px',
                                borderRadius: '30px',
                                background: 'linear-gradient(to right, #10b981, #059669)',
                                color: 'white',
                                fontWeight: '700',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '15px',
                                boxShadow: '0 8px 16px -4px rgba(16, 185, 129, 0.4)',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin" style={{ margin: '0 auto' }} /> : 'Sign in'}
                        </button>
                    </form>

                    <p style={{ marginTop: 'auto', paddingTop: '2rem', textAlign: 'center', color: '#778eaeff', fontSize: '14px' }}>
                        Don't have an account? <Link to="/register" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '700' }}>Create an account</Link>
                    </p>
                </div>

                {/* Right side: Cinematic Image */}
                {!isMobile && (
                    <div style={{
                        flex: '1.2',
                        padding: '1.25rem',
                    }}>
                        <div style={{
                            height: '100%',
                            width: '100%',
                            borderRadius: '30px',
                            overflow: 'hidden',
                            position: 'relative',
                            background: '#020617'
                        }}>
                            <img
                                src="/assets/gavel.png"
                                alt="Legal Justice"
                                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
                            />
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.8))'
                            }} />

                            <div style={{
                                position: 'absolute',
                                bottom: '3rem',
                                left: '2.5rem',
                                right: '2.5rem',
                                color: 'white'
                            }}>
                                <h3 style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: 1.1, marginBottom: '1.5rem' }}>Digitalizing the Registry Services.</h3>
                                <p style={{ fontSize: '1.05rem', lineHeight: 1.6, opacity: 0.9, fontWeight: '400' }}>
                                    "Bringing efficiency and transparency to legal document management through modern innovation."
                                </p>

                                <div style={{ marginTop: '3rem', background: 'rgba(255,255,255,0.95)', padding: '1.5rem', borderRadius: '24px', position: 'relative' }}>
                                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'rgb\(18 37 74\)', marginBottom: '4px' }}>Secure System Verified</div>
                                    <div style={{ fontSize: '12px', color: '#778eaeff' }}>Borno State High Court Portal v4.0.2</div>
                                    <div style={{ position: 'absolute', right: '1.5rem', top: '50%', transform: 'translateY(-50%)', width: '40px', height: '40px', background: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                        <Lock size={20} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default Login;
