import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, Bell, Shield, Database, Mail, RefreshCw, Lock, CreditCard, ExternalLink, Trash2 } from 'lucide-react';
import api from '../../utils/api';
import { useModal } from '../../context/ModalContext';

const SystemSettings = ({ isMobile }) => {
    const { showModal } = useModal();
    const [settings, setSettings] = useState({
        maintenance_mode: '0',
        allow_new_registrations: '1',
        notification_email: '',
        backup_frequency: 'daily',
        captcha_enabled: '0',
        captcha_site_key: '',
        captcha_secret_key: '',
        paystack_enabled: '0',
        paystack_public_key: '',
        paystack_secret_key: '',
        remita_enabled: '0',
        remita_merchant_id: '',
        remita_service_type_id: '',
        remita_api_key: '',
        court_stamp_path: '',
        oadr_stamp: '',
        probate_stamp: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/settings');
                setSettings(prev => ({ ...prev, ...res.data }));
            } catch (err) {
                console.error('Failed to fetch settings');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleStampUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('stamp', file);
        formData.append('type', type);

        try {
            const res = await api.post('/settings/stamp', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSettings(prev => ({ ...prev, [res.data.key]: res.data.path }));
            showModal({ type: 'success', title: 'Stamp Uploaded', message: `The ${type.toUpperCase()} stamp has been updated.` });
        } catch (err) {
            console.error('Stamp Upload Error:', err);
            showModal({ type: 'error', title: 'Upload Failed', message: 'Failed to upload stamp image.' });
        }
    };

    const handleStampDelete = async (type) => {
        try {
            await api.delete(`/settings/stamp/${type}`);
            let key = 'court_stamp_path';
            if (type === 'oadr') key = 'oadr_stamp';
            else if (type === 'probate') key = 'probate_stamp';

            setSettings(prev => ({ ...prev, [key]: '' }));
            showModal({ type: 'success', title: 'Stamp Removed', message: 'The stamp has been removed from the system.' });
        } catch (err) {
            console.error('Stamp Delete Error:', err);
            showModal({ type: 'error', title: 'Delete Failed', message: 'Failed to remove stamp.' });
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/settings/bulk', { settings });
            showModal({
                type: 'success',
                title: 'Settings Saved',
                message: 'System configuration has been updated successfully.'
            });
        } catch (err) {
            console.error('Error saving settings:', err);
            showModal({
                type: 'error',
                title: 'Save Failed',
                message: err.response?.data?.message || 'Failed to update system settings.'
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Configuration...</div>;

    const SettingCard = ({ icon, title, children }) => (
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card" style={{ background: 'white', marginBottom: '2rem', overflow: 'hidden' }}>
            <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc' }}>
                {icon}
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'rgb\(18 37 74\)' }}>{title}</h3>
            </div>
            <div style={{ padding: '1.5rem' }}>{children}</div>
        </motion.div>
    );

    return (
        <form onSubmit={handleSave} style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0, color: 'rgb\(18 37 74\)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Settings color="#3b82f6" /> System Configuration
                </h2>
                <button
                    type="submit"
                    disabled={saving}
                    style={{ padding: '12px 24px', borderRadius: '12px', background: '#3b82f6', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.4)' }}
                >
                    {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                    Save All Changes
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr', gap: '1.5rem' }}>

                {/* General Section */}
                <SettingCard icon={<Shield size={20} color="#778eaeff" />} title="Security & General">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={sectionStyle}>
                            <div style={{ flex: 1 }}>
                                <h4 style={labelStyle}>Maintenance Mode</h4>
                                <p style={descStyle}>Globally disable access for public users.</p>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={settings.maintenance_mode === '1'}
                                    onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked ? '1' : '0' })}
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>

                        <div style={sectionStyle}>
                            <div style={{ flex: 1 }}>
                                <h4 style={labelStyle}>New User Registration</h4>
                                <p style={descStyle}>Allow public accounts to be created.</p>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={settings.allow_new_registrations === '1'}
                                    onChange={(e) => setSettings({ ...settings, allow_new_registrations: e.target.checked ? '1' : '0' })}
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
                            <div>
                                <label style={labelStyle}><Mail size={16} /> Notification Email</label>
                                <input type="email" value={settings.notification_email} onChange={(e) => setSettings({ ...settings, notification_email: e.target.value })} style={inputStyle} placeholder="system@court.gov.ng" />
                            </div>
                            <div>
                                <label style={labelStyle}><Database size={16} /> Backup Frequency</label>
                                <select value={settings.backup_frequency} onChange={(e) => setSettings({ ...settings, backup_frequency: e.target.value })} style={inputStyle}>
                                    <option value="hourly">Every Hour</option>
                                    <option value="daily">Daily (3 AM)</option>
                                    <option value="weekly">Weekly</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </SettingCard>

                {/* reCAPTCHA Section */}
                <SettingCard icon={<Lock size={20} color="#ef4444" />} title="Google reCAPTCHA">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={sectionStyle}>
                            <div style={{ flex: 1 }}>
                                <h4 style={labelStyle}>Enable reCAPTCHA</h4>
                                <p style={descStyle}>Protect public login from automated attacks.</p>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={settings.captcha_enabled === '1'}
                                    onChange={(e) => setSettings({ ...settings, captcha_enabled: e.target.checked ? '1' : '0' })}
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
                            <div>
                                <label style={labelStyle}>Site Key</label>
                                <input type="text" value={settings.captcha_site_key} onChange={(e) => setSettings({ ...settings, captcha_site_key: e.target.value })} style={inputStyle} placeholder="6L..." />
                            </div>
                            <div>
                                <label style={labelStyle}>Secret Key</label>
                                <input type="password" value={settings.captcha_secret_key} onChange={(e) => setSettings({ ...settings, captcha_secret_key: e.target.value })} style={inputStyle} placeholder="Verification Secret" />
                            </div>
                        </div>
                    </div>
                </SettingCard>

                {/* Payment Gateways */}
                <SettingCard icon={<CreditCard size={20} color="#10b981" />} title="Payment Gateways">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        {/* Paystack */}
                        <div style={{ padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <img src="https://paystack.com/favicon.png" alt="Paystack" style={{ width: '20px' }} />
                                    <h4 style={{ margin: 0, fontSize: '16px' }}>Paystack Integration</h4>
                                </div>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.paystack_enabled === '1'}
                                        onChange={(e) => setSettings({ ...settings, paystack_enabled: e.target.checked ? '1' : '0' })}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={labelStyle}>Public Key</label>
                                    <input type="text" value={settings.paystack_public_key} onChange={(e) => setSettings({ ...settings, paystack_public_key: e.target.value })} style={inputStyle} placeholder="pk_test_..." />
                                </div>
                                <div>
                                    <label style={labelStyle}>Secret Key</label>
                                    <input type="password" value={settings.paystack_secret_key} onChange={(e) => setSettings({ ...settings, paystack_secret_key: e.target.value })} style={inputStyle} placeholder="sk_test_..." />
                                </div>
                            </div>
                        </div>

                        {/* Remita */}
                        <div style={{ padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <CreditCard size={18} color="#e11d48" />
                                    <h4 style={{ margin: 0, fontSize: '16px' }}>Remita (RRR) Integration</h4>
                                </div>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.remita_enabled === '1'}
                                        onChange={(e) => setSettings({ ...settings, remita_enabled: e.target.checked ? '1' : '0' })}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={labelStyle}>Merchant ID</label>
                                    <input type="text" value={settings.remita_merchant_id} onChange={(e) => setSettings({ ...settings, remita_merchant_id: e.target.value })} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Service Type ID</label>
                                    <input type="text" value={settings.remita_service_type_id} onChange={(e) => setSettings({ ...settings, remita_service_type_id: e.target.value })} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>API Key / Hash</label>
                                    <input type="password" value={settings.remita_api_key} onChange={(e) => setSettings({ ...settings, remita_api_key: e.target.value })} style={inputStyle} />
                                </div>
                            </div>
                        </div>
                    </div>
                </SettingCard>

                {/* System Stamps Section */}
                <SettingCard icon={<div style={{ display: 'flex', gap: '5px' }}>
                    <Shield size={20} color="#6366f1" />
                    <Database size={20} color="#8b5cf6" />
                </div>} title="Official System Stamps">
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '1.5rem' }}>

                        {/* Court General Stamp */}
                        <div style={{ padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <h4 style={{ margin: '0 0 1rem', fontSize: '14px', color: 'rgb\(18 37 74\)' }}>Court General Stamp</h4>
                            <div style={{ width: '120px', height: '120px', borderRadius: '12px', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '1rem', background: 'white' }}>
                                {settings.court_stamp_path ? (
                                    <img src={settings.court_stamp_path} alt="Court Stamp" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                ) : (
                                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>No Stamp</span>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                                <label style={{ flex: 1, cursor: 'pointer', background: '#3b82f6', color: 'white', padding: '8px', borderRadius: '8px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                                    Upload
                                    <input type="file" accept="image/*" hidden onChange={(e) => handleStampUpload(e, 'court')} />
                                </label>
                                {settings.court_stamp_path && (
                                    <button
                                        type="button"
                                        onClick={() => handleStampDelete('court')}
                                        style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}
                                    >
                                        <div style={{ width: '16px' }}><Trash2 size={16} /></div>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* OADR Stamp */}
                        <div style={{ padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <h4 style={{ margin: '0 0 1rem', fontSize: '14px', color: 'rgb\(18 37 74\)' }}>OADR / Oath Stamp</h4>
                            <div style={{ width: '120px', height: '120px', borderRadius: '12px', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '1rem', background: 'white' }}>
                                {settings.oadr_stamp ? (
                                    <img src={settings.oadr_stamp} alt="OADR Stamp" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                ) : (
                                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>No Stamp</span>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                                <label style={{ flex: 1, cursor: 'pointer', background: '#6366f1', color: 'white', padding: '8px', borderRadius: '8px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                                    Upload
                                    <input type="file" accept="image/*" hidden onChange={(e) => handleStampUpload(e, 'oadr')} />
                                </label>
                                {settings.oadr_stamp && (
                                    <button
                                        type="button"
                                        onClick={() => handleStampDelete('oadr')}
                                        style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}
                                    >
                                        <div style={{ width: '16px' }}><Trash2 size={16} /></div>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Probate Stamp */}
                        <div style={{ padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <h4 style={{ margin: '0 0 1rem', fontSize: '14px', color: 'rgb\(18 37 74\)' }}>Probate / Registry Stamp</h4>
                            <div style={{ width: '120px', height: '120px', borderRadius: '12px', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '1rem', background: 'white' }}>
                                {settings.probate_stamp ? (
                                    <img src={settings.probate_stamp} alt="Probate Stamp" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                ) : (
                                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>No Stamp</span>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                                <label style={{ flex: 1, cursor: 'pointer', background: '#8b5cf6', color: 'white', padding: '8px', borderRadius: '8px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                                    Upload
                                    <input type="file" accept="image/*" hidden onChange={(e) => handleStampUpload(e, 'probate')} />
                                </label>
                                {settings.probate_stamp && (
                                    <button
                                        type="button"
                                        onClick={() => handleStampDelete('probate')}
                                        style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}
                                    >
                                        <div style={{ width: '16px' }}><Trash2 size={16} /></div>
                                    </button>
                                )}
                            </div>
                        </div>

                    </div>
                </SettingCard>
            </div>
        </form>
    );
};

const sectionStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.25rem',
    background: '#f8fafc',
    borderRadius: '16px',
    gap: '1rem'
};

const labelStyle = {
    margin: '0 0 5px 0',
    fontSize: '14px',
    fontWeight: '700',
    color: 'rgb\(18 37 74\)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
};

const descStyle = {
    margin: 0,
    fontSize: '12.5px',
    color: '#778eaeff'
};

const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    marginTop: '5px',
    fontSize: '13.5px',
    background: 'white'
};

export default SystemSettings;
