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
            const deleted = await UbicacionModel.delete(id);
            
            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Ubicación no encontrada'
                });
            }

            res.json({
                success: true,
                message: 'Ubicación eliminada correctamente'
            });
        } catch (error) {
            console.error('Error al eliminar ubicación:', error);
            
            // Error de clave foránea
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(400).json({
                    success: false,
                    message: 'No se puede eliminar la ubicación porque tiene áreas asociadas'
                });
            }

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