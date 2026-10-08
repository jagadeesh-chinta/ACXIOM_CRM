const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(authenticateToken);
router.use(authorizeRoles('ADMIN', 'MANAGER'));

router.get('/', auditController.getAuditLogs);

module.exports = router;
