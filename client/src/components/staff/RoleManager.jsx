import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, X, Shield, AlertCircle } from 'lucide-react';
import { useModal } from '../../context/ModalContext';

const RoleManager = ({ isMobile = false }) => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        display_name: '',
        description: ''
    });
    const { showModal } = useModal();

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            setLoading(true);
            const res = await api.get('/roles');
            setRoles(res.data);
        } catch (error) {
            showModal({
                type: 'error',
                title: 'Error',
                message: 'Failed to load roles: ' + (error.response?.data?.error || error.message)
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingRole) {
                await api.put(`/roles/${editingRole.id}`, {
                    display_name: formData.display_name,
                    description: formData.description
                });
                showModal({
                    type: 'success',
                    title: 'Success',
                    message: 'Role updated successfully'
                });
            } else {
                await api.post('/roles', formData);
                showModal({
                    type: 'success',
                    title: 'Success',
                    message: 'Role created successfully'
                });
            }
            fetchRoles();
            resetForm();
        } catch (error) {
            showModal({
                type: 'error',
                title: 'Error',
                message: error.response?.data?.error || 'Failed to save role'
            });
        }
    };

    const handleDelete = async (role) => {
        showModal({
            type: 'confirm',
            title: 'Delete Role',
            message: `Are you sure you want to delete the role "${role.display_name}"? This action cannot be undone.`,
            onConfirm: async () => {
                try {
                    await api.delete(`/roles/${role.id}`);
                    showModal({
                        type: 'success',
                        title: 'Success',
                        message: 'Role deleted successfully'
                    });
                    fetchRoles();
                } catch (error) {
                    showModal({
                        type: 'error',
                        title: 'Error',
                        message: error.response?.data?.error || 'Failed to delete role'
                    });
                }
            }
        });
    };

    const handleEdit = (role) => {
        setEditingRole(role);
        setFormData({
            name: role.name,
            display_name: role.display_name,
            description: role.description || ''
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingRole(null);
        setFormData({
            name: '',
            display_name: '',
            description: ''
        });
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#778eaeff' }}>
                <div className="animate-pulse">Loading roles...</div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 'bold', color: 'rgb\(18 37 74\)', marginBottom: '0.5rem' }}>
                        Role Management
                    </h2>
                    <p style={{ color: '#778eaeff', fontSize: '0.9rem' }}>
                        Create and manage staff roles
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
                >
                    <Plus size={20} />
                    <span>Add Role</span>
                </button>
            </div>

            {/* Roles Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                {roles.map(role => (
                    <motion.div
                        key={role.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card"
                        style={{
                            background: 'white',
                            border: '1px solid #e2e8f0',
                            padding: '1.5rem',
                            borderRadius: '12px',
                            position: 'relative',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Shield size={20} color="white" />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'rgb\(18 37 74\)', margin: 0 }}>
                                        {role.display_name}
                                    </h3>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        color: '#778eaeff',
                                        background: '#f1f5f9',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        display: 'inline-block',
                                        marginTop: '4px'
                                    }}>
                                        {role.name}
                                    </span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => handleEdit(role)}
                                    style={{
                                        background: '#3b82f6',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '0.5rem',
                                        cursor: 'pointer',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(role)}
                                    style={{
                                        background: '#ef4444',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '0.5rem',
                                        cursor: 'pointer',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <p style={{ color: '#778eaeff', fontSize: '0.9rem', margin: 0, lineHeight: '1.5' }}>
                            {role.description || 'No description provided'}
                        </p>
                    </motion.div>
                ))}
            </div>

            {/* Add/Edit Role Modal */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                            padding: '1rem'
                        }}
                        onClick={resetForm}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: 'white',
                                borderRadius: '16px',
                                padding: '2rem',
                                maxWidth: '500px',
                                width: '100%',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'rgb\(18 37 74\)', margin: 0 }}>
                                    {editingRole ? 'Edit Role' : 'Create New Role'}
                                </h3>
                                <button onClick={resetForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#778eaeff' }}>
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {!editingRole && (
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#475569', fontWeight: '500' }}>
                                            Role Name (Identifier)*
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                                            placeholder="e.g., manager, clerk"
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                borderRadius: '8px',
                                                border: '1px solid #cbd5e1',
                                                fontSize: '1rem'
                                            }}
                                        />
                                        <small style={{ color: '#778eaeff', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                                            Lowercase, no spaces (use underscores)
                                        </small>
                                    </div>
                                )}

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#475569', fontWeight: '500' }}>
                                        Display Name*
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.display_name}
                                        onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                                        placeholder="e.g., Manager, Clerk"
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            border: '1px solid #cbd5e1',
                                            fontSize: '1rem'
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#475569', fontWeight: '500' }}>
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Describe the role responsibilities..."
                                        rows={3}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            border: '1px solid #cbd5e1',
                                            fontSize: '1rem',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        style={{
                                            flex: 1,
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            border: '1px solid #cbd5e1',
                                            background: 'white',
                                            color: '#475569',
                                            cursor: 'pointer',
                                            fontWeight: '500'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        style={{
                                            flex: 1,
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            fontWeight: '500'
                                        }}
                                    >
                                        {editingRole ? 'Update Role' : 'Create Role'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RoleManager;
