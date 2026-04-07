const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');
const validate = require('../middleware/validate');
const { registerUserSchema, loginSchema } = require('../validation/schemas');

router.post('/login', validate(loginSchema), loginUser);

router.post('/register', validate(registerUserSchema), registerUser);

module.exports = router;
