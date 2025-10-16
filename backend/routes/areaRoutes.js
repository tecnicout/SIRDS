const express = require('express');
const router = express.Router();
const AreaController = require('../controllers/AreaController');
const authMiddleware = require('../middleware/authMiddleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Rutas para áreas
router.get('/', AreaController.getAll);
router.get('/todas', AreaController.getAllWithInactive); // Para auditoría (activas e inactivas)
router.get('/ubicacion/:id_ubicacion', AreaController.getByUbicacion);
router.get('/:id', AreaController.getById);
router.post('/', AreaController.create);
router.put('/:id', AreaController.update);
router.put('/:id/reactivar', AreaController.reactivarArea); // Reactivar área inactiva
router.delete('/:id', AreaController.delete); // Ahora es inactivación lógica

module.exports = router;