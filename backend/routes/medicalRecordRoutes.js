const express = require('express');
const router = express.Router();
const { createRecord, getPatientRecords, getMyRecords, getRecordByAppointment } = require('../controllers/medicalRecordController');
const { protect, doctorOnly, patientOnly } = require('../middleware/authMiddleware');

router.post('/', protect, doctorOnly, createRecord);
router.get('/appointment/:appointmentId', protect, getRecordByAppointment);
router.get('/my', protect, patientOnly, getMyRecords);
router.get('/patient/:patientId', protect, doctorOnly, getPatientRecords);

module.exports = router;
