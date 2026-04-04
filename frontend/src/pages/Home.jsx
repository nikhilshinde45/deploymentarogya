import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Search, Filter, Loader2, RefreshCcw } from 'lucide-react';
import DoctorCard from '../components/DoctorCard';

const Home = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchName, setSearchName] = useState('');
    const [specialization, setSpecialization] = useState('');

    // Predefined specializations for dropdown
    const specializations = [
        "General Physician",
        "Cardiologist",
        "Dentist",
        "Dermatologist",
        "Neurologist",
        "Orthopedic",
        "Pediatrician",
        "Psychiatrist",
        "Gynecologist",
        "ENT Specialist",
        "Ophthalmologist",
        "Urologist",
        "Oncologist",
        "Radiologist",
        "Pulmonologist",
        "Endocrinologist",
        "Gastroenterologist",
        "Nephrologist",
        "Other"
    ];

    const fetchDoctors = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let query = '/api/doctors?';
            if (searchName) query += `name=${encodeURIComponent(searchName)}&`;
            if (specialization) query += `specialization=${encodeURIComponent(specialization)}`;

            const response = await axios.get(query);
            setDoctors(response.data.data);
        } catch (err) {
            console.error("Error fetching doctors:", err);
            setError("Failed to load doctors. Please ensure the backend server is running.");
        } finally {
            setLoading(false);
        }
    }, [searchName, specialization]);

    useEffect(() => {
        // Debounce search
        const timeoutId = setTimeout(() => {
            fetchDoctors();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [fetchDoctors]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="text-center max-w-2xl mx-auto space-y-4">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
                    Find Your <span className="text-blue-600">Specialist</span>
                </h1>
                <p className="text-lg text-gray-500">
                    Search and book appointments with the best verified doctors near you.
                </p>
            </div>

            {/* Filter Section */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-center max-w-4xl mx-auto">
                <div className="relative flex-1 w-full pl-2">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition-all sm:text-sm"
                        placeholder="Search doctors by name..."
                    />
                </div>

                <div className="relative w-full sm:w-64 pl-2">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Filter className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition-all sm:text-sm appearance-none"
                    >
                        <option value="">All Specializations</option>
                        {specializations.filter(Boolean).map(spec => (
                            <option key={spec} value={spec}>{spec}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-6xl mx-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-blue-600">
                        <Loader2 className="w-10 h-10 animate-spin" />
                        <p className="mt-4 font-medium text-gray-500">Finding available doctors...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-100 text-red-600 p-8 rounded-2xl flex items-center justify-center flex-col shadow-sm max-w-2xl mx-auto text-center">
                        <p className="font-semibold text-lg">{error}</p>
                        <button onClick={fetchDoctors} className="mt-4 px-6 py-2 bg-red-100 text-red-700 rounded-full flex items-center font-medium hover:bg-red-200 transition-colors">
                            <RefreshCcw className="w-4 h-4 mr-2" /> Try Again
                        </button>
                    </div>
                ) : doctors.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
                        <div className="mx-auto w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-400">
                            <Search className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">No doctors match your criteria</h3>
                        <p className="text-gray-500 mt-2">Try adjusting your search filters or specialization</p>
                        {(searchName || specialization) && (
                            <button
                                onClick={() => { setSearchName(''); setSpecialization(''); }}
                                className="mt-6 px-6 py-2 bg-blue-50 text-blue-600 font-medium rounded-full hover:bg-blue-100 transition-colors inline-block"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {doctors.map(doctor => (
                            <DoctorCard key={doctor._id} doctor={doctor} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
