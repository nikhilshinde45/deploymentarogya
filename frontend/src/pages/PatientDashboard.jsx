import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
    CalendarDays, Loader2, Pill, ShieldCheck, Clock3, Video,
    CheckCircle2, FileText, X, AlertCircle, Stethoscope, User, VideoOff, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import CallConfirmModal from '../components/CallConfirmModal';
import { useToast } from '../hooks/useToast';

const getUserInfo = () => {
    try {
        return JSON.parse(localStorage.getItem('userInfo') || '{}') || {};
    } catch {
        return {};
    }
};

const formatDate = (dateValue) => {
    try {
        return new Date(dateValue).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    } catch {
        return String(dateValue || '');
    }
};

const statusBadge = (status) => {
    const map = {
        confirmed: { label: 'Upcoming', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
        ongoing: { label: 'Ongoing', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500 animate-pulse' },
        completed: { label: 'Completed', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
        cancelled: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
        missed: { label: 'Not Attended', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
    };
    return map[status] || map.confirmed;
};

/**
 * Determine effective display status for an appointment.
 * If confirmed and currently between startTime and endTime → 'ongoing'
 */
const getDisplayStatus = (appt) => {
    if (appt.status !== 'confirmed') return appt.status;

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    if (appt.date !== today) return appt.status;

    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const endTime = appt.slot?.endTime || appt.startTime;

    if (currentTime >= appt.startTime && currentTime < endTime) {
        return 'ongoing';
    }
    return appt.status;
};

const useCountUp = (end, duration = 1500) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime = null;
        let animationFrame;

        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = currentTime - startTime;

            const easeOutQuart = 1 - Math.pow(1 - progress / duration, 4);
            const currentCount = Math.floor(end * easeOutQuart);

            if (progress < duration) {
                setCount(Math.min(currentCount, end));
                animationFrame = requestAnimationFrame(animate);
            } else {
                setCount(end);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [end, duration]);

    return count;
};

const PatientDashboard = () => {
    const navigate = useNavigate();
    const { pushToast } = useToast();
    const userInfo = useMemo(() => getUserInfo(), []);
    const role = userInfo?.role || '';
    const token = userInfo?.token || '';
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [pastAppointments, setPastAppointments] = useState([]);

    const [viewRecordId, setViewRecordId] = useState(null);
    const [viewRecordAppt, setViewRecordAppt] = useState(null);
    const [recordData, setRecordData] = useState(null);
    const [recordLoading, setRecordLoading] = useState(false);

    // Call confirmation modal state
    const [callConfirmAppt, setCallConfirmAppt] = useState(null);
    const [showCallConfirm, setShowCallConfirm] = useState(false);
    const [callConfirmClosing, setCallConfirmClosing] = useState(false);

    const handleViewRecord = async (appt) => {
        setViewRecordId(appt._id);
        setViewRecordAppt(appt);
        setRecordData(null);
        setRecordLoading(true);
        try {
            const res = await axios.get(`/api/medical-records/appointment/${appt._id}`, { headers: authHeaders });
            setRecordData(res.data.data);
        } catch (err) {
            pushToast('No medical record found or error fetching', 'error');
            setRecordData(null);
            setViewRecordId(null);
            setViewRecordAppt(null);
        } finally {
            setRecordLoading(false);
        }
    };

    const closeRecordModal = () => {
        setViewRecordId(null);
        setViewRecordAppt(null);
        setRecordData(null);
    };

    useEffect(() => {
        const load = async () => {
            if (role !== 'patient') {
                setError('Access denied: patient role required.');
                pushToast('Patient access required for this dashboard', 'error');
                setLoading(false);
                return;
            }

            setLoading(true);
            setError('');
            try {
                const apptRes = await axios.get('/api/appointments/patient', { headers: authHeaders });
                setUpcomingAppointments(apptRes.data.upcomingAppointments || []);
                setPastAppointments(apptRes.data.pastAppointments || []);
            } catch (err) {
                const msg = err?.response?.data?.message || 'Unable to load dashboard data.';
                setError(msg);
                pushToast(msg, 'error');
            } finally {
                setLoading(false);
            }
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role]);

    /** Check if an appointment's call window is active, upcoming, or expired */
    const getCallStatus = (appt) => {
        const now = new Date();
        const dateStr = appt.date; // YYYY-MM-DD
        const startStr = `${dateStr}T${appt.startTime}`;
        const endTimeVal = appt.slot?.endTime || appt.endTime || appt.startTime;
        const endStr = `${dateStr}T${endTimeVal}`;
        const start = new Date(startStr);
        const end = new Date(endStr);

        if (now < start) return 'before';   // too early
        if (now > end) return 'after';      // expired
        return 'active';                    // call window is open
    };

    /** Format 24h time to 12h AM/PM */
    const formatTime12h = (t) => {
        if (!t) return '';
        const [h, m] = t.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
    };

    /** Handle Join Call button click with time validation */
    const handleJoinCallClick = (appt) => {
        const status = getCallStatus(appt);
        if (status === 'before') {
            pushToast(`Consultation has not started yet. Starts at ${formatTime12h(appt.startTime)}`, 'error', 3000);
            return;
        }
        if (status === 'after') {
            pushToast('This consultation slot has expired.', 'error', 3000);
            return;
        }
        // Active — show confirmation modal
        setCallConfirmAppt(appt);
        setShowCallConfirm(true);
        setCallConfirmClosing(false);
    };

    /** User confirmed — navigate to video call */
    const confirmJoinCall = () => {
        if (!callConfirmAppt?.meetingId) return;
        pushToast('Joining consultation room', 'info', 1600);
        navigate(`/video/${encodeURIComponent(callConfirmAppt.meetingId)}`);
        closeCallConfirm();
    };

    const closeCallConfirm = () => {
        setCallConfirmClosing(true);
        setTimeout(() => {
            setShowCallConfirm(false);
            setCallConfirmAppt(null);
            setCallConfirmClosing(false);
        }, 220);
    };

    // Stats
    const totalUpcoming = upcomingAppointments.length;
    const totalCompleted = pastAppointments.filter(a => a.status === 'completed').length;
    const totalRecords = pastAppointments.filter(a => !!a.medicalRecord).length;

    const animatedUpcoming = useCountUp(totalUpcoming);
    const animatedCompleted = useCountUp(totalCompleted);
    const animatedRecords = useCountUp(totalRecords);

    if (loading) {
        return (
            <DashboardLayout active="patient">
                <div className="space-y-8 animate-pulse relative">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white/60 rounded-3xl h-32 border border-gray-100"></div>
                        ))}
                    </div>
                    <div className="bg-white/60 rounded-3xl h-64 border border-gray-100"></div>
                    <div className="bg-white/60 rounded-3xl h-64 border border-gray-100"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout active="patient">
            {/* Atmospheric Background Blob */}
            <div className="fixed top-0 left-0 w-full h-[60vh] bg-gradient-to-b from-blue-50/80 to-transparent z-[0] pointer-events-none blur-3xl"></div>

            <div className="space-y-8 relative z-10">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-5 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="font-medium text-sm">{error}</p>
                    </div>
                )}

                {/* ── Stat Cards with Flow Animation ── */}
                <div className="relative">
                    {/* SVG Connector Dashed Lines (visible on md+) */}
                    <svg className="absolute top-1/2 left-[16%] w-[68%] hidden md:block -z-10 text-blue-200 transform -translate-y-1/2" height="2" viewBox="0 0 100 2" preserveAspectRatio="none">
                        <line x1="0" y1="1" x2="100" y2="1" stroke="currentColor" strokeWidth="2" strokeDasharray="6,8" className="animate-[dash_30s_linear_infinite]" />
                    </svg>

                    <style>{`
                        @keyframes dash {
                            to { stroke-dashoffset: -1000; }
                        }
                    `}</style>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 w-full">
                        {/* 1. Upcoming */}
                        <div className="bg-white/80 backdrop-blur-md rounded-[24px] p-6 shadow-sm border border-white ring-1 ring-black/5 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 group cursor-default">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Upcoming</p>
                                    <p className="text-4xl font-extrabold text-slate-800 tabular-nums tracking-tight">
                                        {animatedUpcoming}
                                    </p>
                                </div>
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
                                    <CalendarDays className="w-6 h-6 text-blue-600 group-hover:animate-bounce" />
                                </div>
                            </div>
                        </div>

                        {/* 2. Completed */}
                        <div className="bg-white/80 backdrop-blur-md rounded-[24px] p-6 shadow-sm border border-white ring-1 ring-black/5 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300 group cursor-default">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Completed</p>
                                    <p className="text-4xl font-extrabold text-slate-800 tabular-nums tracking-tight">
                                        {animatedCompleted}
                                    </p>
                                </div>
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
                                    <CheckCircle2 className="w-6 h-6 text-emerald-600 group-hover:rotate-12 transition-transform" />
                                </div>
                            </div>
                        </div>

                        {/* 3. Records */}
                        <div className="bg-white/80 backdrop-blur-md rounded-[24px] p-6 shadow-sm border border-white ring-1 ring-black/5 hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-1 transition-all duration-300 group cursor-default">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Medical Records</p>
                                    <p className="text-4xl font-extrabold text-slate-800 tabular-nums tracking-tight">
                                        {animatedRecords}
                                    </p>
                                </div>
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-50 to-violet-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
                                    <FileText className="w-6 h-6 text-violet-600 group-hover:-rotate-12 transition-transform" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Upcoming Appointments ── */}
                <div className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                    <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Stethoscope className="w-5 h-5 text-blue-600" />
                                Upcoming Appointments
                            </h2>
                            <p className="text-sm text-gray-500 mt-0.5">Join your video consultation when ready.</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <Video className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="p-5">
                        {upcomingAppointments.length === 0 ? (
                            <div className="text-center py-8">
                                <CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">No upcoming appointments scheduled.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {upcomingAppointments.map((appt) => {
                                    const badge = statusBadge(getDisplayStatus(appt));
                                    return (
                                        <div
                                            key={appt._id}
                                            className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/30 hover:bg-blue-50/30 hover:border-blue-100 transition-all duration-200"
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                {appt.doctor?.profileImage ? (
                                                    <img src={appt.doctor.profileImage} alt={appt.doctor.name} className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-blue-50" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                                                        {(appt.doctor?.name || 'D').charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-gray-900 truncate">
                                                        {appt.doctor?.name ? (appt.doctor.name.startsWith('Dr.') ? appt.doctor.name : `Dr. ${appt.doctor.name}`) : 'Doctor'}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                                                        <span className="flex items-center gap-1">
                                                            <CalendarDays className="w-3.5 h-3.5" />
                                                            {formatDate(appt.date)}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock3 className="w-3.5 h-3.5" />
                                                            {appt.startTime}
                                                        </span>
                                                        {appt.doctor?.specialization && (
                                                            <span className="text-gray-400">
                                                                {appt.doctor.specialization}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                                                    {badge.label}
                                                </span>
                                                {(() => {
                                                    const callStatus = getCallStatus(appt);
                                                    if (callStatus === 'after') {
                                                        return (
                                                            <button
                                                                disabled
                                                                className="px-3 py-2 bg-gray-200 text-gray-400 rounded-xl text-sm font-semibold flex items-center gap-1.5 opacity-50 cursor-not-allowed"
                                                                title="This consultation slot has expired"
                                                            >
                                                                <VideoOff className="w-4 h-4" />
                                                                Expired
                                                            </button>
                                                        );
                                                    }
                                                    if (callStatus === 'before') {
                                                        return (
                                                            <button
                                                                onClick={() => handleJoinCallClick(appt)}
                                                                className="px-4 py-2 bg-gray-100 text-gray-500 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
                                                                title={`Call will be available at ${formatTime12h(appt.startTime)}`}
                                                            >
                                                                <Clock className="w-4 h-4" />
                                                                Starts at {formatTime12h(appt.startTime)}
                                                            </button>
                                                        );
                                                    }
                                                    return (
                                                        <button
                                                            onClick={() => handleJoinCallClick(appt)}
                                                            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 hover:shadow-md active:scale-[0.97] transition-all duration-200 flex items-center gap-1.5"
                                                        >
                                                            <Video className="w-4 h-4" />
                                                            Join Call
                                                        </button>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Past Appointments ── */}
                <div className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                    <div className="px-6 py-5 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-gray-500" />
                            Past Appointments
                        </h2>
                        <p className="text-sm text-gray-500 mt-0.5">Track your consultation history and medical records.</p>
                    </div>
                    <div className="p-5">
                        {pastAppointments.length === 0 ? (
                            <div className="text-center py-8">
                                <ShieldCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">No past appointments.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pastAppointments.map((appt) => {
                                    // A past appointment that is still 'confirmed' means it was missed
                                    const effectiveStatus = appt.status === 'confirmed' ? 'missed' : appt.status;
                                    const badge = statusBadge(effectiveStatus);
                                    const hasRecord = !!appt.medicalRecord;

                                    return (
                                        <div
                                            key={appt._id}
                                            className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/30 hover:bg-gray-50 transition-all duration-200"
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                {appt.doctor?.profileImage ? (
                                                    <img
                                                        src={appt.doctor.profileImage}
                                                        alt={appt.doctor.name}
                                                        className={`w-10 h-10 rounded-full object-cover shrink-0 ring-2 ${appt.status === 'completed' ? 'ring-emerald-100' :
                                                                effectiveStatus === 'missed' ? 'ring-orange-100' :
                                                                    appt.status === 'cancelled' ? 'ring-red-100' : 'ring-gray-100'
                                                            }`}
                                                    />
                                                ) : (
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${appt.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                                            effectiveStatus === 'missed' ? 'bg-orange-100 text-orange-700' :
                                                                appt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                                    'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {(appt.doctor?.name || 'D').charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-gray-900 truncate">
                                                        {appt.doctor?.name ? (appt.doctor.name.startsWith('Dr.') ? appt.doctor.name : `Dr. ${appt.doctor.name}`) : 'Doctor'}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                                                        <span className="flex items-center gap-1">
                                                            <CalendarDays className="w-3.5 h-3.5" />
                                                            {formatDate(appt.date)}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock3 className="w-3.5 h-3.5" />
                                                            {appt.startTime}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                                                    {badge.label}
                                                </span>
                                                {hasRecord && (
                                                    <button
                                                        onClick={() => handleViewRecord(appt)}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:shadow-sm active:scale-[0.97] transition-all duration-200 flex items-center gap-1.5"
                                                    >
                                                        <FileText className="w-3 h-3" />
                                                        View Record
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── View Record Modal ── */}
                {viewRecordId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={closeRecordModal}>
                        <div
                            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl relative"
                            style={{ animation: 'modalIn 0.22s ease-out' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">Consultation Record</h2>
                                        {viewRecordAppt && (
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {formatDate(viewRecordAppt.date)} · {viewRecordAppt.startTime}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={closeRecordModal}
                                    className="text-gray-400 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6">
                                {recordLoading ? (
                                    <div className="py-12 flex flex-col items-center justify-center text-gray-500 gap-2">
                                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                        <p className="text-sm font-medium">Fetching record...</p>
                                    </div>
                                ) : recordData ? (
                                    <div className="space-y-4">
                                        {/* Doctor Info */}
                                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            {recordData.doctorId?.profileImage ? (
                                                <img src={recordData.doctorId.profileImage} alt={recordData.doctorId.name} className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-white shadow-sm" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                                                    {(recordData.doctorId?.name || 'D').charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-semibold text-gray-900 truncate">
                                                    {recordData.doctorId?.name ? (recordData.doctorId.name.startsWith('Dr.') ? recordData.doctorId.name : `Dr. ${recordData.doctorId.name}`) : 'Doctor'}
                                                </p>
                                                <p className="text-xs text-gray-500">{recordData.doctorId?.specialization || 'General Physician'}</p>
                                            </div>
                                        </div>

                                        {/* Diagnosis & Symptoms */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100/60">
                                                <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                                    <Stethoscope className="w-3 h-3" />
                                                    Diagnosis
                                                </p>
                                                <p className="text-sm text-gray-900 font-medium">{recordData.disease}</p>
                                            </div>
                                            <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100/60">
                                                <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" />
                                                    Symptoms
                                                </p>
                                                <p className="text-sm text-gray-900 font-medium">{recordData.symptoms}</p>
                                            </div>
                                        </div>

                                        {/* Prescription */}
                                        <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100/60">
                                            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                                <Pill className="w-3 h-3" />
                                                Prescription
                                            </p>
                                            <p className="text-sm text-gray-900 font-medium whitespace-pre-wrap">{recordData.prescription}</p>
                                        </div>

                                        {/* Notes */}
                                        {recordData.notes && (
                                            <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100/50">
                                                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                                    <FileText className="w-3 h-3" />
                                                    Doctor's Notes
                                                </p>
                                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{recordData.notes}</p>
                                            </div>
                                        )}

                                        {/* Record date */}
                                        <p className="text-xs text-gray-400 text-right pt-1">
                                            Record created: {formatDate(recordData.createdAt || recordData.date)}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">Could not load record details.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Call Confirmation Modal ── */}
                <CallConfirmModal
                    open={showCallConfirm}
                    onClose={closeCallConfirm}
                    onConfirm={confirmJoinCall}
                    appointment={callConfirmAppt}
                    role="patient"
                    closing={callConfirmClosing}
                />
            </div>

            {/* Inline animation keyframe */}
            <style>{`
                @keyframes modalIn {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </DashboardLayout>
    );
};

export default PatientDashboard;
