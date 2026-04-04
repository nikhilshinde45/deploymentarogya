const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Counter = require("./Counter");

const userSchema = new mongoose.Schema(
  {
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
      enum: ["patient", "doctor", "pharmacist"],
      required: true,
    },

    uniqueId: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true }
);

//////////////////////////////////////////////////////////

// ✅ PRE-SAVE HOOK (FIXED)
userSchema.pre("save", async function () {
  // Generate uniqueId only for new user
  if (this.isNew) {
    let prefix = "USR";
    let counterId = "userId";

    if (this.role === "patient") {
      prefix = "PAT";
      counterId = "patientId";
    } else if (this.role === "doctor") {
      prefix = "DOC";
      counterId = "doctorId";
    } else if (this.role === "pharmacist") {
      prefix = "PHA";
      counterId = "pharmacistId";
    }

    const counter = await Counter.findOneAndUpdate(
      { id: counterId },
      { $inc: { seq: 1 } },
      {
        new: true,
        upsert: true,
        returnDocument: "after",
      }
    );

    const formattedSeq = String(counter.seq).padStart(3, "0");
    this.uniqueId = `${prefix}${formattedSeq}`;
  }

  // Hash password only if modified
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

//////////////////////////////////////////////////////////

// ✅ PASSWORD MATCH METHOD
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

//////////////////////////////////////////////////////////

const User = mongoose.model("User", userSchema);
module.exports = User;
