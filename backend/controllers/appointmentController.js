const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const Slot = require('../models/Slot');

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const resolveDoctorProfile = async (doctorIdentifier) => {
    if (mongoose.Types.ObjectId.isValid(doctorIdentifier)) {
        const byObjectId = await DoctorProfile.findById(doctorIdentifier);
        if (byObjectId) {
            return byObjectId;
        }
    }

    return DoctorProfile.findOne({ doctorId: doctorIdentifier });
};

const buildDoctorPopulate = () => ({
    path: 'doctor',
    select: 'doctorId specialization name email profileImage'
});

const buildPatientPopulate = () => ({
    path: 'patient',
    select: 'name email uniqueId role'
});

const toISODateString = () => new Date().toISOString().slice(0, 10);

// @desc    Create doctor slots for a date
// @route   POST /api/appointments/slots
// @access  Private/Doctor
const createSlots = async (req, res) => {
    try {
        const doctorProfile = req.user;
        if (!doctorProfile) {
            return res.status(404).json({
                success: false,
                message: 'Doctor profile not found'
            });
        }

        const { date, times } = req.body;
        if (!date || !dateRegex.test(date)) {
            return res.status(400).json({
                success: false,
                message: 'Valid date is required in YYYY-MM-DD format'
            });
        }

        if (!Array.isArray(times) || times.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'times must be a non-empty array'
            });
        }

        const normalizedTimes = [...new Set(times.map((t) => String(t).trim()))].sort();
        const invalidTime = normalizedTimes.find((t) => !timeRegex.test(t));
        if (invalidTime) {
            return res.status(400).json({
                success: false,
                message: `Invalid time format: ${invalidTime}. Use HH:mm`
            });
        }

        const operations = normalizedTimes.map((time) => ({
            updateOne: {
                filter: { doctor: doctorProfile._id, date, time },
                update: { $setOnInsert: { doctor: doctorProfile._id, date, time, isBooked: false } },
                upsert: true
            }
        }));

        const writeResult = await Slot.bulkWrite(operations, { ordered: false });
        const slots = await Slot.find({ doctor: doctorProfile._id, date, time: { $in: normalizedTimes } }).sort({ time: 1 });

        res.status(201).json({
            success: true,
            message: 'Slots processed successfully',
            data: {
                slots,
                createdCount: writeResult.upsertedCount || 0,
                totalRequested: normalizedTimes.length
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get available slots by doctor and date
// @route   GET /api/appointments/slots/:doctorId?date=YYYY-MM-DD
// @access  Public
const getAvailableSlots = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { date } = req.query;

        if (!date || !dateRegex.test(date)) {
            return res.status(400).json({
                success: false,
                message: 'Valid date query is required in YYYY-MM-DD format'
            });
        }

        const doctorProfile = await resolveDoctorProfile(doctorId);
        if (!doctorProfile) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        const slots = await Slot.find({
            doctor: doctorProfile._id,
            date,
            isBooked: false
        }).sort({ time: 1 });

        res.status(200).json({
            success: true,
            count: slots.length,
            data: slots
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Book appointment using slotId
// @route   POST /api/appointments/book
// @access  Private/Patient
const bookAppointment = async (req, res) => {
    try {
        const patientId = req.user.id;
        const { slotId } = req.body;

        if (!slotId || !mongoose.Types.ObjectId.isValid(slotId)) {
            return res.status(400).json({
                success: false,
                message: 'Valid slotId is required'
            });
        }

        const slot = await Slot.findOneAndUpdate(
            { _id: slotId, isBooked: false },
            { isBooked: true },
            { new: true }
        );

        if (!slot) {
            return res.status(409).json({
                success: false,
                message: 'Slot already booked'
            });
        }

        try {
            const appointment = await Appointment.create({
                doctor: slot.doctor,
                patient: patientId,
                slot: slot._id,
                date: slot.date,
                time: slot.time,
                meetingLink: `room-${slot._id}`,
                status: 'scheduled'
            });

            return res.status(201).json({
                success: true,
                message: 'Appointment booked successfully',
                data: appointment
            });
        } catch (createError) {
            await Slot.findByIdAndUpdate(slot._id, { isBooked: false });

            if (createError.code === 11000) {
                return res.status(409).json({
                    success: false,
                    message: 'Slot already booked'
                });
            }

            throw createError;
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Cancel an appointment
// @route   PATCH /api/appointments/:appointmentId/cancel
// @access  Private
const cancelAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
            return res.status(400).json({ success: false, message: 'Invalid appointmentId' });
        }

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        const isPatientOwner = appointment.patient.toString() === req.user.id;
        const isDoctorOwner = req.user.role === 'doctor' && req.user.id === appointment.doctor.toString();

        if (!isPatientOwner && !isDoctorOwner) {
            return res.status(403).json({ success: false, message: 'Forbidden: Not your appointment' });
        }

        if (appointment.status === 'cancelled') {
            return res.status(400).json({ success: false, message: 'Appointment already cancelled' });
        }

        appointment.status = 'cancelled';
        await appointment.save();
        await Slot.findByIdAndUpdate(appointment.slot, { isBooked: false });

        res.status(200).json({
            success: true,
            message: 'Appointment cancelled successfully',
            data: appointment
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get upcoming appointments for current user
// @route   GET /api/appointments/upcoming
// @access  Private
const getUpcomingAppointments = async (req, res) => {
    try {
        const today = toISODateString();
        const query = { status: 'scheduled', date: { $gte: today } };

        if (req.user.role === 'patient') {
            query.patient = req.user.id;
        } else if (req.user.role === 'doctor') {
            const doctorProfile = req.user;
            if (!doctorProfile) {
                return res.status(404).json({ success: false, message: 'Doctor profile not found' });
            }
            query.doctor = doctorProfile._id;
        } else {
            return res.status(403).json({ success: false, message: 'Forbidden: Unsupported role' });
        }

        const appointments = await Appointment.find(query)
            .populate(buildDoctorPopulate())
            .populate(buildPatientPopulate())
            .sort({ date: 1, time: 1 });

        res.status(200).json({
            success: true,
            count: appointments.length,
            data: appointments
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get upcoming + past appointments for patient
// @route   GET /api/appointments/patient
// @access  Private/Patient
const getPatientAppointments = async (req, res) => {
    try {
        const today = toISODateString();

        const [upcomingAppointments, pastAppointments] = await Promise.all([
            Appointment.find({
                patient: req.user.id,
                status: 'scheduled',
                date: { $gte: today }
            })
                .populate(buildDoctorPopulate())
                .sort({ date: 1, time: 1 }),
            Appointment.find({
                patient: req.user.id,
                date: { $lt: today }
            })
                .populate(buildDoctorPopulate())
                .sort({ date: 1, time: 1 })
        ]);

        res.status(200).json({
            success: true,
            upcomingAppointments,
            pastAppointments
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get upcoming appointments + unique patient list for doctor
// @route   GET /api/appointments/doctor
// @access  Private/Doctor
const getDoctorAppointments = async (req, res) => {
    try {
        const today = toISODateString();

        const doctorProfile = req.user;
        if (!doctorProfile) {
            return res.status(404).json({ success: false, message: 'Doctor profile not found' });
        }

        const [upcomingAppointments, pastAppointments] = await Promise.all([
            Appointment.find({
                doctor: doctorProfile._id,
                status: 'scheduled',
                date: { $gte: today }
            })
                .populate(buildPatientPopulate())
                .sort({ date: 1, time: 1 }),
            Appointment.find({
                doctor: doctorProfile._id,
                date: { $lt: today }
            })
                .populate(buildPatientPopulate())
                .sort({ date: 1, time: 1 })
        ]);

        const all = [...upcomingAppointments, ...pastAppointments];
        const unique = new Map();
        for (const appt of all) {
            if (!appt.patient) continue;
            unique.set(appt.patient._id.toString(), {
                patientId: appt.patient._id,
                name: appt.patient.name,
                email: appt.patient.email,
                uniqueId: appt.patient.uniqueId
            });
        }

        res.status(200).json({
            success: true,
            upcomingAppointments,
            patientList: Array.from(unique.values())
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    createSlots,
    getAvailableSlots,
    bookAppointment,
    cancelAppointment,
    getUpcomingAppointments,
    getPatientAppointments,
    getDoctorAppointments
};
