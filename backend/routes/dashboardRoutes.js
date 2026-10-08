const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(authenticateToken);

router.get('/admin', authorizeRoles('ADMIN'), dashboardController.getAdminDashboard);
router.get('/manager', authorizeRoles('ADMIN', 'MANAGER'), dashboardController.getManagerDashboard);
router.get('/sales', authorizeRoles('ADMIN', 'MANAGER', 'SALES_EXECUTIVE'), dashboardController.getSalesDashboard);
router.get('/customer', authorizeRoles('CUSTOMER'), dashboardController.getCustomerDashboard);

module.exports = router;
