const express = require('express');
const router = express.Router();

// Crear archivos de rutas básicos para completar el servidor
const routeFiles = [
    'rolRoutes',
    'proveedorRoutes', 
    'categoriaRoutes',
    'dotacionRoutes',
    'tallaRoutes',
    'stockRoutes',
    'kitRoutes',
    'solicitudRoutes',
    'pedidoRoutes',
    'entregaRoutes'
];

module.exports = router;