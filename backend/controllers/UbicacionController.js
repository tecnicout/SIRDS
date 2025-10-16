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

            if (!['planta', 'bodega'].includes(tipo)) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo debe ser "planta" o "bodega"'
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

            if (!['planta', 'bodega'].includes(tipo)) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo debe ser "planta" o "bodega"'
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

            // Verificar cuántas áreas están relacionadas
            const areasRelacionadas = await UbicacionModel.getRelatedAreas(id);

            // Eliminar ubicación reasignando áreas automáticamente
            const resultado = await UbicacionModel.deleteWithAreasHandling(id);
            
            if (!resultado.success) {
                return res.status(404).json({
                    success: false,
                    message: 'No se pudo eliminar la ubicación'
                });
            }

            // Mensaje específico según si había áreas relacionadas
            let message = 'Ubicación eliminada correctamente';
            if (areasRelacionadas > 0) {
                message = `Ubicación eliminada correctamente. Las ${areasRelacionadas} área(s) relacionada(s) se reasignaron temporalmente.`;
            }

            res.json({
                success: true,
                message: message,
                data: {
                    areasReasignadas: resultado.areasReassigned || 0,
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

            if (!['planta', 'bodega'].includes(tipo)) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo debe ser "planta" o "bodega"'
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