import React, { useState, useEffect } from 'react';
import { formatDate } from '../../utils/dateUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Bell, Mail, ChevronDown, Clock, Calendar,
    Menu, X, User, Settings, LogOut, ArrowLeftRight
} from 'lucide-react';

const Header = ({
    user,
    title,
    onLogout,
    onSidebarToggle,
    onProfileClick,
    onSettingsClick,
    sidebarOpen,
    isMobile,
    notifications = [],
    onNotificationRead
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const isProbate = location.pathname.startsWith('/probate');
    const isOADR = location.pathname.startsWith('/oadr');
    const canSwitch = isProbate || isOADR;

    const handleSwitchModule = () => {
        if (isProbate) navigate('/oadr');
        else navigate('/probate');
    };

    return (
        <header style={{
            minHeight: '80px',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.5rem',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            position: 'sticky',
            top: 0,
            zIndex: 30,
            borderBottom: '1px solid #f1f5f9'
        }}>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                {onSidebarToggle && (
                    <button
                        onClick={onSidebarToggle}
                        style={{
                            background: '#f1f5f9',
                            border: 'none',
                            padding: '0.6rem',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#778eaeff'
                        }}
                    >
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                )}

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h1 style={{ margin: 0, fontSize: isMobile ? '1.1rem' : '1.4rem', color: 'rgb\(18 37 74\)', fontWeight: '700' }}>
                        {title}
                    </h1>
                    {!isMobile && (
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '11px' }}>
                                <Calendar size={12} />
                                <span>{formatDate(currentTime).split(' ')[0]}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '11px' }}>
                                <Clock size={12} />
                                <span>{formatDate(currentTime).split(' ')[1]}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {!isMobile && user?.email && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.5rem 1.25rem',
                        background: '#f8fafc',
                        borderRadius: '30px',
                        border: '1px solid #f1f5f9'
                    }}>
                        <Mail size={14} color="#3b82f6" />
                        <span style={{ fontSize: '13px', color: '#778eaeff', fontWeight: '600' }}>{user.email}</span>
                    </div>
                )}

                {/* Module Switcher */}
                {canSwitch && (
                    <button
                        onClick={handleSwitchModule}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            padding: '0.5rem 1rem',
                            background: isProbate ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            color: 'white',
                            borderRadius: '10px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <ArrowLeftRight size={14} />
                        {!isMobile && (isProbate ? 'Switch to OADR Portal' : 'Switch to Probate Portal')}
                    </button>
                )}

                {/* Notifications */}
                <div style={{ position: 'relative' }}>
                    <div
                        onClick={() => setShowNotifications(!showNotifications)}
                        style={{ position: 'relative', cursor: 'pointer', padding: '0.6rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}
                    >
                        <Bell size={20} color="#778eaeff" />
                        {notifications.filter(n => !n.is_read).length > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: '-4px',
                                right: '-4px',
                                background: '#ef4444',
                                color: 'white',
                                fontSize: '10px',
                                padding: '2px 5px',
                                borderRadius: '10px',
                                border: '2px solid white',
                                minWidth: '18px',
                                textAlign: 'center'
                            }}>{notifications.filter(n => !n.is_read).length}</span>
                        )}
                    </div>

                    <AnimatePresence>
                        {showNotifications && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    marginTop: '0.75rem',
                                    width: '320px',
                                    background: 'white',
                                    borderRadius: '16px',
                                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                                    border: '1px solid #f1f5f9',
                                    overflow: 'hidden',
                                    zIndex: 60
                                }}
                            >
                                <div style={{ padding: '1rem', fontWeight: '700', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                                    <span style={{ color: 'rgb\(18 37 74\)' }}>Notifications</span>
                                    <span
                                        onClick={() => notifications.forEach(n => !n.is_read && onNotificationRead && onNotificationRead(n.id))}
                                        style={{ color: '#3b82f6', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
                                    >Mark all read</span>
                                </div>
                                <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                    {notifications.length > 0 ? notifications.map(n => (
                                        <div
                                            key={n.id}
                                            onClick={() => {
                                                if (!n.is_read && onNotificationRead) onNotificationRead(n.id);
                                            }}
                                            style={{
                                                padding: '1rem',
                                                borderBottom: '1px solid #f8fafc',
                                                cursor: 'pointer',
                                                background: n.is_read ? 'transparent' : '#f0f7ff',
                                                position: 'relative'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.background = n.is_read ? '#f8fafc' : '#e6f2ff'}
                                            onMouseOut={(e) => e.currentTarget.style.background = n.is_read ? 'transparent' : '#f0f7ff'}
                                        >
                                            {!n.is_read && (
                                                <div style={{ position: 'absolute', top: '16px', right: '16px', width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></div>
                                            )}
                                            <p style={{ margin: 0, fontSize: '14px', color: 'rgb\(18 37 74\)', fontWeight: '600', paddingRight: '15px' }}>{n.title}</p>
                                            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#778eaeff', lineHeight: '1.4' }}>{n.message}</p>
                                            <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#94a3b8' }}>
                                                {new Date(n.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    )) : (
                                        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                            <Bell size={32} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                                            <p style={{ margin: 0, fontSize: '14px' }}>No new notifications</p>
                                        </div>
                                    )}
                                </div>
                                {notifications.length > 0 && (
                                    <div style={{ padding: '0.8rem', textAlign: 'center', fontSize: '13px', color: '#3b82f6', cursor: 'pointer', borderTop: '1px solid #f1f5f9', fontWeight: '600', background: '#f8fafc' }}>
                                        Check all updates
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* User Account */}
                <div style={{ position: 'relative' }}>
                    <div
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.4rem 0.6rem',
                            background: '#f1f5f9',
                            borderRadius: '35px',
                            cursor: 'pointer',
                            border: '1px solid #e2e8f0',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{
                            width: '32px',
                            height: '32px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            borderRadius: '50%',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '13px',
                            boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
                            overflow: 'hidden'
                        }}>
                            {user?.profile_pic ? (
                                <img
                                    src={user.profile_pic}
                                    alt="Profile"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.innerText = (user?.firstName || user?.first_name || user?.name || '?').charAt(0).toUpperCase();
                                    }}
                                />
                            ) : (
                                (user?.firstName || user?.first_name || user?.name || '?').charAt(0).toUpperCase()
                            )}
                        </div>
                        {!isMobile && <span style={{ fontWeight: '600', color: 'rgb\(18 37 74\)', fontSize: '14px', textTransform: 'uppercase' }}>{user?.firstName || user?.first_name || user?.name}</span>}
                        <ChevronDown size={14} color="#778eaeff" style={{ transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                    </div>

                    <AnimatePresence>
                        {showUserMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    marginTop: '0.75rem',
                                    width: '220px',
                                    background: 'white',
                                    borderRadius: '16px',
                                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                                    border: '1px solid #f1f5f9',
                                    padding: '0.5rem',
                                    zIndex: 60
                                }}
                            >
                                <div style={{ padding: '0.75rem', borderBottom: '1px solid #f1f5f9', marginBottom: '0.5rem' }}>
                                    <p style={{ margin: 0, fontWeight: '700', color: 'rgb\(18 37 74\)', fontSize: '14px', textTransform: 'uppercase' }}>
                                        {user?.firstName || user?.first_name} {user?.surname || user?.name}
                                    </p>
                                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8', wordBreak: 'break-all' }}>
                                        {user?.role_display_name || user?.role?.toUpperCase() || 'PUBLIC USER'}
                                    </p>
                                </div>

                                <MenuOption
                                    icon={<User size={18} />}
                                    label="My Profile"
                                    onClick={() => {
                                        if (onProfileClick) onProfileClick();
                                        setShowUserMenu(false);
                                    }}
                                />
                                <MenuOption
                                    icon={<Settings size={18} />}
                                    label="Settings"
                                    onClick={() => {
                                        if (onSettingsClick) onSettingsClick();
                                        setShowUserMenu(false);
                                    }}
                                />

                                <div style={{ borderTop: '1px solid #f1f5f9', margin: '0.5rem 0' }} />

                                <div
                                    onClick={onLogout}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.75rem',
                                        borderRadius: '10px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        color: '#ef4444',
                                        fontWeight: '600'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = '#fef2f2'}
                                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <LogOut size={18} />
                                    <span>Logout System</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
};

const MenuOption = ({ icon, label, onClick }) => (
    <div
        onClick={onClick}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#475569',
            fontWeight: '500'
        }}
        onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
    >
        {icon}
        <span>{label}</span>
    </div>
);

export default Header;
