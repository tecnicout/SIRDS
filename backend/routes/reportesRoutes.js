const express = require('express');
const router = express.Router();
const ReportesController = require('../controllers/ReportesController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/kpis', ReportesController.getKpis);
router.get('/resumen', ReportesController.getResumen);
router.get('/detalle', ReportesController.getDetalle);
router.get('/exportar', ReportesController.exportar);
router.get('/historial', ReportesController.historial);

module.exports = router;
