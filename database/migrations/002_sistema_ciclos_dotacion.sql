-- =====================================================
-- MIGRACIÓN: Sistema de Gestión de Ciclos de Dotación
-- Versión: 1.0
-- Fecha: 2025-11-06
-- Descripción: Implementación de sistema automatizado de 
--              ciclos cuatrimestrales de dotación
-- =====================================================

USE sirds;

-- =====================================================
-- TABLA 1: Salario Mínimo Legal Vigente (SMLV)
-- =====================================================
-- Almacena valores históricos del SMLV por año para 
-- cálculos de elegibilidad (1-2 SMLV)
-- =====================================================

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci 
COMMENT='Registro histórico del Salario Mínimo Legal Vigente por año';

-- =====================================================
-- TABLA 2: Ciclos de Dotación
-- =====================================================
-- Gestiona los períodos cuatrimestrales de entrega de 
-- dotación con ventanas de ejecución de 1 mes
-- =====================================================

DROP TABLE IF EXISTS `ciclo_dotacion`;

CREATE TABLE `ciclo_dotacion` (
  `id_ciclo` INT NOT NULL AUTO_INCREMENT,
  `nombre_ciclo` VARCHAR(100) NOT NULL COMMENT 'Ej: Ciclo Q1 2025',
  `fecha_entrega` DATE NOT NULL COMMENT 'Fecha programada de entrega física',
  `fecha_inicio_ventana` DATE NOT NULL COMMENT 'Inicio ventana de ejecución (1 mes antes)',
  `fecha_fin_ventana` DATE NOT NULL COMMENT 'Fin ventana de ejecución (día de entrega)',
  `estado` ENUM('pendiente', 'activo', 'cerrado') NOT NULL DEFAULT 'pendiente',
  `total_empleados_elegibles` INT DEFAULT 0,
  `id_area_produccion` INT NOT NULL COMMENT 'ID del área Producción para elegibilidad',
  `id_area_mercadista` INT NOT NULL COMMENT 'ID del área Mercadista para elegibilidad',
  `valor_smlv_aplicado` DECIMAL(10,2) NOT NULL COMMENT 'SMLV usado para cálculo de elegibilidad',
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci 
COMMENT='Ciclos cuatrimestrales de entrega de dotación';

-- =====================================================
-- TABLA 3: Empleados por Ciclo
-- =====================================================
-- Relación empleado-ciclo con seguimiento de estado 
-- de entrega y snapshot de datos de elegibilidad
-- =====================================================

DROP TABLE IF EXISTS `empleado_ciclo`;

CREATE TABLE `empleado_ciclo` (
  `id_empleado_ciclo` INT NOT NULL AUTO_INCREMENT,
  `id_ciclo` INT NOT NULL,
  `id_empleado` INT NOT NULL,
  `estado` ENUM('procesado', 'entregado', 'omitido') NOT NULL DEFAULT 'procesado',
  `antiguedad_meses` INT NOT NULL COMMENT 'Antigüedad calculada al crear ciclo',
  `sueldo_al_momento` DECIMAL(10,2) NOT NULL COMMENT 'Sueldo del empleado al crear ciclo',
  `id_area` INT NOT NULL COMMENT 'Área del empleado al crear ciclo',
  `observaciones` TEXT DEFAULT NULL,
  `fecha_asignacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `fecha_entrega_real` DATE DEFAULT NULL COMMENT 'Fecha real de entrega física',
  `fecha_actualizacion` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `actualizado_por` INT DEFAULT NULL COMMENT 'Usuario que actualizó el estado',
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci 
COMMENT='Empleados elegibles por ciclo con estado de entrega';

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Insertar SMLV histórico y actual
INSERT INTO `salario_minimo` (`anio`, `valor_mensual`, `creado_por`, `observaciones`) 
VALUES 
  (2024, 1300000.00, 1, 'SMLV año 2024'),
  (2025, 1423500.00, 1, 'SMLV año 2025 - Valor oficial'),
  (2026, 1423500.00, 1, 'SMLV año 2026 - Valor proyectado (actualizar cuando se publique)');

-- Obtener IDs de áreas críticas para los ciclos
SET @id_produccion = (SELECT id_area FROM area WHERE nombre_area = 'Producción' LIMIT 1);
SET @id_mercadista = (SELECT id_area FROM area WHERE nombre_area = 'Mercadista' LIMIT 1);

-- Insertar ciclo de ejemplo: Diciembre 5, 2025
-- Ventana de ejecución: Noviembre 5 - Diciembre 5, 2025
-- Nota: Estado 'pendiente' hasta que se ejecute el botón "Nuevo Ciclo Dotación"
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
) VALUES (
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
);

-- =====================================================
-- VALIDACIÓN DE LA MIGRACIÓN
-- =====================================================

SELECT '✓ Migración completada exitosamente' as estado;

SELECT 'Tablas creadas:' as detalle;
SELECT TABLE_NAME, TABLE_ROWS, CREATE_TIME 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'sirds' 
  AND TABLE_NAME IN ('salario_minimo', 'ciclo_dotacion', 'empleado_ciclo')
ORDER BY TABLE_NAME;

SELECT 'Salarios mínimos registrados:' as detalle;
SELECT anio, valor_mensual, observaciones 
FROM salario_minimo 
ORDER BY anio;

SELECT 'Ciclos registrados:' as detalle;
SELECT id_ciclo, nombre_ciclo, fecha_entrega, 
       fecha_inicio_ventana, fecha_fin_ventana, 
       estado, total_empleados_elegibles
FROM ciclo_dotacion
ORDER BY fecha_entrega;

SELECT 'Áreas configuradas para ciclos:' as detalle;
SELECT a.id_area, a.nombre_area, 
       COUNT(e.id_empleado) as total_empleados
FROM area a
LEFT JOIN empleado e ON a.id_area = e.id_area AND e.estado = 1
WHERE a.nombre_area IN ('Producción', 'Mercadista')
GROUP BY a.id_area, a.nombre_area;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. Sistema listo para recibir lógica de negocio del backend
-- 2. Criterios de elegibilidad: Antigüedad ≥3 meses, Sueldo 1-2 SMLV, Áreas: Producción/Mercadista
-- 3. Ventana de ejecución: 1 mes antes de la fecha de entrega
-- 4. Estado inicial de empleados en ciclo: 'procesado'
-- 5. Frecuencia: Cada 4 meses (trimestral)
-- =====================================================
