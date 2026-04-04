import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { CalendarDays, Loader2, Pill, ShieldCheck, Clock3, Video } from 'lucide-react';
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

const stockLabel = (stock) => {
    if (stock <= 0) return { text: 'Out of stock', className: 'bg-red-50 text-red-700 ring-red-100' };
    if (stock < 10) return { text: 'Low stock', className: 'bg-amber-50 text-amber-800 ring-amber-100' };
    return { text: 'In stock', className: 'bg-emerald-50 text-emerald-800 ring-emerald-100' };
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
    const [records, setRecords] = useState([]);
    const [medicinesPreview, setMedicinesPreview] = useState([]);

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
                const [apptRes, recordsRes, medsRes] = await Promise.all([
                    axios.get('/api/appointments/patient', { headers: authHeaders }),
                    axios.get('/api/records/patient', { headers: authHeaders }),
                    axios.get('/api/medicines', { headers: authHeaders })
                ]);

                setUpcomingAppointments(apptRes.data.upcomingAppointments || []);
                setPastAppointments(apptRes.data.pastAppointments || []);
                setRecords(recordsRes.data.data || []);
                setMedicinesPreview((medsRes.data.data || []).slice(0, 10));
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

    const joinCall = (meetingLink) => {
        if (!meetingLink) return;
        pushToast('Joining consultation room', 'info', 1600);
        navigate(`/video/${encodeURIComponent(meetingLink)}`);
    };

    if (loading) {
        return (
            <DashboardLayout active="patient">
                <div className="flex items-center gap-2 text-blue-600 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Loading your dashboard…</span>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout active="patient">
            <div className="space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-5">
                        <p className="font-medium">{error}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm lg:col-span-1">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Upcoming Appointments</h2>
                                <p className="text-sm text-gray-600 mt-1">Join your video consultation when ready.</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <Video className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 space-y-3">
                            {upcomingAppointments.length === 0 ? (
                                <p className="text-sm text-gray-500">No upcoming appointments.</p>
                            ) : (
                                upcomingAppointments.map((appt) => (
                                    <div
                                        key={appt._id}
                                        className="border border-gray-100 rounded-xl p-4 bg-gray-50/40"
                                    >
                                        <p className="font-semibold text-gray-900">
                                            {appt.doctor?.name ? `Dr. ${appt.doctor.name}` : 'Doctor'}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-700">
                                            <span className="inline-flex items-center gap-2">
                                                <CalendarDays className="w-4 h-4 text-blue-600" />
                                                {formatDate(appt.date)}
                                            </span>
                                            <span className="inline-flex items-center gap-2">
                                                <Clock3 className="w-4 h-4 text-blue-600" />
                                                {appt.time}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => joinCall(appt.meetingLink)}
                                            className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                                        >
                                            Join Call
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm lg:col-span-1">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Past Appointments</h2>
                                <p className="text-sm text-gray-600 mt-1">Track your consultation history.</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-700">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 overflow-x-auto">
                            {pastAppointments.length === 0 ? (
                                <p className="text-sm text-gray-500">No past appointments.</p>
                            ) : (
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-600">
                                            <th className="py-2 pr-2">Doctor</th>
                                            <th className="py-2 pr-2">Date</th>
                                            <th className="py-2 pr-2">Time</th>
                                            <th className="py-2 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pastAppointments.map((appt) => (
                                            <tr key={appt._id} className="border-t border-gray-100">
                                                <td className="py-3 pr-2 font-medium text-gray-900">
                                                    {appt.doctor?.name ? `Dr. ${appt.doctor.name}` : 'Doctor'}
                                                </td>
                                                <td className="py-3 pr-2 text-gray-700">{formatDate(appt.date)}</td>
                                                <td className="py-3 pr-2 text-gray-700">{appt.time}</td>
                                                <td className="py-3 text-right">
                                                    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-100">
                                                        {appt.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm lg:col-span-2 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Medical Records</h2>
                                <p className="text-sm text-gray-600 mt-1">Disease, prescription, and consultation notes.</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                        </div>
                        {records.length === 0 ? (
                            <p className="text-sm text-gray-500">No medical records yet.</p>
                        ) : (
                            <div className="space-y-4">
                                {records.map((rec) => (
                                    <MedicalRecordCard key={rec._id} record={rec} />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm lg:col-span-1 space-y-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Pill className="w-5 h-5 text-blue-600" />
                                Medicine Availability
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">Preview of available medicines (name, price, stock).</p>
                        </div>
                        <div className="overflow-x-auto">
                            {medicinesPreview.length === 0 ? (
                                <p className="text-sm text-gray-500">No medicines available.</p>
                            ) : (
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-600">
                                            <th className="py-2 pr-2">Name</th>
                                            <th className="py-2 pr-2 text-right">Price</th>
                                            <th className="py-2 text-right">Stock</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {medicinesPreview.map((m) => {
                                            const badge = stockLabel(m.stock);
                                            return (
                                                <tr key={m._id} className="border-t border-gray-100">
                                                    <td className="py-3 pr-2 font-medium text-gray-900">{m.name}</td>
                                                    <td className="py-3 pr-2 text-right tabular-nums text-gray-800">
                                                        ${Number(m.price).toFixed(2)}
                                                    </td>
                                                    <td className="py-3 text-right">
                                                        <div className="flex justify-end">
                                                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border ring-1 ring-inset ${badge.className}`}>
                                                                {badge.text}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PatientDashboard;
