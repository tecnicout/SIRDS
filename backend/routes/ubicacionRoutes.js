const express = require('express');
const router = express.Router();
const UbicacionController = require('../controllers/UbicacionController');

// Rutas para ubicaciones
router.get('/', UbicacionController.getAll);
router.get('/tipo/:tipo', UbicacionController.getByTipo);
router.get('/:id', UbicacionController.getById);
router.post('/', UbicacionController.create);
router.put('/:id', UbicacionController.update);
router.delete('/:id', UbicacionController.delete);

module.exports = router;