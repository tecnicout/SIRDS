const UbicacionModel = require('../models/UbicacionModel');

class UbicacionController {
    // Obtener todas las ubicaciones
    static async getAll(req, res) {
        try {
            const ubicaciones = await UbicacionModel.getAll();
            res.json({
                success: true,
                data: ubicaciones,
                message: 'Ubicaciones obtenidas correctamente'
            });
        } catch (error) {
            console.error('Error al obtener ubicaciones:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener ubicaciones',
                error: error.message
            });
        }
    }

    static async getEmployees(req, res) {
        try {
            const { id } = req.params;
            const ubicacion = await UbicacionModel.getById(id);
            if (!ubicacion) {
                return res.status(404).json({
                    success: false,
                    message: 'Ubicación no encontrada'
                });
            }

            const empleados = await UbicacionModel.getEmployeesByUbicacion(id);
            res.json({
                success: true,
                data: empleados,
                message: 'Empleados obtenidos correctamente'
            });
        } catch (error) {
            console.error('Error al obtener empleados por ubicación:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener empleados por ubicación',
                error: error.message
            });
        }
    }

    static async reassignEmployees(req, res) {
        try {
            const { id } = req.params;
            const { nuevaUbicacionId } = req.body;

            if (!nuevaUbicacionId) {
                return res.status(400).json({
                    success: false,
                    message: 'Debe seleccionar la nueva ubicación'
                });
            }

            if (Number(id) === Number(nuevaUbicacionId)) {
                return res.status(400).json({
                    success: false,
                    message: 'La nueva ubicación debe ser diferente'
                });
            }

            const origen = await UbicacionModel.getById(id);
            if (!origen) {
                return res.status(404).json({
                    success: false,
                    message: 'Ubicación origen no encontrada'
                });
            }

            const destino = await UbicacionModel.getById(nuevaUbicacionId);
            if (!destino) {
                return res.status(404).json({
                    success: false,
                    message: 'Ubicación destino no encontrada'
                });
            }

            const reasignados = await UbicacionModel.reassignEmployees(id, nuevaUbicacionId);

            res.json({
                success: true,
                data: { reasignados },
                message: `${reasignados} empleado(s) reasignado(s) a ${destino.nombre}`
            });
        } catch (error) {
            console.error('Error al reasignar empleados:', error);
            res.status(500).json({
                success: false,
                message: 'Error al reasignar empleados',
                error: error.message
            });
        }
    }

    // Obtener ubicación por ID
    static async getById(req, res) {
        try {
            const { id } = req.params;
            const ubicacion = await UbicacionModel.getById(id);
            
            if (!ubicacion) {
                return res.status(404).json({
                    success: false,
                    message: 'Ubicación no encontrada'
                });
            }

            res.json({
                success: true,
                data: ubicacion,
                message: 'Ubicación obtenida correctamente'
            });
        } catch (error) {
            console.error('Error al obtener ubicación:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener ubicación',
                error: error.message
            });
        }
    }

    // Crear nueva ubicación
    static async create(req, res) {
        try {
            const { nombre, tipo, direccion } = req.body;

            // Validaciones básicas
            if (!nombre || !tipo) {
                return res.status(400).json({
                    success: false,
                    message: 'Nombre y tipo son requeridos'
                });
            }

            if (!['planta', 'bodega', 'maquila'].includes(tipo)) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo debe ser "planta", "bodega" o "maquila"'
                });
            }

            // Verificar si ya existe una ubicación con el mismo nombre
            const existeNombre = await UbicacionModel.existsByName(nombre);
            if (existeNombre) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe una ubicación con ese nombre'
                });
            }

            const insertId = await UbicacionModel.create({ nombre, tipo, direccion });
            
            res.status(201).json({
                success: true,
                data: { id: insertId },
                message: 'Ubicación creada correctamente'
            });
        } catch (error) {
            console.error('Error al crear ubicación:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear ubicación',
                error: error.message
            });
        }
    }

    // Actualizar ubicación
    static async update(req, res) {
        try {
            const { id } = req.params;
            const { nombre, tipo, direccion } = req.body;

            // Validaciones básicas
            if (!nombre || !tipo) {
                return res.status(400).json({
                    success: false,
                    message: 'Nombre y tipo son requeridos'
                });
            }

            if (!['planta', 'bodega', 'maquila'].includes(tipo)) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo debe ser "planta", "bodega" o "maquila"'
                });
            }

            // Verificar si ya existe una ubicación con el mismo nombre (excluyendo la actual)
            const existeNombre = await UbicacionModel.existsByName(nombre, id);
            if (existeNombre) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe una ubicación con ese nombre'
                });
            }

            const updated = await UbicacionModel.update(id, { nombre, tipo, direccion });
            
            if (!updated) {
                return res.status(404).json({
                    success: false,
                    message: 'Ubicación no encontrada'
                });
            }

            res.json({
                success: true,
                message: 'Ubicación actualizada correctamente'
            });
        } catch (error) {
            console.error('Error al actualizar ubicación:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar ubicación',
                error: error.message
            });
        }
    }

    // Eliminar ubicación
    static async delete(req, res) {
        try {
            const { id } = req.params;

            // Verificar si la ubicación existe
            const ubicacion = await UbicacionModel.getById(id);
            if (!ubicacion) {
                return res.status(404).json({
                    success: false,
                    message: 'Ubicación no encontrada'
                });
            }

            // Eliminar ubicación reasignando entidades relacionadas automáticamente
            const resultado = await UbicacionModel.deleteWithAreasHandling(id);
            
            if (!resultado.success) {
                return res.status(404).json({
                    success: false,
                    message: 'No se pudo eliminar la ubicación'
                });
            }

            const totalReassigned = resultado.totalReassigned ?? resultado.areasReassigned ?? 0;
            const summary = resultado.reassignSummary || {};
            const details = [];

            if (summary.empleados) {
                details.push(`${summary.empleados} empleado(s)`);
            }
            if (summary.stock) {
                details.push(`${summary.stock} registro(s) de stock`);
            }
            if (summary.areas) {
                details.push(`${summary.areas} área(s)`);
            }

            let message = 'Ubicación eliminada correctamente';
            if (details.length > 0) {
                message = `Ubicación eliminada correctamente. ${details.join(', ')} se reasignaron temporalmente.`;
            }

            res.json({
                success: true,
                message: message,
                data: {
                    areasReasignadas: totalReassigned,
                    detallesReasignacion: summary,
                    ubicacionTemporal: resultado.temporalLocationId
                }
            });
        } catch (error) {
            console.error('Error al eliminar ubicación:', error);

            res.status(500).json({
                success: false,
                message: 'Error al eliminar ubicación',
                error: error.message
            });
        }
    }

    // Obtener ubicaciones por tipo
    static async getByTipo(req, res) {
        try {
            const { tipo } = req.params;

            if (!['planta', 'bodega', 'maquila'].includes(tipo)) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo debe ser "planta", "bodega" o "maquila"'
                });
            }

            const ubicaciones = await UbicacionModel.getByTipo(tipo);
            
            res.json({
                success: true,
                data: ubicaciones,
                message: `Ubicaciones tipo ${tipo} obtenidas correctamente`
            });
        } catch (error) {
            console.error('Error al obtener ubicaciones por tipo:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener ubicaciones por tipo',
                error: error.message
            });
        }
    }
}

module.exports = UbicacionController;