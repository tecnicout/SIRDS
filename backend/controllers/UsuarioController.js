const UsuarioModel = require('../models/UsuarioModel');
const EmpleadoModel = require('../models/EmpleadoModel');

class UsuarioController {

    /**
     * Obtener todos los usuarios del sistema
     * Solo administradores y RH pueden ver la lista completa
     */
    static async getAll(req, res) {
        try {
            // Verificar permisos - Solo administradores y recursos humanos pueden ver la lista completa
            // Usar `nombre_rol` normalizado en el token para mayor claridad
            const userRole = (req.user && (req.user.nombre_rol || req.user.rol_sistema)) ? req.user.nombre_rol || req.user.rol_sistema : '';
            const puedeVer = ['administrador', 'recursos_humanos'].includes((userRole || '').toString().toLowerCase());
            if (!puedeVer) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para ver la lista de usuarios'
                });
            }

            const usuarios = await UsuarioModel.getAll();

            res.json({
                success: true,
                data: usuarios,
                message: 'Usuarios obtenidos correctamente'
            });

        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener usuarios',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
            });
        }
    }

    /**
     * Obtener usuario por ID
     */
    static async getById(req, res) {
        try {
            const { id } = req.params;
            const idUsuarioSolicitante = req.user.id_usuario;

            // Los usuarios pueden ver su propia información
            // Solo Administrador (id_rol = 4) puede ver cualquier usuario
            const solicitadoId = Number(id);
            const puedeVer = (
                solicitadoId === Number(idUsuarioSolicitante) || 
                Number(req.user.id_rol) === 4
            );

            if (!puedeVer) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para ver este usuario'
                });
            }

            const usuario = await UsuarioModel.getById(id);
            
            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            res.json({
                success: true,
                data: usuario,
                message: 'Usuario obtenido correctamente'
            });

        } catch (error) {
            console.error('Error al obtener usuario:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener usuario',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
            });
        }
    }

    /**
     * Crear nuevo usuario del sistema
     * Solo administradores pueden crear usuarios
     */
    static async create(req, res) {
        try {
            // Solo Administrador (id_rol = 4) puede crear usuarios
            if (Number(req.user.id_rol) !== 4) {
                return res.status(403).json({
                    success: false,
                    message: 'Solo administradores pueden crear usuarios'
                });
            }

            const { id_empleado, username, email, password, id_rol } = req.body;
            
            // Validar datos de entrada
            const validation = UsuarioModel.validateUserData(req.body);
            console.log('[USUARIO CREATE] Resultado validación:', validation);
            
            if (!validation.valid) {
                console.log('[USUARIO CREATE] ❌ Datos inválidos:', validation.errors);
                return res.status(400).json({
                    success: false,
                    message: 'Datos inválidos',
                    errors: validation.errors
                });
            }

            // Verificar que el empleado exista
            console.log('[USUARIO CREATE] Verificando empleado ID:', id_empleado);
            const empleado = await EmpleadoModel.getById(id_empleado);
            if (!empleado) {
                console.log('[USUARIO CREATE] ❌ Empleado no encontrado');
                return res.status(404).json({
                    success: false,
                    message: 'Empleado no encontrado'
                });
            }
            console.log('[USUARIO CREATE] ✅ Empleado encontrado:', empleado.nombre, empleado.apellido);

            // Crear usuario
            console.log('[USUARIO CREATE] Creando usuario...');
            const nuevoUsuario = await UsuarioModel.create({
                id_empleado,
                username,
                email,
                password,
                id_rol
            }, req.user.id_usuario);
            if (!nuevoUsuario) {
                console.error('[USUARIO CREATE] Error: Usuario creado pero no se pudo recuperar el registro');
                return res.status(500).json({
                    success: false,
                    message: 'Usuario creado pero no se pudo recuperar el registro'
                });
            }

            // No devolver la contraseña en la respuesta
            try { delete nuevoUsuario.password; } catch(e) { /* ignore */ }

            console.log('[USUARIO CREATE] ✅ Usuario creado exitosamente');
            res.status(201).json({
                success: true,
                data: nuevoUsuario,
                message: 'Usuario creado correctamente'
            });

        } catch (error) {
            console.error('[USUARIO CREATE] ❌ Error:', error);
            
            let message = 'Error al crear usuario';
            if (error.message.includes('Ya existe un usuario')) {
                message = error.message;
            } else if (error.message.includes('ya está en uso')) {
                message = error.message;
            }

            res.status(400).json({
                success: false,
                message: message,
                error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
            });
        }
    }

    /**
     * Actualizar usuario
     * Los usuarios pueden actualizar sus propios datos básicos
     * Los administradores pueden actualizar cualquier usuario
     */
    static async update(req, res) {
        try {
            const { id } = req.params;
            const idUsuarioSolicitante = req.user.id_usuario;

            // Verificar permisos
            const esPropio = Number(id) === Number(idUsuarioSolicitante);
            const esAdmin = Number(req.user.id_rol) === 4; // Solo Administrador (id_rol = 4)

            if (!esPropio && !esAdmin) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para modificar este usuario'
                });
            }

            // Filtrar campos que puede actualizar según el rol
            let camposPermitidos = ['email'];
            if (esPropio && !esAdmin) {
                camposPermitidos = ['email']; // Los usuarios solo pueden cambiar su email
            } else if (esAdmin) {
                camposPermitidos = ['username', 'email', 'id_rol', 'activo']; // Admins pueden cambiar todo
            }

            const updateData = {};
            for (const campo of camposPermitidos) {
                if (req.body[campo] !== undefined) {
                    updateData[campo] = req.body[campo];
                }
            }

            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No hay campos válidos para actualizar'
                });
            }

            // Validar datos
            const validation = UsuarioModel.validateUserData(updateData);
            if (!validation.valid) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos inválidos',
                    errors: validation.errors
                });
            }

            const usuarioActualizado = await UsuarioModel.update(id, updateData);

            if (!usuarioActualizado) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            res.json({
                success: true,
                data: usuarioActualizado,
                message: 'Usuario actualizado correctamente'
            });

        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar usuario',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
            });
        }
    }

    /**
     * Desactivar usuario
     * Solo administradores pueden desactivar usuarios
     */
    static async deactivate(req, res) {
        try {
            const { id } = req.params;

            // Solo Administrador (id_rol = 4) puede desactivar usuarios
            if (Number(req.user.id_rol) !== 4) {
                return res.status(403).json({
                    success: false,
                    message: 'Solo administradores pueden desactivar usuarios'
                });
            }

            // No permitir que un admin se desactive a sí mismo
            if (parseInt(id) === req.user.id_usuario) {
                return res.status(400).json({
                    success: false,
                    message: 'No puedes desactivar tu propia cuenta'
                });
            }

            const resultado = await UsuarioModel.deactivate(id, req.user.id_usuario);

            if (resultado) {
                res.json({
                    success: true,
                    message: 'Usuario desactivado correctamente'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

        } catch (error) {
            console.error('Error al desactivar usuario:', error);
            res.status(500).json({
                success: false,
                message: 'Error al desactivar usuario',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
            });
        }
    }

    /**
     * Activar usuario
     * Solo administradores pueden activar usuarios
     */
    static async activate(req, res) {
        try {
            const { id } = req.params;

            // Solo Administrador (id_rol = 4) puede activar usuarios
            if (Number(req.user.id_rol) !== 4) {
                return res.status(403).json({
                    success: false,
                    message: 'Solo administradores pueden activar usuarios'
                });
            }

            const resultado = await UsuarioModel.activate(id, req.user.id_usuario);

            if (resultado) {
                res.json({
                    success: true,
                    message: 'Usuario activado correctamente'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

        } catch (error) {
            console.error('Error al activar usuario:', error);
            res.status(500).json({
                success: false,
                message: 'Error al activar usuario',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
            });
        }
    }

    /**
     * Resetear contraseña de usuario
     * Solo administradores pueden resetear contraseñas
     */
    static async resetPassword(req, res) {
        try {
            const { id } = req.params;
            const { newPassword } = req.body;

            // Solo Administrador (id_rol = 4) puede resetear contraseñas
            if (Number(req.user.id_rol) !== 4) {
                return res.status(403).json({
                    success: false,
                    message: 'Solo administradores pueden resetear contraseñas'
                });
            }

            if (!newPassword || newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'La nueva contraseña debe tener al menos 6 caracteres'
                });
            }

            const resultado = await UsuarioModel.changePassword(id, newPassword);

            if (resultado) {
                res.json({
                    success: true,
                    message: 'Contraseña restablecida correctamente'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

        } catch (error) {
            console.error('Error al resetear contraseña:', error);
            res.status(500).json({
                success: false,
                message: 'Error al resetear contraseña',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
            });
        }
    }

    /**
     * Obtener empleados sin usuario (candidatos para crear usuario)
     * Solo administradores pueden ver esto
     */
    static async getEmployeesWithoutUser(req, res) {
        try {
            // Validación de permisos (mantener la lógica actual)
            const rolActual = (req.user && (req.user.nombre_rol || req.user.rol_sistema))
                ? (req.user.nombre_rol || req.user.rol_sistema).toString().toLowerCase()
                : '';

            if (rolActual !== 'administrador' && Number(req.user.id_rol) !== 4) {
                return res.status(403).json({
                    success: false,
                    message: 'Solo administradores pueden ver esta información'
                });
            }

            // Usar el modelo de Empleado si existe: evita duplicar la query en UsuarioModel
            let empleados = [];
            try {
                // Intentar usar EmpleadoModel existente (se esperaba que tenga getEmpleadosSinUsuario)
                if (typeof EmpleadoModel.getEmpleadosSinUsuario === 'function') {
                    empleados = await EmpleadoModel.getEmpleadosSinUsuario();
                } else if (typeof require('../models/UsuarioModel').getEmployeesWithoutUser === 'function') {
                    // Fallback: usar el método de UsuarioModel si existe
                    const UsuarioModelFallback = require('../models/UsuarioModel');
                    empleados = await UsuarioModelFallback.getEmployeesWithoutUser();
                } else {
                    throw new Error('No se encontró método para obtener empleados sin usuario (EmpleadoModel.getEmpleadosSinUsuario ni UsuarioModel.getEmployeesWithoutUser).');
                }
            } catch (innerErr) {
                console.error('[UsuarioController.getEmployeesWithoutUser] Error al obtener desde modelos:', innerErr);
                throw innerErr;
            }

            if (!Array.isArray(empleados)) {
                console.error('[UsuarioController.getEmployeesWithoutUser] Respuesta inesperada del modelo:', empleados);
                return res.status(500).json({
                    success: false,
                    message: 'Error al obtener empleados sin usuario'
                });
            }

            res.json({
                success: true,
                data: empleados,
                message: 'Empleados sin usuario obtenidos correctamente'
            });

        } catch (error) {
            console.error('Error al obtener empleados sin usuario:', error.stack || error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener empleados sin usuario',
                error: process.env.NODE_ENV === 'development' ? (error.message || String(error)) : 'Error interno'
            });
        }
    }
    static async search(req, res) {
        try {
            const { q } = req.query;

            if (!q || q.length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'El término de búsqueda debe tener al menos 2 caracteres'
                });
            }

            // Verificar permisos para buscar usuarios
            // Use `nombre_rol` from the JWT payload (string role names) normalized
            const userRoleSearch = (req.user && (req.user.nombre_rol || req.user.rol_sistema)) ? (req.user.nombre_rol || req.user.rol_sistema).toString().toLowerCase() : '';
            const puedeVer = ['administrador', 'recursos_humanos'].includes(userRoleSearch);
            if (!puedeVer) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para buscar usuarios'
                });
            }

            const usuarios = await UsuarioModel.search(q);

            res.json({
                success: true,
                data: usuarios,
                message: 'Búsqueda completada'
            });

        } catch (error) {
            console.error('Error en búsqueda de usuarios:', error);
            res.status(500).json({
                success: false,
                message: 'Error en la búsqueda',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
            });
        }
    }

    /**
     * Obtener estadísticas de usuarios
     * Solo administradores pueden ver estadísticas
     */
    static async getStats(req, res) {
        try {
            // Solo administradores pueden ver estadísticas
            const rolStats = (req.user && (req.user.nombre_rol || req.user.rol_sistema)) ? (req.user.nombre_rol || req.user.rol_sistema).toString().toLowerCase() : '';
            if (rolStats !== 'administrador' && Number(req.user.id_rol) !== 4) {
                return res.status(403).json({
                    success: false,
                    message: 'Solo administradores pueden ver estadísticas'
                });
            }

            const stats = await UsuarioModel.getStats();

            res.json({
                success: true,
                data: stats,
                message: 'Estadísticas obtenidas correctamente'
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
     * Obtener usuarios por rol
     */
    static async getByRole(req, res) {
        try {
            const { rol } = req.params;

            // Verificar que el rol sea válido
            const rolesValidos = ['administrador', 'recursos_humanos', 'almacen'];
            if (!rolesValidos.includes(rol)) {
                return res.status(400).json({
                    success: false,
                    message: 'Rol no válido'
                });
            }
            // Verificar permisos (usar nombre_rol desde el token)
            const rolUsuarios = (req.user && (req.user.nombre_rol || req.user.rol_sistema)) ? (req.user.nombre_rol || req.user.rol_sistema).toString().toLowerCase() : '';
            const puedeVer = ['administrador', 'recursos_humanos'].includes(rolUsuarios);
            if (!puedeVer) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para ver usuarios por rol'
                });
            }

            const usuarios = await UsuarioModel.getByRole(rol);

            res.json({
                success: true,
                data: usuarios,
                message: `Usuarios con rol ${rol} obtenidos correctamente`
            });

        } catch (error) {
            console.error('Error al obtener usuarios por rol:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener usuarios por rol',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
            });
        }
    }
}

module.exports = UsuarioController;