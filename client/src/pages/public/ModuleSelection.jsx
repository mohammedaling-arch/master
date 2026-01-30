import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Gavel, FileText } from 'lucide-react';

const ModuleSelection = ({ user }) => {
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);

    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const modules = [
        {
            id: 'oadr',
            title: 'OADR Registry',
            subtitle: 'Oaths & Affidavits',
            desc: 'Facilitating digital oaths, legal declarations, and automated affidavit generation with secure e-sealing.',
            icon: <Gavel size={isMobile ? 32 : 48} />,
            path: '/oadr',
            gradient: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
            textColor: '#60a5fa'
        },
        {
            id: 'probate',
            title: 'Probate Registry',
            subtitle: 'Letters of Admin',
            desc: 'Streamlined administration of estates, probate applications, and judicial verification systems.',
            icon: <FileText size={isMobile ? 32 : 48} />,
            path: '/probate',
            gradient: 'linear-gradient(135deg, #10b981 0%, #065f46 100%)',
            textColor: '#34d399'
        }
    ];

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #523a2a 0%, #32241a 100%)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflowX: 'hidden',
            overflowY: 'auto'
        }}>
            {/* Ambient Background Glows */}
            <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '35%', height: '35%', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0% , transparent 70%)', borderRadius: '50%' }} />

            <div style={{ padding: isMobile ? '1.5rem' : '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img src="/assets/logo.png" alt="Logo" style={{ width: isMobile ? '30px' : '35px', height: isMobile ? '30px' : '35px', borderRadius: '8px' }} />
                    <span style={{ color: 'white', fontWeight: '800', letterSpacing: '1px', fontSize: isMobile ? '1rem' : '1.2rem' }}>CRMS</span>
                </div>
                <button
                    onClick={handleLogout}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: isMobile ? '6px 16px' : '8px 20px', borderRadius: '30px', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                    Logout
                </button>
            </div>

            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: isMobile ? '2rem 1.5rem' : '4rem',
                zIndex: 10,
                width: '100%',
                boxSizing: 'border-box'
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ textAlign: 'center', marginBottom: isMobile ? '2.5rem' : '4rem' }}
                >
                    <h1 style={{ fontSize: isMobile ? '2.25rem' : '4rem', color: 'white', fontWeight: '900', marginBottom: '0.75rem', letterSpacing: '-1px', lineHeight: 1.1 }}>
                        Welcome, <br />
                        <span style={{ background: 'linear-gradient(to right, #10b981, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user.firstName}</span>
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: isMobile ? '1rem' : '1.1rem', maxWidth: '600px', margin: '0 auto' }}>Select the court registry module you wish to access today.</p>
                </motion.div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                    gap: isMobile ? '2rem' : '2.5rem',
                    width: '100%',
                    maxWidth: '1000px',
                    perspective: '2000px'
                }}>
                    {modules.map((mod, index) => (
                        <FlipCard key={mod.id} mod={mod} index={index} navigate={navigate} isMobile={isMobile} />
                    ))}
                </div>
            </div>

            <div style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', color: '#475569', fontSize: '11px' }}>
                Borno State Judiciary • Court Registry Management System v4.0.2
            </div>
        </div>
    );
};

const FlipCard = ({ mod, index, navigate, isMobile }) => {
    const [isFlipped, setIsFlipped] = React.useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, rotateY: -30, x: -50 }}
            animate={{ opacity: 1, rotateY: 0, x: 0 }}
            transition={{ delay: index * 0.2, duration: 0.8 }}
            onMouseEnter={() => !isMobile && setIsFlipped(true)}
            onMouseLeave={() => !isMobile && setIsFlipped(false)}
            onClick={() => isMobile ? setIsFlipped(!isFlipped) : null}
            style={{
                position: 'relative',
                height: isMobile ? '320px' : '400px',
                cursor: 'pointer',
                transformStyle: 'preserve-3d'
            }}
        >
            <AnimatePresence mode="wait">
                {!isFlipped ? (
                    <motion.div
                        key="front"
                        initial={{ opacity: 0, rotateY: -90 }}
                        animate={{ opacity: 1, rotateY: 0 }}
                        exit={{ opacity: 0, rotateY: 90 }}
                        style={{
                            position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.03)',
                            backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: isMobile ? '32px' : '40px', padding: isMobile ? '1.5rem' : '3rem',
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                        }}
                    >
                        <div style={{
                            width: isMobile ? '70px' : '100px', height: isMobile ? '70px' : '100px',
                            borderRadius: isMobile ? '20px' : '30px', background: mod.gradient,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                            marginBottom: isMobile ? '1.5rem' : '2rem', boxShadow: `0 10px 20px -5px ${mod.textColor}44`
                        }}>
                            {mod.icon}
                        </div>
                        <h3 style={{ color: mod.textColor, fontSize: isMobile ? '0.75rem' : '0.9rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem' }}>{mod.subtitle}</h3>
                        <h2 style={{ color: 'white', fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: '800' }}>{mod.title}</h2>
                        {isMobile && <div style={{ marginTop: '1.5rem', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>Tap to view details</div>}
                    </motion.div>
                ) : (
                    <motion.div
                        key="back"
                        initial={{ opacity: 0, rotateY: -90 }}
                        animate={{ opacity: 1, rotateY: 0 }}
                        exit={{ opacity: 0, rotateY: 90 }}
                        style={{
                            position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.05)',
                            backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: isMobile ? '32px' : '40px', padding: isMobile ? '1.5rem' : '3rem',
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                        }}
                    >
                        <p style={{ color: '#cbd5e1', fontSize: isMobile ? '0.95rem' : '1.1rem', lineHeight: 1.6, marginBottom: isMobile ? '1.5rem' : '2.5rem' }}>{mod.desc}</p>
                        <button
                            onClick={(e) => { e.stopPropagation(); navigate(mod.path); }}
                            style={{
                                width: '100%', height: isMobile ? '50px' : '60px', borderRadius: '30px', background: mod.gradient,
                                color: 'white', fontWeight: '800', border: 'none', cursor: 'pointer',
                                fontSize: isMobile ? '1rem' : '1.1rem', boxShadow: '0 10px 20px rgba(0,0,0,0.2)', transition: 'transform 0.2s'
                            }}
                        >
                            Access {mod.id.toUpperCase()}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ModuleSelection;
