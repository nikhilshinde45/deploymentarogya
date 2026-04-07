import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { ArrowLeft, Video, Loader2 } from 'lucide-react';
import axios from 'axios';

const VideoCall = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const hasCompleted = useRef(false);

    // Get user info from localStorage (same pattern used throughout the app)
    const userInfo = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem('userInfo') || '{}');
        } catch {
            return {};
        }
    }, []);

    const displayName = userInfo.name || userInfo.username || 'Participant';
    const token = userInfo?.token || '';

    /** Mark appointment as completed when call ends */
    const markAppointmentCompleted = useCallback(async () => {
        if (hasCompleted.current || !token) return;
        hasCompleted.current = true;
        try {
            // Find the appointment by meetingId (roomId)
            const headers = { Authorization: `Bearer ${token}` };
            const role = userInfo?.role;
            const endpoint = role === 'doctor' ? '/api/appointments/doctor' : '/api/appointments/patient';
            const res = await axios.get(endpoint, { headers });
            const allAppts = [
                ...(res.data.upcomingAppointments || []),
                ...(res.data.pastAppointments || [])
            ];
            const appt = allAppts.find(a => a.meetingId === roomId);
            if (appt && appt.status === 'confirmed') {
                await axios.patch(`/api/appointments/${appt._id}/complete`, {}, { headers });
            }
        } catch (err) {
            console.error('Failed to mark appointment completed:', err);
        }
    }, [token, userInfo?.role, roomId]);

    const handleApiReady = (externalApi) => {
        setIsLoading(false);

        // Listen for the participant leaving / hangup
        externalApi.on('readyToClose', () => {
            markAppointmentCompleted();
            navigate(-1);
        });

        externalApi.on('videoConferenceLeft', () => {
            markAppointmentCompleted();
            navigate(-1);
        });
    };

    const handleReadyToClose = () => {
        markAppointmentCompleted();
        navigate(-1);
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <div className="flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3 shadow-sm flex-shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <Video className="w-4 h-4 text-blue-600" />
                            <h1 className="text-lg font-bold text-gray-900">Consultation Video Call</h1>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Room: <span className="font-mono text-gray-700">{roomId}</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        Live
                    </span>
                </div>
            </div>

            {/* Jitsi Container */}
            <div className="flex-1 relative">
                {isLoading && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-900 gap-4">
                        <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                        <p className="text-gray-300 text-sm font-medium">Setting up your consultation...</p>
                        <p className="text-gray-500 text-xs">Please allow camera and microphone access</p>
                    </div>
                )}
                <JitsiMeeting
                    domain="meet.jit.si"
                    roomName={roomId}
                    getIFrameRef={(iframeRef) => {
                        iframeRef.style.height = '100%';
                        iframeRef.style.width = '100%';
                        iframeRef.style.border = 'none';
                    }}
                    configOverwrite={{
                        startWithAudioMuted: false,
                        startWithVideoMuted: false,
                        disableModeratorIndicator: true,
                        enableEmailInStats: false,
                        prejoinPageEnabled: false,
                        disableThirdPartyRequests: true,
                        disableLocalVideoFlip: false,
                        backgroundAlpha: 0.5,
                        hideConferenceSubject: false,
                        subject: 'ArogyaAi Consultation',
                    }}
                    interfaceConfigOverwrite={{
                        DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                        MOBILE_APP_PROMO: false,
                        SHOW_JITSI_WATERMARK: false,
                        SHOW_WATERMARK_FOR_GUESTS: false,
                        SHOW_BRAND_WATERMARK: false,
                        SHOW_POWERED_BY: false,
                        DEFAULT_BACKGROUND: '#1a1a2e',
                        TOOLBAR_BUTTONS: [
                            'microphone',
                            'camera',
                            'desktop',
                            'fullscreen',
                            'hangup',
                            'chat',
                            'raisehand',
                            'tileview',
                            'select-background',
                            'settings',
                        ],
                    }}
                    userInfo={{
                        displayName: displayName,
                    }}
                    onApiReady={handleApiReady}
                    onReadyToClose={handleReadyToClose}
                />
            </div>
        </div>
    );
};

export default VideoCall;
