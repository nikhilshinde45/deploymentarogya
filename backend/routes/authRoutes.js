const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');

// router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/register', (req, res, next) => {
    console.log("🔥 REGISTER ROUTE HIT");
    next();
}, registerUser);
module.exports = router;
