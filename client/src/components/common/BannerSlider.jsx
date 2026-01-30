import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../utils/api';

const BannerSlider = () => {
    const [banners, setBanners] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const res = await api.get('/banners');
                if (Array.isArray(res.data)) {
                    setBanners(res.data);
                } else {
                    setBanners([]);
                }
            } catch (err) {
                console.error('Failed to fetch banners');
            }
        };
        fetchBanners();
    }, []);

    useEffect(() => {
        if (banners.length === 0) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [banners]);

    if (banners.length === 0) return null;

    const current = banners[currentIndex];

    return (
        <div style={{
            position: 'relative',
            height: isMobile ? '450px' : '650px',
            width: '100%',
            overflow: 'hidden',
            margin: 0,
            padding: 0,
            borderRadius: 0,
            border: 'none'
        }}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5 }}
                    style={{ position: 'absolute', width: '100%', height: '100%' }}
                >
                    <motion.div
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 6, ease: "linear" }}
                        style={{ position: 'absolute', width: '100%', height: '100%' }}
                    >
                        <img
                            src={current.image_url}
                            alt={current.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </motion.div>

                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to right, rgba(46, 12, 58, 0.9) 0%, rgba(46, 12, 58, 0.7) 40%, rgba(46, 12, 58, 0.3) 100%)',
                        zIndex: 1
                    }}></div>

                    <div style={{
                        position: 'absolute',
                        bottom: '25%',
                        left: '8%',
                        right: '8%',
                        color: 'white',
                        zIndex: 2,
                        maxWidth: '800px'
                    }}>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                        >
                            <span style={{ background: '#2ecc71', padding: '6px 18px', borderRadius: '30px', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '3px', boxShadow: '0 4px 15px rgba(46, 204, 113, 0.3)' }}>
                                Borno High Court Update
                            </span>
                            <h2 style={{ fontSize: isMobile ? '2.2rem' : '4.2rem', margin: '1rem 0', fontWeight: '900', textShadow: '3px 3px 10px rgba(0,0,0,0.5)', lineHeight: 1.1 }}>
                                {current.title}
                            </h2>
                            <p style={{ fontSize: isMobile ? '1.1rem' : '1.6rem', opacity: 0.95, lineHeight: '1.6', fontWeight: '300', maxWidth: '650px' }}>
                                {current.description}
                            </p>
                        </motion.div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Carousel Indicators */}
            <div style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px', zIndex: 3 }}>
                {banners.map((_, idx) => (
                    <div
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        style={{
                            width: currentIndex === idx ? '30px' : '10px',
                            height: '10px',
                            background: currentIndex === idx ? '#2ecc71' : 'rgba(255,255,255,0.5)',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                    />
                ))}
            </div>

            <button
                onClick={() => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)}
                style={{ position: 'absolute', left: '25px', top: '50%', transform: 'translateY(-50%)', zIndex: 3, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', transition: '0.3s' }}
            >
                <ChevronLeft size={28} />
            </button>
            <button
                onClick={() => setCurrentIndex((prev) => (prev + 1) % banners.length)}
                style={{ position: 'absolute', right: '25px', top: '50%', transform: 'translateY(-50%)', zIndex: 3, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', transition: '0.3s' }}
            >
                <ChevronRight size={28} />
            </button>
        </div>
    );
};

export default BannerSlider;
