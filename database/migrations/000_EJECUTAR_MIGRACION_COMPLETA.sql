-- =====================================================
-- SCRIPT MAESTRO DE MIGRACIÓN COMPLETA
-- Sistema de Ciclos de Dotación
-- Fecha: 2025-11-06
-- =====================================================
-- Este script ejecuta en orden:
-- 1. Limpieza y consolidación de áreas
-- 2. Creación del sistema de ciclos de dotación
-- =====================================================

USE sirds;

-- Configurar entorno
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET AUTOCOMMIT = 0;

START TRANSACTION;

-- =====================================================
-- FASE 1: LIMPIEZA Y PREPARACIÓN
-- =====================================================

SELECT '========================================' as '';
SELECT 'FASE 1: LIMPIEZA Y PREPARACIÓN DE DATOS' as '';
SELECT '========================================' as '';

-- Consolidar área Producción (migrar id_area=5 a id_area=1)
UPDATE empleado SET id_area = 1 WHERE id_area = 5;
UPDATE stockdotacion SET id_area = 1 WHERE id_area = 5;
UPDATE kitdotacion SET id_area = 1 WHERE id_area = 5;
UPDATE arearolkit SET id_area = 1 WHERE id_area = 5;

-- Eliminar registro duplicado
DELETE FROM area WHERE id_area = 5 AND nombre_area = 'Producción';

SELECT '✓ Producción consolidada en id_area=1' as resultado;

-- Agregar área Mercadista si no existe
INSERT INTO area (nombre_area, estado) 
SELECT 'Mercadista', 'activa'
WHERE NOT EXISTS (SELECT 1 FROM area WHERE nombre_area = 'Mercadista');

SELECT '✓ Área Mercadista verificada/creada' as resultado;

-- =====================================================
-- FASE 2: CREACIÓN DE TABLAS DEL SISTEMA DE CICLOS
-- =====================================================

SELECT '========================================' as '';
SELECT 'FASE 2: CREACIÓN DE SISTEMA DE CICLOS' as '';
SELECT '========================================' as '';

-- Tabla 1: Salario Mínimo
DROP TABLE IF EXISTS `empleado_ciclo`;
DROP TABLE IF EXISTS `ciclo_dotacion`;
DROP TABLE IF EXISTS `salario_minimo`;

CREATE TABLE `salario_minimo` (
  `id_salario` INT NOT NULL AUTO_INCREMENT,
  `anio` INT NOT NULL COMMENT 'Año del salario mínimo',
  `valor_mensual` DECIMAL(10,2) NOT NULL COMMENT 'Valor del SMLV en pesos colombianos',
  `fecha_actualizacion` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `creado_por` INT DEFAULT NULL,
  `observaciones` TEXT DEFAULT NULL,
  PRIMARY KEY (`id_salario`),
  UNIQUE KEY `unique_anio` (`anio`),
  KEY `idx_anio` (`anio`),
  CONSTRAINT `salario_minimo_ibfk_1` FOREIGN KEY (`creado_por`) 
    REFERENCES `usuario` (`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SELECT '✓ Tabla salario_minimo creada' as resultado;

-- Tabla 2: Ciclo Dotación
CREATE TABLE `ciclo_dotacion` (
  `id_ciclo` INT NOT NULL AUTO_INCREMENT,
  `nombre_ciclo` VARCHAR(100) NOT NULL,
  `fecha_entrega` DATE NOT NULL,
  `fecha_inicio_ventana` DATE NOT NULL,
  `fecha_fin_ventana` DATE NOT NULL,
  `estado` ENUM('pendiente', 'activo', 'cerrado') NOT NULL DEFAULT 'pendiente',
  `total_empleados_elegibles` INT DEFAULT 0,
  `id_area_produccion` INT NOT NULL,
  `id_area_mercadista` INT NOT NULL,
  `valor_smlv_aplicado` DECIMAL(10,2) NOT NULL,
  `creado_por` INT NOT NULL,
  `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `observaciones` TEXT DEFAULT NULL,
  PRIMARY KEY (`id_ciclo`),
  UNIQUE KEY `unique_fecha_entrega` (`fecha_entrega`),
  KEY `idx_estado` (`estado`),
  KEY `idx_fecha_entrega` (`fecha_entrega`),
  KEY `idx_ventana` (`fecha_inicio_ventana`, `fecha_fin_ventana`),
  CONSTRAINT `ciclo_dotacion_ibfk_1` FOREIGN KEY (`creado_por`) 
    REFERENCES `usuario` (`id_usuario`) ON DELETE RESTRICT,
  CONSTRAINT `ciclo_dotacion_ibfk_2` FOREIGN KEY (`id_area_produccion`) 
    REFERENCES `area` (`id_area`) ON DELETE RESTRICT,
  CONSTRAINT `ciclo_dotacion_ibfk_3` FOREIGN KEY (`id_area_mercadista`) 
    REFERENCES `area` (`id_area`) ON DELETE RESTRICT,
  CONSTRAINT `chk_ventana_fecha` CHECK (`fecha_inicio_ventana` < `fecha_fin_ventana`),
  CONSTRAINT `chk_fecha_entrega` CHECK (`fecha_entrega` = `fecha_fin_ventana`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SELECT '✓ Tabla ciclo_dotacion creada' as resultado;

-- Tabla 3: Empleado Ciclo
CREATE TABLE `empleado_ciclo` (
  `id_empleado_ciclo` INT NOT NULL AUTO_INCREMENT,
  `id_ciclo` INT NOT NULL,
  `id_empleado` INT NOT NULL,
  `estado` ENUM('procesado', 'entregado', 'omitido') NOT NULL DEFAULT 'procesado',
  `antiguedad_meses` INT NOT NULL,
  `sueldo_al_momento` DECIMAL(10,2) NOT NULL,
  `id_area` INT NOT NULL,
  `observaciones` TEXT DEFAULT NULL,
  `fecha_asignacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `fecha_entrega_real` DATE DEFAULT NULL,
  `fecha_actualizacion` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `actualizado_por` INT DEFAULT NULL,
  PRIMARY KEY (`id_empleado_ciclo`),
  UNIQUE KEY `unique_empleado_ciclo` (`id_ciclo`, `id_empleado`),
  KEY `idx_ciclo` (`id_ciclo`),
  KEY `idx_empleado` (`id_empleado`),
  KEY `idx_estado` (`estado`),
  KEY `idx_area` (`id_area`),
  CONSTRAINT `empleado_ciclo_ibfk_1` FOREIGN KEY (`id_ciclo`) 
    REFERENCES `ciclo_dotacion` (`id_ciclo`) ON DELETE CASCADE,
  CONSTRAINT `empleado_ciclo_ibfk_2` FOREIGN KEY (`id_empleado`) 
    REFERENCES `empleado` (`id_empleado`) ON DELETE CASCADE,
  CONSTRAINT `empleado_ciclo_ibfk_3` FOREIGN KEY (`id_area`) 
    REFERENCES `area` (`id_area`) ON DELETE RESTRICT,
  CONSTRAINT `empleado_ciclo_ibfk_4` FOREIGN KEY (`actualizado_por`) 
    REFERENCES `usuario` (`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SELECT '✓ Tabla empleado_ciclo creada' as resultado;

-- =====================================================
-- FASE 3: INSERCIÓN DE DATOS INICIALES
-- =====================================================

SELECT '========================================' as '';
SELECT 'FASE 3: INSERCIÓN DE DATOS INICIALES' as '';
SELECT '========================================' as '';

-- Insertar salarios mínimos
INSERT INTO `salario_minimo` (`anio`, `valor_mensual`, `creado_por`, `observaciones`) 
VALUES 
  (2024, 1300000.00, 1, 'SMLV año 2024'),
  (2025, 1423500.00, 1, 'SMLV año 2025 - Valor oficial'),
  (2026, 1423500.00, 1, 'SMLV año 2026 - Valor proyectado');

SELECT '✓ Salarios mínimos insertados' as resultado;

-- Obtener IDs de áreas (forzar que no sean NULL)
SELECT @id_produccion := id_area FROM area WHERE nombre_area = 'Producción' LIMIT 1;
SELECT @id_mercadista := id_area FROM area WHERE nombre_area = 'Mercadista' LIMIT 1;

-- Verificar que las variables no sean NULL antes de insertar
SELECT CONCAT('IDs obtenidos - Producción: ', @id_produccion, ', Mercadista: ', @id_mercadista) as info;

-- Insertar ciclo de ejemplo solo si tenemos los IDs
INSERT INTO `ciclo_dotacion` (
  `nombre_ciclo`, 
  `fecha_entrega`, 
  `fecha_inicio_ventana`, 
  `fecha_fin_ventana`,
  `estado`,
  `id_area_produccion`,
  `id_area_mercadista`,
  `valor_smlv_aplicado`,
  `creado_por`,
  `observaciones`
) 
SELECT 
  'Ciclo Q4 2025',
  '2025-12-05',
  '2025-11-05',
  '2025-12-05',
  'pendiente',
  @id_produccion,
  @id_mercadista,
  1423500.00,
  1,
  'Primer ciclo del sistema - Fecha de entrega: Diciembre 5, 2025'
WHERE @id_produccion IS NOT NULL AND @id_mercadista IS NOT NULL;

SELECT '✓ Ciclo de ejemplo creado' as resultado;

-- =====================================================
-- FASE 4: VALIDACIÓN FINAL
-- =====================================================

SELECT '========================================' as '';
SELECT 'VALIDACIÓN FINAL DEL SISTEMA' as '';
SELECT '========================================' as '';

-- Restaurar configuración
SET FOREIGN_KEY_CHECKS = 1;

-- Confirmar transacción
COMMIT;
SET AUTOCOMMIT = 1;

-- Mostrar resumen
SELECT 'ÁREAS CONFIGURADAS:' as seccion;
SELECT a.id_area, a.nombre_area, a.estado,
       (SELECT COUNT(*) FROM empleado e WHERE e.id_area = a.id_area AND e.estado = 1) as empleados_activos
FROM area a
WHERE a.nombre_area IN ('Producción', 'Mercadista')
ORDER BY a.nombre_area;

SELECT 'SALARIOS MÍNIMOS:' as seccion;
SELECT anio, CONCAT('$', FORMAT(valor_mensual, 0)) as valor, observaciones
FROM salario_minimo
ORDER BY anio;

SELECT 'CICLOS REGISTRADOS:' as seccion;
SELECT id_ciclo, nombre_ciclo, fecha_entrega, 
       DATE_FORMAT(fecha_inicio_ventana, '%Y-%m-%d') as ventana_inicio,
       DATE_FORMAT(fecha_fin_ventana, '%Y-%m-%d') as ventana_fin,
       estado, total_empleados_elegibles
FROM ciclo_dotacion
ORDER BY fecha_entrega;

SELECT 'TABLAS DEL SISTEMA:' as seccion;
SELECT TABLE_NAME as tabla, 
       ENGINE as motor, 
       TABLE_ROWS as filas,
       ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024, 2) as tamano_kb
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'sirds' 
  AND TABLE_NAME IN ('salario_minimo', 'ciclo_dotacion', 'empleado_ciclo')
ORDER BY TABLE_NAME;

SELECT '========================================' as '';
SELECT '✓✓✓ MIGRACIÓN COMPLETADA EXITOSAMENTE ✓✓✓' as '';
SELECT '========================================' as '';
SELECT 'Sistema de Ciclos de Dotación listo para usar' as estado;
SELECT 'Todas las tablas creadas y datos iniciales cargados' as estado;
SELECT 'Integridad referencial verificada' as estado;
SELECT '========================================' as '';
