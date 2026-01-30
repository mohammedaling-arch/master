import React, { createContext, useContext, useState, useCallback } from 'react';
import GlobalModal from '../components/common/GlobalModal';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [modalProps, setModalProps] = useState({
        type: 'info',
        title: '',
        message: '',
        onConfirm: null,
        confirmText: 'OK',
        cancelText: 'Cancel',
        showCancel: false,
        showInput: false,
        inputPlaceholder: '',
        inputType: 'text'
    });

    const showModal = useCallback(({
        type = 'info',
        title,
        message,
        onConfirm,
        confirmText = 'OK',
        cancelText = 'Cancel',
        showCancel = false,
        showInput = false,
        inputPlaceholder = '',
        inputType = 'text'
    }) => {
        setModalProps({
            type,
            title,
            message,
            onConfirm,
            confirmText,
            cancelText,
            showCancel,
            showInput,
            inputPlaceholder,
            inputType
        });
        setIsOpen(true);
    }, []);

    const hideModal = useCallback(() => {
        setIsOpen(false);
    }, []);

    return (
        <ModalContext.Provider value={{ showModal, hideModal }}>
            {children}
            <GlobalModal
                isOpen={isOpen}
                onClose={hideModal}
                {...modalProps}
            />
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};
