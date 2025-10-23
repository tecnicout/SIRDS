const express = require('express');
const router = express.Router();
const ProveedorController = require('../controllers/ProveedorController');
const authMiddleware = require('../middleware/authMiddleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

/**
 * @route   GET /api/proveedores
 * @desc    Obtener todos los proveedores
 * @access  Private
 */
router.get('/', ProveedorController.obtenerTodos);

/**
 * @route   GET /api/proveedores/buscar
 * @desc    Buscar proveedores con filtros
 * @access  Private
 */
router.get('/buscar', ProveedorController.buscar);

/**
 * @route   GET /api/proveedores/:id
 * @desc    Obtener proveedor por ID
 * @access  Private
 */
router.get('/:id', ProveedorController.obtenerPorId);

/**
 * @route   POST /api/proveedores
 * @desc    Crear nuevo proveedor
 * @access  Private
 */
router.post('/', ProveedorController.crear);

/**
 * @route   PUT /api/proveedores/:id
 * @desc    Actualizar proveedor
 * @access  Private
 */
router.put('/:id', ProveedorController.actualizar);

/**
 * @route   PATCH /api/proveedores/:id/inactivar
 * @desc    Inactivar proveedor
 * @access  Private
 */
router.patch('/:id/inactivar', ProveedorController.inactivar);

/**
 * @route   PATCH /api/proveedores/:id/activar
 * @desc    Activar proveedor
 * @access  Private
 */
router.patch('/:id/activar', ProveedorController.activar);

/**
 * @route   DELETE /api/proveedores/:id
 * @desc    Eliminar proveedor físicamente (solo casos excepcionales)
 * @access  Private
 */
router.delete('/:id', ProveedorController.inactivar); // Cambiar a inactivar por defecto

module.exports = router;
