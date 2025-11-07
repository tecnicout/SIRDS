-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: sirds
-- ------------------------------------------------------
-- Server version	9.5.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '27519af4-b434-11f0-aee2-f439092d7bcb:1-444';

--
-- Table structure for table `area`
--

DROP TABLE IF EXISTS `area`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `area` (
  `id_area` int NOT NULL AUTO_INCREMENT,
  `nombre_area` varchar(100) NOT NULL,
  `estado` enum('activa','inactiva') DEFAULT 'activa',
  PRIMARY KEY (`id_area`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `area`
--

LOCK TABLES `area` WRITE;
/*!40000 ALTER TABLE `area` DISABLE KEYS */;
INSERT INTO `area` VALUES (1,'Producción','activa'),(2,'Administración','inactiva'),(3,'Mantenimiento','activa'),(4,'Calidad','activa'),(6,'Administración','inactiva'),(7,'Almacén Principal','inactiva'),(8,'Despachos','activa'),(9,'Recepción','activa'),(10,'Inventario','activa'),(11,'Archivo','inactiva'),(12,'Cafeteria','activa'),(19,'Logistica Flota Propia','activa'),(22,'Mercadista','activa');
/*!40000 ALTER TABLE `area` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `arearolkit`
--

DROP TABLE IF EXISTS `arearolkit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `arearolkit` (
  `id_area_rol_kit` int NOT NULL AUTO_INCREMENT,
  `id_area` int NOT NULL,
  `id_rol` int NOT NULL,
  `id_kit` int NOT NULL,
  PRIMARY KEY (`id_area_rol_kit`),
  UNIQUE KEY `uq_arearolkit_id_area` (`id_area`),
  KEY `id_area` (`id_area`),
  KEY `id_rol` (`id_rol`),
  KEY `id_kit` (`id_kit`),
  CONSTRAINT `arearolkit_ibfk_1` FOREIGN KEY (`id_area`) REFERENCES `area` (`id_area`),
  CONSTRAINT `arearolkit_ibfk_2` FOREIGN KEY (`id_rol`) REFERENCES `rol` (`id_rol`),
  CONSTRAINT `arearolkit_ibfk_3` FOREIGN KEY (`id_kit`) REFERENCES `kitdotacion` (`id_kit`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `arearolkit`
--

LOCK TABLES `arearolkit` WRITE;
/*!40000 ALTER TABLE `arearolkit` DISABLE KEYS */;
/*!40000 ALTER TABLE `arearolkit` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categoriadotacion`
--

DROP TABLE IF EXISTS `categoriadotacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categoriadotacion` (
  `id_categoria` int NOT NULL AUTO_INCREMENT,
  `nombre_categoria` varchar(100) NOT NULL,
  PRIMARY KEY (`id_categoria`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categoriadotacion`
--

LOCK TABLES `categoriadotacion` WRITE;
/*!40000 ALTER TABLE `categoriadotacion` DISABLE KEYS */;
INSERT INTO `categoriadotacion` VALUES (1,'Uniformes'),(2,'Calzado de Seguridad'),(3,'Elementos de Protección Personal (EPP)'),(4,'Accesorios'),(5,'Herramientas Personales'),(6,'herra'),(7,'imple');
/*!40000 ALTER TABLE `categoriadotacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ciclo_dotacion`
--

DROP TABLE IF EXISTS `ciclo_dotacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ciclo_dotacion` (
  `id_ciclo` int NOT NULL AUTO_INCREMENT,
  `nombre_ciclo` varchar(100) NOT NULL,
  `fecha_entrega` date NOT NULL,
  `fecha_inicio_ventana` date NOT NULL,
  `fecha_fin_ventana` date NOT NULL,
  `estado` enum('pendiente','activo','cerrado') NOT NULL DEFAULT 'pendiente',
  `total_empleados_elegibles` int DEFAULT '0',
  `id_area_produccion` int NOT NULL,
  `id_area_mercadista` int NOT NULL,
  `valor_smlv_aplicado` decimal(10,2) NOT NULL,
  `creado_por` int NOT NULL,
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `observaciones` text,
  PRIMARY KEY (`id_ciclo`),
  KEY `idx_estado` (`estado`),
  KEY `idx_fecha_entrega` (`fecha_entrega`),
  KEY `idx_ventana` (`fecha_inicio_ventana`,`fecha_fin_ventana`),
  KEY `ciclo_dotacion_ibfk_1` (`creado_por`),
  KEY `ciclo_dotacion_ibfk_2` (`id_area_produccion`),
  KEY `ciclo_dotacion_ibfk_3` (`id_area_mercadista`),
  CONSTRAINT `ciclo_dotacion_ibfk_1` FOREIGN KEY (`creado_por`) REFERENCES `usuario` (`id_usuario`) ON DELETE RESTRICT,
  CONSTRAINT `ciclo_dotacion_ibfk_2` FOREIGN KEY (`id_area_produccion`) REFERENCES `area` (`id_area`) ON DELETE RESTRICT,
  CONSTRAINT `ciclo_dotacion_ibfk_3` FOREIGN KEY (`id_area_mercadista`) REFERENCES `area` (`id_area`) ON DELETE RESTRICT,
  CONSTRAINT `chk_ventana_fecha` CHECK ((`fecha_inicio_ventana` < `fecha_fin_ventana`))
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ciclo_dotacion`
--

LOCK TABLES `ciclo_dotacion` WRITE;
/*!40000 ALTER TABLE `ciclo_dotacion` DISABLE KEYS */;
INSERT INTO `ciclo_dotacion` VALUES (1,'Ciclo Test Noviembre 2025','2025-11-30','2025-11-08','2025-11-30','cerrado',0,1,2,1160000.00,1,'2025-11-07 08:52:37','2025-11-07 09:18:50','Ciclo de prueba automatizada'),(2,'Ciclo Test Noviembre 2025','2025-11-30','2025-11-08','2025-11-30','cerrado',8,1,2,1160000.00,1,'2025-11-07 08:55:07','2025-11-07 14:06:06','Ciclo de prueba automatizada'),(3,'Ciclo Test Noviembre 2025','2025-11-30','2025-11-08','2025-11-30','cerrado',8,1,2,1160000.00,1,'2025-11-07 08:55:31','2025-11-07 09:18:50','Ciclo de prueba automatizada'),(4,'Ciclo Q4 2025','2025-11-19','2025-10-19','2025-11-19','cerrado',0,1,22,1423500.00,1,'2025-11-07 09:14:48','2025-11-07 11:18:49',''),(5,'Ciclo Q4 2025','2026-01-30','2025-12-30','2026-01-30','cerrado',0,1,22,1423500.00,1,'2025-11-07 10:52:05','2025-11-07 11:18:49',''),(6,'Ciclo prueba C','2025-12-07','2025-11-07','2025-12-07','cerrado',0,1,1,1.00,1,'2025-11-07 11:10:57','2025-11-07 11:18:49','[meta]{\"min_antiguedad_meses\":3,\"max_sueldo\":9999999}'),(7,'Ciclo prueba C','2025-12-07','2025-11-07','2025-12-07','cerrado',0,1,1,1.00,1,'2025-11-07 11:14:55','2025-11-07 11:18:49','[meta]{\"min_antiguedad_meses\":3,\"max_sueldo\":9999999}'),(8,'Ciclo Qrr 2025','2026-03-02','2026-02-02','2026-03-02','cerrado',0,1,22,1423500.00,1,'2025-11-07 11:22:46','2025-11-07 14:07:04',NULL),(9,'Nuevo','2025-11-29','2025-10-29','2025-11-29','activo',3,1,22,1500000.00,1,'2025-11-07 15:53:58','2025-11-07 15:53:58','');
/*!40000 ALTER TABLE `ciclo_dotacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detallekitdotacion`
--

DROP TABLE IF EXISTS `detallekitdotacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detallekitdotacion` (
  `id_detalle` int NOT NULL AUTO_INCREMENT,
  `id_kit` int NOT NULL,
  `id_dotacion` int NOT NULL,
  `cantidad` int NOT NULL,
  PRIMARY KEY (`id_detalle`),
  KEY `id_kit` (`id_kit`),
  KEY `id_dotacion` (`id_dotacion`),
  CONSTRAINT `detallekitdotacion_ibfk_1` FOREIGN KEY (`id_kit`) REFERENCES `kitdotacion` (`id_kit`),
  CONSTRAINT `detallekitdotacion_ibfk_2` FOREIGN KEY (`id_dotacion`) REFERENCES `dotacion` (`id_dotacion`)
) ENGINE=InnoDB AUTO_INCREMENT=77 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detallekitdotacion`
--

LOCK TABLES `detallekitdotacion` WRITE;
/*!40000 ALTER TABLE `detallekitdotacion` DISABLE KEYS */;
INSERT INTO `detallekitdotacion` VALUES (53,15,9,1),(54,15,10,1),(55,15,11,1),(56,15,4,1),(57,15,12,1),(58,15,7,1),(59,16,13,1),(60,16,11,1),(61,16,12,1),(62,16,4,1),(63,17,12,1),(64,17,2,1),(65,17,5,1),(66,17,7,1),(67,17,6,1),(68,17,4,1),(69,17,11,1),(70,18,13,1),(71,18,11,1),(72,18,1,1),(73,19,13,1),(74,19,11,1),(75,19,9,1),(76,19,1,1);
/*!40000 ALTER TABLE `detallekitdotacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detallepedidocompras`
--

DROP TABLE IF EXISTS `detallepedidocompras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detallepedidocompras` (
  `id_detalle` int NOT NULL AUTO_INCREMENT,
  `id_pedido` int NOT NULL,
  `id_dotacion` int NOT NULL,
  `id_talla` int NOT NULL,
  `cantidad_solicitada` int NOT NULL,
  `cantidad_recibida` int DEFAULT '0',
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  PRIMARY KEY (`id_detalle`),
  KEY `id_pedido` (`id_pedido`),
  KEY `id_dotacion` (`id_dotacion`),
  KEY `id_talla` (`id_talla`),
  CONSTRAINT `detallepedidocompras_ibfk_1` FOREIGN KEY (`id_pedido`) REFERENCES `pedidocompras` (`id_pedido`),
  CONSTRAINT `detallepedidocompras_ibfk_2` FOREIGN KEY (`id_dotacion`) REFERENCES `dotacion` (`id_dotacion`),
  CONSTRAINT `detallepedidocompras_ibfk_3` FOREIGN KEY (`id_talla`) REFERENCES `talla` (`id_talla`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detallepedidocompras`
--

LOCK TABLES `detallepedidocompras` WRITE;
/*!40000 ALTER TABLE `detallepedidocompras` DISABLE KEYS */;
/*!40000 ALTER TABLE `detallepedidocompras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detallesolicituddotacion`
--

DROP TABLE IF EXISTS `detallesolicituddotacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detallesolicituddotacion` (
  `id_detalle` int NOT NULL AUTO_INCREMENT,
  `id_solicitud` int NOT NULL,
  `id_dotacion` int NOT NULL,
  `id_talla` int NOT NULL,
  `cantidad` int NOT NULL,
  PRIMARY KEY (`id_detalle`),
  KEY `id_solicitud` (`id_solicitud`),
  KEY `id_dotacion` (`id_dotacion`),
  KEY `id_talla` (`id_talla`),
  CONSTRAINT `detallesolicituddotacion_ibfk_1` FOREIGN KEY (`id_solicitud`) REFERENCES `solicituddotacion` (`id_solicitud`),
  CONSTRAINT `detallesolicituddotacion_ibfk_2` FOREIGN KEY (`id_dotacion`) REFERENCES `dotacion` (`id_dotacion`),
  CONSTRAINT `detallesolicituddotacion_ibfk_3` FOREIGN KEY (`id_talla`) REFERENCES `talla` (`id_talla`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detallesolicituddotacion`
--

LOCK TABLES `detallesolicituddotacion` WRITE;
/*!40000 ALTER TABLE `detallesolicituddotacion` DISABLE KEYS */;
/*!40000 ALTER TABLE `detallesolicituddotacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dotacion`
--

DROP TABLE IF EXISTS `dotacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dotacion` (
  `id_dotacion` int NOT NULL AUTO_INCREMENT,
  `nombre_dotacion` varchar(100) NOT NULL,
  `descripcion` text,
  `talla_requerida` tinyint(1) DEFAULT '0',
  `unidad_medida` varchar(20) DEFAULT NULL,
  `id_categoria` int NOT NULL,
  `id_proveedor` int NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id_dotacion`),
  KEY `id_categoria` (`id_categoria`),
  KEY `id_proveedor` (`id_proveedor`),
  CONSTRAINT `dotacion_ibfk_1` FOREIGN KEY (`id_categoria`) REFERENCES `categoriadotacion` (`id_categoria`),
  CONSTRAINT `dotacion_ibfk_2` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedor` (`id_proveedor`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dotacion`
--

LOCK TABLES `dotacion` WRITE;
/*!40000 ALTER TABLE `dotacion` DISABLE KEYS */;
INSERT INTO `dotacion` VALUES (1,'Camisa Polo Empresa','Camisa polo con logo bordado, 100% algodón',1,'Unidad',1,1,35000.00),(2,'Pantalón Jean Industrial','Pantalón jean reforzado para trabajo industrial',1,'Unidad',1,1,65000.00),(3,'Zapatos de Seguridad','Zapatos con puntera de acero y suela antideslizante',1,'Par',2,4,120000.00),(4,'Casco de Seguridad','Casco industrial con barboquejo ajustable',0,'Unidad',3,3,25000.00),(5,'Guantes de Seguridad','Guantes antideslizantes para manipulación',1,'Par',3,3,8000.00),(6,'Chaleco Reflectivo','Chaleco con bandas reflectivas alta visibilidad',1,'Unidad',3,3,18000.00),(7,'Gafas de Seguridad','Gafas protectoras con filtro UV',0,'Unidad',3,3,12000.00),(8,'Overol Industrial','Overol completo para áreas de producción',1,'Unidad',1,1,85000.00),(9,'Camisón Térmico','Camisón térmico para operario',1,'Unidad',1,1,40000.00),(10,'Pantalón Térmico','Pantalón térmico para operario',1,'Unidad',1,1,45000.00),(11,'Botas Punta de Acero','Botas de seguridad con punta de acero',1,'Par',2,4,130000.00),(12,'Tapabocas','Tapabocas de seguridad industrial',0,'Unidad',3,3,2000.00),(13,'Bata desechable ','Batas quirúrgicas. ',0,'unidad',3,5,0.00),(14,'sfgtsery','adtaesthuyste',1,'0',4,5,0.00);
/*!40000 ALTER TABLE `dotacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `empleado`
--

DROP TABLE IF EXISTS `empleado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `empleado` (
  `id_empleado` int NOT NULL AUTO_INCREMENT,
  `Identificacion` varchar(20) NOT NULL,
  `tipo_identificacion` enum('CC','TI','CE','PEP','PAS','NIT','DNI') NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `fecha_nacimiento` date NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `cargo` varchar(100) DEFAULT NULL,
  `estado` tinyint(1) DEFAULT '1',
  `id_genero` int NOT NULL,
  `id_area` int NOT NULL,
  `fecha_inicio` date NOT NULL,
  `sueldo` decimal(10,2) NOT NULL,
  `fecha_fin` date DEFAULT NULL,
  `id_ubicacion` int NOT NULL,
  PRIMARY KEY (`id_empleado`),
  UNIQUE KEY `Identificacion_UNIQUE` (`Identificacion`),
  UNIQUE KEY `email_UNIQUE` (`email`),
  KEY `id_genero` (`id_genero`),
  KEY `id_area` (`id_area`),
  KEY `idx_empleado_email` (`email`),
  KEY `empleado_ubicaion_idx` (`id_ubicacion`),
  CONSTRAINT `empleado_ibfk_1` FOREIGN KEY (`id_genero`) REFERENCES `genero` (`id_genero`),
  CONSTRAINT `empleado_ibfk_2` FOREIGN KEY (`id_area`) REFERENCES `area` (`id_area`),
  CONSTRAINT `empleado_ubicacion` FOREIGN KEY (`id_ubicacion`) REFERENCES `ubicacion` (`id_ubicacion`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `empleado`
--

LOCK TABLES `empleado` WRITE;
/*!40000 ALTER TABLE `empleado` DISABLE KEYS */;
INSERT INTO `empleado` VALUES (1,'123456789','CC','Juan Carlos','Rodríguez Silva','2004-12-22','juan.rodriguez@empresa.com','300-123-4567','Operario Senior',1,1,1,'2025-07-02',1900600.00,NULL,2),(2,'123456798','CC','María Elena','González Pérez','2004-12-26','maria.gonzalez@empresa.com','301-234-5678','Supervisora de Calidad',0,2,4,'2025-07-02',1500865.00,NULL,2),(3,'123456987','CC','Carlos Andrés','Martínez López','2004-12-15','carlos.martinez@empresa.com','302-345-6789','Técnico de Mantenimiento',0,1,3,'2025-07-02',1789546.00,NULL,2),(4,'123654789','CC','Ana María','Hernández Castro','2004-12-21','ana.hernandez@empresa.com','303-456-7890','Auxiliar Administrativo',0,2,2,'2025-07-02',1500865.00,NULL,2),(5,'321456789','CC','Luis Fernando','Vargas Moreno','2004-12-21','luis.vargas@empresa.com','304-567-8901','Coordinador de Producción',1,1,1,'2025-07-02',1900600.00,NULL,2),(6,'321654987','CC','Sandra Patricia','Jiménez Ruiz','2004-12-21','sandra.jimenez@empresa.com','305-678-9012','Almacenista',0,2,3,'2025-07-02',1789546.00,NULL,2),(7,'369258147','CC','Diego Alejandro','Torres Gómez','2004-12-21','diego.torres@empresa.com','306-789-0123','Operario',1,1,1,'2025-07-02',1900600.00,NULL,2),(8,'258369147','CC','Claudia Marcela','Ramírez Soto','2004-12-21','claudia.ramirez@empresa.com','307-890-1234','Inspector de Calidad',1,2,4,'2025-07-02',1789546.00,NULL,2),(9,'147258369','CC','Fabian Murcia','Gomez','2004-12-21','murcia21.gmz@gmail.com','3102023478','Aprendiz sena',1,1,4,'2025-07-02',1900600.00,NULL,1),(10,'789456123','CC','Juan Sebastian ','Duran Castellanos','2004-12-21','jdurancastellanos21@gmail.com','3102023477','Aprendiz sena',1,1,2,'2025-07-02',1789546.00,NULL,2),(11,'987456323','CC','Ricardo Alexander','Bohorquez','2004-12-22','rbohorquez@arrozsonora.com.co','3102023456','Analista de Sistemas',1,1,1,'2025-10-07',19078700.00,'2025-10-16',2),(12,'1076200149','CC','Ricardo Alexander','Gomez','2023-06-07','murcia232gmz@gmail.com','3102023456','Aprendiz sena',1,1,2,'2025-10-06',1700666.00,'2025-10-31',2),(13,'9874567921','CC','Bodega Central','Duran Castellanos','2025-10-11','murcia21mz@gmail.com','3102023478','Analista de Sistemas',1,1,1,'2025-10-30',1999999.00,'2025-11-08',2),(14,'987456312','CC','Ricardo Alexanderrr','perez','2024-02-23','murciagmz@gmail.com','3102023477','Pasante pepe',0,1,2,'2025-10-01',1700000.00,'2027-10-21',12);
/*!40000 ALTER TABLE `empleado` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `empleado_ciclo`
--

DROP TABLE IF EXISTS `empleado_ciclo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `empleado_ciclo` (
  `id_empleado_ciclo` int NOT NULL AUTO_INCREMENT,
  `id_ciclo` int NOT NULL,
  `id_empleado` int NOT NULL,
  `id_kit` int DEFAULT NULL,
  `estado` enum('procesado','entregado','omitido') NOT NULL DEFAULT 'procesado',
  `antiguedad_meses` int NOT NULL,
  `sueldo_al_momento` decimal(10,2) NOT NULL,
  `id_area` int NOT NULL,
  `observaciones` text,
  `fecha_asignacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_entrega_real` date DEFAULT NULL,
  `fecha_actualizacion` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `actualizado_por` int DEFAULT NULL,
  PRIMARY KEY (`id_empleado_ciclo`),
  UNIQUE KEY `unique_empleado_ciclo` (`id_ciclo`,`id_empleado`),
  KEY `idx_ciclo` (`id_ciclo`),
  KEY `idx_empleado` (`id_empleado`),
  KEY `idx_estado` (`estado`),
  KEY `idx_area` (`id_area`),
  KEY `empleado_ciclo_ibfk_4` (`actualizado_por`),
  KEY `id_kit` (`id_kit`),
  CONSTRAINT `empleado_ciclo_ibfk_1` FOREIGN KEY (`id_ciclo`) REFERENCES `ciclo_dotacion` (`id_ciclo`) ON DELETE CASCADE,
  CONSTRAINT `empleado_ciclo_ibfk_2` FOREIGN KEY (`id_empleado`) REFERENCES `empleado` (`id_empleado`) ON DELETE CASCADE,
  CONSTRAINT `empleado_ciclo_ibfk_3` FOREIGN KEY (`id_area`) REFERENCES `area` (`id_area`) ON DELETE RESTRICT,
  CONSTRAINT `empleado_ciclo_ibfk_4` FOREIGN KEY (`actualizado_por`) REFERENCES `usuario` (`id_usuario`) ON DELETE SET NULL,
  CONSTRAINT `empleado_ciclo_ibfk_5` FOREIGN KEY (`id_kit`) REFERENCES `kitdotacion` (`id_kit`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `empleado_ciclo`
--

LOCK TABLES `empleado_ciclo` WRITE;
/*!40000 ALTER TABLE `empleado_ciclo` DISABLE KEYS */;
INSERT INTO `empleado_ciclo` VALUES (2,2,1,15,'procesado',0,1900600.00,1,'Asignación automática por ciclo','2025-11-07 08:55:08',NULL,'2025-11-07 08:55:08',NULL),(3,2,5,15,'procesado',0,1900600.00,1,'Asignación automática por ciclo','2025-11-07 08:55:08',NULL,'2025-11-07 08:55:08',NULL),(4,2,7,15,'procesado',0,1900600.00,1,'Asignación automática por ciclo','2025-11-07 08:55:08',NULL,'2025-11-07 08:55:08',NULL),(5,2,11,15,'procesado',0,19078700.00,1,'Asignación automática por ciclo','2025-11-07 08:55:08',NULL,'2025-11-07 08:55:08',NULL),(6,2,13,15,'procesado',0,1999999.00,1,'Asignación automática por ciclo','2025-11-07 08:55:08',NULL,'2025-11-07 08:55:08',NULL),(7,4,10,16,'procesado',0,1789546.00,2,'Asignación automática por ciclo','2025-11-07 08:55:08',NULL,'2025-11-07 09:17:50',NULL),(8,2,8,17,'procesado',0,1789546.00,4,'Asignación automática por ciclo','2025-11-07 08:55:08',NULL,'2025-11-07 08:55:08',NULL),(9,2,9,17,'procesado',0,1900600.00,4,'Asignación automática por ciclo','2025-11-07 08:55:08',NULL,'2025-11-07 08:55:08',NULL),(10,4,1,15,'entregado',0,1900600.00,1,'Entrega realizada en pruebas','2025-11-07 08:55:32','2025-11-07','2025-11-07 09:17:50',1),(11,3,5,15,'procesado',0,1900600.00,1,'Asignación automática por ciclo','2025-11-07 08:55:32',NULL,'2025-11-07 08:55:32',NULL),(12,3,7,15,'procesado',0,1900600.00,1,'Asignación automática por ciclo','2025-11-07 08:55:32',NULL,'2025-11-07 08:55:32',NULL),(13,3,11,15,'procesado',0,19078700.00,1,'Asignación automática por ciclo','2025-11-07 08:55:32',NULL,'2025-11-07 08:55:32',NULL),(14,3,13,15,'procesado',0,1999999.00,1,'Asignación automática por ciclo','2025-11-07 08:55:32',NULL,'2025-11-07 08:55:32',NULL),(15,3,10,16,'procesado',0,1789546.00,2,'Asignación automática por ciclo','2025-11-07 08:55:32',NULL,'2025-11-07 08:55:32',NULL),(16,3,8,17,'procesado',0,1789546.00,4,'Asignación automática por ciclo','2025-11-07 08:55:32',NULL,'2025-11-07 08:55:32',NULL),(17,3,9,17,'procesado',0,1900600.00,4,'Asignación automática por ciclo','2025-11-07 08:55:32',NULL,'2025-11-07 08:55:32',NULL),(18,9,1,NULL,'procesado',4,1900600.00,1,NULL,'2025-11-07 15:53:58',NULL,'2025-11-07 15:53:58',NULL),(19,9,7,NULL,'procesado',4,1900600.00,1,NULL,'2025-11-07 15:53:58',NULL,'2025-11-07 15:53:58',NULL),(20,9,5,NULL,'procesado',4,1900600.00,1,NULL,'2025-11-07 15:53:58',NULL,'2025-11-07 15:53:58',NULL);
/*!40000 ALTER TABLE `empleado_ciclo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `entregadotacion`
--

DROP TABLE IF EXISTS `entregadotacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `entregadotacion` (
  `id_entrega` int NOT NULL AUTO_INCREMENT,
  `id_empleado` int NOT NULL,
  `id_entrega_kit` int DEFAULT NULL,
  `id_dotacion` int NOT NULL,
  `id_talla` int DEFAULT NULL,
  `cantidad` int NOT NULL,
  `fecha_entrega` date NOT NULL,
  `observaciones` text,
  PRIMARY KEY (`id_entrega`),
  KEY `id_empleado` (`id_empleado`),
  KEY `id_dotacion` (`id_dotacion`),
  KEY `id_talla` (`id_talla`),
  KEY `idx_entregadotacion_ek` (`id_entrega_kit`),
  CONSTRAINT `entregadotacion_ibfk_1` FOREIGN KEY (`id_empleado`) REFERENCES `empleado` (`id_empleado`),
  CONSTRAINT `entregadotacion_ibfk_2` FOREIGN KEY (`id_dotacion`) REFERENCES `dotacion` (`id_dotacion`),
  CONSTRAINT `entregadotacion_ibfk_3` FOREIGN KEY (`id_talla`) REFERENCES `talla` (`id_talla`),
  CONSTRAINT `fk_entregadotacion_ek` FOREIGN KEY (`id_entrega_kit`) REFERENCES `entregakit` (`id_entrega_kit`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=93 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `entregadotacion`
--

LOCK TABLES `entregadotacion` WRITE;
/*!40000 ALTER TABLE `entregadotacion` DISABLE KEYS */;
INSERT INTO `entregadotacion` VALUES (77,1,NULL,9,6,1,'2025-11-26',''),(78,1,NULL,10,6,1,'2025-11-26',''),(79,1,NULL,11,6,1,'2025-11-26',''),(80,1,NULL,4,63,1,'2025-11-26',''),(81,1,NULL,12,63,1,'2025-11-26',''),(82,1,NULL,7,63,1,'2025-11-26',''),(90,3,NULL,13,63,1,'2025-11-05',''),(91,3,NULL,11,6,1,'2025-11-05',''),(92,3,NULL,1,6,1,'2025-11-05','');
/*!40000 ALTER TABLE `entregadotacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `entregakit`
--

DROP TABLE IF EXISTS `entregakit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `entregakit` (
  `id_entrega_kit` int NOT NULL AUTO_INCREMENT,
  `id_empleado` int NOT NULL,
  `id_kit` int NOT NULL,
  `fecha_entrega` date NOT NULL,
  `observaciones` text COLLATE utf8mb4_general_ci,
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_entrega_kit`),
  KEY `idx_ek_empleado` (`id_empleado`),
  KEY `idx_ek_kit` (`id_kit`),
  CONSTRAINT `fk_ek_empleado` FOREIGN KEY (`id_empleado`) REFERENCES `empleado` (`id_empleado`),
  CONSTRAINT `fk_ek_kit` FOREIGN KEY (`id_kit`) REFERENCES `kitdotacion` (`id_kit`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `entregakit`
--

LOCK TABLES `entregakit` WRITE;
/*!40000 ALTER TABLE `entregakit` DISABLE KEYS */;
INSERT INTO `entregakit` VALUES (1,1,15,'2025-11-05',NULL,'2025-11-05 11:18:02'),(2,1,15,'2025-11-05',NULL,'2025-11-05 11:25:42'),(3,1,15,'2025-11-05',NULL,'2025-11-05 11:35:13'),(4,1,15,'2025-11-05',NULL,'2025-11-05 11:53:42'),(5,1,15,'2025-11-05',NULL,'2025-11-05 12:01:16');
/*!40000 ALTER TABLE `entregakit` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `genero`
--

DROP TABLE IF EXISTS `genero`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `genero` (
  `id_genero` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  PRIMARY KEY (`id_genero`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `genero`
--

LOCK TABLES `genero` WRITE;
/*!40000 ALTER TABLE `genero` DISABLE KEYS */;
INSERT INTO `genero` VALUES (1,'Masculino'),(2,'Femenino');
/*!40000 ALTER TABLE `genero` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historialmovimientos`
--

DROP TABLE IF EXISTS `historialmovimientos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historialmovimientos` (
  `id_historial` int NOT NULL AUTO_INCREMENT,
  `tabla_modificada` varchar(50) NOT NULL,
  `id_registro` int NOT NULL,
  `tipo_movimiento` varchar(20) NOT NULL,
  `fecha_movimiento` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `usuario_responsable` varchar(100) DEFAULT NULL,
  `detalle_cambio` text,
  PRIMARY KEY (`id_historial`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historialmovimientos`
--

LOCK TABLES `historialmovimientos` WRITE;
/*!40000 ALTER TABLE `historialmovimientos` DISABLE KEYS */;
INSERT INTO `historialmovimientos` VALUES (1,'Empleado',1,'INSERT','2025-10-07 10:05:01','admin','Registro nuevo empleado Juan Carlos Rodríguez'),(2,'SolicitudDotacion',1,'INSERT','2025-10-07 10:05:01','supervisor','Nueva solicitud kit operario'),(3,'StockDotacion',1,'UPDATE','2025-10-07 10:05:01','almacenista','Actualización stock por entrega'),(4,'EntregaDotacion',1,'INSERT','2025-10-07 10:05:01','almacenista','Registro entrega a empleado'),(5,'PedidoCompras',1,'INSERT','2025-10-07 10:05:01','admin','Nuevo pedido de compra generado'),(6,'entregadotacion',6,'INSERT','2025-10-29 12:24:09','sistema','Entrega registrada: Camisa Polo Empresa - Cantidad: 1 - Empleado: Juan Carlos Rodríguez Silva'),(7,'entregadotacion',7,'INSERT','2025-11-04 07:19:30','sistema','Entrega registrada: Camisa Polo Empresa - Cantidad: 1 - Empleado: Juan Carlos Rodríguez Silva'),(8,'entregadotacion',23,'DELETE','2025-11-05 13:35:03','sistema','Entrega eliminada (grupo empleado/fecha)'),(9,'entregadotacion',7,'DELETE','2025-11-05 13:35:06','sistema','Entrega eliminada (grupo empleado/fecha)'),(10,'entregadotacion',6,'DELETE','2025-11-05 13:35:08','sistema','Entrega eliminada (grupo empleado/fecha)'),(11,'entregadotacion',4,'DELETE','2025-11-05 13:35:10','sistema','Entrega eliminada (grupo empleado/fecha)'),(12,'entregadotacion',1,'DELETE','2025-11-05 13:35:12','sistema','Entrega eliminada (grupo empleado/fecha)'),(13,'entregadotacion',77,'UPDATE','2025-11-06 14:17:26','sistema','Entrega actualizada (grupo empleado/fecha)'),(14,'entregadotacion',77,'UPDATE','2025-11-06 14:17:35','sistema','Entrega actualizada (grupo empleado/fecha)'),(15,'entregadotacion',83,'DELETE','2025-11-06 16:36:31','sistema','Entrega eliminada (grupo empleado/fecha)');
/*!40000 ALTER TABLE `historialmovimientos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kitdotacion`
--

DROP TABLE IF EXISTS `kitdotacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kitdotacion` (
  `id_kit` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) DEFAULT NULL,
  `id_area` int NOT NULL,
  `activo` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id_kit`),
  KEY `id_area` (`id_area`),
  CONSTRAINT `kitdotacion_ibfk_1` FOREIGN KEY (`id_area`) REFERENCES `area` (`id_area`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kitdotacion`
--

LOCK TABLES `kitdotacion` WRITE;
/*!40000 ALTER TABLE `kitdotacion` DISABLE KEYS */;
INSERT INTO `kitdotacion` VALUES (15,'kit producción ',1,1),(16,'kit administración ',2,1),(17,'Kit calidad',4,1),(18,'kit mantenimiento',3,1),(19,'cualquiera ',12,1);
/*!40000 ALTER TABLE `kitdotacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pedidocompras`
--

DROP TABLE IF EXISTS `pedidocompras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedidocompras` (
  `id_pedido` int NOT NULL AUTO_INCREMENT,
  `fecha` date NOT NULL,
  `estado` enum('enviado','recibido_parcial','recibido_completo') NOT NULL DEFAULT 'enviado',
  `observaciones` text,
  `total_pedido` decimal(12,2) DEFAULT '0.00',
  PRIMARY KEY (`id_pedido`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pedidocompras`
--

LOCK TABLES `pedidocompras` WRITE;
/*!40000 ALTER TABLE `pedidocompras` DISABLE KEYS */;
INSERT INTO `pedidocompras` VALUES (1,'2024-09-15','recibido_completo','Pedido mensual uniformes',15750000.00),(2,'2024-10-01','enviado','Reposición stock EPP',8500000.00),(3,'2024-10-07','enviado','Pedido urgente calzado seguridad',12000000.00);
/*!40000 ALTER TABLE `pedidocompras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `proveedor`
--

DROP TABLE IF EXISTS `proveedor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `proveedor` (
  `id_proveedor` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) NOT NULL,
  `telefono` varchar(50) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `direccion` text,
  `activo` tinyint(1) DEFAULT '1' COMMENT 'Indica si el proveedor está activo',
  PRIMARY KEY (`id_proveedor`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proveedor`
--

LOCK TABLES `proveedor` WRITE;
/*!40000 ALTER TABLE `proveedor` DISABLE KEYS */;
INSERT INTO `proveedor` VALUES (1,'Textiles Industriales S.A.S.','601-234-5678','ventas@textilesindustriales.com','Zona Industrial Puente Aranda, Bogotá',0),(2,'Uniformes y Dotaciones Ltda.','604-876-5432','comercial@uniformesdotaciones.com','Itagüí, Antioquia',0),(3,'EPP Seguridad Total','801-345-6789','info@eppseguridad.com','Fontibón, Bogotá',0),(4,'Calzado Industrial Cñolombia','602-567-8999','pedidos@calzadoindustrial.com','Cali, Valle del Cauca',0),(5,'flexxooo','3102023477','juan_duran@gmail.com','Bogota Colombia',1);
/*!40000 ALTER TABLE `proveedor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rol`
--

DROP TABLE IF EXISTS `rol`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rol` (
  `id_rol` int NOT NULL AUTO_INCREMENT,
  `nombre_rol` varchar(100) NOT NULL,
  PRIMARY KEY (`id_rol`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rol`
--

LOCK TABLES `rol` WRITE;
/*!40000 ALTER TABLE `rol` DISABLE KEYS */;
INSERT INTO `rol` VALUES (1,'Compras'),(2,'Almacen'),(3,'Recursos Humanos'),(4,'Administrador');
/*!40000 ALTER TABLE `rol` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `salario_minimo`
--

DROP TABLE IF EXISTS `salario_minimo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salario_minimo` (
  `id_salario` int NOT NULL AUTO_INCREMENT,
  `anio` int NOT NULL COMMENT 'A??o del salario m??nimo',
  `valor_mensual` decimal(10,2) NOT NULL COMMENT 'Valor del SMLV en pesos colombianos',
  `fecha_actualizacion` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `creado_por` int DEFAULT NULL,
  `observaciones` text,
  PRIMARY KEY (`id_salario`),
  UNIQUE KEY `unique_anio` (`anio`),
  KEY `idx_anio` (`anio`),
  KEY `salario_minimo_ibfk_1` (`creado_por`),
  CONSTRAINT `salario_minimo_ibfk_1` FOREIGN KEY (`creado_por`) REFERENCES `usuario` (`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `salario_minimo`
--

LOCK TABLES `salario_minimo` WRITE;
/*!40000 ALTER TABLE `salario_minimo` DISABLE KEYS */;
INSERT INTO `salario_minimo` VALUES (1,2024,1300000.00,'2025-11-06 12:05:34',1,'SMLV a??o 2024'),(2,2025,1500000.00,'2025-11-07 14:30:50',1,'Registrado desde ModalNuevoCiclo'),(3,2026,1423500.00,'2025-11-06 12:05:34',1,'SMLV a??o 2026 - Valor proyectado');
/*!40000 ALTER TABLE `salario_minimo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `solicituddotacion`
--

DROP TABLE IF EXISTS `solicituddotacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicituddotacion` (
  `id_solicitud` int NOT NULL AUTO_INCREMENT,
  `id_empleado` int NOT NULL,
  `id_kit` int NOT NULL,
  `fecha_creacion` date NOT NULL,
  `estado` enum('pendiente','procesado','entregado') DEFAULT 'pendiente',
  PRIMARY KEY (`id_solicitud`),
  KEY `id_empleado` (`id_empleado`),
  KEY `id_kit` (`id_kit`),
  CONSTRAINT `solicituddotacion_ibfk_1` FOREIGN KEY (`id_empleado`) REFERENCES `empleado` (`id_empleado`),
  CONSTRAINT `solicituddotacion_ibfk_2` FOREIGN KEY (`id_kit`) REFERENCES `kitdotacion` (`id_kit`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solicituddotacion`
--

LOCK TABLES `solicituddotacion` WRITE;
/*!40000 ALTER TABLE `solicituddotacion` DISABLE KEYS */;
/*!40000 ALTER TABLE `solicituddotacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stockdotacion`
--

DROP TABLE IF EXISTS `stockdotacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stockdotacion` (
  `id_stock` int NOT NULL AUTO_INCREMENT,
  `id_dotacion` int NOT NULL,
  `id_talla` int NOT NULL,
  `id_area` int NOT NULL,
  `id_ubicacion` int NOT NULL,
  `cantidad` int NOT NULL,
  `fecha_actualizacion` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_stock`),
  KEY `id_dotacion` (`id_dotacion`),
  KEY `id_talla` (`id_talla`),
  KEY `id_area` (`id_area`),
  KEY `id_ubicacion` (`id_ubicacion`),
  CONSTRAINT `stockdotacion_ibfk_1` FOREIGN KEY (`id_dotacion`) REFERENCES `dotacion` (`id_dotacion`),
  CONSTRAINT `stockdotacion_ibfk_2` FOREIGN KEY (`id_talla`) REFERENCES `talla` (`id_talla`),
  CONSTRAINT `stockdotacion_ibfk_3` FOREIGN KEY (`id_area`) REFERENCES `area` (`id_area`),
  CONSTRAINT `stockdotacion_ibfk_4` FOREIGN KEY (`id_ubicacion`) REFERENCES `ubicacion` (`id_ubicacion`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stockdotacion`
--

LOCK TABLES `stockdotacion` WRITE;
/*!40000 ALTER TABLE `stockdotacion` DISABLE KEYS */;
INSERT INTO `stockdotacion` VALUES (1,1,2,7,3,150,'2025-10-07 10:05:01'),(2,1,3,7,3,199,'2025-11-04 07:19:30'),(3,1,4,7,3,99,'2025-10-29 12:24:09'),(4,2,7,7,3,80,'2025-10-07 10:05:01'),(5,2,8,7,3,120,'2025-10-07 10:05:01'),(6,2,9,7,3,90,'2025-10-07 10:05:01'),(7,3,29,7,3,50,'2025-10-07 10:05:01'),(8,3,30,7,3,45,'2025-10-07 10:05:01'),(9,3,31,7,3,40,'2025-10-07 10:05:01'),(10,4,1,7,3,200,'2025-10-07 10:05:01'),(11,7,1,7,3,300,'2025-10-07 10:05:01');
/*!40000 ALTER TABLE `stockdotacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `talla`
--

DROP TABLE IF EXISTS `talla`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `talla` (
  `id_talla` int NOT NULL AUTO_INCREMENT,
  `tipo_articulo` varchar(50) NOT NULL,
  `talla` varchar(10) NOT NULL,
  `id_genero` int NOT NULL,
  PRIMARY KEY (`id_talla`),
  KEY `id_genero` (`id_genero`),
  CONSTRAINT `talla_ibfk_1` FOREIGN KEY (`id_genero`) REFERENCES `genero` (`id_genero`)
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `talla`
--

LOCK TABLES `talla` WRITE;
/*!40000 ALTER TABLE `talla` DISABLE KEYS */;
INSERT INTO `talla` VALUES (1,'Camisa','S',1),(2,'Camisa','M',1),(3,'Camisa','L',1),(4,'Camisa','XL',1),(5,'Camisa','XXL',1),(6,'Pantalón','28',1),(7,'Pantalón','30',1),(8,'Pantalón','32',1),(9,'Pantalón','34',1),(10,'Pantalón','36',1),(11,'Pantalón','38',1),(12,'Overol','S',1),(13,'Overol','M',1),(14,'Overol','L',1),(15,'Overol','XL',1),(16,'Overol','XXL',1),(17,'Camisa','XS',2),(18,'Camisa','S',2),(19,'Camisa','M',2),(20,'Camisa','L',2),(21,'Camisa','XL',2),(22,'Pantalón','6',2),(23,'Pantalón','8',2),(24,'Pantalón','10',2),(25,'Pantalón','12',2),(26,'Pantalón','14',2),(27,'Pantalón','16',2),(28,'Overol','XS',2),(29,'Overol','S',2),(30,'Overol','M',2),(31,'Overol','L',2),(32,'Overol','XL',2),(33,'Zapato','36',2),(34,'Zapato','37',2),(35,'Zapato','38',2),(36,'Zapato','39',2),(37,'Zapato','40',2),(38,'Zapato','41',2),(39,'Zapato','38',1),(40,'Zapato','39',1),(41,'Zapato','40',1),(42,'Zapato','41',1),(43,'Zapato','42',1),(44,'Zapato','43',1),(45,'Zapato','44',1),(46,'Guante','S',1),(47,'Guante','M',1),(48,'Guante','L',1),(49,'Guante','XL',1),(50,'Guante','S',2),(51,'Guante','M',2),(52,'Guante','L',2),(53,'Chaleco','S',1),(54,'Chaleco','M',1),(55,'Chaleco','L',1),(56,'Chaleco','XL',1),(57,'Chaleco','XXL',1),(58,'Chaleco','XS',2),(59,'Chaleco','S',2),(60,'Chaleco','M',2),(61,'Chaleco','L',2),(62,'Chaleco','XL',2),(63,'General','SIN_TALLA',1),(64,'General','SIN_TALLA',2);
/*!40000 ALTER TABLE `talla` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ubicacion`
--

DROP TABLE IF EXISTS `ubicacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ubicacion` (
  `id_ubicacion` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `tipo` enum('planta','bodega','maquila') NOT NULL,
  `direccion` text,
  PRIMARY KEY (`id_ubicacion`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ubicacion`
--

LOCK TABLES `ubicacion` WRITE;
/*!40000 ALTER TABLE `ubicacion` DISABLE KEYS */;
INSERT INTO `ubicacion` VALUES (1,'Planta Principal Bogotá','planta','Av. Caracas #45-67, Bogotá D.C.'),(2,'Planta Medellín','planta','Carrera 50 #23-45, Medellín, Antioquia'),(3,'Bodega Central','planta','Zona Industrial, Calle 13 #78-90, Bogotá D.C.'),(9,'UBICACIÓN TEMPORAL - REASIGNADA','bodega','Áreas reasignadas temporalmente por eliminación de ubicación'),(12,'La Maria','planta','Saldaña-Purificacion'),(13,'SonoMaquila','maquila','Ibague');
/*!40000 ALTER TABLE `ubicacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `id_empleado` int NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `id_rol` int NOT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `ultimo_acceso` datetime DEFAULT NULL,
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `creado_por` int DEFAULT NULL,
  `actualizado_por` int DEFAULT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expiration` datetime DEFAULT NULL,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `id_empleado` (`id_empleado`),
  KEY `creado_por` (`creado_por`),
  KEY `idx_username` (`username`),
  KEY `idx_email` (`email`),
  KEY `idx_activo` (`activo`),
  KEY `idx_rol_sistema` (`id_rol`),
  KEY `idx_reset_token` (`reset_token`),
  CONSTRAINT `usuario_ibfk_1` FOREIGN KEY (`id_empleado`) REFERENCES `empleado` (`id_empleado`) ON DELETE CASCADE,
  CONSTRAINT `usuario_ibfk_2` FOREIGN KEY (`creado_por`) REFERENCES `usuario` (`id_usuario`) ON DELETE SET NULL,
  CONSTRAINT `usuario_rol` FOREIGN KEY (`id_rol`) REFERENCES `rol` (`id_rol`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES (1,9,'fabianmurcia.gomez','murcia21.gmz@gmail.com','$2a$12$lx3o6GMtKRDX/4bIUg1z8OntlSmYksOhm6kcISDR1L.g0tWkj/lLG',4,1,'2025-11-07 12:12:37','2025-10-15 08:40:49','2025-11-07 12:12:37',NULL,NULL,NULL,NULL),(2,2,'mariaelena.gonzalezperez','maria.gonzalez@gmail.com','$2a$12$xLHbVlxZ/mytnpbINq48y.fvzi1rkh74VVnFfjUIjmdXzkNeZcOcC',2,1,'2025-10-15 10:20:57','2025-10-15 09:48:54','2025-10-22 11:15:22',1,1,NULL,NULL),(3,10,'juansebastian.durancastellanos','jdurancastellanos21@gmail.com','$2a$12$g0Q4FGAe78qgkRq.VyE2mebYLZGR.zzVe4W6L7qMdNMZ2JiiDy7tO',3,0,'2025-10-21 15:57:01','2025-10-21 10:41:14','2025-10-31 07:26:29',1,1,NULL,NULL),(4,12,'pepito','rbohorquez@arrozsonora.com.co','$2a$12$OJ6QWvnUQ.3/vAWbHrc93uOWu7ziQwzjgAnTvAtRtfAUNY2YQVUZC',1,1,NULL,'2025-10-31 12:10:46','2025-10-31 12:10:55',1,NULL,NULL,NULL);
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-07 16:09:40
