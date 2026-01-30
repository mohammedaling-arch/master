import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    User, Lock, CheckCircle, Loader2, Mail, Phone, MapPin,
    Shield, Camera, Upload, Edit3, X
} from 'lucide-react';
import api from '../../utils/api';
import { useModal } from '../../context/ModalContext';
import ImageCapture from '../common/ImageCapture';

const PublicProfile = ({ user: initialUser, isMobile, onUpdate }) => {
    const { showModal } = useModal();
    const [user, setUser] = useState(initialUser);
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({
        first_name: user?.first_name || user?.firstName || '',
        middle_name: user?.middle_name || user?.middleName || '',
        surname: user?.surname || '',
        phone: user?.phone || '',
        address: user?.address || '',
        nin: user?.nin || ''
    });
    const [uploadFiles, setUploadFiles] = useState({ avatar: null, signature: null });
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [submittingProfile, setSubmittingProfile] = useState(false);
    const [submittingPassword, setSubmittingPassword] = useState(false);
    const [showAvatarCapture, setShowAvatarCapture] = useState(false);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSubmittingProfile(true);
        try {
            const formData = new FormData();
            Object.keys(profileData).forEach(key => {
                formData.append(key, profileData[key] || '');
            });
            if (uploadFiles.avatar) formData.append('avatar', uploadFiles.avatar);
            if (uploadFiles.signature) formData.append('signature', uploadFiles.signature);

            const res = await api.put('/public/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const updatedUser = res.data.user;
            setUser(updatedUser);
            if (onUpdate) onUpdate(updatedUser);
            setIsEditing(false);
            setUploadFiles({ avatar: null, signature: null });
            showModal({ type: 'success', title: 'Profile Updated', message: 'Your profile information has been updated successfully.' });
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
            await api.put('/public/change-password', {
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
        <div style={{ color: 'primary' }}>
            <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', margin: '0 0 0.5rem 0' }}>Account Settings</h2>
                    <p style={{ color: '#94a3b8' }}>Update your personal details and manage security</p>
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

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', gap: '2.5rem' }}>
                {/* Profile Information */}
                <div className="glass-card" style={{ background: 'rgb\(18 37 74\)', border: 'none', padding: '2.5rem', borderRadius: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2.5rem' }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{
                                width: '100px',
                                height: '100px',
                                background: '#334155',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                border: '4px solid rgb\(18 37 74\)',
                                boxShadow: '0 0 0 2px #3b82f6'
                            }}>
                                {uploadFiles.avatar ? (
                                    <img src={URL.createObjectURL(uploadFiles.avatar)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar Preview" />
                                ) : user?.profile_pic ? (
                                    <img src={user.profile_pic} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Profile" />
                                ) : (
                                    <User size={50} color="#778eaeff" />
                                )}
                            </div>
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={() => setShowAvatarCapture(true)}
                                    style={{ position: 'absolute', bottom: 0, right: 0, padding: '8px', background: '#3b82f6', borderRadius: '50%', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}
                                >
                                    <Camera size={16} />
                                </button>
                            )}

                            {showAvatarCapture && (
                                <ImageCapture
                                    onClose={() => setShowAvatarCapture(false)}
                                    onImageCaptured={(file) => setUploadFiles({ ...uploadFiles, avatar: file })}
                                    title="Update Profile Picture"
                                />
                            )}
                        </div>
                        <div>
                            <h3 style={{ margin: 0, color: '#94a3b8', fontSize: '1.8rem', textTransform: 'capitalize' }}>{(user?.first_name || user?.firstName)} {(user?.surname || user?.surname)}</h3>
                            <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8' }}>{user?.email}</p>
                            <div style={{
                                display: 'inline-block',
                                padding: '4px 12px',
                                background: 'rgba(59, 130, 246, 0.1)',
                                color: '#3b82f6',
                                borderRadius: '20px',
                                fontSize: '11px',
                                fontWeight: '700',
                                marginTop: '0.75rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                Applicant/Deponent
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleUpdateProfile}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '1.25rem' }}>
                                <div>
                                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>First Name</label>
                                    <input
                                        type="text"
                                        readOnly={!isEditing}
                                        value={profileData.first_name}
                                        onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                                        style={{ width: '100%', padding: '12px', background: isEditing ? '#0f172a' : 'transparent', border: isEditing ? '1px solid #334155' : '1px solid transparent', borderRadius: '10px', color: 'white', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Middle Name</label>
                                    <input
                                        type="text"
                                        readOnly={!isEditing}
                                        value={profileData.middle_name}
                                        onChange={(e) => setProfileData({ ...profileData, middle_name: e.target.value })}
                                        style={{ width: '100%', padding: '12px', background: isEditing ? '#0f172a' : 'transparent', border: isEditing ? '1px solid #334155' : '1px solid transparent', borderRadius: '10px', color: 'white', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Surname</label>
                                    <input
                                        type="text"
                                        readOnly={!isEditing}
                                        value={profileData.surname}
                                        onChange={(e) => setProfileData({ ...profileData, surname: e.target.value })}
                                        style={{ width: '100%', padding: '12px', background: isEditing ? '#0f172a' : 'transparent', border: isEditing ? '1px solid #334155' : '1px solid transparent', borderRadius: '10px', color: 'white', outline: 'none' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Phone Number</label>
                                    <div style={{ position: 'relative' }}>
                                        <Phone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#778eaeff' }} />
                                        <input
                                            type="text"
                                            readOnly={!isEditing}
                                            value={profileData.phone}
                                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                            style={{ width: '100%', padding: '12px 12px 12px 40px', background: isEditing ? '#0f172a' : 'transparent', border: isEditing ? '1px solid #334155' : '1px solid transparent', borderRadius: '10px', color: 'white', outline: 'none' }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>NIN Number</label>
                                    <div style={{ position: 'relative' }}>
                                        <Shield size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#778eaeff' }} />
                                        <input
                                            type="text"
                                            readOnly={!isEditing}
                                            value={profileData.nin}
                                            onChange={(e) => setProfileData({ ...profileData, nin: e.target.value })}
                                            style={{ width: '100%', padding: '12px 12px 12px 40px', background: isEditing ? '#0f172a' : 'transparent', border: isEditing ? '1px solid #334155' : '1px solid transparent', borderRadius: '10px', color: 'white', outline: 'none' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Residential Address</label>
                                <div style={{ position: 'relative' }}>
                                    <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#778eaeff' }} />
                                    <textarea
                                        readOnly={!isEditing}
                                        value={profileData.address}
                                        rows={2}
                                        onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                                        style={{ width: '100%', padding: '12px 12px 12px 40px', background: isEditing ? '#0f172a' : 'transparent', border: isEditing ? '1px solid #334155' : '1px solid transparent', borderRadius: '10px', color: 'white', outline: 'none', resize: 'none' }}
                                    />
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid #334155', paddingTop: '2rem' }}>
                                <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '1rem' }}>Digital Signature (for auto-filling)</label>
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
                                    {uploadFiles.signature ? (
                                        <img src={URL.createObjectURL(uploadFiles.signature)} style={{ maxHeight: '80px', maxWidth: '200px', objectFit: 'contain' }} alt="Preview" />
                                    ) : user?.signature_path ? (
                                        <img src={user.signature_path} style={{ maxHeight: '80px', maxWidth: '200px', objectFit: 'contain' }} alt="Signature" />
                                    ) : (
                                        <Edit3 size={40} color="#334155" />
                                    )}

                                    {isEditing && (
                                        <>
                                            <input
                                                type="file"
                                                id="sig-upload"
                                                style={{ display: 'none' }}
                                                accept="image/*"
                                                onChange={(e) => setUploadFiles({ ...uploadFiles, signature: e.target.files[0] })}
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
                                            setProfileData({
                                                first_name: user.first_name,
                                                middle_name: user.middle_name,
                                                surname: user.surname,
                                                phone: user.phone || '',
                                                address: user.address || '',
                                                nin: user.nin || ''
                                            });
                                            setUploadFiles({ avatar: null, signature: null });
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
                                        {submittingProfile ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />} Save Profile
                                    </button>
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                {/* Change Password */}
                <div className="glass-card" style={{ background: 'rgb\(18 37 74\)', border: 'none', padding: '2.5rem', borderRadius: '24px' }}>
                    <h3 style={{ margin: '0 0 2rem 0', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.4rem' }}>
                        <Lock size={22} color="#f59e0b" /> Change Password
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
                                    marginTop: '1rem',
                                    boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.3)'
                                }}
                            >
                                {submittingPassword ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                                Update Password
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PublicProfile;
