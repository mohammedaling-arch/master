import React, { useState, useEffect, useRef } from 'react';
import { ZegoExpressEngine } from 'zego-express-engine-webrtc';
import { getZegoToken } from '../../api';
import { Video, Mic, MicOff, VideoOff, Phone, Users } from 'lucide-react';
import api from '../../utils/api';

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
                {stream.user.userName || stream.user.userID}
            </div>
        </div>
    );
};

const VideoCallSession = ({ deponentName, onEndSession, meetingId }) => {
    const [token, setToken] = useState(null);
    const [zg, setZg] = useState(null);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState([]);
    const [micOn, setMicOn] = useState(true);
    const [cameraOn, setCameraOn] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

    const localVideoRef = useRef(null);
    const userIdRef = useRef("staff_" + Math.floor(Math.random() * 10000));
    const activeStreamRef = useRef(null);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
                // 1. Get Token & AppID
                const result = await getZegoToken(meetingId, userIdRef.current);
                if (!mounted || !result?.token || !result?.appID) {
                    console.error("Zego token initialization failed");
                    return;
                }
                const { token: fetchedToken, appID } = result;
                setToken(fetchedToken);

                // 2. Init Zego Engine
                const serverUrl = `wss://webliveroom${appID}-api.zegocloud.com/ws`;
                engine = new ZegoExpressEngine(appID, serverUrl);
                setZg(engine);

                // 3. Register Callbacks
                engine.on('roomStreamUpdate', async (roomID, updateType, streamList) => {
                    if (updateType === 'ADD') {
                        const newStreams = [];
                        for (const stream of streamList) {
                            try {
                                const remoteStream = await engine.startPlayingStream(stream.streamID);
                                newStreams.push({ ...stream, mediaStream: remoteStream });
                            } catch (err) {
                                console.error("Error playing stream:", err);
                            }
                        }
                        setRemoteStreams(prev => [...prev, ...newStreams]);
                    } else if (updateType === 'DELETE') {
                        const streamIDs = streamList.map(s => s.streamID);
                        setRemoteStreams(prev => prev.filter(s => !streamIDs.includes(s.streamID)));
                    }
                });

                // 4. Login Room
                await engine.loginRoom(
                    meetingId,
                    fetchedToken,
                    { userID: userIdRef.current, userName: "CFO Staff" },
                    { userUpdate: true }
                );

                // 5. Create Local Stream
                const stream = await engine.createStream({
                    camera: { video: true, audio: true }
                });

                if (mounted) {
                    setLocalStream(stream);
                    activeStreamRef.current = stream;
                    setMicOn(true);
                    setCameraOn(true);

                    // 6. Publish
                    engine.startPublishingStream(userIdRef.current + "_stream", stream);

                    // Audit
                    api.post('/oath/sessions/join', { meetingId }).catch(e => console.error("Audit Join Error:", e));
                }

            } catch (error) {
                console.error("Failed to initialize Zego session:", error);
            }
        };

        if (meetingId) {
            initSession();
        }

        return () => {
            mounted = false;

            // Kill physical camera light
            if (activeStreamRef.current) {
                activeStreamRef.current.getTracks().forEach(track => track.stop());
            }

            if (engine) {
                if (activeStreamRef.current) {
                    engine.destroyStream(activeStreamRef.current);
                }
                engine.logoutRoom(meetingId);
                api.post('/oath/sessions/end', { meetingId }).catch(e => console.error("Audit End Error:", e));
            }
        };
    }, [meetingId]);

    const handleToggleMic = () => {
        if (localStream) {
            try {
                // Method 1: mutePublishStreamAudio (affects cloud)
                // zg.mutePublishStreamAudio(localStream, !micOn); 
                // Method 2: localStream.getAudioTracks()[0].enabled (local mute)
                // Zego recommends using muteMicrophone if using SDK managed devices, but here we have a stream.
                // Actually startPublishingStream takes the stream. Muting the track locally works.
                const track = localStream.getAudioTracks()[0];
                if (track) {
                    track.enabled = !micOn;
                    setMicOn(!micOn);
                }
            } catch (err) {
                console.error("Error toggling mic:", err);
            }
        }
    };

    const handleToggleCamera = () => {
        if (localStream) {
            try {
                const track = localStream.getVideoTracks()[0];
                if (track) {
                    track.enabled = !cameraOn;
                    setCameraOn(!cameraOn);
                }
            } catch (err) {
                console.error("Error toggling camera:", err);
            }
        }
    };

    const handleLeave = () => {
        // Stop local tracks immediately
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            if (zg) zg.destroyStream(localStream);
        }

        if (zg) {
            zg.logoutRoom(meetingId);
        }
        onEndSession();
    };

    if (!token) {
        return (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="animate-pulse" style={{ width: '40px', height: '40px', border: '3px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
                    <p>Initializing ZegoCloud Session...</p>
                </div>
            </div>
        );
    }

    // Determine layout
    // Main View: First remote stream (the deponent)
    // Pip: Local stream
    const mainStream = remoteStreams.length > 0 ? remoteStreams[0] : null;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'auto',
            background: '#020617',
            gap: '1rem',
            padding: '1rem',
        }}>
            <div style={{
                flex: 1,
                position: 'relative',
                background: '#0f172a',
                borderRadius: '12px',
                overflow: 'hidden',
                minHeight: '300px',
                maxHeight: '100%',
                transition: 'all 0.3s ease'
            }}>
                {mainStream ? (
                    <RemoteView stream={mainStream} />
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#778eaeff', flexDirection: 'column' }}>
                        <div className="animate-pulse" style={{ width: '100px', height: '100px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                            <Users size={48} />
                        </div>
                        <h3>Waiting for deponent to join...</h3>
                    </div>
                )}

                {/* Local View (Picture-in-Picture) */}
                <div style={{
                    position: 'absolute',
                    bottom: isMobile ? '10px' : '20px',
                    right: isMobile ? '10px' : '20px',
                    width: isMobile ? '100px' : '200px',
                    height: isMobile ? '75px' : '150px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '2px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)',
                    transition: 'all 0.3s ease',
                    zIndex: 10,
                    background: 'rgb\(18 37 74\)'
                }}>
                    <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#3b82f6', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>
                        HOST
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', padding: '1rem' }}>
                <button
                    onClick={handleToggleMic}
                    style={{ width: '50px', height: '50px', borderRadius: '50%', border: 'none', background: micOn ? '#f1f5f9' : '#fee2e2', color: micOn ? 'rgb\(18 37 74\)' : '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    {micOn ? <Mic size={20} /> : <MicOff size={20} />}
                </button>
                <button
                    onClick={handleToggleCamera}
                    style={{ width: '50px', height: '50px', borderRadius: '50%', border: 'none', background: cameraOn ? '#f1f5f9' : '#fee2e2', color: cameraOn ? 'rgb\(18 37 74\)' : '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    {cameraOn ? <Video size={20} /> : <VideoOff size={20} />}
                </button>
                <button
                    onClick={handleLeave}
                    style={{ width: '50px', height: '50px', borderRadius: '50%', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <Phone size={20} style={{ transform: 'rotate(135deg)' }} />
                </button>
            </div>
        </div>
    );
};

export default VideoCallSession;
