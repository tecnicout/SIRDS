const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const authMiddleware = require('../middleware/authMiddleware');

// Login
router.post('/login', AuthController.login);

// Validar token de sesión
router.get('/validate', authMiddleware, AuthController.validateToken);

// Información del usuario autenticado
router.get('/me', authMiddleware, AuthController.me);

// Cambiar contraseña propia
router.post('/change-password', authMiddleware, AuthController.changePassword);

// Logout
router.post('/logout', authMiddleware, AuthController.logout);

// Verificar permisos específicos
router.get('/check-permission', authMiddleware, AuthController.checkPermission);

// Estadísticas de autenticación (Solo Admin)
router.get('/stats', authMiddleware, AuthController.getAuthStats);

// ===================================
// RUTAS DE RESTABLECIMIENTO DE CONTRASEÑA
// ===================================

// Solicitar restablecimiento de contraseña
router.post('/forgot-password', AuthController.forgotPassword);

// Restablecer contraseña con token
router.post('/reset-password/:token', AuthController.resetPassword);

// Validar token de restablecimiento (opcional, para UX)
router.get('/reset-password/:token/validate', AuthController.validateResetToken);

module.exports = router;
