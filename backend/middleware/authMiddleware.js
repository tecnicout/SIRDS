const jwt = require('jsonwebtoken');
const UsuarioModel = require('../models/UsuarioModel');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'sirds_jwt_secret_key_2024';

/**
 * Middleware de autenticación para la nueva estructura Usuario-Empleado
 */
const authMiddleware = async (req, res, next) => {
    try {
        // Permitir preflight CORS sin exigir autenticación
        if (req.method === 'OPTIONS') {
            return res.sendStatus(204);
        }
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];
        if (!authHeader) {
            return res.status(401).json({ 
                success: false, 
                message: 'Token de autorización requerido' 
            });
        }

        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({ 
                success: false, 
                message: 'Formato de token inválido. Use: Bearer <token>' 
            });
        }

        const token = parts[1];
        
        // Verificar y decodificar token
        const payload = jwt.verify(token, JWT_SECRET);

        // Verificar que el token tenga la estructura esperada
        if (!payload.id_usuario || !payload.username) {
            return res.status(401).json({ 
                success: false, 
                message: 'Token inválido - estructura incorrecta' 
            });
        }

        // Normalizar información de rol en el payload.
        // El AuthController debería incluir `id_rol` y `nombre_rol`.
        // Si faltara alguno, intentamos rellenarlo desde la BD usando id_usuario.
        try {
            if (payload.id_usuario) {
                // Si hay campos faltantes o nulos, intentar completar desde la DB
                const usuarioFromDb = await UsuarioModel.getById(payload.id_usuario);
                if (usuarioFromDb) {
                    payload.id_rol = payload.id_rol ? Number(payload.id_rol) : (usuarioFromDb.id_rol ? Number(usuarioFromDb.id_rol) : null);
                    payload.nombre_rol = payload.nombre_rol || usuarioFromDb.nombre_rol || usuarioFromDb.rol_sistema || null;
                } else {
                    // Asegurar tipos aunque no tengamos DB
                    payload.id_rol = payload.id_rol ? Number(payload.id_rol) : null;
                    payload.nombre_rol = payload.nombre_rol || null;
                }
            } else {
                payload.id_rol = payload.id_rol ? Number(payload.id_rol) : null;
                payload.nombre_rol = payload.nombre_rol || null;
            }
        } catch (dbErr) {
            console.error('Error obteniendo rol desde DB en authMiddleware:', dbErr);
            // No fallar por esto; seguimos con lo que tengamos en el token pero normalizamos tipos
            payload.id_rol = payload.id_rol ? Number(payload.id_rol) : null;
            payload.nombre_rol = payload.nombre_rol || null;
        }

        // Opcional: Verificar en tiempo real que el usuario siga activo
        // Esto agrega una consulta a la DB pero mejora la seguridad
        if (process.env.VERIFY_USER_ON_REQUEST === 'true') {
            const usuario = await UsuarioModel.getById(payload.id_usuario);
            if (!usuario || !usuario.usuario_activo || !usuario.empleado_activo) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Usuario inactivo o no encontrado' 
                });
            }
        }

        // Normalizar nombre_rol a minúsculas (si existe) y adjuntar al request
    // Exponer usuario tanto en req.user (estandar) como req.usuario (compatibilidad con controladores existentes)
    req.user = payload;
    req.usuario = payload;
        if (req.user.nombre_rol) {
            try { req.user.nombre_rol = req.user.nombre_rol.toString().toLowerCase(); } catch (e) { /* ignore */ }
        }
        if (req.user.id_rol) {
            req.user.id_rol = Number(req.user.id_rol);
        }
        next();

    } catch (error) {
        console.error('Auth middleware error:', error.message);
        
        let message = 'Token inválido o expirado';
        if (error.name === 'TokenExpiredError') {
            message = 'Token expirado. Por favor, inicia sesión nuevamente.';
        } else if (error.name === 'JsonWebTokenError') {
            message = 'Token malformado';
        }

        return res.status(401).json({ 
            success: false, 
            message: message 
        });
    }
};

/**
 * Middleware para verificar roles específicos por ID
 * @param {Array} idsRolesPermitidos - Array de IDs de roles que pueden acceder
 * @returns {Function} Middleware function
 */
const requireRoleById = (idsRolesPermitidos) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }

        const userRoleId = Number(req.user.id_rol);
        const allowed = idsRolesPermitidos.map(r => Number(r));
        if (!allowed.includes(userRoleId)) {
            return res.status(403).json({
                success: false,
                message: `Acceso denegado. Roles requeridos: ${allowed.join(', ')}`
            });
        }

        next();
    };
};

/**
 * Middleware para verificar roles específicos (mantener compatibilidad)
 * @param {Array} rolesPermitidos - Array de roles que pueden acceder
 * @returns {Function} Middleware function
 */
const requireRole = (rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }

        // Normalizar both sides to lowercase strings for robust comparison
        const userRole = (req.user.nombre_rol || req.user.rol_sistema || '').toString().toLowerCase();
        const allowed = rolesPermitidos.map(r => r.toString().toLowerCase());

        if (!allowed.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: `Acceso denegado. Roles requeridos: ${rolesPermitidos.join(', ')}`
            });
        }

        next();
    };
};

/**
 * Middleware para verificar permisos específicos
 * @param {string} accion - Acción que se quiere verificar
 * @returns {Function} Middleware function
 */
const requirePermission = (accion) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const tienePermiso = await UsuarioModel.hasPermission(req.user.id_usuario, accion);
            
            if (!tienePermiso) {
                return res.status(403).json({
                    success: false,
                    message: `No tienes permisos para: ${accion}`
                });
            }

            next();
        } catch (error) {
            console.error('Error verificando permisos:', error);
            return res.status(500).json({
                success: false,
                message: 'Error verificando permisos'
            });
        }
    };
};

/**
 * Middleware para permitir solo administradores (usando ID de rol)
 */
const requireAdminById = requireRoleById([4]); // Solo id_rol = 4 (Administrador)

/**
 * Middleware para permitir solo administradores (compatibilidad)
 */
const requireAdmin = requireRole(['administrador']);

/**
 * Middleware para permitir administradores y RH
 */
const requireAdminOrHR = requireRole(['administrador', 'recursos_humanos']);

/**
 * Middleware para permitir administradores y almacén
 */
const requireAdminOrWarehouse = requireRole(['administrador', 'almacen']);

module.exports = authMiddleware; // Export por defecto para compatibilidad
module.exports.authMiddleware = authMiddleware;
module.exports.requireRole = requireRole;
module.exports.requireRoleById = requireRoleById;
module.exports.requirePermission = requirePermission;
module.exports.requireAdmin = requireAdmin;
module.exports.requireAdminById = requireAdminById;
module.exports.requireAdminOrHR = requireAdminOrHR;
module.exports.requireAdminOrWarehouse = requireAdminOrWarehouse;