const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');

// @desc    Create Doctor Profile
// @route   POST /api/doctors/profile
// @access  Private/Doctor
const createDoctorProfile = async (req, res) => {
    try {
        const { specialization, experience, bio } = req.body;

        if (!specialization || experience === undefined) {
            return res.status(400).json({ success: false, message: 'Specialization and experience are required' });
        }

        // Prevent duplicate profiles
        let profile = await DoctorProfile.findOne({ user: req.user._id });
        if (profile) {
            return res.status(400).json({ success: false, message: 'Profile already exists for this doctor' });
        }

        profile = await DoctorProfile.create({
            user: req.user._id,
            doctorId: req.user.uniqueId,
            specialization,
            experience,
            bio
        });

        res.status(201).json({ success: true, data: profile });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
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
            const users = await User.find({
                name: { $regex: name, $options: 'i' },
                role: 'doctor'
            }).select('_id');
            
            const userIds = users.map(u => u._id);
            profileQuery.user = { $in: userIds };
        }

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const startIndex = (pageNum - 1) * limitNum;

        const total = await DoctorProfile.countDocuments(profileQuery);

        const doctors = await DoctorProfile.find(profileQuery)
            .populate('user', 'name email uniqueId role')
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

        const doctor = await DoctorProfile.findOne({ doctorId })
            .populate('user', 'name email uniqueId role');

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
    createDoctorProfile,
    getDoctors,
    getDoctorById
};
