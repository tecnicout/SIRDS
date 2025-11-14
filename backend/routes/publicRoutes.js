const express = require('express');
const router = express.Router();
const CiclosController = require('../controllers/CiclosController');

// Rutas públicas: no requieren autenticación
router.get('/proxima-entrega', CiclosController.obtenerProximaEntregaPublica);

module.exports = router;
