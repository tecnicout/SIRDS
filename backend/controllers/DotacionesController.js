const { query } = require('../config/database');
const DotacionModel = require('../models/DotacionModel');

class DotacionesController {
    // Obtener catálogo de ítems de dotación (para construcción de kits, formularios, etc.)
    // Mantener este endpoint SIMPLE: si se necesitan entregas usar /api/dotaciones/entregas
    static async getAll(req, res) {
        try {
            const { search = '', requiere_talla = '', id_categoria = '' } = req.query || {};

            // Obtener todas las dotaciones desde el modelo principal
            let dotaciones = await DotacionModel.getAll();

            // Filtros en memoria (dataset normalmente pequeño). Si crece, mover a SQL parametrizado.
            if (search) {
                const s = String(search).toLowerCase();
                dotaciones = dotaciones.filter(d =>
                    String(d.nombre_dotacion || '').toLowerCase().includes(s) ||
                    String(d.descripcion || '').toLowerCase().includes(s)
                );
            }
            if (requiere_talla !== '') {
                const val = ['1', 'true', 'si', 'sí', 'yes'].includes(String(requiere_talla).toLowerCase()) ? 1 : 0;
                dotaciones = dotaciones.filter(d => Number(d.talla_requerida) === val);
            }
            if (id_categoria) {
                dotaciones = dotaciones.filter(d => Number(d.id_categoria) === Number(id_categoria));
            }

            return res.json({
                success: true,
                data: dotaciones,
                total: dotaciones.length,
                message: 'Catálogo de dotaciones obtenido correctamente'
            });
        } catch (error) {
            console.error('Error al obtener catálogo de dotaciones:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener catálogo de dotaciones',
                error: error.message
            });
        }
    }

    // Guardar preferencias de tallas por empleado (sin registrar entrega)
    static async guardarTallasEmpleado(req, res) {
        try {
            const { id_empleado, documento, tallas_por_item } = req.body || {};
            if ((!id_empleado && !documento) || !Array.isArray(tallas_por_item)) {
                return res.status(400).json({ success: false, message: 'Campos requeridos: id_empleado o documento y tallas_por_item[]' });
            }

            // Resolver id_empleado por documento si no viene
            let empleadoId = id_empleado;
            if (!empleadoId && documento) {
                const empRows = await query('SELECT id_empleado FROM empleado WHERE Identificacion = ? LIMIT 1', [documento]);
                if (!empRows.length) {
                    return res.status(404).json({ success: false, message: 'Empleado no encontrado por documento' });
                }
                empleadoId = empRows[0].id_empleado;
            }

            // Validar kit asignado directamente al empleado
            const empleadoRows = await query('SELECT id_kit FROM empleado WHERE id_empleado = ? LIMIT 1', [empleadoId]);
            if (!empleadoRows.length || !empleadoRows[0].id_kit) {
                return res.status(400).json({ success: false, code: 'EMPLOYEE_WITHOUT_KIT', message: 'El empleado aún no tiene un kit asignado. No es posible guardar tallas.' });
            }

            let kitDotacionesIds = [];
            const comp = await query('SELECT id_dotacion FROM detallekitdotacion WHERE id_kit = ?', [empleadoRows[0].id_kit]);
            if (comp.length) {
                kitDotacionesIds = comp.map(r => r.id_dotacion);
            }

                        // Asegurar tabla de preferencias de tallas
                        await query(`
                                CREATE TABLE IF NOT EXISTS empleado_talla_dotacion (
                                    id INT AUTO_INCREMENT PRIMARY KEY,
                                    id_empleado INT NOT NULL,
                                    id_dotacion INT NOT NULL,
                                    id_talla INT NOT NULL,
                                    fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                    UNIQUE KEY uniq_empleado_dotacion (id_empleado, id_dotacion),
                                    CONSTRAINT fk_etd_empleado FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado),
                                    CONSTRAINT fk_etd_dotacion FOREIGN KEY (id_dotacion) REFERENCES dotacion(id_dotacion),
                                    CONSTRAINT fk_etd_talla FOREIGN KEY (id_talla) REFERENCES talla(id_talla)
                                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                        `);

                        const EmpleadoTallaModel = require('../models/EmpleadoTallaModel');
            const toPersist = [];
            for (const item of tallas_por_item) {
                if (!item || !item.id_dotacion || !item.id_talla) continue;
                if (kitDotacionesIds.length && !kitDotacionesIds.includes(Number(item.id_dotacion))) {
                    // Ignorar dotaciones fuera del kit del área
                    continue;
                }
                // Verificar que dotación requiere talla; si no, ignorar
                const [dotRow] = await query('SELECT talla_requerida FROM dotacion WHERE id_dotacion = ? LIMIT 1', [item.id_dotacion]);
                if (!dotRow || !dotRow.talla_requerida) continue;
                toPersist.push({ id_dotacion: Number(item.id_dotacion), id_talla: Number(item.id_talla) });
            }

            if (!toPersist.length) {
                return res.json({ success: true, data: { updated: 0 }, message: 'No hay tallas válidas para guardar' });
            }

            const result = await EmpleadoTallaModel.upsertPreferenciasBatch(empleadoId, toPersist);
            return res.json({ success: true, data: result, message: 'Tallas guardadas correctamente' });
        } catch (error) {
            console.error('Error al guardar tallas empleado:', error);
            return res.status(500).json({ success: false, message: 'Error al guardar tallas', error: error.message });
        }
    }

    // Obtener una dotación por ID (detallada)
    static async getByIdItem(req, res) {
        try {
            const { id } = req.params;
            if (!id) return res.status(400).json({ success: false, message: 'id es requerido' });
            const item = await DotacionModel.getById(Number(id));
            if (!item) return res.status(404).json({ success: false, message: 'Dotación no encontrada' });
            return res.json({ success: true, data: item, message: 'Dotación obtenida correctamente' });
        } catch (error) {
            console.error('Error al obtener dotación:', error);
            return res.status(500).json({ success: false, message: 'Error al obtener dotación', error: error.message });
        }
    }

    // Crear nueva dotación (item)
    static async createItem(req, res) {
        try {
            const {
                nombre_dotacion,
                descripcion = null,
                talla_requerida = 0,
                unidad_medida = null,
                id_categoria,
                id_proveedor,
                precio_unitario
            } = req.body || {};

            if (!nombre_dotacion || !id_categoria || !id_proveedor || precio_unitario === undefined) {
                return res.status(400).json({ success: false, message: 'Campos requeridos: nombre_dotacion, id_categoria, id_proveedor, precio_unitario' });
            }

            const insertId = await DotacionModel.create({
                nombre_dotacion,
                descripcion,
                talla_requerida: Number(talla_requerida) ? 1 : 0,
                unidad_medida,
                id_categoria: Number(id_categoria),
                id_proveedor: Number(id_proveedor),
                precio_unitario: Number(precio_unitario)
            });

            const created = await DotacionModel.getById(insertId);
            return res.status(201).json({ success: true, data: created, message: 'Dotación creada correctamente' });
        } catch (error) {
            console.error('Error al crear dotación:', error);
            return res.status(500).json({ success: false, message: 'Error al crear dotación', error: error.message });
        }
    }

    // Actualizar dotación (item)
    static async updateItem(req, res) {
        try {
            const { id } = req.params;
            const {
                nombre_dotacion,
                descripcion = null,
                talla_requerida = 0,
                unidad_medida = null,
                id_categoria,
                id_proveedor,
                precio_unitario
            } = req.body || {};

            if (!id || !nombre_dotacion || !id_categoria || !id_proveedor || precio_unitario === undefined) {
                return res.status(400).json({ success: false, message: 'Campos requeridos: id, nombre_dotacion, id_categoria, id_proveedor, precio_unitario' });
            }

            const ok = await DotacionModel.update(Number(id), {
                nombre_dotacion,
                descripcion,
                talla_requerida: Number(talla_requerida) ? 1 : 0,
                unidad_medida,
                id_categoria: Number(id_categoria),
                id_proveedor: Number(id_proveedor),
                precio_unitario: Number(precio_unitario)
            });

            if (!ok) return res.status(404).json({ success: false, message: 'Dotación no encontrada' });
            const updated = await DotacionModel.getById(Number(id));
            return res.json({ success: true, data: updated, message: 'Dotación actualizada correctamente' });
        } catch (error) {
            console.error('Error al actualizar dotación:', error);
            return res.status(500).json({ success: false, message: 'Error al actualizar dotación', error: error.message });
        }
    }

    // Eliminar dotación (item)
    static async deleteItem(req, res) {
        try {
            const { id } = req.params;
            if (!id) return res.status(400).json({ success: false, message: 'id es requerido' });
            const ok = await DotacionModel.delete(Number(id));
            if (!ok) return res.status(404).json({ success: false, message: 'Dotación no encontrada' });
            return res.json({ success: true, message: 'Dotación eliminada correctamente' });
        } catch (error) {
            console.error('Error al eliminar dotación:', error);
            return res.status(500).json({ success: false, message: 'Error al eliminar dotación', error: error.message });
        }
    }

    // Obtener todas las entregas con información detallada (modelo basado SOLO en entregadotacion)
    static async getEntregas(req, res) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                search = '', 
                area = '', 
                estado = '',
                kit = '' // '', 'con', 'sin'
            } = req.query || {};

            const pageNum = Math.max(parseInt(page, 10) || 1, 1);
            const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
            const offset = (pageNum - 1) * limitNum;

            const where = [];
            const params = [];
            if (search && String(search).trim() !== '') {
                const pattern = `%${String(search).trim()}%`;
                where.push('(e.nombre LIKE ? OR e.apellido LIKE ? OR e.Identificacion LIKE ?)');
                params.push(pattern, pattern, pattern);
            }
            if (area && String(area).trim() !== '') {
                where.push('e.id_area = ?');
                params.push(Number(area));
            }
            // No filtramos por fecha de entregadotacion: excluiría a "procesado" sin entrega.
            // Filtro por estado (modelo entregadotacion: todas las entregas son 'entregado')
            if (estado && String(estado).trim() !== '') {
                const est = String(estado).trim().toLowerCase();
                if (est !== 'entregado') {
                    // Si se pide un estado distinto a 'entregado', no hay coincidencias en este modelo
                    where.push('1 = 0');
                }
            }
            const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

            // Total de grupos (empleado + fecha)
            // Primero obtener el ciclo activo
            const cicloActivoSql = `
                SELECT id_ciclo, fecha_inicio_ventana, fecha_fin_ventana
                FROM ciclo_dotacion
                WHERE estado = 'activo'
                AND CURDATE() BETWEEN fecha_inicio_ventana AND fecha_fin_ventana
                ORDER BY fecha_entrega ASC LIMIT 1`;
            const [cicloActivo] = await query(cicloActivoSql);

            if (!cicloActivo) {
                return res.json({ success: true, data: [], entregas: [], total: 0, message: 'No hay ciclo activo' });
            }

            // Desde aquí, el estado de la fila se determina EXCLUSIVAMENTE por empleado_ciclo.estado
            // para que un nuevo ciclo siempre inicie "limpio" (procesado) y solo cambie
            // cuando se actualice explícitamente (p. ej. al registrar entrega del kit o vía API de ciclo).

            // Query principal SIN GROUP BY (cumple only_full_group_by)
            let selectSql = `
                SELECT 
                    ec.id_empleado_ciclo AS id_entrega,
                    e.id_empleado,
                    CONCAT(e.nombre, ' ', e.apellido) AS nombre_empleado,
                    e.Identificacion AS documento,
                    e.telefono AS telefono,
                    e.cargo AS cargo,
                    a.nombre_area AS nombre_area,
                    u.nombre AS nombre_ubicacion,
                    ec.id_kit AS id_kit,
                    COALESCE(k2.nombre, 'Sin kit asignado') AS nombre_kit,
                    COALESCE(ec.fecha_entrega_real, ec.fecha_asignacion) AS fecha_entrega,
                    ec.observaciones,
                    CASE 
                        WHEN ec.estado = 'entregado' THEN 'entregado'
                        WHEN ec.estado = 'en_proceso' THEN 'en proceso'
                        ELSE 'procesado'
                    END AS estado
                FROM empleado_ciclo ec
                INNER JOIN empleado e ON ec.id_empleado = e.id_empleado
                INNER JOIN area a ON e.id_area = a.id_area
                INNER JOIN ubicacion u ON e.id_ubicacion = u.id_ubicacion
                LEFT JOIN kitdotacion k2 ON k2.id_kit = ec.id_kit
                INNER JOIN ciclo_dotacion cd ON ec.id_ciclo = cd.id_ciclo
                WHERE ec.id_ciclo = ?
                  AND cd.estado = 'activo'
                  AND CURDATE() BETWEEN cd.fecha_inicio_ventana AND cd.fecha_fin_ventana`;

                                        const selectParams = [cicloActivo.id_ciclo];

            if (search && String(search).trim() !== '') {
                const pattern = `%${String(search).trim()}%`;
                selectSql += ' AND (e.nombre LIKE ? OR e.apellido LIKE ? OR e.Identificacion LIKE ? OR e.cargo LIKE ?)';
                selectParams.push(pattern, pattern, pattern, pattern);
            }
            if (area && String(area).trim() !== '') {
                selectSql += ' AND a.id_area = ?';
                selectParams.push(Number(area));
            }
            if (estado && String(estado).trim() !== '') {
                const est = String(estado).trim().toLowerCase();
                if (est === 'entregado') {
                    selectSql += ' AND ec.estado = "entregado"';
                } else if (est === 'procesado') {
                    selectSql += ' AND ec.estado = "procesado"';
                } else if (est === 'en proceso') {
                    selectSql += ' AND ec.estado = "en_proceso"';
                }
            }

            // Filtro por kit asignado
            if (kit !== undefined && kit !== null && String(kit).trim() !== '') {
                const kval = String(kit).trim().toLowerCase();
                if (['con','1','si','sí','true'].includes(kval)) {
                    selectSql += ' AND ec.id_kit IS NOT NULL';
                } else if (['sin','0','no','false'].includes(kval)) {
                    selectSql += ' AND ec.id_kit IS NULL';
                }
            }

            selectSql += ` ORDER BY a.nombre_area, e.apellido, e.nombre LIMIT ${limitNum} OFFSET ${offset}`;

            const rows = await query(selectSql, selectParams);

            // Total (repetir condiciones sin LIMIT/OFFSET)
            let countSql = 'SELECT COUNT(*) AS total FROM empleado_ciclo ec INNER JOIN empleado e ON ec.id_empleado = e.id_empleado INNER JOIN area a ON e.id_area = a.id_area INNER JOIN ciclo_dotacion cd ON ec.id_ciclo = cd.id_ciclo WHERE ec.id_ciclo = ? AND cd.estado = "activo" AND CURDATE() BETWEEN cd.fecha_inicio_ventana AND cd.fecha_fin_ventana';
            const countParams = [cicloActivo.id_ciclo];
            if (search && String(search).trim() !== '') {
                const pattern = `%${String(search).trim()}%`;
                countSql += ' AND (e.nombre LIKE ? OR e.apellido LIKE ? OR e.Identificacion LIKE ? OR e.cargo LIKE ?)';
                countParams.push(pattern, pattern, pattern, pattern);
            }
            if (area && String(area).trim() !== '') {
                countSql += ' AND a.id_area = ?';
                countParams.push(Number(area));
            }
            if (estado && String(estado).trim() !== '') {
                const est = String(estado).trim().toLowerCase();
                if (est === 'entregado') {
                    countSql += ' AND ec.estado = "entregado"';
                } else if (est === 'procesado') {
                    countSql += ' AND ec.estado = "procesado"';
                } else if (est === 'en proceso') {
                    countSql += ' AND ec.estado = "en_proceso"';
                }
            }
            if (kit !== undefined && kit !== null && String(kit).trim() !== '') {
                const kval = String(kit).trim().toLowerCase();
                if (['con','1','si','sí','true'].includes(kval)) {
                    countSql += ' AND ec.id_kit IS NOT NULL';
                } else if (['sin','0','no','false'].includes(kval)) {
                    countSql += ' AND ec.id_kit IS NULL';
                }
            }
            const [{ total }] = await query(countSql, countParams);

            return res.json({ success: true, data: rows, entregas: rows, total: Number(total)||0, message: 'Entregas obtenidas correctamente' });
        } catch (error) {
            console.error('Error al obtener entregas:', error);
            res.status(500).json({ success: false, message: 'Error al obtener entregas', error: error.message });
        }
    }

    // Actualizar una entrega existente (modelo entregadotacion):
    // Actualiza fecha/observaciones para todas las filas del mismo empleado y día del id base
    static async updateEntrega(req, res) {
        const connection = await getConnection();
        try {
            const { id } = req.params;
            const { fecha_entrega, observaciones, estado } = req.body || {};

            if (!id) {
                return res.status(400).json({ success: false, message: 'id es requerido' });
            }

            if (!fecha_entrega && !observaciones && !estado) {
                return res.status(400).json({ success: false, message: 'No hay datos para actualizar' });
            }

            // Validar que el estado sea válido
            if (estado && !['procesado', 'en proceso', 'entregado'].includes(estado)) {
                return res.status(400).json({ success: false, message: 'Estado no válido' });
            }

            await connection.beginTransaction();

            // Obtener la entrega actual
            const entrega = await query(
                'SELECT * FROM empleado_ciclo WHERE id_empleado_ciclo = ?',
                [Number(id)]
            );

            if (!entrega || entrega.length === 0) {
                await connection.rollback();
                return res.status(404).json({ success: false, message: 'Entrega no encontrada' });
            }

            // Construir actualización
            const updates = [];
            const values = [];
            
            if (fecha_entrega) {
                updates.push('fecha_entrega = ?');
                values.push(fecha_entrega);
            }
            
            if (observaciones !== undefined) {
                updates.push('observaciones = ?');
                values.push(observaciones);
            }
            
            if (estado) {
                updates.push('estado = ?');
                values.push(estado);
            }

            // Actualizar la entrega
            const sql = `
                UPDATE empleado_ciclo 
                SET ${updates.join(', ')}, 
                    fecha_actualizacion = NOW() 
                WHERE id_empleado_ciclo = ?
            `;
            values.push(Number(id));
            
            await connection.query(sql, values);

            // Registrar en historial
            await connection.query(
                `INSERT INTO historialmovimientos (
                    tabla_modificada, 
                    id_registro, 
                    tipo_movimiento, 
                    fecha_movimiento, 
                    usuario_responsable, 
                    detalle_cambio
                ) VALUES (?, ?, ?, NOW(), ?, ?)`,
                [
                    'empleado_ciclo',
                    Number(id),
                    'UPDATE',
                    'sistema',
                    `Actualización de entrega: ${estado ? `Estado=${estado}, ` : ''}${fecha_entrega ? `Fecha=${fecha_entrega}` : ''}`
                ]
            );

            await connection.commit();
            return res.json({ 
                success: true, 
                message: 'Entrega actualizada correctamente',
                data: {
                    id_entrega: id,
                    fecha_entrega,
                    estado,
                    observaciones
                }
            });
        } catch (error) {
            await connection.rollback();
            console.error('Error al actualizar entrega:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Error al actualizar entrega', 
                error: error.message 
            });
        } finally {
            connection.release();
        }
    }

    // Eliminar una entrega (grupo por empleado y fecha)
    static async deleteEntrega(req, res) {
        try {
            const { id } = req.params;
            if (!id) return res.status(400).json({ success: false, message: 'id es requerido' });

            const base = await query('SELECT id_empleado, DATE(fecha_entrega) AS f FROM entregadotacion WHERE id_entrega = ? LIMIT 1', [Number(id)]);
            if (!base || base.length === 0) return res.status(404).json({ success: false, message: 'Entrega no encontrada' });
            const { id_empleado, f } = base[0];
            await query('DELETE FROM entregadotacion WHERE id_empleado = ? AND DATE(fecha_entrega) = ?', [id_empleado, f]);
            await query(`INSERT INTO historialmovimientos (tabla_modificada, id_registro, tipo_movimiento, fecha_movimiento, usuario_responsable, detalle_cambio)
                         VALUES ('entregadotacion', ?, 'DELETE', NOW(), 'sistema', 'Entrega eliminada (grupo empleado/fecha)')`, [Number(id)]);
            return res.json({ success: true, message: 'Entrega eliminada correctamente' });
        } catch (error) {
            console.error('Error al eliminar entrega:', error);
            return res.status(500).json({ success: false, message: 'Error al eliminar entrega', error: error.message });
        }
    }

    // Obtener items de una entrega (modelo entregadotacion)
    static async getEntregaItems(req, res) {
        try {
            const { id } = req.params; // id_entrega base de un item del grupo
            if (!id) return res.status(400).json({ success: false, message: 'id es requerido' });
            // Tomar el registro base por id_entrega y traer todos los items de ese empleado en esa fecha
            const base = await query('SELECT id_empleado, DATE(fecha_entrega) AS f FROM entregadotacion WHERE id_entrega = ? LIMIT 1', [Number(id)]);
            if (base && base.length) {
                const { id_empleado, f } = base[0];
                const sql = `
                    SELECT ed.id_entrega, ed.id_dotacion, d.nombre_dotacion, ed.cantidad, ed.id_talla, t.talla, t.tipo_articulo
                    FROM entregadotacion ed
                    INNER JOIN dotacion d ON d.id_dotacion = d.id_dotacion
                    LEFT JOIN talla t ON t.id_talla = ed.id_talla
                    WHERE ed.id_empleado = ? AND DATE(ed.fecha_entrega) = ?
                    ORDER BY d.nombre_dotacion`;
                const items = await query(sql, [id_empleado, f]);
                return res.json({ success: true, data: items, message: 'Items de entrega obtenidos correctamente' });
            }

            // Fallback: si no hay entrega registrada, el id puede ser un id_empleado_ciclo (estado procesado)
            const cicloRow = await query(`
                SELECT ec.id_empleado_ciclo, ec.id_empleado, ec.id_kit, e.id_area
                FROM empleado_ciclo ec
                INNER JOIN empleado e ON ec.id_empleado = e.id_empleado
                WHERE ec.id_empleado_ciclo = ? LIMIT 1`, [Number(id)]);
            if (!cicloRow || cicloRow.length === 0) {
                return res.json({ success: true, data: [], message: 'Items no encontrados para esta referencia' });
            }
            const { id_area } = cicloRow[0];

            // Buscar kit activo por área
            const kitMeta = await query('SELECT id_kit, nombre FROM kitdotacion WHERE id_area = ? AND activo = 1 LIMIT 1', [id_area]);
            const kitId = kitMeta && kitMeta[0] ? kitMeta[0].id_kit : null;
            if (!kitId) {
                return res.json({ success: true, data: [], message: 'Sin kit activo para el área' });
            }

            // Composición del kit
            const compSql = `
                SELECT dkd.id_kit, dkd.id_dotacion, d.nombre_dotacion, dkd.cantidad AS cantidad_en_kit, d.talla_requerida
                FROM detallekitdotacion dkd
                INNER JOIN dotacion d ON dkd.id_dotacion = d.id_dotacion
                WHERE dkd.id_kit = ?
                ORDER BY d.nombre_dotacion`;
            const comp = await query(compSql, [kitId]);

            const itemsPrevistos = (comp || []).map(r => ({
                id_entrega: null,
                id_dotacion: r.id_dotacion,
                nombre_dotacion: r.nombre_dotacion,
                cantidad: r.cantidad_en_kit,
                cantidad_en_kit: r.cantidad_en_kit,
                talla: null,
                talla_requerida: r.talla_requerida
            }));
            return res.json({ success: true, data: itemsPrevistos, message: 'Ítems previstos del kit (sin entrega registrada)' });
        } catch (error) {
            console.error('Error al obtener items de entrega:', error);
            return res.status(500).json({ success: false, message: 'Error al obtener items de entrega', error: error.message });
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

    // Obtener tallas disponibles por dotación y empleado (filtradas por género y tipo de prenda)
    static async getTallasDisponibles(req, res) {
        try {
            const { id_dotacion, id_empleado } = req.params;

            // 1) Verificar si la dotación requiere talla y obtener su nombre
            const dotacionMetaSql = `
                SELECT nombre_dotacion, talla_requerida
                FROM dotacion
                WHERE id_dotacion = ?
                LIMIT 1
            `;
            const [dotacionMeta] = await query(dotacionMetaSql, [Number(id_dotacion)]);

            if (!dotacionMeta) {
                return res.status(404).json({ success: false, message: 'Dotación no encontrada' });
            }

            if (!Number(dotacionMeta.talla_requerida)) {
                return res.json({
                    success: true,
                    data: [],
                    message: 'Esta dotación no requiere talla específica'
                });
            }

            // 2) Obtener género del empleado
            const genSql = 'SELECT id_genero FROM empleado WHERE id_empleado = ? LIMIT 1';
            const [emp] = await query(genSql, [Number(id_empleado)]);
            if (!emp) {
                return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
            }

            // 3) Determinar el tipo de prenda según el nombre de la dotación
            const nombre = String(dotacionMeta.nombre_dotacion || '').toLowerCase();
            let tipo = null;
            // Reglas de mapeo por nombre
            if (/(camis|camisa|camisón)/i.test(nombre)) tipo = 'Camisa';
            else if (/overol/i.test(nombre)) tipo = 'Overol';
            else if (/pantal/i.test(nombre)) tipo = 'Pantalón';
            else if (/(bota|botas|zapato|zapatos)/i.test(nombre)) tipo = 'Zapato';
            else if (/guant/i.test(nombre)) tipo = 'Guante';
            else if (/chaleco/i.test(nombre)) tipo = 'Chaleco';

            // Si no se pudo inferir el tipo, devolver vacío para evitar mezclar tallajes erróneos
            if (!tipo) {
                return res.json({ success: true, data: [], message: 'No hay tallas definidas para esta prenda' });
            }

            // 4) Traer tallas por género y tipo exacto desde la tabla talla
            const tallasSql = `
                SELECT id_talla, talla, tipo_articulo
                FROM talla
                WHERE id_genero = ? AND tipo_articulo = ?
                ORDER BY 
                    CASE WHEN talla REGEXP '^[0-9]+$' THEN LPAD(talla, 3, '0') ELSE talla END
            `;
            const tallas = await query(tallasSql, [emp.id_genero, tipo]);

            return res.json({
                success: true,
                data: tallas,
                message: 'Tallas disponibles obtenidas correctamente'
            });
        } catch (error) {
            console.error('Error al obtener tallas disponibles:', error);
            return res.status(500).json({
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
            
            // Sincronizar con ciclo activo: marcar estado 'entregado' del empleado en el ciclo actual
            try {
                const cicloRows = await query(`SELECT id_ciclo FROM ciclo_dotacion WHERE estado = 'activo' ORDER BY id_ciclo DESC LIMIT 1`);
                if (Array.isArray(cicloRows) && cicloRows.length) {
                    const id_ciclo_activo = cicloRows[0].id_ciclo;
                    const ecRows = await query(`SELECT id_empleado_ciclo, id_kit FROM empleado_ciclo WHERE id_ciclo = ? AND id_empleado = ? LIMIT 1`, [id_ciclo_activo, id_empleado]);
                    if (Array.isArray(ecRows) && ecRows.length) {
                        const ec = ecRows[0];
                        await query(
                            `UPDATE empleado_ciclo SET estado = 'entregado', fecha_entrega_real = ?, fecha_actualizacion = NOW(), observaciones = COALESCE(?, observaciones) WHERE id_empleado_ciclo = ?`,
                            [fecha_entrega, observaciones || null, ec.id_empleado_ciclo]
                        );
                    }
                }
            } catch (syncErr) {
                console.error('[registrarEntrega] Error sincronizando con ciclo:', syncErr && syncErr.message);
            }

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
            
            // Obtener solo el kit correspondiente al área del empleado (incluye metadata del kit)
            const kitResult = await DotacionModel.getKitDotacionPorEmpleado(empleado.id_empleado);
            // kitResult -> { kit: {...} , dotaciones: [...] }
            const dotaciones = kitResult && kitResult.dotaciones ? kitResult.dotaciones : [];
            const kitInfo = kitResult && kitResult.kit ? kitResult.kit : null;

            if (!kitInfo) {
                return res.status(400).json({
                    success: false,
                    code: 'EMPLOYEE_WITHOUT_KIT',
                    message: 'El empleado aún no tiene un kit asignado. Solicita al administrador que registre el kit correspondiente.'
                });
            }
            
            // DEBUG: en desarrollo, loggear las dotaciones que vamos a devolver para este empleado
            if (process.env.NODE_ENV !== 'production') {
                try {
                    console.log('[DotacionesController] empleado:', empleado.id_empleado, 'area:', empleado.id_area, 'dotaciones_disponibles_count:', (dotaciones || []).length, 'ids:', (dotaciones || []).map(d => d.id_dotacion));
                } catch (dbg) {
                    console.error('[DotacionesController] debug log error:', dbg && dbg.message);
                }
            }

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
                    kit: kitInfo,
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
            // total_dotaciones y stock_total
            const metaSql = `
                SELECT 
                    (SELECT COUNT(*) FROM dotacion) AS total_dotaciones,
                    (SELECT SUM(cantidad) FROM stockdotacion WHERE cantidad > 0) AS stock_total
            `;
            const [meta] = await query(metaSql);

            // KPIs basados solo en entregadotacion agrupado por empleado+fecha
            const totalEntSql = `
                SELECT COUNT(*) AS total
                FROM (
                    SELECT ed.id_empleado, DATE(ed.fecha_entrega) AS f
                    FROM entregadotacion ed
                    GROUP BY ed.id_empleado, DATE(ed.fecha_entrega)
                ) t`;
            const [{ total: total_entregas = 0 }] = await query(totalEntSql);

            // Próximas entregas (redefinición): cantidad de empleados "procesado" en el ciclo ACTIVO
            // Se considera ciclo activo cuando su ventana está vigente y estado='activo'
            const proximasSql = `
                SELECT COUNT(*) AS total
                FROM empleado_ciclo ec
                INNER JOIN ciclo_dotacion cd ON ec.id_ciclo = cd.id_ciclo
                WHERE ec.estado = 'procesado'
                  AND cd.estado = 'activo'
                  AND CURDATE() BETWEEN cd.fecha_inicio_ventana AND cd.fecha_fin_ventana
            `;
            const [{ total: proximas_entregas = 0 }] = await query(proximasSql);

            const kpis = {
                total_dotaciones: Number(meta.total_dotaciones) || 0,
                total_entregas: Number(total_entregas) || 0,
                proximas_entregas: Number(proximas_entregas) || 0,
                stock_total: Number(meta.stock_total) || 0
            };

            return res.json({ success: true, data: kpis, message: 'KPIs obtenidos correctamente' });
        } catch (error) {
            console.error('Error al obtener KPIs:', error);
            return res.status(500).json({ success: false, message: 'Error al obtener KPIs', error: error.message });
        }
    }
}

module.exports = DotacionesController;