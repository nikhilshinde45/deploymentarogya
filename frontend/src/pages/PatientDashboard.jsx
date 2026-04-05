import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
    CalendarDays, Loader2, Pill, ShieldCheck, Clock3, Video,
    CheckCircle2, FileText, X, AlertCircle, Stethoscope, User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
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
        completed: { label: 'Completed', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
        cancelled: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
    };
    return map[status] || map.confirmed;
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

    const joinCall = (meetingId) => {
        if (!meetingId) return;
        pushToast('Joining consultation room', 'info', 1600);
        navigate(`/video/${encodeURIComponent(meetingId)}`);
    };

    // Stats
    const totalUpcoming = upcomingAppointments.length;
    const totalCompleted = pastAppointments.filter(a => a.status === 'completed').length;
    const totalRecords = pastAppointments.filter(a => !!a.medicalRecord).length;

    if (loading) {
        return (
            <DashboardLayout active="patient">
                <div className="flex flex-col items-center justify-center gap-3 py-20">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">Loading your dashboard…</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout active="patient">
            <div className="space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-5 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="font-medium text-sm">{error}</p>
                    </div>
                )}

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Upcoming</p>
                                <p className="text-3xl font-extrabold text-gray-900 mt-1">{totalUpcoming}</p>
                            </div>
                            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                                <CalendarDays className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Completed</p>
                                <p className="text-3xl font-extrabold text-gray-900 mt-1">{totalCompleted}</p>
                            </div>
                            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Medical Records</p>
                                <p className="text-3xl font-extrabold text-gray-900 mt-1">{totalRecords}</p>
                            </div>
                            <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-violet-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Upcoming Appointments ── */}
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
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
                                    const badge = statusBadge(appt.status);
                                    return (
                                        <div
                                            key={appt._id}
                                            className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/30 hover:bg-blue-50/30 hover:border-blue-100 transition-all duration-200"
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                                                    {(appt.doctor?.name || 'D').charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-gray-900 truncate">
                                                        {appt.doctor?.name ? `Dr. ${appt.doctor.name}` : 'Doctor'}
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
                                                <button
                                                    onClick={() => joinCall(appt.meetingId)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 hover:shadow-md active:scale-[0.97] transition-all duration-200 flex items-center gap-1.5"
                                                >
                                                    <Video className="w-4 h-4" />
                                                    Join Call
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Past Appointments ── */}
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
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
                                    const badge = statusBadge(appt.status);
                                    const hasRecord = !!appt.medicalRecord;

                                    return (
                                        <div
                                            key={appt._id}
                                            className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/30 hover:bg-gray-50 transition-all duration-200"
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                                                    appt.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                                    appt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {(appt.doctor?.name || 'D').charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-gray-900 truncate">
                                                        {appt.doctor?.name ? `Dr. ${appt.doctor.name}` : 'Doctor'}
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
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                                                {(recordData.doctorId?.name || 'D').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{recordData.doctorId?.name ? `Dr. ${recordData.doctorId.name}` : 'Doctor'}</p>
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
