const { query } = require('../config/database');

class DotacionModel {
    // Obtener todas las dotaciones con información relacionada
    static async getAll() {
        const sql = `
            SELECT 
                d.*,
                c.nombre_categoria,
                p.nombre as proveedor_nombre
            FROM Dotacion d
            LEFT JOIN CategoriaDotacion c ON d.id_categoria = c.id_categoria
            LEFT JOIN Proveedor p ON d.id_proveedor = p.id_proveedor
            ORDER BY d.nombre_dotacion
        `;
        return await query(sql);
    }

    // Obtener dotación por ID
    static async getById(id) {
        const sql = `
            SELECT 
                d.*,
                c.nombre_categoria,
                p.nombre as proveedor_nombre,
                p.telefono as proveedor_telefono,
                p.email as proveedor_email
            FROM Dotacion d
            LEFT JOIN CategoriaDotacion c ON d.id_categoria = c.id_categoria
            LEFT JOIN Proveedor p ON d.id_proveedor = p.id_proveedor
            WHERE d.id_dotacion = ?
        `;
        const result = await query(sql, [id]);
        return result[0];
    }

    // Crear nueva dotación
    static async create(dotacionData) {
        const {
            nombre_dotacion, descripcion, talla_requerida = 0,
            unidad_medida, id_categoria, id_proveedor, precio_unitario
        } = dotacionData;
        
        const sql = `
            INSERT INTO Dotacion 
            (nombre_dotacion, descripcion, talla_requerida, unidad_medida, 
             id_categoria, id_proveedor, precio_unitario)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        const result = await query(sql, [
            nombre_dotacion, descripcion, talla_requerida,
            unidad_medida, id_categoria, id_proveedor, precio_unitario
        ]);
        
        return result.insertId;
    }

    // Actualizar dotación
    static async update(id, dotacionData) {
        const {
            nombre_dotacion, descripcion, talla_requerida,
            unidad_medida, id_categoria, id_proveedor, precio_unitario
        } = dotacionData;
        
        const sql = `
            UPDATE Dotacion 
            SET nombre_dotacion = ?, descripcion = ?, talla_requerida = ?,
                unidad_medida = ?, id_categoria = ?, id_proveedor = ?, precio_unitario = ?
            WHERE id_dotacion = ?
        `;
        
        const result = await query(sql, [
            nombre_dotacion, descripcion, talla_requerida,
            unidad_medida, id_categoria, id_proveedor, precio_unitario, id
        ]);
        
        return result.affectedRows > 0;
    }

    // Eliminar dotación
    static async delete(id) {
        const sql = 'DELETE FROM Dotacion WHERE id_dotacion = ?';
        const result = await query(sql, [id]);
        return result.affectedRows > 0;
    }

    // Obtener dotaciones por categoría
    static async getByCategoria(idCategoria) {
        const sql = `
            SELECT 
                d.*,
                p.nombre as proveedor_nombre
            FROM Dotacion d
            LEFT JOIN Proveedor p ON d.id_proveedor = p.id_proveedor
            WHERE d.id_categoria = ?
            ORDER BY d.nombre_dotacion
        `;
        return await query(sql, [idCategoria]);
    }

    // Obtener dotaciones que requieren talla
    static async getRequireTalla() {
        const sql = `
            SELECT 
                d.*,
                c.nombre_categoria,
                p.nombre as proveedor_nombre
            FROM Dotacion d
            LEFT JOIN CategoriaDotacion c ON d.id_categoria = c.id_categoria
            LEFT JOIN Proveedor p ON d.id_proveedor = p.id_proveedor
            WHERE d.talla_requerida = 1
            ORDER BY d.nombre_dotacion
        `;
        return await query(sql);
    }

    // Buscar dotaciones
    static async search(searchTerm) {
        const sql = `
            SELECT 
                d.*,
                c.nombre_categoria,
                p.nombre as proveedor_nombre
            FROM Dotacion d
            LEFT JOIN CategoriaDotacion c ON d.id_categoria = c.id_categoria
            LEFT JOIN Proveedor p ON d.id_proveedor = p.id_proveedor
            WHERE d.nombre_dotacion LIKE ? OR d.descripcion LIKE ?
            ORDER BY d.nombre_dotacion
        `;
        const searchPattern = `%${searchTerm}%`;
        return await query(sql, [searchPattern, searchPattern]);
    }
}

module.exports = DotacionModel;