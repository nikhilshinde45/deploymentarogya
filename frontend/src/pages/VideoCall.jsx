import React, { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import { useNavigate, useParams } from 'react-router-dom';

const VideoCall = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const myVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerRef = useRef(null);
    const localStreamRef = useRef(null);
    const currentCallRef = useRef(null);

    const [status, setStatus] = useState('Initializing...');
    const [mediaReady, setMediaReady] = useState(false);

    useEffect(() => {
        let destroyed = false;

        const startCall = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
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
                alert('Unable to access camera/microphone. Please allow permissions and try again.');
                setStatus('Media permission denied');
                return;
            }

            const createPeer = (id) =>
                new Peer(id, {
                    config: {
                        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
                    }
                });

            const registerPeerEvents = (peer, shouldDialHost) => {
                peer.on('open', () => {
                    setStatus(shouldDialHost ? 'Connecting to other participant...' : 'Waiting for other participant...');

                    if (shouldDialHost && localStreamRef.current) {
                        const call = peer.call(roomId, localStreamRef.current);
                        currentCallRef.current = call;
                        call.on('stream', (remoteStream) => {
                            if (remoteVideoRef.current) {
                                remoteVideoRef.current.srcObject = remoteStream;
                            }
                            setStatus('Connected');
                        });
                    }
                });

                peer.on('call', (call) => {
                    if (!localStreamRef.current) {
                        return;
                    }
                    currentCallRef.current = call;
                    call.answer(localStreamRef.current);
                    call.on('stream', (remoteStream) => {
                        if (remoteVideoRef.current) {
                            remoteVideoRef.current.srcObject = remoteStream;
                        }
                        setStatus('Connected');
                    });
                });

                peer.on('error', (err) => {
                    // If room id already taken, join as a random peer and dial host.
                    if (err.type === 'unavailable-id' && !shouldDialHost) {
                        const fallbackPeer = createPeer();
                        peerRef.current = fallbackPeer;
                        registerPeerEvents(fallbackPeer, true);
                        return;
                    }
                    console.error('Peer error:', err);
                    setStatus('Connection error');
                });
            };

            const hostPeer = createPeer(roomId);
            peerRef.current = hostPeer;
            registerPeerEvents(hostPeer, false);
        };

        startCall();

        return () => {
            destroyed = true;
            if (currentCallRef.current) {
                currentCallRef.current.close();
            }
            if (peerRef.current) {
                peerRef.current.destroy();
            }
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, [roomId]);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Consultation Video Call</h1>
                    <p className="text-sm text-gray-600">Room: {roomId}</p>
                    <p className="text-sm text-blue-600 mt-1">{status}</p>
                </div>
                <button
                    onClick={() => navigate('/')}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
                >
                    End Call
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black rounded-2xl overflow-hidden border border-gray-200">
                    <div className="px-4 py-2 bg-gray-900 text-white text-sm font-medium">You</div>
                    <video ref={myVideoRef} autoPlay muted playsInline className="w-full h-[320px] object-cover" />
                </div>

                <div className="bg-black rounded-2xl overflow-hidden border border-gray-200">
                    <div className="px-4 py-2 bg-gray-900 text-white text-sm font-medium">Doctor / Patient</div>
                    <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-[320px] object-cover" />
                </div>
            </div>

            {!mediaReady && (
                <p className="text-sm text-gray-500">Waiting for camera and microphone permission...</p>
            )}
        </div>
    );
};

export default VideoCall;
