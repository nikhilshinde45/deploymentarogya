const express = require('express');
const router = express.Router();
const { createDoctorProfile, getDoctors, getDoctorById } = require('../controllers/doctorController');
const { protect, doctorOnly } = require('../middleware/authMiddleware');

router.post('/profile', protect, doctorOnly, createDoctorProfile);
router.get('/', getDoctors);
router.get('/:doctorId', getDoctorById);

module.exports = router;
