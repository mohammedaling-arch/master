import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckCircle, Clock, CreditCard, ChevronRight, Activity } from 'lucide-react';
import api from '../../utils/api';

const PublicAnalytics = ({ isMobile, setView, module = 'affidavit' }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                console.log('[PublicAnalytics] Fetching stats for module:', module);
                // Add timestamp to bypass potential caching
                const res = await api.get(`/public/stats?t=${Date.now()}`);
                console.log('[PublicAnalytics] Stats response:', res.data);
                setStats(res.data);
            } catch (err) {
                console.error("[PublicAnalytics] Failed to fetch public stats:", err);
                console.error("[PublicAnalytics] Error details:", err.response?.data || err.message);
                // Set empty stats object to prevent UI from breaking
                setStats({
                    total_affidavits: 0,
                    completed_affidavits: 0,
                    affidavit_spent: 0,
                    total_probate: 0,
                    approved_probate: 0,
                    pending_probate: 0,
                    rejected_probate: 0,
                    probate_spent: 0,
                    total_spent: 0
                });
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [module]); // Re-fetch if module changes

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%' }} />
        </div>
    );

    // Safety check: ensure stats is loaded
    if (!stats) {
        console.warn('[PublicAnalytics] Stats is null, showing empty state');
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#778eaeff' }}>
                <p>Unable to load analytics data. Please refresh the page.</p>
            </div>
        );
    }

    const isProbate = module === 'probate';

    const cards = isProbate ? [
        {
            title: 'Probate Apps',
            value: stats?.total_probate || 0,
            icon: <FileText color="#8b5cf6" />,
            color: '#8b5cf6',
            action: () => setView('applications')
        },
        {
            title: 'Approved',
            value: stats?.approved_probate || 0,
            icon: <CheckCircle color="#10b981" />,
            color: '#10b981',
            action: () => setView('applications')
        },
        {
            title: 'Pending/Rejected',
            value: (stats?.pending_probate || 0) + (stats?.rejected_probate || 0),
            icon: <Clock color="#f59e0b" />,
            color: '#f59e0b',
            action: () => setView('applications')
        },
        {
            title: 'Probate Fees',
            value: `₦${parseFloat(stats?.probate_spent || 0).toLocaleString()}`,
            icon: <CreditCard color="#3b82f6" />,
            color: '#3b82f6',
            action: () => setView('payments')
        },
    ] : [
        {
            title: 'Your Affidavits',
            value: stats?.total_affidavits || 0,
            icon: <FileText color="#3b82f6" />,
            color: '#3b82f6',
            action: () => setView('history')
        },
        {
            title: 'Certified',
            value: stats?.completed_affidavits || 0,
            icon: <CheckCircle color="#10b981" />,
            color: '#10b981',
            action: () => setView('history')
        },
        {
            title: 'Total Spent', // Affidavit specific spending in future, but total is fine too
            value: `₦${parseFloat(stats?.affidavit_spent || 0).toLocaleString()}`,
            icon: <CreditCard color="#8b5cf6" />,
            color: '#8b5cf6',
            action: () => setView('payments')
        },
        {
            title: 'Module Usage',
            value: stats?.total_probate > 0 ? 'Integrated' : 'Affidavit',
            icon: <Activity color="#f59e0b" />,
            color: '#f59e0b',
            action: () => setView('dash')
        },
    ];

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.8rem', margin: '0 0 0.5rem 0', fontWeight: 'bold', color: 'rgb\(18 37 74\)' }}>
                    {isProbate ? 'Probate Insights' : 'Welcome Back!'}
                </h2>
                <p style={{ color: '#778eaeff' }}>
                    {isProbate ? "Summary of your probate and estate applications." : "Here's what's happening with your legal documents today."}
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                {cards.map((card, idx) => (
                    <motion.div
                        key={idx}
                        whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                        onClick={card.action}
                        style={{
                            background: 'white',
                            padding: '1.75rem',
                            borderRadius: '24px',
                            border: '1px solid #f1f5f9',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.25rem',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <div style={{ padding: '12px', borderRadius: '16px', background: `${card.color}10`, width: 'fit-content' }}>
                            {card.icon}
                        </div>
                        <div>
                            <p style={{ margin: 0, color: '#778eaeff', fontSize: '14px', fontWeight: '600' }}>{card.title}</p>
                            <h3 style={{ margin: '0.4rem 0 0', fontSize: '1.8rem', fontWeight: '800', color: 'rgb\(18 37 74\)' }}>{card.value}</h3>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: card.color, fontSize: '12px', fontWeight: '700', marginTop: 'auto' }}>
                            View Details <ChevronRight size={14} />
                        </div>
                    </motion.div>
                ))}
            </div>

            <div>
                <div style={{ background: 'white', padding: '2.5rem', borderRadius: '32px', border: '1px solid #f1f5f9', width: '100%' }}>
                    <h3 style={{ margin: '0 0 2rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'rgb\(18 37 74\)', fontSize: '1.25rem' }}>
                        <Activity size={22} color={isProbate ? "#8b5cf6" : "#3b82f6"} /> {isProbate ? 'Probate Application Progress' : 'Filing Activity'}
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ fontSize: '15px', color: '#778eaeff', fontWeight: '500' }}>
                                    {isProbate ? 'Application Approval Rate' : 'Affidavit Progress'}
                                </span>
                                <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'rgb\(18 37 74\)' }}>
                                    {isProbate
                                        ? `${stats?.approved_probate || 0} / ${stats?.total_probate || 0} Approved`
                                        : `${stats?.completed_affidavits || 0} / ${stats?.total_affidavits || 0} Certified`
                                    }
                                </span>
                            </div>
                            <div style={{ height: '12px', background: '#f8fafc', borderRadius: '8px', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: isProbate
                                            ? (stats?.total_probate ? `${(stats.approved_probate / stats.total_probate) * 100}%` : 0)
                                            : (stats?.total_affidavits ? `${(stats.completed_affidavits / stats.total_affidavits) * 100}%` : 0)
                                    }}
                                    style={{ height: '100%', background: isProbate ? 'linear-gradient(90deg, #8b5cf6, #a78bfa)' : 'linear-gradient(90deg, #3b82f6, #60a5fa)', borderRadius: '8px' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem' }}>
                            <div style={{ flex: 1, padding: '1.5rem', background: isProbate ? '#f5f3ff' : '#f0f9ff', borderRadius: '20px', border: isProbate ? '1px solid #ede9fe' : '1px solid #e0f2fe' }}>
                                <h4 style={{ margin: '0 0 0.5rem', color: isProbate ? '#6d28d9' : '#0369a1', fontSize: '0.9rem' }}>Efficiency</h4>
                                <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: isProbate ? '#4c1d95' : '#0c4a6e' }}>
                                    {(isProbate ? stats?.total_probate : stats?.total_affidavits) > 0 ? 'High' : 'N/A'}
                                </p>
                            </div>
                            <div style={{ flex: 1, padding: '1.5rem', background: '#f0fdf4', borderRadius: '20px', border: '1px solid #dcfce7' }}>
                                <h4 style={{ margin: '0 0 0.5rem', color: '#15803d', fontSize: '0.9rem' }}>Total Processed</h4>
                                <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#064e3b' }}>
                                    {isProbate ? `${stats?.approved_probate || 0} Apps` : `${stats?.completed_affidavits || 0} Docs`}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicAnalytics;
