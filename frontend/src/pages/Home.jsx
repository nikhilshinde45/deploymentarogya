import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Search, Filter, Loader2, RefreshCcw, ChevronDown, Star, Activity, Phone, ArrowRight, CheckCircle2, Award, Mail } from 'lucide-react';
import DoctorCard from '../components/DoctorCard';
import heroImg from "../assets/doctor-patient.webp";

const faqs = [
    { question: "How do I book an online consultation?", answer: "Simply search for a doctor using our specialized filters, check their available slots, and click 'Book Appointment'. You'll get an immediate confirmation." },
    { question: "Are my medical records safe?", answer: "Yes, we use military-grade encryption to ensure that all your medical history, prescriptions, and video consultation notes remain strictly confidential and secure." },
    { question: "What if I miss my appointment?", answer: "If you miss your scheduled video call, the status will automatically update to 'Not Attended'. You can comfortably rebook a new slot from your patient dashboard." },
    { question: "How does the video consultation work?", answer: "At the time of your appointment, a 'Join Call' button will become active in your dashboard. Clicking it will seamlessly launch a secure peer-to-peer video room with your doctor." },
    { question: "Can I access my prescription online?", answer: "Absolutely! Once your consultation concludes, your doctor can upload a digital prescription directly to your Patient Dashboard under the view medical records section." }
];

const testimonials = [
    { name: "Avinash Kumar", text: "Very good web platform. Well thought out about booking/rescheduling an appointment. Doctor's feedback mechanism is good and describes all the basics in a clear way.", rating: 5, initial: "A" },
    { name: "Priya Sharma", text: "Absolutely loved the clean interface. The video call was crystal clear and I could access my prescription immediately after the consultation ended.", rating: 5, initial: "P" },
    { name: "Dr. Sandeep Patel", text: "As a practitioner, the slot management and medical record timeline features are a lifesaver. Extremely intuitive UI.", rating: 5, initial: "S" }
];

const Home = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchName, setSearchName] = useState('');
    const [specialization, setSpecialization] = useState('');

    const titles = ["Specialist", "Doctor", "Caregiver", "Consultant"];
    const [titleIndex, setTitleIndex] = useState(0);

    const [openFaq, setOpenFaq] = useState(0);
    const [testimonialIdx, setTestimonialIdx] = useState(0);

    const toggleFaq = (index) => setOpenFaq(openFaq === index ? null : index);

    useEffect(() => {
        const interval = setInterval(() => {
            setTitleIndex((prev) => (prev + 1) % titles.length);
        }, 2200);
        return () => clearInterval(interval);
    }, []);

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

            {/* Hero Profile Banner w/ Background */}
            <div className="relative rounded-3xl overflow-hidden bg-white shadow-lg border border-gray-100 py-12 px-4 md:py-16 mb-8 w-full flex flex-col items-center justify-center min-h-[400px] group/hero">
                {/* Background Image — visible and interactive */}
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-[3000ms] ease-out group-hover/hero:scale-110"
                    style={{
                        backgroundImage: `url(${heroImg})`
                    }}
                ></div>
                {/* Single lighter overlay so image is clearly visible */}
                <div className="absolute inset-0 z-[1] bg-gradient-to-b from-white/60 via-white/70 to-white/85"></div>
                {/* Decorative animated gradient blob */}
                <div className="absolute -top-20 -right-20 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse z-[1]"></div>
                <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-cyan-400/15 rounded-full blur-3xl animate-pulse z-[1]" style={{ animationDelay: '1.5s' }}></div>

                {/* Header content strictly positioned over background */}
                <div className="relative z-10 text-center max-w-4xl mx-auto space-y-7 w-full">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight flex flex-col sm:flex-row items-center justify-center gap-x-3 gap-y-2">
                        <span>Find Your</span>
                        <span
                            key={titleIndex}
                            className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 slide-fade-in inline-block drop-shadow-sm"
                            style={{ minWidth: '220px', textAlign: 'left' }}
                        >
                            {titles[titleIndex]}
                        </span>
                    </h1>

                    {/* Marquee Running Text Box */}
                    <div className="overflow-hidden w-full max-w-lg mx-auto rounded-full bg-white/60 backdrop-blur-sm border border-blue-100 py-2.5 shadow-inner relative">
                        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white/80 to-transparent z-10"></div>
                        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white/80 to-transparent z-10"></div>
                        <div className="whitespace-nowrap animate-marquee flex">
                            <p className="text-blue-800 font-semibold tracking-wide pr-8">
                                • Search and book appointments with the best verified doctors near you • 24/7 Availability • Secure Consultations •
                            </p>
                            <p className="text-blue-800 font-semibold tracking-wide pr-8" aria-hidden="true">
                                • Search and book appointments with the best verified doctors near you • 24/7 Availability • Secure Consultations •
                            </p>
                        </div>
                    </div>

                    {/* Filter Section */}
                    <div className="bg-white p-2 sm:p-3 rounded-2xl shadow-2xl shadow-blue-900/10 border border-blue-50 flex flex-col sm:flex-row gap-2 items-center w-full max-w-4xl mx-auto mt-8 relative z-20 transition-all hover:border-blue-200 group/search-bar">
                        <div className="relative flex-1 w-full pl-2">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-blue-500 transition-transform group-focus-within/search-bar:scale-110" />
                            </div>
                            <input
                                type="text"
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                                className="block w-full pl-10 pr-3 py-4 border-none rounded-xl leading-5 bg-transparent placeholder-gray-400 focus:outline-none focus:ring-0 transition-all sm:text-sm font-medium"
                                placeholder="Search doctors by name..."
                            />
                        </div>

                        <div className="h-8 w-px bg-gray-100 hidden sm:block"></div>

                        <div className="relative w-full sm:w-64 pl-2">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Filter className="h-5 w-5 text-blue-500" />
                            </div>
                            <select
                                value={specialization}
                                onChange={(e) => setSpecialization(e.target.value)}
                                className="block w-full pl-10 pr-10 py-4 border-none rounded-xl leading-5 bg-transparent focus:outline-none focus:ring-0 transition-all sm:text-sm appearance-none font-medium text-gray-700 cursor-pointer"
                            >
                                <option value="">All Specializations</option>
                                {specializations.filter(Boolean).map(spec => (
                                    <option key={spec} value={spec}>{spec}</option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                            </div>
                        </div>

                        <button 
                            onClick={fetchDoctors}
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2 group/btn"
                        >
                            <Search className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />
                            Search
                        </button>
                    </div>
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


            {/* --- NEW SECTION: Testimonial Carousel --- */}
            <div className="max-w-4xl mx-auto mt-16 mb-8 text-center px-4">
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">What our users have to say</h2>
                <div className="w-16 h-1.5 bg-blue-600 mx-auto rounded-full mb-6"></div>

                <div className="relative bg-white border border-gray-100 p-6 sm:p-10 rounded-3xl shadow-sm">
                    <div className="min-h-[160px] flex flex-col justify-center">
                        <p className="text-lg sm:text-2xl font-semibold text-gray-700 leading-relaxed italic animate-in fade-in zoom-in-95 duration-300" key={`text-${testimonialIdx}`}>
                            "{testimonials[testimonialIdx].text}"
                        </p>
                    </div>

                    <div className="mt-8 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500" key={`user-${testimonialIdx}`}>
                        <div className="flex items-center gap-1 mb-3">
                            {[...Array(testimonials[testimonialIdx].rating)].map((_, i) => (
                                <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                            ))}
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600 ring-2 ring-white shadow-sm">
                                {testimonials[testimonialIdx].initial}
                            </div>
                            <span className="font-bold text-gray-900">{testimonials[testimonialIdx].name}</span>
                        </div>
                    </div>
                </div>

                {/* Carousel Dots */}
                <div className="flex justify-center gap-2 mt-6">
                    {testimonials.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setTestimonialIdx(idx)}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${testimonialIdx === idx ? 'bg-blue-600 w-6' : 'bg-slate-300 hover:bg-slate-400'}`}
                            aria-label={`Go to slide ${idx + 1}`}
                        />
                    ))}
                </div>
            </div>

            {/* --- NEW SECTION: FAQs --- */}
            <div className="max-w-3xl mx-auto mt-24 mb-24 px-4">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Frequently Asked Questions</h2>
                    <p className="text-gray-500">Everything you need to know about the platform.</p>
                </div>

                <div className="space-y-3">
                    {faqs.map((faq, idx) => {
                        const isOpen = openFaq === idx;
                        return (
                            <div
                                key={idx}
                                className={`border rounded-2xl overflow-hidden transition-all duration-300 group ${isOpen ? 'bg-white border-blue-300 shadow-lg ring-2 ring-blue-100' : 'bg-slate-50 border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:shadow-md'}`}
                            >
                                <button
                                    onClick={() => toggleFaq(idx)}
                                    className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none rounded-2xl"
                                >
                                    <span className={`font-semibold text-lg transition-colors duration-200 ${isOpen ? 'text-blue-700' : 'text-gray-800 group-hover:text-blue-800'}`}>
                                        {faq.question}
                                    </span>
                                    <ChevronDown className={`w-5 h-5 transition-all duration-300 shrink-0 ${isOpen ? 'rotate-180 text-blue-600' : 'text-gray-400 group-hover:text-blue-600'}`} />
                                </button>
                                <div
                                    className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-40 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}
                                >
                                    <p className="text-gray-600 leading-relaxed text-sm md:text-base pr-8">
                                        {faq.answer}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <style>{`
                @keyframes slideFadeIn {
                    0% { opacity: 0; transform: translateY(12px) scale(0.98); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                .slide-fade-in {
                    animation: slideFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 20s linear infinite;
                    width: max-content;
                }
            `}</style>
        </div>
    );
};

export default Home;
