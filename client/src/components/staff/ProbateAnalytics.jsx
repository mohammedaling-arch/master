import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckCircle, Clock, CreditCard, List, RefreshCw, Activity } from 'lucide-react';
import api from '../../utils/api';

const ProbateAnalytics = ({ isMobile, onViewProbate }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            setLoading(true);
            // We can reuse the registry stats endpoint as it has probate data
            const res = await api.get('/staff/registry/stats');
            setStats(res.data);
        } catch (err) {
            console.error("Failed to fetch probate analytics:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5rem' }}>
            <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #8b5cf6', borderTopColor: 'transparent', borderRadius: '50%', marginBottom: '1rem' }} />
            <p style={{ color: '#778eaeff', fontWeight: '500' }}>Loading Probate Analytics...</p>
        </div>
    );

    const cards = [
        {
            title: 'Total Applications',
            value: stats?.total_probate || 0,
            icon: <FileText size={22} />,
            color: '#8b5cf6',
            description: 'All time filings'
        },
        {
            title: 'Pending Registrar',
            value: stats?.pending_probate_registrar || 0,
            icon: <Clock size={22} />,
            color: '#3b82f6',
            description: 'Awaiting PR review'
        },
        {
            title: 'Pending Final Approval',
            value: stats?.pending_probate_cr || 0,
            icon: <List size={22} />,
            color: '#f59e0b',
            description: 'Awaiting CR signature'
        },
        {
            title: 'Letters Issued',
            value: stats?.approved_probate || 0,
            icon: <CheckCircle size={22} />,
            color: '#10b981',
            description: 'Completed cases'
        }
    ];

    const ratio = stats?.total_probate > 0
        ? Math.round(((stats?.approved_probate || 0) / stats.total_probate) * 100)
        : 0;

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', margin: '0 0 0.5rem 0', fontWeight: 'bold', color: 'rgb\(18 37 74\)' }}>
                        Probate Performance Insights
                    </h2>
                    <p style={{ color: '#778eaeff' }}>Comprehensive overview of estate and probate administration throughput.</p>
                </div>
                <button
                    onClick={fetchStats}
                    style={{ padding: '10px', borderRadius: '12px', background: 'white', border: '1px solid #e2e8f0', color: '#8b5cf6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}
                >
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3.5rem' }}>
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
                        <div style={{ padding: '12px', borderRadius: '16px', background: `${card.color}15`, color: card.color, width: 'fit-content' }}>
                            {card.icon}
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', color: 'rgb\(18 37 74\)' }}>{card.value}</h3>
                            <p style={{ margin: '4px 0 0', color: 'rgb\(18 37 74\)', fontSize: '14px', fontWeight: 'bold' }}>{card.title}</p>
                            <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: '12px' }}>{card.description}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '2rem' }}>
                <div style={{ background: '#f8fafc', padding: '2.5rem', borderRadius: '32px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ margin: '0 0 2rem 0', display: 'flex', alignItems: 'center', gap: '1rem', color: 'rgb\(18 37 74\)', fontSize: '1.25rem', fontWeight: 'bold' }}>
                        <Activity size={22} color="#8b5cf6" /> Completion Progress
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ color: '#778eaeff', fontWeight: '600', fontSize: '13px' }}>Success Ratio</span>
                                <span style={{ fontWeight: 'bold', color: 'rgb\(18 37 74\)', fontSize: '13px' }}>{ratio}% of targets</span>
                            </div>
                            <div style={{ height: '12px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${ratio}%` }}
                                    style={{ height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)', borderRadius: '6px' }}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                            <div style={{ flex: 1, padding: '1.5rem', background: 'white', borderRadius: '24px', border: '1px solid #f1f5f9', textAlign: 'center' }}>
                                <p style={{ margin: '0 0 5px', fontSize: '11px', color: '#778eaeff', fontWeight: 'bold', textTransform: 'uppercase' }}>Letters Issued</p>
                                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#10b981' }}>{stats?.approved_probate || 0}</p>
                            </div>
                            <div style={{ flex: 1, padding: '1.5rem', background: 'white', borderRadius: '24px', border: '1px solid #f1f5f9', textAlign: 'center' }}>
                                <p style={{ margin: '0 0 5px', fontSize: '11px', color: '#778eaeff', fontWeight: 'bold', textTransform: 'uppercase' }}>In Pipeline</p>
                                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#3b82f6' }}>
                                    {(stats?.pending_probate_registrar || 0) + (stats?.pending_probate_cr || 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ background: 'rgb(13 46 114)', padding: '2.5rem', borderRadius: '32px', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
                        <div style={{ background: 'rgba(139, 92, 246, 0.2)', padding: '16px', borderRadius: '20px' }}>
                            <FileText size={32} color="#a78bfa" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.4rem', margin: '0 0 1rem', fontWeight: 'bold' }}>Registry Operations</h3>
                            <p style={{ color: '#94a3b8', lineHeight: '1.6', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                                You are currently monitoring the probate application lifecycle. Use the <strong>Probate Queue</strong> to manage new filings or the <strong>Applicants</strong> tab to initiate filings on behalf of citizens.
                            </p>
                            <button
                                onClick={onViewProbate}
                                className="btn btn-primary"
                                style={{ padding: '12px 24px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
                            >
                                Manage Probate Queue
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProbateAnalytics;
