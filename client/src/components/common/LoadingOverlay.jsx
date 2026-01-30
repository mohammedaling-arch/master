import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Scale } from 'lucide-react';

/**
 * LOADER OPTION 1: Modern Glassmorphism Spinner
 * Clean, premium, and fits the "Borno State" legal theme.
 */
export const GlassSpinner = ({ message = "Authenticating..." }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)', // Support for Safari
        }}
    >
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            style={{
                background: 'white',
                padding: '3rem',
                borderRadius: '40px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.5rem',
                minWidth: '280px'
            }}
        >
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                style={{
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '64px',
                    height: '64px'
                }}
            >
                <Loader2 size={56} strokeWidth={2} />
            </motion.div>
            <div style={{ textAlign: 'center' }}>
                <h3 style={{ margin: 0, color: 'rgb\(18 37 74\)', fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.025em' }}>{message}</h3>
                <p style={{ margin: '8px 0 0', color: '#778eaeff', fontSize: '0.9rem', fontWeight: '500' }}>Please wait a moment</p>
            </div>
        </motion.div>
    </motion.div>
);

/**
 * LOADER OPTION 2: Justice Scale Pulse (Brand Focused)
 * Uses the scale icon to reinforce the legal/court branding.
 */
export const JusticePulse = ({ message = "Processing..." }) => (
    <div style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'rgb\(18 37 74\)' // Elegant dark background
    }}>
        <motion.div
            animate={{
                scale: [1, 1.1, 1],
                opacity: [0.8, 1, 0.8]
            }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            style={{ color: '#10b981', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}
        >
            <div style={{
                width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <Scale size={50} />
            </div>
            <div style={{ color: 'white', fontSize: '1.2rem', fontWeight: '500', letterSpacing: '1px' }}>
                {message.toUpperCase()}
            </div>
        </motion.div>

        {/* Progress bar line */}
        <div style={{ width: '200px', height: '3px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '10px', marginTop: '2rem', overflow: 'hidden' }}>
            <motion.div
                animate={{ x: [-200, 200] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                style={{ width: '100%', height: '100%', background: '#10b981' }}
            />
        </div>
    </div>
);

/**
 * LOADER OPTION 3: Bouncing Legal Pillars
 * Minimalist and motion-oriented.
 */
export const BouncingLoader = () => (
    <div style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255,255,255,0.9)'
    }}>
        <div style={{ display: 'flex', gap: '8px' }}>
            {[0, 1, 2].map(index => (
                <motion.div
                    key={index}
                    animate={{ y: [0, -15, 0] }}
                    transition={{
                        repeat: Infinity,
                        duration: 0.6,
                        delay: index * 0.1,
                        ease: "easeInOut"
                    }}
                    style={{
                        width: '12px', height: '35px', borderRadius: '4px',
                        background: index === 1 ? '#10b981' : '#334155'
                    }}
                />
            ))}
        </div>
    </div>
);
