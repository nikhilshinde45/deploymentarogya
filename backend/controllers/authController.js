const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const fs = require('fs');

const logDebug = (message) => {
    const line = `${new Date().toISOString()} ${message}\n`;
    fs.appendFileSync('register-debug.log', line);
};

const registerUser = async (req, res) => {
    try {
        console.log("REGISTER HIT");
        logDebug('registerUser called: ' + JSON.stringify(req.body));
        let { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            logDebug('registerUser missing fields');
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        name = name.trim();
        email = email.trim().toLowerCase();

        logDebug('registerUser normalized: ' + JSON.stringify({ name, email, role }));

        if (!name || !email || !password || !role) {
            logDebug('registerUser missing fields after normalization');
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        if (!['patient', 'doctor', 'pharmacist'].includes(role)) {
            logDebug('registerUser invalid role: ' + role);
            return res.status(400).json({ message: 'Invalid role provided' });
        }

        // Check if user already exists
        const userExists = await User.findOne({ email });
        logDebug('registerUser userExists: ' + !!userExists);

        if (userExists) {
            return res.status(409).json({ message: 'User already exists' });
        }

        // Create user (password hash and uniqueId generation is handled by User.js pre-save hook)
        const user = await User.create({
            name,
            email,
            password,
            role
        });
        logDebug('registerUser user created with id: ' + (user ? user._id : 'none'));
      

        if (user) {
            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                uniqueId: user.uniqueId,
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('registerUser error:', error.message);
        console.error(error.stack);
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Email already registered' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user email
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                uniqueId: user.uniqueId,
                token: generateToken(user._id)
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
