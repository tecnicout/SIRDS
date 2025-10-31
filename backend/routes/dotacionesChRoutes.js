const express = require('express');
const router = express.Router();
const DotacionesController = require('../controllers/DotacionesController');
const authMiddleware = require('../middleware/authMiddleware');

// Proteger ruta con middleware de autenticación
router.use(authMiddleware);

// GET /api/dotaciones_ch?estado=&area=&page=&limit=
router.get('/', DotacionesController.getDotacionesCh);

module.exports = router;
