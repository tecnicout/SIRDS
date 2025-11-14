const express = require('express');
const router = express.Router();
const CiclosController = require('../controllers/CiclosController');
const authMiddleware = require('../middleware/authMiddleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// =====================================================
// RUTAS DE CICLOS
// =====================================================

/**
 * GET /api/ciclos
 * Listar todos los ciclos con paginación
 * Query params: page, limit, estado, anio
 */
router.get('/', CiclosController.listarCiclos);

/**
 * GET /api/ciclos/activo
 * Obtener el ciclo activo actual (en ventana de ejecución)
 */
router.get('/activo', CiclosController.obtenerCicloActivo);

/**
 * GET /api/ciclos/estadisticas
 * Obtener estadísticas generales de ciclos
 */
router.get('/estadisticas', CiclosController.obtenerEstadisticas);

/**
 * GET /api/ciclos/preview-elegibles
 * Calcular preview de empleados elegibles sin crear el ciclo
 * Query params: fecha_entrega, id_area_produccion, id_area_mercadista
 */
router.get('/preview-elegibles', CiclosController.previewEmpleadosElegibles);

/**
 * GET /api/ciclos/:id/candidatos
 * Buscar empleados disponibles para agregar manualmente al ciclo
 */
router.get('/:id/candidatos', CiclosController.buscarCandidatosCiclo);

/**
 * GET /api/ciclos/:id
 * Obtener detalle de un ciclo específico
 */
router.get('/:id', CiclosController.obtenerCiclo);

/**
 * POST /api/ciclos
 * Crear un nuevo ciclo de dotación
 * Body: { nombre_ciclo, fecha_entrega, id_area_produccion?, id_area_mercadista?, observaciones? }
 */
router.post('/', CiclosController.crearCiclo);

/**
 * PUT /api/ciclos/:id/estado
 * Actualiza el estado del ciclo: 'activo' | 'cerrado'
 * Body: { estado }
 */
router.put('/:id/estado', CiclosController.actualizarEstadoCiclo);

/**
 * POST /api/ciclos/:id/empleados-manual
 * Agregar un empleado manualmente al ciclo (casos especiales)
 */
router.post('/:id/empleados-manual', CiclosController.agregarEmpleadoManual);

/**
 * DELETE /api/ciclos/:id?force=true
 * Sin force: elimina solo si no hay entregas u omisiones (purga procesados).
 * Con force=true: elimina aunque existan entregas u omisiones (purga todo empleado_ciclo primero).
 */
router.delete('/:id', CiclosController.eliminarCiclo);

/**
 * GET /api/ciclos/:id/empleados
 * Obtener empleados de un ciclo con paginación
 * Query params: page, limit, estado, area
 */
router.get('/:id/empleados', CiclosController.obtenerEmpleadosCiclo);

/**
 * PUT /api/ciclos/empleados/:id_empleado_ciclo
 * Actualizar estado de un empleado en el ciclo
 * Body: { estado, observaciones? }
 */
router.put('/empleados/:id_empleado_ciclo', CiclosController.actualizarEstadoEmpleado);

/**
 * DELETE /api/ciclos/empleados/:id_empleado_ciclo
 * Eliminar (excluir) un empleado mientras esté procesado
 */
router.delete('/empleados/:id_empleado_ciclo', CiclosController.eliminarEmpleadoManual);

// =====================================================
// RUTAS DE SALARIO MÍNIMO (SMLV)
// =====================================================

/**
 * GET /api/ciclos/smlv/todos
 * Listar todos los salarios mínimos registrados
 */
router.get('/smlv/todos', CiclosController.listarSMLV);

/**
 * POST /api/ciclos/smlv
 * Crear o actualizar un salario mínimo
 * Body: { anio, valor_mensual, observaciones? }
 */
router.post('/smlv', CiclosController.guardarSMLV);

/**
 * POST /api/ciclos/:id/sync-elegibles
 * Reinsertar elegibles faltantes en un ciclo existente (usa NOT EXISTS)
 */
router.post('/:id/sync-elegibles', CiclosController.syncElegibles);

module.exports = router;
