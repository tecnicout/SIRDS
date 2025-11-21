const express = require('express');
const router = express.Router();
const UbicacionController = require('../controllers/UbicacionController');
const authMiddleware = require('../middleware/authMiddleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Rutas para ubicaciones
router.get('/', UbicacionController.getAll);
router.get('/tipo/:tipo', UbicacionController.getByTipo);
router.get('/:id/empleados', UbicacionController.getEmployees);
router.get('/:id', UbicacionController.getById);
router.post('/', UbicacionController.create);
router.put('/:id', UbicacionController.update);
router.post('/:id/reasignar-empleados', UbicacionController.reassignEmployees);
router.delete('/:id', UbicacionController.delete);

module.exports = router;