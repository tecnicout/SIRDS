const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

class UsuarioModel {
    
    // ===========================================
    // MÉTODOS DE AUTENTICACIÓN
    // ===========================================
    
    /**
     * Buscar usuario por username o email para autenticación
     * @param {string} identifier - Username o email
     * @returns {Object|null} Usuario con datos del empleado o null
     */
    static async findByCredential(identifier) {
        const sql = `
            SELECT 
                u.id_usuario,
                u.username,
                u.email as email_usuario,
                u.password,
                u.id_rol,
                u.activo as usuario_activo,
                u.ultimo_acceso,
                e.id_empleado,
                e.nombre,
                e.apellido,
                e.email as email_empleado,
                e.telefono,
                e.cargo,
                e.estado as empleado_activo,
                a.nombre_area,
                r.nombre_rol,
                loc.nombre as ubicacion_nombre
            FROM Usuario u
            INNER JOIN Empleado e ON u.id_empleado = e.id_empleado
            LEFT JOIN Area a ON e.id_area = a.id_area
            LEFT JOIN Rol r ON u.id_rol = r.id_rol
            LEFT JOIN Ubicacion loc ON e.id_ubicacion = loc.id_ubicacion
            WHERE (u.username = ? OR u.email = ?) 
            AND u.activo = 1 
            AND e.estado = 1
        `;
        const result = await query(sql, [identifier, identifier]);
        return result[0] || null;
    }

    /**
     * Actualizar último acceso del usuario
     * @param {number} idUsuario 
     */
    static async updateLastAccess(idUsuario) {
        const sql = `UPDATE Usuario SET ultimo_acceso = NOW() WHERE id_usuario = ?`;
        return await query(sql, [idUsuario]);
    }

    /**
     * Verificar si un usuario tiene un permiso específico
     * @param {number} idUsuario 
     * @param {string} accion 
     * @returns {boolean}
     */
    static async hasPermission(idUsuario, accion) {
        // Implementación básica de permisos por rol del sistema
        const sql = `
            SELECT r.nombre_rol 
            FROM Usuario u 
            INNER JOIN Rol r ON u.id_rol = r.id_rol 
            WHERE u.id_usuario = ? AND u.activo = 1
        `;
        const result = await query(sql, [idUsuario]);
        
        if (!result[0]) return false;
        
        const rol = result[0].nombre_rol;
        
        // Definir permisos básicos por rol
        const permisos = {
            'administrador': ['crear_usuario', 'editar_usuario', 'desactivar_usuario', 'ver_usuarios', 'gestionar_empleados', 'ver_reportes'],
            'recursos_humanos': ['ver_usuarios', 'gestionar_empleados', 'ver_reportes'],
            'almacen': ['ver_inventario', 'gestionar_dotacion']
        };
        
        return permisos[rol]?.includes(accion) || false;
    }

    // ===========================================
    // MÉTODOS DE GESTIÓN DE USUARIOS
    // ===========================================

    /**
     * Obtener todos los usuarios con información completa
     * @returns {Array} Lista de usuarios
     */
    static async getAll() {
        const sql = `
            SELECT 
                u.id_usuario,
                u.username,
                u.email as email_usuario,
                u.id_rol,
                u.activo as usuario_activo,
                u.ultimo_acceso,
                u.fecha_creacion as fecha_creacion_usuario,
                u.actualizado_por,
                e.id_empleado,
                e.nombre,
                e.apellido,
                e.email as email_empleado,
                e.telefono,
                e.cargo,
                e.estado as empleado_activo,
                a.nombre_area,
                r.nombre_rol,
                loc.nombre as ubicacion_nombre,
                creador.username as creado_por_username,
                actualizador.username as actualizado_por_username
            FROM Usuario u
            INNER JOIN Empleado e ON u.id_empleado = e.id_empleado
            LEFT JOIN Area a ON e.id_area = a.id_area
            LEFT JOIN Rol r ON u.id_rol = r.id_rol
            LEFT JOIN Ubicacion loc ON e.id_ubicacion = loc.id_ubicacion
            LEFT JOIN Usuario creador ON u.creado_por = creador.id_usuario
            LEFT JOIN Usuario actualizador ON u.actualizado_por = actualizador.id_usuario
            ORDER BY u.fecha_creacion DESC
        `;
        return await query(sql);
    }

    /**
     * Obtener usuario por ID
     * @param {number} id 
     * @returns {Object|null}
     */
    static async getById(id) {
        const sql = `
            SELECT 
                u.id_usuario,
                u.username,
                u.email as email_usuario,
                u.id_rol,
                u.activo as usuario_activo,
                u.ultimo_acceso,
                u.fecha_creacion as fecha_creacion_usuario,
                u.actualizado_por,
                e.id_empleado,
                e.nombre,
                e.apellido,
                e.email as email_empleado,
                e.telefono,
                e.cargo,
                e.estado as empleado_activo,
                a.nombre_area,
                r.nombre_rol,
                loc.nombre as ubicacion_nombre,
                creador.username as creado_por_username,
                actualizador.username as actualizado_por_username
            FROM Usuario u
            INNER JOIN Empleado e ON u.id_empleado = e.id_empleado
            LEFT JOIN Area a ON e.id_area = a.id_area
            LEFT JOIN Rol r ON u.id_rol = r.id_rol
            LEFT JOIN Ubicacion loc ON e.id_ubicacion = loc.id_ubicacion
            LEFT JOIN Usuario creador ON u.creado_por = creador.id_usuario
            LEFT JOIN Usuario actualizador ON u.actualizado_por = actualizador.id_usuario
            WHERE u.id_usuario = ?
        `;
        const result = await query(sql, [id]);
        return result[0] || null;
    }

    /**
     * Crear nuevo usuario del sistema
     * @param {Object} userData - Datos del usuario
     * @param {number} creadoPor - ID del usuario que crea
     * @returns {Object} Resultado de la operación
     */
    static async create(userData, creadoPor) {
        const { id_empleado, username, email, password, id_rol } = userData;
        
        try {
            // Hash de la contraseña
            const hashedPassword = await bcrypt.hash(password, 12);
            
            // Verificar que no exista ya un usuario para este empleado
            const existingUser = await this.findByEmployee(id_empleado);
            if (existingUser) {
                throw new Error('Ya existe un usuario para este empleado');
            }

            // Verificar que username y email sean únicos
            const duplicateCheck = await query(`
                SELECT 
                    CASE 
                        WHEN username = ? THEN 'username'
                        WHEN email = ? THEN 'email'
                    END as duplicate_field
                FROM Usuario 
                WHERE username = ? OR email = ?
                LIMIT 1
            `, [username, email, username, email]);
            
            if (duplicateCheck.length > 0) {
                throw new Error(`El ${duplicateCheck[0].duplicate_field} ya está en uso`);
            }

            // Crear usuario directamente con SQL (reemplazando procedimiento almacenado)
            const insertSql = `
                INSERT INTO Usuario (
                    id_empleado, 
                    username, 
                    email, 
                    password, 
                    id_rol, 
                    activo, 
                    creado_por, 
                    fecha_creacion, 
                    fecha_actualizacion
                ) VALUES (?, ?, ?, ?, ?, 1, ?, NOW(), NOW())
            `;
            
            const result = await query(insertSql, [
                id_empleado, 
                username, 
                email, 
                hashedPassword, 
                id_rol, 
                creadoPor
            ]);
            
            console.log('[USUARIO CREATE] ✅ Usuario insertado con ID:', result.insertId);
            
            // Intentar obtener el usuario creado por username; si falla, usar getById con insertId
            let newUser = null;
            try {
                newUser = await this.findByCredential(username);
            } catch (err) {
                console.warn('[USUARIO CREATE] warn: findByCredential falló, intentando getById', err);
            }

            if (!newUser) {
                // Fallback directo por ID usando getById (asegura retornar el registro)
                try {
                    newUser = await this.getById(result.insertId);
                } catch (err) {
                    console.error('[USUARIO CREATE] Error obteniendo usuario por ID (fallback):', err);
                }
            }

            return newUser;
            
        } catch (error) {
            throw error;
        }
    }

    /**
     * Actualizar usuario
     * @param {number} id 
     * @param {Object} updateData 
     * @returns {Object}
     */
    static async update(id, updateData) {
        const allowedFields = ['username', 'email', 'id_rol', 'activo'];
        const fields = [];
        const values = [];

        // Filtrar solo campos permitidos
        for (const [key, value] of Object.entries(updateData)) {
            if (allowedFields.includes(key)) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) {
            throw new Error('No hay campos válidos para actualizar');
        }

        values.push(id);
        const sql = `UPDATE Usuario SET ${fields.join(', ')}, fecha_actualizacion = NOW() WHERE id_usuario = ?`;
        
        await query(sql, values);
        return await this.getById(id);
    }

    /**
     * Cambiar contraseña
     * @param {number} id 
     * @param {string} newPassword 
     * @returns {boolean}
     */
    static async changePassword(id, newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        const sql = `UPDATE Usuario SET password = ?, fecha_actualizacion = NOW() WHERE id_usuario = ?`;
        const result = await query(sql, [hashedPassword, id]);
        return result.affectedRows > 0;
    }

    /**
     * Desactivar usuario
     * @param {number} id 
     * @param {number} desactivadoPor 
     * @returns {boolean}
     */
    static async deactivate(id, desactivadoPor) {
        // Reemplazar procedimiento almacenado con SQL directo
        const sql = `
            UPDATE Usuario 
            SET activo = 0, 
                fecha_actualizacion = NOW(),
                actualizado_por = ?
            WHERE id_usuario = ?
        `;
        const result = await query(sql, [desactivadoPor, id]);
        try {
            console.log(`[UsuarioModel.deactivate] id=${id}, actualizado_por=${desactivadoPor}, affectedRows=${result.affectedRows}`);
        } catch (e) {
            console.log('[UsuarioModel.deactivate] resultado no contiene affectedRows:', result);
        }
        return result.affectedRows > 0;
    }

    /**
     * Activar usuario
     * @param {number} id 
     * @param {number} actualizadoPor 
     * @returns {boolean}
     */
    static async activate(id, actualizadoPor) {
        const sql = `
            UPDATE Usuario 
            SET activo = 1, 
                fecha_actualizacion = NOW(),
                actualizado_por = ?
            WHERE id_usuario = ?
        `;
        const result = await query(sql, [actualizadoPor, id]);
        try {
            console.log(`[UsuarioModel.activate] id=${id}, actualizado_por=${actualizadoPor}, affectedRows=${result.affectedRows}`);
        } catch (e) {
            console.log('[UsuarioModel.activate] resultado no contiene affectedRows:', result);
        }
        return result.affectedRows > 0;
    }

    // ===========================================
    // MÉTODOS DE CONSULTA ESPECÍFICOS
    // ===========================================

    /**
     * Buscar usuario por ID de empleado
     * @param {number} idEmpleado 
     * @returns {Object|null}
     */
    static async findByEmployee(idEmpleado) {
        const sql = `
            SELECT 
                u.id_usuario,
                u.username,
                u.email as email_usuario,
                u.id_rol,
                u.activo as usuario_activo,
                u.ultimo_acceso,
                u.fecha_creacion as fecha_creacion_usuario,
                e.id_empleado,
                e.nombre,
                e.apellido,
                e.email as email_empleado,
                e.telefono,
                e.cargo,
                e.estado as empleado_activo,
                a.nombre_area,
                r.nombre_rol,
                loc.nombre as ubicacion_nombre
            FROM Usuario u
            INNER JOIN Empleado e ON u.id_empleado = e.id_empleado
            LEFT JOIN Area a ON e.id_area = a.id_area
            LEFT JOIN Rol r ON u.id_rol = r.id_rol
            LEFT JOIN Ubicacion loc ON e.id_ubicacion = loc.id_ubicacion
            WHERE u.id_empleado = ?
        `;
        const result = await query(sql, [idEmpleado]);
        return result[0] || null;
    }

    /**
     * Obtener usuarios por rol del sistema
     * @param {string} rol 
     * @returns {Array}
     */
    static async getByRole(rol) {
        const sql = `
            SELECT 
                u.id_usuario,
                u.username,
                u.email as email_usuario,
                u.id_rol,
                u.activo as usuario_activo,
                u.ultimo_acceso,
                e.id_empleado,
                e.nombre,
                e.apellido,
                e.email as email_empleado,
                e.telefono,
                e.cargo,
                e.estado as empleado_activo,
                a.nombre_area,
                r.nombre_rol,
                loc.nombre as ubicacion_nombre
            FROM Usuario u
            INNER JOIN Empleado e ON u.id_empleado = e.id_empleado
            LEFT JOIN Area a ON e.id_area = a.id_area
            LEFT JOIN Rol r ON u.id_rol = r.id_rol
            LEFT JOIN Ubicacion loc ON e.id_ubicacion = loc.id_ubicacion
            WHERE r.nombre_rol = ? AND u.activo = 1
            ORDER BY e.apellido, e.nombre
        `;
        return await query(sql, [rol]);
    }

    /**
     * Buscar usuarios (para autocompletado)
     * @param {string} searchTerm 
     * @returns {Array}
     */
    static async search(searchTerm) {
        const sql = `
            SELECT 
                u.id_usuario,
                u.username,
                CONCAT(e.nombre, ' ', e.apellido) as nombre_completo,
                u.email as email_usuario,
                u.id_rol,
                u.activo as usuario_activo
            FROM Usuario u
            INNER JOIN Empleado e ON u.id_empleado = e.id_empleado
            WHERE u.activo = 1 
            AND (
                u.username LIKE ? OR 
                e.nombre LIKE ? OR 
                e.apellido LIKE ? OR 
                u.email LIKE ?
            )
            ORDER BY e.apellido, e.nombre
            LIMIT 10
        `;
        const term = `%${searchTerm}%`;
        return await query(sql, [term, term, term, term]);
    }

    /**
     * Obtener empleados sin usuario (candidatos para crear usuario)
     * @returns {Array}
     */
    static async getEmployeesWithoutUser() {
        const sql = `
            SELECT 
                e.id_empleado,
                e.nombre,
                e.apellido,
                e.email,
                e.cargo,
                a.nombre_area,
                r.nombre_rol
            FROM Empleado e
            LEFT JOIN Usuario u ON e.id_empleado = u.id_empleado
            LEFT JOIN Area a ON e.id_area = a.id_area
            LEFT JOIN Rol r ON e.id_rol = r.id_rol
            WHERE u.id_usuario IS NULL 
            AND e.estado = 1
            ORDER BY e.apellido, e.nombre
        `;
        return await query(sql);
    }

    /**
     * Estadísticas de usuarios
     * @returns {Object}
     */
    static async getStats() {
        const sql = `
            SELECT 
                COUNT(*) as total_usuarios,
                SUM(CASE WHEN u.activo = 1 THEN 1 ELSE 0 END) as usuarios_activos,
                SUM(CASE WHEN r.nombre_rol = 'administrador' THEN 1 ELSE 0 END) as administradores,
                SUM(CASE WHEN r.nombre_rol = 'recursos_humanos' THEN 1 ELSE 0 END) as recursos_humanos,
                SUM(CASE WHEN r.nombre_rol = 'almacen' THEN 1 ELSE 0 END) as almacen,
                SUM(CASE WHEN u.ultimo_acceso >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as activos_ultimo_mes
            FROM Usuario u
            LEFT JOIN Rol r ON u.id_rol = r.id_rol
        `;
        const result = await query(sql);
        return result[0];
    }

    // ===========================================
    // MÉTODOS DE VALIDACIÓN
    // ===========================================

    /**
     * Validar datos de usuario antes de crear/actualizar
     * @param {Object} userData 
     * @returns {Object} { valid: boolean, errors: [] }
     */
    static validateUserData(userData) {
        const errors = [];

        // Validar id_empleado (solo para creación)
        if (userData.id_empleado !== undefined) {
            if (!userData.id_empleado || !Number.isInteger(Number(userData.id_empleado))) {
                errors.push('ID de empleado no es válido');
            }
        }

        // Validar username
        if (!userData.username || userData.username.length < 3) {
            errors.push('Username debe tener al menos 3 caracteres');
        }
        if (userData.username && !/^[a-zA-Z0-9_\.\u00C0-\u017F]+$/.test(userData.username)) {
            errors.push('Username solo puede contener letras, números, puntos, guiones bajos y caracteres acentuados');
        }

        // Validar email
        if (!userData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
            errors.push('Email no es válido');
        }

        // Validar rol
        // Aceptar los IDs de rol que usa el sistema. Añadir 4 (administrador)
        // para mantener compatibilidad con controladores que usan id_rol === 4.
        const rolesValidos = [1, 2, 3, 4]; // IDs de roles válidos (incluye 4 = administrador)
        if (!userData.id_rol || !rolesValidos.includes(Number(userData.id_rol))) {
            errors.push('Rol del sistema no es válido');
        }

        // Validar password (solo para creación)
        if (userData.password !== undefined) {
            if (!userData.password || userData.password.length < 6) {
                errors.push('Password debe tener al menos 6 caracteres');
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    // ===========================================
    // MÉTODOS DE RESTABLECIMIENTO DE CONTRASEÑA
    // ===========================================

    /**
     * Guardar token de restablecimiento de contraseña
     * @param {number} idUsuario 
     * @param {string} hashedToken - Token ya hasheado
     * @param {Date} expiration - Fecha de expiración
     * @returns {boolean}
     */
    static async saveResetToken(idUsuario, hashedToken, expiration) {
        try {
            const sql = `
                UPDATE Usuario 
                SET reset_token = ?, 
                    reset_token_expiration = ?, 
                    fecha_actualizacion = NOW() 
                WHERE id_usuario = ?
            `;
            const result = await query(sql, [hashedToken, expiration, idUsuario]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error guardando reset token:', error);
            return false;
        }
    }

    /**
     * Buscar usuario por token de restablecimiento válido
     * @param {string} hashedToken - Token hasheado
     * @returns {Object|null}
     */
    static async findByResetToken(hashedToken) {
        try {
            const sql = `
                SELECT 
                    u.id_usuario,
                    u.username,
                    u.email as email_usuario,
                    u.reset_token,
                    u.reset_token_expiration,
                    u.activo as usuario_activo,
                    e.id_empleado,
                    e.nombre,
                    e.apellido,
                    e.estado as empleado_activo
                FROM Usuario u
                INNER JOIN Empleado e ON u.id_empleado = e.id_empleado
                WHERE u.reset_token = ? 
                AND u.reset_token_expiration > NOW() 
                AND u.activo = 1 
                AND e.estado = 1
            `;
            const result = await query(sql, [hashedToken]);
            return result[0] || null;
        } catch (error) {
            console.error('Error buscando por reset token:', error);
            return null;
        }
    }

    /**
     * Restablecer contraseña con token y limpiar token
     * @param {number} idUsuario 
     * @param {string} newPassword - Nueva contraseña sin hashear
     * @returns {boolean}
     */
    static async resetPasswordWithToken(idUsuario, newPassword) {
        try {
            // Hash de la nueva contraseña
            const hashedPassword = await bcrypt.hash(newPassword, 12);
            
            // Actualizar contraseña y limpiar token
            const sql = `
                UPDATE Usuario 
                SET password = ?, 
                    reset_token = NULL, 
                    reset_token_expiration = NULL, 
                    fecha_actualizacion = NOW() 
                WHERE id_usuario = ?
            `;
            const result = await query(sql, [hashedPassword, idUsuario]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error reseteando password con token:', error);
            return false;
        }
    }

    /**
     * Limpiar tokens de restablecimiento expirados
     * @returns {number} - Cantidad de tokens limpiados
     */
    static async cleanExpiredResetTokens() {
        try {
            const sql = `
                UPDATE Usuario 
                SET reset_token = NULL, 
                    reset_token_expiration = NULL, 
                    fecha_actualizacion = NOW() 
                WHERE reset_token_expiration < NOW()
            `;
            const result = await query(sql);
            return result.affectedRows;
        } catch (error) {
            console.error('Error limpiando tokens expirados:', error);
            return 0;
        }
    }

    // ===========================================
    // MÉTODOS DE AUDITORÍA
    // ===========================================

    /**
     * Registrar solicitud de restablecimiento de contraseña
     * @param {number} idUsuario 
     * @param {string} ip 
     */
    static async logPasswordResetRequest(idUsuario, ip) {
        try {
            // Verificar si existe la tabla HistorialMovimientos
            const checkTableSql = `
                SELECT COUNT(*) as exists_table 
                FROM information_schema.tables 
                WHERE table_schema = DATABASE() 
                AND table_name = 'HistorialMovimientos'
            `;
            const tableExists = await query(checkTableSql);
            
            if (tableExists[0].exists_table > 0) {
                const sql = `
                    INSERT INTO HistorialMovimientos (
                        tabla_afectada, 
                        operacion, 
                        id_registro_afectado, 
                        valores_anteriores, 
                        valores_nuevos, 
                        realizada_por, 
                        fecha_movimiento,
                        ip_address
                    ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)
                `;
                await query(sql, [
                    'Usuario',
                    'RESET_PASSWORD_REQUEST',
                    idUsuario,
                    JSON.stringify({ action: 'password_reset_requested' }),
                    JSON.stringify({ timestamp: new Date().toISOString(), ip }),
                    idUsuario,
                    ip
                ]);
            }
        } catch (error) {
            console.error('Error registrando solicitud de reset:', error);
            // No fallar la operación principal por error de auditoría
        }
    }

    /**
     * Registrar restablecimiento de contraseña exitoso
     * @param {number} idUsuario 
     * @param {string} ip 
     */
    static async logPasswordReset(idUsuario, ip) {
        try {
            // Verificar si existe la tabla HistorialMovimientos
            const checkTableSql = `
                SELECT COUNT(*) as exists_table 
                FROM information_schema.tables 
                WHERE table_schema = DATABASE() 
                AND table_name = 'HistorialMovimientos'
            `;
            const tableExists = await query(checkTableSql);
            
            if (tableExists[0].exists_table > 0) {
                const sql = `
                    INSERT INTO HistorialMovimientos (
                        tabla_afectada, 
                        operacion, 
                        id_registro_afectado, 
                        valores_anteriores, 
                        valores_nuevos, 
                        realizada_por, 
                        fecha_movimiento,
                        ip_address
                    ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)
                `;
                await query(sql, [
                    'Usuario',
                    'PASSWORD_RESET_COMPLETED',
                    idUsuario,
                    JSON.stringify({ action: 'password_reset_completed' }),
                    JSON.stringify({ 
                        timestamp: new Date().toISOString(), 
                        ip,
                        method: 'reset_token'
                    }),
                    idUsuario,
                    ip
                ]);
            }
        } catch (error) {
            console.error('Error registrando reset completado:', error);
            // No fallar la operación principal por error de auditoría
        }
    }
}

module.exports = UsuarioModel;