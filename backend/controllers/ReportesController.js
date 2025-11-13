const { query } = require('../config/database');

class ReportesController {
    static async ensureHistorialTable() {
        await query(`CREATE TABLE IF NOT EXISTS reportes_historial (
            id_reporte INT AUTO_INCREMENT PRIMARY KEY,
            modulo VARCHAR(50) NOT NULL,
            tipo VARCHAR(30) NOT NULL,
            filtros JSON NULL,
            formato VARCHAR(10) NOT NULL,
            filas INT NOT NULL DEFAULT 0,
            usuario VARCHAR(100) NULL,
            fecha_generacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
    }

    // KPIs generales del módulo de reportes (ajustado a ciclos, prendas, proveedores)
    static async getKpis(req, res) {
        try {
            const sqls = {
                dotaciones: 'SELECT COUNT(*) AS c FROM dotacion',
                entregas: `SELECT COUNT(*) AS c FROM (
                    SELECT ed.id_empleado, DATE(ed.fecha_entrega) AS f
                    FROM entregadotacion ed GROUP BY ed.id_empleado, DATE(ed.fecha_entrega)
                ) t`,
                ciclos: 'SELECT COUNT(*) AS c FROM ciclo_dotacion',
                prendas: 'SELECT COUNT(*) AS c FROM stockdotacion WHERE cantidad > 0',
                proveedores: 'SELECT COUNT(*) AS c FROM proveedor WHERE activo = 1',
                empleados: 'SELECT COUNT(*) AS c FROM empleado'
            };
            const [dotaciones] = await query(sqls.dotaciones);
            const [entregas] = await query(sqls.entregas);
            const [ciclos] = await query(sqls.ciclos);
            const [prendas] = await query(sqls.prendas);
            const [proveedores] = await query(sqls.proveedores);
            const [empleados] = await query(sqls.empleados);
            return res.json({
                success: true,
                data: {
                    total_dotaciones: dotaciones.c || 0,
                    total_entregas: entregas.c || 0,
                    total_ciclos: ciclos.c || 0,
                    total_prendas_stock: prendas.c || 0,
                    total_proveedores_activos: proveedores.c || 0,
                    total_empleados: empleados.c || 0
                },
                message: 'KPIs de reportes obtenidos'
            });
        } catch (error) {
            console.error('[ReportesController.getKpis] error:', error);
            return res.status(500).json({ success: false, message: 'Error al obtener KPIs', error: error.message });
        }
    }

    // Resumen por módulo (actualizado con ciclos, prendas, proveedores)
    static async getResumen(req, res) {
        try {
            const { modulo = 'dotaciones', fecha_inicio, fecha_fin } = req.query || {};
            let data = [];
            if (modulo === 'dotaciones') {
                data = await query(`SELECT c.nombre_categoria, COUNT(d.id_dotacion) AS total_items, SUM(IFNULL(s.cantidad,0)) AS stock_total
                                    FROM categoriadotacion c
                                    LEFT JOIN dotacion d ON d.id_categoria = c.id_categoria
                                    LEFT JOIN stockdotacion s ON s.id_dotacion = d.id_dotacion
                                    GROUP BY c.id_categoria, c.nombre_categoria
                                    ORDER BY c.nombre_categoria`);
            } else if (modulo === 'entregas') {
                const cond = []; const params = [];
                if (fecha_inicio && fecha_fin) { cond.push('ed.fecha_entrega BETWEEN ? AND ?'); params.push(fecha_inicio, fecha_fin); }
                const where = cond.length ? 'WHERE ' + cond.join(' AND ') : '';
                data = await query(`SELECT DATE_FORMAT(ed.fecha_entrega,'%Y-%m') AS mes, COUNT(*) AS total_registros, COUNT(DISTINCT ed.id_empleado) AS empleados_involucrados
                                    FROM entregadotacion ed ${where}
                                    GROUP BY DATE_FORMAT(ed.fecha_entrega,'%Y-%m') ORDER BY mes DESC LIMIT 12`, params);
            } else if (modulo === 'ciclos') {
                data = await query(`SELECT estado, COUNT(*) AS total_ciclos, SUM(IFNULL(valor_smlv_aplicado,0)) AS suma_smlv
                                    FROM ciclo_dotacion GROUP BY estado ORDER BY total_ciclos DESC`);
            } else if (modulo === 'prendas') {
                data = await query(`SELECT c.nombre_categoria, COUNT(d.id_dotacion) AS total_modelos,
                                    SUM(IFNULL(s.cantidad,0)) AS unidades_stock
                                    FROM categoriadotacion c
                                    LEFT JOIN dotacion d ON d.id_categoria = c.id_categoria
                                    LEFT JOIN stockdotacion s ON s.id_dotacion = d.id_dotacion
                                    GROUP BY c.id_categoria, c.nombre_categoria
                                    ORDER BY unidades_stock DESC`);
            } else if (modulo === 'stock') {
                // Resumen de stock por categoría (alias de prendas)
                data = await query(`SELECT c.nombre_categoria, COUNT(d.id_dotacion) AS total_modelos,
                                    SUM(IFNULL(s.cantidad,0)) AS unidades_stock
                                    FROM categoriadotacion c
                                    LEFT JOIN dotacion d ON d.id_categoria = c.id_categoria
                                    LEFT JOIN stockdotacion s ON s.id_dotacion = d.id_dotacion
                                    GROUP BY c.id_categoria, c.nombre_categoria
                                    ORDER BY unidades_stock DESC`);
            } else if (modulo === 'empleados') {
                data = await query(`SELECT a.nombre_area, COUNT(*) AS total_empleados
                                    FROM empleado e INNER JOIN area a ON e.id_area = a.id_area
                                    GROUP BY a.id_area, a.nombre_area
                                    ORDER BY total_empleados DESC`);
            } else if (modulo === 'proveedores') {
                data = await query(`SELECT CASE WHEN p.activo=1 THEN 'Activo' ELSE 'Inactivo' END AS estado, COUNT(*) AS total_proveedores
                                    FROM proveedor p GROUP BY estado ORDER BY total_proveedores DESC`);
            } else {
                return res.status(400).json({ success: false, message: 'Módulo no soportado' });
            }
            return res.json({ success: true, data, message: 'Resumen generado' });
        } catch (error) {
            console.error('[ReportesController.getResumen] error:', error);
            return res.status(500).json({ success: false, message: 'Error al generar resumen', error: error.message });
        }
    }

    // Detalle con filas (paginado básico) actualizado
    static async getDetalle(req, res) {
        try {
            const { modulo = 'dotaciones', page = 1, limit = 20, fecha_inicio, fecha_fin } = req.query || {};
            const pageNum = Math.max(parseInt(page, 10) || 1, 1);
            const limitNum = Math.max(parseInt(limit, 10) || 20, 1);
            const offset = (pageNum - 1) * limitNum;
            let rows = []; let total = 0;

            if (modulo === 'dotaciones') {
                rows = await query(`SELECT d.id_dotacion, d.nombre_dotacion, c.nombre_categoria, d.precio_unitario, d.talla_requerida
                                    FROM dotacion d INNER JOIN categoriadotacion c ON d.id_categoria = c.id_categoria
                                    ORDER BY d.nombre_dotacion LIMIT ? OFFSET ?`, [limitNum, offset]);
                const [{ c }] = await query('SELECT COUNT(*) AS c FROM dotacion'); total = c;
            } else if (modulo === 'entregas') {
                const cond = []; const params = [];
                if (fecha_inicio && fecha_fin) { cond.push('ed.fecha_entrega BETWEEN ? AND ?'); params.push(fecha_inicio, fecha_fin); }
                const where = cond.length ? 'WHERE ' + cond.join(' AND ') : '';
                rows = await query(`SELECT ed.id_entrega, ed.id_empleado, DATE(ed.fecha_entrega) AS fecha, ed.cantidad, d.nombre_dotacion
                                     FROM entregadotacion ed INNER JOIN dotacion d ON ed.id_dotacion = d.id_dotacion
                                     ${where} ORDER BY ed.fecha_entrega DESC LIMIT ? OFFSET ?`, [...params, limitNum, offset]);
                const [{ c }] = await query(`SELECT COUNT(*) AS c FROM entregadotacion ed ${where}`, params); total = c;
            } else if (modulo === 'ciclos') {
                rows = await query(`SELECT id_ciclo, fecha_entrega, estado, valor_smlv_aplicado, total_empleados_elegibles
                                    FROM ciclo_dotacion ORDER BY fecha_entrega DESC LIMIT ? OFFSET ?`, [limitNum, offset]);
                const [{ c }] = await query('SELECT COUNT(*) AS c FROM ciclo_dotacion'); total = c;
            } else if (modulo === 'prendas') {
                rows = await query(`SELECT d.id_dotacion, d.nombre_dotacion, c.nombre_categoria, IFNULL(s.cantidad,0) AS stock_actual, d.precio_unitario
                                    FROM dotacion d INNER JOIN categoriadotacion c ON d.id_categoria = c.id_categoria
                                    LEFT JOIN stockdotacion s ON s.id_dotacion = d.id_dotacion
                                    ORDER BY stock_actual DESC, d.nombre_dotacion LIMIT ? OFFSET ?`, [limitNum, offset]);
                const [{ c }] = await query('SELECT COUNT(*) AS c FROM dotacion'); total = c;
            } else if (modulo === 'stock') {
                rows = await query(`SELECT d.id_dotacion, d.nombre_dotacion, c.nombre_categoria, IFNULL(s.cantidad,0) AS stock_actual, d.precio_unitario
                                    FROM dotacion d INNER JOIN categoriadotacion c ON d.id_categoria = c.id_categoria
                                    LEFT JOIN stockdotacion s ON s.id_dotacion = d.id_dotacion
                                    ORDER BY stock_actual DESC, d.nombre_dotacion LIMIT ? OFFSET ?`, [limitNum, offset]);
                const [{ c }] = await query('SELECT COUNT(*) AS c FROM dotacion'); total = c;
            } else if (modulo === 'empleados') {
                rows = await query(`SELECT e.id_empleado, CONCAT(e.nombre,' ',e.apellido) AS empleado, a.nombre_area
                                    FROM empleado e INNER JOIN area a ON e.id_area = a.id_area
                                    ORDER BY a.nombre_area, empleado LIMIT ? OFFSET ?`, [limitNum, offset]);
                const [{ c }] = await query('SELECT COUNT(*) AS c FROM empleado'); total = c;
            } else if (modulo === 'proveedores') {
                rows = await query(`SELECT p.id_proveedor, p.nombre, p.email, p.telefono, p.activo, COUNT(d.id_dotacion) AS modelos_asociados
                                    FROM proveedor p LEFT JOIN dotacion d ON d.id_proveedor = p.id_proveedor
                                    GROUP BY p.id_proveedor, p.nombre, p.email, p.telefono, p.activo
                                    ORDER BY modelos_asociados DESC, p.nombre LIMIT ? OFFSET ?`, [limitNum, offset]);
                const [{ c }] = await query('SELECT COUNT(*) AS c FROM proveedor'); total = c;
            } else {
                return res.status(400).json({ success: false, message: 'Módulo no soportado' });
            }
            return res.json({ success: true, data: rows, total, page: pageNum, limit: limitNum, message: 'Detalle generado' });
        } catch (error) {
            console.error('[ReportesController.getDetalle] error:', error);
            return res.status(500).json({ success: false, message: 'Error al obtener detalle', error: error.message });
        }
    }

    // Exportación CSV simple (actualizada con nuevos módulos)
    static async exportar(req, res) {
        try {
            await ReportesController.ensureHistorialTable();
            const { modulo = 'dotaciones', formato = 'csv', fecha_inicio, fecha_fin } = req.query || {};
            if (formato !== 'csv') return res.status(400).json({ success: false, message: 'Formato no soportado, use csv' });
            let rows = [];
            if (modulo === 'dotaciones') {
                rows = await query(`SELECT d.id_dotacion, d.nombre_dotacion, c.nombre_categoria, d.precio_unitario FROM dotacion d INNER JOIN categoriadotacion c ON d.id_categoria = c.id_categoria ORDER BY d.nombre_dotacion`);
            } else if (modulo === 'entregas') {
                const cond = []; const params = [];
                if (fecha_inicio && fecha_fin) { cond.push('ed.fecha_entrega BETWEEN ? AND ?'); params.push(fecha_inicio, fecha_fin); }
                const where = cond.length ? 'WHERE ' + cond.join(' AND ') : '';
                rows = await query(`SELECT ed.id_entrega, ed.id_empleado, DATE(ed.fecha_entrega) AS fecha, ed.cantidad, d.nombre_dotacion FROM entregadotacion ed INNER JOIN dotacion d ON ed.id_dotacion = d.id_dotacion ${where} ORDER BY ed.fecha_entrega DESC`, params);
            } else if (modulo === 'ciclos') {
                rows = await query(`SELECT id_ciclo, fecha_entrega, estado, valor_smlv_aplicado, total_empleados_elegibles FROM ciclo_dotacion ORDER BY fecha_entrega DESC`);
            } else if (modulo === 'prendas') {
                rows = await query(`SELECT d.id_dotacion, d.nombre_dotacion, c.nombre_categoria, IFNULL(s.cantidad,0) AS stock_actual, d.precio_unitario
                                    FROM dotacion d INNER JOIN categoriadotacion c ON d.id_categoria = c.id_categoria
                                    LEFT JOIN stockdotacion s ON s.id_dotacion = d.id_dotacion
                                    ORDER BY stock_actual DESC, d.nombre_dotacion`);
            } else if (modulo === 'stock') {
                rows = await query(`SELECT d.id_dotacion, d.nombre_dotacion, c.nombre_categoria, IFNULL(s.cantidad,0) AS stock_actual, d.precio_unitario
                                    FROM dotacion d INNER JOIN categoriadotacion c ON d.id_categoria = c.id_categoria
                                    LEFT JOIN stockdotacion s ON s.id_dotacion = d.id_dotacion
                                    ORDER BY stock_actual DESC, d.nombre_dotacion`);
            } else if (modulo === 'empleados') {
                rows = await query(`SELECT e.id_empleado, CONCAT(e.nombre,' ',e.apellido) AS empleado, a.nombre_area
                                    FROM empleado e INNER JOIN area a ON e.id_area = a.id_area
                                    ORDER BY a.nombre_area, empleado`);
            } else if (modulo === 'proveedores') {
                rows = await query(`SELECT p.id_proveedor, p.nombre, p.email, p.telefono, p.activo, COUNT(d.id_dotacion) AS modelos_asociados
                                    FROM proveedor p LEFT JOIN dotacion d ON d.id_proveedor = p.id_proveedor
                                    GROUP BY p.id_proveedor, p.nombre, p.email, p.telefono, p.activo
                                    ORDER BY modelos_asociados DESC, p.nombre`);
            } else {
                return res.status(400).json({ success: false, message: 'Módulo no soportado' });
            }
            if (!rows.length) {
                return res.status(200).json({ success: true, data: [], message: 'Sin datos para exportar' });
            }
            const headers = Object.keys(rows[0]);
            const csv = [headers.join(','), ...rows.map(r => headers.map(h => {
                const val = r[h];
                if (val === null || val === undefined) return '';
                const s = String(val).replace(/"/g,'""');
                return /[",\n]/.test(s) ? `"${s}"` : s;
            }).join(','))].join('\n');
            try {
                await query(`INSERT INTO reportes_historial (modulo, tipo, filtros, formato, filas, usuario) VALUES (?, 'export', ?, ?, ?, ?)`, [modulo, JSON.stringify({ fecha_inicio, fecha_fin }), formato, rows.length, (req.user && req.user.email) || 'sistema']);
            } catch (histErr) { console.error('[ReportesController.exportar] error historial:', histErr.message); }
            res.setHeader('Content-Type','text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=${modulo}_export.csv`);
            return res.status(200).send(csv);
        } catch (error) {
            console.error('[ReportesController.exportar] error:', error);
            return res.status(500).json({ success: false, message: 'Error al exportar', error: error.message });
        }
    }

    static async historial(req, res) {
        try {
            await ReportesController.ensureHistorialTable();
            const rows = await query('SELECT * FROM reportes_historial ORDER BY fecha_generacion DESC LIMIT 50');
            return res.json({ success: true, data: rows, message: 'Historial de reportes' });
        } catch (error) {
            console.error('[ReportesController.historial] error:', error);
            return res.status(500).json({ success: false, message: 'Error al obtener historial', error: error.message });
        }
    }
}

module.exports = ReportesController;
