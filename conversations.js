const express = require('express');
const router = express.Router();
const conversationsController = require('../controllers/conversations');
const authenticateToken = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all conversations for a project
router.get('/project/:projectId', conversationsController.getConversations);

// Get a single conversation with messages
router.get('/:id', conversationsController.getConversation);

// Create a new conversation
router.post('/', conversationsController.createConversation);

// Update a conversation
router.put('/:id', conversationsController.updateConversation);

// Delete a conversation
router.delete('/:id', conversationsController.deleteConversation);

// Add a message to a conversation
router.post('/:id/messages', conversationsController.addMessage);

module.exports = router;
