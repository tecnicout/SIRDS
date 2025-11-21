-- 2025-11-18_account_center.sql
-- Crea tablas auxiliares para el centro de cuenta (perfil, preferencias y notificaciones)

START TRANSACTION;

CREATE TABLE IF NOT EXISTS `usuario_perfil` (
  `id_usuario` INT NOT NULL,
  `avatar_url` VARCHAR(255) DEFAULT NULL,
  `avatar_color` VARCHAR(20) DEFAULT '#B39237',
  `telefono_alterno` VARCHAR(20) DEFAULT NULL,
  `extension` VARCHAR(10) DEFAULT NULL,
  `timezone` VARCHAR(60) DEFAULT 'America/Bogota',
  `bio` VARCHAR(255) DEFAULT NULL,
  `firma_digital` VARCHAR(255) DEFAULT NULL,
  `foto_actualizada_en` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  CONSTRAINT `fk_usuario_perfil_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `usuario_preferencias` (
  `id_usuario` INT NOT NULL,
  `idioma` VARCHAR(5) NOT NULL DEFAULT 'es',
  `tema` ENUM('claro','oscuro','sistema') NOT NULL DEFAULT 'sistema',
  `notificar_email` TINYINT(1) NOT NULL DEFAULT 1,
  `notificar_push` TINYINT(1) NOT NULL DEFAULT 0,
  `notificar_inventario` TINYINT(1) NOT NULL DEFAULT 1,
  `notificar_ciclos` TINYINT(1) NOT NULL DEFAULT 1,
  `resumen_semanal` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  CONSTRAINT `fk_usuario_preferencias_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `usuario_notificacion` (
  `id_notificacion` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT NOT NULL,
  `tipo` ENUM('sistema','inventario','ciclo','alerta') NOT NULL DEFAULT 'sistema',
  `titulo` VARCHAR(150) NOT NULL,
  `mensaje` TEXT NOT NULL,
  `metadata` JSON DEFAULT NULL,
  `leido` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `read_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id_notificacion`),
  KEY `idx_usuario_notificacion_usuario` (`id_usuario`),
  KEY `idx_usuario_notificacion_leido` (`leido`),
  CONSTRAINT `fk_usuario_notificacion_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Generar registros base para usuarios existentes
INSERT INTO usuario_preferencias (id_usuario)
SELECT u.id_usuario FROM usuario u
LEFT JOIN usuario_preferencias pref ON pref.id_usuario = u.id_usuario
WHERE pref.id_usuario IS NULL;

INSERT INTO usuario_perfil (id_usuario, avatar_color)
SELECT u.id_usuario, '#B39237' FROM usuario u
LEFT JOIN usuario_perfil perf ON perf.id_usuario = u.id_usuario
WHERE perf.id_usuario IS NULL;

-- Notificaciones de ejemplo para los usuarios actuales
INSERT INTO usuario_notificacion (id_usuario, tipo, titulo, mensaje)
SELECT u.id_usuario, 'sistema', 'Bienvenido al Centro de Cuenta', 'Ahora puedes actualizar tu perfil, preferencias y configurar alertas personalizadas.'
FROM usuario u
LEFT JOIN usuario_notificacion n ON n.id_usuario = u.id_usuario AND n.titulo = 'Bienvenido al Centro de Cuenta'
WHERE n.id_notificacion IS NULL;

COMMIT;
