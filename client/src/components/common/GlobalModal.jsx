import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react';

const GlobalModal = ({
    isOpen,
    onClose,
    type = 'info',
    title,
    message,
    onConfirm,
    confirmText = 'OK',
    cancelText = 'Cancel',
    showCancel = false,
    showInput = false,
    inputPlaceholder = 'Type here...',
    inputType = 'text'
}) => {
    const [inputValue, setInputValue] = React.useState('');

    React.useEffect(() => {
        if (isOpen) setInputValue('');
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (onConfirm) onConfirm(inputValue);
        onClose();
    };

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle size={48} color="#10b981" />; // emerald-500
            case 'error':
                return <XCircle size={48} color="#f43f5e" />; // rose-500
            case 'warning':
                return <AlertCircle size={48} color="#f59e0b" />; // amber-500
            default:
                return <Info size={48} color="#3b82f6" />; // blue-500
        }
    };

    const getButtonStyles = (isConfirm) => {
        const baseStyle = {
            padding: '10px 24px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'transform 0.1s',
        };

        if (!isConfirm) {
            return {
                ...baseStyle,
                background: 'white',
                border: '1px solid #e2e8f0',
                color: '#778eaeff',
            };
        }

        let bg = '#3b82f6';
        if (type === 'success') bg = '#10b981';
        if (type === 'error') bg = '#f43f5e';
        if (type === 'warning') bg = '#f59e0b';

        return {
            ...baseStyle,
            background: bg,
            color: 'white',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        };
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 9999,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(4px)',
                    padding: '1rem'
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            background: 'white',
                            borderRadius: '16px',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                            width: '100%',
                            maxWidth: '450px',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Header with Close Button */}
                        <button
                            onClick={onClose}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#94a3b8'
                            }}
                        >
                            <X size={20} />
                        </button>

                        <div style={{ padding: '2.5rem 2rem 2rem', textAlign: 'center' }}>
                            {/* Icon */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                marginBottom: '1.5rem'
                            }}>
                                <div style={{
                                    padding: '1rem',
                                    borderRadius: '50%',
                                    background: type === 'success' ? '#ecfdf5' :
                                        type === 'error' ? '#fff1f2' :
                                            type === 'warning' ? '#fffbeb' : '#eff6ff'
                                }}>
                                    {getIcon()}
                                </div>
                            </div>

                            {/* Content */}
                            <h3 style={{
                                margin: '0 0 0.75rem',
                                fontSize: '1.5rem',
                                fontWeight: '700',
                                color: 'rgb\(18 37 74\)'
                            }}>
                                {title}
                            </h3>
                            <p style={{
                                color: '#778eaeff',
                                marginBottom: showInput ? '1rem' : '2rem',
                                lineHeight: '1.6',
                                fontSize: '15px'
                            }}>
                                {message}
                            </p>

                            {showInput && (
                                <div style={{ marginBottom: '2rem' }}>
                                    {inputType === 'textarea' ? (
                                        <textarea
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            placeholder={inputPlaceholder}
                                            autoFocus
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: '1px solid #e2e8f0',
                                                fontSize: '14px',
                                                fontFamily: 'inherit',
                                                minHeight: '100px',
                                                resize: 'vertical',
                                                outline: 'none',
                                                boxSizing: 'border-box'
                                            }}
                                        />
                                    ) : (
                                        <input
                                            type={inputType}
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            placeholder={inputPlaceholder}
                                            autoFocus
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: '1px solid #e2e8f0',
                                                fontSize: '14px',
                                                outline: 'none',
                                                boxSizing: 'border-box'
                                            }}
                                        />
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                {showCancel && (
                                    <button
                                        onClick={() => {
                                            if (onClose) onClose();
                                        }}
                                        style={getButtonStyles(false)}
                                    >
                                        {cancelText}
                                    </button>
                                )}
                                <button
                                    onClick={handleConfirm}
                                    style={getButtonStyles(true)}
                                >
                                    {confirmText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default GlobalModal;
