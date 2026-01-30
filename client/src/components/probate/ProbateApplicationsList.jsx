import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import api from '../../utils/api';
import { formatDate } from '../../utils/dateUtils';
import DataTable from '../common/DataTable';

const ProbateApplicationsList = ({ user, isMobile, onSelect, filterStatus, title, staffMode = false }) => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const endpoint = staffMode ? '/staff/probate/all' : '/user/probate-applications';
                const res = await api.get(endpoint);
                let data = res.data;
                if (filterStatus) {
                    const statuses = filterStatus.split(',').map(s => s.trim());
                    data = data.filter(app => statuses.includes(app.status));
                }
                setApplications(data);
            } catch (error) {
                console.error("[ProbateApplicationsList] Failed to fetch probate applications:", error);
                setApplications([]);
            } finally {
                setLoading(false);
            }
        };
        fetchApplications();
    }, [filterStatus, staffMode]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved':
            case 'completed': return 'bg-green-100 text-green-800';
            case 'under_processing': return 'bg-blue-100 text-blue-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            case 'pending_registrar':
            case 'pending_judge': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const columns = [
        {
            key: 'id',
            label: 'ID',
            sortable: true,
            render: (val) => <span style={{ fontWeight: 'bold' }}>PRB-{val}</span>
        },
        {
            key: 'deceased_name',
            label: 'Deceased Name',
            sortable: true,
            render: (val) => <span style={{ textTransform: 'capitalize' }}>{val}</span>
        },
        {
            key: 'created_at',
            label: 'Date Filed',
            sortable: true,
            render: (val) => formatDate(val)
        },
        {
            key: 'applicant_first_name',
            label: 'Next of Kin',
            sortable: true,
            render: (val, row) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 'bold', color: 'rgb\(18 37 74\)', textTransform: 'capitalize' }}>{val || row.first_name} {row.applicant_surname || row.surname}</span>
                    <span style={{ fontSize: '11px', color: '#778eaeff' }}>{row.applicant_relationship || row.relationship_to_nok || row.applicant_email || row.email}</span>
                </div>
            )
        },
        {
            key: 'gazette',
            label: 'Gazette',
            sortable: false,
            render: (_val, row) => {
                const dateVal = row.approval_date || (row.status === 'approved' && row.updated_at);
                if (!dateVal) return <span style={{ fontSize: '11px', color: '#9ca3af' }}>N/A</span>;

                const approval = new Date(dateVal);
                const today = new Date();
                approval.setHours(0, 0, 0, 0);
                today.setHours(0, 0, 0, 0);

                const diffTime = today - approval;
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                const isMatured = diffDays >= 21;

                return (
                    <div style={{ textAlign: 'center' }}>
                        <span style={{
                            padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase',
                            background: isMatured ? '#dcfce7' : '#fef9c3',
                            color: isMatured ? '#166534' : '#854d0e',
                            border: `1px solid ${isMatured ? '#bbf7d0' : '#fde047'}`
                        }}>
                            {isMatured ? 'Matured' : 'Process'}
                        </span>
                        <div style={{ fontSize: '10px', color: '#778eaeff', marginTop: '4px', fontWeight: '500' }}>
                            {diffDays} Day{diffDays !== 1 ? 's' : ''}
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'filed_by_name',
            label: 'Filed By',
            sortable: true,
            render: (val) => (
                <div style={{ fontWeight: '600', color: val ? '#10b981' : '#778eaeff', fontSize: '12px', textTransform: 'uppercase' }}>
                    {val ? 'Registry' : 'Self (Online)'}
                </div>
            )
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (val) => (
                <span style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    background: val === 'approved' ? '#dcfce7' :
                        val === 'completed' ? '#dcfce7' :
                            val === 'under_processing' ? '#dbeafe' :
                                val === 'cr_pending' ? '#fef9c3' :
                                    val === 'pending_registrar' ? '#e0f2fe' :
                                        val === 'rejected' ? '#fee2e2' : '#f1f5f9',
                    color: val === 'approved' ? '#15803d' :
                        val === 'completed' ? '#15803d' :
                            val === 'under_processing' ? '#1e40af' :
                                val === 'cr_pending' ? '#854d0e' :
                                    val === 'pending_registrar' ? '#0369a1' :
                                        val === 'rejected' ? '#b91c1c' : '#778eaeff',
                    border: '1px solid currentColor',
                    opacity: 0.9
                }}>
                    {(val || 'pending').replace('_', ' ')}
                </span>
            )
        },
        {
            key: 'approval',
            label: 'Approval',
            sortable: true,
            render: (val) => (
                <span style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: (val === 'approved' || val === 'Approved') ? '#059669' :
                        (val === 'rejected' || val === 'Rejected') ? '#ef4444' : '#6b7280'
                }}>
                    {val ? (val.charAt(0).toUpperCase() + val.slice(1)) : 'Pending'}
                </span>
            )
        },
        {
            key: 'approval_date',
            label: 'Approval Date',
            sortable: true,
            render: (val) => formatDate(val)
        }
    ];

    return (
        <div className="glass-card" style={{ background: 'white', padding: isMobile ? '1rem' : '2rem', borderRadius: '16px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#1f2937' }}>{title || 'Probate Applications'}</h2>

            <DataTable
                columns={columns}
                data={applications}
                loading={loading}
                isMobile={isMobile}
                onRowClick={(row) => onSelect(row.id)}
                searchPlaceholder="Search by name or ID..."
            />
        </div>
    );
};

export default ProbateApplicationsList;
