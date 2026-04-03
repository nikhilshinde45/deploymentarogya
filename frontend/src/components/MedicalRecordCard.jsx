import React from 'react';
import { CalendarDays, FileText, Pill, Stethoscope, UserRound } from 'lucide-react';

const MedicalRecordCard = ({ record, showPatient = false }) => {
    const formattedDate = new Date(record.date).toLocaleDateString();

    return (
        <article className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-blue-600" />
                    {record.disease}
                </h3>
                <span className="text-sm text-gray-500 flex items-center gap-1">
                    <CalendarDays className="w-4 h-4" />
                    {formattedDate}
                </span>
            </div>

            {showPatient && record.patientId?.name && (
                <p className="text-sm text-gray-700 flex items-center gap-2">
                    <UserRound className="w-4 h-4 text-indigo-500" />
                    Patient: <span className="font-semibold">{record.patientId.name}</span>
                </p>
            )}

            <div className="grid grid-cols-1 gap-3">
                <p className="text-sm text-gray-700">
                    <span className="font-semibold text-gray-900">Symptoms:</span> {record.symptoms}
                </p>
                <p className="text-sm text-gray-700 flex items-start gap-2">
                    <Pill className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span><span className="font-semibold text-gray-900">Prescription:</span> {record.prescription}</span>
                </p>
                {record.notes && (
                    <p className="text-sm text-gray-700 flex items-start gap-2">
                        <FileText className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                        <span><span className="font-semibold text-gray-900">Notes:</span> {record.notes}</span>
                    </p>
                )}
                {record.doctorId?.name && (
                    <p className="text-xs text-gray-500 pt-1">
                        Created by Dr. {record.doctorId.name}
                    </p>
                )}
            </div>
        </article>
    );
};

export default MedicalRecordCard;
