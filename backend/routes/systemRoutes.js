const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(authenticateToken);
router.use(authorizeRoles('ADMIN'));

router.get('/health', systemController.getSystemHealth);
router.get('/settings', systemController.getSystemSettings);
router.put('/settings', systemController.updateSystemSetting);

module.exports = router;
