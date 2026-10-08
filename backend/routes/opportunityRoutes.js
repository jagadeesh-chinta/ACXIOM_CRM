const express = require('express');
const router = express.Router();
const opportunityController = require('../controllers/opportunityController');
const { validateCreateOpportunity, validateUpdateOpportunity } = require('../validators/opportunityValidator');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(authenticateToken);

// Opportunities list and single view (Customer scoped to own, Sales to assigned, Admin/Manager all)
router.get('/', opportunityController.getOpportunities);
router.get('/:id', opportunityController.getOpportunityById);

// Create, update, delete restricted to internal CRM roles
router.post('/', authorizeRoles('ADMIN', 'MANAGER', 'SALES_EXECUTIVE'), validateCreateOpportunity, opportunityController.createOpportunity);
router.put('/:id', authorizeRoles('ADMIN', 'MANAGER', 'SALES_EXECUTIVE'), validateUpdateOpportunity, opportunityController.updateOpportunity);
router.delete('/:id', authorizeRoles('ADMIN', 'MANAGER'), opportunityController.deleteOpportunity);

module.exports = router;
