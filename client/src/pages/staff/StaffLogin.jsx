import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { motion } from 'framer-motion';
import { ShieldAlert, Mail, Lock, Loader2, Key, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useModal } from '../../context/ModalContext';
import { GlassSpinner } from '../../components/common/LoadingOverlay';
import { AnimatePresence } from 'framer-motion';

const StaffLogin = ({ setStaff }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { showModal } = useModal();
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const passwordRef = React.useRef('');

    const [showChangePassword, setShowChangePassword] = useState(false);
    const [tempToken, setTempToken] = useState('');
    const [tempStaffData, setTempStaffData] = useState(null);
    const [newPassData, setNewPassData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [lastVerifiedPassword, setLastVerifiedPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);
    const [showPass, setShowPass] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/staff/login', { email, password });
            const { token, forcePasswordChange, user: staffData } = res.data;

            if (forcePasswordChange) {
                setTempToken(token);
                setTempStaffData(staffData);
                setLastVerifiedPassword(password); // Capture the password immediately
                setShowChangePassword(true);
                return;
            }

            finalizeLogin(staffData, token);
        } catch (err) {
            console.error('Staff login error:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Login failed';
            showModal({
                type: 'error',
                title: 'Access Denied',
                message: errorMsg
            });
        } finally {
            setLoading(false);
        }
    };

    const finalizeLogin = (staffData, token) => {
        setStaff(staffData);
        localStorage.setItem('staffToken', token);
        localStorage.setItem('staff', JSON.stringify(staffData));
        const targetPath = `/staff/${(staffData.role === 'registrar' || staffData.role === 'pr') ? 'pr' : staffData.role}`;
        navigate(targetPath);
    };

    const handlePasswordChangeSubmit = async (e) => {
        e.preventDefault();
        if (newPassData.newPassword !== newPassData.confirmPassword) {
            showModal({ type: 'error', title: 'Mismatch', message: 'Passwords do not match.' });
            return;
        }

        if (newPassData.newPassword.length < 6) {
            showModal({ type: 'error', title: 'Weak Password', message: 'Password must be at least 6 characters.' });
            return;
        }

        setChangingPassword(true);
        try {
            // Use the captured password directly from our ref to ensure it hasn't been cleared/modified
            await api.put('/staff/change-password', {
                currentPassword: passwordRef.current,
                newPassword: newPassData.newPassword
            }, {
                headers: { Authorization: `Bearer ${tempToken}` }
            });

            showModal({
                type: 'success',
                title: 'Password Updated',
                message: 'Your password has been set. Welcome to the portal.'
            });

            finalizeLogin(tempStaffData, tempToken);
        } catch (err) {
            showModal({
                type: 'error',
                title: 'Update Failed',
                message: err.response?.data?.error || 'Failed to update password.'
            });
        } finally {
            setChangingPassword(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: '#3d2b1f',
            padding: '1.5rem',
            position: 'relative'
        }}>
            {loading && <GlassSpinner message="Authorizing Access..." />}
            {/* Background pattern */}
            <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'radial-gradient(#5d4037 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    width: '100%',
                    maxWidth: '1000px',
                    minHeight: isMobile ? 'auto' : '600px',
                    background: 'white',
                    borderRadius: isMobile ? '24px' : '40px',
                    overflow: 'hidden',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                    zIndex: 10
                }}
            >
                {/* Left Side: Form */}
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
                            <p style={{ margin: 0, color: '#ef4444', fontSize: '9px', fontWeight: 'bold', letterSpacing: '1px' }}>STAFF PORTAL ACCESS</p>
                        </div>
                    </div>

                    <h1 style={{ color: 'rgb\(18 37 74\)', fontSize: '1.75rem', marginBottom: '0.4rem', fontWeight: '800' }}>Personnel Login</h1>
                    <p style={{ color: '#778eaeff', marginBottom: '2.5rem', fontSize: '14px' }}>Secure internal access for judicial officers.</p>

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Official Email</label>
                            <input
                                type="email"
                                placeholder="name@crms.gov.ng"
                                style={{ width: '100%', padding: '14px 20px', borderRadius: '30px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '14px' }}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Secret Key</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                style={{ width: '100%', padding: '14px 20px', borderRadius: '30px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '14px' }}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    passwordRef.current = e.target.value;
                                }}
                                required
                                autoComplete="current-password"
                            />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '1rem', background: '#fff7ed', borderRadius: '12px', border: '1px solid #ffedd5' }}>
                            <ShieldAlert size={18} color="#f97316" />
                            <p style={{ margin: 0, fontSize: '11px', color: '#9a3412', lineHeight: '1.4' }}>Authorized access only. Security logs active.</p>
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{
                                height: '54px',
                                borderRadius: '30px',
                                background: 'rgb\(18 37 74\)',
                                color: 'white',
                                fontWeight: '700',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin" style={{ margin: '0 auto' }} /> : 'Authorize & Enter'}
                        </button>
                    </form>

                    <div style={{ marginTop: 'auto', paddingTop: '2rem', textAlign: 'center' }}>
                        <p style={{ fontSize: '11px', color: '#94a3b8' }}>Borno State Judiciary Management System v4.0.2</p>
                    </div>
                </div>

                {/* Right Side: Cinematic Image Overlay */}
                {!isMobile && (
                    <div style={{
                        flex: '1.2',
                        padding: '1.25rem',
                        background: '#020617'
                    }}>
                        <div style={{
                            height: '100%',
                            width: '100%',
                            borderRadius: '30px',
                            overflow: 'hidden',
                            position: 'relative'
                        }}>
                            <img
                                src="/assets/gavel.png"
                                alt="Judiciary"
                                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5, filter: 'grayscale(40%)' }}
                            />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(2,6,23,0.9), transparent)' }} />

                            <div style={{
                                position: 'absolute',
                                bottom: '3rem',
                                left: '2.5rem',
                                right: '2.5rem',
                                color: 'white'
                            }}>
                                <h3 style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: 1.1, marginBottom: '1.5rem' }}>Registry Integrity & Efficiency.</h3>
                                <p style={{ fontSize: '1rem', lineHeight: 1.6, opacity: 0.8 }}>
                                    "The foundations of justice are maintained through precise management and absolute transparency."
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
            {/* Change Password Modal for forced reset */}
            <AnimatePresence>
                {showChangePassword && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.85)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                            padding: '1.5rem',
                            backdropFilter: 'blur(10px)'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            style={{
                                background: 'white',
                                borderRadius: '24px',
                                padding: isMobile ? '2rem' : '3.5rem',
                                maxWidth: '500px',
                                width: '100%',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                            }}
                        >
                            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '20px',
                                    background: '#eff6ff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 1.5rem',
                                    color: '#3b82f6'
                                }}>
                                    <Key size={32} />
                                </div>
                                <h2 style={{ color: 'rgb\(18 37 74\)', margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: '800' }}>Initial Setup</h2>
                                <p style={{ color: '#778eaeff', fontSize: '14px', margin: 0 }}>
                                    You are logging in with a temporary password. Please set a new secure password to proceed.
                                </p>
                            </div>

                            <form onSubmit={handlePasswordChangeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>New Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showPass ? 'text' : 'password'}
                                            required
                                            value={newPassData.newPassword}
                                            onChange={(e) => setNewPassData({ ...newPassData, newPassword: e.target.value })}
                                            style={{ width: '100%', padding: '14px 20px', borderRadius: '30px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '14px' }}
                                            placeholder="Min 6 characters"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPass(!showPass)}
                                            style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                                        >
                                            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Confirm Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={newPassData.confirmPassword}
                                        onChange={(e) => setNewPassData({ ...newPassData, confirmPassword: e.target.value })}
                                        style={{ width: '100%', padding: '14px 20px', borderRadius: '30px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '14px' }}
                                        placeholder="Confirm new password"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={changingPassword}
                                    style={{
                                        width: '100%',
                                        height: '54px',
                                        borderRadius: '30px',
                                        background: 'rgb\(18 37 74\)',
                                        color: 'white',
                                        fontWeight: '700',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.75rem',
                                        marginTop: '1rem'
                                    }}
                                >
                                    {changingPassword ? (
                                        <Loader2 className="animate-spin" />
                                    ) : (
                                        <>
                                            <CheckCircle size={20} />
                                            Update & Portal Access
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setShowChangePassword(false)}
                                    style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '14px', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StaffLogin;
