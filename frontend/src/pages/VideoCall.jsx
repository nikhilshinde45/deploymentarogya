import React, { useEffect, useRef, useState, useCallback } from 'react';
import Peer from 'peerjs';
import { io } from 'socket.io-client';
import { useNavigate, useParams } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Clock } from 'lucide-react';

const SOCKET_URL = 'http://localhost:5000';

const VideoCall = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const myVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerRef = useRef(null);
    const socketRef = useRef(null);
    const localStreamRef = useRef(null);
    const currentCallRef = useRef(null);

    const [status, setStatus] = useState('Initializing...');
    const [mediaReady, setMediaReady] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
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
        let destroyed = false;

        const startCall = async () => {
            // 1. Get media stream
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });

                if (destroyed) {
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }

                localStreamRef.current = stream;
                setMediaReady(true);
                if (myVideoRef.current) {
                    myVideoRef.current.srcObject = stream;
                }
            } catch (error) {
                console.error('Media access error:', error);
                setStatus('Camera/microphone permission denied');
                return;
            }

            // 2. Connect to Socket.io for signaling
            const socket = io(SOCKET_URL);
            socketRef.current = socket;

            // 3. Create PeerJS instance
            const peer = new Peer(undefined, {
                config: {
                    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
                }
            });
            peerRef.current = peer;

            const handleRemoteStream = (remoteStream) => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = remoteStream;
                }
                setStatus('Connected');
                startTimer();
            };

            // When our peer is ready, join the socket room
            peer.on('open', (peerId) => {
                setStatus('Waiting for other participant...');
                socket.emit('join-room', { roomId, peerId });
            });

            // When another user connects to the room, call them
            socket.on('user-connected', (remotePeerId) => {
                setStatus('Connecting to participant...');

                if (!localStreamRef.current) return;

                const call = peer.call(remotePeerId, localStreamRef.current);
                currentCallRef.current = call;

                call.on('stream', handleRemoteStream);

                call.on('close', () => {
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = null;
                    }
                    setStatus('Participant disconnected');
                });
            });

            // When someone calls us, answer with our stream
            peer.on('call', (call) => {
                if (!localStreamRef.current) return;

                currentCallRef.current = call;
                call.answer(localStreamRef.current);

                call.on('stream', handleRemoteStream);

                call.on('close', () => {
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = null;
                    }
                    setStatus('Participant disconnected');
                });
            });

            // Handle remote user disconnect
            socket.on('user-disconnected', () => {
                if (currentCallRef.current) {
                    currentCallRef.current.close();
                    currentCallRef.current = null;
                }
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = null;
                }
                setStatus('Participant disconnected');
            });

            peer.on('error', (err) => {
                console.error('Peer error:', err);
                setStatus('Connection error — please try again');
            });
        };

        startCall();

        // Cleanup
        return () => {
            destroyed = true;
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            if (currentCallRef.current) {
                currentCallRef.current.close();
            }
            if (peerRef.current) {
                peerRef.current.destroy();
            }
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, [roomId, startTimer]);

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
        if (currentCallRef.current) currentCallRef.current.close();
        if (peerRef.current) peerRef.current.destroy();
        if (socketRef.current) socketRef.current.disconnect();
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
        }
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
                        <p className={`text-sm font-medium ${statusColor}`}>{status}</p>
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
                    {status !== 'Connected' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-800/80">
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
