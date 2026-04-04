const express = require('express');
const router = express.Router();
const { loginAdmin, addDoctor, updateDoctor, deleteDoctor } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

router.post('/login', loginAdmin);

// Doctor management routes (admin only)
router.post('/doctors', protect, adminOnly, upload.single('profileImage'), addDoctor);
router.put('/doctors/:id', protect, adminOnly, upload.single('profileImage'), updateDoctor);
router.delete('/doctors/:id', protect, adminOnly, deleteDoctor);

module.exports = router;