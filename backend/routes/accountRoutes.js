const express = require('express');
const AccountController = require('../controllers/accountController');
const authenticate = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/summary', AccountController.getSummary);
router.put('/profile', AccountController.updateProfile);
router.put('/preferences', AccountController.updatePreferences);
router.get('/notifications', AccountController.getNotifications);
router.patch('/notifications/:id', AccountController.markNotification);
router.post('/notifications/read-all', AccountController.markAllRead);
router.post('/notifications/test', AccountController.createTestNotification);

module.exports = router;
