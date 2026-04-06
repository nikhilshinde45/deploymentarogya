import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, ArrowLeft, Stethoscope, Clock, ShieldCheck, Mail } from 'lucide-react';
import { useToast } from '../hooks/useToast';

const DoctorProfileView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [slots, setSlots] = useState([]);
    const [slotLoading, setSlotLoading] = useState(false);
    const [bookingSlotId, setBookingSlotId] = useState('');
    const [slotMessage, setSlotMessage] = useState('');
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const { pushToast } = useToast();

    const today = new Date().toISOString().slice(0, 10);
    const selectedDateIsToday = selectedDate === today;
    const now = new Date();

    const isPastSlot = (slot) => {
        if (!slot || !selectedDate) return false;
        if (!selectedDateIsToday) return false;

        const slotDateTime = new Date(`${selectedDate}T${slot.startTime}:00`);
        return slotDateTime.getTime() <= now.getTime();
    };

    const sortedSlots = [...slots].sort((a, b) => a.startTime.localeCompare(b.startTime));

    const handleSelectSlot = (slot) => {
        if (slot.status === 'booked' || isPastSlot(slot)) {
            return;
        }

        setSelectedSlot(slot);
        setShowConfirmModal(true);
        setSlotMessage('');
    };

    const closeConfirmModal = () => {
        setShowConfirmModal(false);
        setSelectedSlot(null);
    };

    const confirmBooking = async () => {
        if (!selectedSlot) {
            return;
        }

        setShowConfirmModal(false);
        await handleBookSlot(selectedSlot._id);
        setSelectedSlot(null);
    };

    useEffect(() => {
        const fetchDoctor = async () => {
            try {
                const response = await axios.get(`/api/doctors/${id}`);
                setDoctor(response.data.data);
            } catch (err) {
                console.error("Error fetching doctor:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDoctor();
    }, [id]);

    useEffect(() => {
        const fetchSlots = async () => {
            if (!doctor || !selectedDate) {
                return;
            }

            setSlotLoading(true);
            setSlotMessage('');
            try {
                const response = await axios.get(`/api/appointments/slots/${doctor._id}?date=${selectedDate}`);
                setSlots(response.data.data || []);
            } catch (err) {
                console.error('Error fetching slots:', err);
                setSlots([]);
                setSlotMessage('Unable to fetch slots for the selected date.');
            } finally {
                setSlotLoading(false);
            }
        };

        fetchSlots();
    }, [doctor, selectedDate]);

    const getAuthToken = () => {
        try {
            const raw = localStorage.getItem('userInfo');
            if (!raw) {
                return '';
            }
            const parsed = JSON.parse(raw);
            return parsed?.token || '';
        } catch {
            return '';
        }
    };

    const handleBookSlot = async (slotId) => {
        setSlotMessage('');
        setBookingSlotId(slotId);
        try {
            const token = getAuthToken();
            if (!token) {
                setSlotMessage('Please log in as a patient to book an appointment.');
                pushToast('Please log in as patient to continue', 'error');
                return;
            }

            const response = await axios.post(
                '/api/appointments/book',
                { slotId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const meetingId = response.data?.data?.meetingId;
            setSlots((prev) => prev.filter((slot) => slot._id !== slotId));
            setSlotMessage('Appointment booked successfully. Redirecting...');
            pushToast('Appointment booked successfully', 'success');

            // Redirect to dashboard rather than triggering video directly
            setTimeout(() => {
                navigate('/patient-dashboard');
            }, 1000);
        } catch (err) {
            const backendMessage = err?.response?.data?.message;
            setSlotMessage(backendMessage || 'Unable to book this slot.');
            pushToast(backendMessage || 'Unable to book this slot', 'error');
        } finally {
            setBookingSlotId('');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!doctor) {
        return (
            <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100 max-w-lg mx-auto">
                <h2 className="text-2xl font-bold text-gray-800">Doctor not found</h2>
                <button 
                    onClick={() => navigate(-1)} 
                    className="mt-6 px-6 py-2 bg-blue-50 text-blue-600 font-medium rounded-full hover:bg-blue-100 transition-colors"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <button 
                onClick={() => navigate('/')} 
                className="flex items-center text-gray-500 hover:text-blue-600 font-medium transition-colors w-max"
            >
                <ArrowLeft className="w-5 h-5 mr-2" /> Back to Search
            </button>

            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-500 h-32 relative"></div>
                <div className="px-6 pb-8 sm:px-10 relative">
                    {/* Avatar */}
                    <div className="h-28 w-28 bg-white rounded-full flex items-center justify-center p-2 absolute -top-14 shadow-md border border-gray-100">
                        {doctor?.profileImage ? (
                            <img src={doctor.profileImage} alt={doctor.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-4xl font-extrabold uppercase">
                                {doctor?.name?.charAt(0) || 'D'}
                            </div>
                        )}
                    </div>
                    
                    <div className="pt-16 sm:flex sm:items-start sm:justify-between">
                        <div>
                            <div className="flex items-center flex-wrap gap-2">
                                <h1 className="text-3xl font-extrabold text-gray-900 leading-none">
                                    {doctor?.name ? (doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`) : 'Unknown'}
                                </h1>
                                <ShieldCheck className="w-6 h-6 text-emerald-500" title="Verified Profile" />
                            </div>
                            <p className="text-gray-400 font-bold text-sm mt-2 tracking-wider uppercase">
                                ID: {doctor.doctorId}
                            </p>
                        </div>
                        <div className="mt-6 sm:mt-0 flex shrink-0">
                            <a
                                href="#available-slots"
                                className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:shadow-blue-600/40 hover:-translate-y-0.5 transition-all inline-block text-center"
                            >
                                Book Appointment
                            </a>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-3">Professional Details</h3>
                            <ul className="space-y-5">
                                <li className="flex items-center text-gray-700">
                                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mr-4 text-blue-600 shrink-0">
                                        <Stethoscope className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs tracking-wide text-gray-400 font-bold uppercase mb-0.5">Specialization</p>
                                        <p className="font-semibold text-lg">{doctor.specialization}</p>
                                    </div>
                                </li>
                                <li className="flex items-center text-gray-700">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mr-4 text-indigo-600 shrink-0">
                                        <Clock className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs tracking-wide text-gray-400 font-bold uppercase mb-0.5">Experience</p>
                                        <p className="font-semibold text-lg">{doctor.experience} Years Active</p>
                                    </div>
                                </li>
                                <li className="flex items-center text-gray-700">
                                    <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mr-4 text-teal-600 shrink-0">
                                        <Mail className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs tracking-wide text-gray-400 font-bold uppercase mb-0.5">Contact</p>
                                        <p className="font-semibold text-lg">{doctor?.email}</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                        
                        <div className="space-y-4 bg-gray-50 p-6 sm:p-8 rounded-2xl border border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900">About the Doctor</h3>
                            <p className="text-gray-600 leading-relaxed text-base">
                                {doctor.bio || "This practitioner has not provided a detailed biography yet."}
                            </p>
                        </div>
                    </div>

                    <div id="available-slots" className="mt-10 bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Available Slots</h3>
                                <p className="text-sm text-gray-500 mt-1">Select a date and book an open slot.</p>
                            </div>
                            <div className="w-full sm:w-56">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    min={new Date().toISOString().slice(0, 10)}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="ui-input"
                                />
                            </div>
                        </div>

                        {slotLoading ? (
                            <div className="flex items-center gap-2 text-blue-600">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm font-medium">Loading slots...</span>
                            </div>
                        ) : slots.length === 0 ? (
                            <p className="text-sm text-gray-500">No available slots for this date.</p>
                        ) : (
                            <div className="flex flex-wrap gap-3">
                                {sortedSlots.map((slot) => {
                                    const expired = isPastSlot(slot);
                                    const disabled = slot.status === 'booked' || expired || bookingSlotId === slot._id;

                                    return (
                                        <button
                                            key={slot._id}
                                            onClick={() => handleSelectSlot(slot)}
                                            disabled={disabled}
                                            className={`group min-w-[160px] px-4 py-3 rounded-3xl border transition-all text-sm font-semibold ${disabled ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed opacity-50' : 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100 shadow-sm'} ${slot.status === 'booked' ? 'opacity-70' : ''}`}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <span>
                                                    {bookingSlotId === slot._id
                                                        ? 'Booking...'
                                                        : `${slot.startTime} - ${slot.endTime}`}
                                                </span>
                                                {(expired || slot.status === 'booked') && (
                                                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] ${expired ? 'bg-gray-200 text-gray-600' : 'bg-emerald-100 text-emerald-700'}`}>
                                                        {expired ? 'Expired' : 'Booked'}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {slotMessage && (
                            <p className="text-sm font-medium text-gray-700">{slotMessage}</p>
                        )}
                    </div>

                    {showConfirmModal && selectedSlot && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 backdrop-blur-sm bg-slate-900/40">
                            <div className="w-full max-w-md rounded-3xl bg-white/95 border border-slate-200 shadow-2xl shadow-slate-900/10 backdrop-brightness-110 p-6 transform transition duration-300 ease-out scale-100 opacity-100">
                                <div className="space-y-4">
                                    <div className="rounded-3xl bg-slate-50 p-5 border border-slate-100 shadow-sm">
                                        <p className="text-sm text-sky-600 uppercase tracking-[0.24em] font-semibold">Confirm Appointment</p>
                                        <h2 className="mt-3 text-2xl font-bold text-slate-900">Confirm Appointment</h2>
                                        <p className="text-sm text-slate-500">Please review the details before booking.</p>
                                    </div>

                                    <div className="space-y-3 text-slate-700">
                                        <div className="rounded-3xl bg-slate-50 p-4 border border-slate-100">
                                            <p className="text-sm text-slate-500 uppercase tracking-[0.18em] font-semibold">Doctor</p>
                                            <p className="mt-1 text-lg font-semibold text-slate-900">{doctor?.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="rounded-3xl bg-slate-50 p-4 border border-slate-100">
                                                <p className="text-xs uppercase tracking-[0.22em] text-slate-400 font-bold">Date</p>
                                                <p className="mt-2 text-base text-slate-900">{new Date(selectedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                            </div>
                                            <div className="rounded-3xl bg-slate-50 p-4 border border-slate-100">
                                                <p className="text-xs uppercase tracking-[0.22em] text-slate-400 font-bold">Time</p>
                                                <p className="mt-2 text-base text-slate-900">{`${selectedSlot.startTime} - ${selectedSlot.endTime}`}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                            Are you sure you want to book this appointment?
                                        </p>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={closeConfirmModal}
                                            className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={confirmBooking}
                                            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-sky-600 text-white font-semibold shadow-lg shadow-sky-600/20 hover:bg-sky-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                                            disabled={bookingSlotId === selectedSlot._id}
                                        >
                                            {bookingSlotId === selectedSlot._id ? 'Booking...' : 'Confirm Booking'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DoctorProfileView;
