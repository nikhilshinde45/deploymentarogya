const crypto = require('crypto');
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

const buildSlotPopulate = () => ({
    path: 'slot',
    select: 'startTime endTime date status'
});

const toISODateString = () => new Date().toISOString().slice(0, 10);

/**
 * Add minutes to a HH:mm time string and return the new HH:mm string.
 */
const addMinutes = (timeStr, minutes) => {
    const [h, m] = timeStr.split(':').map(Number);
    const totalMinutes = h * 60 + m + minutes;
    const newH = Math.floor(totalMinutes / 60);
    const newM = totalMinutes % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
};

/**
 * Generate time slot intervals from startTime to endTime with given duration.
 * Example: generateTimeSlots('09:00', '11:00', 30)
 *   → [{ startTime: '09:00', endTime: '09:30' }, { startTime: '09:30', endTime: '10:00' }, ...]
 */
const generateTimeSlots = (startTime, endTime, durationMinutes) => {
    const slots = [];
    let current = startTime;

    while (true) {
        const next = addMinutes(current, durationMinutes);
        if (next > endTime) break;
        slots.push({ startTime: current, endTime: next });
        current = next;
    }

    return slots;
};

// @desc    Create doctor availability slots for a date
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

        const { date, startTime, endTime, slotDuration } = req.body;

        // Validate date
        if (!date || !dateRegex.test(date)) {
            return res.status(400).json({
                success: false,
                message: 'Valid date is required in YYYY-MM-DD format'
            });
        }

        // Prevent past dates
        const today = toISODateString();
        if (date < today) {
            return res.status(400).json({
                success: false,
                message: 'Cannot create slots for a past date'
            });
        }

        // Validate times
        if (!startTime || !timeRegex.test(startTime)) {
            return res.status(400).json({
                success: false,
                message: 'Valid startTime is required in HH:mm format'
            });
        }

        if (!endTime || !timeRegex.test(endTime)) {
            return res.status(400).json({
                success: false,
                message: 'Valid endTime is required in HH:mm format'
            });
        }

        if (startTime >= endTime) {
            return res.status(400).json({
                success: false,
                message: 'startTime must be before endTime'
            });
        }

        // Validate duration
        const allowedDurations = [15, 20, 30, 45, 60];
        const duration = Number(slotDuration);
        if (!allowedDurations.includes(duration)) {
            return res.status(400).json({
                success: false,
                message: `slotDuration must be one of: ${allowedDurations.join(', ')} minutes`
            });
        }

        // Generate time intervals
        const timeSlots = generateTimeSlots(startTime, endTime, duration);
        if (timeSlots.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No slots could be generated for the given time range and duration'
            });
        }

        // Upsert each slot (skip duplicates)
        const operations = timeSlots.map((slot) => ({
            updateOne: {
                filter: { doctor: doctorProfile._id, date, startTime: slot.startTime },
                update: {
                    $setOnInsert: {
                        doctor: doctorProfile._id,
                        date,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        status: 'available'
                    }
                },
                upsert: true
            }
        }));

        const writeResult = await Slot.bulkWrite(operations, { ordered: false });

        const allStartTimes = timeSlots.map((s) => s.startTime);
        const slots = await Slot.find({
            doctor: doctorProfile._id,
            date,
            startTime: { $in: allStartTimes }
        }).sort({ startTime: 1 });

        res.status(201).json({
            success: true,
            message: 'Slots processed successfully',
            data: {
                slots,
                createdCount: writeResult.upsertedCount || 0,
                totalRequested: timeSlots.length
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
            status: 'available'
        }).sort({ startTime: 1 });

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

        // Atomic: only book if status is still 'available'
        const slot = await Slot.findOneAndUpdate(
            { _id: slotId, status: 'available' },
            { status: 'booked' },
            { new: true }
        );

        if (!slot) {
            return res.status(409).json({
                success: false,
                message: 'Slot is unavailable or already booked'
            });
        }

        // Prevent booking past date/time
        const now = new Date();
        const slotDateTime = new Date(`${slot.date}T${slot.startTime}:00`);
        if (slotDateTime < now) {
            // Roll back the slot status
            await Slot.findByIdAndUpdate(slot._id, { status: 'available' });
            return res.status(400).json({
                success: false,
                message: 'Cannot book a slot in the past'
            });
        }

        try {
            const meetingId = crypto.randomUUID();

            const appointment = await Appointment.create({
                doctor: slot.doctor,
                patient: patientId,
                slot: slot._id,
                date: slot.date,
                startTime: slot.startTime,
                meetingId,
                status: 'confirmed'
            });

            return res.status(201).json({
                success: true,
                message: 'Appointment booked successfully',
                data: appointment
            });
        } catch (createError) {
            // Roll back slot on appointment creation failure
            await Slot.findByIdAndUpdate(slot._id, { status: 'available' });

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
        await Slot.findByIdAndUpdate(appointment.slot, { status: 'available' });

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
        const query = { status: 'confirmed', date: { $gte: today } };

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
            .sort({ date: 1, startTime: 1 });

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
        const now = new Date();
        const today = toISODateString();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const [confirmedFutureDays, confirmedToday, historicAppointments] = await Promise.all([
            Appointment.find({
                patient: req.user.id,
                status: 'confirmed',
                date: { $gt: today }
            })
                .populate(buildDoctorPopulate())
                .populate(buildSlotPopulate())
                .populate('medicalRecord')
                .sort({ date: 1, startTime: 1 }),
            Appointment.find({
                patient: req.user.id,
                status: 'confirmed',
                date: today
            })
                .populate(buildDoctorPopulate())
                .populate(buildSlotPopulate())
                .populate('medicalRecord')
                .sort({ startTime: 1 }),
            Appointment.find({
                patient: req.user.id,
                $or: [
                    { date: { $lt: today } },
                    { status: { $in: ['completed', 'cancelled'] } }
                ]
            })
                .populate(buildDoctorPopulate())
                .populate(buildSlotPopulate())
                .populate('medicalRecord')
                .sort({ date: -1, startTime: -1 })
        ]);

        // Split today's confirmed by endTime (not startTime)
        // Appointment stays upcoming/ongoing until endTime passes
        const todayUpcoming = [];
        const todayPast = [];
        for (const appt of confirmedToday) {
            const endTime = appt.slot?.endTime || appt.startTime;
            if (endTime > currentTime) {
                todayUpcoming.push(appt);
            } else {
                todayPast.push(appt);
            }
        }

        const upcomingAppointments = [...todayUpcoming, ...confirmedFutureDays];
        const pastIds = new Set(historicAppointments.map(a => a._id.toString()));
        const mergedPast = [...todayPast.filter(a => !pastIds.has(a._id.toString())), ...historicAppointments];
        mergedPast.sort((a, b) => {
            if (a.date !== b.date) return a.date < b.date ? 1 : -1;
            return a.startTime < b.startTime ? 1 : -1;
        });

        res.status(200).json({
            success: true,
            upcomingAppointments,
            pastAppointments: mergedPast
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get upcoming + past appointments + unique patient list for doctor
// @route   GET /api/appointments/doctor
// @access  Private/Doctor
const getDoctorAppointments = async (req, res) => {
    try {
        const now = new Date();
        const today = toISODateString();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const doctorProfile = req.user;
        if (!doctorProfile) {
            return res.status(404).json({ success: false, message: 'Doctor profile not found' });
        }

        // Fetch all confirmed appointments for today, future confirmed, and already-past/completed/cancelled
        const [confirmedFutureDays, confirmedToday, historicAppointments] = await Promise.all([
            // Confirmed appointments on future dates (definitely upcoming)
            Appointment.find({
                doctor: doctorProfile._id,
                status: 'confirmed',
                date: { $gt: today }
            })
                .populate(buildPatientPopulate())
                .populate(buildSlotPopulate())
                .populate('medicalRecord')
                .sort({ date: 1, startTime: 1 }),
            // Confirmed appointments today (need time-based split)
            Appointment.find({
                doctor: doctorProfile._id,
                status: 'confirmed',
                date: today
            })
                .populate(buildPatientPopulate())
                .populate(buildSlotPopulate())
                .populate('medicalRecord')
                .sort({ startTime: 1 }),
            // Already past-date confirmed, completed, or cancelled
            Appointment.find({
                doctor: doctorProfile._id,
                $or: [
                    { date: { $lt: today } },
                    { status: { $in: ['completed', 'cancelled'] } }
                ]
            })
                .populate(buildPatientPopulate())
                .populate(buildSlotPopulate())
                .populate('medicalRecord')
                .sort({ date: -1, startTime: -1 })
        ]);

        // Split today's confirmed appointments by endTime (not startTime)
        // Appointment stays upcoming/ongoing until endTime passes
        const todayUpcoming = [];
        const todayPast = [];
        for (const appt of confirmedToday) {
            const endTime = appt.slot?.endTime || appt.startTime;
            if (endTime > currentTime) {
                todayUpcoming.push(appt);
            } else {
                todayPast.push(appt);
            }
        }

        const upcomingAppointments = [...todayUpcoming, ...confirmedFutureDays];
        // Merge today's expired into past, de-duplicate by _id
        const pastIds = new Set(historicAppointments.map(a => a._id.toString()));
        const mergedPast = [...todayPast.filter(a => !pastIds.has(a._id.toString())), ...historicAppointments];
        // Sort past descending
        mergedPast.sort((a, b) => {
            if (a.date !== b.date) return a.date < b.date ? 1 : -1;
            return a.startTime < b.startTime ? 1 : -1;
        });

        const all = [...upcomingAppointments, ...mergedPast];
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
            pastAppointments: mergedPast,
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
