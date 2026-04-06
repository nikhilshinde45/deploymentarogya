const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Counter = require('./Counter');

const pharmacistSchema = new mongoose.Schema(
  {
    pharmacistId: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: 'pharmacist',
      enum: ['pharmacist'],
    },
    licenseNumber: {
      type: String,
      required: true,
    },
    experience: {
      type: Number,
    },
    phone: {
      type: String,
    },
    address: {
      type: String,
    },
    profileImage: {
      type: String,
    },
  },
  { timestamps: true }
);

// Pre-save hook for pharmacistId and password
pharmacistSchema.pre('save', async function () {
  if (this.isNew && !this.pharmacistId) {
    const counter = await Counter.findOneAndUpdate(
      { id: 'pharmacistId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, returnDocument: 'after' }
    );
    const formattedSeq = String(counter.seq).padStart(3, '0');
    this.pharmacistId = `PHA${formattedSeq}`;
  }

  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

pharmacistSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Pharmacist', pharmacistSchema);
