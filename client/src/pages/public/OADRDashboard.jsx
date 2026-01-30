// OADR Dashboard
import React, { useState, useEffect } from 'react';
import { formatDate } from '../../utils/dateUtils';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import {
    LayoutDashboard, FilePlus, History, User,
    LogOut, Download, FileText, CheckCircle2, AlertCircle, Settings,
    Clock, Loader2, CheckCircle, Video, XCircle, Upload, Camera, Save, Edit2, CreditCard, ChevronRight, Send, Bell, MessageSquare
} from 'lucide-react';
import { generateAffidavitPDF } from '../../utils/pdfGenerator';
import FileNewAffidavit from '../../components/oadr/FileNewAffidavit';
import VirtualOathSession from '../../components/oadr/VirtualOathSession';
import Header from '../../components/common/Header';
import DataTable from '../../components/common/DataTable';
import PaymentReceipts from '../../components/common/PaymentReceipts';
import PublicProfile from '../../components/public/PublicProfile';
import PublicAnalytics from '../../components/public/PublicAnalytics';
import SupportTickets from '../../components/common/SupportTickets';

const OADRDashboard = ({ user }) => {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
    const [view, setView] = useState('dash');
    const [affidavits, setAffidavits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ open: false, affidavitId: null });
    const [oathModal, setOathModal] = useState({ open: false, affidavit: null });
    const [editingAffidavit, setEditingAffidavit] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications/public');
            setNotifications(res.data);
            setUnreadCount(res.data.filter(n => !n.is_read).length);
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        }
    };

    const markAsRead = async (notifId) => {
        try {
            await api.put(`/notifications/public/${notifId}/read`);
            fetchNotifications();
        } catch (err) {
            console.error("Error marking read:", err);
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
        if (user?.id) {
            fetchAffidavits();
            fetchNotifications();
            // Poll for notifications every 30 seconds
            const interval = setInterval(fetchNotifications, 30000);
            return () => {
                window.removeEventListener('resize', handleResize);
                clearInterval(interval);
            };
        }

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [user?.id]);

    const fetchAffidavits = async () => {
        if (!user?.id) {
            console.warn('Cannot fetch affidavits: No User ID found in session');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const res = await api.get(`/affidavits/user/${user.id}?t=${Date.now()}`);
            console.log(`[OADRDashboard] Fetched ${res.data.length} affidavits:`, res.data.map(a => ({ id: a.id, status: a.status })));
            setAffidavits(res.data);
        } catch (error) {
            console.error('Error fetching affidavits:', error);
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                // Token invalid or expired - force logout
                handleLogout();
                return;
            }
            const msg = error.response?.data?.error || error.message;
            setError(`Failed to load affidavits (${msg}). Please ensure the server is running.`);
        } finally {
            setLoading(false);
        }
    };

    const [successModal, setSuccessModal] = useState({ open: false, title: '', message: '' });

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        window.location.reload();
    };

    const downloadPDF = async (affidavit) => {
        try {
            const response = await api.get(`/affidavits/${affidavit.id}/download`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const fileName = affidavit.affidavit_path ? `Affidavit_${affidavit.id}_Certified.pdf` : `Affidavit_${affidavit.id}_Draft.pdf`;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Download failed:", err);
            alert("Failed to download PDF. Please try again.");
        }
    };

    const generateDirectly = async (affidavit) => {
        await generateAffidavitPDF({
            user,
            applicationId: affidavit.id,
            templateTitle: affidavit.type,
            content: affidavit.content,
            file: null,
            language: affidavit.language,
            juratName: affidavit.filed_by_name,
            division: affidavit.division
        });
    };

    const handleEditAffidavit = (affidavit) => {
        setEditingAffidavit(affidavit);
        setView('edit');
    };

    const handleDeleteAffidavit = async () => {
        try {
            await api.delete(`/affidavits/${deleteModal.affidavitId}`);
            setDeleteModal({ open: false, affidavitId: null });
            fetchAffidavits(); // Refresh the list
        } catch (error) {
            console.error('Error deleting affidavit:', error);
            alert('Failed to delete affidavit. Please try again.');
        }
    };

    const handleRequestOath = (affidavit) => {
        setOathModal({ open: true, affidavit });
    };

    const handleResubmit = async (affidavit) => {
        if (!window.confirm("Are you sure you want to resubmit this affidavit for review? This will clear previous rejection remarks.")) return;

        try {
            setLoading(true);
            // Using a flat, dedicated endpoint to guarantee route matching and fix 404
            await api.put(`/resubmit-affidavit/${affidavit.id}`);
            await fetchAffidavits(); // Refresh list
        } catch (error) {
            console.error('Error resubmitting affidavit:', error);
            alert('Failed to resubmit: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const confirmOathRequest = async () => {
        const { affidavit } = oathModal;
        if (!affidavit) return;

        try {
            await api.put(`/affidavits/${affidavit.id}/virtual-oath`, { status: 'requested' });
            setOathModal({ open: false, affidavit: null });
            setView('oath');
        } catch (error) {
            console.error('Error requesting oath:', error);
            alert('Failed to request virtual oath. Please try again.');
        }
    };

    const menuItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', id: 'dash' },
        { icon: <FilePlus size={20} />, label: 'File New Affidavit', id: 'new' },
        { icon: <Video size={20} />, label: 'Virtual Oath', id: 'oath' },
        { icon: <History size={20} />, label: 'Previous Filings', id: 'history' },
        { icon: <CreditCard size={20} />, label: 'Payment Receipt', id: 'payments' },
        { icon: <MessageSquare size={20} />, label: 'Support', id: 'support' },
        { icon: <User size={20} />, label: 'My Profile', id: 'profile' },
    ];


    if (!user) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading user session...</div>;

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
                            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>CRMS</h2>
                            <p style={{ margin: 0, fontSize: '9px', color: '#8d6e63', fontWeight: 'bold' }}>BORNO STATE HIGH COURT</p>
                        </div>
                    )}
                </div>
                <nav style={{ flex: 1, padding: '1rem' }}>
                    {menuItems.map(item => (
                        <div key={item.id}
                            onClick={() => {
                                setView(item.id);
                                if (item.id === 'history' || item.id === 'dash') fetchAffidavits();
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
                                color: view === item.id ? '#28a745' : '#8d6e63',
                                justifyContent: sidebarOpen ? 'flex-start' : 'center'
                            }}>
                            {item.icon}
                            {sidebarOpen && <span>{item.label}</span>}
                        </div>
                    ))}
                </nav>
                {sidebarOpen && (
                    <div style={{ padding: '1rem', borderTop: '1px solid #5d4037' }}>
                        <button
                            onClick={handleLogout}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'transparent', border: 'none', color: '#8d6e63', cursor: 'pointer', borderRadius: '8px' }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#5d4037'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <LogOut size={20} />
                            <span>Logout</span>
                        </button>
                    </div>
                )}
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>
                <Header
                    user={user}
                    title={view === 'dash' ? 'OADR Dashboard' : view === 'new' ? 'File New Affidavit' : view === 'history' ? 'Previous Filings' : 'My Profile'}
                    onLogout={handleLogout}
                    onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
                    onProfileClick={() => setView('profile')}
                    onSettingsClick={() => setView('profile')}
                    sidebarOpen={sidebarOpen}
                    isMobile={isMobile}
                    notifications={notifications}
                    onNotificationRead={markAsRead}
                />

                <div style={{ padding: isMobile ? '1rem' : '1.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>

                    {view === 'dash' ? (
                        <PublicAnalytics isMobile={isMobile} setView={setView} module="affidavit" />
                    ) : view === 'new' ? (
                        <FileNewAffidavit user={user} isMobile={isMobile} onNavigateToOath={() => setView('oath')} />
                    ) : view === 'oath' ? (
                        <VirtualOathSession isMobile={isMobile} />
                    ) : view === 'history' ? (
                        <div className="glass-card" style={{ background: 'white', padding: isMobile ? '1rem' : '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: 0, fontSize: isMobile ? '1.1rem' : '1.25rem' }}>Filing History</h3>
                            </div>

                            <DataTable
                                columns={[
                                    {
                                        key: 'created_at',
                                        label: 'Date',
                                        sortable: true,
                                        render: (val) => formatDate(val)
                                    },
                                    { key: 'type', label: 'Affidavit Title', sortable: true },
                                    { key: 'id', label: 'Application ID', render: (val) => `CRMS-${val}` },
                                    {
                                        key: 'status',
                                        label: 'Status',
                                        sortable: true,
                                        render: (val, row) => (
                                            <span
                                                title={val === 'rejected' ? `Reason: ${row.remarks || 'No reason provided'}` : ''}
                                                style={{
                                                    padding: '4px 12px',
                                                    borderRadius: '20px',
                                                    fontSize: '11px',
                                                    fontWeight: 'bold',
                                                    background: val === 'completed' ? '#ecfdf5' : (val === 'rejected' ? '#fef2f2' : '#fffbeb'),
                                                    color: val === 'completed' ? '#10b981' : (val === 'rejected' ? '#ef4444' : '#f59e0b'),
                                                    cursor: val === 'rejected' ? 'help' : 'default',
                                                    border: val === 'rejected' ? '1px dashed #ef4444' : 'none'
                                                }}
                                            >
                                                {val.toUpperCase()}
                                            </span>
                                        ),
                                        hiddenMobile: true
                                    },
                                    {
                                        key: 'remarks',
                                        label: 'Reason/Feedback',
                                        render: (val) => val ? (
                                            <div style={{ fontSize: '11px', color: '#ef4444', fontStyle: 'italic', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={val}>
                                                {val}
                                            </div>
                                        ) : '-'
                                    },
                                    {
                                        key: 'virtual_oath_taken',
                                        label: 'Virtual Oath Status',
                                        render: (val, row) => {
                                            const status = row.status || '';
                                            const isActive = ['submitted', 'rejected', 'pending'].includes(status);

                                            if (!isActive) return '-';

                                            const hasTaken = val === 'requested' || val === 1 || val === 'completed' || val === 2 || val === 'verified';

                                            return (
                                                <span style={{
                                                    fontSize: '11px',
                                                    fontWeight: 'bold',
                                                    color: hasTaken ? '#10b981' : '#778eaeff',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}>
                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: hasTaken ? '#10b981' : '#778eaeff' }}></div>
                                                    {hasTaken ? 'PROCEEDED' : 'PENDING'}
                                                </span>
                                            );
                                        }
                                    }
                                ]}
                                data={affidavits}
                                loading={loading}
                                searchPlaceholder="Search previous filings..."
                                isMobile={isMobile}
                                actions={(row) => (
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {row.status === 'completed' ? (
                                            <button
                                                onClick={() => downloadPDF(row)}
                                                title="Download PDF"
                                                style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px' }}
                                            >
                                                <Download size={16} />
                                            </button>
                                        ) : (
                                            <>
                                                {row.status === 'submitted' && (
                                                    <button
                                                        onClick={() => handleRequestOath(row)}
                                                        title="Request Virtual Oath"
                                                        style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px' }}
                                                    >
                                                        <Video size={16} />
                                                    </button>
                                                )}
                                                {row.status === 'rejected' && (
                                                    <button
                                                        onClick={() => handleResubmit(row)}
                                                        title="Resubmit for Review"
                                                        style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px' }}
                                                    >
                                                        <Send size={16} />
                                                    </button>
                                                )}
                                                {(row.status === 'submitted' || row.status === 'rejected' || row.status === 'pending') && (
                                                    <button
                                                        onClick={() => handleEditAffidavit(row)}
                                                        title="Edit Affidavit"
                                                        style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px' }}
                                                    >
                                                        <Settings size={16} />
                                                    </button>
                                                )}
                                                {!isMobile && (row.status === 'submitted' || row.status === 'rejected' || row.status === 'pending') && (
                                                    <button
                                                        onClick={() => setDeleteModal({ open: true, affidavitId: row.id })}
                                                        title="Delete Affidavit"
                                                        style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px' }}
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            />
                        </div>
                    ) : view === 'edit' && editingAffidavit ? (
                        <FileNewAffidavit user={user} isMobile={isMobile} editMode={true} affidavit={editingAffidavit} onComplete={() => {
                            setView('history');
                            setEditingAffidavit(null);
                            setTimeout(() => fetchAffidavits(), 500);
                        }} />
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
                        <div className="glass-card" style={{ background: 'white', textAlign: 'center', padding: '4rem 2rem' }}>
                            <Settings size={64} style={{ marginBottom: '1rem', color: '#cbd5e1' }} className="animate-spin" />
                            <h2>{view.charAt(0).toUpperCase() + view.slice(1)} Section</h2>
                            <p style={{ color: '#778eaeff' }}>This module is currently being optimized for the best experience.</p>
                            <button onClick={() => setView('dash')} className="btn btn-primary">Return to Dashboard</button>
                        </div>
                    )}
                </div>

                {/* Delete Confirmation Modal */}
                {deleteModal.open && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            style={{ background: 'white', borderRadius: '16px', padding: '2rem', maxWidth: '400px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
                        >
                            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                    <AlertCircle size={32} color="#ef4444" />
                                </div>
                                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem' }}>Delete Affidavit?</h3>
                                <p style={{ color: '#778eaeff', margin: 0 }}>This action cannot be undone. The affidavit will be permanently removed from your records.</p>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={() => setDeleteModal({ open: false, affidavitId: null })}
                                    style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteAffidavit}
                                    style={{ flex: 1, padding: '0.75rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
                {/* Oath Confirmation Modal */}
                {oathModal.open && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            style={{ background: 'white', borderRadius: '16px', padding: '2rem', maxWidth: '450px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
                        >
                            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                    <Video size={32} color="#10b981" />
                                </div>
                                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem' }}>Start Live Verification?</h3>
                                <p style={{ color: '#778eaeff', margin: 0 }}>
                                    You are about to request a virtual oath session for <strong>{oathModal.affidavit?.type}</strong>.
                                    A judicial officer will be notified of your request.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={() => setOathModal({ open: false, affidavit: null })}
                                    style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmOathRequest}
                                    style={{ flex: 1, padding: '0.75rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                >
                                    Proceed <ChevronRight size={18} />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Success/Info Modal */}
                {successModal.open && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            style={{ background: 'white', borderRadius: '16px', padding: '2rem', maxWidth: '400px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', textAlign: 'center' }}
                        >
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: successModal.title === 'Update Failed' ? '#fef2f2' : '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                {successModal.title === 'Update Failed' ? <XCircle size={32} color="#ef4444" /> : <CheckCircle size={32} color="#10b981" />}
                            </div>
                            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>{successModal.title}</h3>
                            <p style={{ color: '#778eaeff', margin: '0 0 1.5rem' }}>{successModal.message}</p>
                            <button
                                onClick={() => setSuccessModal({ open: false, title: '', message: '' })}
                                style={{ width: '100%', padding: '0.75rem', background: successModal.title === 'Update Failed' ? '#ef4444' : '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Close
                            </button>
                        </motion.div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default OADRDashboard;
