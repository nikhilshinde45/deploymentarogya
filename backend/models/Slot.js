const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema(
    {
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'DoctorProfile',
            required: true
        },
        date: {
            type: String,
            required: true
        },
        startTime: {
            type: String,
            required: true
        },
        endTime: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['available', 'booked'],
            default: 'available'
        }
    },
    { timestamps: true }
);

slotSchema.index({ doctor: 1, date: 1, startTime: 1 }, { unique: true });
slotSchema.index({ doctor: 1, date: 1, status: 1 });

module.exports = mongoose.model('Slot', slotSchema);
