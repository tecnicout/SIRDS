const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');

// Obtener kit por área (incluye dotaciones del kit)
router.get('/area/:id_area', authMiddleware, async (req, res) => {
	try {
		const { id_area } = req.params;
		if (!id_area) return res.status(400).json({ success: false, message: 'id_area requerido' });

		// Obtener el kit asociado al área (si existe)
		const kitSql = `SELECT * FROM kitdotacion WHERE id_area = ? LIMIT 1`;
		const kits = await query(kitSql, [id_area]);
		if (!kits || kits.length === 0) {
			return res.json({ success: true, data: { kit: null, dotaciones: [] }, message: 'No hay kit para esta área' });
		}
		const kit = kits[0];

		// Obtener dotaciones del kit
		const detallesSql = `
			SELECT d.id_dotacion, d.nombre_dotacion, d.descripcion, d.talla_requerida, d.unidad_medida, dk.cantidad as cantidad_en_kit
			FROM detallekitdotacion dk
			INNER JOIN dotacion d ON dk.id_dotacion = d.id_dotacion
			WHERE dk.id_kit = ?
			ORDER BY d.nombre_dotacion
		`;
		const dotaciones = await query(detallesSql, [kit.id_kit]);

		res.json({ success: true, data: { kit, dotaciones }, message: 'Kit obtenido correctamente' });
	} catch (err) {
		console.error('Error al obtener kit por área:', err);
		res.status(500).json({ success: false, message: 'Error al obtener kit', error: err.message });
	}
});

module.exports = router;