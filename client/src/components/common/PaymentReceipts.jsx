import React, { useState, useEffect } from 'react';
import { formatDate } from '../../utils/dateUtils';
import { motion } from 'framer-motion';
import { Download, CreditCard, Search, Calendar, FileText, Loader2, AlertCircle } from 'lucide-react';
import api from '../../utils/api';
import DataTable from './DataTable';
import { generatePaymentReceiptPDF } from '../../utils/pdfGenerator';

const PaymentReceipts = ({ user, isMobile, staffMode = false }) => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user?.id || staffMode) fetchPayments();
    }, [user?.id, staffMode]);

    const fetchPayments = async () => {
        setLoading(true);
        setError(null);
        try {
            const endpoint = staffMode ? '/staff/payments/all' : `/payments/user/${user.id}`;
            const res = await api.get(endpoint);
            setPayments(res.data);
        } catch (err) {
            console.error("Error fetching payments:", err);
            setError("Failed to load payment history.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (payment) => {
        await generatePaymentReceiptPDF({ user, payment });
    };

    const columns = [
        {
            key: 'payment_date',
            label: 'Date',
            sortable: true,
            render: (val) => formatDate(val)
        },
        {
            key: 'transaction_id',
            label: 'Reference',
            render: (val) => <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{val}</span>,
            hiddenMobile: true
        },
        {
            key: 'item_paid',
            label: 'Purpose',
            render: (val, row) => (
                <div>
                    <div style={{ fontWeight: '600' }}>{val}</div>
                    <div style={{ fontSize: '11px', color: '#778eaeff' }}>
                        {row.affidavit_title || row.deceased_name || 'Service Payment'}
                    </div>
                </div>
            )
        },
        {
            key: 'amount',
            label: 'Amount',
            sortable: true,
            render: (val) => <span style={{ fontWeight: 'bold', color: 'rgb\(18 37 74\)' }}>₦{parseFloat(val).toLocaleString()}</span>
        },
        {
            key: 'payment_status',
            label: 'Status',
            render: (val) => (
                <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    background: val === 'completed' ? '#ecfdf5' : '#fffbeb',
                    color: val === 'completed' ? '#10b981' : '#f59e0b',
                    textTransform: 'uppercase'
                }}>{val}</span>
            )
        }
    ];

    if (loading) return (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
            <Loader2 className="animate-spin" size={40} color="#3d2b1f" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: '#778eaeff' }}>Fetching your payment records...</p>
        </div>
    );

    if (error) return (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
            <AlertCircle size={40} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: '#ef4444' }}>{error}</p>
            <button onClick={fetchPayments} style={{ marginTop: '1rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Retry</button>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card"
            style={{ background: 'white', padding: isMobile ? '1rem' : '2rem' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: isMobile ? '1.25rem' : '1.5rem', color: '#3d2b1f', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <CreditCard /> Payment History
                    </h2>
                    <p style={{ margin: '4px 0 0', color: '#778eaeff', fontSize: '14px' }}>View and download your official payment receipts.</p>
                </div>
            </div>

            {payments.length > 0 ? (
                <DataTable
                    columns={columns}
                    data={payments}
                    isMobile={isMobile}
                    searchPlaceholder="Search transactions..."
                    actions={(row) => (
                        <button
                            onClick={() => handleDownload(row)}
                            title="Download Receipt"
                            style={{
                                background: '#3d2b1f',
                                color: 'white',
                                border: 'none',
                                padding: '8px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'transform 0.2s',
                                fontSize: '12px',
                                fontWeight: 'bold'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <Download size={16} />
                            {!isMobile && "Download Receipt"}
                        </button>
                    )}
                />
            ) : (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
                    <div style={{ width: '64px', height: '64px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                        <FileText size={32} color="#94a3b8" />
                    </div>
                    <h3 style={{ margin: '0 0 0.5rem', color: 'rgb\(18 37 74\)' }}>No Payments Found</h3>
                    <p style={{ color: '#778eaeff', maxWidth: '300px', margin: '0 auto 1.5rem' }}>You haven't made any payments yet. Records of your filings and applications will appear here.</p>
                </div>
            )}
        </motion.div>
    );
};

export default PaymentReceipts;
