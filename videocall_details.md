# 📹 Video Call System – Complete File & Code Reference
# Technology: Jitsi Meet (Embedded iFrame SDK via @jitsi/react-sdk)
# No PeerJS. No Socket.io. No manual WebRTC.

---

## 📂 FILES INVOLVED (Total: 6 files)

| # | File Path | Role |
|---|-----------|------|
| 1 | `frontend/src/pages/VideoCall.jsx` | **MAIN** – Renders the embedded Jitsi meeting |
| 2 | `frontend/src/App.jsx` | Route definition: `/video/:roomId` → `<VideoCall />` |
| 3 | `frontend/src/pages/DoctorDashboard.jsx` | Doctor clicks "Start Call" → navigates to `/video/:meetingId` |
| 4 | `frontend/src/pages/PatientDashboard.jsx` | Patient clicks "Join Call" → navigates to `/video/:meetingId` |
| 5 | `backend/controllers/appointmentController.js` | Generates `meetingId` (UUID) when appointment is booked |
| 6 | `backend/models/Appointment.js` | Stores `meetingId` field in MongoDB |

### Dependency (npm package)
| Package | Version | Location |
|---------|---------|----------|
| `@jitsi/react-sdk` | `^1.4.4` | `frontend/package.json` |

---

## 🔄 DATA FLOW (How a video call happens)

```
1. Patient books appointment (DoctorProfileView.jsx)
        ↓
2. Backend generates meetingId = crypto.randomUUID()  (appointmentController.js)
        ↓
3. meetingId saved to MongoDB Appointment document  (Appointment.js model)
        ↓
4. Doctor sees appointment → clicks "Start Call"  (DoctorDashboard.jsx)
   Patient sees appointment → clicks "Join Call"  (PatientDashboard.jsx)
        ↓
5. Both navigate to:  /video/{meetingId}
        ↓
6. VideoCall.jsx reads roomId from URL → passes as roomName to JitsiMeeting
        ↓
7. Jitsi Meet iframe loads INSIDE the app (meet.jit.si server)
        ↓
8. Both users join the same room → video/audio call works
        ↓
9. On hangup → navigate back to dashboard
```

---

## 📄 FILE 1: frontend/src/pages/VideoCall.jsx
### Purpose: The MAIN video call page. Renders Jitsi Meeting embedded via iframe.
### Route: /video/:roomId

```jsx
import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { ArrowLeft, Video, Loader2 } from 'lucide-react';

const VideoCall = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

    // Get user info from localStorage (same pattern used throughout the app)
    const userInfo = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem('userInfo') || '{}');
        } catch {
            return {};
        }
    }, []);

    const displayName = userInfo.name || userInfo.username || 'Participant';

    const handleApiReady = (externalApi) => {
        setIsLoading(false);

        // Listen for the participant leaving / hangup
        externalApi.on('readyToClose', () => {
            navigate(-1);
        });

        externalApi.on('videoConferenceLeft', () => {
            navigate(-1);
        });
    };

    const handleReadyToClose = () => {
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
```

### Key Configuration Explained:
| Config | Purpose |
|--------|---------|
| `domain="meet.jit.si"` | Uses free public Jitsi server |
| `roomName={roomId}` | Uses appointment's meetingId as room name |
| `prejoinPageEnabled: false` | Skips "enter name" screen, joins immediately |
| `startWithAudioMuted: false` | Auto-enables microphone |
| `startWithVideoMuted: false` | Auto-enables camera |
| `SHOW_JITSI_WATERMARK: false` | Hides Jitsi branding |
| `onApiReady` | Removes loading spinner, attaches hangup listeners |
| `onReadyToClose` | Navigates back to dashboard on hangup |

---

## 📄 FILE 2: frontend/src/App.jsx
### Purpose: Defines the route that maps URL to VideoCall component.

```jsx
// Line 6 - Import
import VideoCall from './pages/VideoCall';

// Line 97 - Route definition
<Route path="/video/:roomId" element={<VideoCall />} />
```

### How it works:
- When user navigates to `/video/abc-123-def`, React Router renders `<VideoCall />`
- `useParams()` inside VideoCall extracts `roomId = "abc-123-def"`
- That roomId becomes the Jitsi room name

---

## 📄 FILE 3: frontend/src/pages/DoctorDashboard.jsx
### Purpose: Doctor clicks "Start Call" button to navigate to video page.

```jsx
// Lines 159-163 - Navigation function
const startCall = (meetingId) => {
    if (!meetingId) return;
    pushToast('Opening consultation room', 'info', 1600);
    navigate(`/video/${encodeURIComponent(meetingId)}`);
};

// Lines 287-293 - UI Button (inside upcoming appointment card)
<button
    onClick={() => startCall(appt.meetingId)}
    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-semibold ..."
>
    <Video className="w-4 h-4" />
    Start Call
</button>
```

### How it works:
- Each appointment object has `appt.meetingId` (fetched from backend API)
- When doctor clicks "Start Call", it navigates to `/video/{meetingId}`
- This loads VideoCall.jsx with that meetingId as the Jitsi room name

---

## 📄 FILE 4: frontend/src/pages/PatientDashboard.jsx
### Purpose: Patient clicks "Join Call" button to navigate to video page.

```jsx
// Lines 159-163 - Navigation function
const joinCall = (meetingId) => {
    if (!meetingId) return;
    pushToast('Joining consultation room', 'info', 1600);
    navigate(`/video/${encodeURIComponent(meetingId)}`);
};

// Lines 327-333 - UI Button (inside upcoming appointment card)
<button
    onClick={() => joinCall(appt.meetingId)}
    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold ..."
>
    <Video className="w-4 h-4" />
    Join Call
</button>
```

### How it works:
- Same as doctor — reads `appt.meetingId` and navigates to `/video/{meetingId}`
- Both doctor and patient end up in the SAME Jitsi room (same meetingId)

---

## 📄 FILE 5: backend/controllers/appointmentController.js
### Purpose: Generates a unique meetingId (UUID) when an appointment is booked.

```javascript
// Line 1 - Import
const crypto = require('crypto');

// Lines 260-271 - Inside bookAppointment function
const meetingId = crypto.randomUUID();

const appointment = await Appointment.create({
    doctor: slot.doctor,
    patient: patientId,
    slot: slot._id,
    date: slot.date,
    startTime: slot.startTime,
    meetingId,          // ← UUID stored here
    status: 'confirmed'
});
```

### How it works:
- `crypto.randomUUID()` generates a UUID like `"f47ac10b-58cc-4372-a567-0e02b2c3d479"`
- This UUID becomes the Jitsi room name
- Since UUIDs are unique, each appointment gets its own private video room
- No one else can accidentally join (room name is unpredictable)

---

## 📄 FILE 6: backend/models/Appointment.js
### Purpose: MongoDB schema that stores the meetingId field.

```javascript
const appointmentSchema = new mongoose.Schema({
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DoctorProfile',
        required: true
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    slot: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Slot',
        required: true,
        unique: true
    },
    date: {
        type: String,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['confirmed', 'completed', 'cancelled'],
        default: 'confirmed'
    },
    meetingId: {           // ← THIS IS THE VIDEO CALL ROOM ID
        type: String,
        required: true,
        unique: true       // Each appointment gets a unique room
    },
    medicalRecord: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MedicalRecord'
    }
}, { timestamps: true });
```

---

## 🔑 WHY JITSI WORKS WITHOUT SOCKET/PEERJS

| Old System (PeerJS + Socket.io) | New System (Jitsi Meet) |
|--------------------------------|------------------------|
| Manual WebRTC peer connections | Jitsi handles all WebRTC internally |
| Socket.io for signaling | Jitsi's own signaling server |
| STUN/TURN server needed | Jitsi handles NAT traversal |
| Complex ICE candidate exchange | Zero configuration needed |
| Breaks across different networks | Works everywhere (WiFi, mobile, VPN) |
| Custom UI for controls | Built-in professional UI |
| Manual audio/video management | Automatic media handling |

### Key Insight:
Jitsi Meet runs on `meet.jit.si` (free public server). When both users open
the same `roomName`, Jitsi's infrastructure handles:
- Signaling (connecting the two peers)
- Media routing (video/audio streams)
- NAT traversal (works across firewalls)
- Encryption (SRTP for media)

Our app ONLY needs to ensure both users navigate to the same URL
(`/video/{same-meetingId}`). Everything else is handled by Jitsi.

---

## 📦 DEPENDENCY IN package.json

```json
// frontend/package.json
{
  "dependencies": {
    "@jitsi/react-sdk": "^1.4.4"
  }
}
```

This package provides the `<JitsiMeeting>` React component that creates
and manages the Jitsi Meet iframe.

---

## ✅ SUMMARY

- **Total files involved**: 6 (4 frontend + 2 backend)
- **NPM package**: `@jitsi/react-sdk` (only frontend dependency)
- **Backend changes**: NONE needed — just generates UUID and stores it
- **How rooms work**: meetingId (UUID) = Jitsi room name
- **No socket.io needed**: Jitsi has its own signaling
- **No PeerJS needed**: Jitsi manages WebRTC internally
- **No STUN/TURN config**: Jitsi handles everything
