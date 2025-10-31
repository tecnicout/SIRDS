const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const validator = require('validator');
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
                id_rol: usuario.id_rol ? Number(usuario.id_rol) : null,
                // Normalizar nombre_rol a minúsculas para mantener consistencia
                nombre_rol: usuario.nombre_rol ? usuario.nombre_rol.toString().toLowerCase() : null,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                cargo: usuario.cargo,
                nombre_area: usuario.nombre_area,
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
                        id_rol: usuario.id_rol,
                        nombre_rol: usuario.nombre_rol,
                        nombre_completo: `${usuario.nombre} ${usuario.apellido}`,
                        cargo: usuario.cargo,
                        area: usuario.nombre_area,
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
     * Validar token de sesión activa
     * Endpoint para verificar si el token sigue siendo válido
     */
    static async validateToken(req, res) {
        try {
            // Si llegamos aquí, el token ya fue validado por el middleware authMiddleware
            const usuario = req.user;
            
            if (!usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Token inválido'
                });
            }

            // Verificar que el usuario siga activo en la base de datos
            const usuarioActual = await UsuarioModel.findByCredential(usuario.username || usuario.email);
            
            if (!usuarioActual || !usuarioActual.usuario_activo || !usuarioActual.empleado_activo) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario inactivo'
                });
            }

            res.json({
                success: true,
                message: 'Token válido',
                data: {
                    id_usuario: usuario.id_usuario,
                    username: usuario.username,
                    id_rol: usuario.id_rol ? Number(usuario.id_rol) : null,
                    nombre_rol: usuario.nombre_rol ? usuario.nombre_rol.toString().toLowerCase() : null,
                    expires_at: usuario.exp ? new Date(usuario.exp * 1000) : null
                }
            });

        } catch (error) {
            console.error('Error validating token:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
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
                    id_rol: usuario.id_rol,
                    nombre_rol: usuario.nombre_rol,
                    nombre_completo: `${usuario.nombre} ${usuario.apellido}`,
                    cargo: usuario.cargo,
                    area: usuario.nombre_area,
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
            if (req.user.nombre_rol !== 'administrador') {
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

    /**
     * Configurar transportador de email para Nodemailer
     */
    static getEmailTransporter() {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false, // true para 465, false para otros puertos
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }

    /**
     * Solicitar restablecimiento de contraseña
     * POST /auth/forgot-password
     */
    static async forgotPassword(req, res) {
        try {
            const { email } = req.body;

            // Validar email
            if (!email || !validator.isEmail(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Email válido es requerido'
                });
            }

            console.log(`[FORGOT PASSWORD] Solicitud para: ${email}`);

            // Buscar usuario por email
            const usuario = await UsuarioModel.findByCredential(email);
            
            if (!usuario) {
                // Por seguridad, siempre devolver éxito aunque el usuario no exista
                return res.json({
                    success: true,
                    message: 'Si el email existe en nuestro sistema, recibirás un enlace de restablecimiento'
                });
            }

            // Verificar que el usuario esté activo
            if (!usuario.usuario_activo || !usuario.empleado_activo) {
                return res.json({
                    success: true,
                    message: 'Si el email existe en nuestro sistema, recibirás un enlace de restablecimiento'
                });
            }

            // Generar token seguro
            const resetToken = crypto.randomBytes(32).toString('hex');
            const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
            
            // Establecer expiración a 1 hora
            const expirationTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

            // Guardar token hasheado y expiración en la base de datos
            const success = await UsuarioModel.saveResetToken(usuario.id_usuario, hashedToken, expirationTime);
            
            if (!success) {
                throw new Error('Error al guardar token de restablecimiento');
            }

            // Configurar enlace de restablecimiento
            const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
            const resetURL = `${frontendURL}/reset-password/${resetToken}`;

            // Configurar email
            const transporter = AuthController.getEmailTransporter();
            
            const mailOptions = {
                from: `"SIRDS - Sistema de Dotación" <${process.env.SMTP_USER}>`,
                to: usuario.email_usuario,
                subject: 'Restablecimiento de Contraseña - SIRDS',
                html: `
                    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; color: #333;">
                        <div style="background: linear-gradient(135deg, #B39237 0%, #D4AF37 50%, #E2BE69 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                            <h1 style="color: white; margin: 0; font-size: 28px;">SIRDS</h1>
                            <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Sistema Integrado para el Registro de Dotación Sonora</p>
                        </div>
                        
                        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
                            <h2 style="color: #B39237; margin-top: 0;">Restablecimiento de Contraseña</h2>
                            
                            <p>Hola <strong>${usuario.nombre} ${usuario.apellido}</strong>,</p>
                            
                            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en SIRDS.</p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${resetURL}" style="
                                    background: linear-gradient(135deg, #B39237 0%, #D4AF37 50%);
                                    color: white;
                                    padding: 15px 30px;
                                    text-decoration: none;
                                    border-radius: 8px;
                                    font-weight: bold;
                                    display: inline-block;
                                    box-shadow: 0 4px 6px rgba(179, 146, 55, 0.3);
                                ">Restablecer Contraseña</a>
                            </div>
                            
                            <p style="color: #666; font-size: 14px;">
                                <strong>Importante:</strong> Este enlace expirará en <strong>1 hora</strong> por seguridad.
                            </p>
                            
                            <p style="color: #666; font-size: 14px;">
                                Si no solicitaste este restablecimiento, puedes ignorar este correo de forma segura. 
                                Tu contraseña no será modificada.
                            </p>
                            
                            <p style="color: #666; font-size: 14px;">
                                Si tienes problemas con el botón, copia y pega este enlace en tu navegador:<br>
                                <span style="word-break: break-all; color: #B39237;">${resetURL}</span>
                            </p>
                            
                            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                            
                            <p style="color: #999; font-size: 12px; text-align: center;">
                                SIRDS - Molino Sonora<br>
                                Este es un correo automático, no responder.
                            </p>
                        </div>
                    </div>
                `
            };

            // Enviar email
            await transporter.sendMail(mailOptions);

            console.log(`[FORGOT PASSWORD] ✅ Email enviado a: ${email}`);

            // Registrar en auditoría
            await UsuarioModel.logPasswordResetRequest(usuario.id_usuario, req.ip);

            res.json({
                success: true,
                message: 'Si el email existe en nuestro sistema, recibirás un enlace de restablecimiento'
            });

        } catch (error) {
            console.error('Error en forgot password:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
            });
        }
    }

    /**
     * Restablecer contraseña con token
     * POST /auth/reset-password/:token
     */
    static async resetPassword(req, res) {
        try {
            const { token } = req.params;
            const { newPassword, confirmPassword } = req.body;

            // Validaciones básicas
            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'Token de restablecimiento requerido'
                });
            }

            if (!newPassword || !confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Nueva contraseña y confirmación son requeridas'
                });
            }

            if (newPassword !== confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Las contraseñas no coinciden'
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'La contraseña debe tener al menos 6 caracteres'
                });
            }

            console.log(`[RESET PASSWORD] Intentando resetear con token: ${token.substring(0, 10)}...`);

            // Hash del token recibido para comparar
            const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

            // Buscar usuario con el token válido y no expirado
            const usuario = await UsuarioModel.findByResetToken(hashedToken);

            if (!usuario) {
                return res.status(400).json({
                    success: false,
                    message: 'Token inválido o expirado'
                });
            }

            // Verificar que el usuario esté activo
            if (!usuario.usuario_activo || !usuario.empleado_activo) {
                return res.status(400).json({
                    success: false,
                    message: 'Usuario inactivo'
                });
            }

            // Actualizar contraseña y eliminar token
            const success = await UsuarioModel.resetPasswordWithToken(usuario.id_usuario, newPassword);

            if (!success) {
                throw new Error('Error al actualizar la contraseña');
            }

            console.log(`[RESET PASSWORD] ✅ Contraseña actualizada para usuario: ${usuario.username}`);

            // Registrar en auditoría
            await UsuarioModel.logPasswordReset(usuario.id_usuario, req.ip);

            // Enviar email de confirmación
            try {
                const transporter = AuthController.getEmailTransporter();
                
                const mailOptions = {
                    from: `"SIRDS - Sistema de Dotación" <${process.env.SMTP_USER}>`,
                    to: usuario.email_usuario,
                    subject: 'Contraseña Restablecida - SIRDS',
                    html: `
                        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; color: #333;">
                            <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 50%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                                <h1 style="color: white; margin: 0; font-size: 28px;">SIRDS</h1>
                                <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Contraseña Restablecida Exitosamente</p>
                            </div>
                            
                            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
                                <h2 style="color: #28a745; margin-top: 0;">¡Contraseña Actualizada!</h2>
                                
                                <p>Hola <strong>${usuario.nombre} ${usuario.apellido}</strong>,</p>
                                
                                <p>Tu contraseña ha sido restablecida exitosamente en SIRDS.</p>
                                
                                <div style="background: #e8f5e8; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 0 4px 4px 0;">
                                    <p style="margin: 0; color: #155724;">
                                        <strong>✅ Confirmación:</strong> Ya puedes iniciar sesión con tu nueva contraseña.
                                    </p>
                                </div>
                                
                                <div style="text-align: center; margin: 30px 0;">
                                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="
                                        background: linear-gradient(135deg, #B39237 0%, #D4AF37 50%);
                                        color: white;
                                        padding: 15px 30px;
                                        text-decoration: none;
                                        border-radius: 8px;
                                        font-weight: bold;
                                        display: inline-block;
                                        box-shadow: 0 4px 6px rgba(179, 146, 55, 0.3);
                                    ">Ir a Iniciar Sesión</a>
                                </div>
                                
                                <p style="color: #666; font-size: 14px;">
                                    <strong>Información de Seguridad:</strong><br>
                                    • Fecha: ${new Date().toLocaleString('es-MX')}<br>
                                    • IP: ${req.ip}<br>
                                    • Si no fuiste tú, contacta inmediatamente al administrador.
                                </p>
                                
                                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                                
                                <p style="color: #999; font-size: 12px; text-align: center;">
                                    SIRDS - Molino Sonora<br>
                                    Este es un correo automático, no responder.
                                </p>
                            </div>
                        </div>
                    `
                };

                await transporter.sendMail(mailOptions);
                console.log(`[RESET PASSWORD] ✅ Email de confirmación enviado a: ${usuario.email_usuario}`);
            } catch (emailError) {
                console.error('Error enviando email de confirmación:', emailError);
                // No fallar la operación por error de email
            }

            res.json({
                success: true,
                message: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión.',
                data: {
                    username: usuario.username,
                    email: usuario.email_usuario
                }
            });

        } catch (error) {
            console.error('Error en reset password:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
            });
        }
    }

    /**
     * Validar token de restablecimiento (sin resetear)
     * GET /auth/reset-password/:token/validate
     */
    static async validateResetToken(req, res) {
        try {
            const { token } = req.params;

            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'Token requerido'
                });
            }

            // Hash del token para comparar
            const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

            // Buscar usuario con el token válido
            const usuario = await UsuarioModel.findByResetToken(hashedToken);

            if (!usuario) {
                return res.status(400).json({
                    success: false,
                    message: 'Token inválido o expirado'
                });
            }

            res.json({
                success: true,
                message: 'Token válido',
                data: {
                    username: usuario.username,
                    email: usuario.email_usuario,
                    expiresAt: usuario.reset_token_expiration
                }
            });

        } catch (error) {
            console.error('Error validando token:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
            });
        }
    }
}

module.exports = AuthController;