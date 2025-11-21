const { query } = require('../config/database');

class UbicacionModel {
    // Obtener todas las ubicaciones
    static async getAll() {
        const sql = 'SELECT * FROM ubicacion ORDER BY nombre';
        return await query(sql);
    }

    static async getEmployeesByUbicacion(id) {
        const sql = `
            SELECT id_empleado, Identificacion, nombre, apellido, cargo, email
            FROM empleado
            WHERE id_ubicacion = ?
            ORDER BY nombre
        `;
        return await query(sql, [id]);
    }

    static async reassignEmployees(idOrigen, idDestino) {
        const sql = 'UPDATE empleado SET id_ubicacion = ? WHERE id_ubicacion = ?';
        const result = await query(sql, [idDestino, idOrigen]);
        return result.affectedRows;
    }

    // Obtener una ubicación por ID
    static async getById(id) {
        const sql = 'SELECT * FROM ubicacion WHERE id_ubicacion = ?';
        const result = await query(sql, [id]);
        return result[0];
    }

    // Crear nueva ubicación
    static async create(ubicacionData) {
        const { nombre, tipo, direccion } = ubicacionData;
        const sql = 'INSERT INTO ubicacion (nombre, tipo, direccion) VALUES (?, ?, ?)';
        const result = await query(sql, [nombre, tipo, direccion]);
        return result.insertId;
    }

    // Actualizar ubicación
    static async update(id, ubicacionData) {
        const { nombre, tipo, direccion } = ubicacionData;
        const sql = 'UPDATE ubicacion SET nombre = ?, tipo = ?, direccion = ? WHERE id_ubicacion = ?';
        const result = await query(sql, [nombre, tipo, direccion, id]);
        return result.affectedRows > 0;
    }

    // Eliminar ubicación
    static async delete(id) {
        const sql = 'DELETE FROM ubicacion WHERE id_ubicacion = ?';
        const result = await query(sql, [id]);
        return result.affectedRows > 0;
    }

    // Verificar áreas relacionadas con la ubicación (ya no aplicable en la nueva estructura)
    static async getRelatedAreas(id) {
        // En la nueva estructura, las áreas no dependen de ubicaciones
        return 0;
    }

    // Desvincular entidades relacionadas y eliminar ubicación
    static async deleteWithAreasHandling(id) {
        try {
            const relationTargets = [
                { table: 'empleado', column: 'id_ubicacion', key: 'empleados' },
                { table: 'stockdotacion', column: 'id_ubicacion', key: 'stock' },
                { table: 'area', column: 'id_ubicacion', key: 'areas' }
            ];

            const tableHasColumn = async (table, column) => {
                const sql = `
                    SELECT COUNT(*) AS count
                    FROM information_schema.columns
                    WHERE table_schema = DATABASE()
                      AND table_name = ?
                      AND column_name = ?
                `;
                const [result] = await query(sql, [table, column]);
                return result?.count > 0;
            };

            const targetsWithColumn = [];
            for (const target of relationTargets) {
                if (await tableHasColumn(target.table, target.column)) {
                    targetsWithColumn.push(target);
                }
            }

            let temporalLocationId = null;
            const reassignSummary = {};
            let totalReassigned = 0;

            if (targetsWithColumn.length > 0) {
                let ubicacionTemporal = await query(
                    "SELECT id_ubicacion FROM ubicacion WHERE nombre = 'UBICACIÓN TEMPORAL - REASIGNADA' LIMIT 1"
                );

                if (ubicacionTemporal.length === 0) {
                    const insertTempSql = `
                        INSERT INTO ubicacion (nombre, tipo, direccion) 
                        VALUES ('UBICACIÓN TEMPORAL - REASIGNADA', 'bodega', 'Áreas reasignadas temporalmente por eliminación de ubicación')
                    `;
                    const insertResult = await query(insertTempSql);
                    ubicacionTemporal = [{ id_ubicacion: insertResult.insertId }];
                }

                temporalLocationId = ubicacionTemporal[0].id_ubicacion;

                for (const target of targetsWithColumn) {
                    const updateSql = `UPDATE ${target.table} SET ${target.column} = ? WHERE ${target.column} = ?`;
                    const updateResult = await query(updateSql, [temporalLocationId, id]);
                    reassignSummary[target.key] = updateResult.affectedRows;
                    totalReassigned += updateResult.affectedRows;
                }
            }

            const deleteSql = 'DELETE FROM ubicacion WHERE id_ubicacion = ?';
            const deleteResult = await query(deleteSql, [id]);

            return {
                success: deleteResult.affectedRows > 0,
                areasReassigned: totalReassigned,
                temporalLocationId,
                reassignSummary,
                totalReassigned
            };
        } catch (error) {
            throw error;
        }
    }

    // Obtener ubicaciones por tipo
    static async getByTipo(tipo) {
        const sql = 'SELECT * FROM ubicacion WHERE tipo = ? ORDER BY nombre';
        return await query(sql, [tipo]);
    }

    // Verificar si existe una ubicación con el mismo nombre
    static async existsByName(nombre, excludeId = null) {
        let sql = 'SELECT COUNT(*) as count FROM ubicacion WHERE nombre = ?';
        let params = [nombre];
        
        if (excludeId) {
            sql += ' AND id_ubicacion != ?';
            params.push(excludeId);
        }
        
        const result = await query(sql, params);
        return result[0].count > 0;
    }
}

module.exports = UbicacionModel;