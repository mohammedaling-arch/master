import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { motion } from 'framer-motion';
import {
    Users, Shield, Landmark, CreditCard, UserCheck,
    Bell, LogOut, Settings, List, FileText, Image as ImageIcon,
    LayoutDashboard, User, Menu, X, MessageSquare
} from 'lucide-react';
import StaffManager from '../../components/staff/StaffManager';
import RoleManager from '../../components/staff/RoleManager';
import UserManager from '../../components/staff/UserManager';
import BannerManager from '../../components/staff/BannerManager';
import TemplateManager from '../../components/staff/TemplateManager';
import ProbateDocumentManager from '../../components/staff/ProbateDocumentManager';
import StaffProfile from '../../components/staff/StaffProfile';
import AdminAnalytics from '../../components/staff/AdminAnalytics';
import ActivityLogs from '../../components/staff/ActivityLogs';
import SystemSettings from '../../components/staff/SystemSettings';
import Header from '../../components/common/Header';
import SupportTickets from '../../components/common/SupportTickets';

const AdminDashboard = ({ staff: initialStaff }) => {
    const [staff, setStaff] = useState(initialStaff);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 1024;
            setIsMobile(mobile);
            if (mobile) setSidebarOpen(false);
            else setSidebarOpen(true);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchLatestStaff = async () => {
            try {
                const res = await api.get('/staff/profile');
                setStaff(res.data);
                localStorage.setItem('staff', JSON.stringify(res.data));
            } catch (err) {
                console.error("Failed to refresh staff info:", err);
            }
        };
        if (initialStaff?.id) fetchLatestStaff();
    }, [initialStaff?.id]);

    const handleLogout = () => {
        localStorage.removeItem('staffToken');
        localStorage.removeItem('staff');
        window.location.href = '/staff/login';
    };

    const menus = [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', id: 'dashboard' },
        { icon: <Shield size={20} />, label: 'Staff Management', id: 'staff' },
        { icon: <UserCheck size={20} />, label: 'Role Management', id: 'roles' },
        { icon: <Users size={20} />, label: 'User Management', id: 'users' },
        { icon: <FileText size={20} />, label: 'Template Management', id: 'templates' },
        { icon: <FileText size={20} />, label: 'Probate Documents', id: 'probate_docs' },
        { icon: <Settings size={20} />, label: 'System Settings', id: 'settings' },
        { icon: <List size={20} />, label: 'Activity Logs', id: 'logs' },
        { icon: <CreditCard size={20} />, label: 'Payment Gateway', id: 'payments' },
        { icon: <ImageIcon size={20} />, label: 'Banner Management', id: 'banners' },
        { icon: <MessageSquare size={20} />, label: 'Support Tickets', id: 'support' },
        { icon: <User size={20} />, label: 'My Profile', id: 'profile' },
    ];

    const [notifications, setNotifications] = useState([]);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications/staff');
            // Header component uses title, message, created_at, is_read
            setNotifications(res.data);
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every minute
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleNotificationRead = async (id) => {
        try {
            await api.put(`/notifications/staff/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
        } catch (err) {
            console.error("Failed to mark notification as read:", err);
        }
    };

    if (!staff) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading admin session...</div>;

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f8fafc', color: '#3d2b1f' }}>
            {/* Overlay for mobile sidebar */}
            {isMobile && sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 40,
                        backdropFilter: 'blur(4px)'
                    }}
                />
            )}

            <aside style={{
                width: sidebarOpen ? '260px' : (isMobile ? '0' : '80px'),
                background: '#3d2b1f',
                padding: '0',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                position: isMobile ? 'fixed' : 'relative',
                height: '100vh',
                zIndex: 50,
                boxShadow: isMobile && sidebarOpen ? '10px 0 30px rgba(0,0,0,0.2)' : 'none'
            }}>
                <div style={{ padding: '2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: sidebarOpen ? 'space-between' : 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <img src="/assets/logo.png" alt="Logo" style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0 }} />
                        {sidebarOpen && (
                            <div style={{ whiteSpace: 'nowrap', animation: 'fadeIn 0.2s' }}>
                                <h2 style={{ color: 'white', fontSize: '1.2rem', margin: 0 }}>CRMS Admin</h2>
                                <p style={{ margin: 0, fontSize: '9px', color: '#8d6e63', fontWeight: 'bold' }}>BORNO STATE HIGH COURT</p>
                            </div>
                        )}
                    </div>
                    {isMobile && sidebarOpen && (
                        <button
                            onClick={() => setSidebarOpen(false)}
                            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
                        >
                            <X size={24} />
                        </button>
                    )}
                </div>

                <nav style={{ flex: 1, padding: '0 1rem', overflowY: 'auto' }}>
                    {menus.map(menu => (
                        <div
                            key={menu.id}
                            onClick={() => {
                                setActiveTab(menu.id);
                                if (isMobile) setSidebarOpen(false);
                            }}
                            title={!sidebarOpen ? menu.label : ''}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                                gap: '1rem',
                                padding: '1rem',
                                cursor: 'pointer',
                                borderRadius: '12px',
                                background: activeTab === menu.id ? '#5d4037' : 'transparent',
                                color: activeTab === menu.id ? '#2ecc71' : '#8d6e63',
                                marginBottom: '0.5rem',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {menu.icon}
                            {sidebarOpen && <span style={{ animation: 'fadeIn 0.2s' }}>{menu.label}</span>}
                        </div>
                    ))}
                </nav>

                <div style={{ padding: '1rem' }}>
                    <button
                        onClick={handleLogout}
                        title={!sidebarOpen ? 'Logout' : ''}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: sidebarOpen ? 'flex-start' : 'center',
                            gap: '1rem',
                            padding: '1rem',
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            borderRadius: '12px',
                            transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <LogOut size={20} />
                        {sidebarOpen && <span style={{ animation: 'fadeIn 0.2s' }}>Logout</span>}
                    </button>
                </div>
            </aside>

            <main style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                overflowY: 'auto',
                width: '100%'
            }}>
                <Header
                    user={staff}
                    title={menus.find(m => m.id === activeTab)?.label || 'Admin Overview'}
                    onLogout={handleLogout}
                    onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
                    onProfileClick={() => setActiveTab('profile')}
                    onSettingsClick={() => setActiveTab('settings')}
                    sidebarOpen={sidebarOpen}
                    isMobile={isMobile}
                    notifications={notifications}
                    onNotificationRead={handleNotificationRead}
                />

                <div style={{ padding: isMobile ? '1rem' : '2.5rem' }}>
                    {activeTab === 'dashboard' ? (
                        <AdminAnalytics isMobile={isMobile} />
                    ) : activeTab === 'staff' ? (
                        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                            <StaffManager isMobile={isMobile} />
                        </div>
                    ) : activeTab === 'roles' ? (
                        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                            <RoleManager isMobile={isMobile} />
                        </div>
                    ) : activeTab === 'users' ? (
                        <UserManager isMobile={isMobile} />
                    ) : activeTab === 'templates' ? (
                        <TemplateManager isMobile={isMobile} />
                    ) : activeTab === 'probate_docs' ? (
                        <ProbateDocumentManager isMobile={isMobile} />
                    ) : activeTab === 'banners' ? (
                        <BannerManager isMobile={isMobile} />
                    ) : activeTab === 'profile' ? (
                        <StaffProfile staff={staff} isMobile={isMobile} onUpdate={(updated) => { setStaff(updated); localStorage.setItem('staff', JSON.stringify(updated)); }} />
                    ) : activeTab === 'logs' ? (
                        <ActivityLogs isMobile={isMobile} />
                    ) : activeTab === 'settings' ? (
                        <SystemSettings isMobile={isMobile} />
                    ) : activeTab === 'support' ? (
                        <SupportTickets user={staff} isMobile={isMobile} isStaff={true} />
                    ) : (
                        <div className="glass-card" style={{ background: 'rgb\(18 37 74\)', border: 'none', color: 'white', padding: '2rem' }}>
                            <h2 style={{ marginBottom: '1rem' }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
                            <p style={{ color: '#94a3b8' }}>Module view for "{activeTab}" is currently being implemented.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
