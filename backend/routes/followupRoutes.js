const express = require('express');
const router = express.Router();
const followupController = require('../controllers/followupController');
const { validateCreateFollowup, validateUpdateFollowup } = require('../validators/followupValidator');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(authenticateToken);

router.get('/', followupController.getFollowups);
router.post('/', authorizeRoles('ADMIN', 'MANAGER', 'SALES_EXECUTIVE'), validateCreateFollowup, followupController.createFollowup);
router.put('/:id', authorizeRoles('ADMIN', 'MANAGER', 'SALES_EXECUTIVE'), validateUpdateFollowup, followupController.updateFollowup);
router.delete('/:id', authorizeRoles('ADMIN', 'MANAGER'), followupController.deleteFollowup);

module.exports = router;
