const { pool, query, getConnection } = require('../config/database');

class CicloDotacionModel {
  /**
   * Obtener todos los ciclos con paginación
   */
  static async getAll(page = 1, limit = 10, filters = {}) {
    try {
      // Asegurar que page y limit sean números válidos
      const validPage = parseInt(page) || 1;
      const validLimit = parseInt(limit) || 10;
      const offset = (validPage - 1) * validLimit;
      
      let sqlQuery = `
        SELECT 
          cd.*,
          u.username as creado_por_nombre,
          a1.nombre_area as nombre_produccion,
          a2.nombre_area as nombre_mercadista,
          DATEDIFF(cd.fecha_fin_ventana, cd.fecha_inicio_ventana) as dias_ventana,
          CASE 
            WHEN CURDATE() < cd.fecha_inicio_ventana THEN 'fuera_ventana'
            WHEN CURDATE() BETWEEN cd.fecha_inicio_ventana AND cd.fecha_fin_ventana THEN 'en_ventana'
            ELSE 'ventana_cerrada'
          END as estado_ventana,
          (SELECT COUNT(*) FROM empleado_ciclo WHERE id_ciclo = cd.id_ciclo) as total_empleados,
          (SELECT COUNT(*) FROM empleado_ciclo WHERE id_ciclo = cd.id_ciclo AND estado = 'procesado') as procesados,
          (SELECT COUNT(*) FROM empleado_ciclo WHERE id_ciclo = cd.id_ciclo AND estado = 'entregado') as entregados,
          (SELECT COUNT(*) FROM empleado_ciclo WHERE id_ciclo = cd.id_ciclo AND estado = 'omitido') as omitidos
        FROM ciclo_dotacion cd
        LEFT JOIN usuario u ON cd.creado_por = u.id_usuario
        LEFT JOIN area a1 ON cd.id_area_produccion = a1.id_area
        LEFT JOIN area a2 ON cd.id_area_mercadista = a2.id_area
        WHERE 1=1
      `;
      
      const params = [];

      // Filtros
      if (filters.estado) {
        sqlQuery += ' AND cd.estado = ?';
        params.push(filters.estado);
      }

      if (filters.anio) {
        sqlQuery += ' AND YEAR(cd.fecha_entrega) = ?';
        params.push(filters.anio);
      }

  // Ordenar por fecha de entrega descendente
  // Algunos motores/reportes de MySQL pueden fallar al bindear LIMIT/OFFSET con placeholders.
  // Para evitar errores de "Incorrect arguments to mysqld_stmt_execute" insertamos los valores sanitizados directamente.
  sqlQuery += ` ORDER BY cd.fecha_entrega DESC LIMIT ${validLimit} OFFSET ${offset}`;

  // Debug: mostrar consulta y parámetros para detectar problemas con placeholders
  console.log('[CicloDotacionModel.getAll] SQL:', sqlQuery);
  console.log('[CicloDotacionModel.getAll] params:', params);

  const rows = await query(sqlQuery, params);

      // Contar total para paginación (aplicando mismos filtros)
      let countQuery = 'SELECT COUNT(*) as total FROM ciclo_dotacion WHERE 1=1';
      const countParams = [];
      
      if (filters.estado) {
        countQuery += ' AND estado = ?';
        countParams.push(filters.estado);
      }

      if (filters.anio) {
        countQuery += ' AND YEAR(fecha_entrega) = ?';
        countParams.push(filters.anio);
      }

      const countResult = await query(countQuery, countParams);

      return {
        ciclos: rows,
        total: countResult[0].total,
        page: validPage,
        limit: validLimit,
        totalPages: Math.ceil(countResult[0].total / validLimit)
      };
    } catch (error) {
      console.error('Error en CicloDotacionModel.getAll:', error);
      throw new Error(`Error al obtener ciclos: ${error.message}`);
    }
  }

  /**
   * Obtener ciclo por ID con detalles completos
   */
  static async getById(id_ciclo, connection = null) {
    const shouldRelease = !connection;
    const conn = connection || await getConnection();
    
    try {
      const [rows] = await conn.query(
        `SELECT 
          cd.*,
          u.username as creado_por_nombre,
          a1.nombre_area as nombre_produccion,
          a2.nombre_area as nombre_mercadista,
          CASE 
            WHEN CURDATE() < cd.fecha_inicio_ventana THEN 'fuera_ventana'
            WHEN CURDATE() BETWEEN cd.fecha_inicio_ventana AND cd.fecha_fin_ventana THEN 'en_ventana'
            ELSE 'ventana_cerrada'
          END as estado_ventana,
          (SELECT COUNT(*) FROM empleado_ciclo WHERE id_ciclo = cd.id_ciclo) as total_empleados,
          (SELECT COUNT(*) FROM empleado_ciclo WHERE id_ciclo = cd.id_ciclo AND estado = 'procesado') as procesados,
          (SELECT COUNT(*) FROM empleado_ciclo WHERE id_ciclo = cd.id_ciclo AND estado = 'entregado') as entregados,
          (SELECT COUNT(*) FROM empleado_ciclo WHERE id_ciclo = cd.id_ciclo AND estado = 'omitido') as omitidos
        FROM ciclo_dotacion cd
        LEFT JOIN usuario u ON cd.creado_por = u.id_usuario
        LEFT JOIN area a1 ON cd.id_area_produccion = a1.id_area
        LEFT JOIN area a2 ON cd.id_area_mercadista = a2.id_area
        WHERE cd.id_ciclo = ?`,
        [id_ciclo]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener ciclo: ${error.message}`);
    } finally {
      if (shouldRelease) {
        conn.release();
      }
    }
  }

  /**
   * Crear nuevo ciclo
   */
  static async create(data) {
    const connection = await getConnection();
    
    try {
      await connection.beginTransaction();

      // No permitir crear si ya existe un ciclo activo
      const [activos] = await connection.query(
        'SELECT id_ciclo FROM ciclo_dotacion WHERE estado = "activo" LIMIT 1'
      );
      if (activos.length > 0) {
        throw new Error('Ya existe un ciclo activo. Cierre el ciclo actual para crear uno nuevo.');
      }

      const {
        nombre_ciclo,
        fecha_entrega,
        fecha_inicio_ventana,
        fecha_fin_ventana,
        id_area_produccion,
        id_area_mercadista,
        valor_smlv_aplicado,
        creado_por,
        observaciones
      } = data;

      // Insertar ciclo
      const [result] = await connection.query(
        `INSERT INTO ciclo_dotacion (
          nombre_ciclo, fecha_entrega, fecha_inicio_ventana, fecha_fin_ventana,
          estado, id_area_produccion, id_area_mercadista, valor_smlv_aplicado,
          creado_por, observaciones
        ) VALUES (?, ?, ?, ?, 'activo', ?, ?, ?, ?, ?)`,
        [
          nombre_ciclo,
          fecha_entrega,
          fecha_inicio_ventana,
          fecha_fin_ventana,
          id_area_produccion,
          id_area_mercadista,
          valor_smlv_aplicado,
          creado_por,
          observaciones
        ]
      );

      await connection.commit();
      return { id_ciclo: result.insertId };
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error al crear ciclo: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  /**
   * Actualizar estado del ciclo y procesar empleados si se activa
   */
  static async updateEstado(id_ciclo, estado) {
    const connection = await getConnection();
    try {
      await connection.query('SET SESSION innodb_lock_wait_timeout = 120');
      await connection.beginTransaction();

      // Validar estado destino permitido
      const estadosPermitidos = ['activo', 'cerrado'];
      if (!estadosPermitidos.includes(estado)) {
        throw new Error('Estado no válido. Solo se permite "activo" o "cerrado"');
      }

      // Activar: garantizar unicidad
      if (estado === 'activo') {
        const [otros] = await connection.query(
          'SELECT id_ciclo FROM ciclo_dotacion WHERE estado = "activo" AND id_ciclo != ?',
          [id_ciclo]
        );
        if (otros.length > 0) {
          throw new Error('Ya existe un ciclo activo. Cierre el ciclo actual antes de activar otro.');
        }
      }

      await connection.query(
        'UPDATE ciclo_dotacion SET estado = ? WHERE id_ciclo = ?',
        [estado, id_ciclo]
      );

      // Al activar: asignar empleados elegibles automáticamente
      if (estado === 'activo') {
        // Procesar empleados usando la misma conexión
        const [empleadosElegibles] = await connection.query(`
          SELECT e.*, a.id_area, k.id_kit
          FROM empleado e
          INNER JOIN area a ON e.id_area = a.id_area
          INNER JOIN kitdotacion k ON k.id_area = a.id_area AND k.activo = 1
          WHERE e.estado = 1 
          AND NOT EXISTS (
            SELECT 1 FROM empleado_ciclo ec 
            WHERE ec.id_empleado = e.id_empleado 
            AND ec.id_ciclo = ?
          )`, [id_ciclo]);

        for (const empleado of empleadosElegibles) {
          await connection.query(`
            INSERT INTO empleado_ciclo (
              id_ciclo, 
              id_empleado,
              id_kit,
              fecha_asignacion,
              estado,
              observaciones,
              antiguedad_meses,
              sueldo_al_momento,
              id_area
            ) VALUES (?, ?, ?, NOW(), 'procesado', 'Asignación automática por ciclo', 0, ?, ?)`,
            [id_ciclo, empleado.id_empleado, empleado.id_kit, empleado.sueldo, empleado.id_area]
          );
        }

        await connection.query(
          'UPDATE ciclo_dotacion SET total_empleados_elegibles = ? WHERE id_ciclo = ?',
          [empleadosElegibles.length, id_ciclo]
        );
      }

      // Al cerrar: no se eliminan asignaciones, solo se marca estado. (Posible hook futuro)

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error al actualizar estado: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  /**
   * Procesar empleados elegibles para el ciclo
   */
  static async procesarEmpleadosElegibles(id_ciclo) {
    const connection = await getConnection();
    try {
      await connection.query('SET SESSION innodb_lock_wait_timeout = 120');
      await connection.beginTransaction();

      // 1. Obtener ciclo actual
      const ciclo = await this.getById(id_ciclo);
      if (!ciclo) throw new Error('Ciclo no encontrado');

      // 2. Validar empleados elegibles según parámetros
      const [empleadosElegibles] = await connection.query(`
        SELECT e.*, a.id_area, k.id_kit
        FROM empleado e
        INNER JOIN area a ON e.id_area = a.id_area
        INNER JOIN kitdotacion k ON k.id_area = a.id_area AND k.activo = 1
        WHERE e.estado = 1 
        AND NOT EXISTS (
          SELECT 1 FROM empleado_ciclo ec 
          WHERE ec.id_empleado = e.id_empleado 
          AND ec.id_ciclo = ?
        )`, [id_ciclo]);

      // 3. Crear entregas automáticamente
      for (const empleado of empleadosElegibles) {
        await connection.query(`
          INSERT INTO empleado_ciclo (
            id_ciclo, 
            id_empleado,
            id_kit,
            fecha_asignacion,
            estado,
            observaciones,
            antiguedad_meses,
            sueldo_al_momento,
            id_area
          ) VALUES (?, ?, ?, NOW(), 'procesado', 'Asignación automática por ciclo', 0, ?, ?)`,
          [id_ciclo, empleado.id_empleado, empleado.id_kit, empleado.sueldo, empleado.id_area]
        );
      }

      // 4. Actualizar total de empleados en el ciclo
      await this.updateTotalEmpleados(id_ciclo, empleadosElegibles.length);

      await connection.commit();
      return empleadosElegibles.length;
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error al procesar empleados: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  /**
   * Actualizar total de empleados elegibles
   */
  static async updateTotalEmpleados(id_ciclo, total) {
    try {
      const result = await query(
        'UPDATE ciclo_dotacion SET total_empleados_elegibles = ? WHERE id_ciclo = ?',
        [total, id_ciclo]
      );
      return result;
    } catch (error) {
      throw new Error(`Error al actualizar total de empleados: ${error.message}`);
    }
  }

  /**
   * Obtener ciclo activo actual (en ventana de ejecución)
   */
  static async getCicloActivo() {
    try {
      const rows = await query(
        `SELECT cd.*, 
          CASE 
            WHEN CURDATE() BETWEEN cd.fecha_inicio_ventana AND cd.fecha_fin_ventana THEN TRUE
            ELSE FALSE
          END as en_ventana
        FROM ciclo_dotacion cd
        WHERE cd.estado = 'activo'
          AND CURDATE() BETWEEN cd.fecha_inicio_ventana AND cd.fecha_fin_ventana
        ORDER BY cd.fecha_entrega ASC
        LIMIT 1`
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener ciclo activo: ${error.message}`);
    }
  }

  /**
   * Verificar si se puede crear un ciclo (validar ventana)
   */
  static async validarVentana(fecha_entrega) {
    try {
      const fecha_inicio_ventana = new Date(fecha_entrega);
      fecha_inicio_ventana.setMonth(fecha_inicio_ventana.getMonth() - 1);

      const hoy = new Date();
      const fechaEntrega = new Date(fecha_entrega);

      return {
        puede_crear: hoy >= fecha_inicio_ventana && hoy <= fechaEntrega,
        fecha_inicio_ventana: fecha_inicio_ventana.toISOString().split('T')[0],
        fecha_fin_ventana: fecha_entrega,
        dias_restantes: Math.ceil((fechaEntrega - hoy) / (1000 * 60 * 60 * 24))
      };
    } catch (error) {
      throw new Error(`Error al validar ventana: ${error.message}`);
    }
  }

  /**
   * Eliminar ciclo (solo si no tiene empleados asignados)
   */
  static async delete(id_ciclo) {
    try {
      // Verificar que no tenga empleados
      const empleados = await query(
        'SELECT COUNT(*) as total FROM empleado_ciclo WHERE id_ciclo = ?',
        [id_ciclo]
      );

      if (empleados[0].total > 0) {
        throw new Error('No se puede eliminar: el ciclo tiene empleados asignados');
      }

      const result = await query(
        'DELETE FROM ciclo_dotacion WHERE id_ciclo = ?',
        [id_ciclo]
      );
      return result;
    } catch (error) {
      throw new Error(`Error al eliminar ciclo: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de ciclos
   */
  static async getEstadisticas() {
    try {
      const stats = await query(
        `SELECT 
          COUNT(*) as total_ciclos,
          SUM(CASE WHEN estado = 'activo' THEN 1 ELSE 0 END) as activos,
          SUM(CASE WHEN estado = 'cerrado' THEN 1 ELSE 0 END) as cerrados,
          SUM(total_empleados_elegibles) as total_empleados_dotados,
          (SELECT COUNT(*) FROM empleado_ciclo WHERE estado = 'entregado') as total_entregas_realizadas
        FROM ciclo_dotacion`
      );
      return stats[0];
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }
}

module.exports = CicloDotacionModel;
