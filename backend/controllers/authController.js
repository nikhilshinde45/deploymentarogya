const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new patient
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        if (role !== 'patient') {
            return res.status(400).json({ message: 'Only patients can register here' });
        }

        // Check if email exists across all collections
        const userExists = await User.findOne({ email });
        const doctorExists = await DoctorProfile.findOne({ email });
        const adminExists = await Admin.findOne({ email });

        if (userExists || doctorExists || adminExists) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Create user (password hash and uniqueId generation is handled by User.js pre-save hook)
        const user = await User.create({
            name,
            email,
            password,
            role
        });

        if (user) {
            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                uniqueId: user.uniqueId,
                token: generateToken(user._id, user.role)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Authenticate a patient
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user email
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            if (user.role !== 'patient' && user.role !== 'pharmacist') {
                 return res.status(403).json({ message: 'Access denied' });
            }
            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                uniqueId: user.uniqueId,
                token: generateToken(user._id, user.role)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    registerUser,
    loginUser
};
