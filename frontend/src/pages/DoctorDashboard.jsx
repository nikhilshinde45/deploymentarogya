import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
    CalendarDays, Loader2, Stethoscope, Video, Clock, Plus, History,
    Users, CheckCircle2, FileText, Edit3, X, AlertCircle, Eye, VideoOff, FolderClock
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
        upcoming: { label: 'Upcoming', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
        confirmed: { label: 'Upcoming', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
        ongoing: { label: 'Ongoing', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500 animate-pulse' },
        completed: { label: 'Completed', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
        cancelled: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
        past: { label: 'Past', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
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

const DoctorDashboard = () => {
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
    const [patientList, setPatientList] = useState([]);

    const [writingRecordFor, setWritingRecordFor] = useState(null);
    const [recordForm, setRecordForm] = useState({ disease: '', symptoms: '', prescription: '', notes: '' });
    const [recordSubmitLoading, setRecordSubmitLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [modalClosing, setModalClosing] = useState(false);

    const loadDashboard = async () => {
        setLoading(true);
        setError('');

        if (role !== 'doctor') {
            setError('Access denied: doctor role required.');
            pushToast('Doctor access required for this dashboard', 'error');
            setLoading(false);
            return;
        }

        try {
            const apptRes = await axios.get('/api/appointments/doctor', { headers: authHeaders });
            setUpcomingAppointments(apptRes.data.upcomingAppointments || []);
            setPastAppointments(apptRes.data.pastAppointments || []);
            setPatientList(apptRes.data.patientList || []);
        } catch (err) {
            const msg = err?.response?.data?.message || 'Unable to load doctor dashboard.';
            setError(msg);
            pushToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role]);

    const openWriteRecordModal = (appt) => {
        setModalClosing(false);
        setWritingRecordFor(appt);
        if (appt.medicalRecord) {
            setRecordForm({
                disease: appt.medicalRecord.disease || '',
                symptoms: appt.medicalRecord.symptoms || '',
                prescription: appt.medicalRecord.prescription || '',
                notes: appt.medicalRecord.notes || '',
            });
            setIsEditing(true);
        } else {
            setRecordForm({ disease: '', symptoms: '', prescription: '', notes: '' });
            setIsEditing(false);
        }
    };

    const closeWriteRecordModal = () => {
        setModalClosing(true);
        setTimeout(() => {
            setWritingRecordFor(null);
            setRecordForm({ disease: '', symptoms: '', prescription: '', notes: '' });
            setIsEditing(false);
            setModalClosing(false);
        }, 200);
    };

    const handleWriteRecordSubmit = async (e) => {
        e.preventDefault();
        setRecordSubmitLoading(true);
        try {
            await axios.post('/api/medical-records', {
                appointmentId: writingRecordFor._id,
                patientId: writingRecordFor.patient?._id,
                ...recordForm
            }, { headers: authHeaders });

            pushToast(isEditing ? 'Medical record updated.' : 'Medical record saved.', 'success');
            closeWriteRecordModal();
            await loadDashboard();
        } catch (err) {
            pushToast(err?.response?.data?.message || 'Failed to save record', 'error');
        } finally {
            setRecordSubmitLoading(false);
        }
    };

    const startCall = (meetingId) => {
        if (!meetingId) return;
        pushToast('Opening consultation room', 'info', 1600);
        navigate(`/video/${encodeURIComponent(meetingId)}`);
    };

    /** Determine the display-status for a past appointment */
    const pastDisplayStatus = (appt) => {
        if (appt.status === 'completed') return 'completed';
        if (appt.status === 'cancelled') return 'cancelled';
        return 'past'; // confirmed but expired
    };

    // Stats
    const totalUpcoming = upcomingAppointments.length;
    const totalCompleted = pastAppointments.filter(a => a.status === 'completed').length;
    const totalPatients = patientList.length;

    if (loading) {
        return (
            <DashboardLayout active="doctor">
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
        <DashboardLayout active="doctor">
            <div className="space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-5 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="font-medium text-sm">{error}</p>
                    </div>
                )}

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: 'Upcoming', value: totalUpcoming, icon: CalendarDays, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
                        { label: 'Completed', value: totalCompleted, icon: CheckCircle2, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
                        { label: 'Patients', value: totalPatients, icon: Users, iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
                    ].map((stat, i) => (
                        <div
                            key={i}
                            className="group bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-default"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                                    <p className="text-3xl font-extrabold text-gray-900 mt-1">{stat.value}</p>
                                </div>
                                <div className={`w-11 h-11 rounded-xl ${stat.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                    <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Upcoming Appointments ── */}
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Stethoscope className="w-5 h-5 text-blue-600" />
                                Upcoming Appointments
                            </h2>
                            <p className="text-sm text-gray-500 mt-0.5">Start a video consultation with the scheduled patient.</p>
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
                                            className="group flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/30 hover:bg-blue-50/40 hover:border-blue-200 hover:shadow-md hover:scale-[1.01] transition-all duration-200"
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                                                    {(appt.patient?.name || 'P').charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-gray-900 truncate">
                                                        {appt.patient?.name || 'Patient'}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                                                        <span className="flex items-center gap-1">
                                                            <CalendarDays className="w-3.5 h-3.5" />
                                                            {formatDate(appt.date)}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {appt.startTime}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                                                    {badge.label}
                                                </span>
                                                {appt.patient?._id && (
                                                    <button
                                                        onClick={() => navigate(`/doctor/patient-history/${appt.patient._id}`)}
                                                        className="px-3 py-2 bg-violet-50 text-violet-700 border border-violet-200 rounded-xl text-sm font-semibold hover:bg-violet-100 hover:shadow-md active:scale-[0.97] transition-all duration-200 flex items-center gap-1.5"
                                                    >
                                                        <FolderClock className="w-4 h-4" />
                                                        Patient History
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => startCall(appt.meetingId)}
                                                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 hover:shadow-lg active:scale-[0.97] transition-all duration-200 flex items-center gap-1.5 shadow-sm"
                                                >
                                                    <Video className="w-4 h-4" />
                                                    Start Call
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
                            <History className="w-5 h-5 text-gray-500" />
                            Past Appointments
                        </h2>
                        <p className="text-sm text-gray-500 mt-0.5">Your completed and past consultation history.</p>
                    </div>
                    <div className="p-5">
                        {pastAppointments.length === 0 ? (
                            <div className="text-center py-8">
                                <History className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">No past appointments.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pastAppointments.map((appt) => {
                                    const displayStatus = pastDisplayStatus(appt);
                                    const badge = statusBadge(displayStatus);
                                    const hasRecord = !!appt.medicalRecord;
                                    const canWriteRecord = appt.status !== 'cancelled';

                                    return (
                                        <div
                                            key={appt._id}
                                            className="group flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/30 hover:bg-gray-50 hover:shadow-md hover:scale-[1.005] transition-all duration-200"
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${displayStatus === 'completed' ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white' :
                                                    displayStatus === 'cancelled' ? 'bg-gradient-to-br from-red-400 to-red-600 text-white' :
                                                        'bg-gradient-to-br from-amber-400 to-amber-600 text-white'
                                                    }`}>
                                                    {(appt.patient?.name || 'P').charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-gray-900 truncate">
                                                        {appt.patient?.name || 'Patient'}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                                                        <span className="flex items-center gap-1">
                                                            <CalendarDays className="w-3.5 h-3.5" />
                                                            {formatDate(appt.date)}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3.5 h-3.5" />
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
                                                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-violet-50 text-violet-600 border border-violet-200">
                                                        <FileText className="w-3 h-3" />
                                                        Record
                                                    </span>
                                                )}
                                                {/* Disabled Start Call button for past */}
                                                <button
                                                    disabled
                                                    className="px-3 py-1.5 bg-gray-200 text-gray-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 opacity-50 cursor-not-allowed"
                                                    title="Video call not available for past appointments"
                                                >
                                                    <VideoOff className="w-3.5 h-3.5" />
                                                    Call Ended
                                                </button>
                                                {canWriteRecord && (
                                                    <button
                                                        onClick={() => openWriteRecordModal(appt)}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 hover:shadow-md active:scale-[0.97] ${hasRecord
                                                            ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                                                            : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-sm'
                                                            }`}
                                                    >
                                                        {hasRecord ? (
                                                            <><Edit3 className="w-3 h-3" /> Edit Record</>
                                                        ) : (
                                                            <><Plus className="w-3 h-3" /> Add Record</>
                                                        )}
                                                    </button>
                                                )}
                                                {hasRecord && (
                                                    <button
                                                        onClick={() => navigate(`/doctor/records/${appt._id}`)}
                                                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:shadow-md active:scale-[0.97] transition-all duration-200 flex items-center gap-1.5"
                                                    >
                                                        <Eye className="w-3 h-3" />
                                                        View Records
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

                {/* ── Record Writing / Editing Modal ── */}
                {writingRecordFor && (
                    <div
                        className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${modalClosing ? 'dd-modal-overlay-exit' : 'dd-modal-overlay-enter'}`}
                        onClick={closeWriteRecordModal}
                    >
                        <div
                            className={`bg-white rounded-2xl w-full max-w-lg shadow-2xl relative ${modalClosing ? 'dd-modal-exit' : 'dd-modal-enter'}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white rounded-t-2xl">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${isEditing ? 'bg-gradient-to-br from-amber-400 to-amber-500' : 'bg-gradient-to-br from-emerald-400 to-emerald-500'}`}>
                                        {isEditing ? <Edit3 className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">
                                            {isEditing ? 'Edit Consultation Record' : 'Add Consultation Record'}
                                        </h2>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {writingRecordFor.patient?.name || 'Patient'} · {formatDate(writingRecordFor.date)} · {writingRecordFor.startTime}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeWriteRecordModal}
                                    className="text-gray-400 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-all duration-200 hover:rotate-90"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <form onSubmit={handleWriteRecordSubmit} className="p-6 space-y-5">
                                {/* Section header */}
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    <Stethoscope className="w-3.5 h-3.5" />
                                    Diagnosis Information
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold tracking-wide text-gray-500 uppercase">Disease / Diagnosis</label>
                                        <input
                                            type="text"
                                            value={recordForm.disease}
                                            onChange={(e) => setRecordForm({ ...recordForm, disease: e.target.value })}
                                            className="ui-input w-full text-sm"
                                            placeholder="e.g. Viral Fever"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold tracking-wide text-gray-500 uppercase">Symptoms</label>
                                        <input
                                            type="text"
                                            value={recordForm.symptoms}
                                            onChange={(e) => setRecordForm({ ...recordForm, symptoms: e.target.value })}
                                            className="ui-input w-full text-sm"
                                            placeholder="e.g. Cough, High temp"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Section header */}
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest pt-1">
                                    <FileText className="w-3.5 h-3.5" />
                                    Prescription & Notes
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold tracking-wide text-gray-500 uppercase">Prescription</label>
                                    <textarea
                                        value={recordForm.prescription}
                                        onChange={(e) => setRecordForm({ ...recordForm, prescription: e.target.value })}
                                        className="ui-input w-full min-h-[90px] text-sm resize-y"
                                        placeholder="Medicine names, dosage, and duration..."
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold tracking-wide text-gray-500 uppercase">Additional Notes <span className="text-gray-400 font-normal normal-case">(optional)</span></label>
                                    <textarea
                                        value={recordForm.notes}
                                        onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                                        className="ui-input w-full min-h-[60px] text-sm resize-y"
                                        placeholder="Follow-up instructions, observations..."
                                    />
                                </div>
                                <div className="pt-2 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={closeWriteRecordModal}
                                        className="flex-1 ui-btn-secondary text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={recordSubmitLoading}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-lg ${isEditing
                                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700'
                                            : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
                                            }`}
                                    >
                                        {recordSubmitLoading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : isEditing ? (
                                            <Edit3 className="w-4 h-4" />
                                        ) : (
                                            <Plus className="w-4 h-4" />
                                        )}
                                        {isEditing ? 'Update Record' : 'Save Record'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* Inline animation keyframes */}
            <style>{`
                @keyframes ddModalOverlayIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes ddModalOverlayOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
                @keyframes ddModalIn {
                    from { opacity: 0; transform: scale(0.92) translateY(16px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes ddModalOut {
                    from { opacity: 1; transform: scale(1) translateY(0); }
                    to { opacity: 0; transform: scale(0.92) translateY(16px); }
                }
                .dd-modal-overlay-enter {
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(6px);
                    animation: ddModalOverlayIn 0.25s ease-out both;
                }
                .dd-modal-overlay-exit {
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(6px);
                    animation: ddModalOverlayOut 0.2s ease-in both;
                }
                .dd-modal-enter {
                    animation: ddModalIn 0.28s cubic-bezier(0.22, 1, 0.36, 1) both;
                }
                .dd-modal-exit {
                    animation: ddModalOut 0.2s ease-in both;
                }
            `}</style>
        </DashboardLayout>
    );
};

export default DoctorDashboard;
