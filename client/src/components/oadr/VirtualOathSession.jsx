import React, { useState, useEffect, useRef } from 'react';
import { ZegoExpressEngine } from 'zego-express-engine-webrtc';
import { getZegoToken, createMeeting } from '../../api';
import api from '../../utils/api';
import { Video, Mic, MicOff, VideoOff, Phone, Users, ShieldCheck, X, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

// --- Zego Helper Components ---

const RemoteView = ({ stream }) => {
    const videoRef = useRef(null);
    useEffect(() => {
        if (videoRef.current && stream.mediaStream) {
            videoRef.current.srcObject = stream.mediaStream;
        }
    }, [stream]);
    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', background: 'rgb\(18 37 74\)', borderRadius: '8px', overflow: 'hidden' }}>
            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px', color: 'white', fontSize: '12px' }}>
                {stream.user.userName || "Officer"}
            </div>
        </div>
    );
};

const Controls = ({ leaveMeeting, toggleMic, toggleWebcam, micOn, webcamOn }) => {
    return (
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', padding: '1rem', background: 'rgb\(18 37 74\)' }}>
            <button
                onClick={() => toggleMic()}
                style={{ width: '50px', height: '50px', borderRadius: '50%', border: 'none', background: micOn ? '#334155' : '#ef4444', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                {micOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <button
                onClick={() => toggleWebcam()}
                style={{ width: '50px', height: '50px', borderRadius: '50%', border: 'none', background: webcamOn ? '#334155' : '#ef4444', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                {webcamOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
            <button
                onClick={() => leaveMeeting()}
                style={{ width: '50px', height: '50px', borderRadius: '50%', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                <Phone size={20} style={{ transform: 'rotate(135deg)' }} />
            </button>
        </div>
    );
};

// --- Main Zego Meeting Component ---

const ZegoMeetingView = ({ onLeave, isMobile: isMobileProp, affidavits = [], meetingId }) => {
    const [isMobileInternal, setIsMobileInternal] = useState(window.innerWidth <= 1024);
    const isMobile = isMobileProp !== undefined ? isMobileProp : isMobileInternal;

    const [zg, setZg] = useState(null);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState([]);
    const [micOn, setMicOn] = useState(true);
    const [cameraOn, setCameraOn] = useState(true);
    const [showSidebar, setShowSidebar] = useState(!isMobile);

    const localVideoRef = useRef(null);
    const userIdRef = useRef("public_" + Math.round(Math.random() * 100000));
    const activeStreamRef = useRef(null);

    useEffect(() => {
        const handleResize = () => setIsMobileInternal(window.innerWidth <= 1024);
        window.addEventListener('resize', handleResize);
        if (isMobile) setShowSidebar(false);
        return () => window.removeEventListener('resize', handleResize);
    }, [isMobile]);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        let mounted = true;
        let engine = null;

        const initSession = async () => {
            if (!meetingId) return;

            try {
                // Get Token & AppID specific for this user/meeting
                const result = await getZegoToken(meetingId, userIdRef.current);
                if (!mounted || !result?.token || !result?.appID) {
                    console.error("Zego token initialization failed");
                    return;
                }
                const { token: fetchedToken, appID } = result;

                const serverUrl = `wss://webliveroom${appID}-api.zegocloud.com/ws`;
                engine = new ZegoExpressEngine(appID, serverUrl);
                setZg(engine);

                engine.on('roomStreamUpdate', async (roomID, updateType, streamList) => {
                    if (updateType === 'ADD') {
                        const newStreams = [];
                        for (const stream of streamList) {
                            try {
                                const remoteStream = await engine.startPlayingStream(stream.streamID);
                                newStreams.push({ ...stream, mediaStream: remoteStream });
                            } catch (e) { console.error(e); }
                        }
                        setRemoteStreams(prev => [...prev, ...newStreams]);
                    } else if (updateType === 'DELETE') {
                        const streamIDs = streamList.map(s => s.streamID);
                        setRemoteStreams(prev => prev.filter(s => !streamIDs.includes(s.streamID)));
                    }
                });

                await engine.loginRoom(
                    meetingId,
                    fetchedToken,
                    { userID: userIdRef.current, userName: "Deponent" },
                    { userUpdate: true }
                );

                const stream = await engine.createStream({ camera: { video: true, audio: true } });

                if (mounted) {
                    setLocalStream(stream);
                    activeStreamRef.current = stream;
                    engine.startPublishingStream(userIdRef.current + "_stream", stream);
                }

            } catch (error) {
                console.error("Zego Init Failed:", error);
            }
        };

        if (meetingId) {
            initSession();
        }

        return () => {
            mounted = false;

            // Kill camera tracks
            if (activeStreamRef.current) {
                activeStreamRef.current.getTracks().forEach(track => track.stop());
            }

            if (engine) {
                if (activeStreamRef.current) engine.destroyStream(activeStreamRef.current);
                engine.logoutRoom(meetingId);
            }
        };
    }, [meetingId]);

    const handleToggleMic = () => {
        if (localStream) {
            const track = localStream.getAudioTracks()[0];
            if (track) {
                track.enabled = !micOn;
                setMicOn(!micOn);
            }
        }
    };

    const handleToggleCamera = () => {
        if (localStream) {
            const track = localStream.getVideoTracks()[0];
            if (track) {
                track.enabled = !cameraOn;
                setCameraOn(!cameraOn);
            }
        }
    };

    const handleLeave = () => {
        // Kill camera immediately
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            if (zg) zg.destroyStream(localStream);
        }

        if (zg) zg.logoutRoom(meetingId);
        onLeave();
    };

    // Layout
    const mainStream = remoteStreams.length > 0 ? remoteStreams[0] : null;

    return (
        <div style={{ display: 'flex', height: '100%', width: '100%', background: '#020617', position: 'relative', overflow: 'hidden' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', height: '100%', overflow: 'hidden' }}>
                <div style={{ flex: 1, position: 'relative', background: '#000', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                    {/* Remote View */}
                    {mainStream ? (
                        <div style={{ flex: 1, position: 'relative' }}>
                            <RemoteView stream={mainStream} />
                        </div>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexDirection: 'column', background: '#020617' }}>
                            <div className="animate-pulse" style={{ width: '100px', height: '100px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                                <Users size={40} />
                            </div>
                            <h3>Connecting to Officer...</h3>
                            <p style={{ fontSize: '12px', color: '#778eaeff' }}>Waiting for video stream...</p>
                        </div>
                    )}

                    {/* Local View PIP */}
                    <div style={{
                        position: 'absolute',
                        bottom: '20px',
                        left: '20px',
                        width: isMobile ? '100px' : '200px',
                        height: isMobile ? '75px' : '150px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: '2px solid rgba(255,255,255,0.2)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                        zIndex: 10,
                        background: 'rgb\(18 37 74\)'
                    }}>
                        <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#3b82f6', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>
                            YOU
                        </div>
                        {!cameraOn && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#333' }}>Camera Off</div>}
                    </div>

                    <button
                        onClick={() => setShowSidebar(!showSidebar)}
                        style={{
                            position: 'absolute',
                            top: '1rem',
                            right: '1rem',
                            zIndex: 20,
                            padding: '0.8rem',
                            borderRadius: '50%',
                            background: 'rgba(0,0,0,0.6)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white',
                            cursor: 'pointer',
                            backdropFilter: 'blur(4px)'
                        }}
                    >
                        {showSidebar ? <X size={20} /> : <FileText size={20} />}
                    </button>
                </div>

                <Controls
                    leaveMeeting={handleLeave}
                    toggleMic={handleToggleMic}
                    toggleWebcam={handleToggleCamera}
                    micOn={micOn}
                    webcamOn={cameraOn}
                />
            </div>

            {/* Sidebar */}
            {showSidebar && (
                <div style={{
                    width: isMobile ? '100%' : '300px',
                    position: isMobile ? 'absolute' : 'relative',
                    inset: isMobile ? '0 0 0 0' : 'auto',
                    zIndex: isMobile ? 30 : 1,
                    background: '#0f172a',
                    borderLeft: '1px solid #334155',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease'
                }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '16px', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FileText size={18} color="#3b82f6" />
                                Session Details
                            </h3>
                            {meetingId && <div style={{ fontSize: '11px', color: '#778eaeff', marginTop: '4px', fontFamily: 'monospace' }}>ID: {meetingId}</div>}
                        </div>
                        {isMobile && <button onClick={() => setShowSidebar(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8' }}><X size={20} /></button>}
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                        {/* Affidavit List */}
                        {affidavits.map((aff) => (
                            <div key={aff.id} style={{ background: 'rgb\(18 37 74\)', borderRadius: '12px', padding: '1rem', border: '1px solid #334155', marginBottom: '1rem' }}>
                                <div style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>{aff.type}</div>
                                <div style={{ color: '#94a3b8', fontSize: '12px' }}>ID: {aff.id}</div>
                            </div>
                        ))}
                        {affidavits.length === 0 && <div style={{ color: '#778eaeff' }}>No details available.</div>}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Container Component ---

const VirtualOathSession = ({ isMobile = false }) => {
    const [meetingId, setMeetingId] = useState(null);
    const [status, setStatus] = useState('initializing');
    const [affidavit, setAffidavit] = useState(null);
    const [allAffidavits, setAllAffidavits] = useState([]);
    const [hasJoined, setHasJoined] = useState(false);

    // Initial check (Token logic moved to inside Zego component or API call)
    // We just need to login or check status.

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                if (!user?.id) return;

                const res = await api.get(`/affidavits/user/${user.id}`);
                const affidavits = res.data.filter(a => a.status === 'submitted');
                setAllAffidavits(affidavits);

                const active = affidavits.find(a =>
                    a.virtual_oath_taken === 'requested' ||
                    a.virtual_oath_taken === 'completed' ||
                    (a.status === 'submitted')
                );

                if (active) {
                    setAffidavit(active);
                    if (status === 'joined') return;

                    if (active.meeting_id) {
                        setMeetingId(active.meeting_id);
                        if (status !== 'joined') setStatus('ready');
                    } else if (active.virtual_oath_taken === 'requested') {
                        setStatus('checking_in');
                    } else {
                        setStatus('checking_in');
                    }
                } else {
                    if (status !== 'joined') setStatus('no_request');
                }
            } catch (err) {
                console.error(err);
                setStatus('no_request');
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 10000); // Polling every 10s
        return () => clearInterval(interval);
    }, [status]);

    // Independent Heartbeat
    useEffect(() => {
        const sendHeartbeat = () => {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                api.post('/user/heartbeat').catch(() => { });
            }
        };
        sendHeartbeat();
        const interval = setInterval(sendHeartbeat, 10000); // Heartbeat every 10s
        return () => clearInterval(interval);
    }, []);

    const handleRequestOath = async () => {
        if (!affidavit) return;
        try {
            // New Create Meeting Logic
            const { meetingId: newMeetingId, err } = await createMeeting(); // Local generation
            if (!newMeetingId) throw new Error("ID Gen failed");

            await api.put('/user/meeting', { meetingId: newMeetingId });
            await api.put(`/affidavits/${affidavit.id}/virtual-oath`, { status: 'requested', meetingId: newMeetingId });
            await api.post('/oath/sessions/start', { affidavitId: affidavit.id, meetingId: newMeetingId });

            setMeetingId(newMeetingId); // Ready to join
            setHasJoined(true);
            setStatus('joined');
        } catch (e) {
            console.error(e);
            alert("Failed to start session");
        }
    };

    const handleJoinMeeting = () => {
        setHasJoined(true);
        setStatus('joined');
    };

    const handleEndSession = () => {
        if (meetingId) api.post('/oath/sessions/end', { meetingId }).catch(() => { });
        setMeetingId(null);
        setHasJoined(false);
        setStatus('waiting');
    };

    // Render logic based on status
    if (status === 'initializing') return <div className="glass-card" style={{ padding: '3rem', color: 'white', textAlign: 'center' }}>Loading...</div>;

    if (status === 'joined' && meetingId) {
        return (
            <div style={{ height: '100vh', width: '100%', overflow: 'hidden' }}>
                <ZegoMeetingView
                    onLeave={handleEndSession}
                    isMobile={isMobile}
                    affidavits={allAffidavits}
                    meetingId={meetingId}
                />
            </div>
        );
    }

    // ... Copy other states (no_request, checkin_in, ready, waiting) from original roughly ...

    if (status === 'checking_in') {
        return (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'white', background: '#0f172a', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Video size={48} color="#3b82f6" style={{ marginBottom: '1rem' }} />
                <h3>Initiate Virtual Oath</h3>
                <button onClick={handleRequestOath} className="btn btn-primary" style={{ marginTop: '1rem', padding: '1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                    Create & Join Meeting
                </button>
            </div>
        );
    }

    if (status === 'ready') {
        // Officer started it or we recovered session
        return (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'white', background: '#0f172a', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <h3>Session Ready</h3>
                <button onClick={handleJoinMeeting} className="btn btn-primary" style={{ marginTop: '1rem', padding: '1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                    Join Video Call
                </button>
            </div>
        );
    }

    return (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'white', background: '#0f172a', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h3>Waiting...</h3>
        </div>
    );
};

export default VirtualOathSession;
