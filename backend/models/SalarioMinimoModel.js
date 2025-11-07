const { pool, query } = require('../config/database');

class SalarioMinimoModel {
  /**
   * Obtener todos los salarios mínimos registrados
   */
  static async getAll() {
    try {
      const rows = await query(
        'SELECT * FROM salario_minimo ORDER BY anio DESC'
      );
      return Array.isArray(rows) ? rows : [];
    } catch (error) {
      throw new Error(`Error al obtener salarios mínimos: ${error.message}`);
    }
  }

  /**
   * Obtener salario mínimo por año
   */
  static async getByYear(anio) {
    try {
      const rows = await query(
        'SELECT * FROM salario_minimo WHERE anio = ?',
        [anio]
      );
      return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw new Error(`Error al obtener salario mínimo del año ${anio}: ${error.message}`);
    }
  }

  /**
   * Obtener salario mínimo del año actual
   */
  static async getCurrentYear() {
    try {
      const currentYear = new Date().getFullYear();
      return await this.getByYear(currentYear);
    } catch (error) {
      throw new Error(`Error al obtener salario mínimo actual: ${error.message}`);
    }
  }

  /**
   * Crear o actualizar salario mínimo
   */
  static async upsert(data) {
    const { anio, valor_mensual, creado_por, observaciones } = data;
    
    try {
      const result = await query(
        `INSERT INTO salario_minimo (anio, valor_mensual, creado_por, observaciones) 
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           valor_mensual = VALUES(valor_mensual),
           observaciones = VALUES(observaciones),
           fecha_actualizacion = CURRENT_TIMESTAMP`,
        [anio, valor_mensual, creado_por, observaciones]
      );
      return result;
    } catch (error) {
      throw new Error(`Error al guardar salario mínimo: ${error.message}`);
    }
  }

  /**
   * Calcular rango salarial elegible para un año
   */
  static async getRangoElegible(anio) {
    try {
      const smlv = await this.getByYear(anio);
      if (!smlv) {
        throw new Error(`No hay salario mínimo registrado para el año ${anio}`);
      }
      
      return {
        anio: smlv.anio,
        smlv: parseFloat(smlv.valor_mensual),
        minimo: parseFloat(smlv.valor_mensual), // 1 SMLV
        maximo: parseFloat(smlv.valor_mensual) * 2 // 2 SMLV
      };
    } catch (error) {
      throw new Error(`Error al calcular rango elegible: ${error.message}`);
    }
  }

  /**
   * Eliminar salario mínimo (solo si no está siendo usado en ciclos)
   */
  static async delete(anio) {
    try {
      // Verificar que no esté en uso
      const ciclos = await query(
        'SELECT COUNT(*) as total FROM ciclo_dotacion WHERE YEAR(fecha_entrega) = ?',
        [anio]
      );
      const totalEnUso = Array.isArray(ciclos) && ciclos[0] ? Number(ciclos[0].total) : 0;
      if (totalEnUso > 0) {
        throw new Error('No se puede eliminar: hay ciclos que usan este salario mínimo');
      }

      const result = await query(
        'DELETE FROM salario_minimo WHERE anio = ?',
        [anio]
      );
      return result;
    } catch (error) {
      throw new Error(`Error al eliminar salario mínimo: ${error.message}`);
    }
  }
}

module.exports = SalarioMinimoModel;
