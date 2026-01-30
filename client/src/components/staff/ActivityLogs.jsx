import React, { useState, useEffect } from 'react';
import { formatDate } from '../../utils/dateUtils';
import { motion } from 'framer-motion';
import { Search, RefreshCw, Clock, User, Globe, Activity } from 'lucide-react';
import api from '../../utils/api';
import DataTable from '../common/DataTable';

const ActivityLogs = ({ isMobile }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const res = await api.get('/staff/admin/logs');
            setLogs(res.data);
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const columns = [
        {
            key: 'timestamp',
            label: 'Time',
            render: (val) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#778eaeff' }}>
                    <Clock size={14} />
                    {formatDate(val)}
                </div>
            )
        },
        {
            key: 'user_name',
            label: 'User',
            render: (val, row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={14} color={row.user_type === 'staff' ? '#8b5cf6' : '#3b82f6'} />
                    <span style={{ fontWeight: '500' }}>{val}</span>
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '10px', background: row.user_type === 'staff' ? '#f3e8ff' : '#dbeafe', color: row.user_type === 'staff' ? '#7c3aed' : '#2563eb' }}>
                        {row.user_type?.toUpperCase()}
                    </span>
                </div>
            )
        },
        {
            key: 'action',
            label: 'Action',
            render: (val) => (
                <code style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', color: 'rgb\(18 37 74\)' }}>
                    {val}
                </code>
            )
        },
        {
            key: 'ip_address',
            label: 'IP Address',
            render: (val) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '12px' }}>
                    <Globe size={12} /> {val}
                </div>
            ),
            hiddenMobile: true
        }
    ];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card" style={{ background: 'white', padding: isMobile ? '1rem' : '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Activity size={22} color="#f59e0b" /> System Audit Logs
                </h3>
                <button
                    onClick={fetchLogs}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            <DataTable
                columns={columns}
                data={logs}
                loading={loading}
                searchPlaceholder="Search audit trails..."
                isMobile={isMobile}
            />
        </motion.div>
    );
};

export default ActivityLogs;
