const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Counter = require('./Counter');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['patient', 'doctor', 'pharmacist'],
        required: true
    },
    uniqueId: {
        type: String,
        unique: true
    }
}, { timestamps: true });

// Pre-save hook to generate uniqueId and hash password
userSchema.pre('save', async function(next) {
    // Generate uniqueId only for new documents
    if (this.isNew) {
        let prefix = 'USR';
        let counterId = 'userId';
        
        if (this.role === 'patient') {
            prefix = 'PAT';
            counterId = 'patientId';
        } else if (this.role === 'doctor') {
            prefix = 'DOC';
            counterId = 'doctorId';
        } else if (this.role === 'pharmacist') {
            prefix = 'PHA';
            counterId = 'pharmacistId';
        }

        try {
            const counter = await Counter.findOneAndUpdate(
                { id: counterId },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            
            // Format to have leading zeros, e.g. PAT001
            const formattedSeq = String(counter.seq).padStart(3, '0');
            this.uniqueId = `${prefix}${formattedSeq}`;
        } catch (error) {
            return next(error);
        }
    }

    // Hash password if modified
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
