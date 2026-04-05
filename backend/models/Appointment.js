const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
    {
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'DoctorProfile',
            required: true
        },
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        slot: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Slot',
            required: true,
            unique: true
        },
        date: {
            type: String,
            required: true
        },
        startTime: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['confirmed', 'completed', 'cancelled'],
            default: 'confirmed'
        },
        meetingId: {
            type: String,
            required: true,
            unique: true
        },
        medicalRecord: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MedicalRecord'
        }
    },
    { timestamps: true }
);

appointmentSchema.index({ patient: 1, status: 1, date: 1, startTime: 1 });
appointmentSchema.index({ doctor: 1, status: 1, date: 1, startTime: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
