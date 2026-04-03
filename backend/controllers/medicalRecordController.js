const MedicalRecord = require('../models/MedicalRecord');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Create a new medical record
// @route   POST /api/medical-records
// @access  Private/Doctor
const createRecord = async (req, res) => {
  try {
    const { patientId, disease, symptoms, prescription, notes, date } = req.body;

    if (!patientId || !disease || !symptoms || !prescription) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ success: false, message: 'Invalid patientId' });
    }

    const patient = await User.findOne({ _id: patientId, role: 'patient' });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const newRecord = new MedicalRecord({
      patientId,
      doctorId: req.user.id,
      disease,
      symptoms,
      prescription,
      notes,
      date: date ? new Date(date) : Date.now()
    });

    const savedRecord = await newRecord.save();
    const populated = await MedicalRecord.findById(savedRecord._id)
      .populate('doctorId', 'name email uniqueId')
      .populate('patientId', 'name email uniqueId');

    res.status(201).json({ success: true, message: 'Medical record created', data: populated });
  } catch (error) {
    console.error('Error creating medical record:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all medical records for a specific patient
// @route   GET /api/medical-records/patient/:patientId
// @access  Private/Doctor
const getPatientRecords = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ success: false, message: 'Invalid patientId' });
    }

    const records = await MedicalRecord.find({ patientId })
      .populate('doctorId', 'name email uniqueId')
      .populate('patientId', 'name email uniqueId')
      .sort({ date: -1 });

    res.status(200).json({ success: true, count: records.length, data: records });
  } catch (error) {
    console.error('Error fetching patient medical records:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get records for current patient
// @route   GET /api/medical-records/my
// @access  Private/Patient
const getMyRecords = async (req, res) => {
  try {
    const records = await MedicalRecord.find({ patientId: req.user.id })
      .populate('doctorId', 'name email uniqueId')
      .sort({ date: -1 });

    res.status(200).json({ success: true, count: records.length, data: records });
  } catch (error) {
    console.error('Error fetching current patient records:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  createRecord,
  getPatientRecords,
  getMyRecords
};
