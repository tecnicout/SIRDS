-- ============================================================================
-- Purge definitivo de TODOS los kits inactivos (activo = 0), sin tocar tablas
-- Borra en orden seguro respetando FKs. Incluye desactivación temporal de
-- SQL_SAFE_UPDATES por si tu cliente la tiene habilitada.
-- ============================================================================

-- USE sirds;
SELECT DATABASE() AS current_db;

SET @prev_safe_updates := @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 0;

START TRANSACTION;

-- Construir lista temporal de kits inactivos para evitar error 1093
DROP TEMPORARY TABLE IF EXISTS tmp_kits_inactivos;
CREATE TEMPORARY TABLE tmp_kits_inactivos (id_kit INT PRIMARY KEY);
INSERT INTO tmp_kits_inactivos (id_kit)
SELECT id_kit FROM kitdotacion WHERE activo = 0;

-- Si no hay kits inactivos, los DELETE siguientes afectarán 0 filas (comportamiento seguro)

-- Construir lista temporal de solicitudes que apuntan a esos kits
DROP TEMPORARY TABLE IF EXISTS tmp_solicitudes_kits;
CREATE TEMPORARY TABLE tmp_solicitudes_kits (id_solicitud INT PRIMARY KEY);
INSERT INTO tmp_solicitudes_kits (id_solicitud)
SELECT sd.id_solicitud
FROM solicituddotacion sd
JOIN tmp_kits_inactivos k ON k.id_kit = sd.id_kit;

-- 1) Borrar detalles de solicitudes (JOIN con tabla temporal)
DELETE dsd
FROM detallesolicituddotacion dsd
JOIN tmp_solicitudes_kits t ON t.id_solicitud = dsd.id_solicitud;

-- 2) Borrar solicitudes
DELETE sd
FROM solicituddotacion sd
JOIN tmp_solicitudes_kits t ON t.id_solicitud = sd.id_solicitud;

-- 3) Borrar mapeo área⇔kit
DELETE ark
FROM arearolkit ark
JOIN tmp_kits_inactivos k ON k.id_kit = ark.id_kit;

-- 4) Borrar detalles de kits
DELETE dk
FROM detallekitdotacion dk
JOIN tmp_kits_inactivos k ON k.id_kit = dk.id_kit;

-- 5) Borrar kits
DELETE kdt
FROM kitdotacion kdt
JOIN tmp_kits_inactivos k ON k.id_kit = kdt.id_kit;

-- Limpiar temporales
DROP TEMPORARY TABLE IF EXISTS tmp_solicitudes_kits;
DROP TEMPORARY TABLE IF EXISTS tmp_kits_inactivos;

COMMIT;

SET SQL_SAFE_UPDATES = @prev_safe_updates;

-- Comprobaciones
SELECT 'kits_inactivos_restantes' AS label, COUNT(*) AS cnt FROM kitdotacion WHERE activo = 0;
