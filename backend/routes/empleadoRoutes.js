const express = require('express');
const router = express.Router();
const EmpleadoController = require('../controllers/EmpleadoController');
const authMiddleware = require('../middleware/authMiddleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Rutas para empleados
router.get('/', EmpleadoController.getAll);
router.get('/search', EmpleadoController.search);
router.get('/area/:idArea', EmpleadoController.getByArea);
router.get('/:id', EmpleadoController.getById);
router.post('/', EmpleadoController.create);
router.put('/:id', EmpleadoController.update);
router.patch('/:id/estado', EmpleadoController.changeStatus);

module.exports = router;