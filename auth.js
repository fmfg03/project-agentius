const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const authenticateToken = require('../middleware/auth');

// OAuth login route
router.get('/login', authController.oauthLogin);

// OAuth callback route
router.get('/callback', authController.oauthCallback);

// Get current user route (protected)
router.get('/user', authenticateToken, authController.getCurrentUser);

// Update API keys route (protected)
router.put('/api-keys', authenticateToken, authController.updateApiKeys);

// Logout route
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;
