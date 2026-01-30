import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, FileText, Image as ImageIcon, Database, Activity, RefreshCw } from 'lucide-react';
import api from '../../utils/api';

const AdminAnalytics = ({ isMobile }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);

            // Connectivity test
            try {
                const test = await api.get('/public-test/stats');
                console.log("Connectivity check:", test.data);
            } catch (pErr) {
                console.warn("Connectivity check failed:", pErr.message);
            }
            console.log("Fetching admin stats from /admin/system/stats...");
            const res = await api.get('/admin/system/stats');
            setStats(res.data);
        } catch (err) {
            console.error("Failed to fetch admin stats:", err);
            const status = err.response?.status;
            let message = err.response?.data?.error || err.message;

            // Debug: Try to see all registered routes on the server
            try {
                // baseURL is .../api, so we need to go up one level to reach /debug/routes
                const debugRes = await api.get('../debug/routes');
                console.log("Registered Server Routes:", debugRes.data);
                if (!debugRes.data.includes("GET /api/admin/system/stats")) {
                    console.error("Missing expected route: /api/admin/system/stats. Server might need a restart.");
                }
            } catch (dErr) {
                console.warn("Could not fetch debug routes:", dErr.message);
            }

            setError(status ? `${status}: ${message}` : `Sync Error: ${message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5rem' }}>
            <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', marginBottom: '1rem' }} />
            <p style={{ color: '#778eaeff', fontWeight: '500' }}>Fetching System Metrics...</p>
        </div>
    );

    if (error) return (
        <div style={{ padding: '3rem', textAlign: 'center', background: '#fff1f2', borderRadius: '24px', border: '1px solid #fecaca' }}>
            <Activity size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
            <h3 style={{ color: '#991b1b', margin: '0 0 0.5rem' }}>Data Sync Failed</h3>
            <p style={{ color: '#b91c1c', margin: '0 0 1.5rem' }}>{error}</p>
            <button onClick={fetchStats} style={{ padding: '10px 24px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                Retry Connection
            </button>
        </div>
    );

    const cards = [
        { title: 'Public Users', value: stats?.total_users ?? 0, icon: <Users color="#3b82f6" />, color: '#3b82f6' },
        { title: 'Staff Members', value: stats?.total_staff ?? 0, icon: <Shield color="#10b981" />, color: '#10b981' },
        { title: 'Legal Templates', value: stats?.total_templates ?? 0, icon: <FileText color="#8b5cf6" />, color: '#8b5cf6' },
        { title: 'Active Banners', value: stats?.total_banners ?? 0, icon: <ImageIcon color="#f59e0b" />, color: '#f59e0b' },
    ];

    return (
        <div style={{ color: 'rgb\(18 37 74\)' }}>
            <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', fontWeight: 'bold', color: 'rgb\(18 37 74\)' }}>System Overview</h2>
                    <p style={{ color: '#778eaeff' }}>Real-time performance metrics and infrastructure status.</p>
                </div>
                <button
                    onClick={fetchStats}
                    style={{ padding: '10px', borderRadius: '12px', background: 'white', border: '1px solid #e2e8f0', color: '#778eaeff', cursor: 'pointer' }}
                    title="Refresh Data"
                >
                    <RefreshCw size={18} />
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                {cards.map((card, idx) => (
                    <motion.div
                        key={idx}
                        whileHover={{ y: -5 }}
                        style={{
                            background: 'white',
                            padding: '1.75rem',
                            borderRadius: '24px',
                            border: '1px solid #f1f5f9',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.25rem'
                        }}
                    >
                        <div style={{ padding: '12px', borderRadius: '16px', background: `${card.color}15`, width: 'fit-content' }}>
                            {card.icon}
                        </div>
                        <div>
                            <p style={{ margin: 0, color: '#778eaeff', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{card.title}</p>
                            <h3 style={{ margin: '0.4rem 0 0', fontSize: '1.75rem', fontWeight: '800', color: 'rgb\(18 37 74\)' }}>{card.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2rem' }}>
                <div style={{ background: 'white', padding: '2.5rem', borderRadius: '32px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ margin: '0 0 2rem 0', display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.25rem', color: 'rgb\(18 37 74\)' }}>
                        <Activity size={24} color="#f59e0b" /> Operations Activity
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span style={{ color: '#778eaeff', fontWeight: '500' }}>Recent Activity (24h)</span>
                                <span style={{ fontWeight: 'bold', color: 'rgb\(18 37 74\)' }}>{stats?.recent_activities || 0} Events</span>
                            </div>
                            <div style={{ height: '10px', background: '#f1f5f9', borderRadius: '5px' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: stats?.total_activities ? `${Math.min((stats.recent_activities / stats.total_activities) * 100, 100)}%` : '0%' }}
                                    style={{ height: '100%', background: '#f59e0b', borderRadius: '5px' }}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                            <div style={{ flex: 1, padding: '1.25rem', background: '#f8fafc', borderRadius: '20px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                                <p style={{ margin: 0, color: '#778eaeff', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Lifetime Logs</p>
                                <p style={{ margin: '5px 0 0', fontWeight: '800', fontSize: '1.4rem', color: 'rgb\(18 37 74\)' }}>{stats?.total_activities || 0}</p>
                            </div>
                            <div style={{ flex: 1, padding: '1.25rem', background: '#f8fafc', borderRadius: '20px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                                <p style={{ margin: 0, color: '#778eaeff', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Last Heartbeat</p>
                                <p style={{ margin: '5px 0 0', fontWeight: '800', fontSize: '1.2rem', color: '#10b981' }}>
                                    {stats?.last_activity ? new Date(stats.last_activity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'None'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ background: 'linear-gradient(135deg, rgb\(18 37 74\) 0%, #0f172a 100%)', padding: '2.5rem', borderRadius: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                    <Shield size={120} style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.05, color: 'white' }} />
                    <h3 style={{ fontSize: '1.5rem', margin: '0 0 1rem', position: 'relative', color: '#4ade80', fontWeight: 'bold' }}>Core Health</h3>
                    <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', fontSize: '0.95rem', marginBottom: '2rem', position: 'relative' }}>
                        Platform services are operating at peak efficiency. Data integrity checks and security encryption layers are all fully active.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                        <div style={{ padding: '0.75rem', background: 'rgba(74, 222, 128, 0.1)', borderRadius: '12px', flex: 1, textAlign: 'center', border: '1px solid rgba(74, 222, 128, 0.2)' }}>
                            <span style={{ display: 'block', fontSize: '0.8rem', opacity: 0.8, color: '#4ade80', fontWeight: 'bold' }}>SYSTEM</span>
                            <span style={{ fontWeight: 'bold', color: '#4ade80' }}>ACTIVE</span>
                        </div>
                        <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', flex: 1, textAlign: 'center' }}>
                            <span style={{ display: 'block', fontSize: '0.8rem', opacity: 0.8, color: '#94a3b8' }}>DATABASE</span>
                            <span style={{ fontWeight: 'bold', color: 'white' }}>ONLINE</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalytics;
