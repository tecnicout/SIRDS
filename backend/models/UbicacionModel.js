const { query } = require('../config/database');

class UbicacionModel {
    // Obtener todas las ubicaciones
    static async getAll() {
        const sql = 'SELECT * FROM Ubicacion ORDER BY nombre';
        return await query(sql);
    }

    // Obtener una ubicación por ID
    static async getById(id) {
        const sql = 'SELECT * FROM Ubicacion WHERE id_ubicacion = ?';
        const result = await query(sql, [id]);
        return result[0];
    }

    // Crear nueva ubicación
    static async create(ubicacionData) {
        const { nombre, tipo, direccion } = ubicacionData;
        const sql = 'INSERT INTO Ubicacion (nombre, tipo, direccion) VALUES (?, ?, ?)';
        const result = await query(sql, [nombre, tipo, direccion]);
        return result.insertId;
    }

    // Actualizar ubicación
    static async update(id, ubicacionData) {
        const { nombre, tipo, direccion } = ubicacionData;
        const sql = 'UPDATE Ubicacion SET nombre = ?, tipo = ?, direccion = ? WHERE id_ubicacion = ?';
        const result = await query(sql, [nombre, tipo, direccion, id]);
        return result.affectedRows > 0;
    }

    // Eliminar ubicación
    static async delete(id) {
        const sql = 'DELETE FROM Ubicacion WHERE id_ubicacion = ?';
        const result = await query(sql, [id]);
        return result.affectedRows > 0;
    }

    // Obtener ubicaciones por tipo
    static async getByTipo(tipo) {
        const sql = 'SELECT * FROM Ubicacion WHERE tipo = ? ORDER BY nombre';
        return await query(sql, [tipo]);
    }
}

module.exports = UbicacionModel;