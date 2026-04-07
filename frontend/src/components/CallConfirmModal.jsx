import React from 'react';
import { Video, X, CalendarDays, Clock, User, Stethoscope } from 'lucide-react';

/**
 * Confirmation modal before joining/starting a video consultation.
 *
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - onConfirm: () => void
 *  - appointment: object (the appointment to display)
 *  - role: 'doctor' | 'patient'
 *  - closing: boolean (for exit animation)
 */
const CallConfirmModal = ({ open, onClose, onConfirm, appointment, role, closing }) => {
    if (!open || !appointment) return null;

    const isDoctor = role === 'doctor';
    const personName = isDoctor
        ? appointment.patient?.name || 'Patient'
        : appointment.doctor?.name
            ? (appointment.doctor.name.startsWith('Dr.') ? appointment.doctor.name : `Dr. ${appointment.doctor.name}`)
            : 'Doctor';

    const formatDate = (dateValue) => {
        try {
            return new Date(dateValue).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric'
            });
        } catch {
            return String(dateValue || '');
        }
    };

    const formatTime = (t) => {
        if (!t) return '';
        const [h, m] = t.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
    };

    const endTime = appointment.slot?.endTime || appointment.endTime || '';

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${closing ? 'ccm-overlay-exit' : 'ccm-overlay-enter'}`}
            onClick={onClose}
        >
            <div
                className={`bg-white rounded-2xl w-full max-w-sm shadow-2xl relative overflow-hidden ${closing ? 'ccm-modal-exit' : 'ccm-modal-enter'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 via-blue-600 to-cyan-500 px-6 py-5 text-white relative overflow-hidden">
                    {/* Decorative circles */}
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
                    <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/5 rounded-full" />
                    
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <Video className="w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-bold tracking-tight">
                                {isDoctor ? 'Start Consultation' : 'Join Consultation'}
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/80 hover:bg-white/15 transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {/* Person info */}
                    <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${
                            isDoctor
                                ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white'
                                : 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white'
                        }`}>
                            {personName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                {isDoctor ? 'Patient' : 'Doctor'}
                            </p>
                            <p className="font-semibold text-gray-900 truncate">{personName}</p>
                        </div>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100/60">
                            <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                <CalendarDays className="w-3 h-3" />
                                Date
                            </p>
                            <p className="text-sm text-gray-900 font-medium">{formatDate(appointment.date)}</p>
                        </div>
                        <div className="p-3 bg-violet-50/60 rounded-xl border border-violet-100/60">
                            <p className="text-xs font-bold text-violet-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Time
                            </p>
                            <p className="text-sm text-gray-900 font-medium">
                                {formatTime(appointment.startTime)}
                                {endTime ? ` – ${formatTime(endTime)}` : ''}
                            </p>
                        </div>
                    </div>

                    {/* Message */}
                    <p className="text-sm text-gray-500 text-center leading-relaxed">
                        Do you want to {isDoctor ? 'start' : 'join'} this consultation now?
                    </p>

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all duration-200 active:scale-[0.97]"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm hover:shadow-lg transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-1.5"
                        >
                            <Video className="w-4 h-4" />
                            {isDoctor ? 'Start Call' : 'Join Call'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Animations */}
            <style>{`
                @keyframes ccmOverlayIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes ccmOverlayOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
                @keyframes ccmModalIn {
                    from { opacity: 0; transform: scale(0.9) translateY(20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes ccmModalOut {
                    from { opacity: 1; transform: scale(1) translateY(0); }
                    to { opacity: 0; transform: scale(0.9) translateY(20px); }
                }
                .ccm-overlay-enter {
                    background: rgba(0, 0, 0, 0.45);
                    backdrop-filter: blur(6px);
                    animation: ccmOverlayIn 0.25s ease-out both;
                }
                .ccm-overlay-exit {
                    background: rgba(0, 0, 0, 0.45);
                    backdrop-filter: blur(6px);
                    animation: ccmOverlayOut 0.2s ease-in both;
                }
                .ccm-modal-enter {
                    animation: ccmModalIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
                }
                .ccm-modal-exit {
                    animation: ccmModalOut 0.2s ease-in both;
                }
            `}</style>
        </div>
    );
};

export default CallConfirmModal;
