-- Script para agregar columna actualizado_por a la tabla Usuario
-- Ejecutar en la base de datos sirds

USE sirds;

-- Agregar columna actualizado_por después de creado_por
ALTER TABLE Usuario 
ADD COLUMN actualizado_por INT NULL AFTER creado_por;

-- Verificar la estructura actualizada
DESCRIBE Usuario;

-- Mensaje de confirmación
SELECT 'Columna actualizado_por agregada exitosamente a la tabla Usuario' as resultado;