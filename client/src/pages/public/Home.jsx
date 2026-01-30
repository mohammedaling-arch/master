import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, BookOpen, Gavel, ArrowRight, Menu, X } from 'lucide-react';
import BannerSlider from '../../components/common/BannerSlider';

const Home = () => {
    const navigate = useNavigate();
    const [showVerifyMenu, setShowVerifyMenu] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
    const verifyMenuRef = useRef(null);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 1024;
            setIsMobile(mobile);
            if (!mobile) setMobileMenuOpen(false);
        };

        const handleClickOutside = (event) => {
            if (verifyMenuRef.current && !verifyMenuRef.current.contains(event.target)) {
                setShowVerifyMenu(false);
            }
        };

        window.addEventListener('resize', handleResize);
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const navItems = (isMobileView = false) => (
        <div style={{
            display: 'flex',
            flexDirection: isMobileView ? 'column' : 'row',
            gap: '1.5rem',
            alignItems: isMobileView ? 'stretch' : 'center',
            width: isMobileView ? '100%' : 'auto'
        }}>
            <div style={{ position: 'relative' }} ref={verifyMenuRef}>
                <button
                    className="btn hover-scale"
                    style={{
                        background: 'white',
                        color: '#3d2b1f',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                        padding: '10px 20px',
                        borderRadius: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        width: isMobileView ? '100%' : 'auto',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowVerifyMenu(!showVerifyMenu);
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Shield size={16} /> Verify
                    </div>
                    <ArrowRight size={14} style={{ transform: `rotate(${showVerifyMenu ? '-90deg' : '90deg'})`, transition: 'transform 0.2s' }} />
                </button>

                {showVerifyMenu && (
                    <div style={{
                        position: isMobileView ? 'static' : 'absolute',
                        top: '120%',
                        right: 0,
                        background: 'white',
                        minWidth: isMobileView ? '100%' : '220px',
                        borderRadius: '12px',
                        boxShadow: isMobileView ? 'none' : '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)',
                        padding: '0.5rem',
                        zIndex: 1000,
                        border: '1px solid #f1f5f9',
                        marginTop: isMobileView ? '0.5rem' : '0'
                    }}>
                        <div
                            onClick={() => { navigate('/verify/affidavit'); setShowVerifyMenu(false); setMobileMenuOpen(false); }}
                            style={{ padding: '12px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'rgb\(18 37 74\)', transition: 'background 0.2s' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <div style={{ padding: '6px', background: '#eff6ff', borderRadius: '6px', color: '#3b82f6' }}><BookOpen size={16} /></div>
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: '600' }}>Verify Affidavit</div>
                                <div style={{ fontSize: '11px', color: '#778eaeff' }}>Check oath authenticity</div>
                            </div>
                        </div>
                        <div
                            onClick={() => { navigate('/verify/probate'); setShowVerifyMenu(false); setMobileMenuOpen(false); }}
                            style={{ padding: '12px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'rgb\(18 37 74\)', transition: 'background 0.2s', marginTop: '4px' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <div style={{ padding: '6px', background: '#f0fdf4', borderRadius: '6px', color: '#22c55e' }}><Gavel size={16} /></div>
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: '600' }}>Verify Probate</div>
                                <div style={{ fontSize: '11px', color: '#778eaeff' }}>Check grant validity</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {!isMobileView && <div style={{ width: '1px', height: '24px', background: '#e2e8f0' }}></div>}
            <button
                onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                className="btn hover-scale"
                style={{ background: 'transparent', color: '#778eaeff', fontWeight: '600', padding: '10px 20px', border: 'none', cursor: 'pointer' }}
            >
                Login
            </button>
            <button
                onClick={() => { navigate('/register'); setMobileMenuOpen(false); }}
                className="btn btn-primary hover-scale"
                style={{ background: '#2ecc71', color: 'white', padding: '10px 24px', borderRadius: '12px', border: 'none', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 12px rgba(46, 204, 113, 0.4)' }}
            >
                Register
            </button>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
            {/* Navbar */}
            <nav style={{
                padding: isMobile ? '1rem' : '1rem 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'white',
                position: 'sticky',
                top: 0,
                zIndex: 110,
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.75rem' : '1rem' }}>
                    <img src="/assets/logo.png" alt="Coat of Arms" style={{ width: isMobile ? '40px' : '50px', height: isMobile ? '40px' : '50px', borderRadius: '50%' }} />
                    <div>
                        <h2 style={{ color: '#3d2b1f', margin: 0, fontSize: isMobile ? '1rem' : '1.2rem' }}>CRMS</h2>
                        <p style={{ margin: 0, fontSize: isMobile ? '8px' : '10px', color: '#8d6e63', fontWeight: 'bold' }}>BORNO STATE HIGH COURT</p>
                    </div>
                </div>

                {!isMobile ? (
                    navItems(false)
                ) : (
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        style={{ background: 'none', border: 'none', color: '#3d2b1f', cursor: 'pointer', padding: '8px' }}
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                )}
            </nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobile && mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            background: 'white',
                            borderBottom: '1px solid #f1f5f9',
                            padding: '1.5rem',
                            overflow: 'hidden',
                            position: 'sticky',
                            top: '60px',
                            zIndex: 100
                        }}
                    >
                        {navItems(true)}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Banner Section */}
            <BannerSlider />

            {/* Hero Section */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '0 1.5rem' : '0 2rem' }}>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    style={{ textAlign: 'center', margin: isMobile ? '3rem 0' : '5rem 0' }}
                >
                    <h1 style={{ fontSize: isMobile ? '2rem' : '3.5rem', color: '#3d2b1f', marginBottom: '1.5rem', fontWeight: '800', lineHeight: 1.1, letterSpacing: '-0.5px' }}>
                        Official Court Registry Management
                    </h1>
                    <p style={{ fontSize: isMobile ? '1.1rem' : '1.3rem', color: '#5d4037', maxWidth: '800px', margin: '0 auto', lineHeight: '1.7', opacity: 0.9 }}>
                        The Borno State High Court's digital infrastructure for filing probate applications, legal oaths, and document verification.
                    </p>
                </motion.div>
            </div>

            {/* Features Registry Section */}
            <section style={{ padding: isMobile ? '4rem 1.5rem' : '6rem 2rem', background: 'white' }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: isMobile ? '3rem' : '4rem'
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        style={{ textAlign: 'center' }}
                    >
                        <div style={{ background: 'rgba(52, 152, 219, 0.1)', padding: '24px', borderRadius: '24px', width: 'fit-content', margin: '0 auto 2rem', color: '#3498db' }}>
                            <BookOpen size={isMobile ? 40 : 50} />
                        </div>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: '700', color: 'rgb\(18 37 74\)' }}>OADR Registry</h3>
                        <p style={{ color: '#778eaeff', fontSize: '1rem', lineHeight: 1.6 }}>File Oaths, Affidavits, and Declarations with ease using our smart templates and digital verification.</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        style={{ textAlign: 'center' }}
                    >
                        <div style={{ background: 'rgba(46, 204, 113, 0.1)', padding: '24px', borderRadius: '24px', width: 'fit-content', margin: '0 auto 2rem', color: '#2ecc71' }}>
                            <Gavel size={isMobile ? 40 : 50} />
                        </div>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: '700', color: 'rgb\(18 37 74\)' }}>Probate Registry</h3>
                        <p style={{ color: '#778eaeff', fontSize: '1rem', lineHeight: 1.6 }}>Apply for Letters of Administration and manage beneficiaries through a streamlined online process.</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        style={{ textAlign: 'center' }}
                    >
                        <div style={{ background: 'rgba(230, 126, 34, 0.1)', padding: '24px', borderRadius: '24px', width: 'fit-content', margin: '0 auto 2rem', color: '#e67e22' }}>
                            <Shield size={isMobile ? 40 : 50} />
                        </div>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: '700', color: 'rgb\(18 37 74\)' }}>Secure & Verified</h3>
                        <p style={{ color: '#778eaeff', fontSize: '1rem', lineHeight: 1.6 }}>Liveness checks and digital watermarking ensure the security and validity of all your filings.</p>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ padding: '4rem 1.5rem', background: 'rgb\(18 37 74\)', color: '#94a3b8', textAlign: 'center', marginTop: 'auto' }}>
                <p style={{ maxWidth: '600px', margin: '0 auto 1.5rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
                    The Court Registry Management System is a specialized digital platform for the Borno State Judiciary.
                </p>
                <div style={{ width: '40px', height: '2px', background: '#334155', margin: '0 auto 1.5rem' }}></div>
                <p style={{ fontSize: '12px', margin: 0 }}>&copy; 2026 Borno State High Court • Court Registry Management System (CRMS). All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Home;
