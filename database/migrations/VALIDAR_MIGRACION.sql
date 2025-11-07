-- =====================================================
-- SCRIPT DE VALIDACIÓN POST-MIGRACIÓN
-- Verificación completa del sistema de ciclos
-- =====================================================

USE sirds;

SELECT '========================================' as '';
SELECT 'REPORTE DE VALIDACIÓN POST-MIGRACIÓN' as '';
SELECT '========================================' as '';
SELECT '' as '';

-- =====================================================
-- 1. VALIDACIÓN DE ÁREAS
-- =====================================================

SELECT '1. VALIDACIÓN DE ÁREAS CRÍTICAS' as seccion;
SELECT '-----------------------------------' as '';

SELECT 
  id_area,
  nombre_area,
  estado,
  (SELECT COUNT(*) FROM empleado e WHERE e.id_area = a.id_area AND e.estado = 1) as empleados_activos,
  (SELECT COUNT(*) FROM kitdotacion k WHERE k.id_area = a.id_area AND k.activo = 1) as kits_asignados,
  CASE 
    WHEN nombre_area = 'Producción' THEN '✓ CRÍTICA PARA CICLOS'
    WHEN nombre_area = 'Mercadista' THEN '✓ CRÍTICA PARA CICLOS'
    ELSE ''
  END as importancia
FROM area a
WHERE nombre_area IN ('Producción', 'Mercadista')
ORDER BY nombre_area;

-- Verificar que NO existe duplicado de Producción
SELECT 
  CASE 
    WHEN COUNT(*) = 1 THEN '✓ PASS: Solo existe 1 área de Producción'
    ELSE '❌ FAIL: Existen múltiples áreas de Producción'
  END as test_produccion_unica
FROM area
WHERE nombre_area = 'Producción';

-- Verificar que existe área Mercadista
SELECT 
  CASE 
    WHEN COUNT(*) >= 1 THEN '✓ PASS: Área Mercadista existe'
    ELSE '❌ FAIL: No se encontró área Mercadista'
  END as test_mercadista_existe
FROM area
WHERE nombre_area = 'Mercadista';

SELECT '' as '';

-- =====================================================
-- 2. VALIDACIÓN DE TABLAS CREADAS
-- =====================================================

SELECT '2. VALIDACIÓN DE NUEVAS TABLAS' as seccion;
SELECT '-----------------------------------' as '';

SELECT 
  TABLE_NAME as tabla,
  ENGINE as motor,
  TABLE_ROWS as filas_actuales,
  ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024, 2) as tamano_kb,
  CREATE_TIME as fecha_creacion
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'sirds' 
  AND TABLE_NAME IN ('salario_minimo', 'ciclo_dotacion', 'empleado_ciclo')
ORDER BY TABLE_NAME;

-- Verificar que existen las 3 tablas
SELECT 
  CASE 
    WHEN COUNT(*) = 3 THEN '✓ PASS: Las 3 tablas fueron creadas correctamente'
    ELSE CONCAT('❌ FAIL: Solo se crearon ', COUNT(*), ' de 3 tablas')
  END as test_tablas_creadas
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'sirds' 
  AND TABLE_NAME IN ('salario_minimo', 'ciclo_dotacion', 'empleado_ciclo');

SELECT '' as '';

-- =====================================================
-- 3. VALIDACIÓN DE FOREIGN KEYS
-- =====================================================

SELECT '3. VALIDACIÓN DE INTEGRIDAD REFERENCIAL' as seccion;
SELECT '-----------------------------------' as '';

SELECT 
  TABLE_NAME as tabla,
  CONSTRAINT_NAME as constraint_name,
  COLUMN_NAME as columna,
  REFERENCED_TABLE_NAME as tabla_referenciada,
  REFERENCED_COLUMN_NAME as columna_referenciada
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'sirds'
  AND TABLE_NAME IN ('salario_minimo', 'ciclo_dotacion', 'empleado_ciclo')
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, CONSTRAINT_NAME;

-- Contar foreign keys esperadas
SELECT 
  CASE 
    WHEN COUNT(*) >= 7 THEN CONCAT('✓ PASS: ', COUNT(*), ' foreign keys configuradas correctamente')
    ELSE CONCAT('⚠ WARNING: Solo ', COUNT(*), ' foreign keys encontradas (se esperaban 7+)')
  END as test_foreign_keys
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'sirds'
  AND TABLE_NAME IN ('salario_minimo', 'ciclo_dotacion', 'empleado_ciclo')
  AND REFERENCED_TABLE_NAME IS NOT NULL;

SELECT '' as '';

-- =====================================================
-- 4. VALIDACIÓN DE DATOS INICIALES
-- =====================================================

SELECT '4. VALIDACIÓN DE DATOS INICIALES' as seccion;
SELECT '-----------------------------------' as '';

-- Salarios mínimos
SELECT 
  anio,
  CONCAT('$', FORMAT(valor_mensual, 0)) as valor_formateado,
  valor_mensual,
  observaciones,
  CASE 
    WHEN anio = 2025 AND valor_mensual = 1423500.00 THEN '✓ CORRECTO'
    WHEN anio = 2025 THEN '⚠ REVISAR VALOR'
    ELSE ''
  END as validacion
FROM salario_minimo
ORDER BY anio;

SELECT 
  CASE 
    WHEN COUNT(*) >= 3 THEN CONCAT('✓ PASS: ', COUNT(*), ' registros de SMLV insertados')
    ELSE CONCAT('⚠ WARNING: Solo ', COUNT(*), ' registros de SMLV')
  END as test_smlv_insertado
FROM salario_minimo;

-- Ciclos
SELECT 
  id_ciclo,
  nombre_ciclo,
  fecha_entrega,
  DATE_FORMAT(fecha_inicio_ventana, '%Y-%m-%d') as ventana_inicio,
  DATE_FORMAT(fecha_fin_ventana, '%Y-%m-%d') as ventana_fin,
  DATEDIFF(fecha_fin_ventana, fecha_inicio_ventana) as dias_ventana,
  estado,
  total_empleados_elegibles,
  CONCAT('$', FORMAT(valor_smlv_aplicado, 0)) as smlv_usado,
  CASE 
    WHEN DATEDIFF(fecha_fin_ventana, fecha_inicio_ventana) = 30 THEN '✓ VENTANA CORRECTA (30 días)'
    ELSE '⚠ REVISAR VENTANA'
  END as validacion
FROM ciclo_dotacion
ORDER BY fecha_entrega;

SELECT 
  CASE 
    WHEN COUNT(*) >= 1 THEN '✓ PASS: Ciclo de ejemplo creado'
    ELSE '❌ FAIL: No se creó el ciclo de ejemplo'
  END as test_ciclo_ejemplo
FROM ciclo_dotacion;

SELECT '' as '';

-- =====================================================
-- 5. VALIDACIÓN DE ÍNDICES
-- =====================================================

SELECT '5. VALIDACIÓN DE ÍNDICES' as seccion;
SELECT '-----------------------------------' as '';

SELECT 
  TABLE_NAME as tabla,
  INDEX_NAME as indice,
  COLUMN_NAME as columna,
  NON_UNIQUE as no_unico,
  CASE 
    WHEN NON_UNIQUE = 0 THEN 'UNIQUE'
    ELSE 'INDEX'
  END as tipo
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'sirds'
  AND TABLE_NAME IN ('salario_minimo', 'ciclo_dotacion', 'empleado_ciclo')
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

SELECT '' as '';

-- =====================================================
-- 6. SIMULACIÓN DE ELEGIBILIDAD
-- =====================================================

SELECT '6. EMPLEADOS POTENCIALMENTE ELEGIBLES' as seccion;
SELECT '-----------------------------------' as '';
SELECT '(Basado en criterios: Antigüedad ≥3 meses, Sueldo 1-2 SMLV, Áreas: Producción/Mercadista)' as nota;
SELECT '' as '';

SET @smlv_2025 = (SELECT valor_mensual FROM salario_minimo WHERE anio = 2025);
SET @id_prod = (SELECT id_area FROM area WHERE nombre_area = 'Producción' LIMIT 1);
SET @id_merc = (SELECT id_area FROM area WHERE nombre_area = 'Mercadista' LIMIT 1);

SELECT 
  e.id_empleado,
  e.Identificacion,
  CONCAT(e.nombre, ' ', e.apellido) as nombre_completo,
  a.nombre_area as area,
  e.cargo,
  e.fecha_inicio,
  TIMESTAMPDIFF(MONTH, e.fecha_inicio, CURDATE()) as antiguedad_meses,
  CONCAT('$', FORMAT(e.sueldo, 0)) as sueldo,
  CASE 
    WHEN e.sueldo >= @smlv_2025 AND e.sueldo <= (@smlv_2025 * 2) THEN '✓ RANGO OK'
    WHEN e.sueldo < @smlv_2025 THEN '< 1 SMLV'
    ELSE '> 2 SMLV'
  END as validacion_sueldo,
  CASE 
    WHEN TIMESTAMPDIFF(MONTH, e.fecha_inicio, CURDATE()) >= 3 THEN '✓ ELEGIBLE'
    ELSE CONCAT('Faltan ', 3 - TIMESTAMPDIFF(MONTH, e.fecha_inicio, CURDATE()), ' meses')
  END as validacion_antiguedad
FROM empleado e
JOIN area a ON e.id_area = a.id_area
WHERE e.estado = 1
  AND e.id_area IN (@id_prod, @id_merc)
  AND e.sueldo > 0  -- Excluir empleados sin sueldo asignado
ORDER BY 
  a.nombre_area,
  TIMESTAMPDIFF(MONTH, e.fecha_inicio, CURDATE()) DESC;

-- Resumen de elegibilidad
SELECT 
  COUNT(*) as total_empleados_elegibles,
  COUNT(CASE WHEN a.nombre_area = 'Producción' THEN 1 END) as produccion,
  COUNT(CASE WHEN a.nombre_area = 'Mercadista' THEN 1 END) as mercadista
FROM empleado e
JOIN area a ON e.id_area = a.id_area
WHERE e.estado = 1
  AND e.id_area IN (@id_prod, @id_merc)
  AND e.sueldo > 0
  AND e.sueldo >= @smlv_2025
  AND e.sueldo <= (@smlv_2025 * 2)
  AND TIMESTAMPDIFF(MONTH, e.fecha_inicio, CURDATE()) >= 3;

SELECT '' as '';

-- =====================================================
-- 7. RESUMEN FINAL
-- =====================================================

SELECT '========================================' as '';
SELECT 'RESUMEN FINAL DE VALIDACIÓN' as '';
SELECT '========================================' as '';

SELECT 
  'Base de datos' as componente,
  'sirds' as valor,
  '✓ OK' as estado;

SELECT 
  'Área Producción' as componente,
  CONCAT('id_area=', @id_prod) as valor,
  CASE WHEN @id_prod IS NOT NULL THEN '✓ OK' ELSE '❌ ERROR' END as estado;

SELECT 
  'Área Mercadista' as componente,
  CONCAT('id_area=', @id_merc) as valor,
  CASE WHEN @id_merc IS NOT NULL THEN '✓ OK' ELSE '⚠ REVISAR' END as estado;

SELECT 
  'SMLV 2025' as componente,
  CONCAT('$', FORMAT(@smlv_2025, 0)) as valor,
  CASE WHEN @smlv_2025 = 1423500.00 THEN '✓ OK' ELSE '⚠ REVISAR' END as estado;

SELECT 
  'Tablas creadas' as componente,
  '3/3' as valor,
  '✓ OK' as estado
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'sirds' 
  AND TABLE_NAME IN ('salario_minimo', 'ciclo_dotacion', 'empleado_ciclo')
HAVING COUNT(*) = 3;

SELECT 
  'Ciclos registrados' as componente,
  COUNT(*) as valor,
  CASE WHEN COUNT(*) >= 1 THEN '✓ OK' ELSE '❌ ERROR' END as estado
FROM ciclo_dotacion;

SELECT '========================================' as '';
SELECT '✓ VALIDACIÓN COMPLETADA' as '';
SELECT 'Sistema listo para Fase 2: Backend' as '';
SELECT '========================================' as '';
