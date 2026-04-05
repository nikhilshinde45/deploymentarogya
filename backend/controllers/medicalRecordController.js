const MedicalRecord = require('../models/MedicalRecord');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const mongoose = require('mongoose');

// @desc    Create or update a medical record for an appointment (upsert)
// @route   POST /api/medical-records
// @access  Private/Doctor
const createRecord = async (req, res) => {
  try {
    const { appointmentId, patientId, disease, symptoms, prescription, notes, date } = req.body;

    if (!appointmentId || !patientId || !disease || !symptoms || !prescription) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (!mongoose.Types.ObjectId.isValid(appointmentId) || !mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ success: false, message: 'Invalid appointmentId or patientId' });
    }

    const patient = await User.findOne({ _id: patientId, role: 'patient' });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Check if record already exists → update it
    const existingRecord = await MedicalRecord.findOne({ appointmentId });

    if (existingRecord) {
      // Update existing record
      existingRecord.disease = disease;
      existingRecord.symptoms = symptoms;
      existingRecord.prescription = prescription;
      existingRecord.notes = notes || '';
      if (date) existingRecord.date = new Date(date);

      const updated = await existingRecord.save();

      const populated = await MedicalRecord.findById(updated._id)
        .populate('doctorId', 'name email doctorId profileImage specialization')
        .populate('patientId', 'name email uniqueId role');

      return res.status(200).json({ success: true, message: 'Medical record updated', data: populated });
    }

    // Create new record
    const newRecord = new MedicalRecord({
      appointmentId,
      patientId,
      doctorId: req.user._id,
      disease,
      symptoms,
      prescription,
      notes: notes || '',
      date: date ? new Date(date) : Date.now()
    });

    const savedRecord = await newRecord.save();

    // Bidirectional linking
    appointment.medicalRecord = savedRecord._id;
    appointment.status = 'completed';
    await appointment.save();

    const populated = await MedicalRecord.findById(savedRecord._id)
      .populate('doctorId', 'name email doctorId profileImage specialization')
      .populate('patientId', 'name email uniqueId role');

    res.status(201).json({ success: true, message: 'Medical record created', data: populated });
  } catch (error) {
    console.error('Error creating/updating medical record:', error);
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
      .populate('doctorId', 'name email doctorId profileImage specialization')
      .populate('patientId', 'name email uniqueId role')
      .sort({ date: -1 });

    res.status(200).json({ success: true, count: records.length, data: records });
  } catch (error) {
    console.error('Error fetching patient medical records:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get medical record strictly tied to an appointment
// @route   GET /api/medical-records/appointment/:appointmentId
// @access  Private (Doctor or Patient)
const getRecordByAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({ success: false, message: 'Invalid appointmentId' });
    }

    const record = await MedicalRecord.findOne({ appointmentId })
      .populate('doctorId', 'name email specialization profileImage')
      .populate('patientId', 'name email');

    if (!record) {
      return res.status(404).json({ success: false, message: 'No medical record found for this appointment' });
    }

    res.status(200).json({ success: true, data: record });
  } catch (error) {
    console.error('Error fetching appointment record:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get records for current patient
// @route   GET /api/medical-records/my
// @access  Private/Patient
const getMyRecords = async (req, res) => {
  try {
    const records = await MedicalRecord.find({ patientId: req.user.id })
      .populate('doctorId', 'name email doctorId profileImage specialization')
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
  getMyRecords,
  getRecordByAppointment
};
