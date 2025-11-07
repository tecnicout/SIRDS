const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const DotacionesController = require('../controllers/DotacionesController');

// Proteger todas las rutas
router.use(authMiddleware);

// Listado (opcional, reutiliza getEntregas)
router.get('/', DotacionesController.getEntregas);

// Actualizar una entrega (kit)
router.put('/:id', DotacionesController.updateEntrega);

// Eliminar una entrega (kit)
router.delete('/:id', DotacionesController.deleteEntrega);

// Obtener items de una entrega (kit)
router.get('/:id/items', DotacionesController.getEntregaItems);

module.exports = router;