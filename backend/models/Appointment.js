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
        time: {
            type: String,
            required: true
        },
        meetingLink: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['scheduled', 'completed', 'cancelled'],
            default: 'scheduled'
        }
    },
    { timestamps: true }
);

appointmentSchema.index({ patient: 1, status: 1, date: 1, time: 1 });
appointmentSchema.index({ doctor: 1, status: 1, date: 1, time: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
