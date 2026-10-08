const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { validateCreateActivity, validateUpdateActivity } = require('../validators/activityValidator');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(authenticateToken);

router.get('/', activityController.getActivities);
router.post('/', authorizeRoles('ADMIN', 'MANAGER', 'SALES_EXECUTIVE'), validateCreateActivity, activityController.createActivity);
router.put('/:id', authorizeRoles('ADMIN', 'MANAGER', 'SALES_EXECUTIVE'), validateUpdateActivity, activityController.updateActivity);
router.delete('/:id', authorizeRoles('ADMIN', 'MANAGER'), activityController.deleteActivity);

module.exports = router;
