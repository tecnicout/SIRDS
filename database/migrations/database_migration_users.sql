-- ==========================================
-- REESTRUCTURACIÓN DEL SISTEMA DE AUTENTICACIÓN
-- SIRDS - Separación de Empleado y Usuario
-- ==========================================

USE SIRDS;

-- ==========================================
-- 1. CREAR TABLA USUARIO
-- ==========================================

CREATE TABLE Usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    id_empleado INT NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol_sistema ENUM('administrador', 'recursos_humanos', 'almacen') NOT NULL,
    activo BOOLEAN DEFAULT 1,
    ultimo_acceso DATETIME NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    creado_por INT NULL,
    FOREIGN KEY (id_empleado) REFERENCES Empleado(id_empleado) ON DELETE CASCADE,
    FOREIGN KEY (creado_por) REFERENCES Usuario(id_usuario) ON DELETE SET NULL,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_activo (activo),
    INDEX idx_rol_sistema (rol_sistema)
);

-- ==========================================
-- 2. AGREGAR COLUMNAS DE AUDITORÍA A EMPLEADO
-- ==========================================

-- Verificar si la columna password existe en Empleado
SET @column_exists = 0;
SELECT COUNT(*) INTO @column_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'SIRDS' 
  AND TABLE_NAME = 'Empleado' 
  AND COLUMN_NAME = 'password';

-- Agregar columnas de auditoría si no existen
ALTER TABLE Empleado 
ADD COLUMN IF NOT EXISTS fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT 1;

-- ==========================================
-- 3. CREAR VISTA PARA USUARIOS CON EMPLEADOS
-- ==========================================

CREATE OR REPLACE VIEW VistaUsuariosCompleta AS
SELECT 
    u.id_usuario,
    u.username,
    u.email as email_usuario,
    u.rol_sistema,
    u.activo as usuario_activo,
    u.ultimo_acceso,
    u.fecha_creacion as fecha_creacion_usuario,
    e.id_empleado,
    e.nombre,
    e.apellido,
    e.email as email_empleado,
    e.telefono,
    e.cargo,
    e.estado as empleado_activo,
    g.nombre as genero_nombre,
    a.nombre_area,
    r.nombre_rol,
    u_loc.nombre as ubicacion_nombre,
    u_loc.id_ubicacion,
    creador.username as creado_por_username
FROM Usuario u
INNER JOIN Empleado e ON u.id_empleado = e.id_empleado
LEFT JOIN Genero g ON e.id_genero = g.id_genero
LEFT JOIN Area a ON e.id_area = a.id_area
LEFT JOIN Rol r ON e.id_rol = r.id_rol
LEFT JOIN Ubicacion u_loc ON a.id_ubicacion = u_loc.id_ubicacion
LEFT JOIN Usuario creador ON u.creado_por = creador.id_usuario;

-- ==========================================
-- 4. MIGRACIÓN DE DATOS EXISTENTES
-- ==========================================

-- Buscar empleados que tienen password (usuarios actuales del sistema)
-- Esto debe ejecutarse DESPUÉS de crear los usuarios manualmente

-- Usuario administrador por defecto (basado en murcia21.gmz@gmail.com)
-- NOTA: Este INSERT debe ejecutarse después de identificar qué empleados necesitan acceso

-- ==========================================
-- 5. PROCEDIMIENTOS ALMACENADOS PARA GESTIÓN
-- ==========================================

DELIMITER //

-- Procedimiento para crear nuevo usuario del sistema
CREATE PROCEDURE CrearUsuarioSistema(
    IN p_id_empleado INT,
    IN p_username VARCHAR(50),
    IN p_email VARCHAR(150),
    IN p_password_plain VARCHAR(255),
    IN p_rol_sistema ENUM('administrador', 'recursos_humanos', 'almacen'),
    IN p_creado_por INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Verificar que el empleado existe y está activo
    IF NOT EXISTS (SELECT 1 FROM Empleado WHERE id_empleado = p_id_empleado AND estado = 1) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El empleado no existe o no está activo';
    END IF;
    
    -- Verificar que no existe ya un usuario para este empleado
    IF EXISTS (SELECT 1 FROM Usuario WHERE id_empleado = p_id_empleado) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ya existe un usuario para este empleado';
    END IF;
    
    -- Crear el usuario (password debe llegar ya hasheado desde la aplicación)
    INSERT INTO Usuario (id_empleado, username, email, password, rol_sistema, creado_por) 
    VALUES (p_id_empleado, p_username, p_email, p_password_plain, p_rol_sistema, p_creado_por);
    
    COMMIT;
END //

-- Procedimiento para actualizar último acceso
CREATE PROCEDURE ActualizarUltimoAcceso(
    IN p_id_usuario INT
)
BEGIN
    UPDATE Usuario 
    SET ultimo_acceso = NOW() 
    WHERE id_usuario = p_id_usuario AND activo = 1;
END //

-- Procedimiento para desactivar usuario
CREATE PROCEDURE DesactivarUsuario(
    IN p_id_usuario INT,
    IN p_desactivado_por INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    UPDATE Usuario 
    SET activo = 0, fecha_actualizacion = NOW() 
    WHERE id_usuario = p_id_usuario;
    
    -- Registrar en historial
    INSERT INTO HistorialMovimientos (tabla_modificada, id_registro, tipo_movimiento, usuario_responsable, detalle_cambio)
    VALUES ('Usuario', p_id_usuario, 'DEACTIVATE', 
            (SELECT username FROM Usuario WHERE id_usuario = p_desactivado_por), 
            'Usuario desactivado');
    
    COMMIT;
END //

-- Función para verificar permisos de rol
CREATE FUNCTION VerificarPermisoRol(
    p_id_usuario INT,
    p_accion VARCHAR(50)
) RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_rol VARCHAR(20);
    DECLARE v_activo BOOLEAN;
    
    SELECT rol_sistema, activo INTO v_rol, v_activo
    FROM Usuario 
    WHERE id_usuario = p_id_usuario;
    
    -- Si el usuario no está activo, no tiene permisos
    IF v_activo = 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Administrador tiene todos los permisos
    IF v_rol = 'administrador' THEN
        RETURN TRUE;
    END IF;
    
    -- Recursos Humanos puede gestionar empleados y usuarios (excepto administradores)
    IF v_rol = 'recursos_humanos' AND p_accion IN ('gestionar_empleados', 'ver_reportes', 'gestionar_usuarios_rh') THEN
        RETURN TRUE;
    END IF;
    
    -- Almacén puede gestionar dotaciones, stock, solicitudes
    IF v_rol = 'almacen' AND p_accion IN ('gestionar_dotaciones', 'gestionar_stock', 'procesar_solicitudes', 'ver_reportes_almacen') THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END //

DELIMITER ;

-- ==========================================
-- 6. TRIGGERS PARA AUDITORÍA
-- ==========================================

-- Trigger para registrar cambios en Usuario
DELIMITER //
CREATE TRIGGER tr_usuario_audit_insert
AFTER INSERT ON Usuario
FOR EACH ROW
BEGIN
    INSERT INTO HistorialMovimientos (tabla_modificada, id_registro, tipo_movimiento, usuario_responsable, detalle_cambio)
    VALUES ('Usuario', NEW.id_usuario, 'INSERT', 
            (SELECT username FROM Usuario WHERE id_usuario = NEW.creado_por),
            CONCAT('Nuevo usuario creado: ', NEW.username, ' (', NEW.rol_sistema, ')'));
END //

CREATE TRIGGER tr_usuario_audit_update
AFTER UPDATE ON Usuario
FOR EACH ROW
BEGIN
    DECLARE cambios TEXT DEFAULT '';
    
    IF OLD.activo != NEW.activo THEN
        SET cambios = CONCAT(cambios, 'Estado: ', OLD.activo, ' -> ', NEW.activo, '; ');
    END IF;
    
    IF OLD.rol_sistema != NEW.rol_sistema THEN
        SET cambios = CONCAT(cambios, 'Rol: ', OLD.rol_sistema, ' -> ', NEW.rol_sistema, '; ');
    END IF;
    
    IF cambios != '' THEN
        INSERT INTO HistorialMovimientos (tabla_modificada, id_registro, tipo_movimiento, usuario_responsable, detalle_cambio)
        VALUES ('Usuario', NEW.id_usuario, 'UPDATE', NEW.username, cambios);
    END IF;
END //
DELIMITER ;

-- ==========================================
-- 7. ÍNDICES ADICIONALES PARA RENDIMIENTO
-- ==========================================

-- Índices en tabla Empleado para mejorar consultas de usuarios
CREATE INDEX idx_empleado_email ON Empleado(email);
CREATE INDEX idx_empleado_estado ON Empleado(estado);
CREATE INDEX idx_empleado_activo ON Empleado(activo);

-- ==========================================
-- 8. DATOS DE EJEMPLO PARA TESTING
-- ==========================================

-- IMPORTANTE: Los siguientes INSERTs son para ejemplo/testing
-- En producción, los usuarios deben crearse a través de la aplicación

-- Ejemplo de inserción de usuario administrador
-- (password = 'admin123' hasheado con bcrypt)
/*
INSERT INTO Usuario (id_empleado, username, email, password, rol_sistema, activo, creado_por) 
VALUES 
(1, 'admin', 'admin@arrozsonora.com', '$2a$10$ejemplo...', 'administrador', 1, NULL);
*/

-- ==========================================
-- 9. CLEANUP - ELIMINAR COLUMNA PASSWORD DE EMPLEADO
-- ==========================================

-- ADVERTENCIA: Solo ejecutar después de migrar completamente a tabla Usuario
-- y verificar que todo funciona correctamente

-- ALTER TABLE Empleado DROP COLUMN password;

COMMIT;

-- ==========================================
-- 10. VERIFICACIONES FINALES
-- ==========================================

-- Verificar estructura de tabla Usuario
DESCRIBE Usuario;

-- Verificar vista
SELECT * FROM VistaUsuariosCompleta LIMIT 1;

-- Verificar procedimientos
SHOW PROCEDURE STATUS WHERE Name LIKE '%Usuario%';

-- Verificar función
SHOW FUNCTION STATUS WHERE Name LIKE '%Permiso%';

SHOW TRIGGERS LIKE '%usuario%';

-- ==========================================
-- NOTAS IMPORTANTES:
-- ==========================================
/*
1. Este script crea la nueva estructura pero NO migra datos automáticamente
2. La migración de usuarios existentes debe hacerse manualmente identificando:
   - Qué empleados necesitan acceso al sistema
   - Qué rol del sistema debe tener cada uno
3. La columna password en Empleado se elimina al final del proceso
4. Los passwords deben hashearse con bcrypt desde la aplicación
5. Se incluyen procedimientos y triggers para auditoría y gestión
6. La vista VistaUsuariosCompleta facilita consultas complejas
*/