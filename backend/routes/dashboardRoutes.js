const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const requireAdminOrHR = authMiddleware.requireAdminOrHR;
const DashboardController = require('../controllers/DashboardController');

router.use(authMiddleware);

router.get('/stats', requireAdminOrHR, DashboardController.getAdminStats);

module.exports = router;
