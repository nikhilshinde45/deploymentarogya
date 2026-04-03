const express = require('express');
const {
  getMedicines,
  createMedicine,
  updateMedicine,
  deleteMedicine,
} = require('../controllers/medicineController');
const {
  protect,
  pharmacistOnly,
  patientDoctorOrPharmacist,
} = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, patientDoctorOrPharmacist, getMedicines);
router.post('/', protect, pharmacistOnly, createMedicine);
router.put('/:id', protect, pharmacistOnly, updateMedicine);
router.delete('/:id', protect, pharmacistOnly, deleteMedicine);

module.exports = router;
