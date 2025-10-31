const { query } = require('../config/database');

class EmpleadoModel {
    // Obtener todos los empleados con información relacionada
    static async getAll() {
        const sql = `
            SELECT 
                e.*,
                g.nombre as genero_nombre,
                a.nombre_area,
                u.nombre as ubicacion_nombre
            FROM Empleado e
            LEFT JOIN Genero g ON e.id_genero = g.id_genero
            LEFT JOIN Area a ON e.id_area = a.id_area
            LEFT JOIN Ubicacion u ON e.id_ubicacion = u.id_ubicacion
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
                u.nombre as ubicacion_nombre,
                u.id_ubicacion
            FROM Empleado e
            LEFT JOIN Genero g ON e.id_genero = g.id_genero
            LEFT JOIN Area a ON e.id_area = a.id_area
            LEFT JOIN Ubicacion u ON e.id_ubicacion = u.id_ubicacion
            WHERE e.id_empleado = ?
        `;
        const result = await query(sql, [id]);
        return result[0];
    }

    // Crear nuevo empleado
    static async create(empleadoData) {
        const {
            Identificacion, tipo_identificacion, nombre, apellido, fecha_nacimiento,
            email, telefono, cargo, id_genero, id_area, id_ubicacion, fecha_inicio, sueldo, 
            fecha_fin, estado = 1
        } = empleadoData;
        
        const sql = `
            INSERT INTO Empleado 
            (Identificacion, tipo_identificacion, nombre, apellido, fecha_nacimiento,
             email, telefono, cargo, estado, id_genero, id_area, id_ubicacion, fecha_inicio, sueldo, fecha_fin)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
            Identificacion, tipo_identificacion, nombre, apellido, fecha_nacimiento,
            email, telefono, cargo, estado, id_genero, id_area, id_ubicacion, fecha_inicio, sueldo, fecha_fin
        ];
        
        const result = await query(sql, params);
        
        return result.insertId;
    }

    // Actualizar empleado
    static async update(id, empleadoData) {
        const {
            Identificacion, tipo_identificacion, nombre, apellido, fecha_nacimiento,
            email, telefono, cargo, id_genero, id_area, id_ubicacion, fecha_inicio, sueldo, 
            fecha_fin, estado
        } = empleadoData;

        // Convertir undefined a null para compatibilidad con MySQL2
        const safeData = {
            Identificacion: Identificacion ?? null,
            tipo_identificacion: tipo_identificacion ?? null,
            nombre: nombre ?? null,
            apellido: apellido ?? null,
            fecha_nacimiento: fecha_nacimiento ?? null,
            email: email ?? null,
            telefono: telefono ?? null,
            cargo: cargo ?? null,
            id_genero: id_genero ?? null,
            id_area: id_area ?? null,
            id_ubicacion: id_ubicacion ?? null,
            fecha_inicio: fecha_inicio ?? null,
            sueldo: sueldo ?? null,
            fecha_fin: fecha_fin ?? null,
            estado: estado ?? 1
        };
        
        const sql = `
            UPDATE Empleado 
            SET Identificacion = ?, tipo_identificacion = ?, nombre = ?, apellido = ?, 
                fecha_nacimiento = ?, email = ?, telefono = ?, cargo = ?, 
                id_genero = ?, id_area = ?, id_ubicacion = ?, fecha_inicio = ?, sueldo = ?, 
                fecha_fin = ?, estado = ?
            WHERE id_empleado = ?
        `;
        
        const result = await query(sql, [
            safeData.Identificacion,
            safeData.tipo_identificacion,
            safeData.nombre,
            safeData.apellido,
            safeData.fecha_nacimiento,
            safeData.email,
            safeData.telefono,
            safeData.cargo,
            safeData.id_genero,
            safeData.id_area,
            safeData.id_ubicacion,
            safeData.fecha_inicio,
            safeData.sueldo,
            safeData.fecha_fin,
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
                g.nombre as genero_nombre
            FROM Empleado e
            LEFT JOIN Genero g ON e.id_genero = g.id_genero
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
                a.nombre_area
            FROM Empleado e
            LEFT JOIN Genero g ON e.id_genero = g.id_genero
            LEFT JOIN Area a ON e.id_area = a.id_area
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
                u.nombre as ubicacion_nombre,
                u.id_ubicacion
            FROM Empleado e
            LEFT JOIN Genero g ON e.id_genero = g.id_genero
            LEFT JOIN Area a ON e.id_area = a.id_area
            LEFT JOIN Ubicacion u ON e.id_ubicacion = u.id_ubicacion
            WHERE e.email = ? AND e.estado = 1
        `;
        const result = await query(sql, [email]);
        return result[0];
    }

    // Obtener empleados sin usuario asignado (para módulo de usuarios)
    static async getEmpleadosSinUsuario() {
        try {
            const sql = `
                SELECT 
                    e.*,
                    g.nombre as genero_nombre,
                    a.nombre_area
                FROM Empleado e
                LEFT JOIN Genero g ON e.id_genero = g.id_genero
                LEFT JOIN Area a ON e.id_area = a.id_area
                LEFT JOIN Usuario u ON e.id_empleado = u.id_empleado
                WHERE u.id_empleado IS NULL AND e.estado = 1
                ORDER BY e.apellido, e.nombre
            `;

            const result = await query(sql);
            return result;
        } catch (error) {
            console.error('[EmpleadoModel.getEmpleadosSinUsuario] Error al consultar empleados sin usuario:', error);
            // Devolver arreglo vacío para evitar que controladores no manejen excepciones
            return [];
        }
    }

    // Verificar si la identificación ya existe
    static async existeIdentificacion(identificacion, excludeId = null) {
        let sql = 'SELECT id_empleado FROM Empleado WHERE Identificacion = ?';
        const params = [identificacion];
        
        if (excludeId) {
            sql += ' AND id_empleado != ?';
            params.push(excludeId);
        }
        
        const result = await query(sql, params);
        return result.length > 0;
    }

    // Verificar si el email ya existe
    static async existeEmail(email, excludeId = null) {
        let sql = 'SELECT id_empleado FROM Empleado WHERE email = ?';
        const params = [email];
        
        if (excludeId) {
            sql += ' AND id_empleado != ?';
            params.push(excludeId);
        }
        
        const result = await query(sql, params);
        return result.length > 0;
    }
}

module.exports = EmpleadoModel;