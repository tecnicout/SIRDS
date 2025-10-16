const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const UsuarioModel = require('../models/UsuarioModel');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'sirds_jwt_secret_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

class AuthController {
    
    /**
     * Login de usuario del sistema
     * Ahora autentica contra la tabla Usuario en lugar de Empleado
     */
    static async login(req, res) {
        const startTime = Date.now();
        
        try {
            const { email, password } = req.body;
            
            // Validación rápida de entrada
            if (!email || !password) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Email/Username y password son requeridos' 
                });
            }

            console.log(`[AUTH] Iniciando login para: ${email}`);
            const dbStartTime = Date.now();
            
            // Buscar usuario en la nueva tabla Usuario (puede ser email o username)
            const usuario = await UsuarioModel.findByCredential(email);
            console.log(`[AUTH] Consulta DB completada en: ${Date.now() - dbStartTime}ms`);
            
            if (!usuario) {
                console.log(`[AUTH] Usuario no encontrado: ${email}`);
                return res.status(401).json({ 
                    success: false, 
                    message: 'Credenciales inválidas' 
                });
            }

            // Verificar que el usuario esté activo
            if (!usuario.usuario_activo || !usuario.empleado_activo) {
                console.log(`[AUTH] Usuario inactivo: ${email}`);
                return res.status(401).json({ 
                    success: false, 
                    message: 'Usuario desactivado. Contacte al administrador.' 
                });
            }

            const bcryptStartTime = Date.now();
            // Verificar contraseña
            const match = await bcrypt.compare(password, usuario.password);
            console.log(`[AUTH] Verificación bcrypt completada en: ${Date.now() - bcryptStartTime}ms`);
            
            if (!match) {
                console.log(`[AUTH] Password incorrecta para: ${email}`);
                return res.status(401).json({ 
                    success: false, 
                    message: 'Credenciales inválidas' 
                });
            }

            // Actualizar último acceso
            await UsuarioModel.updateLastAccess(usuario.id_usuario);

            const jwtStartTime = Date.now();
            // Crear payload del JWT con datos del usuario y empleado
            const payload = {
                id_usuario: usuario.id_usuario,
                id_empleado: usuario.id_empleado,
                username: usuario.username,
                email_usuario: usuario.email_usuario,
                rol_sistema: usuario.rol_sistema,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                cargo: usuario.cargo,
                nombre_area: usuario.nombre_area,
                nombre_rol: usuario.nombre_rol,
                ubicacion_nombre: usuario.ubicacion_nombre
            };

            // Generar token JWT
            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
            console.log(`[AUTH] JWT generado en: ${Date.now() - jwtStartTime}ms`);
            
            console.log(`[AUTH] Login exitoso para ${usuario.username} (${Date.now() - startTime}ms total)`);

            res.json({
                success: true,
                message: 'Login exitoso',
                data: {
                    token,
                    usuario: {
                        id_usuario: usuario.id_usuario,
                        id_empleado: usuario.id_empleado,
                        username: usuario.username,
                        email: usuario.email_usuario,
                        rol_sistema: usuario.rol_sistema,
                        nombre_completo: `${usuario.nombre} ${usuario.apellido}`,
                        cargo: usuario.cargo,
                        area: usuario.nombre_area,
                        rol_laboral: usuario.nombre_rol,
                        ubicacion: usuario.ubicacion_nombre
                    }
                }
            });

        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
            });
        }
    }

    /**
     * Obtener información del usuario autenticado
     * Ahora usa la nueva estructura Usuario-Empleado
     */
    static async me(req, res) {
        try {
            // El middleware authMiddleware debe agregar user al request
            const idUsuario = req.user.id_usuario;
            
            if (!idUsuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Token inválido'
                });
            }

            // Obtener información completa del usuario
            const usuario = await UsuarioModel.getById(idUsuario);
            
            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            // Verificar que el usuario siga activo
            if (!usuario.usuario_activo || !usuario.empleado_activo) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario desactivado'
                });
            }

            res.json({
                success: true,
                data: {
                    id_usuario: usuario.id_usuario,
                    id_empleado: usuario.id_empleado,
                    username: usuario.username,
                    email: usuario.email_usuario,
                    rol_sistema: usuario.rol_sistema,
                    nombre_completo: `${usuario.nombre} ${usuario.apellido}`,
                    cargo: usuario.cargo,
                    area: usuario.nombre_area,
                    rol_laboral: usuario.nombre_rol,
                    ubicacion: usuario.ubicacion_nombre,
                    ultimo_acceso: usuario.ultimo_acceso,
                    telefono: usuario.telefono
                }
            });

        } catch (error) {
            console.error('Error en me:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener información del usuario',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
            });
        }
    }

    /**
     * Cambiar contraseña del usuario autenticado
     */
    static async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            const idUsuario = req.user.id_usuario;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Contraseña actual y nueva contraseña son requeridas'
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'La nueva contraseña debe tener al menos 6 caracteres'
                });
            }

            // Obtener usuario con password actual
            const usuario = await UsuarioModel.findByCredential(req.user.username);
            
            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            // Verificar contraseña actual
            const match = await bcrypt.compare(currentPassword, usuario.password);
            if (!match) {
                return res.status(401).json({
                    success: false,
                    message: 'Contraseña actual incorrecta'
                });
            }

            // Cambiar contraseña
            const changed = await UsuarioModel.changePassword(idUsuario, newPassword);
            
            if (!changed) {
                return res.status(500).json({
                    success: false,
                    message: 'Error al cambiar la contraseña'
                });
            }

            res.json({
                success: true,
                message: 'Contraseña cambiada exitosamente'
            });

        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            res.status(500).json({
                success: false,
                message: 'Error al cambiar la contraseña',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
            });
        }
    }

    /**
     * Logout (invalidar token - en memoria o blacklist si se implementa)
     * Por ahora solo envía respuesta exitosa ya que JWT es stateless
     */
    static async logout(req, res) {
        try {
            // En un sistema más avanzado, aquí se podría:
            // 1. Agregar el token a una blacklist
            // 2. Registrar el logout en auditoría
            // 3. Limpiar sesiones específicas

            res.json({
                success: true,
                message: 'Logout exitoso'
            });

        } catch (error) {
            console.error('Error en logout:', error);
            res.status(500).json({
                success: false,
                message: 'Error en logout',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
            });
        }
    }

    /**
     * Verificar permisos específicos del usuario
     */
    static async checkPermission(req, res) {
        try {
            const { accion } = req.query;
            const idUsuario = req.user.id_usuario;

            if (!accion) {
                return res.status(400).json({
                    success: false,
                    message: 'Acción requerida'
                });
            }

            const tienePermiso = await UsuarioModel.hasPermission(idUsuario, accion);

            res.json({
                success: true,
                data: {
                    tiene_permiso: tienePermiso,
                    accion: accion,
                    usuario: req.user.username
                }
            });

        } catch (error) {
            console.error('Error al verificar permisos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al verificar permisos',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
            });
        }
    }

    /**
     * Obtener estadísticas de autenticación (solo para administradores)
     */
    static async getAuthStats(req, res) {
        try {
            // Verificar que el usuario sea administrador
            if (req.user.rol_sistema !== 'administrador') {
                return res.status(403).json({
                    success: false,
                    message: 'Acceso denegado. Solo administradores.'
                });
            }

            const stats = await UsuarioModel.getStats();

            res.json({
                success: true,
                data: stats
            });

        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
            });
        }
    }
}

module.exports = AuthController;