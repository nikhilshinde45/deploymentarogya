const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");
const Counter = require("./Counter");

const doctorProfileSchema = new mongoose.Schema({
    doctorId: {
        type: String,
        unique: true
    },
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
        default: "doctor",
        enum: ["doctor"]
    },
    specialization: {
        type: String,
        required: true
    },
    experience: {
        type: Number,
        required: true
    },
    bio: {
        type: String
    },
    profileImage: {
        type: String
    }
}, { timestamps: true });

// Pre-save hook for doctorId and password
doctorProfileSchema.pre("save", async function () {
    if (this.isNew && !this.doctorId) {
        const counter = await Counter.findOneAndUpdate(
            { id: "doctorId" },
            { $inc: { seq: 1 } },
            { new: true, upsert: true, returnDocument: "after" }
        );
        const formattedSeq = String(counter.seq).padStart(3, "0");
        this.doctorId = `DOC${formattedSeq}`;
    }

    if (this.isModified("password")) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
});

doctorProfileSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema);
