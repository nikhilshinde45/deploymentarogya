import React, { useEffect, useRef, useState, useCallback } from 'react';
import Peer from 'peerjs';
import { io } from 'socket.io-client';
import { useNavigate, useParams } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Clock, Wifi, WifiOff } from 'lucide-react';

const SOCKET_URL = 'http://localhost:5000';

const VideoCall = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();

    // Video element refs
    const myVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    // Connection refs — persist across renders
    const peerRef = useRef(null);
    const socketRef = useRef(null);
    const localStreamRef = useRef(null);
    const currentCallRef = useRef(null);

    // UI State
    const [status, setStatus] = useState('Initializing...');
    const [mediaReady, setMediaReady] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const timerRef = useRef(null);

    const startTimer = useCallback(() => {
        if (timerRef.current) return;
        timerRef.current = setInterval(() => {
            setCallDuration((prev) => prev + 1);
        }, 1000);
    }, []);

    const formatDuration = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    /** Safely attach a stream to a <video> element and play */
    const attachStream = useCallback((videoEl, stream) => {
        if (!videoEl || !stream) return;
        videoEl.srcObject = stream;
        // Browsers may block autoplay — catch and ignore
        videoEl.play().catch(() => {});
    }, []);

    /** Full teardown of all resources */
    const destroyAll = useCallback(() => {
        console.log('[VideoCall] Destroying all resources...');
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (currentCallRef.current) {
            try { currentCallRef.current.close(); } catch (_) {}
            currentCallRef.current = null;
        }
        if (peerRef.current) {
            try { if (!peerRef.current.destroyed) peerRef.current.destroy(); } catch (_) {}
            peerRef.current = null;
        }
        if (socketRef.current) {
            try { socketRef.current.disconnect(); } catch (_) {}
            socketRef.current = null;
        }
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null;
        }
    }, []);

    useEffect(() => {
        // Always clean up anything from a previous mount first (handles StrictMode)
        destroyAll();

        let cleanedUp = false;

        const init = async () => {
            // ── Step 1: Acquire media stream (ONCE) ──
            console.log('[VideoCall] Step 1: Requesting camera/mic...');
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                });

                if (cleanedUp) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }

                // Ensure all tracks are enabled
                stream.getTracks().forEach((t) => { t.enabled = true; });

                localStreamRef.current = stream;
                setMediaReady(true);
                attachStream(myVideoRef.current, stream);
                console.log('[VideoCall] Step 1 ✓ Media stream ready —', stream.getTracks().map(t => `${t.kind}:${t.readyState}`).join(', '));
            } catch (err) {
                console.error('[VideoCall] Media access error:', err);
                setStatus('Camera/microphone permission denied');
                return;
            }

            // ── Step 2: Create PeerJS instance ──
            console.log('[VideoCall] Step 2: Creating PeerJS instance...');
            const peer = new Peer(undefined, {
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:stun2.l.google.com:19302' },
                        { urls: 'stun:stun3.l.google.com:19302' },
                    ],
                },
            });
            peerRef.current = peer;

            // ── Handle incoming calls (register IMMEDIATELY on peer, not inside socket) ──
            peer.on('call', (incomingCall) => {
                if (cleanedUp) return;

                const currentStream = localStreamRef.current;
                if (!currentStream) {
                    console.error('[VideoCall] No local stream to answer call');
                    return;
                }

                console.log('[VideoCall] Incoming call — answering with local stream...');
                currentCallRef.current = incomingCall;
                incomingCall.answer(currentStream);

                incomingCall.on('stream', (remoteStream) => {
                    if (cleanedUp) return;
                    console.log('[VideoCall] ✓ Stream received from incoming call');
                    attachStream(remoteVideoRef.current, remoteStream);
                    setStatus('Connected');
                    setIsConnected(true);
                    startTimer();
                });

                incomingCall.on('close', () => {
                    console.log('[VideoCall] Incoming call closed');
                    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
                    setStatus('Participant disconnected');
                    setIsConnected(false);
                });

                incomingCall.on('error', (err) => {
                    console.error('[VideoCall] Incoming call error:', err);
                });
            });

            // ── Step 3: Wait for peer to be ready, THEN connect socket ──
            peer.on('open', (peerId) => {
                if (cleanedUp) return;

                console.log(`[VideoCall] Step 2 ✓ Peer connected with ID: ${peerId}`);
                setStatus('Connecting to room...');

                // ── Step 3: Connect socket and join room ──
                console.log('[VideoCall] Step 3: Connecting socket...');
                const socket = io(SOCKET_URL, {
                    transports: ['websocket', 'polling'],
                    reconnection: true,
                    reconnectionAttempts: 10,
                    reconnectionDelay: 1000,
                    forceNew: true,
                });
                socketRef.current = socket;

                socket.on('connect', () => {
                    if (cleanedUp) return;
                    console.log(`[VideoCall] Step 3 ✓ Socket connected: ${socket.id}`);
                    console.log(`[VideoCall] Joining room ${roomId} with peerId ${peerId}`);
                    socket.emit('join-room', { roomId, peerId });
                    setStatus('Waiting for other participant...');
                });

                socket.on('connect_error', (err) => {
                    console.error('[VideoCall] Socket connection error:', err.message);
                    setStatus('Connection error — retrying...');
                });

                socket.on('disconnect', (reason) => {
                    console.warn(`[VideoCall] Socket disconnected: ${reason}`);
                    if (!cleanedUp) {
                        setStatus('Connection lost — reconnecting...');
                        setIsConnected(false);
                    }
                });

                // ── When another user connects to room, CALL them ──
                socket.on('user-connected', (remotePeerId) => {
                    if (cleanedUp) return;
                    console.log(`[VideoCall] User connected: ${remotePeerId}`);
                    setStatus('Connecting to participant...');

                    const currentStream = localStreamRef.current;
                    if (!currentStream) {
                        console.error('[VideoCall] No local stream to make outgoing call');
                        return;
                    }

                    // Small delay to let remote peer fully set up their call handler
                    setTimeout(() => {
                        if (cleanedUp) return;

                        console.log(`[VideoCall] Call initiated to peer ${remotePeerId}`);
                        const call = peer.call(remotePeerId, currentStream);
                        if (!call) {
                            console.error('[VideoCall] peer.call() returned null');
                            return;
                        }
                        currentCallRef.current = call;

                        call.on('stream', (remoteStream) => {
                            if (cleanedUp) return;
                            console.log('[VideoCall] ✓ Stream received from outgoing call');
                            attachStream(remoteVideoRef.current, remoteStream);
                            setStatus('Connected');
                            setIsConnected(true);
                            startTimer();
                        });

                        call.on('close', () => {
                            console.log('[VideoCall] Outgoing call closed');
                            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
                            setStatus('Participant disconnected');
                            setIsConnected(false);
                        });

                        call.on('error', (err) => {
                            console.error('[VideoCall] Outgoing call error:', err);
                        });
                    }, 500);
                });

                // ── Handle remote user disconnect ──
                socket.on('user-disconnected', (remotePeerId) => {
                    console.log(`[VideoCall] User disconnected: ${remotePeerId}`);
                    if (currentCallRef.current) {
                        currentCallRef.current.close();
                        currentCallRef.current = null;
                    }
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = null;
                    }
                    setStatus('Participant disconnected');
                    setIsConnected(false);
                });
            });

            peer.on('error', (err) => {
                console.error('[VideoCall] Peer error:', err.type, err);
                if (!cleanedUp) {
                    setStatus('Connection error — please try again');
                }
            });

            peer.on('disconnected', () => {
                console.warn('[VideoCall] Peer disconnected, attempting reconnect...');
                if (!cleanedUp && peer && !peer.destroyed) {
                    peer.reconnect();
                }
            });
        };

        init();

        // ── Cleanup ──
        return () => {
            console.log('[VideoCall] Cleanup running...');
            cleanedUp = true;
            destroyAll();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId]);

    // Ensure local video stays attached after re-renders
    useEffect(() => {
        if (localStreamRef.current && myVideoRef.current && !myVideoRef.current.srcObject) {
            attachStream(myVideoRef.current, localStreamRef.current);
        }
    });

    const toggleMute = () => {
        const stream = localStreamRef.current;
        if (!stream) return;
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setIsMuted(!audioTrack.enabled);
            console.log(`[VideoCall] Mic ${audioTrack.enabled ? 'ON' : 'OFF'}`);
        }
    };

    const toggleVideo = () => {
        const stream = localStreamRef.current;
        if (!stream) return;
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            setIsVideoOff(!videoTrack.enabled);
            console.log(`[VideoCall] Camera ${videoTrack.enabled ? 'ON' : 'OFF'}`);
        }
    };

    const endCall = () => {
        console.log('[VideoCall] User ended call');
        destroyAll();
        navigate(-1);
    };

    const statusColor = status === 'Connected'
        ? 'text-emerald-600'
        : status.includes('error') || status.includes('denied') || status.includes('disconnected')
            ? 'text-red-500'
            : 'text-blue-600';

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header bar */}
            <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Consultation Video Call</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Room: <span className="font-mono text-gray-700">{roomId}</span></p>
                    <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1.5">
                            {isConnected
                                ? <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                                : <WifiOff className="w-3.5 h-3.5 text-gray-400" />
                            }
                            <p className={`text-sm font-medium ${statusColor}`}>{status}</p>
                        </div>
                        {callDuration > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
                                <Clock className="w-3 h-3" />
                                {formatDuration(callDuration)}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Video grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative bg-gray-900 rounded-2xl overflow-hidden border border-gray-200">
                    <div className="absolute top-3 left-3 z-10 px-3 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                        You
                    </div>
                    <video
                        ref={myVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-[320px] md:h-[380px] object-cover"
                    />
                    {isVideoOff && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                            <VideoOff className="w-12 h-12 text-gray-500" />
                        </div>
                    )}
                </div>

                <div className="relative bg-gray-900 rounded-2xl overflow-hidden border border-gray-200">
                    <div className="absolute top-3 left-3 z-10 px-3 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                        Participant
                    </div>
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-[320px] md:h-[380px] object-cover"
                    />
                    {!isConnected && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800/80 gap-3">
                            <div className="w-10 h-10 rounded-full border-2 border-blue-400 border-t-transparent animate-spin"></div>
                            <p className="text-gray-400 text-sm">Waiting for participant…</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Controls bar */}
            <div className="flex items-center justify-center gap-4 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <button
                    onClick={toggleMute}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                        isMuted
                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    title={isMuted ? 'Unmute' : 'Mute'}
                >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <button
                    onClick={toggleVideo}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                        isVideoOff
                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
                >
                    {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>

                <button
                    onClick={endCall}
                    className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30"
                    title="End call"
                >
                    <PhoneOff className="w-6 h-6" />
                </button>
            </div>

            {!mediaReady && (
                <p className="text-sm text-gray-500 text-center">Waiting for camera and microphone permission...</p>
            )}
        </div>
    );
};

export default VideoCall;
