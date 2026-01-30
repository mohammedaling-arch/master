import React, { useState, useEffect } from 'react';
import { formatDate } from '../../utils/dateUtils';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Trash2, Edit2, Search, X, Loader2,
    Mail, Phone, MapPin, CheckCircle, UserPlus,
    FileText, Scale, Plus, Eye, Camera, Image, Upload
} from 'lucide-react';
import api from '../../utils/api';
import { useModal } from '../../context/ModalContext';
import DataTable from '../common/DataTable';
import ImageCapture from '../common/ImageCapture';

const ApplicantManager = ({ isMobile, onFileFor }) => {
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingApplicant, setEditingApplicant] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const { showModal: showAlertModal } = useModal();
    const [showPicCapture, setShowPicCapture] = useState(false);

    useEffect(() => {
        fetchApplicants();
    }, []);

    const fetchApplicants = async () => {
        try {
            setLoading(true);
            const res = await api.get('/applicants');
            setApplicants(res.data);
        } catch (error) {
            console.error('Error fetching applicants:', error);
            showAlertModal({
                type: 'error',
                title: 'Error Loading Applicants',
                message: error.response?.data?.error || 'Failed to load applicants. Please refresh the page.'
            });
        } finally {
            setLoading(false);
        }
    };

    const [picPreview, setPicPreview] = useState(null);
    const [sigPreview, setSigPreview] = useState(null);

    const handleAdd = () => {
        setEditingApplicant({
            first_name: '',
            middle_name: '',
            surname: '',
            gender: 'male',
            age: '',
            email: '',
            phone: '',
            address: '',
            nin: '',
            status: 'active',
            picture_path: '',
            signature_path: ''
        });
        setPicPreview(null);
        setSigPreview(null);
        setShowModal(true);
    };

    const getFullUrl = (path) => {
        if (!path) return null;
        // Handle potential double slashes and normalize Windows-style backslashes
        const cleanPath = path.replace(/\\/g, '/').replace(/^\/+/, '');
        const baseUrl = api.defaults.baseURL.replace(/\/api$/, '');
        return `${baseUrl}/${cleanPath}`;
    };

    const handleEdit = (applicant) => {
        setEditingApplicant({ ...applicant, picture: null, signature: null });
        setPicPreview(getFullUrl(applicant.picture_path));
        setSigPreview(getFullUrl(applicant.signature_path));
        setShowModal(true);
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            if (type === 'picture') {
                setEditingApplicant(prev => ({ ...prev, picture: file }));
                setPicPreview(reader.result);
            } else {
                setEditingApplicant(prev => ({ ...prev, signature: file }));
                setSigPreview(reader.result);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const formData = new FormData();

            // Map common fields
            const fields = {
                first_name: editingApplicant.first_name,
                middle_name: editingApplicant.middle_name,
                surname: editingApplicant.surname,
                gender: editingApplicant.gender,
                age: editingApplicant.age,
                email: editingApplicant.email,
                phone: editingApplicant.phone,
                address: editingApplicant.address,
                nin: editingApplicant.nin,
                status: editingApplicant.status || 'active'
            };

            // Add fields to formData
            Object.entries(fields).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    // For create, backend expects firstName etc.
                    if (!editingApplicant.id && key === 'first_name') {
                        formData.append('firstName', value);
                    } else if (!editingApplicant.id && key === 'middle_name') {
                        formData.append('middleName', value);
                    } else if (key === 'age' && value === '') {
                        formData.append(key, 0); // Handle empty age
                    } else if (key !== 'first_name' && key !== 'middle_name') {
                        // Skip first_name and middle_name in create mode as they're handled above
                        formData.append(key, value);
                    } else if (editingApplicant.id) {
                        // In edit mode, append all fields with snake_case
                        formData.append(key, value);
                    }
                }
            });

            // Append existing paths if editing
            if (editingApplicant.id) {
                if (editingApplicant.picture_path) formData.append('picture_path', editingApplicant.picture_path);
                if (editingApplicant.signature_path) formData.append('signature_path', editingApplicant.signature_path);
            }

            // Append new files
            if (editingApplicant.picture instanceof File) formData.append('picture', editingApplicant.picture);
            if (editingApplicant.signature instanceof File) formData.append('signature', editingApplicant.signature);

            console.log('Submitting applicant:', editingApplicant.id ? 'UPDATE' : 'CREATE');
            console.log('FormData entries:');
            for (let [key, value] of formData.entries()) {
                console.log(`  ${key}:`, value instanceof File ? `File(${value.name})` : value);
            }

            if (editingApplicant.id) {
                await api.put(`/applicants/${editingApplicant.id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                showAlertModal({
                    type: 'success',
                    title: 'Applicant Updated',
                    message: `${editingApplicant.first_name} ${editingApplicant.surname} has been updated successfully.`
                });
            } else {
                await api.post('/applicants', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                showAlertModal({
                    type: 'success',
                    title: 'Applicant Created',
                    message: `${editingApplicant.first_name} ${editingApplicant.surname} has been added successfully.`
                });
            }
            setShowModal(false);
            fetchApplicants();
        } catch (error) {
            showAlertModal({
                type: 'error',
                title: editingApplicant.id ? 'Update Failed' : 'Creation Failed',
                message: error.response?.data?.error || 'Failed to save applicant.'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (applicant) => {
        showAlertModal({
            type: 'warning',
            title: 'Delete Applicant',
            message: `Are you sure you want to permanently delete ${applicant.first_name} ${applicant.surname}? This action cannot be undone.`,
            confirmText: 'Delete Permanently',
            cancelText: 'Cancel',
            showCancel: true,
            onConfirm: async () => {
                try {
                    await api.delete(`/applicants/${applicant.id}`);
                    showAlertModal({
                        type: 'success',
                        title: 'Applicant Deleted',
                        message: 'The applicant has been removed.'
                    });
                    fetchApplicants();
                } catch (error) {
                    showAlertModal({
                        type: 'error',
                        title: 'Deletion Failed',
                        message: 'Failed to delete applicant.'
                    });
                }
            }
        });
    };

    const filteredApplicants = applicants.filter(applicant => {
        const fullName = `${applicant.first_name || ''} ${applicant.surname || ''}`.toLowerCase();
        const email = (applicant.email || '').toLowerCase();
        const search = searchTerm.toLowerCase();

        return fullName.includes(search) ||
            email.includes(search) ||
            (applicant.phone && applicant.phone.includes(searchTerm));
    });

    return (
        <>
            <div className="glass-card" style={{ background: 'rgb\(18 37 74\)', border: 'none', color: 'white', overflow: 'auto' }}>
                {/* Header Section */}
                <div style={{ padding: isMobile ? '1.5rem' : '2.5rem', background: 'transparent' }}>
                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '2rem', gap: '1.5rem' }}>
                        <div>
                            <h2 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 'bold' }}>
                                <Users size={isMobile ? 24 : 32} className="text-blue-500" /> Applicant Registry
                            </h2>
                            <p style={{ margin: 0, color: '#94a3b8', fontSize: '15px' }}>
                                Manage applicant profiles, biometric data, and application history.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', width: isMobile ? '100%' : 'auto' }}>
                            <div style={{ position: 'relative', flex: 1, minWidth: isMobile ? 'auto' : '300px' }}>
                                <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#778eaeff' }} size={20} />
                                <input
                                    type="text"
                                    placeholder="Search applicants..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px 12px 50px',
                                        background: '#0f172a',
                                        border: '1px solid #334155',
                                        borderRadius: '12px',
                                        color: 'white',
                                        outline: 'none',
                                        fontSize: '14px',
                                        transition: 'all 0.3s'
                                    }}
                                />
                            </div>
                            <button
                                onClick={handleAdd}
                                className="hover-scale"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '12px 24px',
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
                                }}
                            >
                                <UserPlus size={20} /> Add New
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
                                label: 'Applicant',
                                sortable: true,
                                render: (val, row) => (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        {row.picture_path ? (
                                            <img
                                                src={getFullUrl(row.picture_path)}
                                                alt={val}
                                                style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #334155' }}
                                                onError={(e) => { e.target.src = 'https://via.placeholder.com/40?text=User'; }}
                                            />
                                        ) : (
                                            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                {val?.[0]}{row.surname?.[0]}
                                            </div>
                                        )}
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#f1f5f9', textTransform: 'capitalize' }}>{val} {row.surname}</div>
                                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{row.email || 'No Email'}</div>
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
                                label: 'Added',
                                sortable: true,
                                render: (val) => formatDate(val)
                            }
                        ]}
                        data={filteredApplicants}
                        loading={loading}
                        searchPlaceholder="Search applicants..."
                        actions={(row) => (
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => onFileFor && onFileFor(row)}
                                    style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                    title="File Application"
                                >
                                    <FileText size={18} />
                                </button>
                                <button
                                    onClick={() => handleEdit(row)}
                                    style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                    title="Edit"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(row)}
                                    style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                    title="Delete"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        )}
                    />
                </div>
            </div>

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0,
                            background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)',
                            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                            zIndex: 2000, padding: isMobile ? '1rem' : '3rem',
                            overflowY: 'auto'
                        }}
                        onClick={() => !submitting && setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: 'rgb\(18 37 74\)', borderRadius: '24px', padding: isMobile ? '1.5rem' : '3rem',
                                maxWidth: '850px', width: '100%', border: '1px solid #334155',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', margin: 'auto'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.5rem' }}>
                                    {editingApplicant?.id ? 'Edit Applicant' : 'Add New Applicant'}
                                </h3>
                                <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#778eaeff', cursor: 'pointer' }}>
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '1rem' : '1.5rem' }}>
                                    <div style={{ gridColumn: isMobile ? 'span 1' : 'span 3', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', color: '#94a3b8', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>First Name *</label>
                                            <input
                                                type="text"
                                                required
                                                value={editingApplicant?.first_name || ''}
                                                onChange={(e) => setEditingApplicant({ ...editingApplicant, first_name: e.target.value })}
                                                style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontWeight: '500' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', color: '#94a3b8', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>Middle Name</label>
                                            <input
                                                type="text"
                                                value={editingApplicant?.middle_name || ''}
                                                onChange={(e) => setEditingApplicant({ ...editingApplicant, middle_name: e.target.value })}
                                                style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontWeight: '500' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', color: '#94a3b8', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>Surname *</label>
                                            <input
                                                type="text"
                                                required
                                                value={editingApplicant?.surname || ''}
                                                onChange={(e) => setEditingApplicant({ ...editingApplicant, surname: e.target.value })}
                                                style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontWeight: '500' }}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem', gridColumn: isMobile ? 'span 1' : 'span 3' }}>
                                        <div>
                                            <label style={{ display: 'block', color: '#94a3b8', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>Gender</label>
                                            <select
                                                value={editingApplicant?.gender || 'male'}
                                                onChange={(e) => setEditingApplicant({ ...editingApplicant, gender: e.target.value })}
                                                style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontWeight: '500' }}
                                            >
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', color: '#94a3b8', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>Age</label>
                                            <input
                                                type="number"
                                                value={editingApplicant?.age || ''}
                                                onChange={(e) => setEditingApplicant({ ...editingApplicant, age: e.target.value })}
                                                style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontWeight: '500' }}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '1rem', gridColumn: isMobile ? 'span 1' : 'span 3' }}>
                                        <div>
                                            <label style={{ display: 'block', color: '#94a3b8', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>Email</label>
                                            <input
                                                type="email"
                                                value={editingApplicant?.email || ''}
                                                onChange={(e) => setEditingApplicant({ ...editingApplicant, email: e.target.value })}
                                                style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontWeight: '500' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', color: '#94a3b8', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>Phone</label>
                                            <input
                                                type="text"
                                                value={editingApplicant?.phone || ''}
                                                onChange={(e) => setEditingApplicant({ ...editingApplicant, phone: e.target.value })}
                                                style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontWeight: '500' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', color: '#94a3b8', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>NIN</label>
                                            <input
                                                type="text"
                                                value={editingApplicant?.nin || ''}
                                                onChange={(e) => setEditingApplicant({ ...editingApplicant, nin: e.target.value })}
                                                style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontWeight: '500' }}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ gridColumn: isMobile ? 'span 1' : 'span 3' }}>
                                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>Address</label>
                                        <textarea
                                            value={editingApplicant?.address || ''}
                                            onChange={(e) => setEditingApplicant({ ...editingApplicant, address: e.target.value })}
                                            style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', minHeight: '80px', resize: 'vertical', fontWeight: '500' }}
                                        />
                                    </div>
                                    <div style={{ gridColumn: isMobile ? 'span 1' : 'span 3', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem', marginTop: '1rem', borderTop: '1px solid #334155', paddingTop: '1.5rem' }}>
                                        <div>
                                            <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '0.5px' }}>
                                                <Camera size={14} /> Applicant Picture
                                            </label>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#0f172a', padding: '10px', borderRadius: '10px', border: '1px solid #334155' }}>
                                                    {/* Preview current or new pic */}
                                                    <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', background: 'rgb\(18 37 74\)', flexShrink: 0, border: '1px solid #334155' }}>
                                                        {picPreview ? (
                                                            <img src={picPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" />
                                                        ) : (
                                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155' }}><Image size={24} /></div>
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPicCapture(true)}
                                                        style={{ fontSize: '12px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                    >
                                                        <Camera size={14} /> {picPreview ? 'Change Photo' : 'Take/Upload Photo'}
                                                    </button>
                                                </div>
                                                {showPicCapture && (
                                                    <ImageCapture
                                                        onClose={() => setShowPicCapture(false)}
                                                        onImageCaptured={(file, preview) => {
                                                            setEditingApplicant(prev => ({ ...prev, picture: file }));
                                                            setPicPreview(preview);
                                                        }}
                                                        title="Applicant Photo"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '0.5px' }}>
                                                <Edit2 size={14} /> Applicant Signature
                                            </label>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#0f172a', padding: '10px', borderRadius: '10px', border: '1px solid #334155' }}>
                                                    <div style={{ height: '60px', width: '120px', borderRadius: '8px', overflow: 'hidden', background: 'white', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
                                                        {sigPreview ? (
                                                            <img src={sigPreview} style={{ height: '100%', width: '100%', objectFit: 'contain' }} alt="Preview" />
                                                        ) : (
                                                            <div style={{ color: '#cbd5e1', fontSize: '10px', fontWeight: 'bold' }}>NO SIGNATURE</div>
                                                        )}
                                                    </div>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        id="applicant-sig-upload"
                                                        onChange={(e) => handleFileChange(e, 'signature')}
                                                        style={{ display: 'none' }}
                                                    />
                                                    <label htmlFor="applicant-sig-upload" style={{ fontSize: '12px', color: '#3b82f6', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Upload size={14} /> {sigPreview ? 'Change Signature' : 'Upload Signature'}
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                        {editingApplicant?.id && (
                                            <div>
                                                <label style={{ display: 'block', color: '#94a3b8', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>Status</label>
                                                <select
                                                    value={editingApplicant?.status || 'active'}
                                                    onChange={(e) => setEditingApplicant({ ...editingApplicant, status: e.target.value })}
                                                    style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontWeight: '500' }}
                                                >
                                                    <option value="active">Active</option>
                                                    <option value="inactive">Inactive</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        style={{ flex: 1, padding: '14px', borderRadius: '12px', background: '#334155', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="hover-scale"
                                        style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)' }}
                                    >
                                        {submitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                                        {editingApplicant?.id ? 'Update' : 'Create'} Applicant
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ApplicantManager;
