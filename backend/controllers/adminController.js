const Admin = require('../models/Admin');
const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Authenticate admin
// @route   POST /api/admin/login
// @access  Public
const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email });

        if (admin && (await admin.matchPassword(password))) {
            res.json({
                _id: admin.id,
                name: admin.name,
                email: admin.email,
                username: admin.username,
                role: admin.role,
                token: generateToken(admin._id, admin.role)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Add a new doctor
// @route   POST /api/admin/doctors
// @access  Private/Admin
const addDoctor = async (req, res) => {
    try {
        const { name, email, password, specialization, experience, bio } = req.body;

        if (!name || !email || !password || !specialization || experience === undefined) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Profile image is required' });
        }

        // Check uniqueness across collections
        const userExists = await User.findOne({ email });
        const doctorExists = await DoctorProfile.findOne({ email });
        const adminExists = await Admin.findOne({ email });

        if (userExists || doctorExists || adminExists) {
            return res.status(400).json({ success: false, message: 'Email already exists in the system' });
        }

        const doctor = await DoctorProfile.create({
            name,
            email,
            password,
            specialization,
            experience,
            bio,
            profileImage: req.file.path
        });

        // Omit password from response
        const doctorResponse = {
            _id: doctor._id,
            doctorId: doctor.doctorId,
            name: doctor.name,
            email: doctor.email,
            role: doctor.role,
            specialization: doctor.specialization,
            experience: doctor.experience,
            bio: doctor.bio,
            profileImage: doctor.profileImage,
            createdAt: doctor.createdAt
        };

        res.status(201).json({ success: true, data: doctorResponse });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update doctor
// @route   PUT /api/admin/doctors/:id
// @access  Private/Admin
const updateDoctor = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };

        // If a new image was uploaded, use it
        if (req.file) {
            updates.profileImage = req.file.path;
        }

        // Remove profileImage from body if sent as string (shouldn't happen but safety)
        if (typeof updates.profileImage === 'string' && !req.file) {
            delete updates.profileImage;
        }

        // Prevent admin from overriding these directly via simple update if not intended
        if (updates.email) {
             const emailExistsUser = await User.findOne({ email: updates.email });
             const emailExistsDoctor = await DoctorProfile.findOne({ email: updates.email, _id: { $ne: id } });
             const emailExistsAdmin = await Admin.findOne({ email: updates.email });
             if (emailExistsUser || emailExistsDoctor || emailExistsAdmin) {
                 return res.status(400).json({ success: false, message: 'Email already exists' });
             }
        }

        const doctor = await DoctorProfile.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).select('-password');

        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        res.status(200).json({ success: true, data: doctor });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Delete doctor
// @route   DELETE /api/admin/doctors/:id
// @access  Private/Admin
const deleteDoctor = async (req, res) => {
    try {
        const { id } = req.params;

        const doctor = await DoctorProfile.findByIdAndDelete(id);

        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        res.status(200).json({ success: true, message: 'Doctor deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    loginAdmin,
    addDoctor,
    updateDoctor,
    deleteDoctor
};
