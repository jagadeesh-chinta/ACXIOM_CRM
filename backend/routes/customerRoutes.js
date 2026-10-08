const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { validateCreateCustomer, validateUpdateCustomer } = require('../validators/customerValidator');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(authenticateToken);

// All roles can call getCustomers (internally scoped: CUSTOMER sees only own, SALES_EXECUTIVE sees assigned, ADMIN/MANAGER sees all)
router.get('/', customerController.getCustomers);
router.get('/:id', customerController.getCustomerById);

// Creation, update, delete only for CRM staff (ADMIN, MANAGER, SALES_EXECUTIVE)
router.post('/', authorizeRoles('ADMIN', 'MANAGER', 'SALES_EXECUTIVE'), validateCreateCustomer, customerController.createCustomer);
router.put('/:id', authorizeRoles('ADMIN', 'MANAGER', 'SALES_EXECUTIVE'), validateUpdateCustomer, customerController.updateCustomer);
router.delete('/:id', authorizeRoles('ADMIN', 'MANAGER'), customerController.deleteCustomer);

module.exports = router;
