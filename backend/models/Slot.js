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
        time: {
            type: String,
            required: true
        },
        isBooked: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

slotSchema.index({ doctor: 1, date: 1, time: 1 }, { unique: true });
slotSchema.index({ doctor: 1, date: 1, isBooked: 1, time: 1 });

module.exports = mongoose.model('Slot', slotSchema);
