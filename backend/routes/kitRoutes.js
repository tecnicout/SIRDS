const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');

// Obtener kit por área (incluye dotaciones del kit)
router.get('/area/:id_area', authMiddleware, async (req, res) => {
	try {
		const { id_area } = req.params;
		if (!id_area) return res.status(400).json({ success: false, message: 'id_area requerido' });

		// Obtener el kit asociado al área (si existe)
		const kitSql = `SELECT * FROM kitdotacion WHERE id_area = ? AND activo = 1 LIMIT 1`;
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

		// Debug log: en entornos de desarrollo imprime información útil
		if (process.env.NODE_ENV !== 'production') {
			try {
				console.log('[kitRoutes] area:', id_area, 'kit_id:', kit.id_kit, 'dotaciones_count:', (dotaciones || []).length, 'dotacion_ids:', (dotaciones || []).map(d => d.id_dotacion));
			} catch (dbgErr) {
				console.log('[kitRoutes] debug error:', dbgErr && dbgErr.message);
			}
		}

		res.json({ success: true, data: { kit, dotaciones }, message: 'Kit obtenido correctamente' });
	} catch (err) {
		console.error('Error al obtener kit por área:', err);
		res.status(500).json({ success: false, message: 'Error al obtener kit', error: err.message });
	}
});

// Registrar entrega de un kit completo para un empleado
router.post('/entregar', authMiddleware, async (req, res) => {
	// Inserción directa en entregadotacion (modelo sin tabla entregakit)
	const registrar = async ({ id_empleado, id_kit, fecha_entrega, observaciones, detalles, tallas_por_item, id_talla, id_genero, sinTallaId }) => {
		// Si aún no hay talla comodín y se necesita, crearla
		const ensureSinTalla = async (genero) => {
			if (!genero) return null;
			const rows = await query('SELECT id_talla FROM talla WHERE id_genero = ? AND tipo_articulo = ? AND talla = ? LIMIT 1', [genero, 'General', 'SIN_TALLA']);
			if (rows && rows.length > 0) return rows[0].id_talla;
			const ins = await query('INSERT INTO talla (tipo_articulo, talla, id_genero) VALUES (?, ?, ?)', ['General', 'SIN_TALLA', genero]);
			return ins.insertId;
		};

		if (sinTallaId === null || sinTallaId === undefined) {
			try { sinTallaId = await ensureSinTalla(id_genero); } catch (_) { sinTallaId = null; }
		}

		for (const item of detalles) {
			let id_talla_item = null;
			if (Array.isArray(tallas_por_item)) {
				const match = tallas_por_item.find(t => Number(t.id_dotacion) === Number(item.id_dotacion));
				if (match && match.id_talla) id_talla_item = match.id_talla;
			}
			if (!id_talla_item && item.talla_requerida == 1 && id_talla) {
				id_talla_item = id_talla;
			}
			const tallaAUsar = item.talla_requerida == 1 ? id_talla_item : sinTallaId;
			if (!tallaAUsar && item.talla_requerida != 1) {
				throw new Error(`No hay talla comodín para dotación ${item.id_dotacion} y la columna id_talla podría ser NOT NULL`);
			}
			await query(
				`INSERT INTO entregadotacion (id_empleado, id_dotacion, id_talla, cantidad, fecha_entrega, observaciones) VALUES (?, ?, ?, ?, ?, ?)`,
				[id_empleado, item.id_dotacion, tallaAUsar, item.cantidad_en_kit || 1, fecha_entrega, observaciones || '']
			);
		}
		return { success: true, payload: null, message: 'Entrega registrada correctamente' };
	};

	try {
		const { id_empleado, id_kit, fecha_entrega, observaciones, tallas_por_item, id_talla } = req.body;

		if (!id_empleado || !id_kit || !fecha_entrega) {
			return res.status(400).json({ success: false, message: 'id_empleado, id_kit y fecha_entrega son requeridos' });
		}

		// Obtener detalle del kit (artículos y cantidades)
		const detallesSql = `SELECT dk.id_dotacion, dk.cantidad as cantidad_en_kit, d.talla_requerida
							 FROM detallekitdotacion dk
							 INNER JOIN dotacion d ON dk.id_dotacion = d.id_dotacion
							 WHERE dk.id_kit = ?`;
		const detalles = await query(detallesSql, [id_kit]);

		if (!detalles || detalles.length === 0) {
			return res.status(400).json({ success: false, message: 'El kit no tiene artículos asociados' });
		}

		// Traer género del empleado (para generar una talla comodín si hiciera falta)
		let id_genero = null;
		try {
			const empRows = await query('SELECT id_genero FROM empleado WHERE id_empleado = ? LIMIT 1', [id_empleado]);
			if (empRows && empRows.length) id_genero = empRows[0].id_genero;
		} catch (e) {
			// opcional
		}

		// Helper: asegurar una talla comodín 'SIN_TALLA' por género (para esquemas con id_talla NOT NULL)
		const ensureSinTalla = async (genero) => {
			if (!genero) return null;
			const rows = await query('SELECT id_talla FROM talla WHERE id_genero = ? AND tipo_articulo = ? AND talla = ? LIMIT 1', [genero, 'General', 'SIN_TALLA']);
			if (rows && rows.length > 0) return rows[0].id_talla;
			const ins = await query('INSERT INTO talla (tipo_articulo, talla, id_genero) VALUES (?, ?, ?)', ['General', 'SIN_TALLA', genero]);
			return ins.insertId;
		};

		let sinTallaId = null; // se calculará bajo demanda

		// Validación previa: si hay artículos que requieren talla, asegurarnos de tener talla para cada uno
		for (const item of detalles) {
			if (item.talla_requerida == 1) {
				let tallaAsignada = null;
				if (Array.isArray(tallas_por_item)) {
					const match = tallas_por_item.find(t => Number(t.id_dotacion) === Number(item.id_dotacion));
					if (match && match.id_talla) tallaAsignada = match.id_talla;
				}
				if (!tallaAsignada && id_talla) {
					tallaAsignada = id_talla;
				}
				if (!tallaAsignada) {
					return res.status(400).json({ success: false, message: `Falta seleccionar talla para la dotación ${item.id_dotacion} del kit` });
				}
			} else {
				// preparar talla comodín si la columna id_talla fuese NOT NULL
				if (sinTallaId === null) {
					try { sinTallaId = await ensureSinTalla(id_genero); } catch (e) { sinTallaId = null; }
				}
			}
		}

		const legacy = await registrar({ id_empleado, id_kit, fecha_entrega, observaciones, detalles, tallas_por_item, id_talla, id_genero, sinTallaId });

		// --- Sincronizar entrega con ciclo activo ---
		// Objetivo: al registrar entrega de kit, marcar estado 'entregado' en empleado_ciclo
		// y asegurar id_kit asociado para que las estadísticas del ciclo (entregados, procesados) reflejen el cambio.
		try {
			// 1) Obtener ciclo activo (el mismo criterio que otros modelos: estado = 'activo')
			const cicloRows = await query(`SELECT id_ciclo FROM ciclo_dotacion WHERE estado = 'activo' ORDER BY id_ciclo DESC LIMIT 1`);
			if (Array.isArray(cicloRows) && cicloRows.length > 0) {
				const id_ciclo_activo = cicloRows[0].id_ciclo;
				// 2) Localizar registro empleado_ciclo
				const ecRows = await query(`SELECT id_empleado_ciclo, estado, id_kit FROM empleado_ciclo WHERE id_ciclo = ? AND id_empleado = ? LIMIT 1`, [id_ciclo_activo, id_empleado]);
				if (Array.isArray(ecRows) && ecRows.length > 0) {
					const ec = ecRows[0];
					// 3) Actualizar estado -> 'entregado' solo si aún no está entregado; set id_kit si falta
					// Nota: mantenemos otros estados 'omitido' si existiera, pero priorizamos marcar entrega real.
					const nuevoKitId = ec.id_kit || id_kit || null;
					await query(`UPDATE empleado_ciclo SET estado = 'entregado', id_kit = ?, fecha_entrega_real = CURDATE(), fecha_actualizacion = NOW(), actualizado_por = ?, observaciones = COALESCE(?, observaciones) WHERE id_empleado_ciclo = ?`, [nuevoKitId, (req.usuario && req.usuario.id_usuario) || null, observaciones || null, ec.id_empleado_ciclo]);
					// 4) Opcional: devolver flag indicando sincronización
					return res.json({ success: true, data: { ciclo_sync: true }, message: `${legacy.message} y sincronizado con ciclo activo` });
				} else {
					// No existe registro en empleado_ciclo (posible empleado fuera del ciclo actual)
					return res.json({ success: legacy.success, data: { ciclo_sync: false }, message: `${legacy.message}. (Empleado no está en ciclo activo)` });
				}
			} else {
				// Sin ciclo activo
				return res.json({ success: legacy.success, data: { ciclo_sync: false }, message: `${legacy.message}. (No hay ciclo activo)` });
			}
		} catch (syncErr) {
			console.error('[kitRoutes:/entregar] Error sincronizando con ciclo:', syncErr.message);
			// Devolver éxito de entrega aunque falle sincronización para no bloquear operación principal
			return res.json({ success: legacy.success, data: { ciclo_sync: false, error_sync: syncErr.message }, message: `${legacy.message}. (Error al sincronizar ciclo)` });
		}
	} catch (error) {
		console.error('Error al registrar entrega del kit:', error);
		return res.status(500).json({ success: false, message: 'Error al registrar entrega del kit', error: error.message });
	}
});

// Crear un nuevo kit y sus detalles, asignándolo a un área
router.post('/create', authMiddleware, async (req, res) => {
	try {
		const { nombre, id_area, detalles } = req.body;

		if (!nombre || !id_area) {
			return res.status(400).json({ success: false, message: 'nombre e id_area son requeridos' });
		}

		// Insertar kit
		const insertKitSql = `INSERT INTO kitdotacion (nombre, id_area, activo) VALUES (?, ?, 1)`;
		const result = await query(insertKitSql, [nombre, id_area]);
		const newKitId = result.insertId;

		// Insertar detalles si vienen
		if (Array.isArray(detalles) && detalles.length > 0) {
			const queries = detalles.map(item => ({
				sql: `INSERT INTO detallekitdotacion (id_kit, id_dotacion, cantidad) VALUES (?, ?, ?)`,
				params: [newKitId, item.id_dotacion, item.cantidad || 1]
			}));

			// Ejecutar en transacción
			await transaction(queries);
		}

		// Debug log
		if (process.env.NODE_ENV !== 'production') {
			console.log('[kitRoutes] kit creado:', { newKitId, nombre, id_area, detalles_count: (detalles || []).length });
		}

		return res.json({ success: true, data: { id_kit: newKitId }, message: 'Kit creado correctamente' });
	} catch (error) {
		console.error('Error al crear kit:', error);
		return res.status(500).json({ success: false, message: 'Error al crear kit', error: error.message });
	}
});

module.exports = router;

// Endpoint para obtener directamente las áreas desde la tabla `area` (usado por KitManager)
router.get('/areas', async (req, res) => {
	try {
		const sql = `SELECT id_area, nombre_area, estado FROM area ORDER BY nombre_area ASC`;
		const areas = await query(sql);
		// Log para depuración rápida: cuántas áreas devuelve la consulta
		if (process.env.NODE_ENV !== 'production') {
			try { console.log('[kitRoutes:/areas] areas_count:', (areas || []).length); } catch(e) {}
		}
		return res.json({ success: true, data: areas, message: 'Áreas obtenidas correctamente' });
	} catch (err) {
		console.error('Error al obtener áreas desde kitRoutes:', err);
		return res.status(500).json({ success: false, message: 'Error al obtener áreas', error: err.message });
	}
});

// Listar todos los kits (con conteo de items) [PÚBLICO para facilitar visualización en UI]
router.get('/', async (req, res) => {
	try {
		const sql = `
			SELECT k.id_kit, k.nombre, k.id_area, k.activo, a.nombre_area,
				(SELECT COUNT(*) FROM detallekitdotacion dk WHERE dk.id_kit = k.id_kit) as items_count
			FROM kitdotacion k
			LEFT JOIN area a ON a.id_area = k.id_area
			WHERE k.activo = 1
			ORDER BY k.id_kit DESC
		`;
		const kits = await query(sql);
		if (process.env.NODE_ENV !== 'production') {
			try { console.log('[kitRoutes:/] kits_count:', (kits || []).length); } catch(e) {}
		}
		return res.json({ success: true, data: kits, message: 'Kits listados correctamente' });
	} catch (err) {
		console.error('Error al listar kits:', err);
		return res.status(500).json({ success: false, message: 'Error al listar kits', error: err.message });
	}
});

// Obtener un kit con sus detalles [PÚBLICO para facilitar visualización en UI]
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const kitSql = `SELECT id_kit, nombre, id_area, activo FROM kitdotacion WHERE id_kit = ? LIMIT 1`;
		const kits = await query(kitSql, [id]);
		if (!kits || kits.length === 0) return res.status(404).json({ success: false, message: 'Kit no encontrado' });
		const kit = kits[0];

		const detallesSql = `
			SELECT dk.id_detalle, dk.id_dotacion, dk.cantidad, d.nombre_dotacion
			FROM detallekitdotacion dk
			LEFT JOIN dotacion d ON d.id_dotacion = dk.id_dotacion
			WHERE dk.id_kit = ?
			ORDER BY d.nombre_dotacion
		`;
		const detalles = await query(detallesSql, [id]);

		return res.json({ success: true, data: { kit, detalles }, message: 'Kit obtenido correctamente' });
	} catch (err) {
		console.error('Error al obtener kit:', err);
		return res.status(500).json({ success: false, message: 'Error al obtener kit', error: err.message });
	}
});

// Actualizar un kit y sus detalles (reemplaza detalles existentes)
router.put('/:id', authMiddleware, async (req, res) => {
	try {
		const { id } = req.params;
		const { nombre, id_area, detalles } = req.body;
		if (!nombre || !id_area) return res.status(400).json({ success: false, message: 'nombre e id_area son requeridos' });

		// Actualizar metadata del kit
		const updateSql = `UPDATE kitdotacion SET nombre = ?, id_area = ? WHERE id_kit = ?`;
		await query(updateSql, [nombre, id_area, id]);

		// Reemplazar detalles en transacción: eliminar existentes e insertar nuevos
		const deleteSql = { sql: 'DELETE FROM detallekitdotacion WHERE id_kit = ?', params: [id] };
		const inserts = Array.isArray(detalles) ? detalles.map(d => ({ sql: 'INSERT INTO detallekitdotacion (id_kit, id_dotacion, cantidad) VALUES (?, ?, ?)', params: [id, d.id_dotacion, d.cantidad || 1] })) : [];
		await transaction([deleteSql, ...inserts]);

		return res.json({ success: true, message: 'Kit actualizado correctamente' });
	} catch (err) {
		console.error('Error al actualizar kit:', err);
		return res.status(500).json({ success: false, message: 'Error al actualizar kit', error: err.message });
	}
});

// Eliminar un kit (elimina detalles y el kit)
// Eliminación lógica de un kit (más segura frente a claves foráneas)
router.delete('/:id', authMiddleware, async (req, res) => {
	try {
		const { id } = req.params;
		// En lugar de eliminar físicamente (que puede fallar por FKs como solicituddotacion/arearolkit),
		// marcamos el kit como inactivo. Mantener los detalles permite reactivar si es necesario.
		await query('UPDATE kitdotacion SET activo = 0 WHERE id_kit = ?', [id]);
		return res.json({ success: true, message: 'Kit eliminado correctamente' });
	} catch (err) {
		console.error('Error al eliminar kit:', err);
		return res.status(500).json({ success: false, message: 'Error al eliminar kit', error: err.message });
	}
});