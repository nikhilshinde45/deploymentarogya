const express = require('express');
const router = express.Router();
const { loginDoctor } = require('../controllers/doctorController');
const validate = require('../middleware/validate');
const { loginSchema } = require('../validation/schemas');

router.post('/login', validate(loginSchema), loginDoctor);

module.exports = router;
