const express = require('express');
const router = express.Router();
const customerPortalController = require('../controllers/customerPortalController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/profile', customerPortalController.getCustomerProfile);
router.put('/profile', customerPortalController.updateCustomerProfile);
router.get('/requests', customerPortalController.getCustomerRequests);
router.post('/requests', customerPortalController.createCustomerRequest);
router.patch('/requests/:id', customerPortalController.updateCustomerRequest);

module.exports = router;
