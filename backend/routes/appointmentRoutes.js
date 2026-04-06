const express = require('express');
const {
    createSlots,
    getAvailableSlots,
    bookAppointment,
    cancelAppointment,
    getUpcomingAppointments,
    getPatientAppointments,
    getDoctorAppointments
} = require('../controllers/appointmentController');


const { protect, doctorOnly, patientOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/slots', protect, doctorOnly, createSlots);
router.get('/slots/:doctorId', getAvailableSlots);
router.post('/book', protect, patientOnly, bookAppointment);
router.patch('/:appointmentId/cancel', protect, cancelAppointment);
router.get('/upcoming', protect, getUpcomingAppointments);
router.get('/patient', protect, patientOnly, getPatientAppointments);
router.get('/doctor', protect, doctorOnly, getDoctorAppointments);


module.exports = router;
