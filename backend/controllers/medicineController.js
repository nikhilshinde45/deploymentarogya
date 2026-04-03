const mongoose = require('mongoose');
const Medicine = require('../models/Medicine');

const parseNumber = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

// @desc    List all medicines
// @route   GET /api/medicines
// @access  Private (patient, doctor, pharmacist)
const getMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find().sort({ name: 1 });
    res.status(200).json({
      success: true,
      count: medicines.length,
      data: medicines,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create medicine
// @route   POST /api/medicines
// @access  Private (pharmacist)
const createMedicine = async (req, res) => {
  try {
    const { name, price, stock, pharmacy } = req.body;

    if (!name || !pharmacy) {
      return res.status(400).json({
        success: false,
        message: 'Name and pharmacy are required',
      });
    }

    const priceNum = parseNumber(price, NaN);
    const stockNum = parseNumber(stock, 0);

    if (!Number.isFinite(priceNum) || priceNum < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid non-negative price is required',
      });
    }

    if (!Number.isFinite(stockNum) || stockNum < 0 || !Number.isInteger(stockNum)) {
      return res.status(400).json({
        success: false,
        message: 'Stock must be a non-negative integer',
      });
    }

    const medicine = await Medicine.create({
      name: String(name).trim(),
      price: priceNum,
      stock: stockNum,
      pharmacy: String(pharmacy).trim(),
    });

    res.status(201).json({
      success: true,
      message: 'Medicine created',
      data: medicine,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update medicine
// @route   PUT /api/medicines/:id
// @access  Private (pharmacist)
const updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid medicine id' });
    }

    const { name, price, stock, pharmacy } = req.body;
    const update = {};

    if (name !== undefined) update.name = String(name).trim();
    if (pharmacy !== undefined) update.pharmacy = String(pharmacy).trim();
    if (price !== undefined) {
      const priceNum = parseNumber(price, NaN);
      if (!Number.isFinite(priceNum) || priceNum < 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid non-negative price is required',
        });
      }
      update.price = priceNum;
    }
    if (stock !== undefined) {
      const stockNum = parseNumber(stock, NaN);
      if (!Number.isFinite(stockNum) || stockNum < 0 || !Number.isInteger(stockNum)) {
        return res.status(400).json({
          success: false,
          message: 'Stock must be a non-negative integer',
        });
      }
      update.stock = stockNum;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
      });
    }

    const medicine = await Medicine.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Medicine updated',
      data: medicine,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete medicine
// @route   DELETE /api/medicines/:id
// @access  Private (pharmacist)
const deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid medicine id' });
    }

    const medicine = await Medicine.findByIdAndDelete(id);
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Medicine deleted',
      data: { id: medicine._id },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getMedicines,
  createMedicine,
  updateMedicine,
  deleteMedicine,
};
