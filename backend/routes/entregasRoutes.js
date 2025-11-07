const express = require('express');
const router = express.Router();
const EntregasController = require('../controllers/EntregasController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { hasRole } = require('../middleware/roleMiddleware');

// Middleware de autenticación para todas las rutas
router.use(authMiddleware);

// Listar entregas del ciclo activo (todos los roles pueden ver)
router.get('/', EntregasController.listarEntregas);

// Actualizar estado de una entrega (solo roles autorizados)
router.put('/:id/estado', 
    hasRole(['almacen', 'admin']), 
    EntregasController.actualizarEstado
);

// Obtener estadísticas (roles autorizados)
router.get('/estadisticas/:id_ciclo',
    hasRole(['almacen', 'admin', 'recursos_humanos']),
    EntregasController.obtenerEstadisticas
);

module.exports = router;