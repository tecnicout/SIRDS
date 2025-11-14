const EmpleadoModel = require('../models/EmpleadoModel');

class EmpleadoController {
    // Obtener todos los empleados
    static async getAll(req, res) {
        try {
            const empleados = await EmpleadoModel.getAll();
            res.json({
                success: true,
                data: empleados,
                message: 'Empleados obtenidos correctamente'
            });
        } catch (error) {
            console.error('Error al obtener empleados:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener empleados',
                error: error.message
            });
        }
    }

    // Obtener empleado por ID
    static async getById(req, res) {
        try {
            const { id } = req.params;
            const empleado = await EmpleadoModel.getById(id);
            
            if (!empleado) {
                return res.status(404).json({
                    success: false,
                    message: 'Empleado no encontrado'
                });
            }

            res.json({
                success: true,
                data: empleado,
                message: 'Empleado obtenido correctamente'
            });
        } catch (error) {
            console.error('Error al obtener empleado:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener empleado',
                error: error.message
            });
        }
    }

    // Crear nuevo empleado
    static async create(req, res) {
        try {
            const {
                Identificacion, tipo_identificacion, nombre, apellido, fecha_nacimiento,
                email, telefono, cargo, id_genero, id_area, id_ubicacion, fecha_inicio, sueldo, 
                fecha_fin, estado = 1,
                id_kit = null
            } = req.body;

            // Validaciones básicas
            if (!Identificacion || !tipo_identificacion || !nombre || !apellido || !fecha_inicio || !cargo || !id_genero || !id_area) {
                return res.status(400).json({
                    success: false,
                    message: 'Identificación, tipo de identificación, nombre, apellido, fecha de inicio, cargo, género y área son requeridos'
                });
            }

            // Validar identificación única
            const existeId = await EmpleadoModel.existeIdentificacion(Identificacion);
            if (existeId) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un empleado con esta identificación'
                });
            }

            // Validar email único si se proporciona
            if (email) {
                const existeEmail = await EmpleadoModel.existeEmail(email);
                if (existeEmail) {
                    return res.status(400).json({
                        success: false,
                        message: 'Ya existe un empleado con este email'
                    });
                }
            }

            const insertId = await EmpleadoModel.create({
                Identificacion, tipo_identificacion, nombre, apellido, fecha_nacimiento,
                email, telefono, cargo, id_genero, id_area, id_ubicacion, fecha_inicio, sueldo, 
                fecha_fin, estado, id_kit
            });
            
            // Devolver el empleado completo (incluyendo kit_nombre) para compatibilidad con frontend
            const empleadoCreado = await EmpleadoModel.getById(insertId);

            res.status(201).json({
                success: true,
                message: 'Empleado creado correctamente',
                data: { id: insertId, empleado: empleadoCreado },
                empleado: empleadoCreado ? {
                    id_empleado: empleadoCreado.id_empleado,
                    nombre: empleadoCreado.nombre,
                    apellido: empleadoCreado.apellido,
                    email: empleadoCreado.email,
                    id_kit: empleadoCreado.id_kit ?? null,
                    kit_nombre: empleadoCreado.kit_nombre ?? null
                } : null
            });
        } catch (error) {
            console.error('Error al crear empleado:', error);
            
            // Error de clave foránea
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(400).json({
                    success: false,
                    message: 'Género o área especificado no existe'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error al crear empleado',
                error: error.message
            });
        }
    }

    // Actualizar empleado
    static async update(req, res) {
        try {
            const { id } = req.params;
            
            // Limpieza de campos undefined antes de procesar
            Object.keys(req.body).forEach(key => {
                if (req.body[key] === undefined) {
                    req.body[key] = null;
                }
            });
            
            const {
                Identificacion, tipo_identificacion, nombre, apellido, fecha_nacimiento,
                email, telefono, cargo, id_genero, id_area, id_ubicacion, fecha_inicio, sueldo, 
                fecha_fin, estado,
                id_kit = null
            } = req.body;

            // Validaciones básicas para campos obligatorios
            const camposFaltantes = [];
            if (!Identificacion || Identificacion.trim() === '') camposFaltantes.push('identificación');
            if (!tipo_identificacion) camposFaltantes.push('tipo de identificación');
            if (!nombre || nombre.trim() === '') camposFaltantes.push('nombre');
            if (!apellido || apellido.trim() === '') camposFaltantes.push('apellido');
            if (!fecha_inicio) camposFaltantes.push('fecha de inicio');
            if (!cargo || cargo.trim() === '') camposFaltantes.push('cargo');
            if (!id_genero) camposFaltantes.push('género');
            if (!id_area) camposFaltantes.push('área');
            
            if (camposFaltantes.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Campos requeridos faltantes: ${camposFaltantes.join(', ')}`
                });
            }

            // Validar identificación única (excluyendo el empleado actual)
            const existeId = await EmpleadoModel.existeIdentificacion(Identificacion, id);
            if (existeId) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe otro empleado con esta identificación'
                });
            }

            // Validar email único si se proporciona (excluyendo el empleado actual)
            if (email) {
                const existeEmail = await EmpleadoModel.existeEmail(email, id);
                if (existeEmail) {
                    return res.status(400).json({
                        success: false,
                        message: 'Ya existe otro empleado con este email'
                    });
                }
            }

            const updated = await EmpleadoModel.update(id, {
                Identificacion, tipo_identificacion, nombre, apellido, fecha_nacimiento,
                email, telefono, cargo, id_genero, id_area, id_ubicacion, fecha_inicio, sueldo, 
                fecha_fin, estado, id_kit
            });
            
            if (!updated) {
                return res.status(404).json({
                    success: false,
                    message: 'Empleado no encontrado'
                });
            }

            // Devolver el empleado actualizado para confirmar cambios (incluye kit)
            const empleadoActualizado = await EmpleadoModel.getById(id);
            res.json({
                success: true,
                message: 'Empleado actualizado correctamente',
                data: { empleado: empleadoActualizado }
            });
        } catch (error) {
            console.error('Error al actualizar empleado:', error);
            
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(400).json({
                    success: false,
                    message: 'Género o área especificado no existe'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error al actualizar empleado',
                error: error.message
            });
        }
    }

    // Cambiar estado del empleado
    static async changeStatus(req, res) {
        try {
            const { id } = req.params;
            const { estado } = req.body;

            if (typeof estado !== 'boolean' && estado !== 0 && estado !== 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Estado debe ser true/false o 1/0'
                });
            }

            const updated = await EmpleadoModel.changeStatus(id, estado);
            
            if (!updated) {
                return res.status(404).json({
                    success: false,
                    message: 'Empleado no encontrado'
                });
            }

            res.json({
                success: true,
                message: `Empleado ${estado ? 'activado' : 'desactivado'} correctamente`
            });
        } catch (error) {
            console.error('Error al cambiar estado del empleado:', error);
            res.status(500).json({
                success: false,
                message: 'Error al cambiar estado del empleado',
                error: error.message
            });
        }
    }

    // Obtener empleados por área
    static async getByArea(req, res) {
        try {
            const { idArea } = req.params;
            const empleados = await EmpleadoModel.getByArea(idArea);
            
            res.json({
                success: true,
                data: empleados,
                message: 'Empleados del área obtenidos correctamente'
            });
        } catch (error) {
            console.error('Error al obtener empleados por área:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener empleados por área',
                error: error.message
            });
        }
    }

    // Buscar empleados
    static async search(req, res) {
        try {
            const { q } = req.query;
            
            if (!q || q.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'El término de búsqueda debe tener al menos 2 caracteres'
                });
            }

            const empleados = await EmpleadoModel.search(q.trim());
            
            res.json({
                success: true,
                data: empleados,
                message: 'Búsqueda de empleados completada'
            });
        } catch (error) {
            console.error('Error al buscar empleados:', error);
            res.status(500).json({
                success: false,
                message: 'Error al buscar empleados',
                error: error.message
            });
        }
    }

    // Obtener empleados sin usuario asignado
    static async getEmpleadosSinUsuario(req, res) {
        try {
            const empleados = await EmpleadoModel.getEmpleadosSinUsuario();
            
            res.json({
                success: true,
                data: empleados,
                message: 'Empleados sin usuario obtenidos correctamente'
            });
        } catch (error) {
            console.error('Error al obtener empleados sin usuario:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener empleados sin usuario',
                error: error.message
            });
        }
    }
}

module.exports = EmpleadoController;