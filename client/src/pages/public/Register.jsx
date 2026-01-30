import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useModal } from '../../context/ModalContext';

const Register = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [formData, setFormData] = useState({
        firstName: '',
        middleName: '',
        surname: '',
        gender: '',
        age: '',
        email: '',
        phone: '',
        address: '',
        nin: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    // const [error, setError] = useState(''); // replaced by modal
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();
    const { showModal } = useModal();

    const handleRegister = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            showModal({
                type: 'warning',
                title: 'Password Mismatch',
                message: 'Passwords do not match. Please try again.'
            });
            return;
        }

        setLoading(true);
        try {
            // Exclude confirmPassword before sending to server
            const { confirmPassword, ...dataToSend } = formData;
            await api.post('/public/register', dataToSend);

            showModal({
                type: 'success',
                title: 'Registration Successful',
                message: 'Your account has been created successfully. Redirecting to login...',
                showCancel: false,
                confirmText: 'Login Now',
                onConfirm: () => navigate('/login')
            });

            setSuccess(true);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Registration failed';
            showModal({
                type: 'error',
                title: 'Registration Failed',
                message: errorMsg
            });
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
            {/* Background decorative blurs */}
            <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '35%', height: '35%', background: 'radial-gradient(circle, rgba(96, 165, 250, 0.1) 0%, transparent 70%)', borderRadius: '50%' }} />

            <motion.div
                key="register-card"
                initial={{ opacity: 0, rotateY: -45, x: 30 }}
                animate={{ opacity: 1, rotateY: 0, x: 0 }}
                exit={{ opacity: 0, rotateY: 45, x: -30 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    width: '100%',
                    maxWidth: '1100px',
                    minHeight: isMobile ? 'auto' : '750px',
                    background: 'white',
                    borderRadius: isMobile ? '24px' : '40px',
                    overflow: 'hidden',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    zIndex: 10
                }}
            >
                {/* Left side: Register Form */}
                <div style={{
                    flex: '1.2',
                    padding: isMobile ? '2.5rem 1.5rem' : '3.5rem 4rem',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <img src="/assets/logo.png" alt="Logo" style={{ width: '40px', height: '40px', borderRadius: '10px' }} />
                        <div>
                            <h2 style={{ margin: 0, color: 'rgb\(18 37 74\)', fontSize: '1.25rem', fontWeight: '800', lineHeight: 1 }}>CRMS</h2>
                            <p style={{ margin: 0, color: '#3b82f6', fontSize: '9px', fontWeight: 'bold', letterSpacing: '1px' }}>BORNO STATE HIGH COURT</p>
                        </div>
                    </div>

                    <h1 style={{ color: 'rgb\(18 37 74\)', fontSize: '1.75rem', marginBottom: '0.4rem', fontWeight: '800' }}>Create Account</h1>
                    <p style={{ color: '#778eaeff', marginBottom: '2.5rem', fontSize: '14px' }}>Join the modern legal document management system</p>

                    {success ? (
                        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                            <CheckCircle size={64} color="#10b981" style={{ marginBottom: '1.5rem' }} />
                            <h2 style={{ color: 'rgb\(18 37 74\)' }}>Account Created!</h2>
                            <p style={{ color: '#778eaeff', marginTop: '1rem' }}>Please check your email to verify your account. Redirecting to login...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleRegister} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                            <div style={inputWrapper}>
                                <label style={labelStyle}>First Name *</label>
                                <input
                                    type="text"
                                    placeholder="Enter first name"
                                    style={inputStyle}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={inputWrapper}>
                                <label style={labelStyle}>Middle Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter middle name (optional)"
                                    style={inputStyle}
                                    onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                                />
                            </div>
                            <div style={inputWrapper}>
                                <label style={labelStyle}>Surname *</label>
                                <input
                                    type="text"
                                    placeholder="Enter surname"
                                    style={inputStyle}
                                    onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={inputWrapper}>
                                <label style={labelStyle}>Gender *</label>
                                <select
                                    style={inputStyle}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    required
                                >
                                    <option value="">Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            </div>
                            <div style={inputWrapper}>
                                <label style={labelStyle}>Age *</label>
                                <input
                                    type="number"
                                    placeholder="Enter age"
                                    style={inputStyle}
                                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={inputWrapper}>
                                <label style={labelStyle}>Phone Number *</label>
                                <input
                                    type="text"
                                    placeholder="080XXXXXXXX"
                                    style={inputStyle}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={inputWrapper}>
                                <label style={labelStyle}>Email Address *</label>
                                <input
                                    type="email"
                                    placeholder="email@example.com"
                                    style={inputStyle}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={inputWrapper}>
                                <label style={labelStyle}>NIN Number *</label>
                                <input
                                    type="text"
                                    placeholder="11-digit NIN"
                                    style={inputStyle}
                                    onChange={(e) => setFormData({ ...formData, nin: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ ...inputWrapper, gridColumn: isMobile ? 'span 1' : 'span 2' }}>
                                <label style={labelStyle}>Residential Address *</label>
                                <textarea
                                    placeholder="Enter your full street address"
                                    style={{ ...inputStyle, borderRadius: '20px', minHeight: '80px', paddingTop: '12px' }}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={inputWrapper}>
                                <label style={labelStyle}>Password *</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        style={inputStyle}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={eyeButtonStyle}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div style={inputWrapper}>
                                <label style={labelStyle}>Confirm Password *</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        style={inputStyle}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        style={eyeButtonStyle}
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                className="btn btn-primary"
                                style={{
                                    gridColumn: isMobile ? 'span 1' : 'span 2',
                                    marginTop: '0.5rem',
                                    height: '50px',
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
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="animate-spin" style={{ margin: '0 auto' }} /> : 'Create Account'}
                            </button>
                        </form>
                    )}

                    <p style={{ marginTop: 'auto', paddingTop: '2rem', textAlign: 'center', color: '#778eaeff', fontSize: '14px' }}>
                        Already have an account? <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '700' }}>Sign in here</Link>
                    </p>
                </div>

                {/* Right side: Cinematic Image */}
                {!isMobile && (
                    <div style={{
                        flex: '1',
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
                                background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.8) 100%)'
                            }} />

                            <div style={{
                                position: 'absolute',
                                bottom: '4rem',
                                left: '2.5rem',
                                right: '2.5rem',
                                color: 'white'
                            }}>
                                <h3 style={{ fontSize: '2.25rem', fontWeight: '800', lineHeight: 1.1, marginBottom: '1.5rem' }}>Start Your Digital Journey.</h3>
                                <p style={{ fontSize: '1rem', lineHeight: 1.6, opacity: 0.9, fontWeight: '400' }}>
                                    "Bringing efficiency and transparency to legal document management through modern innovation."
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

const inputWrapper = { display: 'flex', flexDirection: 'column', gap: '4px' };
const labelStyle = { fontSize: '12px', fontWeight: '600', color: '#778eaeff', marginLeft: '12px' };
const inputStyle = { width: '100%', padding: '12px 20px', borderRadius: '30px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' };
const eyeButtonStyle = { position: 'absolute', right: '18px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' };

export default Register;
