import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { CalendarDays, Loader2, Search, Stethoscope, Video, UsersRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import MedicalRecordCard from '../components/MedicalRecordCard';
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
        return new Date(dateValue).toLocaleDateString();
    } catch {
        return String(dateValue || '');
    }
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
    const [patientList, setPatientList] = useState([]);

    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState('');
    const [records, setRecords] = useState([]);

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
            const upcoming = apptRes.data.upcomingAppointments || [];
            const patients = apptRes.data.patientList || [];
            setUpcomingAppointments(upcoming);
            setPatientList(patients);

            if (patients.length > 0) {
                setSelectedPatientId(patients[0].patientId?.toString() || patients[0].patientId);
            }
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

    const loadHistory = async (patientId) => {
        if (!patientId) return;
        setHistoryLoading(true);
        setHistoryError('');
        try {
            const res = await axios.get(`/api/records/${patientId}`, { headers: authHeaders });
            setRecords(res.data.data || []);
        } catch (err) {
            const msg = err?.response?.data?.message || 'Unable to fetch patient records.';
            setHistoryError(msg);
            pushToast(msg, 'error');
            setRecords([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        if (selectedPatientId) {
            loadHistory(selectedPatientId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedPatientId]);

    const startCall = (meetingLink) => {
        if (!meetingLink) return;
        pushToast('Opening consultation room', 'info', 1600);
        navigate(`/video/${encodeURIComponent(meetingLink)}`);
    };

    if (loading) {
        return (
            <DashboardLayout active="doctor">
                <div className="flex items-center gap-2 text-blue-600 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Loading your dashboard…</span>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout active="doctor">
            <div className="space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-5">
                        <p className="font-medium">{error}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm lg:col-span-2">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Stethoscope className="w-5 h-5 text-blue-600" />
                                    Upcoming Appointments
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">Start a video consultation with the selected patient.</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <Video className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="mt-4 overflow-x-auto">
                            {upcomingAppointments.length === 0 ? (
                                <p className="text-sm text-gray-500">No upcoming appointments.</p>
                            ) : (
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-600">
                                            <th className="py-2 pr-2">Patient</th>
                                            <th className="py-2 pr-2">Date</th>
                                            <th className="py-2 pr-2">Time</th>
                                            <th className="py-2 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {upcomingAppointments.map((appt) => (
                                            <tr key={appt._id} className="border-t border-gray-100">
                                                <td className="py-3 pr-2 font-medium text-gray-900">
                                                    {appt.patient?.name || 'Patient'}
                                                </td>
                                                <td className="py-3 pr-2 text-gray-700">{formatDate(appt.date)}</td>
                                                <td className="py-3 pr-2 text-gray-700">{appt.time}</td>
                                                <td className="py-3 text-right">
                                                    <button
                                                        onClick={() => startCall(appt.meetingLink)}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                                                    >
                                                        Start Call
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <UsersRound className="w-5 h-5 text-blue-600" />
                                    Patient List
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">Unique patients from your appointment history.</p>
                            </div>
                        </div>

                        <div className="mt-4 space-y-2 max-h-[520px] overflow-y-auto pr-1">
                            {patientList.length === 0 ? (
                                <p className="text-sm text-gray-500">No patients found.</p>
                            ) : (
                                patientList.map((p) => (
                                    <button
                                        key={p.patientId}
                                        type="button"
                                        onClick={() => setSelectedPatientId(p.patientId?.toString ? p.patientId.toString() : p.patientId)}
                                        className={[
                                            'w-full text-left rounded-xl border px-4 py-3 transition-colors',
                                            selectedPatientId === (p.patientId?.toString ? p.patientId.toString() : p.patientId)
                                                ? 'bg-blue-50 border-blue-100'
                                                : 'bg-white border-gray-100 hover:bg-gray-50'
                                        ].join(' ')}
                                    >
                                        <p className="font-semibold text-gray-900">{p.name}</p>
                                        <p className="text-xs text-gray-500 mt-1">ID: {p.uniqueId}</p>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Patient History</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                {selectedPatientId ? `Showing medical records for ${patientList.find((p) => p.patientId?.toString?.() === selectedPatientId)?.name || 'patient'}.` : 'Select a patient to view records.'}
                            </p>
                        </div>
                        <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
                            <CalendarDays className="w-4 h-4" />
                            <span>Records are fetched from the backend.</span>
                        </div>
                    </div>

                    <div className="mt-4">
                        {historyLoading ? (
                            <div className="flex items-center gap-2 text-blue-600">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Loading patient records…</span>
                            </div>
                        ) : historyError ? (
                            <p className="text-sm font-medium text-red-600">{historyError}</p>
                        ) : records.length === 0 ? (
                            <p className="text-sm text-gray-500">No medical records found for this patient.</p>
                        ) : (
                            <div className="space-y-4">
                                {records.map((rec) => (
                                    <MedicalRecordCard key={rec._id} record={rec} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default DoctorDashboard;
