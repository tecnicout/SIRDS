const { query } = require('../config/database');

class DashboardController {
    static async getAdminStats(req, res) {
        try {
            const [generalTotals] = await query(`
                SELECT 
                    (SELECT COUNT(*) FROM Empleado WHERE estado = 1) AS total_empleados,
                    (SELECT COUNT(*) FROM Usuario WHERE activo = 1) AS usuarios_registrados,
                    (SELECT COUNT(*) FROM dotacion) AS total_items,
                    (SELECT COALESCE(SUM(cantidad), 0) FROM stockdotacion WHERE cantidad > 0) AS stock_disponible
            `);

            const deliveryRows = await query(`
                SELECT 
                    cd.id_ciclo,
                    COALESCE(NULLIF(cd.nombre_ciclo, ''), CONCAT('Ciclo ', cd.id_ciclo)) AS nombre_ciclo,
                    DATE_FORMAT(cd.fecha_entrega, '%d/%m/%Y') AS fecha_label,
                    stats.total_empleados,
                    stats.entregados
                FROM ciclo_dotacion cd
                LEFT JOIN (
                    SELECT 
                        id_ciclo,
                        COUNT(*) AS total_empleados,
                        SUM(CASE WHEN estado = 'entregado' THEN 1 ELSE 0 END) AS entregados
                    FROM empleado_ciclo
                    GROUP BY id_ciclo
                ) stats ON stats.id_ciclo = cd.id_ciclo
                ORDER BY cd.fecha_entrega DESC
                LIMIT 6
            `);

            const pedidosRows = await query(`
                SELECT periodo, label, total FROM (
                    SELECT 
                        DATE_FORMAT(MIN(fecha), '%Y-%m') AS periodo,
                        DATE_FORMAT(MIN(fecha), '%b %Y') AS label,
                        COUNT(*) AS total
                    FROM PedidoCompras
                    GROUP BY YEAR(fecha), MONTH(fecha)
                    ORDER BY periodo DESC
                    LIMIT 6
                ) resumen
                ORDER BY periodo ASC
            `);

            const categoryRows = await query(`
                SELECT 
                    COALESCE(NULLIF(c.nombre_categoria, ''), 'Sin categoría') AS nombre,
                    COUNT(d.id_dotacion) AS total
                FROM dotacion d
                LEFT JOIN categoriadotacion c ON c.id_categoria = d.id_categoria
                GROUP BY COALESCE(NULLIF(c.nombre_categoria, ''), 'Sin categoría')
                ORDER BY total DESC, nombre ASC
            `);

            const orderedDeliveries = deliveryRows.length ? [...deliveryRows].reverse() : [];
            const deliveryLabels = orderedDeliveries.map((row) => row.nombre_ciclo || row.fecha_label || `Ciclo ${row.id_ciclo}`);
            const averageDelivery = orderedDeliveries.map((row) => {
                const total = Number(row.total_empleados) || 0;
                const delivered = Number(row.entregados) || 0;
                if (!total) return 0;
                return Number(((delivered / total) * 100).toFixed(1));
            });

            const orderedPedidos = pedidosRows.length ? pedidosRows : [];
            const pedidosLabels = orderedPedidos.map((row) => row.label);
            const pedidosPorPeriodo = orderedPedidos.map((row) => Number(row.total) || 0);

            const dotacionCategoryLabels = categoryRows.map((row) => row.nombre);
            const dotacionByCategory = categoryRows.map((row) => Number(row.total) || 0);

            return res.json({
                success: true,
                data: {
                    totalEmployees: Number(generalTotals?.total_empleados) || 0,
                    registeredUsers: Number(generalTotals?.usuarios_registrados) || 0,
                    totalItems: Number(generalTotals?.total_items) || 0,
                    stockAvailable: Number(generalTotals?.stock_disponible) || 0,
                    averageDelivery,
                    deliveryLabels,
                    pedidosPorPeriodo,
                    pedidosLabels,
                    dotacionByCategory,
                    dotacionCategoryLabels
                },
                message: 'Estadísticas obtenidas correctamente'
            });
        } catch (error) {
            console.error('[DashboardController.getAdminStats] Error:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas del dashboard',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
            });
        }
    }
}

module.exports = DashboardController;
