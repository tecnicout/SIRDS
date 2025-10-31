const { query } = require('../config/database');

class DotacionesController {
    // Obtener todas las dotaciones con información relacionada
    static async getAll(req, res) {
        try {
            const sql = `
                SELECT 
                    d.id_dotacion,
                    d.nombre_dotacion,
                    d.descripcion,
                    d.talla_requerida,
                    d.unidad_medida,
                    d.precio_unitario,
                    c.nombre_categoria,
                    p.nombre as nombre_proveedor,
                    p.telefono as telefono_proveedor,
                    p.email as email_proveedor
                FROM dotacion d
                LEFT JOIN categoriadotacion c ON d.id_categoria = c.id_categoria
                LEFT JOIN proveedor p ON d.id_proveedor = p.id_proveedor
                ORDER BY d.nombre_dotacion
            `;
            
            const dotaciones = await query(sql);
            
            res.json({
                success: true,
                data: dotaciones,
                message: 'Dotaciones obtenidas correctamente'
            });
        } catch (error) {
            console.error('Error al obtener dotaciones:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener dotaciones',
                error: error.message
            });
        }
    }

    // Obtener todas las entregas con información detallada
    static async getEntregas(req, res) {
        try {
            const sql = `
                SELECT 
                    ed.id_entrega,
                    CONCAT(e.nombre, ' ', e.apellido) as empleado_nombre,
                    e.id_empleado,
                    e.cargo,
                    d.nombre_dotacion,
                    d.id_dotacion,
                    t.talla,
                    t.tipo_articulo,
                    ed.cantidad,
                    ed.fecha_entrega,
                    ed.observaciones,
                    a.nombre_area as area_nombre,
                    DATE_ADD(ed.fecha_entrega, INTERVAL 4 MONTH) as proxima_entrega,
                    DATEDIFF(DATE_ADD(ed.fecha_entrega, INTERVAL 4 MONTH), CURDATE()) as dias_restantes,
                    CASE 
                        WHEN DATEDIFF(DATE_ADD(ed.fecha_entrega, INTERVAL 4 MONTH), CURDATE()) < 0 THEN 'vencida'
                        WHEN DATEDIFF(DATE_ADD(ed.fecha_entrega, INTERVAL 4 MONTH), CURDATE()) <= 30 THEN 'proxima'
                        ELSE 'vigente'
                    END as estado
                FROM entregadotacion ed
                INNER JOIN empleado e ON ed.id_empleado = e.id_empleado
                INNER JOIN dotacion d ON ed.id_dotacion = d.id_dotacion
                LEFT JOIN talla t ON ed.id_talla = t.id_talla
                LEFT JOIN area a ON e.id_area = a.id_area
                ORDER BY ed.fecha_entrega DESC
            `;
            
            const entregas = await query(sql);
            
            res.json({
                success: true,
                data: entregas,
                message: 'Entregas obtenidas correctamente'
            });
        } catch (error) {
            console.error('Error al obtener entregas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener entregas',
                error: error.message
            });
        }
    }

    // Endpoint compatible con frontend antiguo: /api/dotaciones_ch
    // Acepta query params: estado (puede ser vacío) y area (puede ser vacío)
    // Devuelve resultados paginados. Usa consultas parametrizadas para evitar inyección SQL.
    static async getDotacionesCh(req, res) {
        try {
            const { estado, area, page = 1, limit = 10 } = req.query;

            // Construir condiciones opcionales
            const whereClauses = [];
            const params = [];

            if (estado !== undefined && estado !== null && String(estado).trim() !== '') {
                whereClauses.push('estado = ?');
                params.push(String(estado).trim());
            }

            if (area !== undefined && area !== null && String(area).trim() !== '') {
                whereClauses.push('area = ?');
                params.push(String(area).trim());
            }

            const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

            // Paginación segura
            const pageNum = Math.max(parseInt(page, 10) || 1, 1);
            const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
            const offset = (pageNum - 1) * limitNum;

            // Query principal (suponemos la existencia de la tabla dotaciones_ch)
            const sql = `
                SELECT *
                FROM dotaciones_ch
                ${whereSql}
                ORDER BY id DESC
                LIMIT ?
                OFFSET ?
            `;

            // params -> filtros..., limit, offset
            params.push(limitNum, offset);

            const rows = await query(sql, params);

            // Obtener total (para paginación)
            let total = 0;
            try {
                const countSql = `SELECT COUNT(*) as total FROM dotaciones_ch ${whereSql}`;
                const countResult = await query(countSql, params.slice(0, Math.max(0, params.length - 2)));
                total = countResult && countResult[0] ? countResult[0].total : 0;
            } catch (countErr) {
                // No bloquear la respuesta si el COUNT falla; registrar y continuar
                console.error('Error al calcular total dotaciones_ch:', countErr);
            }

            res.json({
                success: true,
                data: rows,
                total,
                message: 'Dotaciones CH obtenidas correctamente'
            });
        } catch (error) {
            console.error('Error en getDotacionesCh:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener dotaciones_ch',
                error: error.message
            });
        }
    }

    // Obtener próximas entregas (próximas a vencer)
    static async getProximas(req, res) {
        try {
            const sql = `
                SELECT 
                    CONCAT(e.nombre, ' ', e.apellido) as empleado_nombre,
                    d.nombre_dotacion,
                    DATE_ADD(ed.fecha_entrega, INTERVAL 4 MONTH) as proxima_entrega,
                    DATEDIFF(DATE_ADD(ed.fecha_entrega, INTERVAL 4 MONTH), CURDATE()) as dias_restantes,
                    ed.fecha_entrega as ultima_entrega
                FROM entregadotacion ed
                INNER JOIN empleado e ON ed.id_empleado = e.id_empleado
                INNER JOIN dotacion d ON ed.id_dotacion = d.id_dotacion
                WHERE DATEDIFF(DATE_ADD(ed.fecha_entrega, INTERVAL 4 MONTH), CURDATE()) <= 30
                AND DATEDIFF(DATE_ADD(ed.fecha_entrega, INTERVAL 4 MONTH), CURDATE()) >= 0
                ORDER BY dias_restantes ASC
            `;
            
            const proximas = await query(sql);
            
            res.json({
                success: true,
                data: proximas,
                message: 'Próximas entregas obtenidas correctamente'
            });
        } catch (error) {
            console.error('Error al obtener próximas entregas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener próximas entregas',
                error: error.message
            });
        }
    }

    // Obtener stock actual por dotación, talla y área
    static async getStock(req, res) {
        try {
            const sql = `
                SELECT 
                    s.id_stock,
                    d.nombre_dotacion,
                    d.id_dotacion,
                    t.talla,
                    t.tipo_articulo,
                    a.nombre_area as area_nombre,
                    s.cantidad,
                    d.unidad_medida
                FROM stockdotacion s
                INNER JOIN dotacion d ON s.id_dotacion = d.id_dotacion
                LEFT JOIN talla t ON s.id_talla = t.id_talla
                LEFT JOIN area a ON s.id_area = a.id_area
                WHERE s.cantidad > 0
                ORDER BY d.nombre_dotacion, t.talla
            `;
            
            const stock = await query(sql);
            
            res.json({
                success: true,
                data: stock,
                message: 'Stock obtenido correctamente'
            });
        } catch (error) {
            console.error('Error al obtener stock:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener stock',
                error: error.message
            });
        }
    }

    // Obtener tallas disponibles por dotación y empleado (filtradas por género)
    static async getTallasDisponibles(req, res) {
        try {
            const { id_dotacion, id_empleado } = req.params;
            
            // Primero verificar si la dotación requiere talla
            const dotacionSql = `
                SELECT talla_requerida FROM dotacion WHERE id_dotacion = ?
            `;
            const [dotacion] = await query(dotacionSql, [id_dotacion]);
            
            if (!dotacion.talla_requerida) {
                return res.json({
                    success: true,
                    data: [],
                    message: 'Esta dotación no requiere talla específica'
                });
            }
            
            // Obtener género del empleado y tallas disponibles
            const sql = `
                SELECT DISTINCT 
                    t.id_talla,
                    t.talla,
                    t.tipo_articulo,
                    s.cantidad as stock_disponible
                FROM talla t
                INNER JOIN empleado e ON t.id_genero = e.id_genero
                LEFT JOIN stockdotacion s ON t.id_talla = s.id_talla AND s.id_dotacion = ?
                WHERE e.id_empleado = ?
                AND (s.cantidad > 0 OR s.cantidad IS NULL)
                ORDER BY t.talla
            `;
            
            const tallas = await query(sql, [id_dotacion, id_empleado]);
            
            res.json({
                success: true,
                data: tallas,
                message: 'Tallas disponibles obtenidas correctamente'
            });
        } catch (error) {
            console.error('Error al obtener tallas disponibles:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener tallas disponibles',
                error: error.message
            });
        }
    }

    // Obtener datos para reportes y gráficos
    static async getReportes(req, res) {
        try {
            const { fecha_inicio, fecha_fin } = req.query;
            
            let dateFilter = '';
            let params = [];
            
            if (fecha_inicio && fecha_fin) {
                dateFilter = 'WHERE ed.fecha_entrega BETWEEN ? AND ?';
                params = [fecha_inicio, fecha_fin];
            }
            
            // Entregas por mes
            const entregasPorMesSql = `
                SELECT 
                    DATE_FORMAT(ed.fecha_entrega, '%Y-%m') as mes,
                    COUNT(*) as total_entregas,
                    SUM(ed.cantidad) as total_cantidad
                FROM entregadotacion ed
                ${dateFilter}
                GROUP BY DATE_FORMAT(ed.fecha_entrega, '%Y-%m')
                ORDER BY mes DESC
                LIMIT 12
            `;
            
            // Entregas por categoría
            const entregasPorCategoriaSql = `
                SELECT 
                    c.nombre_categoria,
                    COUNT(ed.id_entrega) as total_entregas,
                    SUM(ed.cantidad) as total_cantidad
                FROM entregadotacion ed
                INNER JOIN dotacion d ON ed.id_dotacion = d.id_dotacion
                INNER JOIN categoriadotacion c ON d.id_categoria = c.id_categoria
                ${dateFilter}
                GROUP BY c.id_categoria, c.nombre_categoria
                ORDER BY total_entregas DESC
            `;
            
            // Entregas por área
            const entregasPorAreaSql = `
                SELECT 
                    a.nombre_area as area_nombre,
                    COUNT(ed.id_entrega) as total_entregas,
                    SUM(ed.cantidad) as total_cantidad
                FROM entregadotacion ed
                INNER JOIN empleado e ON ed.id_empleado = e.id_empleado
                INNER JOIN area a ON e.id_area = a.id_area
                ${dateFilter}
                GROUP BY a.id_area, a.nombre_area
                ORDER BY total_entregas DESC
            `;
            
            const [entregasPorMes, entregasPorCategoria, entregasPorArea] = await Promise.all([
                query(entregasPorMesSql, params),
                query(entregasPorCategoriaSql, params),
                query(entregasPorAreaSql, params)
            ]);
            
            res.json({
                success: true,
                data: {
                    entregas_por_mes: entregasPorMes,
                    entregas_por_categoria: entregasPorCategoria,
                    entregas_por_area: entregasPorArea
                },
                message: 'Reportes obtenidos correctamente'
            });
        } catch (error) {
            console.error('Error al obtener reportes:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener reportes',
                error: error.message
            });
        }
    }

    // Registrar nueva entrega
    static async registrarEntrega(req, res) {
        try {
            const { id_empleado, id_dotacion, id_talla, cantidad, fecha_entrega, observaciones } = req.body;
            
            // Validaciones básicas
            if (!id_empleado || !id_dotacion || !cantidad || !fecha_entrega) {
                return res.status(400).json({
                    success: false,
                    message: 'Faltan campos obligatorios'
                });
            }
            
            // Verificar si la dotación requiere talla
            const dotacionSql = 'SELECT talla_requerida FROM dotacion WHERE id_dotacion = ?';
            const [dotacion] = await query(dotacionSql, [id_dotacion]);
            
            if (dotacion.talla_requerida && !id_talla) {
                return res.status(400).json({
                    success: false,
                    message: 'Esta dotación requiere especificar una talla'
                });
            }
            
            // Verificar stock disponible si se requiere talla
            if (dotacion.talla_requerida && id_talla) {
                const stockSql = `
                    SELECT cantidad FROM stockdotacion 
                    WHERE id_dotacion = ? AND id_talla = ?
                `;
                const stockResult = await query(stockSql, [id_dotacion, id_talla]);
                
                if (stockResult.length === 0 || stockResult[0].cantidad < cantidad) {
                    return res.status(400).json({
                        success: false,
                        message: 'Stock insuficiente para esta dotación y talla'
                    });
                }
            }
            
            // Insertar la entrega
            const insertEntregaSql = `
                INSERT INTO entregadotacion (id_empleado, id_dotacion, id_talla, cantidad, fecha_entrega, observaciones)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            
            const result = await query(insertEntregaSql, [
                id_empleado, 
                id_dotacion, 
                dotacion.talla_requerida ? id_talla : null, 
                cantidad, 
                fecha_entrega, 
                observaciones || null
            ]);
            
            // Actualizar stock si se requiere talla
            if (dotacion.talla_requerida && id_talla) {
                const updateStockSql = `
                    UPDATE stockdotacion 
                    SET cantidad = cantidad - ?
                    WHERE id_dotacion = ? AND id_talla = ?
                `;
                await query(updateStockSql, [cantidad, id_dotacion, id_talla]);
            }
            
            // Registrar movimiento en historial
            const empleadoSql = 'SELECT CONCAT(nombre, " ", apellido) as nombre_completo FROM empleado WHERE id_empleado = ?';
            const [empleado] = await query(empleadoSql, [id_empleado]);
            
            const dotacionNombreSql = 'SELECT nombre_dotacion FROM dotacion WHERE id_dotacion = ?';
            const [dotacionNombre] = await query(dotacionNombreSql, [id_dotacion]);
            
            const detalleMovimiento = `Entrega registrada: ${dotacionNombre.nombre_dotacion} - Cantidad: ${cantidad} - Empleado: ${empleado.nombre_completo}`;
            
            const historialSql = `
                INSERT INTO historialmovimientos (tabla_modificada, id_registro, tipo_movimiento, fecha_movimiento, usuario_responsable, detalle_cambio)
                VALUES ('entregadotacion', ?, 'INSERT', NOW(), 'sistema', ?)
            `;
            
            await query(historialSql, [result.insertId, detalleMovimiento]);
            
            res.status(201).json({
                success: true,
                data: { id_entrega: result.insertId },
                message: 'Entrega registrada correctamente'
            });
            
        } catch (error) {
            console.error('Error al registrar entrega:', error);
            res.status(500).json({
                success: false,
                message: 'Error al registrar entrega',
                error: error.message
            });
        }
    }

    // Buscar empleado por documento y obtener información completa
    static async buscarEmpleadoPorDocumento(req, res) {
        try {
            const { documento } = req.params;
            
            if (!documento) {
                return res.status(400).json({
                    success: false,
                    message: 'Documento es requerido'
                });
            }

            // Buscar empleado con toda la información necesaria
            // Usar el campo Identificacion en la tabla Empleado (coincide con el modelo)
            const empleadoSql = `
                SELECT 
                    e.*, 
                    e.Identificacion as documento,
                    a.nombre_area as area_nombre,
                    a.id_area,
                    u.nombre as nombre_ubicacion,
                    u.id_ubicacion,
                    g.nombre as nombre_genero,
                    g.id_genero,
                    CONCAT(e.nombre, ' ', e.apellido) as nombre_completo
                FROM Empleado e
                LEFT JOIN Area a ON e.id_area = a.id_area
                LEFT JOIN Ubicacion u ON e.id_ubicacion = u.id_ubicacion
                LEFT JOIN Genero g ON e.id_genero = g.id_genero
                WHERE e.Identificacion = ?
            `;

            const empleados = await query(empleadoSql, [documento]);

            if (!empleados || empleados.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró ningún empleado con ese documento'
                });
            }

            const empleado = empleados[0];
            
            // Obtener dotaciones que le corresponden según su área
            const dotacionesSql = `
                SELECT DISTINCT
                    d.id_dotacion,
                    d.nombre_dotacion,
                    d.descripcion,
                    d.talla_requerida,
                    d.unidad_medida,
                    c.nombre_categoria,
                    p.nombre as proveedor_nombre
                FROM dotacion d
                LEFT JOIN categoriadotacion c ON d.id_categoria = c.id_categoria
                LEFT JOIN proveedor p ON d.id_proveedor = p.id_proveedor
                ORDER BY d.nombre_dotacion
            `;
            
            const dotaciones = await query(dotacionesSql);
            
            // Obtener tallas disponibles para el empleado (basado en su género)
            const tallasSql = `
                SELECT DISTINCT
                    t.id_talla,
                    t.talla,
                    t.tipo_articulo
                FROM talla t
                WHERE t.id_genero = ?
                ORDER BY t.talla
            `;
            
            const tallas = await query(tallasSql, [empleado.id_genero]);
            
            // Obtener historial de entregas del empleado
            const historialSql = `
                SELECT 
                    ed.fecha_entrega,
                    d.nombre_dotacion,
                    t.talla,
                    ed.cantidad,
                    DATE_ADD(ed.fecha_entrega, INTERVAL 4 MONTH) as proxima_entrega,
                    CASE 
                        WHEN DATEDIFF(DATE_ADD(ed.fecha_entrega, INTERVAL 4 MONTH), CURDATE()) < 0 THEN 'vencida'
                        WHEN DATEDIFF(DATE_ADD(ed.fecha_entrega, INTERVAL 4 MONTH), CURDATE()) <= 30 THEN 'proxima'
                        ELSE 'vigente'
                    END as estado
                FROM entregadotacion ed
                INNER JOIN dotacion d ON ed.id_dotacion = d.id_dotacion
                LEFT JOIN talla t ON ed.id_talla = t.id_talla
                WHERE ed.id_empleado = ?
                ORDER BY ed.fecha_entrega DESC
                LIMIT 10
            `;
            
            const historial = await query(historialSql, [empleado.id_empleado]);
            
            res.json({
                success: true,
                data: {
                    empleado,
                    dotaciones_disponibles: dotaciones,
                    tallas_disponibles: tallas,
                    historial_entregas: historial
                },
                message: 'Empleado encontrado correctamente'
            });
            
        } catch (error) {
            console.error('Error al buscar empleado:', error);
            res.status(500).json({
                success: false,
                message: 'Error al buscar empleado',
                error: error.message
            });
        }
    }

    // Obtener KPIs para el dashboard
    static async getKpis(req, res) {
        try {
            const kpisSql = `
                SELECT 
                    (SELECT COUNT(*) FROM dotacion) as total_dotaciones,
                    (SELECT COUNT(*) FROM entregadotacion) as total_entregas,
                    (SELECT COUNT(*) FROM entregadotacion 
                     WHERE DATEDIFF(DATE_ADD(fecha_entrega, INTERVAL 4 MONTH), CURDATE()) <= 30
                     AND DATEDIFF(DATE_ADD(fecha_entrega, INTERVAL 4 MONTH), CURDATE()) >= 0) as proximas_entregas,
                    (SELECT SUM(cantidad) FROM stockdotacion WHERE cantidad > 0) as stock_total
            `;
            
            const [kpis] = await query(kpisSql);
            
            res.json({
                success: true,
                data: kpis,
                message: 'KPIs obtenidos correctamente'
            });
        } catch (error) {
            console.error('Error al obtener KPIs:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener KPIs',
                error: error.message
            });
        }
    }
}

module.exports = DotacionesController;