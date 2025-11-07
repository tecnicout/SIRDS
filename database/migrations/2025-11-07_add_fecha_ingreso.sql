-- Agregar campo fecha_ingreso a la tabla empleado
USE sirds;

-- Verificar si la columna ya existe
SET @exists = 0;
SELECT COUNT(*) INTO @exists 
FROM information_schema.columns 
WHERE table_schema = 'sirds' 
AND table_name = 'empleado' 
AND column_name = 'fecha_ingreso';

-- Agregar la columna si no existe
SET @sql = IF(@exists = 0,
    'ALTER TABLE empleado 
     ADD COLUMN fecha_ingreso DATE DEFAULT NULL,
     ADD INDEX idx_fecha_ingreso (fecha_ingreso)',
    'SELECT "Columna fecha_ingreso ya existe"');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Actualizar fechas de ingreso existentes
UPDATE empleado 
SET fecha_ingreso = DATE_SUB(CURDATE(), INTERVAL FLOOR(RAND() * 365 * 2) DAY)
WHERE fecha_ingreso IS NULL;