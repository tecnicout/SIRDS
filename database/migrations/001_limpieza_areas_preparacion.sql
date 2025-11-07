-- =====================================================
-- SCRIPT DE LIMPIEZA Y PREPARACIÓN DE DATOS
-- Fecha: 2025-11-06
-- Descripción: Consolidación de áreas duplicadas y 
--              preparación para sistema de ciclos
-- =====================================================

USE sirds;

-- =====================================================
-- PASO 1: VALIDACIÓN DE DATOS ACTUALES
-- =====================================================
SELECT 'ESTADO INICIAL - Áreas de Producción' as paso;
SELECT id_area, nombre_area, estado 
FROM area 
WHERE nombre_area = 'Producción';

SELECT 'Empleados usando cada área de Producción' as paso;
SELECT id_area, COUNT(*) as total_empleados 
FROM empleado 
WHERE id_area IN (1, 5)
GROUP BY id_area;

-- =====================================================
-- PASO 2: CONSOLIDACIÓN DE ÁREA PRODUCCIÓN
-- Migrar todos los registros de id_area=5 a id_area=1
-- =====================================================

-- Deshabilitar temporalmente las verificaciones de foreign key
SET FOREIGN_KEY_CHECKS = 0;

-- Actualizar empleados que usan id_area=5 a id_area=1
UPDATE empleado 
SET id_area = 1 
WHERE id_area = 5;

-- Actualizar stockdotacion si hay registros con id_area=5
UPDATE stockdotacion 
SET id_area = 1 
WHERE id_area = 5;

-- Actualizar kitdotacion si hay registros con id_area=5
UPDATE kitdotacion 
SET id_area = 1 
WHERE id_area = 5;

-- Actualizar arearolkit si hay registros con id_area=5
UPDATE arearolkit 
SET id_area = 1 
WHERE id_area = 5;

-- Verificar que no queden referencias al id_area=5
SELECT 'Verificación: Empleados con id_area=5 (debe ser 0)' as paso;
SELECT COUNT(*) as debe_ser_cero 
FROM empleado 
WHERE id_area = 5;

-- Eliminar el registro duplicado de área Producción
DELETE FROM area 
WHERE id_area = 5 AND nombre_area = 'Producción';

-- Reactivar verificaciones de foreign key
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- PASO 3: AGREGAR ÁREA MERCADISTA
-- =====================================================

-- Verificar si ya existe el área Mercadista
SELECT 'Verificando si existe área Mercadista' as paso;
SELECT id_area, nombre_area 
FROM area 
WHERE nombre_area LIKE '%Mercadista%' OR nombre_area LIKE '%mercadista%';

-- Insertar área Mercadista si no existe
-- Nota: Si ya existe, este INSERT fallará por el nombre único y no causará problemas
INSERT INTO area (nombre_area, estado) 
SELECT 'Mercadista', 'activa'
WHERE NOT EXISTS (
    SELECT 1 FROM area 
    WHERE nombre_area = 'Mercadista'
);

-- =====================================================
-- PASO 4: VALIDACIÓN FINAL
-- =====================================================

SELECT 'ESTADO FINAL - Áreas críticas para sistema de ciclos' as paso;
SELECT id_area, nombre_area, estado 
FROM area 
WHERE nombre_area IN ('Producción', 'Mercadista')
ORDER BY nombre_area;

SELECT 'Total empleados en Producción consolidado' as paso;
SELECT COUNT(*) as total_produccion 
FROM empleado 
WHERE id_area = 1;

SELECT 'Resumen de todas las áreas activas' as paso;
SELECT id_area, nombre_area, estado,
       (SELECT COUNT(*) FROM empleado e WHERE e.id_area = a.id_area) as total_empleados
FROM area a
WHERE estado = 'activa'
ORDER BY nombre_area;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. Este script consolida todas las referencias de Producción en id_area=1
-- 2. Se agrega el área Mercadista para el sistema de ciclos
-- 3. No se pierde ningún dato, solo se reorganiza
-- 4. Todas las foreign keys se mantienen íntegras
-- =====================================================
