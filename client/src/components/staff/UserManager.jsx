import React, { useState, useEffect } from 'react';
import { formatDate } from '../../utils/dateUtils';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Power, Trash2, Edit2, Search, X, Loader2,
    Shield, Mail, Phone, MapPin, Calendar, CheckCircle,
    UserCircle, Filter, Download, MoreVertical
} from 'lucide-react';
import api from '../../utils/api';
import { useModal } from '../../context/ModalContext';
import DataTable from '../common/DataTable';

const UserManager = ({ isMobile }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const { showModal } = useModal();

    useEffect(() => {
        fetchUsers();
    }, []);


    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Failed to load public users';
            showModal({
                type: 'error',
                title: 'Error Loading Users',
                message: `${errorMsg}. Please refresh the page.`
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (user) => {
        setEditingUser({ ...user });
        setShowEditModal(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.put(`/admin/users/${editingUser.id}`, editingUser);
            showModal({
                type: 'success',
                title: 'User Updated',
                message: `${editingUser.first_name} ${editingUser.surname} has been updated successfully.`
            });
            setShowEditModal(false);
            fetchUsers();
        } catch (error) {
            showModal({
                type: 'error',
                title: 'Update Failed',
                message: error.response?.data?.error || 'Failed to update user.'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const toggleStatus = async (user) => {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        try {
            await api.put(`/admin/users/${user.id}`, {
                ...user,
                status: newStatus
            });

            showModal({
                type: 'success',
                title: 'Status Updated',
                message: `${user.first_name}'s account is now ${newStatus}.`
            });
            fetchUsers();
        } catch (error) {
            showModal({
                type: 'error',
                title: 'Status Update Failed',
                message: 'Failed to update user status.'
            });
        }
    };

    const handleDelete = (user) => {
        showModal({
            type: 'warning',
            title: 'Delete User Account',
            message: `Are you sure you want to permanently delete the account for ${user.first_name} ${user.surname}? This action cannot be undone.`,
            confirmText: 'Delete Permanently',
            cancelText: 'Cancel',
            showCancel: true,
            onConfirm: async () => {
                try {
                    await api.delete(`/admin/users/${user.id}`);
                    showModal({
                        type: 'success',
                        title: 'User Deleted',
                        message: 'The user account has been removed.'
                    });
                    fetchUsers();
                } catch (error) {
                    showModal({
                        type: 'error',
                        title: 'Deletion Failed',
                        message: 'Failed to delete user account.'
                    });
                }
            }
        });
    };

    const filteredUsers = users.filter(user => {
        const fullName = `${user.first_name || ''} ${user.surname || ''}`.toLowerCase();
        const email = (user.email || '').toLowerCase();
        const search = searchTerm.toLowerCase();

        return fullName.includes(search) ||
            email.includes(search) ||
            (user.phone && user.phone.includes(searchTerm));
    });

    return (
        <div className="glass-card" style={{ background: 'rgb\(18 37 74\)', border: 'none', color: 'white', overflow: 'hidden' }}>
            {/* Header Section */}
            <div style={{ padding: isMobile ? '1.5rem' : '2rem', borderBottom: '1px solid #334155', background: 'rgba(30, 41, 59, 0.5)' }}>
                <div style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: 'space-between',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    marginBottom: '2rem',
                    gap: '1rem'
                }}>
                    <div>
                        <h2 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: isMobile ? '1.4rem' : '1.8rem' }}>
                            <Users size={isMobile ? 24 : 28} color="#3b82f6" /> User Management
                        </h2>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>
                            Comprehensive list of all registered portal users
                        </p>
                    </div>
                </div>

                {/* Filters and Search */}
                <div style={{ display: 'flex', gap: '1rem', flexDirection: isMobile ? 'column' : 'row' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#778eaeff' }} size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, email or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 40px',
                                background: '#0f172a',
                                border: '1px solid #334155',
                                borderRadius: '10px',
                                color: 'white',
                                outline: 'none',
                                transition: 'all 0.3s'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', width: isMobile ? '100%' : 'auto' }}>
                        <button className="btn" style={{ flex: 1, background: '#334155', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <Filter size={18} /> {isMobile ? 'Filter' : 'Filter Status'}
                        </button>
                        <button className="btn" style={{ flex: 1, background: '#334155', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <Download size={18} /> {isMobile ? 'Export' : 'Export CSV'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div style={{ padding: '1.5rem' }}>
                <DataTable
                    dark
                    columns={[
                        {
                            key: 'first_name',
                            label: 'Deponent',
                            sortable: true,
                            render: (val, row) => (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                        {val?.[0]}{row.surname?.[0]}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600', color: '#f1f5f9', textTransform: 'capitalize' }}>{val} {row.surname}</div>
                                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{row.email}</div>
                                    </div>
                                </div>
                            )
                        },
                        {
                            key: 'phone',
                            label: 'Contact',
                            render: (val, row) => (
                                <div style={{ fontSize: '13px' }}>
                                    <div>{val || 'N/A'}</div>
                                    <div style={{ color: '#778eaeff', fontSize: '11px' }}>NIN: {row.nin || 'Not Provided'}</div>
                                </div>
                            )
                        },
                        {
                            key: 'status',
                            label: 'Status',
                            sortable: true,
                            render: (val) => (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: val === 'active' ? '#10b981' : '#ef4444' }} />
                                    <span style={{ color: val === 'active' ? '#10b981' : '#ef4444', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>{val}</span>
                                </div>
                            )
                        },
                        {
                            key: 'created_at',
                            label: 'Joined',
                            sortable: true,
                            render: (val) => formatDate(val)
                        }
                    ]}
                    data={filteredUsers}
                    loading={loading}
                    searchPlaceholder="Search deponents by name, email or phone..."
                    actions={(row) => (
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => handleEdit(row)}
                                style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                            >
                                <Edit2 size={18} />
                            </button>
                            <button
                                onClick={() => toggleStatus(row)}
                                style={{ padding: '8px', background: row.status === 'active' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: row.status === 'active' ? '#f59e0b' : '#10b981', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                            >
                                <Power size={18} />
                            </button>
                            <button
                                onClick={() => handleDelete(row)}
                                style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    )}
                />
            </div>

            {/* Edit User Modal */}
            < AnimatePresence >
                {showEditModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', zIndex: 2000, padding: '1rem'
                        }}
                        onClick={() => !submitting && setShowEditModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: 'rgb\(18 37 74\)', borderRadius: '20px', padding: isMobile ? '1.5rem' : '2.5rem',
                                maxWidth: '700px', width: '100%', border: '1px solid #334155',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                maxHeight: '95vh', overflowY: 'auto'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.5rem' }}>Edit User Profile</h3>
                                <button onClick={() => setShowEditModal(false)} style={{ background: 'transparent', border: 'none', color: '#778eaeff', cursor: 'pointer' }}>
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleUpdate}>
                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '1rem' : '1.5rem' }}>
                                    <div style={{ gridColumn: 'span 1' }}>
                                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>First Name</label>
                                        <input
                                            type="text"
                                            value={editingUser.first_name}
                                            onChange={(e) => setEditingUser({ ...editingUser, first_name: e.target.value })}
                                            style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}
                                        />
                                    </div>
                                    <div style={{ gridColumn: 'span 1' }}>
                                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Surname</label>
                                        <input
                                            type="text"
                                            value={editingUser.surname}
                                            onChange={(e) => setEditingUser({ ...editingUser, surname: e.target.value })}
                                            style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}
                                        />
                                    </div>
                                    <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
                                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Email Address</label>
                                        <input
                                            type="email"
                                            value={editingUser.email}
                                            onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                                            style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}
                                        />
                                    </div>
                                    <div style={{ gridColumn: 'span 1' }}>
                                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Phone Number</label>
                                        <input
                                            type="text"
                                            value={editingUser.phone}
                                            onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                                            style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}
                                        />
                                    </div>
                                    <div style={{ gridColumn: 'span 1' }}>
                                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Status</label>
                                        <select
                                            value={editingUser.status}
                                            onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                                            style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>
                                    <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
                                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Home Address</label>
                                        <textarea
                                            value={editingUser.address}
                                            onChange={(e) => setEditingUser({ ...editingUser, address: e.target.value })}
                                            style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', minHeight: '80px', resize: 'vertical' }}
                                        />
                                    </div>
                                    <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
                                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Identity / NIN</label>
                                        <input
                                            type="text"
                                            value={editingUser.nin}
                                            onChange={(e) => setEditingUser({ ...editingUser, nin: e.target.value })}
                                            style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        style={{ flex: 1, padding: '14px', borderRadius: '10px', background: 'transparent', border: '1px solid #334155', color: '#cbd5e1', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="btn btn-primary"
                                        style={{ flex: 1, padding: '14px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                    >
                                        {submitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence >
        </div >
    );
};

export default UserManager;
