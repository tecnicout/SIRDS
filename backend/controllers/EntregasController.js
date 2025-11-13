const EntregaDotacionModel = require('../models/EntregaDotacionModel');

class EntregasController {
    /**
     * Listar entregas del ciclo activo
     */
    static async listarEntregas(req, res) {
        try {
            const { page = 1, limit = 10, estado, area, search } = req.query;
            
            const filters = {};
            if (estado) filters.estado = estado;
            if (area) filters.area = parseInt(area);
            if (search) filters.search = search;

            const result = await EntregaDotacionModel.getEntregasCicloActivo(
                parseInt(page),
                parseInt(limit),
                filters
            );

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Error al listar entregas:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Reasignar kits para registros de un ciclo que tienen id_kit NULL
     * Útil cuando se crean kits después de haber creado el ciclo.
     */
    static async resyncKits(req, res) {
        try {
            const { id_ciclo } = req.params;
            if (!id_ciclo) {
                return res.status(400).json({ success: false, message: 'id_ciclo requerido' });
            }
            const afectados = await require('../models/EmpleadoCicloModel').backfillKitsPorArea(id_ciclo);
            res.json({ success: true, message: 'Resincronización de kits completada', data: { id_ciclo, kits_asignados: afectados } });
        } catch (error) {
            console.error('Error al resincronizar kits:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Actualizar estado de una entrega
     */
    static async actualizarEstado(req, res) {
        try {
            const { id } = req.params;
            const { estado, observaciones } = req.body;
            const usuario_id = req.usuario.id_usuario;

            if (!['procesado', 'entregado', 'omitido'].includes(estado)) {
                return res.status(400).json({
                    success: false,
                    message: 'Estado no válido'
                });
            }

            await EntregaDotacionModel.updateEstado(
                id,
                estado,
                usuario_id,
                observaciones
            );

            res.json({
                success: true,
                message: 'Estado actualizado correctamente'
            });
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Obtener estadísticas del ciclo actual
     */
    static async obtenerEstadisticas(req, res) {
        try {
            const { id_ciclo } = req.params;

            const stats = await EntregaDotacionModel.getEstadisticasCiclo(id_ciclo);

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = EntregasController;