const pool = require('../config/database');

class EmpleadoCicloModel {
  /**
   * Obtener empleados de un ciclo con paginación
   */
  static async getByCiclo(id_ciclo, page = 1, limit = 20, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      let query = `
        SELECT 
          ec.*,
          e.Identificacion,
          e.nombre,
          e.apellido,
          e.email,
          e.cargo,
          a.nombre_area,
          CONCAT(e.nombre, ' ', e.apellido) as nombre_completo
        FROM empleado_ciclo ec
        INNER JOIN empleado e ON ec.id_empleado = e.id_empleado
        INNER JOIN area a ON ec.id_area = a.id_area
        WHERE ec.id_ciclo = ?
      `;
      
      const params = [id_ciclo];

      // Filtros
      if (filters.estado) {
        query += ' AND ec.estado = ?';
        params.push(filters.estado);
      }

      if (filters.area) {
        query += ' AND ec.id_area = ?';
        params.push(filters.area);
      }

      query += ' ORDER BY a.nombre_area, e.apellido, e.nombre LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [rows] = await pool.query(query, params);

      // Contar total
      const [countResult] = await pool.query(
        'SELECT COUNT(*) as total FROM empleado_ciclo WHERE id_ciclo = ?',
        [id_ciclo]
      );

      return {
        data: rows,
        total: countResult[0].total,
        page,
        limit,
        totalPages: Math.ceil(countResult[0].total / limit)
      };
    } catch (error) {
      throw new Error(`Error al obtener empleados del ciclo: ${error.message}`);
    }
  }

  /**
   * Agregar empleado a un ciclo
   */
  static async create(data) {
    const {
      id_ciclo,
      id_empleado,
      antiguedad_meses,
      sueldo_al_momento,
      id_area,
      observaciones
    } = data;

    try {
      const [result] = await pool.query(
        `INSERT INTO empleado_ciclo (
          id_ciclo, id_empleado, estado, antiguedad_meses,
          sueldo_al_momento, id_area, observaciones
        ) VALUES (?, ?, 'procesado', ?, ?, ?, ?)`,
        [id_ciclo, id_empleado, antiguedad_meses, sueldo_al_momento, id_area, observaciones]
      );
      return { id_empleado_ciclo: result.insertId };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('El empleado ya está asignado a este ciclo');
      }
      throw new Error(`Error al agregar empleado al ciclo: ${error.message}`);
    }
  }

  /**
   * Agregar múltiples empleados a un ciclo
   */
  static async createBatch(id_ciclo, empleados) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      const insertados = [];
      const errores = [];

      for (const emp of empleados) {
        try {
          const [result] = await connection.query(
            `INSERT INTO empleado_ciclo (
              id_ciclo, id_empleado, estado, antiguedad_meses,
              sueldo_al_momento, id_area
            ) VALUES (?, ?, 'procesado', ?, ?, ?)`,
            [
              id_ciclo,
              emp.id_empleado,
              emp.antiguedad_meses,
              emp.sueldo_al_momento,
              emp.id_area
            ]
          );
          insertados.push({ id_empleado: emp.id_empleado, id_empleado_ciclo: result.insertId });
        } catch (error) {
          errores.push({ id_empleado: emp.id_empleado, error: error.message });
        }
      }

      await connection.commit();
      
      return {
        insertados: insertados.length,
        errores: errores.length,
        detalles: { insertados, errores }
      };
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error al agregar empleados en lote: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  /**
   * Actualizar estado de empleado en ciclo
   */
  static async updateEstado(id_empleado_ciclo, estado, actualizado_por, observaciones = null) {
    try {
      const fecha_entrega_real = estado === 'entregado' ? new Date().toISOString().split('T')[0] : null;

      const [result] = await pool.query(
        `UPDATE empleado_ciclo 
         SET estado = ?,
             fecha_entrega_real = ?,
             actualizado_por = ?,
             observaciones = COALESCE(?, observaciones)
         WHERE id_empleado_ciclo = ?`,
        [estado, fecha_entrega_real, actualizado_por, observaciones, id_empleado_ciclo]
      );
      return result;
    } catch (error) {
      throw new Error(`Error al actualizar estado del empleado: ${error.message}`);
    }
  }

  /**
   * Obtener empleados elegibles para un nuevo ciclo
   */
  static async calcularElegibles(id_area_produccion, id_area_mercadista, smlv_valor) {
    try {
      // Usar helper query que devuelve directamente un arreglo de filas
      const empleados = await pool.query(
        `SELECT 
          e.id_empleado,
          e.Identificacion,
          e.nombre,
          e.apellido,
          CONCAT(e.nombre, ' ', e.apellido) as nombre_completo,
          e.email,
          e.cargo,
          e.fecha_inicio,
          e.sueldo,
          e.id_area,
          a.nombre_area,
          TIMESTAMPDIFF(MONTH, e.fecha_inicio, CURDATE()) as antiguedad_meses,
          ROUND(e.sueldo / ?, 2) as multiplo_smlv,
          CASE 
            WHEN TIMESTAMPDIFF(MONTH, e.fecha_inicio, CURDATE()) >= 3 THEN TRUE
            ELSE FALSE
          END as cumple_antiguedad,
          CASE 
            WHEN e.sueldo >= ? AND e.sueldo <= (? * 2) THEN TRUE
            ELSE FALSE
          END as cumple_sueldo
        FROM empleado e
        INNER JOIN area a ON e.id_area = a.id_area
        WHERE e.estado = 1
          AND e.id_area IN (?, ?)
          AND e.sueldo > 0
          AND TIMESTAMPDIFF(MONTH, e.fecha_inicio, CURDATE()) >= 3
          AND e.sueldo >= ?
          AND e.sueldo <= (? * 2)
        ORDER BY a.nombre_area, e.apellido, e.nombre`,
        [
          smlv_valor,
          smlv_valor,
          smlv_valor,
          id_area_produccion,
          id_area_mercadista,
          smlv_valor,
          smlv_valor
        ]
      );
      // Normalizar a arreglo en caso de resultados inesperados
      if (!Array.isArray(empleados)) {
        console.warn('[calcularElegibles] Resultado no es array. Normalizando a []');
        return [];
      }
      return empleados;
    } catch (error) {
      // No propagar excepción; mantener contrato devolviendo arreglo vacío
      console.error('[calcularElegibles] Error SQL:', error.message);
      return [];
    }
  }

  /**
   * Obtener resumen de estados de un ciclo
   */
  static async getResumenEstados(id_ciclo) {
    try {
      const [resumen] = await pool.query(
        `SELECT 
          estado,
          COUNT(*) as cantidad,
          GROUP_CONCAT(CONCAT(e.nombre, ' ', e.apellido) SEPARATOR ', ') as empleados
        FROM empleado_ciclo ec
        INNER JOIN empleado e ON ec.id_empleado = e.id_empleado
        WHERE ec.id_ciclo = ?
        GROUP BY estado`,
        [id_ciclo]
      );
      return resumen;
    } catch (error) {
      throw new Error(`Error al obtener resumen de estados: ${error.message}`);
    }
  }

  /**
   * Verificar si un empleado ya está en un ciclo
   */
  static async existeEnCiclo(id_ciclo, id_empleado) {
    try {
      const [rows] = await pool.query(
        'SELECT id_empleado_ciclo FROM empleado_ciclo WHERE id_ciclo = ? AND id_empleado = ?',
        [id_ciclo, id_empleado]
      );
      return rows.length > 0;
    } catch (error) {
      throw new Error(`Error al verificar empleado en ciclo: ${error.message}`);
    }
  }

  /**
   * Eliminar empleado de un ciclo (solo si está en estado 'procesado')
   */
  static async delete(id_empleado_ciclo) {
    try {
      // Verificar estado
      const [empleado] = await pool.query(
        'SELECT estado FROM empleado_ciclo WHERE id_empleado_ciclo = ?',
        [id_empleado_ciclo]
      );

      if (!empleado[0]) {
        throw new Error('Empleado no encontrado en el ciclo');
      }

      if (empleado[0].estado !== 'procesado') {
        throw new Error('Solo se pueden eliminar empleados en estado "procesado"');
      }

      const [result] = await pool.query(
        'DELETE FROM empleado_ciclo WHERE id_empleado_ciclo = ?',
        [id_empleado_ciclo]
      );
      return result;
    } catch (error) {
      throw new Error(`Error al eliminar empleado del ciclo: ${error.message}`);
    }
  }

  /**
   * Obtener historial de ciclos de un empleado
   */
  static async getHistorialEmpleado(id_empleado) {
    try {
      const [historial] = await pool.query(
        `SELECT 
          ec.*,
          cd.nombre_ciclo,
          cd.fecha_entrega,
          cd.estado as estado_ciclo,
          a.nombre_area
        FROM empleado_ciclo ec
        INNER JOIN ciclo_dotacion cd ON ec.id_ciclo = cd.id_ciclo
        INNER JOIN area a ON ec.id_area = a.id_area
        WHERE ec.id_empleado = ?
        ORDER BY cd.fecha_entrega DESC`,
        [id_empleado]
      );
      return historial;
    } catch (error) {
      throw new Error(`Error al obtener historial del empleado: ${error.message}`);
    }
  }
}

module.exports = EmpleadoCicloModel;
