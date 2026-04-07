const express = require('express');
const router = express.Router();
const { loginPharmacist } = require('../controllers/pharmacistController');
const validate = require('../middleware/validate');
const { loginSchema } = require('../validation/schemas');

router.post('/login', validate(loginSchema), loginPharmacist);

module.exports = router;
