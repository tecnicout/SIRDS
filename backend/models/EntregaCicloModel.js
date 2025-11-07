const { pool, query } = require('../config/database');

class EntregaCicloModel {
  /**
   * Obtener entregas del ciclo con paginación y filtros
   */
  static async getEntregas(page = 1, limit = 10, filters = {}) {
    try {
      const validPage = parseInt(page) || 1;
      const validLimit = parseInt(limit) || 10;
      const offset = (validPage - 1) * validLimit;

      // Si no se especifica un ciclo, intentamos obtener el ciclo activo
      let id_ciclo = filters.id_ciclo;
      if (!id_ciclo) {
        const [rows] = await query(
          `SELECT id_ciclo FROM ciclo_dotacion 
           WHERE estado = 'activo' 
           AND CURDATE() BETWEEN fecha_inicio_ventana AND fecha_fin_ventana
           LIMIT 1`
        );
        if (rows && rows.length > 0) {
          id_ciclo = rows[0].id_ciclo;
        } else {
          // Si no hay ciclo activo, devolvemos un resultado vacío
          return {
            data: [],
            total: 0,
            page: validPage,
            limit: validLimit,
            totalPages: 0
          };
        }
      }

      let sqlQuery = `
        SELECT 
          ec.*,
          e.nombre,
          e.apellido,
          e.identificacion,
          e.telefono,
          a.nombre_area,
          u.username as actualizado_por_nombre,
          cd.fecha_entrega,
          cd.estado as estado_ciclo
        FROM empleado_ciclo ec
        INNER JOIN empleado e ON ec.id_empleado = e.id_empleado
        INNER JOIN area a ON ec.id_area = a.id_area
        INNER JOIN ciclo_dotacion cd ON ec.id_ciclo = cd.id_ciclo
        LEFT JOIN usuario u ON ec.actualizado_por = u.id_usuario
        WHERE ec.id_ciclo = ?`;

      const params = [id_ciclo];

      if (filters.estado) {
        sqlQuery += ' AND ec.estado = ?';
        params.push(filters.estado);
      }

      if (filters.id_area) {
        sqlQuery += ' AND ec.id_area = ?';
        params.push(filters.id_area);
      }

      if (filters.busqueda) {
        const searchTerm = `%${filters.busqueda}%`;
        sqlQuery += ` AND (
          e.nombre LIKE ? OR 
          e.apellido LIKE ? OR 
          e.identificacion LIKE ? OR
          a.nombre_area LIKE ?
        )`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      sqlQuery += ' ORDER BY ec.fecha_actualizacion DESC, e.apellido ASC LIMIT ? OFFSET ?';
      params.push(validLimit, offset);

      const [rows] = await query(sqlQuery, params);

      // Obtener total de registros con los mismos filtros
      const [countResult] = await query(
        'SELECT COUNT(*) as total FROM empleado_ciclo WHERE id_ciclo = ?',
        [id_ciclo]
      );

      return {
        data: rows,
        total: countResult[0].total,
        page: validPage,
        limit: validLimit,
        totalPages: Math.ceil(countResult[0].total / validLimit)
      };

    } catch (error) {
      console.error('Error en EntregaCicloModel.getEntregas:', error);
      throw error;
    }
  }

  /**
   * Actualizar estado de una entrega
   */
  static async updateEstado(id_empleado_ciclo, estado, observaciones = null, actualizado_por = null) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const updateQuery = `
        UPDATE empleado_ciclo 
        SET 
          estado = ?,
          observaciones = ?,
          actualizado_por = ?,
          fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id_empleado_ciclo = ?`;

      await connection.query(updateQuery, [
        estado,
        observaciones,
        actualizado_por,
        id_empleado_ciclo
      ]);

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Obtener estadísticas de las entregas de un ciclo
   */
  static async getEstadisticas(id_ciclo) {
    try {
      if (!id_ciclo) {
        return [];
      }

      const [stats] = await query(
        `SELECT 
          COALESCE(estado, 'pendiente') as estado,
          COUNT(*) as total
        FROM empleado_ciclo
        WHERE id_ciclo = ?
        GROUP BY estado`,
        [id_ciclo]
      );

      return stats || [];
    } catch (error) {
      console.error('Error en EntregaCicloModel.getEstadisticas:', error);
      throw error;
    }
  }
}

module.exports = EntregaCicloModel;