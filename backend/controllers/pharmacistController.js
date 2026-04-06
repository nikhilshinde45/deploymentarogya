const Pharmacist = require('../models/Pharmacist');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Authenticate pharmacist
// @route   POST /api/pharmacist/login
// @access  Public
const loginPharmacist = async (req, res) => {
    try {
        const { email, password } = req.body;

        // First check the new Pharmacist collection
        let pharmacist = await Pharmacist.findOne({ email });

        if (pharmacist && (await pharmacist.matchPassword(password))) {
            return res.json({
                _id: pharmacist.id,
                name: pharmacist.name,
                email: pharmacist.email,
                role: pharmacist.role,
                pharmacistId: pharmacist.pharmacistId,
                token: generateToken(pharmacist._id, pharmacist.role),
            });
        }

        // Fallback: check legacy User collection for old pharmacist accounts
        const legacyUser = await User.findOne({ email });

        if (legacyUser && legacyUser.role === 'pharmacist' && (await legacyUser.matchPassword(password))) {
            return res.json({
                _id: legacyUser.id,
                name: legacyUser.name,
                email: legacyUser.email,
                role: legacyUser.role,
                uniqueId: legacyUser.uniqueId,
                token: generateToken(legacyUser._id, legacyUser.role),
            });
        }

        res.status(401).json({ message: 'Invalid email or password' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    loginPharmacist,
};
