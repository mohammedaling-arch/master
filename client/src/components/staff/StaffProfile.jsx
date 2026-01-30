import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, CheckCircle, Loader2, Mail, Shield, Building2, Upload, Edit3, X } from 'lucide-react';
import api from '../../utils/api';
import { useModal } from '../../context/ModalContext';

const StaffProfile = ({ staff: initialStaff, isMobile, onUpdate }) => {
    const { showModal } = useModal();
    const [staff, setStaff] = useState(initialStaff);
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({
        name: staff?.name || '',
        division: staff?.division || '',
        email: staff?.email || ''
    });
    const [signatureFile, setSignatureFile] = useState(null);
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [submittingProfile, setSubmittingProfile] = useState(false);
    const [submittingPassword, setSubmittingPassword] = useState(false);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSubmittingProfile(true);
        try {
            const formData = new FormData();
            formData.append('name', profileData.name);
            formData.append('division', profileData.division);
            if (signatureFile) {
                formData.append('signature', signatureFile);
            }

            const res = await api.put('/staff/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const updatedStaff = res.data.user;
            setStaff(updatedStaff);
            if (onUpdate) onUpdate(updatedStaff);
            setIsEditing(false);
            showModal({ type: 'success', title: 'Profile Updated', message: 'Your profile information has been updated.' });
        } catch (error) {
            showModal({
                type: 'error',
                title: 'Update Failed',
                message: error.response?.data?.error || 'Failed to update profile.'
            });
        } finally {
            setSubmittingProfile(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            return showModal({ type: 'error', title: 'Error', message: 'New passwords do not match' });
        }

        setSubmittingPassword(true);
        try {
            await api.put('/staff/change-password', {
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword
            });
            showModal({ type: 'success', title: 'Success', message: 'Password changed successfully' });
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            showModal({
                type: 'error',
                title: 'Failed',
                message: error.response?.data?.error || 'Failed to change password'
            });
        } finally {
            setSubmittingPassword(false);
        }
    };

    return (
        <div style={{ color: 'rgb\(18 37 74\)' }}>
            <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', margin: '0 0 0.5rem 0' }}>Security & Profile</h2>
                    <p style={{ color: '#94a3b8' }}>Manage your account settings and personal information</p>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '10px 20px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}
                    >
                        <Edit3 size={18} /> Edit Profile
                    </button>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr', gap: '2.5rem' }}>
                {/* Profile Information */}
                <div className="glass-card" style={{ background: 'rgb\(18 37 74\)', border: 'none', padding: '2.5rem', borderRadius: '24px', color: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2.5rem' }}>
                        <div style={{
                            width: '100px',
                            height: '100px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            borderRadius: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2.5rem',
                            fontWeight: 'bold',
                            boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)'
                        }}>
                            {staff?.name?.[0]}
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.8rem', textTransform: 'capitalize' }}>{staff?.name}</h3>
                            <div style={{
                                display: 'inline-block',
                                padding: '6px 16px',
                                background: 'rgba(16, 185, 129, 0.1)',
                                color: '#10b981',
                                borderRadius: '20px',
                                fontSize: '13px',
                                fontWeight: '700',
                                marginTop: '0.75rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                {staff?.role_display_name || staff?.role}
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleUpdateProfile}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Full Name</label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#778eaeff' }} />
                                        <input
                                            type="text"
                                            readOnly={true}
                                            value={profileData.name}
                                            style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'transparent', border: '1px solid transparent', borderRadius: '10px', color: '#778eaeff', outline: 'none' }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Division / Office</label>
                                    <div style={{ position: 'relative' }}>
                                        <Building2 size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#778eaeff' }} />
                                        <input
                                            type="text"
                                            readOnly={true}
                                            value={profileData.division}
                                            placeholder="Not specified"
                                            style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'transparent', border: '1px solid transparent', borderRadius: '10px', color: '#778eaeff', outline: 'none' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Email Address</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#778eaeff' }} />
                                    <input
                                        type="email"
                                        readOnly
                                        value={profileData.email}
                                        style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'transparent', border: '1px solid transparent', borderRadius: '10px', color: '#778eaeff', outline: 'none' }}
                                    />
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid #334155', paddingTop: '2rem' }}>
                                <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '1rem' }}>Digital Signature</label>
                                <div style={{
                                    border: '2px dashed #334155',
                                    padding: '1.5rem',
                                    borderRadius: '16px',
                                    background: isEditing ? 'rgba(30, 41, 59, 0.5)' : '#0f172a',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    position: 'relative'
                                }}>
                                    {signatureFile ? (
                                        <img src={URL.createObjectURL(signatureFile)} style={{ maxHeight: '80px', maxWidth: '200px', objectFit: 'contain' }} alt="Preview" />
                                    ) : staff?.signature_path ? (
                                        <img src={`${api.defaults.baseURL.replace('/api', '')}${staff.signature_path}`} style={{ maxHeight: '80px', maxWidth: '200px', objectFit: 'contain' }} alt="Signature" />
                                    ) : (
                                        <Shield size={40} color="#334155" />
                                    )}

                                    {isEditing && (
                                        <>
                                            <input
                                                type="file"
                                                id="sig-upload"
                                                style={{ display: 'none' }}
                                                accept="image/*"
                                                onChange={(e) => setSignatureFile(e.target.files[0])}
                                            />
                                            <label htmlFor="sig-upload" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '8px 16px', background: '#334155', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: 'white' }}>
                                                <Upload size={16} /> Choose Signature Image
                                            </label>
                                        </>
                                    )}
                                </div>
                            </div>

                            {isEditing && (
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setProfileData({ name: staff.name, division: staff.division || '', email: staff.email });
                                            setSignatureFile(null);
                                        }}
                                        style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingProfile}
                                        style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', color: 'white', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                    >
                                        {submittingProfile ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />} Save Changes
                                    </button>
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                {/* Change Password */}
                <div className="glass-card" style={{ background: 'rgb\(18 37 74\)', border: 'none', padding: '2.5rem', borderRadius: '24px', color: 'white' }}>
                    <h3 style={{ margin: '0 0 2rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.4rem' }}>
                        <Lock size={22} color="#f59e0b" /> Security & Password
                    </h3>
                    <form onSubmit={handleChangePassword}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Current Password</label>
                                <input
                                    type="password"
                                    required
                                    value={passwords.currentPassword}
                                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                                    style={{ width: '100%', padding: '14px', background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: 'white' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>New Password</label>
                                <input
                                    type="password"
                                    required
                                    value={passwords.newPassword}
                                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                    style={{ width: '100%', padding: '14px', background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: 'white' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Confirm New Password</label>
                                <input
                                    type="password"
                                    required
                                    value={passwords.confirmPassword}
                                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                    style={{ width: '100%', padding: '14px', background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: 'white' }}
                                />
                            </div>

                            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '12px' }}>
                                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: '1.5' }}>
                                    <strong style={{ color: '#f59e0b' }}>Security Tip:</strong> Use a combination of letters, numbers, and symbols to create a strong password. Avoid using easily guessable information.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={submittingPassword}
                                style={{
                                    padding: '16px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                    border: 'none',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.75rem',
                                    boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.3)'
                                }}
                            >
                                {submittingPassword ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                                Update Password Settings
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default StaffProfile;
