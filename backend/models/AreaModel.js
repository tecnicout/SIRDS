const { query } = require('../config/database');

class AreaModel {
    // Obtener todas las áreas activas
    static async getAll() {
        const sql = `
            SELECT 
                a.id_area,
                a.nombre_area,
                a.estado
            FROM area a
            WHERE a.estado = 'activa'
            ORDER BY a.nombre_area ASC
        `;
        return await query(sql);
    }

    // Obtener área por ID (incluye inactivas para auditoría)
    static async getById(id) {
        const sql = `
            SELECT 
                a.id_area,
                a.nombre_area,
                a.estado
            FROM area a
            WHERE a.id_area = ?
        `;
        const result = await query(sql, [id]);
        return result[0];
    }

    // Crear nueva área (activa por defecto)
    static async create(areaData) {
        const { nombre_area } = areaData;
        const sql = 'INSERT INTO area (nombre_area, estado) VALUES (?, "activa")';
        const result = await query(sql, [nombre_area]);
        return result.insertId;
    }

    // Actualizar área
    static async update(id, areaData) {
        const { nombre_area } = areaData;
        const sql = 'UPDATE area SET nombre_area = ? WHERE id_area = ?';
        const result = await query(sql, [nombre_area, id]);
        return result.affectedRows > 0;
        return result.affectedRows > 0;
    }

    // Inactivar área (eliminación lógica)
    static async delete(id) {
        const sql = 'UPDATE area SET estado = "inactiva" WHERE id_area = ? AND estado = "activa"';
        const result = await query(sql, [id]);
        return result.affectedRows > 0;
    }

    // Método específico para inactivar área
    static async inactivarArea(id) {
        const sql = 'UPDATE area SET estado = "inactiva" WHERE id_area = ? AND estado = "activa"';
        const result = await query(sql, [id]);
        return result.affectedRows > 0;
    }

    // Verificar si existe un área con el mismo nombre (solo activas)
    static async existsByName(nombre_area, excludeId = null) {
        let sql = 'SELECT COUNT(*) as count FROM area WHERE nombre_area = ? AND estado = "activa"';
        let params = [nombre_area];
        
        if (excludeId) {
            sql += ' AND id_area != ?';
            params.push(excludeId);
        }
        
        const result = await query(sql, params);
        return result[0].count > 0;
    }

    // Obtener todas las áreas (activas e inactivas) para auditoría
    static async getAllWithInactive() {
        const sql = `
            SELECT 
                a.id_area,
                a.nombre_area,
                a.estado
            FROM area a
            ORDER BY a.estado DESC, a.nombre_area ASC
        `;
        return await query(sql);
    }

    // Reactivar área (cambiar estado de inactiva a activa)
    static async reactivarArea(id) {
        const sql = 'UPDATE area SET estado = "activa" WHERE id_area = ? AND estado = "inactiva"';
        const result = await query(sql, [id]);
        return result;
    }
}

module.exports = AreaModel;