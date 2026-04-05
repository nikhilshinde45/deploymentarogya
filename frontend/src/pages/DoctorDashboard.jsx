import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
    CalendarDays, Loader2, Stethoscope, Video, Clock, Plus, History,
    Users, CheckCircle2, FileText, Edit3, X, AlertCircle, Eye
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
        setWritingRecordFor(appt);
        if (appt.medicalRecord) {
            // Pre-fill form with existing record data for editing
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
        setWritingRecordFor(null);
        setRecordForm({ disease: '', symptoms: '', prescription: '', notes: '' });
        setIsEditing(false);
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
            // Reload dashboard to reflect changes
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
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Patients</p>
                                <p className="text-3xl font-extrabold text-gray-900 mt-1">{totalPatients}</p>
                            </div>
                            <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center">
                                <Users className="w-5 h-5 text-violet-600" />
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
                                    const badge = statusBadge(appt.status);
                                    return (
                                        <div
                                            key={appt._id}
                                            className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/30 hover:bg-blue-50/30 hover:border-blue-100 transition-all duration-200"
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
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
                                                <button
                                                    onClick={() => startCall(appt.meetingId)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 hover:shadow-md active:scale-[0.97] transition-all duration-200 flex items-center gap-1.5"
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
                                    const badge = statusBadge(appt.status);
                                    const hasRecord = !!appt.medicalRecord;
                                    const canWriteRecord = appt.status !== 'cancelled';

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
                                                {canWriteRecord && (
                                                    <button
                                                        onClick={() => openWriteRecordModal(appt)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 hover:shadow-sm active:scale-[0.97] ${
                                                            hasRecord
                                                                ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                                                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                                        }`}
                                                    >
                                                        {hasRecord ? (
                                                            <><Edit3 className="w-3 h-3" /> Edit Record</>
                                                        ) : (
                                                            <><Plus className="w-3 h-3" /> Write Record</>
                                                        )}
                                                    </button>
                                                )}
                                                {hasRecord && (
                                                    <button
                                                        onClick={() => navigate(`/doctor/records/${appt._id}`)}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:shadow-sm active:scale-[0.97] transition-all duration-200 flex items-center gap-1.5"
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={closeWriteRecordModal}>
                        <div
                            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl relative"
                            style={{ animation: 'modalIn 0.22s ease-out' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isEditing ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                                        {isEditing ? <Edit3 className="w-4 h-4 text-amber-600" /> : <Plus className="w-4 h-4 text-emerald-600" />}
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
                                    className="text-gray-400 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <form onSubmit={handleWriteRecordSubmit} className="p-6 space-y-4">
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
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${
                                            isEditing
                                                ? 'bg-amber-600 hover:bg-amber-700'
                                                : 'bg-emerald-600 hover:bg-emerald-700'
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

export default DoctorDashboard;
