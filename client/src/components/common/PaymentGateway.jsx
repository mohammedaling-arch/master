import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../utils/api';

const PaymentGateway = ({
    amount,
    onSuccess,
    onCancel,
    metadata = {},
    user,
    itemDescription = "Legal Document Fee"
}) => {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/settings');
                setSettings(res.data);
            } catch (err) {
                console.error("Failed to load payment settings", err);
                setError("Could not load payment configuration.");
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    // Load External Scripts
    useEffect(() => {
        if (!loading) {
            if (settings.paystack_enabled === '1') {
                const script = document.createElement("script");
                script.src = "https://js.paystack.co/v1/inline.js";
                script.async = true;
                document.body.appendChild(script);
            }
            // Add Remita script here if they have an inline one
        }
    }, [loading, settings]);

    const handlePaystack = () => {
        setError(null);
        if (!window.PaystackPop) {
            setError("Paystack is currently unavailable. Please reload.");
            return;
        }

        const handler = window.PaystackPop.setup({
            key: settings.paystack_public_key,
            email: user.email,
            amount: Math.round(amount * 100), // convert to kobo
            currency: "NGN",
            ref: `CRMS-${new Date().getTime()}-${Math.floor(Math.random() * 1000)}`,
            metadata: {
                custom_fields: [
                    {
                        display_name: "Item",
                        variable_name: "item",
                        value: itemDescription
                    },
                    ...Object.keys(metadata).map(key => ({
                        display_name: key,
                        variable_name: key,
                        value: metadata[key]
                    }))
                ]
            },
            callback: (response) => {
                console.log("Paystack Success:", response);
                onSuccess({
                    gateway: 'paystack',
                    reference: response.reference,
                    transaction_id: response.transaction,
                    status: 'completed'
                });
            },
            onClose: () => {
                console.log("Paystack Closed");
            }
        });
        handler.openIframe();
    };

    const handleRemita = () => {
        // Simple implementation for Remita: usually involves generating RRR first
        // For this task, we will simulate the RRR generation or use their inline if possible
        setError("Remita integration is currently being finalized. Please use Paystack.");

        // Example logic for Remita (Simulated for now)
        /*
        const rrr = "1234-5678-9012"; 
        onSuccess({
            gateway: 'remita',
            reference: rrr,
            status: 'completed'
        });
        */
    };

    if (loading) return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto' }} />
            <p>Initializing Secure Payment...</p>
        </div>
    );

    const isAnyPaymentEnabled = settings.paystack_enabled === '1' || settings.remita_enabled === '1';

    return (
        <div style={{ padding: '1.5rem', background: 'white', borderRadius: '16px' }}>
            <h3 style={{ margin: '0 0 0.5rem', textAlign: 'center' }}>Choose Payment Method</h3>
            <p style={{ color: '#778eaeff', textAlign: 'center', marginBottom: '2rem', fontSize: '14px' }}>
                Securely pay <strong>₦{Number(amount).toLocaleString()}</strong>
            </p>

            {error && (
                <div style={{ padding: '12px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {!isAnyPaymentEnabled && (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#d97706' }}>
                    <AlertCircle size={32} style={{ margin: '0 auto 1rem' }} />
                    <p>No payment gateways are currently active. Please contact support.</p>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {settings.paystack_enabled === '1' && (
                    <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handlePaystack}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '1.25rem',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            background: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img src="https://paystack.com/favicon.png" alt="Paystack" style={{ width: '24px' }} />
                            <div style={{ textAlign: 'left' }}>
                                <span style={{ fontWeight: '700', display: 'block' }}>Pay with Paystack</span>
                                <span style={{ fontSize: '12px', color: '#778eaeff' }}>Cards, Bank, USSD, Transfer</span>
                            </div>
                        </div>
                        <CreditCard size={20} color="#3b82f6" />
                    </motion.button>
                )}

                {settings.remita_enabled === '1' && (
                    <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleRemita}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '1.25rem',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            background: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '24px', height: '24px', background: '#e11d48', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '14px' }}>R</div>
                            <div style={{ textAlign: 'left' }}>
                                <span style={{ fontWeight: '700', display: 'block' }}>Pay with Remita</span>
                                <span style={{ fontSize: '12px', color: '#778eaeff' }}>RRR, Government Channels</span>
                            </div>
                        </div>
                        <CreditCard size={20} color="#e11d48" />
                    </motion.button>
                )}
            </div>

            <button
                type="button"
                onClick={onCancel}
                style={{
                    width: '100%',
                    marginTop: '2rem',
                    padding: '1rem',
                    background: '#f8fafc',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#778eaeff',
                    fontWeight: '600',
                    cursor: 'pointer'
                }}
            >
                Cancel Payment
            </button>
        </div>
    );
};

export default PaymentGateway;
