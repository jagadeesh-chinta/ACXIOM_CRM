const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(authenticateToken);
router.use(authorizeRoles('ADMIN', 'MANAGER', 'SALES_EXECUTIVE'));

router.get('/customers', reportController.getCustomerReport);
router.get('/leads', reportController.getLeadReport);
router.get('/followups', reportController.getFollowupReport);
router.get('/opportunities', reportController.getOpportunityReport);
router.get('/pipeline', reportController.getPipelineReport);
router.get('/conversion', reportController.getConversionReport);
router.get('/activity', reportController.getUserActivityReport);
router.get('/audit', authorizeRoles('ADMIN', 'MANAGER'), reportController.getAuditReport);

module.exports = router;
