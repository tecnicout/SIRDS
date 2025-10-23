const AreaModel = require('../models/AreaModel');

class AreaController {
    // Obtener todas las áreas
    static async getAll(req, res) {
        try {
            const areas = await AreaModel.getAll();
            res.json({
                success: true,
                data: areas,
                message: 'Áreas obtenidas correctamente'
            });
        } catch (error) {
            console.error('Error al obtener áreas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener áreas',
                error: error.message
            });
        }
    }

    // Obtener área por ID
    static async getById(req, res) {
        try {
            const { id } = req.params;
            const area = await AreaModel.getById(id);
            
            if (!area) {
                return res.status(404).json({
                    success: false,
                    message: 'Área no encontrada'
                });
            }

            res.json({
                success: true,
                data: area,
                message: 'Área obtenida correctamente'
            });
        } catch (error) {
            console.error('Error al obtener área:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener área',
                error: error.message
            });
        }
    }

    // Crear nueva área
    static async create(req, res) {
        try {
            const { nombre_area } = req.body;

            // Validaciones básicas
            if (!nombre_area || !nombre_area.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre del área es requerido'
                });
            }

            // Verificar que no existe un área con el mismo nombre
            const areaExistente = await AreaModel.existsByName(nombre_area.trim());
            if (areaExistente) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un área con ese nombre'
                });
            }

            const insertId = await AreaModel.create({ 
                nombre_area: nombre_area.trim()
            });
            
            res.status(201).json({
                success: true,
                data: { id: insertId },
                message: 'Área creada correctamente'
            });
        } catch (error) {
            console.error('Error al crear área:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear área',
                error: error.message
            });
        }
    }

    // Actualizar área
    static async update(req, res) {
        try {
            const { id } = req.params;
            const { nombre_area } = req.body;

            // Validaciones básicas
            if (!nombre_area || !nombre_area.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre del área es requerido'
                });
            }

            // Verificar que el área existe
            const areaExiste = await AreaModel.getById(id);
            if (!areaExiste) {
                return res.status(404).json({
                    success: false,
                    message: 'Área no encontrada'
                });
            }

            // Verificar que no existe un área con el mismo nombre (excluyendo la actual)
            const areaExistente = await AreaModel.existsByName(nombre_area.trim(), id);
            if (areaExistente) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un área con ese nombre'
                });
            }

            const updated = await AreaModel.update(id, { 
                nombre_area: nombre_area.trim()
            });
            
            if (!updated) {
                return res.status(404).json({
                    success: false,
                    message: 'No se pudo actualizar el área'
                });
            }

            res.json({
                success: true,
                message: 'Área actualizada correctamente'
            });
        } catch (error) {
            console.error('Error al actualizar área:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar área',
                error: error.message
            });
        }
    }

    // Inactivar área (eliminación lógica)
    static async delete(req, res) {
        try {
            const { id } = req.params;

            // Verificar que el área existe y está activa
            const area = await AreaModel.getById(id);
            if (!area) {
                return res.status(404).json({
                    success: false,
                    message: 'Área no encontrada'
                });
            }

            // Verificar si ya está inactiva
            if (area.estado === 'inactiva') {
                return res.status(400).json({
                    success: false,
                    message: 'El área ya está inactiva'
                });
            }

            const inactivated = await AreaModel.inactivarArea(id);
            
            if (!inactivated) {
                return res.status(404).json({
                    success: false,
                    message: 'No se pudo inactivar el área'
                });
            }

            res.json({
                success: true,
                message: 'Área inactivada correctamente'
            });
        } catch (error) {
            console.error('Error al inactivar área:', error);
            
            res.status(500).json({
                success: false,
                message: 'Error al inactivar el área',
                error: error.message
            });
        }
    }

    // Obtener todas las áreas incluyendo inactivas (para auditoría)
    static async getAllWithInactive(req, res) {
        try {
            const areas = await AreaModel.getAllWithInactive();
            res.json({
                success: true,
                data: areas,
                message: 'Todas las áreas obtenidas correctamente'
            });
        } catch (error) {
            console.error('Error al obtener todas las áreas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener todas las áreas',
                error: error.message
            });
        }
    }

    // Reactivar área
    static async reactivarArea(req, res) {
        try {
            const { id } = req.params;
            const result = await AreaModel.reactivarArea(id);
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Área no encontrada o ya está activa."
                });
            }
            
            res.status(200).json({
                success: true,
                message: "Área reactivada correctamente."
            });
        } catch (error) {
            console.error('Error al reactivar área:', error);
            res.status(500).json({ 
                success: false,
                message: "Error al reactivar el área." 
            });
        }
    }
}

module.exports = AreaController;