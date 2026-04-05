import React from 'react';
import { User, Stethoscope, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DoctorCard = ({ doctor }) => {
    const navigate = useNavigate();

    return (
        <div 
            onClick={() => navigate(`/doctors/${doctor.doctorId}`)}
            className="group block bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-indigo-50/50 overflow-hidden cursor-pointer"
        >
            <div className="p-6">
                <div className="flex items-start gap-4">
                    <div className="h-16 w-16 min-w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl uppercase ring-4 ring-blue-50 group-hover:ring-blue-100 transition-all duration-300">
                        {doctor?.profileImage ? (
                            <img src={doctor.profileImage} alt={doctor.name} className="h-full w-full rounded-full object-cover" />
                        ) : (
                            doctor?.name?.charAt(0) || 'D'
                        )}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {doctor?.name ? (doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`) : 'Unknown'}
                        </h3>
                        
                        <div className="mt-2 space-y-2">
                            <p className="flex items-center text-gray-600 text-sm bg-blue-50 w-max px-3 py-1 rounded-full">
                                <Stethoscope className="w-4 h-4 mr-2 text-blue-500" />
                                {doctor.specialization}
                            </p>
                            <p className="flex items-center text-gray-500 text-sm font-medium">
                                <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                {doctor.experience} Years Experience
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between group-hover:bg-blue-50/30 transition-colors">
                <span className="text-sm font-medium text-blue-600">View Full Profile</span>
                <ChevronRight className="w-5 h-5 text-blue-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-transform" />
            </div>
        </div>
    );
};

export default DoctorCard;
