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

    // Connection refs — persist across StrictMode double-mount
    const peerRef = useRef(null);
    const socketRef = useRef(null);
    const localStreamRef = useRef(null);
    const currentCallRef = useRef(null);
    const initRef = useRef(false); // Guard against double initialization

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

    useEffect(() => {
        // Guard: prevent double initialization in React StrictMode
        if (initRef.current) {
            console.log('[VideoCall] Already initialized, skipping duplicate mount');
            return;
        }
        initRef.current = true;

        let cleanedUp = false;

        const init = async () => {
            // ── Step 1: Acquire media stream ──
            console.log('[VideoCall] Step 1: Requesting camera/mic...');
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });

                if (cleanedUp) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }

                localStreamRef.current = stream;
                setMediaReady(true);
                if (myVideoRef.current) {
                    myVideoRef.current.srcObject = stream;
                }
                console.log('[VideoCall] Step 1 ✓ Media acquired');
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
                        { urls: 'stun:stun1.l.google.com:19302' }
                    ]
                }
            });
            peerRef.current = peer;

            // ── Step 3: Wait for peer to be ready, THEN connect socket ──
            peer.on('open', (peerId) => {
                if (cleanedUp) return;

                console.log(`[VideoCall] Step 2 ✓ Peer open with ID: ${peerId}`);
                setStatus('Connecting to room...');

                // ── Step 3: Connect socket and join room ──
                console.log('[VideoCall] Step 3: Connecting socket...');
                const socket = io(SOCKET_URL, {
                    transports: ['websocket', 'polling'],
                    reconnection: true,
                    reconnectionAttempts: 5,
                    reconnectionDelay: 1000,
                });
                socketRef.current = socket;

                socket.on('connect', () => {
                    if (cleanedUp) return;
                    console.log(`[VideoCall] Step 3 ✓ Socket connected: ${socket.id}`);
                    console.log(`[VideoCall] Step 4: Joining room ${roomId} with peerId ${peerId}`);
                    socket.emit('join-room', { roomId, peerId });
                    setStatus('Waiting for other participant...');
                });

                socket.on('connect_error', (err) => {
                    console.error('[VideoCall] Socket connect error:', err.message);
                    setStatus('Connection error — retrying...');
                });

                socket.on('disconnect', (reason) => {
                    console.warn(`[VideoCall] Socket disconnected: ${reason}`);
                    if (!cleanedUp) {
                        setStatus('Connection lost — reconnecting...');
                        setIsConnected(false);
                    }
                });

                socket.on('reconnect', () => {
                    console.log('[VideoCall] Socket reconnected, re-joining room...');
                    socket.emit('join-room', { roomId, peerId });
                });

                // ── When another user connects to room, CALL them ──
                socket.on('user-connected', (remotePeerId) => {
                    if (cleanedUp) return;
                    console.log(`[VideoCall] Step 5: User connected with peer ID: ${remotePeerId}`);
                    setStatus('Connecting to participant...');

                    const currentStream = localStreamRef.current;
                    if (!currentStream) {
                        console.error('[VideoCall] No local stream available to make call');
                        return;
                    }

                    console.log(`[VideoCall] Step 6: Calling peer ${remotePeerId}...`);
                    const call = peer.call(remotePeerId, currentStream);
                    if (!call) {
                        console.error('[VideoCall] peer.call() returned null');
                        return;
                    }
                    currentCallRef.current = call;

                    call.on('stream', (remoteStream) => {
                        console.log('[VideoCall] Step 7 ✓ Remote stream received (outgoing call)');
                        if (remoteVideoRef.current) {
                            remoteVideoRef.current.srcObject = remoteStream;
                        }
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
                        console.error('[VideoCall] Call error:', err);
                    });
                });

                // ── When someone CALLS us, answer ──
                peer.on('call', (incomingCall) => {
                    if (cleanedUp) return;

                    const currentStream = localStreamRef.current;
                    if (!currentStream) {
                        console.error('[VideoCall] No local stream available to answer call');
                        return;
                    }

                    console.log('[VideoCall] Incoming call — answering...');
                    currentCallRef.current = incomingCall;
                    incomingCall.answer(currentStream);

                    incomingCall.on('stream', (remoteStream) => {
                        console.log('[VideoCall] Step 7 ✓ Remote stream received (incoming call)');
                        if (remoteVideoRef.current) {
                            remoteVideoRef.current.srcObject = remoteStream;
                        }
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
                console.error('[VideoCall] Peer error:', err);
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

        // ── Cleanup: only runs on TRUE unmount ──
        return () => {
            console.log('[VideoCall] Cleanup running...');
            cleanedUp = true;
            // Don't reset initRef here — StrictMode cleanup should NOT
            // allow re-init on the immediate re-mount

            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            if (currentCallRef.current) {
                currentCallRef.current.close();
                currentCallRef.current = null;
            }
            if (peerRef.current && !peerRef.current.destroyed) {
                peerRef.current.destroy();
                peerRef.current = null;
            }
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => track.stop());
                localStreamRef.current = null;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId]);

    const toggleMute = () => {
        if (!localStreamRef.current) return;
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setIsMuted(!audioTrack.enabled);
        }
    };

    const toggleVideo = () => {
        if (!localStreamRef.current) return;
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            setIsVideoOff(!videoTrack.enabled);
        }
    };

    const endCall = () => {
        console.log('[VideoCall] User ended call');
        if (currentCallRef.current) currentCallRef.current.close();
        if (peerRef.current && !peerRef.current.destroyed) peerRef.current.destroy();
        if (socketRef.current) socketRef.current.disconnect();
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
        }
        initRef.current = false; // Allow re-init if user navigates back
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
