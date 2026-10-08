const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validateCreateUser, validateUpdateUser } = require('../validators/userValidator');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(authenticateToken);

// Role list viewable by Admin and Manager (for lead/task assignment selects)
router.get('/roles', authorizeRoles('ADMIN', 'MANAGER'), userController.getRoles);

// User list viewable by Admin and Manager
router.get('/', authorizeRoles('ADMIN', 'MANAGER'), userController.getUsers);

// Modifications restricted strictly to ADMIN
router.post('/', authorizeRoles('ADMIN'), validateCreateUser, userController.createUser);
router.put('/:id', authorizeRoles('ADMIN'), validateUpdateUser, userController.updateUser);
router.patch('/:id/status', authorizeRoles('ADMIN'), userController.updateUserStatus);
router.post('/:id/reset-password', authorizeRoles('ADMIN'), userController.resetUserPassword);

module.exports = router;
