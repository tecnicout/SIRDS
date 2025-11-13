const express = require('express');
const router = express.Router();
const DotacionesController = require('../controllers/DotacionesController');
const authMiddleware = require('../middleware/authMiddleware');

// === RUTAS PÚBLICAS (sin autenticación) ===
// Buscar empleado por documento (para landing y registro público de tallas)
router.get('/empleado/:documento', DotacionesController.buscarEmpleadoPorDocumento);
// Obtener tallas disponibles por dotación y empleado (público)
router.get('/tallas/:id_dotacion/:id_empleado', DotacionesController.getTallasDisponibles);
// Guardar preferencias de tallas (sin entrega)
router.post('/guardar-tallas', DotacionesController.guardarTallasEmpleado);

// Aplicar middleware de autenticación a las rutas restantes
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

// Obtener tallas disponibles por dotación y empleado (protegido - duplicado por compatibilidad)
router.get('/tallas-protegido/:id_dotacion/:id_empleado', DotacionesController.getTallasDisponibles);

// Obtener datos para reportes
router.get('/reportes', DotacionesController.getReportes);

// Obtener KPIs para el dashboard
router.get('/kpis', DotacionesController.getKpis);

// Buscar empleado por documento (protegido - duplicado por compatibilidad)
router.get('/empleado-protegido/:documento', DotacionesController.buscarEmpleadoPorDocumento);

// === RUTAS POST ===

// Registrar nueva entrega
router.post('/entregar', DotacionesController.registrarEntrega);
// Guardar preferencias de tallas (protegido - duplicado por compatibilidad)
router.post('/guardar-tallas-protegido', DotacionesController.guardarTallasEmpleado);

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