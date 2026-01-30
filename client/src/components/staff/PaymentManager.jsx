import React, { useState, useEffect } from 'react';
import { formatDate } from '../../utils/dateUtils';
import { motion } from 'framer-motion';
import { CreditCard, Search, Download, Filter } from 'lucide-react';
import api from '../../utils/api';
import DataTable from '../common/DataTable';
import { generatePaymentReceiptPDF } from '../../utils/pdfGenerator';

const PaymentManager = ({ isMobile }) => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const res = await api.get('/staff/jurat/payments');
            setPayments(res.data);
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredPayments = payments.filter(p => {
        const applicant = `${p.first_name || ''} ${p.surname || ''}`.toLowerCase();
        const ref = (p.transaction_id || '').toLowerCase();
        return applicant.includes(searchTerm.toLowerCase()) || ref.includes(searchTerm.toLowerCase());
    });

    return (
        <div style={{ color: 'rgb\(18 37 74\)' }}>
            <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                marginBottom: '2rem',
                gap: '1rem'
            }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <CreditCard color="#10b981" /> Transaction Records
                    </h2>
                    <p style={{ color: '#94a3b8' }}>Monitor all payment attempts and completed filing fees</p>
                </div>

                <div style={{ position: 'relative', width: isMobile ? '100%' : '300px' }}>
                    <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#778eaeff' }} size={18} />
                    <input
                        type="text"
                        placeholder="Search by applicant or Ref..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 12px 12px 40px',
                            background: 'rgb\(18 37 74\)',
                            border: '1px solid #334155',
                            borderRadius: '12px',
                            color: 'white',
                            outline: 'none'
                        }}
                    />
                </div>
            </div>

            <div className="glass-card" style={{ background: 'rgb\(18 37 74\)', border: 'none', padding: '1rem', color: 'white' }}>
                <DataTable
                    dark
                    columns={[
                        {
                            key: 'transaction_id',
                            label: 'Reference',
                            render: (val) => (
                                <span style={{ fontFamily: 'monospace', color: '#3b82f6', fontWeight: 'bold' }}>{val || 'N/A'}</span>
                            )
                        },
                        {
                            key: 'applicant',
                            label: 'Applicant',
                            render: (_, row) => (
                                <div>
                                    <div style={{ fontWeight: '600', textTransform: 'capitalize' }}>{row.first_name} {row.surname}</div>
                                    <div style={{ fontSize: '11px', color: '#778eaeff' }}>{row.email}</div>
                                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>{row.phone}</div>
                                </div>
                            )
                        },
                        {
                            key: 'item_paid',
                            label: 'Application Type',
                            render: (val, row) => (
                                <div>
                                    <div style={{ fontSize: '13px' }}>{val}</div>
                                    <div style={{ fontSize: '11px', color: '#778eaeff' }}>
                                        {row.affidavit_title ? `(OADR: ${row.affidavit_title})` : (row.deceased_name ? <span style={{ textTransform: 'capitalize' }}>{`(Probate: ${row.deceased_name})`}</span> : '')}
                                    </div>
                                </div>
                            )
                        },
                        {
                            key: 'amount',
                            label: 'Amount',
                            render: (val) => <span style={{ fontWeight: 'bold' }}>₦{parseFloat(val).toLocaleString()}</span>
                        },
                        {
                            key: 'payment_status',
                            label: 'Status',
                            render: (val) => (
                                <div style={{
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    background: val === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    color: val === 'completed' ? '#10b981' : '#ef4444',
                                    display: 'inline-block'
                                }}>
                                    {val}
                                </div>
                            )
                        },
                        {
                            key: 'payment_date',
                            label: 'Date',
                            render: (val) => formatDate(val)
                        }
                    ]}
                    data={filteredPayments}
                    loading={loading}
                    actions={(row) => (
                        <button
                            onClick={() => generatePaymentReceiptPDF({
                                user: {
                                    first_name: row.first_name,
                                    surname: row.surname,
                                    email: row.email,
                                    phone: row.phone,
                                    address: row.address,
                                    nin: row.nin,
                                    gender: row.gender,
                                    age: row.age
                                },
                                payment: {
                                    ...row,
                                    payment_date: row.payment_date || row.created_at
                                }
                            })}
                            style={{
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                fontSize: '11px',
                                fontWeight: 'bold'
                            }}
                        >
                            <Download size={14} />
                            Receipt
                        </button>
                    )}
                />
            </div>
        </div>
    );
};

export default PaymentManager;
