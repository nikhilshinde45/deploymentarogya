import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft, CalendarDays, Clock, Loader2, Stethoscope, Pill,
    FileText, AlertCircle, History, Filter, ChevronDown, User
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
            weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
        });
    } catch {
        return String(dateValue || '');
    }
};

const FILTER_OPTIONS = [
    { key: 'all', label: 'All Records' },
    { key: '7', label: 'Last 7 Days' },
    { key: '30', label: 'Last 30 Days' },
];

const PatientHistoryPage = () => {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const { pushToast } = useToast();
    const userInfo = useMemo(() => getUserInfo(), []);
    const token = userInfo?.token || '';
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState([]);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');
    const [filterOpen, setFilterOpen] = useState(false);
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        const fetchRecords = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await axios.get(`/api/medical-records/patient/${patientId}`, {
                    headers: authHeaders
                });
                setRecords(res.data.data || []);
            } catch (err) {
                const msg = err?.response?.data?.message || 'Failed to load patient history.';
                setError(msg);
                pushToast(msg, 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchRecords();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [patientId]);

    // Filter records by date range
    const filteredRecords = useMemo(() => {
        if (filter === 'all') return records;
        const days = parseInt(filter, 10);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return records.filter(r => new Date(r.date) >= cutoff);
    }, [records, filter]);

    // Patient info from first record
    const patientName = records[0]?.patientId?.name || 'Patient';
    const patientEmail = records[0]?.patientId?.email || '';

    if (loading) {
        return (
            <DashboardLayout active="doctor">
                <div className="flex flex-col items-center justify-center gap-3 py-20" style={{ animation: 'phFadeIn 0.3s ease-out' }}>
                    <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
                        <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">Loading patient history…</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout active="doctor">
            <div className="space-y-6" style={{ animation: 'phFadeIn 0.4s ease-out' }}>
                {/* ── Back Button ── */}
                <button
                    onClick={() => navigate('/doctor-dashboard')}
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    Back to Dashboard
                </button>

                {/* ── Header Card ── */}
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm relative">
                    <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5 rounded-t-2xl">
                        <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
                            <History className="w-5 h-5" />
                            Patient Medical History
                        </h1>
                        <p className="text-violet-100 text-sm mt-1">Complete consultation timeline for this patient</p>
                    </div>

                    {/* Patient Info */}
                    <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-400 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
                                {patientName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">{patientName}</p>
                                <p className="text-sm text-gray-500">{patientEmail}</p>
                            </div>
                        </div>

                        {/* Filter Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setFilterOpen(!filterOpen)}
                                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
                            >
                                <Filter className="w-3.5 h-3.5 text-gray-400" />
                                {FILTER_OPTIONS.find(f => f.key === filter)?.label}
                                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${filterOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {filterOpen && (
                                <div
                                    className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden"
                                    style={{ animation: 'phSlideDown 0.15s ease-out' }}
                                >
                                    {FILTER_OPTIONS.map(opt => (
                                        <button
                                            key={opt.key}
                                            onClick={() => { setFilter(opt.key); setFilterOpen(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                                                filter === opt.key
                                                    ? 'bg-violet-50 text-violet-700'
                                                    : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100 flex items-center gap-6 text-sm text-gray-500">
                        <span className="font-semibold text-gray-700">{filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}</span>
                        {filter !== 'all' && (
                            <span className="text-violet-600 font-medium">
                                Showing last {filter} days
                            </span>
                        )}
                    </div>
                </div>

                {/* ── Error State ── */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-5 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="font-medium text-sm">{error}</p>
                    </div>
                )}

                {/* ── Timeline ── */}
                {!error && filteredRecords.length === 0 ? (
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-12 text-center" style={{ animation: 'phFadeIn 0.3s ease-out' }}>
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No previous records found</p>
                        <p className="text-xs text-gray-400 mt-1">
                            {filter !== 'all' ? 'Try changing the filter to see more records.' : 'This patient has no consultation records yet.'}
                        </p>
                    </div>
                ) : !error && (
                    <div className="relative">
                        {/* Vertical timeline line */}
                        <div className="absolute left-[27px] top-0 bottom-0 w-px bg-gradient-to-b from-violet-300 via-gray-200 to-transparent" />

                        <div className="space-y-4">
                            {filteredRecords.map((rec, idx) => {
                                const isExpanded = expandedId === rec._id;
                                return (
                                    <div
                                        key={rec._id}
                                        className="relative pl-16"
                                        style={{ animation: `phFadeSlideIn 0.4s ease-out ${idx * 0.06}s both` }}
                                    >
                                        {/* Timeline node */}
                                        <div className="absolute left-[20px] top-[24px] w-[15px] h-[15px] rounded-full border-[3px] border-white shadow-md z-10"
                                            style={{
                                                background: idx === 0
                                                    ? 'linear-gradient(135deg, #7c3aed, #6366f1)'
                                                    : '#d1d5db'
                                            }}
                                        />
                                        {/* Connector dot highlight for latest */}
                                        {idx === 0 && (
                                            <div className="absolute left-[16px] top-[20px] w-[23px] h-[23px] rounded-full bg-violet-400/20 animate-pulse" />
                                        )}

                                        {/* Record Card */}
                                        <div
                                            className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-all duration-300 cursor-pointer ${
                                                isExpanded
                                                    ? 'border-violet-200 shadow-md scale-[1.005]'
                                                    : 'border-gray-100 hover:shadow-md hover:scale-[1.005] hover:border-gray-200'
                                            }`}
                                            onClick={() => setExpandedId(isExpanded ? null : rec._id)}
                                        >
                                            {/* Card Header */}
                                            <div className="px-5 py-4 flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2.5 flex-wrap">
                                                        <p className="font-bold text-gray-900 text-lg">{rec.disease}</p>
                                                        {idx === 0 && (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-100 text-violet-700 uppercase tracking-wider">
                                                                Latest
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
                                                        <span className="inline-flex items-center gap-1.5">
                                                            <CalendarDays className="w-4 h-4" />
                                                            {formatDateFull(rec.date)}
                                                        </span>
                                                        {rec.doctorId?.name && (
                                                            <span className="inline-flex items-center gap-1.5">
                                                                <Stethoscope className="w-4 h-4" />
                                                                Dr. {rec.doctorId.name}
                                                            </span>
                                                        )}
                                                        {rec.doctorId?.specialization && (
                                                            <span className="text-gray-400">
                                                                ({rec.doctorId.specialization})
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 mt-1 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                            </div>

                                            {/* Compact Preview (always visible) */}
                                            <div className="px-5 pb-4 grid grid-cols-2 gap-3">
                                                <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-4 py-3">
                                                    <span className="font-bold text-indigo-500 uppercase tracking-wider text-xs flex items-center gap-1.5 mb-1">
                                                        <AlertCircle className="w-3.5 h-3.5" />
                                                        Symptoms
                                                    </span>
                                                    <p className="text-gray-800 text-sm font-medium line-clamp-2 leading-relaxed">{rec.symptoms}</p>
                                                </div>
                                                <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3">
                                                    <span className="font-bold text-emerald-500 uppercase tracking-wider text-xs flex items-center gap-1.5 mb-1">
                                                        <Pill className="w-3.5 h-3.5" />
                                                        Prescription
                                                    </span>
                                                    <p className="text-gray-800 text-sm font-medium line-clamp-2 leading-relaxed">{rec.prescription}</p>
                                                </div>
                                            </div>

                                            {/* Expanded Details */}
                                            {isExpanded && (
                                                <div className="border-t border-gray-100 p-5 space-y-4" style={{ animation: 'phSlideDown 0.25s ease-out' }}>
                                                    {/* Diagnosis */}
                                                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5">
                                                        <div className="flex items-center gap-2.5 mb-3">
                                                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                                                <Stethoscope className="w-4 h-4 text-blue-600" />
                                                            </div>
                                                            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600">Diagnosis</h4>
                                                        </div>
                                                        <p className="text-gray-900 font-medium text-base leading-relaxed">{rec.disease}</p>
                                                    </div>

                                                    {/* Symptoms */}
                                                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-5">
                                                        <div className="flex items-center gap-2.5 mb-3">
                                                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                                                                <AlertCircle className="w-4 h-4 text-indigo-600" />
                                                            </div>
                                                            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Symptoms</h4>
                                                        </div>
                                                        <p className="text-gray-900 font-medium text-base leading-relaxed">{rec.symptoms}</p>
                                                    </div>

                                                    {/* Prescription */}
                                                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-5">
                                                        <div className="flex items-center gap-2.5 mb-3">
                                                            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                                                <Pill className="w-4 h-4 text-emerald-600" />
                                                            </div>
                                                            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600">Prescription</h4>
                                                        </div>
                                                        <p className="text-gray-900 font-medium text-base leading-relaxed whitespace-pre-wrap">{rec.prescription}</p>
                                                    </div>

                                                    {/* Notes */}
                                                    {rec.notes && (
                                                        <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-5">
                                                            <div className="flex items-center gap-2.5 mb-3">
                                                                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                                                                    <FileText className="w-4 h-4 text-amber-600" />
                                                                </div>
                                                                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600">Doctor's Notes</h4>
                                                            </div>
                                                            <p className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap">{rec.notes}</p>
                                                        </div>
                                                    )}

                                                    {/* Metadata */}
                                                    <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
                                                        <span>Record created: {formatDate(rec.createdAt || rec.date)}</span>
                                                        {rec.appointmentId && (
                                                            <Link
                                                                to={`/doctor/records/${rec.appointmentId}`}
                                                                className="text-violet-600 font-semibold hover:text-violet-700 transition-colors text-sm"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                View Full Record →
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Inline animation keyframes */}
            <style>{`
                @keyframes phFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes phFadeSlideIn {
                    from { opacity: 0; transform: translateX(-12px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes phSlideDown {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </DashboardLayout>
    );
};

export default PatientHistoryPage;
