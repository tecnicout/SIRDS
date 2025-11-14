const { query, getConnection } = require('../config/database');

class EntregaDotacionModel {
    /**
     * Obtener entregas del ciclo activo con paginación
     */
    static async getEntregasCicloActivo(page = 1, limit = 10, filters = {}) {
        try {
            const validPage = parseInt(page) || 1;
            const validLimit = parseInt(limit) || 10;
            const offset = (validPage - 1) * validLimit;

            // Primero obtener el ciclo activo
            const cicloActivo = await query(`
                SELECT id_ciclo 
                FROM ciclo_dotacion 
                WHERE estado = 'activo'
                OR id_ciclo = (SELECT MAX(id_ciclo) FROM ciclo_dotacion)
                ORDER BY id_ciclo DESC
                LIMIT 1
            `);

            if (!cicloActivo || cicloActivo.length === 0) {
                return {
                    entregas: [],
                    total: 0,
                    message: 'No hay ciclo activo en este momento'
                };
            }

            let sqlQuery = `
                SELECT 
                    ec.*,
                    e.nombre,
                    e.apellido,
                    e.identificacion,
                    e.cargo,
                    a.nombre_area,
                    COALESCE(k.nombre, 'Sin kit asignado') as nombre_kit,
                    u.username as actualizado_por_nombre,
                    cd.fecha_entrega as fecha_entrega_programada
                FROM empleado_ciclo ec
                INNER JOIN empleado e ON ec.id_empleado = e.id_empleado
                INNER JOIN area a ON e.id_area = a.id_area
                LEFT JOIN kitdotacion k ON ec.id_kit = k.id_kit
                INNER JOIN ciclo_dotacion cd ON ec.id_ciclo = cd.id_ciclo
                LEFT JOIN usuario u ON ec.actualizado_por = u.id_usuario
                WHERE ec.id_ciclo = ?
            `;

            const params = [cicloActivo[0].id_ciclo];

            // Aplicar filtros
            if (filters.estado) {
                sqlQuery += ' AND ec.estado = ?';
                params.push(filters.estado);
            }

            if (filters.area) {
                sqlQuery += ' AND a.id_area = ?';
                params.push(filters.area);
            }

            if (filters.search) {
                sqlQuery += ` AND (
                    e.nombre LIKE ? OR 
                    e.apellido LIKE ? OR 
                    e.identificacion LIKE ? OR
                    e.cargo LIKE ?
                )`;
                const searchTerm = `%${filters.search}%`;
                params.push(searchTerm, searchTerm, searchTerm, searchTerm);
            }

            // Ordenamiento y paginación
            sqlQuery += ` ORDER BY ec.fecha_actualizacion DESC LIMIT ${validLimit} OFFSET ${offset}`;

            const rows = await query(sqlQuery, params);

            // Contar total para paginación
            let countQuery = `
                SELECT COUNT(*) as total 
                FROM empleado_ciclo ec
                INNER JOIN empleado e ON ec.id_empleado = e.id_empleado
                INNER JOIN area a ON e.id_area = a.id_area
                WHERE ec.id_ciclo = ?
            `;
            const countParams = [cicloActivo[0].id_ciclo];

            if (filters.estado) {
                countQuery += ' AND ec.estado = ?';
                countParams.push(filters.estado);
            }

            if (filters.area) {
                countQuery += ' AND a.id_area = ?';
                countParams.push(filters.area);
            }

            if (filters.search) {
                countQuery += ` AND (
                    e.nombre LIKE ? OR 
                    e.apellido LIKE ? OR 
                    e.identificacion LIKE ? OR
                    e.cargo LIKE ?
                )`;
                const searchTerm = `%${filters.search}%`;
                countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
            }

            const countResult = await query(countQuery, countParams);

            return {
                entregas: rows,
                total: countResult[0].total,
                page: validPage,
                limit: validLimit,
                totalPages: Math.ceil(countResult[0].total / validLimit)
            };
        } catch (error) {
            throw new Error(`Error al obtener entregas: ${error.message}`);
        }
    }

    /**
     * Actualizar estado de una entrega
     */
    static async updateEstado(id_empleado_ciclo, estado, usuario_id, observaciones = null) {
        const connection = await getConnection();
        try {
            await connection.beginTransaction();

            await connection.query(
                `UPDATE empleado_ciclo 
                SET estado = ?,
                    observaciones = CASE 
                        WHEN ? IS NOT NULL THEN ?
                        ELSE observaciones
                    END,
                    fecha_entrega_real = CASE 
                        WHEN ? = 'entregado' THEN CURDATE()
                        ELSE fecha_entrega_real
                    END,
                    actualizado_por = ?,
                    fecha_actualizacion = NOW()
                WHERE id_empleado_ciclo = ?`,
                [estado, observaciones, observaciones, estado, usuario_id, id_empleado_ciclo]
            );

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw new Error(`Error al actualizar estado: ${error.message}`);
        } finally {
            connection.release();
        }
    }

    /**
     * Obtener estadísticas de entregas por ciclo
     */
    static async getEstadisticasCiclo(id_ciclo) {
        try {
            const stats = await query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN ec.estado = 'procesado' THEN 1 ELSE 0 END) as procesados,
                    SUM(CASE WHEN ec.estado = 'entregado' THEN 1 ELSE 0 END) as entregados,
                    SUM(CASE WHEN ec.estado = 'omitido' THEN 1 ELSE 0 END) as omitidos,
                    COUNT(DISTINCT a.id_area) as total_areas,
                    COUNT(DISTINCT e.id_empleado) as total_empleados
                FROM empleado_ciclo ec
                INNER JOIN empleado e ON ec.id_empleado = e.id_empleado
                INNER JOIN area a ON e.id_area = a.id_area
                WHERE ec.id_ciclo = ?
            `, [id_ciclo]);

            return stats[0];
        } catch (error) {
            throw new Error(`Error al obtener estadísticas: ${error.message}`);
        }
    }
}

module.exports = EntregaDotacionModel;