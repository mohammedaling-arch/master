import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckCircle, Clock, Video, List, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../../utils/api';

const RegistryAnalytics = ({ isMobile, role, onViewQueue }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await api.get('/staff/registry/stats');
            setStats(res.data);
        } catch (err) {
            console.error("Failed to fetch registry stats:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) return <div style={{ color: '#10b981', textAlign: 'center', padding: '3rem' }}>Fetching Registry Data...</div>;

    const cards = (role === 'pr' || role === 'cr') ? [
        {
            title: role === 'pr' ? 'Your Pending Review' : 'Pending Final Approval',
            value: role === 'pr' ? (stats?.pending_probate_registrar || 0) : (stats?.pending_probate_cr || 0),
            icon: <List size={22} />,
            color: '#f59e0b',
            description: role === 'pr' ? 'New probate filings' : 'Awaiting your signature'
        },
        {
            title: role === 'pr' ? 'Pending CR Approval' : 'Incoming Queue',
            value: role === 'pr' ? (stats?.pending_probate_cr || 0) : (stats?.pending_probate_registrar || 0),
            icon: <Clock size={22} />,
            color: '#3b82f6',
            description: role === 'pr' ? 'Awaiting Chief Registrar' : 'Currently with Registrar'
        },
        {
            title: role === 'pr' ? 'Approved Today' : 'Letters Issued',
            value: stats?.approved_probate || 0,
            icon: <CheckCircle size={22} />,
            color: '#10b981',
            description: role === 'pr' ? 'Processed probate cases' : 'Signed today'
        }
    ] : [
        {
            title: 'Pending Affidavits',
            value: stats?.pending_affidavits || 0,
            icon: <FileText size={22} />,
            color: '#f59e0b',
            description: 'Awaiting signature/seal'
        },
        {
            title: 'Pending Probate',
            value: (stats?.pending_probate_registrar || 0) + (stats?.pending_probate_cr || 0),
            icon: <List size={22} />,
            color: '#3b82f6',
            description: 'In review queue'
        },
        {
            title: 'Oath Requests',
            value: stats?.oath_requests || 0,
            icon: <Video size={22} />,
            color: '#8b5cf6',
            description: 'Live sessions waiting'
        },
        {
            title: 'Total Approved',
            value: (stats?.approved_affidavits || 0) + (stats?.approved_probate || 0),
            icon: <CheckCircle size={22} />,
            color: '#10b981',
            description: 'Processed successfully'
        },
    ];

    const probateApplied = stats?.total_probate || 0;
    const lettersIssued = stats?.letters_of_admin || 0;
    const ratio = probateApplied > 0 ? Math.round((lettersIssued / probateApplied) * 100) : 0;

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', margin: '0 0 0.5rem 0', fontWeight: 'bold', color: 'rgb\(18 37 74\)' }}>
                        {role === 'cr' ? 'Chief Registrar' : 'Probate Registrar'} Dashboard
                    </h2>
                    <p style={{ color: '#778eaeff' }}>Workflow analytics and application throughput monitoring.</p>
                </div>
                <button
                    onClick={fetchStats}
                    style={{ padding: '10px', borderRadius: '12px', background: 'white', border: '1px solid #e2e8f0', color: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}
                >
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : `repeat(${cards.length}, 1fr)`, gap: '1.5rem', marginBottom: '3.5rem' }}>
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
                {(role === 'pr' || role === 'cr') ? (
                    <div style={{ background: '#f8fafc', padding: '2.5rem', borderRadius: '32px', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ margin: '0 0 2rem 0', display: 'flex', alignItems: 'center', gap: '1rem', color: 'rgb\(18 37 74\)', fontSize: '1.25rem', fontWeight: 'bold' }}>
                            <FileText size={22} color="#10b981" /> Probate Analytics
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                            <div style={{ display: 'flex', gap: '2rem' }}>
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#778eaeff', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Applied</p>
                                    <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', color: 'rgb\(18 37 74\)' }}>{probateApplied}</p>
                                    <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 'bold' }}>Cumulative filings</span>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#778eaeff', fontWeight: 'bold', textTransform: 'uppercase' }}>Letters Issued</p>
                                    <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', color: 'rgb\(18 37 74\)' }}>{lettersIssued}</p>
                                    <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold' }}>LOA Completed</span>
                                </div>
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <span style={{ color: '#778eaeff', fontWeight: '600', fontSize: '13px' }}>Completion Rate</span>
                                    <span style={{ fontWeight: 'bold', color: 'rgb\(18 37 74\)', fontSize: '13px' }}>{ratio}% Ratio</span>
                                </div>
                                <div style={{ height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${ratio}%` }}
                                        style={{ height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: '5px' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ background: '#f8fafc', padding: '2.5rem', borderRadius: '32px', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ margin: '0 0 2rem 0', display: 'flex', alignItems: 'center', gap: '1rem', color: 'rgb\(18 37 74\)', fontSize: '1.25rem', fontWeight: 'bold' }}>
                            <Clock size={22} color="#3b82f6" /> Efficiency Metrics
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                            <div style={{ display: 'flex', gap: '2rem' }}>
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#778eaeff', fontWeight: 'bold', textTransform: 'uppercase' }}>Avg Review Time</p>
                                    <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', color: 'rgb\(18 37 74\)' }}>14m</p>
                                    <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold' }}>-2m from avg</span>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#778eaeff', fontWeight: 'bold', textTransform: 'uppercase' }}>Daily Capacity</p>
                                    <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', color: 'rgb\(18 37 74\)' }}>85</p>
                                    <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 'bold' }}>Optimal level</span>
                                </div>
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <span style={{ color: '#778eaeff', fontWeight: '600', fontSize: '13px' }}>Queue Completion Status</span>
                                    <span style={{ fontWeight: 'bold', color: 'rgb\(18 37 74\)', fontSize: '13px' }}>72% Daily Target</span>
                                </div>
                                <div style={{ height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: '72%' }}
                                        style={{ height: '100%', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', borderRadius: '5px' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ background: 'rgb(13 46 114)', padding: '2.5rem', borderRadius: '32px', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
                        <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '16px', borderRadius: '20px' }}>
                            <AlertCircle size={32} color="#f59e0b" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.4rem', margin: '0 0 1rem', fontWeight: 'bold' }}>Action Queue</h3>
                            <p style={{ color: '#94a3b8', lineHeight: '1.6', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                                {role === 'pr' ? (
                                    <>You have <strong>{stats?.pending_probate_registrar || 0} probate applications</strong> waiting for your initial review.</>
                                ) : role === 'cr' ? (
                                    <>You have <strong>{stats?.pending_probate_cr || 0} probate applications</strong> awaiting your final approval and signature.</>
                                ) : (
                                    <>There are currently <strong>{stats?.oath_requests || 0} deponents</strong> in the virtual oath waiting room. Priority attention is recommended.</>
                                )}
                            </p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={onViewQueue}
                                    style={{ padding: '10px 20px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                                >
                                    View Queue
                                </button>
                                <button style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>Dismiss</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default RegistryAnalytics;
