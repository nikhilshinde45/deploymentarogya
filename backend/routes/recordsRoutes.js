const express = require('express');
const router = express.Router();

const { getMyRecords, getPatientRecords } = require('../controllers/medicalRecordController');
const { protect, doctorOnly, patientOnly } = require('../middleware/authMiddleware');

// Patient can view their own records
router.get('/patient', protect, patientOnly, getMyRecords);

// Doctor can view patient medical history
router.get('/:patientId', protect, doctorOnly, getPatientRecords);

module.exports = router;

