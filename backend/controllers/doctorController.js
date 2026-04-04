const DoctorProfile = require('../models/DoctorProfile');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Authenticate doctor
// @route   POST /api/doctor/login
// @access  Public
const loginDoctor = async (req, res) => {
    try {
        const { email, password } = req.body;

        const doctor = await DoctorProfile.findOne({ email });

        if (doctor && (await doctor.matchPassword(password))) {
            res.json({
                _id: doctor.id,
                doctorId: doctor.doctorId,
                name: doctor.name,
                email: doctor.email,
                role: doctor.role,
                token: generateToken(doctor._id, doctor.role)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all doctors (with pagination, filters, search)
// @route   GET /api/doctors
// @access  Public
const getDoctors = async (req, res) => {
    try {
        const { specialization, name, page = 1, limit = 10 } = req.query;
        
        let profileQuery = {};

        if (specialization) {
            profileQuery.specialization = { $regex: specialization, $options: 'i' };
        }

        if (name) {
            profileQuery.name = { $regex: name, $options: 'i' };
        }

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const startIndex = (pageNum - 1) * limitNum;

        const total = await DoctorProfile.countDocuments(profileQuery);

        const doctors = await DoctorProfile.find(profileQuery)
            .select('-password')
            .skip(startIndex)
            .limit(limitNum)
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: doctors.length,
            pagination: {
                total,
                page: pageNum,
                pages: Math.ceil(total / limitNum)
            },
            data: doctors
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get doctor by doctorId
// @route   GET /api/doctors/:doctorId
// @access  Public
const getDoctorById = async (req, res) => {
    try {
        const { doctorId } = req.params;

        const doctor = await DoctorProfile.findOne({ doctorId }).select('-password');

        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        res.status(200).json({ success: true, data: doctor });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    loginDoctor,
    getDoctors,
    getDoctorById
};
