import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, FileText, CheckCircle, XCircle, Clock, Video, BarChart3, LayoutDashboard } from 'lucide-react';
import api from '../../utils/api';

const CFOAnalytics = ({ isMobile }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/staff/cfo/stats');
                setStats(res.data);
            } catch (err) {
                console.error("Failed to fetch CFO stats:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5rem' }}>
            <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', marginBottom: '1rem' }} />
            <p style={{ color: '#778eaeff' }}>Preparing Registry Overview...</p>
        </div>
    );

    const cards = [
        {
            title: 'Total Deponents',
            value: (stats?.total_users || 0).toLocaleString(),
            icon: <Users size={24} />,
            color: '#3b82f6',
            label: 'Registered users'
        },
        {
            title: 'Submitted Affidavits',
            value: (stats?.total_affidavits || 0).toLocaleString(),
            icon: <FileText size={24} />,
            color: '#8b5cf6',
            label: 'Total filings'
        },
        {
            title: 'Oaths Requested',
            value: stats?.total_oaths || 0,
            icon: <Video size={24} />,
            color: '#10b981',
            label: 'Virtual sessions'
        },
        {
            title: 'Pending Review',
            value: stats?.pending_affidavits || 0,
            icon: <Clock size={24} />,
            color: '#f59e0b',
            label: 'Waiting'
        },
    ];

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', fontWeight: 'bold', color: 'rgb\(18 37 74\)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <LayoutDashboard color="#3b82f6" /> Registry Overview
                </h2>
                <p style={{ color: '#778eaeff' }}>Operational performance metrics for affidavits and virtual oath sessions.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                {cards.map((card, idx) => (
                    <motion.div
                        key={idx}
                        whileHover={{ y: -5 }}
                        style={{
                            background: 'white',
                            padding: '1.5rem',
                            borderRadius: '24px',
                            border: '1px solid #f1f5f9',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                            <div style={{ padding: '10px', borderRadius: '12px', background: `${card.color}15`, color: card.color }}>
                                {card.icon}
                            </div>
                            <p style={{ margin: 0, color: '#778eaeff', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{card.title}</p>
                        </div>
                        <h3 style={{ margin: '0', fontSize: '2rem', fontWeight: '800', color: 'rgb\(18 37 74\)' }}>{card.value}</h3>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>{card.label}</p>
                    </motion.div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: '2rem' }}>
                <div style={{ background: 'white', padding: '2rem', borderRadius: '32px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ margin: '0 0 2rem 0', fontSize: '1.25rem', fontWeight: 'bold', color: 'rgb\(18 37 74\)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <BarChart3 size={22} color="#8b5cf6" /> Completion Rate
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <CheckCircle size={16} color="#10b981" />
                                    <span style={{ fontSize: '14px', color: '#778eaeff', fontWeight: '500' }}>Completed Affidavits</span>
                                </div>
                                <span style={{ fontWeight: 'bold', color: 'rgb\(18 37 74\)' }}>{stats?.completed_affidavits || 0}</span>
                            </div>
                            <div style={{ height: '8px', background: '#f8fafc', borderRadius: '4px', overflow: 'hidden' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(stats?.completed_affidavits / (stats?.total_affidavits || 1)) * 100}%` }}
                                    style={{ height: '100%', background: '#10b981', borderRadius: '4px' }}
                                />
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <XCircle size={16} color="#ef4444" />
                                    <span style={{ fontSize: '14px', color: '#778eaeff', fontWeight: '500' }}>Rejected Filings</span>
                                </div>
                                <span style={{ fontWeight: 'bold', color: 'rgb\(18 37 74\)' }}>{stats?.rejected_affidavits || 0}</span>
                            </div>
                            <div style={{ height: '8px', background: '#f8fafc', borderRadius: '4px', overflow: 'hidden' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(stats?.rejected_affidavits / (stats?.total_affidavits || 1)) * 100}%` }}
                                    style={{ height: '100%', background: '#ef4444', borderRadius: '4px' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '20px' }}>
                            <div>
                                <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>Approval Success</p>
                                <p style={{ margin: '4px 0 0', fontSize: '1.5rem', fontWeight: '800', color: '#10b981' }}>
                                    {stats?.total_affidavits > 0 ? Math.round((stats.completed_affidavits / stats.total_affidavits) * 100) : 0}%
                                </p>
                            </div>
                            <div>
                                <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>Total Processing</p>
                                <p style={{ margin: '4px 0 0', fontSize: '1.5rem', fontWeight: '800', color: 'rgb\(18 37 74\)' }}>
                                    {stats?.total_affidavits || 0}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ background: 'rgb\(18 37 74\)', padding: '2rem', borderRadius: '32px', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ background: 'rgba(59, 130, 246, 0.2)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                            <Video size={24} color="#3b82f6" />
                        </div>
                        <h3 style={{ fontSize: '1.4rem', margin: '0 0 0.75rem', fontWeight: 'bold' }}>Video Verification</h3>
                        <p style={{ color: '#94a3b8', lineHeight: '1.6', fontSize: '0.9rem' }}>
                            A total of <strong>{stats?.total_oaths || 0}</strong> virtual oath sessions have been conducted or requested across the system.
                        </p>
                    </div>

                    <div style={{ marginTop: '2rem', padding: '1.25rem', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
                            <span style={{ fontSize: '13px', color: '#f1f5f9' }}>Real-time Compliance Tracking</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CFOAnalytics;
