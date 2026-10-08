const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { validateCreateLead, validateUpdateLead } = require('../validators/leadValidator');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(authenticateToken);
router.use(authorizeRoles('ADMIN', 'MANAGER', 'SALES_EXECUTIVE'));

router.get('/', leadController.getLeads);
router.get('/:id', leadController.getLeadById);
router.post('/', validateCreateLead, leadController.createLead);
router.put('/:id', validateUpdateLead, leadController.updateLead);
router.delete('/:id', authorizeRoles('ADMIN', 'MANAGER'), leadController.deleteLead);
router.post('/:id/convert', leadController.convertLead);

module.exports = router;
