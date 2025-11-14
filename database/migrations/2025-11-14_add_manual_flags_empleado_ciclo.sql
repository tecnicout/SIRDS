ALTER TABLE empleado_ciclo
ADD COLUMN inclusion_manual TINYINT(1) NOT NULL DEFAULT 0 AFTER observaciones,
ADD COLUMN motivo_manual VARCHAR(255) NULL AFTER inclusion_manual;

UPDATE empleado_ciclo
SET inclusion_manual = COALESCE(inclusion_manual, 0)
WHERE inclusion_manual IS NULL;
