const express = require('express');
const router = express.Router();
const { chatWithAssistant } = require('../controllers/healthAssistantController');

// POST /api/health-assistant/chat
router.post('/chat', chatWithAssistant);

module.exports = router;
