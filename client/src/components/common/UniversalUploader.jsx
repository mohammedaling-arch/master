import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Check, RefreshCw, FlipHorizontal, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const UniversalUploader = ({
    onFileSelect,
    onClose,
    title = "Upload Document",
    accept = "image/*,application/pdf"
}) => {
    const [mode, setMode] = useState('choice'); // 'choice', 'camera', 'preview'
    const [stream, setStream] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [error, setError] = useState(null);
    const [isFrontCamera, setIsFrontCamera] = useState(false); // Default to back camera for docs

    const videoRef = useRef(null);
    const fileInputRef = useRef(null);

    // Clean up stream on unmount
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    // Attach stream to video
    useEffect(() => {
        if (mode === 'camera' && stream && videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
                videoRef.current.play().catch(e => console.error("Video play error:", e));
            };
        }
    }, [mode, stream]);

    const startCamera = async () => {
        try {
            setError(null);
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setError("Camera API not supported in this browser.");
                return;
            }

            const constraints = {
                video: {
                    facingMode: isFrontCamera ? 'user' : 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            };

            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(newStream);
            setMode('camera');
        } catch (err) {
            console.error("Camera access error:", err);
            setError("Could not access camera. Please allow permissions.");
        }
    };

    const handleFileInput = (e) => {
        const file = e.target.files[0];
        if (file) {
            onFileSelect(file);
            onClose();
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current) return;

        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');

        if (isFrontCamera) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setPreviewUrl(dataUrl);
        setMode('preview');

        // Stop stream
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const confirmPhoto = () => {
        fetch(previewUrl)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], `captured_doc_${Date.now()}.jpg`, { type: "image/jpeg" });
                onFileSelect(file);
                onClose();
            });
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            zIndex: 9999, display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(5px)'
        }}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                    background: 'rgb\(18 37 74\)', borderRadius: '16px', width: '100%',
                    maxWidth: '500px', overflow: 'hidden', border: '1px solid #334155',
                    color: 'white'
                }}
            >
                {/* Header */}
                <div style={{ padding: '1rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>{title}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ padding: '1.5rem' }}>
                    {mode === 'choice' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <button
                                onClick={startCamera}
                                style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
                                    padding: '2rem 1rem', background: '#0f172a', border: '1px solid #334155',
                                    borderRadius: '12px', color: 'white', cursor: 'pointer'
                                }}
                            >
                                <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', color: '#3b82f6' }}>
                                    <Camera size={32} />
                                </div>
                                <span style={{ fontWeight: '600' }}>Snap Photo</span>
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
                                    padding: '2rem 1rem', background: '#0f172a', border: '1px solid #334155',
                                    borderRadius: '12px', color: 'white', cursor: 'pointer'
                                }}
                            >
                                <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', color: '#10b981' }}>
                                    <Upload size={32} />
                                </div>
                                <span style={{ fontWeight: '600' }}>Upload File</span>
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept={accept}
                                onChange={handleFileInput}
                            />
                        </div>
                    )}

                    {mode === 'camera' && (
                        <div style={{ position: 'relative', width: '100%', aspectRatio: '3/4', background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                style={{
                                    width: '100%', height: '100%', objectFit: 'cover',
                                    transform: isFrontCamera ? 'scaleX(-1)' : 'none'
                                }}
                            />
                            <div style={{ position: 'absolute', bottom: '1.5rem', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '2rem', alignItems: 'center' }}>
                                <button
                                    onClick={() => setIsFrontCamera(!isFrontCamera)}
                                    style={{ padding: '8px', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', border: 'none', color: 'white' }}
                                >
                                    <FlipHorizontal size={24} />
                                </button>
                                <button
                                    onClick={capturePhoto}
                                    style={{
                                        width: '64px', height: '64px', borderRadius: '50%', background: 'white',
                                        border: '4px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                >
                                    <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: '#3b82f6' }} />
                                </button>
                                <button
                                    onClick={() => setMode('choice')}
                                    style={{ padding: '8px', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', border: 'none', color: 'white' }}
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>
                    )}

                    {mode === 'preview' && (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                width: '100%', aspectRatio: '3/4', borderRadius: '12px', overflow: 'hidden',
                                border: '2px solid #3b82f6', marginBottom: '1.5rem'
                            }}>
                                <img src={previewUrl} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }} alt="Preview" />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={() => setMode('choice')}
                                    style={{ flex: 1, padding: '12px', background: '#334155', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold' }}
                                >
                                    Retake
                                </button>
                                <button
                                    onClick={confirmPhoto}
                                    style={{ flex: 2, padding: '12px', background: '#10b981', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                >
                                    <Check size={20} /> Use Photo
                                </button>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px', color: '#ef4444', textAlign: 'center', fontSize: '14px' }}>
                            {error}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default UniversalUploader;
