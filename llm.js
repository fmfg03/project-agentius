const express = require('express');
const router = express.Router();
const llmController = require('../controllers/llm');
const authenticateToken = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Send prompt to Builder LLM
router.post('/builder', llmController.sendToBuilder);

// Send prompt to Judge LLM
router.post('/judge', llmController.sendToJudge);

// Switch Builder and Judge roles
router.post('/switch-roles', llmController.switchRoles);

module.exports = router;
