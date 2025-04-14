const express = require('express');
const router = express.Router();
const assetsController = require('../controllers/assets');
const authenticateToken = require('../middleware/auth');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all assets for a project
router.get('/project/:projectId', assetsController.getAssets);

// Get a single asset
router.get('/:id', assetsController.getAsset);

// Upload a new asset
router.post('/', upload.single('file'), assetsController.uploadAsset);

// Delete an asset
router.delete('/:id', assetsController.deleteAsset);

module.exports = router;
