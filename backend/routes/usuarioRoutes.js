const express = require('express');
const router = express.Router();
const UsuarioController = require('../controllers/UsuarioController');
const authMiddleware = require('../middleware/authMiddleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// ===========================================
// RUTAS DE GESTIÓN DE USUARIOS
// ===========================================

// Obtener todos los usuarios (Admin y RH)
router.get('/', UsuarioController.getAll);

// Obtener estadísticas de usuarios (Solo Admin)
router.get('/stats', UsuarioController.getStats);

// Buscar usuarios (Admin y RH)
router.get('/search', UsuarioController.search);

// Obtener empleados sin usuario (Solo Admin)
router.get('/employees-without-user', UsuarioController.getEmployeesWithoutUser);

// Obtener usuarios por rol (Admin y RH)
router.get('/role/:rol', UsuarioController.getByRole);

// Obtener usuario por ID
router.get('/:id', UsuarioController.getById);

// Crear nuevo usuario (Solo Admin)
router.post('/', UsuarioController.create);

// Actualizar usuario (Admin o propio usuario)
router.put('/:id', UsuarioController.update);

// Desactivar usuario (Solo Admin)
router.patch('/:id/deactivate', UsuarioController.deactivate);

// Activar usuario (Solo Admin)
router.patch('/:id/activate', UsuarioController.activate);

// Resetear contraseña (Solo Admin)
router.patch('/:id/reset-password', UsuarioController.resetPassword);

// Eliminar usuario (Solo Admin, y debe estar inactivo)
router.delete('/:id', UsuarioController.delete);

module.exports = router;