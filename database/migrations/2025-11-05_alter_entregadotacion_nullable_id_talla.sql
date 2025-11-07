-- Permitir entregas de dotación para artículos sin talla
-- Cambia id_talla a NULL en entregadotacion (antes: NOT NULL)

USE sirds;

ALTER TABLE entregadotacion
    MODIFY COLUMN id_talla INT NULL;

-- Verificación rápida
SHOW COLUMNS FROM entregadotacion LIKE 'id_talla';

-- Crear tabla de entregas por kit (padre) y relacionar los items
CREATE TABLE IF NOT EXISTS entregakit (
    id_entrega_kit INT NOT NULL AUTO_INCREMENT,
    id_empleado INT NOT NULL,
    id_kit INT NOT NULL,
    fecha_entrega DATE NOT NULL,
    observaciones TEXT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_entrega_kit),
    KEY idx_ek_empleado (id_empleado),
    KEY idx_ek_kit (id_kit),
    CONSTRAINT fk_ek_empleado FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado),
    CONSTRAINT fk_ek_kit FOREIGN KEY (id_kit) REFERENCES kitdotacion(id_kit)
);

-- Agregar columna de referencia en los items de entrega
ALTER TABLE entregadotacion
    ADD COLUMN IF NOT EXISTS id_entrega_kit INT NULL AFTER id_empleado,
    ADD KEY idx_entregadotacion_ek (id_entrega_kit),
    ADD CONSTRAINT fk_entregadotacion_ek FOREIGN KEY (id_entrega_kit) REFERENCES entregakit(id_entrega_kit) ON DELETE CASCADE;
