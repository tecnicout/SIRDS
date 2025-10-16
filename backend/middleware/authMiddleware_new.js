const jwt = require('jsonwebtoken');
const UsuarioModel = require('../models/UsuarioModel');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'sirds_jwt_secret_key_2024';

/**
 * Middleware de autenticación para la nueva estructura Usuario-Empleado
 */
const authMiddleware = async (req, res, next) => {
    try {
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

        // Adjuntar información del usuario al request
        req.user = payload;
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
 * Middleware para verificar roles específicos
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

        if (!rolesPermitidos.includes(req.user.rol_sistema)) {
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
 * Middleware para permitir solo administradores
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

module.exports = {
    authMiddleware,
    requireRole,
    requirePermission,
    requireAdmin,
    requireAdminOrHR,
    requireAdminOrWarehouse
};