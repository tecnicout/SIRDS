const { query } = require('../config/database');

class DotacionModel {
    /**
     * Obtener el kit de dotación correspondiente al área del empleado
     * Devuelve un array con los artículos del kit (no prendas sueltas)
     * @param {number} id_empleado
     * @returns {Promise<Array>} Kit de dotación para el área del empleado
     */
    static async getKitDotacionPorEmpleado(id_empleado) {
        // 1. Obtener el área del empleado
        const areaSql = 'SELECT id_area FROM Empleado WHERE id_empleado = ?';
        const [empleado] = await query(areaSql, [id_empleado]);
        if (!empleado || !empleado.id_area) {
            return [];
        }
        // 2. Buscar el kit asignado a esa área.
        // Para mantener consistencia con /api/kits/area/:id_area preferimos
        // buscar primero en la tabla `kitdotacion` por `id_area` (kit directo)
        // y como fallback comprobar `arearolkit`.
        let kitId = null;
        const kitDirectSql = 'SELECT id_kit FROM kitdotacion WHERE id_area = ? AND activo = 1 LIMIT 1';
        const [kitDirect] = await query(kitDirectSql, [empleado.id_area]);
        if (kitDirect && kitDirect.id_kit) {
            kitId = kitDirect.id_kit;
        } else {
            const kitAreaSql = 'SELECT id_kit FROM arearolkit WHERE id_area = ? LIMIT 1';
            const [kitArea] = await query(kitAreaSql, [empleado.id_area]);
            if (kitArea && kitArea.id_kit) {
                kitId = kitArea.id_kit;
            } else {
                return [];
            }
        }
        // Dev-only debug
        if (process.env.NODE_ENV !== 'production') {
            try { console.log('[DotacionModel] getKitDotacionPorEmpleado -> empleado area', empleado.id_area, 'selected kitId:', kitId); } catch(e){}
        }
        // 3. Obtener metadata del kit
        const kitMetaSql = `
            SELECT id_kit, nombre as nombre_kit, id_area, activo
            FROM kitdotacion
            WHERE id_kit = ?
            LIMIT 1
        `;
        const [kitMeta] = await query(kitMetaSql, [kitId]);

        // 4. Obtener los artículos del kit (tabla detallekitdotacion)
        const prendasSql = `
            SELECT dkd.id_kit, dkd.id_dotacion, d.nombre_dotacion, d.descripcion, d.talla_requerida, d.unidad_medida, d.id_categoria, d.id_proveedor, d.precio_unitario, dkd.cantidad AS cantidad_en_kit
            FROM detallekitdotacion dkd
            INNER JOIN dotacion d ON dkd.id_dotacion = d.id_dotacion
            WHERE dkd.id_kit = ?
            ORDER BY d.nombre_dotacion
        `;
        const prendas = await query(prendasSql, [kitId]);

        // Devolver un objeto con metadata del kit y la lista de dotaciones
        return {
            kit: kitMeta || null,
            dotaciones: prendas || []
        };
    }
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