import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, FileText, Users, CreditCard, User, MessageSquare
} from 'lucide-react';
import ProbateApplicationsList from '../../components/probate/ProbateApplicationsList';
import ProbateApplication from '../../components/probate/ProbateApplication';
import Header from '../../components/common/Header';
import PaymentReceipts from '../../components/common/PaymentReceipts';
import PublicProfile from '../../components/public/PublicProfile';
import PublicAnalytics from '../../components/public/PublicAnalytics';
import ProbateApplicationDetails from '../../components/probate/ProbateApplicationDetails';
import SupportTickets from '../../components/common/SupportTickets';

const ProbateDashboard = ({ user }) => {
    const [view, setView] = useState('overview');
    const [selectedAppId, setSelectedAppId] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

    const [notifications, setNotifications] = useState([]);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications/public');
            setNotifications(res.data);
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/public/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
        } catch (err) {
            console.error("Failed to mark as read:", err);
        }
    };

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
        if (user?.id) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user?.id]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    const menuItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Overview', id: 'overview' },
        { icon: <FileText size={20} />, label: 'New Application', id: 'new' },
        { icon: <FileText size={20} />, label: 'My Applications', id: 'applications' },
        { icon: <FileText size={20} />, label: 'Letter of Administration', id: 'letters' },
        { icon: <CreditCard size={20} />, label: 'Payments', id: 'payments' },
        { icon: <MessageSquare size={20} />, label: 'Support', id: 'support' },
        { icon: <User size={20} />, label: 'My Profile', id: 'profile' },
    ];

    if (!user) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading session...</div>;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', position: 'relative' }}>
            {/* Mobile Overlay */}
            {isMobile && sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
                />
            )}

            {/* Sidebar */}
            <aside style={{
                width: sidebarOpen ? '260px' : (isMobile ? '0' : '80px'),
                background: '#3d2b1f',
                color: 'white',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                position: isMobile ? 'fixed' : 'relative',
                height: '100vh',
                zIndex: 50,
                overflow: 'hidden'
            }}>
                <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <img src="/assets/logo.png" alt="Logo" style={{ width: '60px', height: '60px', borderRadius: '50%' }} />
                    {(sidebarOpen || (isMobile && sidebarOpen)) && (
                        <div style={{ textAlign: 'center', overflow: 'hidden' }}>
                            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Probate</h2>
                            <p style={{ margin: 0, fontSize: '9px', color: '#8d6e63', fontWeight: 'bold' }}>BORNO STATE HIGH COURT</p>
                        </div>
                    )}
                </div>
                <nav style={{ flex: 1, padding: '1rem' }}>
                    {menuItems.map(item => (
                        <div key={item.id}
                            onClick={() => {
                                setView(item.id);
                                setSelectedAppId(null);
                                if (isMobile) setSidebarOpen(false);
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '1rem',
                                cursor: 'pointer',
                                borderRadius: '8px',
                                gap: '1rem',
                                marginBottom: '0.5rem',
                                transition: 'background 0.2s',
                                backgroundColor: view === item.id ? '#5d4037' : 'transparent',
                                color: view === item.id ? '#2ecc71' : '#8d6e63',
                                justifyContent: sidebarOpen ? 'flex-start' : 'center'
                            }}>
                            {item.icon}
                            {sidebarOpen && <span>{item.label}</span>}
                        </div>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>
                <Header
                    user={user}
                    title={view === 'overview' ? 'Probate Overview' : 'Probate Registry'}
                    onLogout={handleLogout}
                    onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
                    onProfileClick={() => setView('profile')}
                    onSettingsClick={() => setView('profile')}
                    sidebarOpen={sidebarOpen}
                    isMobile={isMobile}
                    notifications={notifications}
                    onNotificationRead={markAsRead}
                />

                <div style={{ padding: isMobile ? '1rem' : '2rem' }}>
                    <h1 style={{ marginBottom: '2rem', fontSize: isMobile ? '1.5rem' : '2rem' }}>
                        {view === 'overview' ? 'Probate Overview' :
                            view === 'letters' ? 'Letter of Administration' : 'Probate Registry'}
                    </h1>

                    {selectedAppId ? (
                        <ProbateApplicationDetails
                            applicationId={selectedAppId}
                            onBack={() => setSelectedAppId(null)}
                            isMobile={isMobile}
                            user={user}
                        />
                    ) : view === 'overview' ? (
                        <PublicAnalytics isMobile={isMobile} setView={setView} module="probate" />
                    ) : view === 'new' ? (
                        <ProbateApplication user={user} isMobile={isMobile} />
                    ) : view === 'applications' ? (
                        <ProbateApplicationsList
                            user={user}
                            isMobile={isMobile}
                            onSelect={(id) => setSelectedAppId(id)}
                        />
                    ) : view === 'letters' ? (
                        <ProbateApplicationsList
                            user={user}
                            isMobile={isMobile}
                            onSelect={(id) => setSelectedAppId(id)}
                            filterStatus="approved"
                            title="Approved Letters of Administration"
                        />
                    ) : view === 'payments' ? (
                        <PaymentReceipts user={user} isMobile={isMobile} />
                    ) : view === 'support' ? (
                        <SupportTickets user={user} isMobile={isMobile} isStaff={false} />
                    ) : view === 'profile' ? (
                        <PublicProfile
                            user={user}
                            isMobile={isMobile}
                            onUpdate={(updated) => {
                                localStorage.setItem('user', JSON.stringify(updated));
                            }}
                        />
                    ) : (
                        <div className="glass-card" style={{ background: 'white', padding: isMobile ? '1.5rem' : '2rem' }}>Module Section: {view} Under construction</div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ProbateDashboard;
