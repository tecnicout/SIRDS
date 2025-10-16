const { query } = require('../config/database');

class EmpleadoModel {
    // Obtener todos los empleados con información relacionada
    static async getAll() {
        const sql = `
            SELECT 
                e.*,
                g.nombre as genero_nombre,
                a.nombre_area,
                r.nombre_rol,
                u.nombre as ubicacion_nombre
            FROM Empleado e
            LEFT JOIN Genero g ON e.id_genero = g.id_genero
            LEFT JOIN Area a ON e.id_area = a.id_area
            LEFT JOIN Rol r ON e.id_rol = r.id_rol
            LEFT JOIN Ubicacion u ON a.id_ubicacion = u.id_ubicacion
            ORDER BY e.apellido, e.nombre
        `;
        return await query(sql);
    }

    // Obtener empleado por ID
    static async getById(id) {
        const sql = `
            SELECT 
                e.*,
                g.nombre as genero_nombre,
                a.nombre_area,
                r.nombre_rol,
                u.nombre as ubicacion_nombre,
                u.id_ubicacion
            FROM Empleado e
            LEFT JOIN Genero g ON e.id_genero = g.id_genero
            LEFT JOIN Area a ON e.id_area = a.id_area
            LEFT JOIN Rol r ON e.id_rol = r.id_rol
            LEFT JOIN Ubicacion u ON a.id_ubicacion = u.id_ubicacion
            WHERE e.id_empleado = ?
        `;
        const result = await query(sql, [id]);
        return result[0];
    }

    // Crear nuevo empleado
    static async create(empleadoData) {
        const {
            nombre, apellido, email, telefono, cargo,
            id_genero, id_area, id_rol, estado = 1
        } = empleadoData;
        
        const sql = `
            INSERT INTO Empleado 
            (nombre, apellido, email, telefono, cargo, estado, id_genero, id_area, id_rol)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const result = await query(sql, [
            nombre, apellido, email, telefono, cargo,
            estado, id_genero, id_area, id_rol
        ]);
        
        return result.insertId;
    }

    // Actualizar empleado
    static async update(id, empleadoData) {
        const {
            nombre,
            apellido,
            email,
            telefono,
            cargo,
            id_genero,
            id_area,
            id_rol,
            estado
        } = empleadoData;

        // Convertir undefined a null para compatibilidad con MySQL2
        const safeData = {
            nombre: nombre ?? null,
            apellido: apellido ?? null,
            email: email ?? null,
            telefono: telefono ?? null,
            cargo: cargo ?? null,
            id_genero: id_genero ?? null,
            id_area: id_area ?? null,
            id_rol: id_rol ?? null,
            estado: estado ?? 1
        };
        
        const sql = `
            UPDATE Empleado 
            SET nombre = ?, apellido = ?, email = ?, telefono = ?, 
                cargo = ?, id_genero = ?, id_area = ?, id_rol = ?, estado = ?
            WHERE id_empleado = ?
        `;
        
        const result = await query(sql, [
            safeData.nombre,
            safeData.apellido,
            safeData.email,
            safeData.telefono,
            safeData.cargo,
            safeData.id_genero,
            safeData.id_area,
            safeData.id_rol,
            safeData.estado,
            id
        ]);
        
        return result.affectedRows > 0;
    }

    // Cambiar estado del empleado
    static async changeStatus(id, estado) {
        const sql = 'UPDATE Empleado SET estado = ? WHERE id_empleado = ?';
        const result = await query(sql, [estado, id]);
        return result.affectedRows > 0;
    }

    // Obtener empleados por área
    static async getByArea(idArea) {
        const sql = `
            SELECT 
                e.*,
                g.nombre as genero_nombre,
                r.nombre_rol
            FROM Empleado e
            LEFT JOIN Genero g ON e.id_genero = g.id_genero
            LEFT JOIN Rol r ON e.id_rol = r.id_rol
            WHERE e.id_area = ? AND e.estado = 1
            ORDER BY e.apellido, e.nombre
        `;
        return await query(sql, [idArea]);
    }

    // Buscar empleados
    static async search(searchTerm) {
        const sql = `
            SELECT 
                e.*,
                g.nombre as genero_nombre,
                a.nombre_area,
                r.nombre_rol
            FROM Empleado e
            LEFT JOIN Genero g ON e.id_genero = g.id_genero
            LEFT JOIN Area a ON e.id_area = a.id_area
            LEFT JOIN Rol r ON e.id_rol = r.id_rol
            WHERE (e.nombre LIKE ? OR e.apellido LIKE ? OR e.email LIKE ?)
                AND e.estado = 1
            ORDER BY e.apellido, e.nombre
        `;
        const searchPattern = `%${searchTerm}%`;
        return await query(sql, [searchPattern, searchPattern, searchPattern]);
    }

    // Buscar empleado por email (para autenticación)
    static async findByEmail(email) {
        const sql = `
            SELECT 
                e.*,
                g.nombre as genero_nombre,
                a.nombre_area,
                r.nombre_rol,
                u.nombre as ubicacion_nombre,
                u.id_ubicacion
            FROM Empleado e
            LEFT JOIN Genero g ON e.id_genero = g.id_genero
            LEFT JOIN Area a ON e.id_area = a.id_area
            LEFT JOIN Rol r ON e.id_rol = r.id_rol
            LEFT JOIN Ubicacion u ON a.id_ubicacion = u.id_ubicacion
            WHERE e.email = ? AND e.estado = 1
        `;
        const result = await query(sql, [email]);
        return result[0];
    }
}

module.exports = EmpleadoModel;