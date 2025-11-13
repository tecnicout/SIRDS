const { pool, query, getConnection } = require('../config/database');

class EmpleadoCicloModel {
  /**
   * Obtener empleados de un ciclo con paginación
   */
  static async getByCiclo(id_ciclo, page = 1, limit = 20, filters = {}) {
    try {
      const validPage = parseInt(page) || 1;
      const validLimit = parseInt(limit) || 20;
      const offset = (validPage - 1) * validLimit;
      let sql = `
        SELECT 
          ec.id_empleado_ciclo,
          ec.id_ciclo,
          ec.id_empleado,
          ec.id_kit,
          ec.estado,
          ec.antiguedad_meses,
          ec.sueldo_al_momento,
          ec.id_area,
          ec.observaciones,
          ec.fecha_asignacion,
          ec.fecha_entrega_real,
          ec.fecha_actualizacion,
          e.Identificacion AS documento,
          e.nombre,
          e.apellido,
          e.email,
          e.cargo,
          a.nombre_area,
          k.nombre AS nombre_kit,
          CONCAT(e.nombre, ' ', e.apellido) as nombre_completo
        FROM empleado_ciclo ec
        INNER JOIN empleado e ON ec.id_empleado = e.id_empleado
        INNER JOIN area a ON ec.id_area = a.id_area
        LEFT JOIN kitdotacion k ON ec.id_kit = k.id_kit
        WHERE ec.id_ciclo = ?
      `;
      
      const params = [id_ciclo];

      // Filtros
      if (filters.estado) {
        sql += ' AND ec.estado = ?';
        params.push(filters.estado);
      }

      if (filters.area) {
        sql += ' AND ec.id_area = ?';
        params.push(filters.area);
      }

  // Evitar placeholders para LIMIT/OFFSET (previene ER_WRONG_ARGUMENTS en algunos motores)
  sql += ` ORDER BY a.nombre_area, e.apellido, e.nombre LIMIT ${validLimit} OFFSET ${offset}`;

  const rows = await query(sql, params);

      // Contar total
      let countSql = 'SELECT COUNT(*) as total FROM empleado_ciclo WHERE id_ciclo = ?';
      const countParams = [id_ciclo];
      if (filters.estado) {
        countSql += ' AND estado = ?';
        countParams.push(filters.estado);
      }
      if (filters.area) {
        countSql += ' AND id_area = ?';
        countParams.push(filters.area);
      }
      const countResult = await query(countSql, countParams);

      return {
        data: rows,
        total: countResult[0].total,
        page: validPage,
        limit: validLimit,
        totalPages: Math.ceil(countResult[0].total / validLimit)
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
      const result = await query(
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
  const connection = await getConnection();
    
    try {
      await connection.beginTransaction();

      const insertados = [];
      const errores = [];

      for (const emp of empleados) {
        try {
          const [result] = await connection.execute(
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

      const result = await query(
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
      // Devolver SIEMPRE arreglo de filas (desestructurar pool.query)
      const empleados = await query(
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
      return Array.isArray(empleados) ? empleados : [];
    } catch (error) {
      // No propagar excepción; mantener contrato devolviendo arreglo vacío
      console.error('[calcularElegibles] Error SQL:', error.message);
      return [];
    }
  }

  /**
   * Listar todos los candidatos (elegibles y no elegibles) sin filtrar por sueldo ni antigüedad.
   * Devuelve flags para clasificar en frontend.
   */
  static async obtenerCandidatosCiclo(id_area_produccion, id_area_mercadista, smlv_valor) {
    try {
      const candidatos = await query(
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
        ORDER BY a.nombre_area, e.apellido, e.nombre`,
        [
          smlv_valor,
          smlv_valor,
          smlv_valor,
          id_area_produccion,
          id_area_mercadista
        ]
      );
      return Array.isArray(candidatos) ? candidatos : [];
    } catch (error) {
      console.error('[obtenerCandidatosCiclo] Error SQL:', error.message);
      return [];
    }
  }

  /**
   * Obtener todos los candidatos (toda la tabla empleado) sin restricción de área.
   * Incluye flags para evaluar elegibilidad por antigüedad y rango salarial.
   */
  static async obtenerCandidatosGlobal(smlv_valor) {
    try {
      const candidatos = await query(
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
        WHERE e.estado = 1 AND e.sueldo > 0
        ORDER BY a.nombre_area, e.apellido, e.nombre`,
        [smlv_valor, smlv_valor, smlv_valor]
      );
      return Array.isArray(candidatos) ? candidatos : [];
    } catch (error) {
      console.error('[obtenerCandidatosGlobal] Error SQL:', error.message);
      return [];
    }
  }

  /**
   * Calcular SOLO empleados elegibles a nivel global (sin restricción de áreas)
   * Criterios: antigüedad >= 3 meses y sueldo entre [1 SMLV, 2 SMLV]
   */
  static async calcularElegiblesGlobal(smlv_valor) {
    try {
      const rows = await query(
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
          ROUND(e.sueldo / ?, 2) as multiplo_smlv
        FROM empleado e
        INNER JOIN area a ON e.id_area = a.id_area
        WHERE e.estado = 1
          AND e.sueldo > 0
          AND TIMESTAMPDIFF(MONTH, e.fecha_inicio, CURDATE()) >= 3
          AND e.sueldo <= (? * 2)
        ORDER BY a.nombre_area, e.apellido, e.nombre`,
        [smlv_valor, smlv_valor]
      );
      return Array.isArray(rows) ? rows : [];
    } catch (error) {
      console.error('[calcularElegiblesGlobal] Error SQL:', error.message);
      return [];
    }
  }

  /**
   * Inserta en una sola sentencia todos los elegibles globales al ciclo indicado.
   * Previene duplicados dentro del mismo ciclo.
   * Retorna { insertados, afectados }
   */
  static async insertElegiblesGlobalBatch(id_ciclo, smlv_valor) {
    const connection = await getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.execute(
        `INSERT INTO empleado_ciclo (
            id_ciclo, id_empleado, id_kit, estado, antiguedad_meses, sueldo_al_momento, id_area
         )
         SELECT ?, e.id_empleado, k.id_kit, 'procesado',
                TIMESTAMPDIFF(MONTH, e.fecha_inicio, CURDATE()) as antiguedad_meses,
                e.sueldo, e.id_area
         FROM empleado e
         INNER JOIN area a ON e.id_area = a.id_area
         LEFT JOIN kitdotacion k ON k.id_area = a.id_area AND k.activo = 1
         WHERE e.estado = 1
           AND e.sueldo > 0
           AND TIMESTAMPDIFF(MONTH, e.fecha_inicio, CURDATE()) >= 3
           AND e.sueldo <= (? * 2)
           AND NOT EXISTS (
              SELECT 1 FROM empleado_ciclo ec
              WHERE ec.id_ciclo = ? AND ec.id_empleado = e.id_empleado
           )`,
        [id_ciclo, smlv_valor, id_ciclo]
      );
      await connection.commit();
      return { insertados: Number(result.affectedRows || 0), afectados: Number(result.affectedRows || 0) };
    } catch (error) {
      await connection.rollback();
      console.error('[insertElegiblesGlobalBatch] Error SQL:', error.message);
      return { insertados: 0, afectados: 0, error: error.message };
    } finally {
      connection.release();
    }
  }

  /**
   * Backfill para ciclos existentes: asigna id_kit a registros de empleado_ciclo con id_kit NULL
   * cruzando por área contra kitdotacion activo.
   */
  static async backfillKitsPorArea(id_ciclo) {
    const connection = await getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.execute(
        `UPDATE empleado_ciclo ec
         INNER JOIN kitdotacion k ON k.id_area = ec.id_area AND k.activo = 1
         SET ec.id_kit = k.id_kit
         WHERE ec.id_ciclo = ? AND ec.id_kit IS NULL`,
        [id_ciclo]
      );
      await connection.commit();
      return Number(result.affectedRows || 0);
    } catch (error) {
      await connection.rollback();
      console.error('[backfillKitsPorArea] Error SQL:', error.message);
      return 0;
    } finally {
      connection.release();
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
      const empleado = await query(
        'SELECT estado FROM empleado_ciclo WHERE id_empleado_ciclo = ?',
        [id_empleado_ciclo]
      );

      if (!empleado[0]) {
        throw new Error('Empleado no encontrado en el ciclo');
      }

      if (empleado[0].estado !== 'procesado') {
        throw new Error('Solo se pueden eliminar empleados en estado "procesado"');
      }

      const result = await query(
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
      const historial = await query(
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
