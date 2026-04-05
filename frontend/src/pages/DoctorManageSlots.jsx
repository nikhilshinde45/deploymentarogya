import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { Loader2, Plus, Clock, CalendarDays, CheckCircle2, ChevronRight, Hash } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useToast } from '../hooks/useToast';

const getUserInfo = () => {
    try {
        return JSON.parse(localStorage.getItem('userInfo') || '{}') || {};
    } catch {
        return {};
    }
};

const DoctorManageSlots = () => {
    const { pushToast } = useToast();
    const userInfo = useMemo(() => getUserInfo(), []);
    const role = userInfo?.role || '';
    const token = userInfo?.token || '';
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    const [slotDate, setSlotDate] = useState(new Date().toISOString().slice(0, 10));
    const [slotStartTime, setSlotStartTime] = useState('09:00');
    const [slotEndTime, setSlotEndTime] = useState('17:00');
    const [slotDuration, setSlotDuration] = useState(30);
    const [creatingSlots, setCreatingSlots] = useState(false);
    
    // For interactive feedback on recent creation
    const [lastCreatedBlocks, setLastCreatedBlocks] = useState([]);
    const [recentStats, setRecentStats] = useState(null);

    if (role !== 'doctor') {
        return (
            <DashboardLayout active="doctor-slots">
                <div className="bg-red-50 text-red-700 p-5 rounded-2xl border border-red-100">
                    <p className="font-medium">Access denied: doctor role required.</p>
                </div>
            </DashboardLayout>
        );
    }

    const handleCreateSlots = async (e) => {
        e.preventDefault();
        setCreatingSlots(true);
        setRecentStats(null);
        setLastCreatedBlocks([]);

        try {
            const res = await axios.post(
                '/api/appointments/slots',
                {
                    date: slotDate,
                    startTime: slotStartTime,
                    endTime: slotEndTime,
                    slotDuration
                },
                { headers: authHeaders }
            );

            const data = res.data.data;
            pushToast(`${data.createdCount} slots created successfully`, 'success');
            setRecentStats({
                created: data.createdCount,
                total: data.totalRequested,
                date: slotDate
            });
            // Show recent slots smoothly
            if (data.slots && data.slots.length > 0) {
                setLastCreatedBlocks(data.slots);
            }
        } catch (err) {
            const msg = err?.response?.data?.message || 'Failed to create slots.';
            pushToast(msg, 'error');
        } finally {
            setCreatingSlots(false);
        }
    };

    return (
        <DashboardLayout active="doctor-slots">
            <div className="max-w-4xl space-y-8">
                
                {/* Header section */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-lg shadow-blue-600/20">
                    <h1 className="text-3xl font-extrabold tracking-tight">Add Availability</h1>
                    <p className="mt-2 text-blue-100 max-w-xl text-sm leading-relaxed">
                        Configure your daily consulting hours. Our system will automatically divide the timeframe into bookable segments according to your specified slot duration.
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 transform translate-x-4 -translate-y-4 text-gray-50 opacity-50">
                        <CalendarDays className="w-48 h-48" />
                    </div>
                    
                    <form onSubmit={handleCreateSlots} className="relative z-10 space-y-8">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-4">
                                <Clock className="w-5 h-5 text-blue-600" />
                                Block Time Configurations
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold tracking-wide text-gray-700 uppercase">Select Date</label>
                                <input
                                    type="date"
                                    value={slotDate}
                                    min={new Date().toISOString().slice(0, 10)}
                                    onChange={(e) => setSlotDate(e.target.value)}
                                    className="ui-input w-full shadow-sm text-lg !py-3"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-bold tracking-wide text-gray-700 uppercase flex items-center justify-between">
                                    Slot Duration
                                    <span className="text-xs text-blue-600 normal-case bg-blue-50 px-2 py-0.5 rounded-full">Per Session</span>
                                </label>
                                <select
                                    value={slotDuration}
                                    onChange={(e) => setSlotDuration(Number(e.target.value))}
                                    className="ui-input w-full shadow-sm text-lg !py-3"
                                >
                                    <option value={15}>15 Minutes</option>
                                    <option value={20}>20 Minutes</option>
                                    <option value={30}>30 Minutes</option>
                                    <option value={45}>45 Minutes</option>
                                    <option value={60}>60 Minutes</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-bold tracking-wide text-gray-700 uppercase">Availability Starts</label>
                                <input
                                    type="time"
                                    value={slotStartTime}
                                    onChange={(e) => setSlotStartTime(e.target.value)}
                                    className="ui-input w-full shadow-sm text-lg !py-3 font-mono"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-bold tracking-wide text-gray-700 uppercase">Availability Ends</label>
                                <input
                                    type="time"
                                    value={slotEndTime}
                                    onChange={(e) => setSlotEndTime(e.target.value)}
                                    className="ui-input w-full shadow-sm text-lg !py-3 font-mono"
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex items-center justify-end">
                            <button
                                type="submit"
                                disabled={creatingSlots}
                                className="px-8 py-3.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 transition-all flex items-center gap-3 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
                            >
                                {creatingSlots ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Generating Network...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-5 h-5" />
                                        Generate Availability Slots
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Interactive Feedback Section */}
                {recentStats && (
                    <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 bg-white rounded-3xl p-6 sm:p-10 border border-emerald-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 transform translate-x-4 -translate-y-4 text-emerald-50 opacity-40">
                            <CheckCircle2 className="w-48 h-48" />
                        </div>
                        
                        <div className="relative z-10">
                            <h3 className="text-xl font-bold flex items-center gap-2 text-emerald-800">
                                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                                Success: Operations Completed
                            </h3>
                            <p className="mt-2 text-emerald-700/80">
                                We just injected {recentStats.created} fresh slots into the database out of {recentStats.total} boundaries mapped for {new Date(recentStats.date).toLocaleDateString()}. Duplicate overlaps were safely skipped.
                            </p>

                            <div className="mt-6 flex flex-wrap gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {lastCreatedBlocks.map((blk) => (
                                    <div key={blk._id} className="inline-flex items-center bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-1.5 rounded-xl font-medium text-sm group transition-all hover:bg-emerald-600 hover:text-white cursor-default">
                                        <span className="font-mono">{blk.startTime}</span>
                                        <ChevronRight className="w-3.5 h-3.5 mx-1 opacity-50" />
                                        <span className="font-mono">{blk.endTime}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {/* Minimal inline style for custom scrollbar if needed */}
            <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #d1fae5; border-radius: 20px; }
            `}} />
        </DashboardLayout>
    );
};

export default DoctorManageSlots;
