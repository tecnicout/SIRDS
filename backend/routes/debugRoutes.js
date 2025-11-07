const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Rutas de diagnóstico - SOLO en desarrollo
router.get('/dbinfo', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, message: 'Debug route disabled in production' });
    }

    // Información básica de la conexión
  // Use USER() which is widely supported; avoid potential parsing issues with CURRENT_USER
  const infoRows = await query('SELECT DATABASE() AS database_name, @@hostname AS hostname, USER() AS current_user');
    const info = (infoRows && infoRows[0]) ? infoRows[0] : {};

    // Opcional: conteo de detallekitdotacion por id_kit o por id_area
    const result = { connection: info };

    const { id_kit, id_area } = req.query;
    if (id_kit) {
      const rows = await query('SELECT COUNT(*) AS total, GROUP_CONCAT(id_dotacion) AS dotacion_ids FROM detallekitdotacion WHERE id_kit = ?', [id_kit]);
      result.id_kit = id_kit;
      result.detallekit = rows && rows[0] ? rows[0] : { total: 0, dotacion_ids: null };
    }

    if (id_area) {
      // intentar encontrar el kit asociado al área
      const kitRows = await query('SELECT id_kit, nombre FROM kitdotacion WHERE id_area = ? LIMIT 1', [id_area]);
      result.id_area = id_area;
      result.kit_for_area = kitRows && kitRows[0] ? kitRows[0] : null;
      if (result.kit_for_area && result.kit_for_area.id_kit) {
        const dk = await query('SELECT COUNT(*) AS total, GROUP_CONCAT(id_dotacion) AS dotacion_ids FROM detallekitdotacion WHERE id_kit = ?', [result.kit_for_area.id_kit]);
        result.detallekit_for_area = dk && dk[0] ? dk[0] : { total: 0, dotacion_ids: null };
      }
    }

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error debug/dbinfo:', error && error.message);
    return res.status(500).json({ success: false, message: 'Error obteniendo info', error: error && error.message });
  }
});

module.exports = router;
