const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    pharmacy: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

medicineSchema.index({ pharmacy: 1, name: 1 });

module.exports = mongoose.model('Medicine', medicineSchema);
