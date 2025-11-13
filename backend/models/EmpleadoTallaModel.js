const { query } = require('../config/database');

/**
 * Persistencia de tallas seleccionadas por empleado para cada ítem de dotación.
 * Se usa una tabla de preferencia/última selección independiente del histórico de entregas.
 * Tabla sugerida (si no existe todavía):
 * CREATE TABLE IF NOT EXISTS empleado_talla_dotacion (
 *   id INT AUTO_INCREMENT PRIMARY KEY,
 *   id_empleado INT NOT NULL,
 *   id_dotacion INT NOT NULL,
 *   id_talla INT NOT NULL,
 *   fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 *   UNIQUE KEY uniq_empleado_dotacion (id_empleado, id_dotacion),
 *   FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado),
 *   FOREIGN KEY (id_dotacion) REFERENCES dotacion(id_dotacion),
 *   FOREIGN KEY (id_talla) REFERENCES talla(id_talla)
 * ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 */
class EmpleadoTallaModel {
  static async upsertPreferencia({ id_empleado, id_dotacion, id_talla }) {
    const sql = `
      INSERT INTO empleado_talla_dotacion (id_empleado, id_dotacion, id_talla)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE id_talla = VALUES(id_talla), fecha_actualizacion = CURRENT_TIMESTAMP
    `;
    const res = await query(sql, [id_empleado, id_dotacion, id_talla]);
    return res.affectedRows > 0;
  }

  static async upsertPreferenciasBatch(id_empleado, items) {
    if (!Array.isArray(items) || items.length === 0) return { updated: 0 };
    let updated = 0;
    for (const it of items) {
      if (!it || !it.id_dotacion || !it.id_talla) continue;
      const ok = await this.upsertPreferencia({ id_empleado, id_dotacion: Number(it.id_dotacion), id_talla: Number(it.id_talla) });
      if (ok) updated += 1;
    }
    return { updated };
  }

  static async getPreferencias(id_empleado) {
    const sql = `
      SELECT etd.id_dotacion, etd.id_talla, t.talla, t.tipo_articulo
      FROM empleado_talla_dotacion etd
      LEFT JOIN talla t ON t.id_talla = etd.id_talla
      WHERE etd.id_empleado = ?
    `;
    return query(sql, [id_empleado]);
  }
}

module.exports = EmpleadoTallaModel;
