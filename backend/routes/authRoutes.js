const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateLogin, validateRegister } = require('../validators/authValidator');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/login', authLimiter, validateLogin, authController.login);
router.post('/register', authLimiter, validateRegister, authController.register);
router.get('/admin-status', authController.getAdminStatus);
router.post('/admin-register', authLimiter, validateRegister, authController.registerAdmin);
router.post('/manager-register', authLimiter, validateRegister, authController.registerManager);
router.post('/sales-register', authLimiter, validateRegister, authController.registerSalesExec);
router.get('/public-stats', authController.getPublicStats);
router.post('/logout', authenticateToken, authController.logout);
router.get('/me', authenticateToken, authController.getCurrentUser);
router.put('/profile', authenticateToken, authController.updateProfile);
router.delete('/delete-account', authenticateToken, authController.deleteAccount);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);

module.exports = router;
