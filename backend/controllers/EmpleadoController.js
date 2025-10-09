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
                nombre, apellido, email, telefono, cargo,
                id_genero, id_area, id_rol, estado = 1
            } = req.body;

            // Validaciones básicas
            if (!nombre || !apellido || !id_genero || !id_area || !id_rol) {
                return res.status(400).json({
                    success: false,
                    message: 'Nombre, apellido, género, área y rol son requeridos'
                });
            }

            // Validar email único si se proporciona
            if (email) {
                // Aquí podrías agregar validación de email único
            }

            const insertId = await EmpleadoModel.create({
                nombre, apellido, email, telefono, cargo,
                id_genero, id_area, id_rol, estado
            });
            
            res.status(201).json({
                success: true,
                data: { id: insertId },
                message: 'Empleado creado correctamente'
            });
        } catch (error) {
            console.error('Error al crear empleado:', error);
            
            // Error de clave foránea
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(400).json({
                    success: false,
                    message: 'Género, área o rol especificado no existe'
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
            const {
                nombre, apellido, email, telefono, cargo,
                id_genero, id_area, id_rol, estado
            } = req.body;

            // Validaciones básicas
            if (!nombre || !apellido || !id_genero || !id_area || !id_rol) {
                return res.status(400).json({
                    success: false,
                    message: 'Nombre, apellido, género, área y rol son requeridos'
                });
            }

            const updated = await EmpleadoModel.update(id, {
                nombre, apellido, email, telefono, cargo,
                id_genero, id_area, id_rol, estado
            });
            
            if (!updated) {
                return res.status(404).json({
                    success: false,
                    message: 'Empleado no encontrado'
                });
            }

            res.json({
                success: true,
                message: 'Empleado actualizado correctamente'
            });
        } catch (error) {
            console.error('Error al actualizar empleado:', error);
            
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(400).json({
                    success: false,
                    message: 'Género, área o rol especificado no existe'
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
}

module.exports = EmpleadoController;