import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft, CalendarDays, Clock, Loader2, Stethoscope, Pill,
    FileText, User, AlertCircle, History, ChevronDown, ChevronUp
} from 'lucide-react';
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

const formatDateFull = (dateValue) => {
    try {
        return new Date(dateValue).toLocaleDateString('en-IN', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    } catch {
        return String(dateValue || '');
    }
};

const DoctorRecordView = () => {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const { pushToast } = useToast();
    const userInfo = useMemo(() => getUserInfo(), []);
    const token = userInfo?.token || '';
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    const [loading, setLoading] = useState(true);
    const [record, setRecord] = useState(null);
    const [error, setError] = useState('');

    // Patient history
    const [showHistory, setShowHistory] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [patientHistory, setPatientHistory] = useState([]);

    useEffect(() => {
        const fetchRecord = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await axios.get(`/api/medical-records/appointment/${appointmentId}`, {
                    headers: authHeaders
                });
                setRecord(res.data.data);
            } catch (err) {
                const msg = err?.response?.data?.message || 'Failed to load medical record.';
                setError(msg);
                pushToast(msg, 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchRecord();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appointmentId]);

    const loadPatientHistory = async () => {
        if (!record?.patientId?._id) return;
        if (showHistory) {
            setShowHistory(false);
            return;
        }
        setHistoryLoading(true);
        try {
            const res = await axios.get(`/api/medical-records/patient/${record.patientId._id}`, {
                headers: authHeaders
            });
            setPatientHistory(res.data.data || []);
            setShowHistory(true);
        } catch (err) {
            pushToast('Failed to load patient history', 'error');
        } finally {
            setHistoryLoading(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout active="doctor">
                <div className="flex flex-col items-center justify-center gap-3 py-20" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                    <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
                        <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">Loading medical record…</p>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !record) {
        return (
            <DashboardLayout active="doctor">
                <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                    <button
                        onClick={() => navigate('/doctor-dashboard')}
                        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </button>
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="font-medium text-sm">{error || 'No record found for this appointment.'}</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout active="doctor">
            <div className="space-y-6" style={{ animation: 'fadeIn 0.4s ease-out' }}>
                {/* ── Back Button ── */}
                <button
                    onClick={() => navigate('/doctor-dashboard')}
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    Back to Dashboard
                </button>

                {/* ── Header Card ── */}
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
                        <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
                            <FileText className="w-5 h-5" />
                            Consultation Record
                        </h1>
                        <p className="text-blue-100 text-sm mt-1">Detailed medical record for this appointment</p>
                    </div>

                    {/* Patient & Appointment Info */}
                    <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                                {(record.patientId?.name || 'P').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">{record.patientId?.name || 'Patient'}</p>
                                <p className="text-xs text-gray-500">{record.patientId?.email || ''}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-5 text-sm text-gray-600">
                            <span className="inline-flex items-center gap-1.5">
                                <CalendarDays className="w-4 h-4 text-blue-500" />
                                {formatDateFull(record.date)}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <Stethoscope className="w-4 h-4 text-blue-500" />
                                {record.doctorId?.name ? `Dr. ${record.doctorId.name}` : 'Doctor'}
                            </span>
                        </div>
                    </div>

                    {/* Record Details */}
                    <div className="p-6 space-y-5" style={{ animation: 'slideUp 0.35s ease-out' }}>
                        {/* Diagnosis */}
                        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                                </div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600">Diagnosis</h3>
                            </div>
                            <p className="text-gray-900 font-medium text-[15px] leading-relaxed">{record.disease}</p>
                        </div>

                        {/* Symptoms */}
                        <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                                    <AlertCircle className="w-3.5 h-3.5 text-indigo-600" />
                                </div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Symptoms</h3>
                            </div>
                            <p className="text-gray-900 font-medium text-[15px] leading-relaxed">{record.symptoms}</p>
                        </div>

                        {/* Prescription */}
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                                    <Pill className="w-3.5 h-3.5 text-emerald-600" />
                                </div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600">Prescription</h3>
                            </div>
                            <p className="text-gray-900 font-medium text-[15px] leading-relaxed whitespace-pre-wrap">{record.prescription}</p>
                        </div>

                        {/* Notes */}
                        {record.notes && (
                            <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                                        <FileText className="w-3.5 h-3.5 text-amber-600" />
                                    </div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600">Doctor's Notes</h3>
                                </div>
                                <p className="text-gray-700 text-[15px] leading-relaxed whitespace-pre-wrap">{record.notes}</p>
                            </div>
                        )}

                        {/* Record Metadata */}
                        <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
                            <span>Record created: {formatDate(record.createdAt || record.date)}</span>
                            {record.updatedAt && record.updatedAt !== record.createdAt && (
                                <span>Last updated: {formatDate(record.updatedAt)}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── View All Patient History ── */}
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                    <button
                        onClick={loadPatientHistory}
                        disabled={historyLoading}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                                <History className="w-4 h-4 text-violet-600" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-gray-900">View Full Patient History</p>
                                <p className="text-xs text-gray-500">
                                    All consultation records for {record.patientId?.name || 'this patient'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {historyLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                            ) : showHistory ? (
                                <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                        </div>
                    </button>

                    {showHistory && (
                        <div className="border-t border-gray-100 px-6 py-5" style={{ animation: 'slideUp 0.3s ease-out' }}>
                            {patientHistory.length === 0 ? (
                                <div className="text-center py-6">
                                    <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">No previous records found.</p>
                                </div>
                            ) : (
                                <div className="relative">
                                    {/* Timeline line */}
                                    <div className="absolute left-[18px] top-2 bottom-2 w-px bg-gray-200" />

                                    <div className="space-y-0">
                                        {patientHistory.map((rec, idx) => {
                                            const isCurrent = rec.appointmentId === appointmentId;
                                            return (
                                                <div
                                                    key={rec._id}
                                                    className={`relative pl-12 py-4 ${idx !== patientHistory.length - 1 ? 'border-b border-gray-50' : ''}`}
                                                    style={{ animation: `fadeIn 0.3s ease-out ${idx * 0.06}s both` }}
                                                >
                                                    {/* Timeline dot */}
                                                    <div className={`absolute left-[12px] top-[22px] w-[13px] h-[13px] rounded-full border-2 ${
                                                        isCurrent
                                                            ? 'bg-blue-600 border-blue-600 shadow-md shadow-blue-200'
                                                            : 'bg-white border-gray-300'
                                                    }`} />

                                                    <div className={`rounded-xl p-4 border transition-all duration-200 ${
                                                        isCurrent
                                                            ? 'bg-blue-50/60 border-blue-200 shadow-sm'
                                                            : 'bg-gray-50/50 border-gray-100 hover:bg-gray-50 hover:border-gray-200'
                                                    }`}>
                                                        <div className="flex items-start justify-between gap-3 mb-2">
                                                            <div>
                                                                <p className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                                                                    {rec.disease}
                                                                    {isCurrent && (
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wider">
                                                                            Current
                                                                        </span>
                                                                    )}
                                                                </p>
                                                                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                                                                    <CalendarDays className="w-3 h-3" />
                                                                    {formatDate(rec.date)}
                                                                    {rec.doctorId?.name && (
                                                                        <>
                                                                            <span className="text-gray-300">·</span>
                                                                            <span>Dr. {rec.doctorId.name}</span>
                                                                        </>
                                                                    )}
                                                                </p>
                                                            </div>
                                                            {!isCurrent && rec.appointmentId && (
                                                                <Link
                                                                    to={`/doctor/records/${rec.appointmentId}`}
                                                                    className="text-xs px-2.5 py-1 rounded-lg bg-white text-blue-600 border border-blue-100 font-semibold hover:bg-blue-50 transition-colors shrink-0"
                                                                >
                                                                    View
                                                                </Link>
                                                            )}
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                                            <div>
                                                                <span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px]">Symptoms</span>
                                                                <p className="text-gray-700 mt-0.5">{rec.symptoms}</p>
                                                            </div>
                                                            <div>
                                                                <span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px]">Prescription</span>
                                                                <p className="text-gray-700 mt-0.5 line-clamp-2">{rec.prescription}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </DashboardLayout>
    );
};

export default DoctorRecordView;
