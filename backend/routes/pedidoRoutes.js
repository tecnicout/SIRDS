const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const PedidoController = require('../controllers/PedidoController');

router.use(authMiddleware);

router.get('/', PedidoController.list);
router.get('/stats', PedidoController.stats);
router.get('/faltantes/export', PedidoController.exportarFaltantes);
router.post('/generar', PedidoController.generar);
router.get('/:id/export', PedidoController.exportar);
router.get('/:id', PedidoController.getById);

module.exports = router;