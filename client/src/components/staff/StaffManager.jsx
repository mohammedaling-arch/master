import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    UserPlus, Power, Trash2, Edit2, Upload, X, Loader2,
    Shield, Eye, EyeOff, CheckCircle, AlertCircle, PenTool, Key
} from 'lucide-react';
import api from '../../utils/api';
import { useModal } from '../../context/ModalContext';
import DataTable from '../common/DataTable';

const StaffManager = ({ isMobile }) => {
    const [staff, setStaff] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editMode, setEditMode] = useState(false);

    const [formData, setFormData] = useState({
        id: null,
        name: '',
        email: '',
        role_id: '',
        division: '',
        status: 'active'
    });
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingSignature, setUploadingSignature] = useState(null);
    const { showModal } = useModal();

    useEffect(() => {
        fetchStaff();
        fetchRoles();
    }, []);

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const res = await api.get('/staff');
            setStaff(res.data);
        } catch (error) {
            console.error('Error fetching staff:', error);
            const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message;
            showModal({
                type: 'error',
                title: 'Error Loading Staff',
                message: `Could not load staff users: ${errorMsg}`
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const res = await api.get('/roles');
            setRoles(res.data);
        } catch (error) {
            console.error('Error fetching roles:', error);
            showModal({
                type: 'error',
                title: 'Error Loading Roles',
                message: 'Could not load roles. Using defaults.'
            });
        }
    };

    const resetForm = () => {
        setFormData({
            id: null,
            name: '',
            email: '',
            role_id: roles.length > 0 ? roles[0].id : '',
            division: '',
            status: 'active'
        });
        setEditMode(false);
        setShowForm(false);
        setShowPassword(false);
    };

    const handleEdit = (staffMember) => {
        setFormData({
            id: staffMember.id,
            name: staffMember.name,
            email: staffMember.email,
            role_id: staffMember.role_id || '',
            division: staffMember.division || '',
            status: staffMember.status
        });
        setEditMode(true);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (editMode) {
                // Update existing staff
                const updateData = { ...formData };
                if (!updateData.password) {
                    delete updateData.password; // Don't send empty password
                }

                await api.put(`/staff/${formData.id}`, updateData);

                showModal({
                    type: 'success',
                    title: 'Staff Updated',
                    message: `${formData.name} has been updated successfully.`
                });
            } else {
                // Create new staff
                await api.post('/staff', formData);

                showModal({
                    type: 'success',
                    title: 'Staff Created',
                    message: `${formData.name} has been added successfully.`
                });
            }

            resetForm();
            fetchStaff();
        } catch (error) {
            console.error('Error saving staff:', error);
            showModal({
                type: 'error',
                title: editMode ? 'Update Failed' : 'Creation Failed',
                message: error.response?.data?.error || 'An error occurred. Please try again.'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (staffMember) => {
        showModal({
            type: 'warning',
            title: 'Delete Staff User',
            message: `Are you sure you want to delete ${staffMember.name}? This action cannot be undone.`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            showCancel: true,
            onConfirm: async () => {
                try {
                    await api.delete(`/staff/${staffMember.id}`);
                    showModal({
                        type: 'success',
                        title: 'Staff Deleted',
                        message: `${staffMember.name} has been removed successfully.`
                    });
                    fetchStaff();
                } catch (error) {
                    showModal({
                        type: 'error',
                        title: 'Deletion Failed',
                        message: error.response?.data?.error || 'Failed to delete staff user.'
                    });
                }
            }
        });
    };

    const handleResetPassword = (staffMember) => {
        showModal({
            type: 'warning',
            title: 'Reset Staff Password',
            message: `Are you sure you want to reset the password for ${staffMember.name}? A new 6-digit password will be generated and sent to ${staffMember.email}.`,
            confirmText: 'Reset Password',
            cancelText: 'Cancel',
            showCancel: true,
            onConfirm: async () => {
                try {
                    await api.post(`/staff/${staffMember.id}/reset-password`);
                    showModal({
                        type: 'success',
                        title: 'Password Reset',
                        message: `A new temporary password has been sent to ${staffMember.email}.`
                    });
                    fetchStaff();
                } catch (error) {
                    showModal({
                        type: 'error',
                        title: 'Reset Failed',
                        message: error.response?.data?.error || 'Failed to reset password.'
                    });
                }
            }
        });
    };

    const toggleStatus = async (staffMember) => {
        const newStatus = staffMember.status === 'active' ? 'inactive' : 'active';

        try {
            await api.put(`/staff/${staffMember.id}`, {
                ...staffMember,
                status: newStatus
            });

            showModal({
                type: 'success',
                title: 'Status Updated',
                message: `${staffMember.name} is now ${newStatus}.`
            });

            fetchStaff();
        } catch (error) {
            showModal({
                type: 'error',
                title: 'Update Failed',
                message: 'Failed to update staff status.'
            });
        }
    };

    const handleSignatureUpload = async (staffId, file) => {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showModal({
                type: 'error',
                title: 'Invalid File',
                message: 'Please upload an image file (PNG, JPG, etc.)'
            });
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showModal({
                type: 'error',
                title: 'File Too Large',
                message: 'Signature image must be less than 2MB'
            });
            return;
        }

        setUploadingSignature(staffId);

        try {
            const formData = new FormData();
            formData.append('signature', file);

            await api.post(`/staff/${staffId}/signature`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            showModal({
                type: 'success',
                title: 'Signature Uploaded',
                message: 'Signature has been uploaded successfully.'
            });

            fetchStaff();
        } catch (error) {
            showModal({
                type: 'error',
                title: 'Upload Failed',
                message: error.response?.data?.error || 'Failed to upload signature.'
            });
        } finally {
            setUploadingSignature(null);
        }
    };

    const getRoleBadgeColor = (role) => {
        const colors = {
            admin: '#ef4444',
            cr: '#8b5cf6',
            registrar: '#3b82f6',
            pr: '#3b82f6',
            cfo: '#f59e0b',
            jurat: '#10b981'
        };
        return colors[role] || '#778eaeff';
    };

    const getRoleLabel = (role) => {
        const labels = {
            admin: 'Super Admin',
            cr: 'Chief Registrar',
            registrar: 'Registrar',
            pr: 'Probate Registrar',
            cfo: 'Commissioner for Oaths',
            jurat: 'Jurat Officer'
        };
        return labels[role] || role;
    };

    return (
        <div className="glass-card" style={{ background: 'rgb\(18 37 74\)', border: 'none', color: 'white', padding: isMobile ? '1rem' : '2rem' }}>
            <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                marginBottom: '2rem',
                gap: '1.5rem'
            }}>
                <div>
                    <h2 style={{ margin: '0 0 0.5rem 0', fontSize: isMobile ? '1.5rem' : '1.8rem' }}>Staff Management</h2>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>
                        Manage staff accounts and permissions
                    </p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        resetForm();
                        setShowForm(true);
                    }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        width: isMobile ? '100%' : 'auto',
                        justifyContent: 'center'
                    }}
                >
                    <UserPlus size={18} /> Add Staff
                </button>
            </div>

            {/* Add/Edit Form Modal */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.8)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                            padding: '1rem'
                        }}
                        onClick={() => !submitting && resetForm()}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: 'rgb\(18 37 74\)',
                                borderRadius: '16px',
                                padding: isMobile ? '1.5rem' : '2.5rem',
                                maxWidth: '600px',
                                width: '100%',
                                maxHeight: '95vh',
                                overflowY: 'auto',
                                border: '1px solid #334155',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: 0 }}>{editMode ? 'Edit Staff User' : 'Add New Staff User'}</h3>
                                <button
                                    onClick={resetForm}
                                    disabled={submitting}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#94a3b8',
                                        cursor: submitting ? 'not-allowed' : 'pointer',
                                        padding: '0.5rem'
                                    }}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '14px' }}>
                                            Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: '1px solid #334155',
                                                background: '#0f172a',
                                                color: 'white',
                                                outline: 'none'
                                            }}
                                            placeholder="Enter full name"
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '14px' }}>
                                            Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: '1px solid #334155',
                                                background: '#0f172a',
                                                color: 'white',
                                                outline: 'none'
                                            }}
                                            placeholder="staff@example.com"
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '14px' }}>
                                            Division / Unit
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.division}
                                            onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: '1px solid #334155',
                                                background: '#0f172a',
                                                color: 'white',
                                                outline: 'none'
                                            }}
                                            placeholder="e.g. Accounts, Registry"
                                        />
                                    </div>



                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '14px' }}>
                                            Role *
                                        </label>
                                        <select
                                            required
                                            value={formData.role_id}
                                            onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: '1px solid #334155',
                                                background: '#0f172a',
                                                color: 'white',
                                                outline: 'none'
                                            }}
                                        >
                                            <option value="">Select a role...</option>
                                            {roles.map(role => (
                                                <option key={role.id} value={role.id}>
                                                    {role.display_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '14px' }}>
                                            Status *
                                        </label>
                                        <select
                                            required
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: '1px solid #334155',
                                                background: '#0f172a',
                                                color: 'white',
                                                outline: 'none'
                                            }}
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            disabled={submitting}
                                            style={{
                                                flex: 1,
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: '1px solid #334155',
                                                background: 'transparent',
                                                color: '#94a3b8',
                                                cursor: submitting ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="btn btn-primary"
                                            style={{
                                                flex: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.5rem',
                                                opacity: submitting ? 0.6 : 1,
                                                cursor: submitting ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            {submitting ? (
                                                <>
                                                    <Loader2 size={18} className="animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle size={18} />
                                                    {editMode ? 'Update Staff' : 'Create Staff'}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Staff Table */}
            <DataTable
                dark
                columns={[
                    {
                        key: 'name',
                        label: 'Staff Member',
                        sortable: true,
                        render: (val, row) => (
                            <div>
                                <div style={{ fontWeight: '600', textTransform: 'capitalize' }}>{val}</div>
                                <div style={{ fontSize: '12px', color: '#778eaeff' }}>{row.email}</div>
                            </div>
                        )
                    },
                    {
                        key: 'division',
                        label: 'Division',
                        render: (val) => val || <span style={{ color: '#778eaeff', fontStyle: 'italic' }}>-</span>
                    },
                    {
                        key: 'role_display_name',
                        label: 'Role',
                        sortable: true,
                        render: (val, row) => (
                            <span style={{
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '11px',
                                fontWeight: '600',
                                background: getRoleBadgeColor(row.role),
                                color: 'white',
                                textTransform: 'uppercase'
                            }}>{val || row.role}</span>
                        )
                    },
                    {
                        key: 'status',
                        label: 'Status',
                        sortable: true,
                        render: (val) => (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: val === 'active' ? '#10b981' : '#ef4444' }} />
                                <span style={{ color: val === 'active' ? '#10b981' : '#ef4444', fontSize: '14px', textTransform: 'capitalize' }}>{val}</span>
                            </div>
                        )
                    },
                    {
                        key: 'force_password_change',
                        label: 'Reset Status',
                        sortable: true,
                        render: (val) => (
                            <span style={{
                                color: val ? '#f59e0b' : '#94a3b8',
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem'
                            }}>
                                {val ? (
                                    <>
                                        <AlertCircle size={14} />
                                        Pending Reset
                                    </>
                                ) : 'Updated'}
                            </span>
                        )
                    },
                    {
                        key: 'signature_path',
                        label: 'Signature',
                        render: (val, row) => (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {val ? (
                                    <img src={val.startsWith('http') ? val : `${api.defaults.baseURL.replace('/api', '')}${val}`} alt="Sig" style={{ height: '30px', background: 'white', padding: '2px', borderRadius: '4px' }} />
                                ) : <span style={{ color: '#94a3b8', fontSize: '12px' }}>No Signature</span>}
                                <label style={{ color: '#3b82f6', fontSize: '12px', cursor: 'pointer' }}>
                                    {uploadingSignature === row.id ? '...' : 'Upload'}
                                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleSignatureUpload(row.id, e.target.files[0])} />
                                </label>
                            </div>
                        )
                    }
                ]}
                data={staff}
                loading={loading}
                searchPlaceholder="Search staff by name, email or role..."
                actions={(row) => (
                    <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleResetPassword(row)} title="Reset Password" style={{ padding: '0.5rem', background: 'transparent', border: 'none', color: '#8b5cf6', cursor: 'pointer' }}>
                            <Key size={18} />
                        </button>
                        <button onClick={() => handleEdit(row)} title="Edit Staff" style={{ padding: '0.5rem', background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer' }}>
                            <Edit2 size={18} />
                        </button>
                        <button onClick={() => toggleStatus(row)} title="Toggle Status" style={{ padding: '0.5rem', background: 'transparent', border: 'none', color: row.status === 'active' ? '#f59e0b' : '#10b981', cursor: 'pointer' }}>
                            <Power size={18} />
                        </button>
                        <button onClick={() => handleDelete(row)} title="Delete Staff" style={{ padding: '0.5rem', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                            <Trash2 size={18} />
                        </button>
                    </div>
                )}
            />
        </div>
    );
};

export default StaffManager;
