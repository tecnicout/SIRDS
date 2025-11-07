ALTER TABLE empleado_ciclo
ADD COLUMN id_kit INT AFTER id_empleado,
ADD FOREIGN KEY (id_kit) REFERENCES kitdotacion(id_kit);