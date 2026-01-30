import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { motion } from 'framer-motion';
import {
    FileText, LogOut, LayoutDashboard, User, Menu, X, ClipboardList, MessageSquare
} from 'lucide-react';
import Header from '../../components/common/Header';
import StaffProfile from '../../components/staff/StaffProfile';
import RegistryAnalytics from '../../components/staff/RegistryAnalytics';
import PRProbateReview from '../../components/staff/PRProbateReview';
import SupportTickets from '../../components/common/SupportTickets';

const PRDashboard = ({ staff: initialStaff }) => {
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
        { icon: <LayoutDashboard size={20} />, label: 'Overview', id: 'dashboard' },
        { icon: <ClipboardList size={20} />, label: 'All Probate Applications', id: 'review' },
        { icon: <FileText size={20} />, label: 'Letter of Administration', id: 'letters' },
        { icon: <MessageSquare size={20} />, label: 'Support', id: 'support' },
        { icon: <User size={20} />, label: 'My Profile', id: 'profile' },
    ];

    const [notifications, setNotifications] = useState([]);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications/staff');
            setNotifications(res.data);
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        }
    };

    const markAsRead = async (notifId) => {
        try {
            await api.put(`/notifications/staff/${notifId}/read`);
            setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: 1 } : n));
        } catch (err) {
            console.error("Error marking read:", err);
        }
    };

    useEffect(() => {
        if (staff?.id) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [staff?.id]);

    if (!staff) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Registrar session...</div>;

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f8fafc', color: '#3d2b1f', position: 'relative' }}>
            {/* Mobile Overlay */}
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
                width: isMobile ? (sidebarOpen ? '260px' : '0') : '260px',
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
                <div style={{ padding: '2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: sidebarOpen ? 'flex-start' : 'center', gap: '1rem' }}>
                    <img src="/assets/logo.png" alt="Logo" style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0 }} />
                    {sidebarOpen && (
                        <div style={{ whiteSpace: 'nowrap', animation: 'fadeIn 0.2s' }}>
                            <h2 style={{ color: 'white', fontSize: '1.2rem', margin: 0 }}>CRMS Probate</h2>
                            <p style={{ margin: 0, fontSize: '9px', color: '#8d6e63', fontWeight: 'bold' }}>BORNO STATE HIGH COURT</p>
                        </div>
                    )}
                </div>

                <nav style={{ flex: 1, overflowY: 'auto', padding: '0 1rem' }}>
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
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <LogOut size={20} />
                        {sidebarOpen && <span style={{ animation: 'fadeIn 0.2s' }}>Logout</span>}
                    </button>
                </div>
            </aside>

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#f8fafc' }}>
                <Header
                    user={staff}
                    title={menus.find(m => m.id === activeTab)?.label || 'Probate Portal'}
                    onLogout={handleLogout}
                    onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
                    onProfileClick={() => setActiveTab('profile')}
                    onSettingsClick={() => setActiveTab('profile')}
                    sidebarOpen={sidebarOpen}
                    notifications={notifications}
                    onNotificationRead={markAsRead}
                    isMobile={isMobile}
                />

                <div style={{ padding: isMobile ? '1rem' : '2.5rem', flex: 1, overflowY: 'auto' }}>
                    {activeTab === 'dashboard' ? (
                        <RegistryAnalytics isMobile={isMobile} role="pr" onViewQueue={() => setActiveTab('review')} />
                    ) : activeTab === 'review' ? (
                        <PRProbateReview isMobile={isMobile} mode="all" title="All Probate Applications" />
                    ) : activeTab === 'letters' ? (
                        <PRProbateReview isMobile={isMobile} mode="letters" title="Letter of Administration" />
                    ) : activeTab === 'support' ? (
                        <SupportTickets user={staff} isMobile={isMobile} isStaff={true} />
                    ) : activeTab === 'profile' ? (
                        <StaffProfile staff={staff} isMobile={isMobile} onUpdate={(updated) => { setStaff(updated); localStorage.setItem('staff', JSON.stringify(updated)); }} />
                    ) : null}
                </div>
            </main>
        </div>
    );
};

export default PRDashboard;

