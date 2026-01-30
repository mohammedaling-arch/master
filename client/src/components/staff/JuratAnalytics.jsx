import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, FileText, Scale, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import api from '../../utils/api';

const JuratAnalytics = ({ isMobile }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/staff/jurat/stats');
                setStats(res.data);
            } catch (err) {
                console.error("Failed to fetch stats:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '2rem' }}>Loading Analytics...</div>;

    const cards = [
        { title: 'Total Applicants', value: stats?.total_applicants || 0, icon: <Users color="#3b82f6" />, color: '#3b82f6' },
        { title: 'Total Fees Paid', value: `₦${(stats?.total_fees || 0).toLocaleString()}`, icon: <TrendingUp color="#10b981" />, color: '#10b981' },
        { title: 'Affidavits Filed', value: stats?.total_affidavits || 0, icon: <FileText color="#8b5cf6" />, color: '#8b5cf6' },
    ];

    return (
        <div style={{ color: 'rgb\(18 37 74\)' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.8rem', margin: '0 0 0.5rem 0' }}>Jurat Performance Dashboard</h2>
                <p style={{ color: '#94a3b8' }}>Real-time summary of applicant registrations and affidavit filings</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                {cards.map((card, idx) => (
                    <motion.div
                        key={idx}
                        whileHover={{ y: -5 }}
                        style={{
                            background: 'rgb\(18 37 74\)',
                            padding: '1.5rem',
                            borderRadius: '20px',
                            border: `1px solid ${card.color}20`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            color: 'white'
                        }}
                    >
                        <div style={{ padding: '10px', borderRadius: '12px', background: `${card.color}10`, width: 'fit-content' }}>
                            {card.icon}
                        </div>
                        <div>
                            <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>{card.title}</p>
                            <h3 style={{ margin: '0.25rem 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{card.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2rem' }}>
                <div style={{ background: 'rgb\(18 37 74\)', padding: '2rem', borderRadius: '24px', color: 'white' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <CheckCircle size={20} color="#10b981" /> Completion Rate
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <div style={{ display: 'flex', justify: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '14px', color: '#94a3b8' }}>Affidavits Progress</span>
                                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{stats?.completed_affidavits || 0} / {stats?.total_affidavits || 0}</span>
                            </div>
                            <div style={{ height: '8px', background: '#0f172a', borderRadius: '4px', overflow: 'hidden' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: stats?.total_affidavits ? `${(stats.completed_affidavits / stats.total_affidavits) * 100}%` : 0 }}
                                    style={{ height: '100%', background: '#8b5cf6' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ background: 'rgb\(18 37 74\)', padding: '2rem', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                        <Clock size={40} color="#778eaeff" style={{ marginBottom: '1rem' }} />
                        <h4 style={{ margin: 0, color: '#94a3b8' }}>Recent Activity Focus</h4>
                        <p style={{ fontSize: '13px', color: '#778eaeff', marginTop: '0.5rem' }}>Filing volume and applicant registration metrics are updated in real-time.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JuratAnalytics;
