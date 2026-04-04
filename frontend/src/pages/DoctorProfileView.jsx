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
    const { pushToast } = useToast();

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

            const roomId = response.data?.data?.meetingLink;
            setSlots((prev) => prev.filter((slot) => slot._id !== slotId));
            setSlotMessage('Appointment booked successfully.');
            pushToast('Appointment booked successfully', 'success');

            if (roomId) {
                navigate(`/video/${roomId}`);
            }
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
                        <div className="w-full h-full bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-4xl font-extrabold uppercase">
                            {doctor?.name?.charAt(0) || 'D'}
                        </div>
                    </div>
                    
                    <div className="pt-16 sm:flex sm:items-start sm:justify-between">
                        <div>
                            <div className="flex items-center flex-wrap gap-2">
                                <h1 className="text-3xl font-extrabold text-gray-900 leading-none">Dr. {doctor?.name}</h1>
                                <ShieldCheck className="w-6 h-6 text-emerald-500" title="Verified Profile" />
                            </div>
                            <p className="text-gray-400 font-bold text-sm mt-2 tracking-wider uppercase">
                                ID: {doctor.doctorId}
                            </p>
                        </div>
                        <div className="mt-6 sm:mt-0 flex shrink-0">
                            <button className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:shadow-blue-600/40 hover:-translate-y-0.5 transition-all">
                                Book Appointment
                            </button>
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

                    <div className="mt-10 bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 space-y-5">
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
                                {slots.map((slot) => (
                                    <button
                                        key={slot._id}
                                        onClick={() => handleBookSlot(slot._id)}
                                        disabled={slot.isBooked || bookingSlotId === slot._id}
                                        className="px-4 py-2 rounded-xl border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                                    >
                                        {bookingSlotId === slot._id ? 'Booking...' : slot.time}
                                    </button>
                                ))}
                            </div>
                        )}

                        {slotMessage && (
                            <p className="text-sm font-medium text-gray-700">{slotMessage}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorProfileView;
