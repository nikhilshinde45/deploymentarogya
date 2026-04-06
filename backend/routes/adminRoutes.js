const express = require('express');
const router = express.Router();
const {
    loginAdmin,
    addDoctor,
    updateDoctor,
    deleteDoctor,
    getPharmacists,
    addPharmacist,
    updatePharmacist,
    deletePharmacist,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

router.post('/login', loginAdmin);

// Doctor management routes (admin only)
router.post('/doctors', protect, adminOnly, upload.single('profileImage'), addDoctor);
router.put('/doctors/:id', protect, adminOnly, upload.single('profileImage'), updateDoctor);
router.delete('/doctors/:id', protect, adminOnly, deleteDoctor);

// Pharmacist management routes (admin only)
router.get('/pharmacists', protect, adminOnly, getPharmacists);
router.post('/pharmacists', protect, adminOnly, upload.single('profileImage'), addPharmacist);
router.put('/pharmacists/:id', protect, adminOnly, upload.single('profileImage'), updatePharmacist);
router.delete('/pharmacists/:id', protect, adminOnly, deletePharmacist);

module.exports = router;