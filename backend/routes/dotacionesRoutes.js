const express = require('express');
const router = express.Router();
const DotacionesController = require('../controllers/DotacionesController');
const authMiddleware = require('../middleware/authMiddleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// === RUTAS GET ===

// Obtener todas las dotaciones
router.get('/', DotacionesController.getAll);

// Obtener todas las entregas
router.get('/entregas', DotacionesController.getEntregas);
// Actualizar entrega
router.put('/entregas/:id', DotacionesController.updateEntrega);
// Eliminar entrega
router.delete('/entregas/:id', DotacionesController.deleteEntrega);
// Items de una entrega
router.get('/entregas/:id/items', DotacionesController.getEntregaItems);

// Obtener próximas entregas (próximas a vencer)
router.get('/proximas', DotacionesController.getProximas);

// Obtener stock actual
router.get('/stock', DotacionesController.getStock);

// Obtener tallas disponibles por dotación y empleado
router.get('/tallas/:id_dotacion/:id_empleado', DotacionesController.getTallasDisponibles);

// Obtener datos para reportes
router.get('/reportes', DotacionesController.getReportes);

// Obtener KPIs para el dashboard
router.get('/kpis', DotacionesController.getKpis);

// Buscar empleado por documento
router.get('/empleado/:documento', DotacionesController.buscarEmpleadoPorDocumento);

// === RUTAS POST ===

// Registrar nueva entrega
router.post('/entregar', DotacionesController.registrarEntrega);

// === CRUD Dotación (ítems) ===
// Obtener ítem por ID (detalle)
router.get('/:id', DotacionesController.getByIdItem);
// Crear ítem de dotación
router.post('/', DotacionesController.createItem);
// Actualizar ítem
router.put('/:id', DotacionesController.updateItem);
// Eliminar ítem
router.delete('/:id', DotacionesController.deleteItem);

module.exports = router;