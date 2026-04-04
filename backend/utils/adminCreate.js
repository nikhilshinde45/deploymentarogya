const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const Admin = require("../models/Admin.js");
const connectDB = require("../config/db");

async function addAdmin() {
    try {
        await connectDB();

        const admin = new Admin({
            name: process.env.ADMIN_NAME,
            email: process.env.ADMIN_EMAIL,
            username: process.env.ADMIN_USERNAME,
            password: process.env.ADMIN_PASS,
            role: "admin",
        });

        await admin.save();

        console.log("Admin added successfully");

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error adding admin:", error.message);
        await mongoose.disconnect();
    }
}

addAdmin();