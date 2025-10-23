const { query } = require('../config/database');

class UbicacionModel {
    // Obtener todas las ubicaciones
    static async getAll() {
        const sql = 'SELECT * FROM ubicacion ORDER BY nombre';
        return await query(sql);
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

    // Desvincular áreas relacionadas y eliminar ubicación
    static async deleteWithAreasHandling(id) {
        try {
            // Buscar o crear ubicación temporal para reasignar áreas
            let ubicacionTemporal = await query(
                "SELECT id_ubicacion FROM ubicacion WHERE nombre = 'UBICACIÓN TEMPORAL - REASIGNADA' LIMIT 1"
            );
            
            if (ubicacionTemporal.length === 0) {
                // Crear ubicación temporal
                const insertTempSql = `
                    INSERT INTO ubicacion (nombre, tipo, direccion) 
                    VALUES ('UBICACIÓN TEMPORAL - REASIGNADA', 'bodega', 'Áreas reasignadas temporalmente por eliminación de ubicación')
                `;
                const insertResult = await query(insertTempSql);
                ubicacionTemporal = [{ id_ubicacion: insertResult.insertId }];
            }

            const idUbicacionTemporal = ubicacionTemporal[0].id_ubicacion;
            
            // Reasignar áreas a ubicación temporal
            const reassignSql = 'UPDATE area SET id_ubicacion = ? WHERE id_ubicacion = ?';
            const reassignResult = await query(reassignSql, [idUbicacionTemporal, id]);

            // Luego eliminar la ubicación original
            const deleteSql = 'DELETE FROM ubicacion WHERE id_ubicacion = ?';
            const deleteResult = await query(deleteSql, [id]);
            
            return {
                success: deleteResult.affectedRows > 0,
                areasReassigned: reassignResult.affectedRows,
                temporalLocationId: idUbicacionTemporal
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