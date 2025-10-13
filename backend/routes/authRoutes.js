const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const authMiddleware = require('../middleware/authMiddleware');

// Login
router.post('/login', AuthController.login);

// Información del usuario autenticado
router.get('/me', authMiddleware, AuthController.me);

module.exports = router;
