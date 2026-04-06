const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const DoctorProfile = require('../models/DoctorProfile');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            let currentUser;
            
            // Get user from the correct collection based on role
            if (decoded.role === 'admin') {
                currentUser = await Admin.findById(decoded.id).select('-password');
            } else if (decoded.role === 'doctor') {
                currentUser = await DoctorProfile.findById(decoded.id).select('-password');
            } else {
                currentUser = await User.findById(decoded.id).select('-password');
            }

            if (!currentUser) {
                return res.status(401).json({ message: 'Not authorized, user no longer exists' });
            }

            // Attach user to request object
            req.user = currentUser;

            next();
        } catch (error) {
            console.error('JWT Verification Error:', error.message);
            return res.status(401).json({ message: 'Not authorized, token failed or expired' });
        }
    } else {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

// Role-based access middleware helpers

const adminOnly = async (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Requires admin access' });
    }
};

const patientOnly = async (req, res, next) => {
    if (req.user && req.user.role === 'patient') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Requires patient access' });
    }
};

const doctorOnly = async (req, res, next) => {
    if (req.user && req.user.role === 'doctor') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Requires doctor access' });
    }
};

const pharmacistOnly = async (req, res, next) => {
    if (req.user && req.user.role === 'pharmacist') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Requires pharmacist access' });
    }
};

const allowAllRoles = async (req, res, next) => {
    const allowed = ['patient', 'doctor', 'pharmacist', 'admin'];
    if (req.user && allowed.includes(req.user.role)) {
        next();
    } else {
        res.status(403).json({
            message: 'Forbidden: Requires valid role access',
        });
    }
};

module.exports = {
    protect,
    adminOnly,
    patientOnly,
    doctorOnly,
    pharmacistOnly,
    allowAllRoles,
};
