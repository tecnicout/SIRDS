const { query } = require('../config/database');

class AreaModel {
    // Obtener todas las áreas activas con sus ubicaciones
    static async getAll() {
        const sql = `
            SELECT 
                a.id_area,
                a.nombre_area,
                a.id_ubicacion,
                a.estado,
                u.nombre as ubicacion_nombre
            FROM area a
            LEFT JOIN ubicacion u ON a.id_ubicacion = u.id_ubicacion
            WHERE a.estado = 'activa'
            ORDER BY a.nombre_area ASC
        `;
        return await query(sql);
    }

    // Obtener área por ID con su ubicación (incluye inactivas para auditoría)
    static async getById(id) {
        const sql = `
            SELECT 
                a.id_area,
                a.nombre_area,
                a.id_ubicacion,
                a.estado,
                u.nombre as ubicacion_nombre
            FROM area a
            LEFT JOIN ubicacion u ON a.id_ubicacion = u.id_ubicacion
            WHERE a.id_area = ?
        `;
        const result = await query(sql, [id]);
        return result[0];
    }

    // Crear nueva área (activa por defecto)
    static async create(areaData) {
        const { nombre_area, id_ubicacion } = areaData;
        const sql = 'INSERT INTO area (nombre_area, id_ubicacion, estado) VALUES (?, ?, "activa")';
        const result = await query(sql, [nombre_area, id_ubicacion]);
        return result.insertId;
    }

    // Actualizar área
    static async update(id, areaData) {
        const { nombre_area, id_ubicacion } = areaData;
        const sql = 'UPDATE area SET nombre_area = ?, id_ubicacion = ? WHERE id_area = ?';
        const result = await query(sql, [nombre_area, id_ubicacion, id]);
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

    // Verificar si existe una ubicación válida
    static async ubicacionExists(id_ubicacion) {
        const sql = 'SELECT COUNT(*) as count FROM ubicacion WHERE id_ubicacion = ?';
        const result = await query(sql, [id_ubicacion]);
        return result[0].count > 0;
    }

    // Verificar si existe un área con el mismo nombre en la misma ubicación (solo activas)
    static async existsByNameAndUbicacion(nombre_area, id_ubicacion, excludeId = null) {
        let sql = 'SELECT COUNT(*) as count FROM area WHERE nombre_area = ? AND id_ubicacion = ? AND estado = "activa"';
        let params = [nombre_area, id_ubicacion];
        
        if (excludeId) {
            sql += ' AND id_area != ?';
            params.push(excludeId);
        }
        
        const result = await query(sql, params);
        return result[0].count > 0;
    }

    // Obtener áreas activas por ubicación
    static async getByUbicacion(id_ubicacion) {
        const sql = `
            SELECT 
                a.id_area,
                a.nombre_area,
                a.id_ubicacion,
                a.estado,
                u.nombre as ubicacion_nombre
            FROM area a
            LEFT JOIN ubicacion u ON a.id_ubicacion = u.id_ubicacion
            WHERE a.id_ubicacion = ? AND a.estado = 'activa'
            ORDER BY a.nombre_area ASC
        `;
        return await query(sql, [id_ubicacion]);
    }

    // Obtener todas las áreas (activas e inactivas) para auditoría
    static async getAllWithInactive() {
        const sql = `
            SELECT 
                a.id_area,
                a.nombre_area,
                a.id_ubicacion,
                a.estado,
                u.nombre as ubicacion_nombre
            FROM area a
            LEFT JOIN ubicacion u ON a.id_ubicacion = u.id_ubicacion
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