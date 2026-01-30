import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import api from '../../utils/api';
import { useModal } from '../../context/ModalContext';

const BannerManager = ({ isMobile }) => {
    const [banners, setBanners] = useState([]);
    const [newBanner, setNewBanner] = useState({ image_url: '', title: '', description: '' });
    const { showModal } = useModal();

    const fetchBanners = async () => {
        try {
            const res = await api.get('/banners');
            setBanners(res.data);
        } catch (err) {
            console.error('Failed to fetch banners');
        }
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await api.post('/banners', newBanner);
            setNewBanner({ image_url: '', title: '', description: '' });
            fetchBanners();
            showModal({
                type: 'success',
                title: 'Success',
                message: 'Banner added successfully'
            });
        } catch (err) {
            showModal({
                type: 'error',
                title: 'Failed',
                message: 'Failed to add banner. Please try again.'
            });
        }
    };

    const handleDelete = async (id) => {
        showModal({
            type: 'warning',
            title: 'Delete Banner?',
            message: 'Are you sure you want to delete this banner?',
            showCancel: true,
            confirmText: 'Yes, Delete',
            onConfirm: async () => {
                try {
                    await api.delete(`/banners/${id}`);
                    fetchBanners();
                    showModal({
                        type: 'success',
                        title: 'Deleted',
                        message: 'Banner deleted successfully'
                    });
                } catch (err) {
                    showModal({
                        type: 'error',
                        title: 'Failed',
                        message: 'Failed to delete banner'
                    });
                }
            }
        });
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2rem' }}>
            <div className="glass-card" style={{ background: 'rgb\(18 37 74\)', border: 'none' }}>
                <h3 style={{ marginBottom: '1.5rem', color: '#2ecc71' }}>Add New Banner</h3>
                <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                        type="text"
                        placeholder="Image URL"
                        value={newBanner.image_url}
                        style={inputStyle}
                        onChange={e => setNewBanner({ ...newBanner, image_url: e.target.value })}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Title"
                        value={newBanner.title}
                        style={inputStyle}
                        onChange={e => setNewBanner({ ...newBanner, title: e.target.value })}
                        required
                    />
                    <textarea
                        placeholder="Description"
                        value={newBanner.description}
                        style={{ ...inputStyle, minHeight: '100px' }}
                        onChange={e => setNewBanner({ ...newBanner, description: e.target.value })}
                        required
                    />
                    <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <Plus size={18} /> Add Banner
                    </button>
                </form>
            </div>

            <div className="glass-card" style={{ background: 'rgb\(18 37 74\)', border: 'none' }}>
                <h3 style={{ marginBottom: '1.5rem', color: '#2ecc71' }}>Existing Banners</h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {banners.map(banner => (
                        <div key={banner.id} style={{ padding: '1rem', background: '#0f172a', borderRadius: '12px', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <img src={banner.image_url} style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} alt="" />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 'bold', color: 'white' }}>{banner.title}</div>
                                <div style={{ fontSize: '12px', color: '#94a3b8' }}>{banner.description}</div>
                            </div>
                            <button onClick={() => handleDelete(banner.id)} style={{ padding: '10px', color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const inputStyle = {
    padding: '12px',
    borderRadius: '8px',
    background: '#0f172a',
    border: '1px solid #334155',
    color: 'white',
    width: '100%'
};

export default BannerManager;
