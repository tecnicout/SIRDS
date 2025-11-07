-- ============================================================================
-- Purge definitivo de kits por IDs, sin eliminar tablas ni claves foráneas
-- Ejecuta en el esquema correcto (sirds). Elimina filas en el orden correcto.
-- Si MySQL Workbench bloquea por "Safe Updates", se desactiva temporalmente.
-- ============================================================================

-- 0) Asegúrate del esquema correcto
-- USE sirds;
SELECT DATABASE() AS current_db;

-- 1) (Opcional) Desactivar Safe Updates si estuviera activo en el cliente
SET @prev_safe_updates := @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 0;

-- =============================
-- PARÁMETROS: IDs de kits AQUÍ
-- =============================
SET @ids := '1,2,3,4'; -- cambia esta lista según necesites

START TRANSACTION;

-- Lista temporal de kits seleccionados por IDs (valida que existan)
DROP TEMPORARY TABLE IF EXISTS tmp_selected_kits;
CREATE TEMPORARY TABLE tmp_selected_kits (id_kit INT PRIMARY KEY);
INSERT INTO tmp_selected_kits (id_kit)
SELECT id_kit FROM kitdotacion WHERE FIND_IN_SET(id_kit, @ids);

-- Lista temporal de solicitudes de esos kits
DROP TEMPORARY TABLE IF EXISTS tmp_selected_solicitudes;
CREATE TEMPORARY TABLE tmp_selected_solicitudes (id_solicitud INT PRIMARY KEY);
INSERT INTO tmp_selected_solicitudes (id_solicitud)
SELECT sd.id_solicitud FROM solicituddotacion sd JOIN tmp_selected_kits k ON k.id_kit = sd.id_kit;

-- 2) Detalles de solicitudes
DELETE dsd
FROM detallesolicituddotacion dsd
JOIN tmp_selected_solicitudes t ON t.id_solicitud = dsd.id_solicitud;

-- 3) Solicitudes
DELETE sd
FROM solicituddotacion sd
JOIN tmp_selected_solicitudes t ON t.id_solicitud = sd.id_solicitud;

-- 4) Mapeo área⇔kit
DELETE ark
FROM arearolkit ark
JOIN tmp_selected_kits k ON k.id_kit = ark.id_kit;

-- 5) Detalles del kit
DELETE dk
FROM detallekitdotacion dk
JOIN tmp_selected_kits k ON k.id_kit = dk.id_kit;

-- 6) Finalmente, los kits
DELETE kdt
FROM kitdotacion kdt
JOIN tmp_selected_kits k ON k.id_kit = kdt.id_kit;

-- Limpiar temporales
DROP TEMPORARY TABLE IF EXISTS tmp_selected_solicitudes;
DROP TEMPORARY TABLE IF EXISTS tmp_selected_kits;

COMMIT;

-- 7) Restaurar Safe Updates a su valor anterior
SET SQL_SAFE_UPDATES = @prev_safe_updates;

-- 8) Verificaciones rápidas
SELECT 'kits_restantes' AS label, COUNT(*) AS cnt FROM kitdotacion WHERE FIND_IN_SET(id_kit, @ids);
SELECT 'solicitudes_restantes' AS label, COUNT(*) AS cnt FROM solicituddotacion WHERE FIND_IN_SET(id_kit, @ids);
SELECT 'arearolkit_restantes' AS label, COUNT(*) AS cnt FROM arearolkit WHERE FIND_IN_SET(id_kit, @ids);
SELECT 'detalles_kit_restantes' AS label, COUNT(*) AS cnt FROM detallekitdotacion WHERE FIND_IN_SET(id_kit, @ids);
