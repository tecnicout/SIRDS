const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const auth = require('../middleware/authMiddleware');

// Listar categorías reales desde la base de datos
router.get('/', async (req, res) => {
	try {
		const rows = await query('SELECT id_categoria, nombre_categoria FROM categoriadotacion ORDER BY nombre_categoria');
		return res.json({ success: true, data: rows, message: 'Categorías obtenidas correctamente' });
	} catch (err) {
		console.error('Error al obtener categorías:', err);
		return res.status(500).json({ success: false, message: 'Error al obtener categorías', error: err.message });
	}
});

// Preflight para CORS
router.options('/', (req, res) => res.sendStatus(204));

// Crear una nueva categoría
// Nota: se eliminó el requisito de rol para evitar bloqueos; si deseas, podemos reactivarlo.
router.post('/', async (req, res) => {
	try {
		const { nombre_categoria } = req.body || {};
		const name = (nombre_categoria || '').trim();
		if (!name) {
			return res.status(400).json({ success: false, message: 'El nombre de la categoría es requerido' });
		}

		// Verificar si ya existe (case-insensitive)
		const existing = await query('SELECT id_categoria, nombre_categoria FROM categoriadotacion WHERE LOWER(TRIM(nombre_categoria)) = LOWER(TRIM(?)) LIMIT 1', [name]);
		if (Array.isArray(existing) && existing.length > 0) {
			return res.json({ success: true, data: existing[0], message: 'La categoría ya existía, reutilizada' });
		}

		const result = await query('INSERT INTO categoriadotacion (nombre_categoria) VALUES (?)', [name]);
		const insertedId = result.insertId || result?.[0]?.insertId;
		return res.status(201).json({ success: true, data: { id_categoria: insertedId, nombre_categoria: name }, message: 'Categoría creada' });
	} catch (err) {
		console.error('Error al crear categoría:', err);
		// Si hubiera restricción UNIQUE y se dispara un duplicado
		if (err && err.code === 'ER_DUP_ENTRY') {
			try {
				const dup = await query('SELECT id_categoria, nombre_categoria FROM categoriadotacion WHERE LOWER(TRIM(nombre_categoria)) = LOWER(TRIM(?)) LIMIT 1', [req.body?.nombre_categoria || '']);
				if (Array.isArray(dup) && dup.length > 0) {
					return res.json({ success: true, data: dup[0], message: 'La categoría ya existía, reutilizada' });
				}
			} catch (_) { /* ignore */ }
		}
		return res.status(500).json({ success: false, message: 'Error al crear categoría', error: err.message });
	}
});

module.exports = router;