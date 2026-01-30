import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Check, RefreshCw, FlipHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ImageCapture = ({
    onImageCaptured,
    onClose,
    title = "Capture Photo",
    aspectRatio = 1,
    targetWidth = 600,
    targetHeight = 600
}) => {
    const [mode, setMode] = useState('choice'); // 'choice', 'camera', 'preview'
    const [stream, setStream] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [error, setError] = useState(null);
    const [isFrontCamera, setIsFrontCamera] = useState(true);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const nativeInputRef = useRef(null);

    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    // Attach stream to video element when entering camera mode
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
                setError("Camera API not supported in this browser or context (requires HTTPS or localhost).");
                setMode('choice');
                return;
            }

            const constraints = {
                video: {
                    facingMode: isFrontCamera ? 'user' : 'environment'
                }
            };

            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(newStream);
            setMode('camera');
        } catch (err) {
            console.error("Camera access error:", err);
            // Check for specific error types
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError("Camera permission denied. Please allow camera access in your browser settings.");
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                setError("No camera device found.");
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                setError("Camera is already in use by another application.");
            } else {
                setError("Could not access camera: " + (err.message || "Unknown error"));
            }
            setMode('choice');
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            processImage(event.target.result);
        };
        reader.readAsDataURL(file);
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
        processImage(canvas.toDataURL('image/jpeg'));

        // Stop camera
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const processImage = (dataUrl) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');

            const sWidth = img.naturalWidth;
            const sHeight = img.naturalHeight;
            const sAspectRatio = sWidth / sHeight;
            const tAspectRatio = targetWidth / targetHeight;

            let dWidth, dHeight, sx, sy;

            if (sAspectRatio > tAspectRatio) {
                // Image is wider than target
                dHeight = sHeight;
                dWidth = sHeight * tAspectRatio;
                sx = (sWidth - dWidth) / 2;
                sy = 0;
            } else {
                // Image is taller than target
                dWidth = sWidth;
                dHeight = sWidth / tAspectRatio;
                sx = 0;
                sy = (sHeight - dHeight) / 2;
            }

            ctx.drawImage(img, sx, sy, dWidth, dHeight, 0, 0, targetWidth, targetHeight);
            setPreviewUrl(canvas.toDataURL('image/jpeg', 0.9));
            setMode('preview');
        };
        img.src = dataUrl;
    };

    const handleConfirm = () => {
        // Convert dataUrl to Blob
        fetch(previewUrl)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], "captured_image.jpg", { type: "image/jpeg" });
                onImageCaptured(file, previewUrl);
                onClose();
            });
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            zIndex: 3000, display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(8px)'
        }}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                    background: 'rgb\(18 37 74\)', borderRadius: '24px', width: '100%',
                    maxWidth: '500px', overflow: 'hidden', border: '1px solid #334155',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                }}
            >
                {/* Header */}
                <div style={{ padding: '1.25rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, color: 'white', fontSize: '1.1rem', fontWeight: 'bold' }}>{title}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ padding: '1.5rem' }}>
                    {mode === 'choice' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <button
                                type="button"
                                onClick={startCamera}
                                style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
                                    padding: '2rem 1rem', background: '#0f172a', border: '1px solid #334155',
                                    borderRadius: '16px', color: 'white', cursor: 'pointer', transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', color: '#3b82f6' }}>
                                    <Camera size={32} />
                                </div>
                                <span style={{ fontWeight: 'bold' }}>Take Photo</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
                                    padding: '2rem 1rem', background: '#0f172a', border: '1px solid #334155',
                                    borderRadius: '16px', color: 'white', cursor: 'pointer', transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', color: '#10b981' }}>
                                    <Upload size={32} />
                                </div>
                                <span style={{ fontWeight: 'bold' }}>Upload File</span>
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept="image/*"
                                onChange={handleFileUpload}
                            />
                            <input
                                type="file"
                                ref={nativeInputRef}
                                style={{ display: 'none' }}
                                accept="image/*"
                                capture={isFrontCamera ? "user" : "environment"}
                                onChange={handleFileUpload}
                            />
                        </div>
                    )}

                    {mode === 'camera' && (
                        <div style={{ position: 'relative', width: '100%', paddingTop: '100%', background: '#000', borderRadius: '16px', overflow: 'hidden' }}>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                onCanPlay={(e) => e.target.play()}
                                style={{
                                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                    objectFit: 'cover', transform: isFrontCamera ? 'scaleX(-1)' : 'none'
                                }}
                            />
                            {/* Face Overlay Guideline */}
                            <div style={{
                                position: 'absolute', top: '10%', left: '10%', right: '10%', bottom: '10%',
                                border: '2px dashed rgba(255,255,255,0.5)', borderRadius: '50%',
                                pointerEvents: 'none'
                            }} />

                            <div style={{
                                position: 'absolute', bottom: '1.5rem', left: 0, right: 0,
                                display: 'flex', justifyContent: 'center', gap: '1.5rem', alignItems: 'center'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => setIsFrontCamera(!isFrontCamera)}
                                    style={{ padding: '10px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', color: 'white', cursor: 'pointer' }}
                                >
                                    <FlipHorizontal size={20} />
                                </button>
                                <button
                                    type="button"
                                    onClick={capturePhoto}
                                    style={{
                                        width: '64px', height: '64px', borderRadius: '50%', background: 'white',
                                        border: '4px solid rgba(255,255,255,0.3)', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                >
                                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#3b82f6' }} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (stream) stream.getTracks().forEach(track => track.stop());
                                        setMode('choice');
                                    }}
                                    style={{ padding: '10px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', color: 'white', cursor: 'pointer' }}
                                >
                                    <RefreshCw size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    {mode === 'preview' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
                            <div style={{
                                width: '250px', height: '250px', borderRadius: '20px',
                                overflow: 'hidden', border: '4px solid #3b82f6', boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)'
                            }}>
                                <img src={previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                                <button
                                    type="button"
                                    onClick={() => setMode('choice')}
                                    style={{
                                        flex: 1, padding: '12px', background: '#334155', border: 'none',
                                        borderRadius: '12px', color: 'white', fontWeight: 'bold', cursor: 'pointer'
                                    }}
                                >
                                    Retake
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirm}
                                    style={{
                                        flex: 2, padding: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        border: 'none', borderRadius: '12px', color: 'white', fontWeight: 'bold',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                                    }}
                                >
                                    <Check size={20} /> Use This Photo
                                </button>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '12px', color: '#ef4444', fontSize: '14px', textAlign: 'center' }}>
                            <p style={{ margin: '0 0 10px 0' }}>{error}</p>
                            <button
                                type="button"
                                onClick={() => nativeInputRef.current?.click()}
                                style={{
                                    padding: '8px 16px', borderRadius: '8px', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold'
                                }}
                            >
                                <Camera size={16} style={{ marginBottom: '-3px', marginRight: '5px' }} />
                                Use Native Camera App
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ImageCapture;
