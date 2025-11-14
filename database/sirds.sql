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

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '27519af4-b434-11f0-aee2-f439092d7bcb:1-996';

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
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ciclo_dotacion`
--

LOCK TABLES `ciclo_dotacion` WRITE;
/*!40000 ALTER TABLE `ciclo_dotacion` DISABLE KEYS */;
INSERT INTO `ciclo_dotacion` VALUES (34,'Ciclo Q4 2025','2025-11-14','2025-10-14','2025-11-14','cerrado',22,1,22,1500000.00,1,'2025-11-13 09:07:46','2025-11-14 07:35:40',''),(35,'Ultimo','2025-12-31','2025-10-31','2025-12-31','cerrado',20,1,22,1500000.00,1,'2025-11-13 14:48:47','2025-11-14 13:26:36',''),(36,'PRUEVA PEDIDO','2026-01-06','2025-11-06','2026-01-06','cerrado',21,1,22,1423500.00,1,'2025-11-14 13:27:05','2025-11-14 15:56:27',''),(37,'Ultimo intento','2026-01-12','2025-11-12','2026-01-12','activo',21,1,22,1423500.00,1,'2025-11-14 15:56:53','2025-11-14 15:56:53','No la doy mas');
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
) ENGINE=InnoDB AUTO_INCREMENT=95 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detallekitdotacion`
--

LOCK TABLES `detallekitdotacion` WRITE;
/*!40000 ALTER TABLE `detallekitdotacion` DISABLE KEYS */;
INSERT INTO `detallekitdotacion` VALUES (53,15,9,1),(54,15,10,1),(55,15,11,1),(56,15,4,1),(57,15,12,1),(58,15,7,1),(59,16,13,1),(60,16,11,1),(61,16,12,1),(62,16,4,1),(63,17,12,1),(64,17,2,1),(65,17,5,1),(66,17,7,1),(67,17,6,1),(68,17,4,1),(69,17,11,1),(70,18,13,1),(71,18,11,1),(72,18,1,1),(73,19,13,1),(74,19,11,1),(75,19,9,1),(76,19,1,1),(77,20,13,1),(78,20,11,1),(79,20,1,1),(80,20,9,1),(81,21,11,1),(82,21,1,1),(83,21,6,1),(84,21,4,1),(85,21,12,1),(86,22,13,1),(87,22,12,1),(88,22,14,1),(89,22,10,1),(90,23,3,1),(91,23,8,1),(92,23,5,1),(93,24,8,1),(94,24,2,1);
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
) ENGINE=InnoDB AUTO_INCREMENT=128 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detallepedidocompras`
--

LOCK TABLES `detallepedidocompras` WRITE;
/*!40000 ALTER TABLE `detallepedidocompras` DISABLE KEYS */;
INSERT INTO `detallepedidocompras` VALUES (1,4,13,63,14,0,0.00,0.00),(2,4,11,33,2,0,130000.00,260000.00),(3,4,11,34,1,0,130000.00,130000.00),(4,4,11,39,1,0,130000.00,130000.00),(5,4,11,35,1,0,130000.00,130000.00),(6,4,11,40,6,0,130000.00,780000.00),(7,4,11,36,2,0,130000.00,260000.00),(8,4,11,41,2,0,130000.00,260000.00),(9,4,11,37,1,0,130000.00,130000.00),(10,4,11,42,3,0,130000.00,390000.00),(11,4,11,43,1,0,130000.00,130000.00),(12,4,11,44,1,0,130000.00,130000.00),(13,4,1,3,1,0,35000.00,35000.00),(14,4,1,19,1,0,35000.00,35000.00),(15,4,1,2,2,0,35000.00,70000.00),(16,4,1,1,1,0,35000.00,35000.00),(17,4,1,18,3,0,35000.00,105000.00),(18,4,9,3,1,0,40000.00,40000.00),(19,4,9,19,2,0,40000.00,80000.00),(20,4,9,2,1,0,40000.00,40000.00),(21,4,9,21,1,0,40000.00,40000.00),(22,4,4,63,13,0,25000.00,325000.00),(23,4,6,55,1,0,18000.00,18000.00),(24,4,6,54,1,0,18000.00,18000.00),(25,4,6,53,2,0,18000.00,36000.00),(26,4,6,56,2,0,18000.00,36000.00),(27,4,7,63,7,0,12000.00,84000.00),(28,4,5,48,1,0,8000.00,8000.00),(29,4,5,47,2,0,8000.00,16000.00),(30,4,5,46,2,0,8000.00,16000.00),(31,4,5,49,1,0,8000.00,8000.00),(32,4,2,6,1,0,65000.00,65000.00),(33,4,2,7,2,0,65000.00,130000.00),(34,4,2,8,3,0,65000.00,195000.00),(35,4,10,7,1,0,45000.00,45000.00),(36,4,12,63,13,0,2000.00,26000.00),(37,5,13,63,14,0,0.00,0.00),(38,5,11,33,2,0,130000.00,260000.00),(39,5,11,34,1,0,130000.00,130000.00),(40,5,11,39,2,0,130000.00,260000.00),(41,5,11,40,8,0,130000.00,1040000.00),(42,5,11,41,3,0,130000.00,390000.00),(43,5,11,42,3,0,130000.00,390000.00),(44,5,11,43,1,0,130000.00,130000.00),(45,5,11,44,1,0,130000.00,130000.00),(46,5,1,3,1,0,35000.00,35000.00),(47,5,1,19,3,0,35000.00,105000.00),(48,5,1,1,4,0,35000.00,140000.00),(49,5,9,3,1,0,40000.00,40000.00),(50,5,9,19,3,0,40000.00,120000.00),(51,5,9,21,1,0,40000.00,40000.00),(52,5,4,63,13,0,25000.00,325000.00),(53,5,6,55,1,0,18000.00,18000.00),(54,5,6,54,1,0,18000.00,18000.00),(55,5,6,53,2,0,18000.00,36000.00),(56,5,6,56,2,0,18000.00,36000.00),(57,5,7,63,7,0,12000.00,84000.00),(58,5,5,48,1,0,8000.00,8000.00),(59,5,5,47,2,0,8000.00,16000.00),(60,5,5,46,2,0,8000.00,16000.00),(61,5,5,49,1,0,8000.00,8000.00),(62,5,2,6,1,0,65000.00,65000.00),(63,5,2,7,2,0,65000.00,130000.00),(64,5,2,8,3,0,65000.00,195000.00),(65,5,10,7,1,0,45000.00,45000.00),(66,5,12,63,13,0,2000.00,26000.00),(67,6,13,63,14,0,0.00,0.00),(68,6,11,33,2,0,130000.00,260000.00),(69,6,11,34,1,0,130000.00,130000.00),(70,6,11,39,2,0,130000.00,260000.00),(71,6,11,40,8,0,130000.00,1040000.00),(72,6,11,41,3,0,130000.00,390000.00),(73,6,11,42,3,0,130000.00,390000.00),(74,6,11,43,1,0,130000.00,130000.00),(75,6,11,44,1,0,130000.00,130000.00),(76,6,1,3,1,0,35000.00,35000.00),(77,6,1,19,3,0,35000.00,105000.00),(78,6,1,1,4,0,35000.00,140000.00),(79,6,9,3,1,0,40000.00,40000.00),(80,6,9,19,3,0,40000.00,120000.00),(81,6,9,21,1,0,40000.00,40000.00),(82,6,4,63,13,0,25000.00,325000.00),(83,6,6,55,1,0,18000.00,18000.00),(84,6,6,54,1,0,18000.00,18000.00),(85,6,6,53,2,0,18000.00,36000.00),(86,6,6,56,2,0,18000.00,36000.00),(87,6,7,63,7,0,12000.00,84000.00),(88,6,5,48,1,0,8000.00,8000.00),(89,6,5,47,2,0,8000.00,16000.00),(90,6,5,46,2,0,8000.00,16000.00),(91,6,5,49,1,0,8000.00,8000.00),(92,6,2,6,1,0,65000.00,65000.00),(93,6,2,7,2,0,65000.00,130000.00),(94,6,2,8,3,0,65000.00,195000.00),(95,6,10,7,1,0,45000.00,45000.00),(96,6,12,63,13,0,2000.00,26000.00),(97,7,13,63,14,0,0.00,0.00),(98,7,11,33,2,0,130000.00,260000.00),(99,7,11,34,1,0,130000.00,130000.00),(100,7,11,39,2,0,130000.00,260000.00),(101,7,11,40,8,0,130000.00,1040000.00),(102,7,11,41,3,0,130000.00,390000.00),(103,7,11,42,3,0,130000.00,390000.00),(104,7,11,43,1,0,130000.00,130000.00),(105,7,11,44,1,0,130000.00,130000.00),(106,7,1,3,1,0,35000.00,35000.00),(107,7,1,19,3,0,35000.00,105000.00),(108,7,1,1,4,0,35000.00,140000.00),(109,7,9,3,1,0,40000.00,40000.00),(110,7,9,19,3,0,40000.00,120000.00),(111,7,9,18,1,0,40000.00,40000.00),(112,7,9,21,1,0,40000.00,40000.00),(113,7,4,63,13,0,25000.00,325000.00),(114,7,6,55,1,0,18000.00,18000.00),(115,7,6,54,1,0,18000.00,18000.00),(116,7,6,53,2,0,18000.00,36000.00),(117,7,6,56,2,0,18000.00,36000.00),(118,7,7,63,7,0,12000.00,84000.00),(119,7,5,48,1,0,8000.00,8000.00),(120,7,5,47,2,0,8000.00,16000.00),(121,7,5,46,2,0,8000.00,16000.00),(122,7,5,49,1,0,8000.00,8000.00),(123,7,2,6,1,0,65000.00,65000.00),(124,7,2,7,2,0,65000.00,130000.00),(125,7,2,8,3,0,65000.00,195000.00),(126,7,10,7,1,0,45000.00,45000.00),(127,7,12,63,13,0,2000.00,26000.00);
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
  `id_kit` int NOT NULL,
  PRIMARY KEY (`id_empleado`),
  UNIQUE KEY `Identificacion_UNIQUE` (`Identificacion`),
  UNIQUE KEY `email_UNIQUE` (`email`),
  KEY `id_genero` (`id_genero`),
  KEY `id_area` (`id_area`),
  KEY `idx_empleado_email` (`email`),
  KEY `empleado_ubicaion_idx` (`id_ubicacion`),
  KEY `empleado_kit_idx` (`id_kit`),
  CONSTRAINT `empleado_ibfk_1` FOREIGN KEY (`id_genero`) REFERENCES `genero` (`id_genero`),
  CONSTRAINT `empleado_ibfk_2` FOREIGN KEY (`id_area`) REFERENCES `area` (`id_area`),
  CONSTRAINT `empleado_kit` FOREIGN KEY (`id_kit`) REFERENCES `kitdotacion` (`id_kit`),
  CONSTRAINT `empleado_ubicacion` FOREIGN KEY (`id_ubicacion`) REFERENCES `ubicacion` (`id_ubicacion`)
) ENGINE=InnoDB AUTO_INCREMENT=78 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `empleado`
--

LOCK TABLES `empleado` WRITE;
/*!40000 ALTER TABLE `empleado` DISABLE KEYS */;
INSERT INTO `empleado` VALUES (1,'123456789','CC','Juan Carlos','Rodríguez Silva','2004-12-22','juan.rodriguez@empresa.com','300-123-4567','Operario Senior',1,1,3,'2025-07-02',1900600.00,NULL,2,18),(2,'123456798','CC','María Elena','González Pérez','2004-12-26','maria.gonzalez@empresa.com','301-234-5678','Supervisora de Calidad',1,2,4,'2025-07-02',1500865.00,NULL,2,16),(3,'123456987','CC','Carlos Andrés','Martínez López','2004-12-15','carlos.martinez@empresa.com','302-345-6789','Técnico de Mantenimiento',1,1,3,'2025-07-02',1789546.00,NULL,2,17),(4,'123654789','CC','Ana María','Hernández Castro','2004-12-21','ana.hernandez@empresa.com','303-456-7890','Auxiliar Administrativo',1,2,2,'2025-07-02',1500865.00,NULL,2,16),(5,'321456789','CC','Luis Fernando','Vargas Moreno','2004-12-21','luis.vargas@empresa.com','304-567-8901','Coordinador de Producción',1,1,1,'2025-07-02',1900600.00,NULL,2,18),(6,'321654987','CC','Sandra Patricia','Jiménez Ruiz','2004-12-21','sandra.jimenez@empresa.com','305-678-9012','Almacenista',1,2,3,'2025-07-02',1789546.00,NULL,2,20),(7,'369258147','CC','Diego Alejandro','Torres Gómez','2004-12-21','diego.torres@empresa.com','306-789-0123','Operario',1,1,1,'2025-07-02',1900600.00,NULL,2,15),(8,'258369147','CC','Claudia Marcela','Ramírez Soto','2004-12-21','claudia.ramirez@empresa.com','307-890-1234','Inspector de Calidad',1,2,4,'2025-07-02',1789546.00,NULL,2,19),(9,'147258369','CC','Fabian Murcia','Gomez','2004-12-21','murcia21.gmz@gmail.com','3102023478','Aprendiz sena',1,1,4,'2025-07-02',1423500.00,NULL,1,16),(10,'789456123','CC','Juan Sebastian ','Duran Castellanos','2004-12-21','jdurancastellanos21@gmail.com','3102023477','Aprendiz sena',1,1,9,'2025-07-09',1423500.00,'2026-01-08',2,17),(11,'987456323','CC','Ricardo Alexander','Bohorquez','2004-12-22','rbohorquez@arrozsonora.com.co','3102023456','Analista de Sistemas',1,1,1,'2025-10-07',19078700.00,'2025-10-16',2,18),(12,'1076200149','CC','Ricardo Alexander','Gomez','2005-11-08','murcia232gmz@gmail.com','3102023456','Aprendiz sena',1,1,4,'2025-10-06',1500000.00,'2025-10-31',2,20),(13,'9874567921','CC','Bodega Central','Duran Castellanos','2025-10-11','murcia21mz@gmail.com','3102023478','Analista de Sistemas',1,1,1,'2025-10-30',1999999.00,'2025-11-08',2,15),(14,'987456312','CC','Ricardo Alexanderrr','perez','2024-02-23','murciagmz@gmail.com','3102023477','Pasante pepe',1,1,2,'2025-10-01',1700000.00,'2027-10-21',12,18),(15,'369852147','CC','roberto carlos ','arboleda castro ','2000-11-07','roberto@gmail.com','3124875963','Analista de Sistemas',0,1,10,'2025-07-09',1500000.00,'2026-01-08',12,19),(16,'101010101','CC','Juan','Pérez','1990-05-10','juan.perez@email.com','3101010101','Operario',1,1,1,'2025-07-11',1900000.00,NULL,1,16),(17,'202020203','CC','Maria','Gómez','1988-09-30','maria.gomez@email.com','3102020202','Analista',1,2,4,'2025-10-11',2800000.00,NULL,2,15),(18,'303030304','CC','Luis','Rodríguez','1985-01-20','luis.rodriguez@email.com','3103030303','Supervisor',1,1,3,'2025-05-11',3200000.00,NULL,3,18),(19,'404040405','CC','Ana','Fernández','1994-03-25','ana.fernandez@email.com','3104040404','Auxiliar',1,2,12,'2025-10-11',1500000.00,NULL,2,20),(20,'505050506','CC','Pedro','Cabrera','1993-08-15','pedro.cabrera@email.com','3105050505','Conductor',1,1,19,'2025-06-11',2200000.00,NULL,3,17),(21,'606060607','CC','Natalia','Ruiz','1996-11-11','natalia.ruiz@email.com','3106060606','Recepcionista',1,2,9,'2025-08-11',1900000.00,NULL,1,16),(22,'707070708','CC','Carlos','Martínez','1991-07-27','carlos.martinez@email.com','3107070707','Mercadista',1,1,22,'2025-04-11',2300000.00,NULL,2,17),(63,'808080809','CC','Carmen','Vásquez','1992-02-18','carmen.vasquez@email.com','3108080808','Despachador',1,2,8,'2025-10-11',1700000.00,NULL,9,19),(64,'909090910','CC','Lucas','Robledo','1984-12-13','lucas.robledo@email.com','3109090909','Mecánico',1,1,3,'2025-03-11',2550000.00,NULL,12,20),(65,'111111112','CC','Andrea','Torres','1999-07-07','andrea.torres@email.com','3101111111','Auxiliar',1,2,10,'2025-10-11',1200000.00,NULL,13,19),(66,'121212122','CC','Santiago','Ortiz','1995-01-22','santiago.ortiz@email.com','3101212121','Operario',1,1,1,'2025-07-11',1800000.00,NULL,1,17),(67,'131313132','CC','Paola','Cortes','1991-10-14','paola.cortes@email.com','3101313131','Analista',1,2,4,'2025-09-11',2600000.00,NULL,2,18),(68,'141414142','CC','Miguel','Jiménez','1982-03-12','miguel.jimenez@email.com','3101414141','Conductor',1,1,19,'2025-06-11',2100000.00,NULL,3,16),(69,'151515152','CC','Andrea','Lopez','1987-11-05','andrea.lopez@email.com','3101515151','Recepcionista',1,2,9,'2025-10-11',1600000.00,NULL,1,16),(70,'161616162','CC','Carlos','Romero','1994-06-17','carlos.romero@email.com','3101616161','Supervisor',1,1,3,'2025-07-11',3150000.00,NULL,2,17),(71,'171717172','CC','Laura','Martínez','1997-04-12','laura.martinez@email.com','3101717171','Despachador',1,2,8,'2025-10-11',1700000.00,NULL,9,16),(72,'181818182','CC','Valentina','Ruiz','2000-12-22','valentina.ruiz@email.com','3101818181','Auxiliar',1,2,10,'2025-08-11',1300000.00,NULL,3,19),(73,'191919192','CC','Jorge','Mora','1989-08-19','jorge.mora@email.com','3101919191','Mecánico',1,1,4,'2025-05-11',2400000.00,NULL,12,17),(74,'212121212','CC','Camila','Sánchez','1993-03-27','camila.sanchez@email.com','3102020222','Analista',1,2,4,'2025-09-11',2250000.00,NULL,1,20),(75,'232323233','CC','David','Gil','1992-02-17','david.gil@email.com','3102323232','Supervisor',1,1,1,'2025-02-11',3100000.00,NULL,13,19),(76,'1076200170','CC','Dario ','Gomez','2000-07-14','murcia25gmz@gmail.com','3102023477','Sistemas',1,1,3,'2024-12-19',2000000.00,NULL,3,18),(77,'1076550170','CC','ANIBAL','GONZALEZ','1996-06-14','mJNHurcia14gmz@gmail.com','31485023477','aDMINISTRACION ',1,2,9,'2020-12-24',2599999.97,NULL,2,20);
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
  `inclusion_manual` tinyint(1) NOT NULL DEFAULT '0',
  `motivo_manual` varchar(255) DEFAULT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=476 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `empleado_ciclo`
--

LOCK TABLES `empleado_ciclo` WRITE;
/*!40000 ALTER TABLE `empleado_ciclo` DISABLE KEYS */;
INSERT INTO `empleado_ciclo` VALUES (347,34,1,15,'procesado',4,1900600.00,1,NULL,0,NULL,'2025-11-13 09:07:46',NULL,'2025-11-13 09:07:46',NULL),(348,34,2,17,'procesado',4,1500865.00,4,NULL,0,NULL,'2025-11-13 09:07:46',NULL,'2025-11-13 09:07:46',NULL),(349,34,3,18,'procesado',4,1789546.00,3,NULL,0,NULL,'2025-11-13 09:07:46',NULL,'2025-11-13 09:07:46',NULL),(350,34,4,16,'procesado',4,1500865.00,2,NULL,0,NULL,'2025-11-13 09:07:46',NULL,'2025-11-13 10:36:54',1),(351,34,5,15,'procesado',4,1900600.00,1,NULL,0,NULL,'2025-11-13 09:07:46',NULL,'2025-11-13 09:07:46',NULL),(352,34,6,18,'entregado',4,1789546.00,3,NULL,0,NULL,'2025-11-13 09:07:46','2025-11-13','2025-11-13 14:47:43',1),(353,34,7,15,'procesado',4,1900600.00,1,NULL,0,NULL,'2025-11-13 09:07:46',NULL,'2025-11-13 09:07:46',NULL),(354,34,8,17,'procesado',4,1789546.00,4,NULL,0,NULL,'2025-11-13 09:07:46',NULL,'2025-11-13 09:07:46',NULL),(355,34,9,17,'procesado',4,1423500.00,4,NULL,0,NULL,'2025-11-13 09:07:46',NULL,'2025-11-13 09:07:46',NULL),(356,34,10,20,'procesado',4,1423500.00,9,NULL,0,NULL,'2025-11-13 09:07:46',NULL,'2025-11-13 09:07:46',NULL),(357,34,15,16,'procesado',4,1500000.00,10,NULL,0,NULL,'2025-11-13 09:07:46',NULL,'2025-11-14 14:01:13',NULL),(358,34,16,15,'procesado',4,1900000.00,1,NULL,0,NULL,'2025-11-13 09:07:46',NULL,'2025-11-13 09:07:46',NULL),(359,34,20,18,'procesado',5,2200000.00,19,NULL,0,NULL,'2025-11-13 09:07:46',NULL,'2025-11-14 14:01:13',NULL),(360,34,21,20,'procesado',3,1900000.00,9,NULL,0,NULL,'2025-11-13 09:07:46',NULL,'2025-11-13 09:07:46',NULL),(361,34,22,17,'procesado',7,2300000.00,22,NULL,0,NULL,'2025-11-13 09:07:46',NULL,'2025-11-14 14:01:13',NULL),(362,34,64,18,'procesado',8,2550000.00,3,NULL,0,NULL,'2025-11-13 09:07:46',NULL,'2025-11-13 09:07:46',NULL),(363,34,66,15,'procesado',4,1800000.00,1,NULL,0,NULL,'2025-11-13 09:07:46',NULL,'2025-11-13 09:07:46',NULL),(364,34,68,17,'procesado',5,2100000.00,19,NULL,0,NULL,'2025-11-13 09:07:46',NULL,'2025-11-14 14:01:13',NULL),(365,34,72,17,'procesado',3,1300000.00,10,NULL,0,NULL,'2025-11-13 09:07:46',NULL,'2025-11-14 14:01:13',NULL),(366,34,73,18,'procesado',6,2400000.00,3,NULL,0,NULL,'2025-11-13 09:07:46',NULL,'2025-11-13 09:07:46',NULL),(378,35,1,18,'procesado',4,1900600.00,3,NULL,0,NULL,'2025-11-13 14:48:47',NULL,'2025-11-13 14:48:47',NULL),(379,35,2,17,'entregado',4,1500865.00,4,NULL,0,NULL,'2025-11-13 14:48:47','2025-11-13','2025-11-13 14:50:06',1),(380,35,3,18,'procesado',4,1789546.00,3,NULL,0,NULL,'2025-11-13 14:48:47',NULL,'2025-11-13 14:48:47',NULL),(381,35,4,16,'entregado',4,1500865.00,2,NULL,0,NULL,'2025-11-13 14:48:47','2025-11-13','2025-11-13 14:50:04',1),(382,35,5,15,'entregado',4,1900600.00,1,NULL,0,NULL,'2025-11-13 14:48:47','2025-11-13','2025-11-13 14:49:52',1),(383,35,6,18,'procesado',4,1789546.00,3,NULL,0,NULL,'2025-11-13 14:48:47',NULL,'2025-11-13 14:48:47',NULL),(384,35,7,15,'entregado',4,1900600.00,1,NULL,0,NULL,'2025-11-13 14:48:47','2025-11-13','2025-11-13 14:49:50',1),(385,35,8,17,'procesado',4,1789546.00,4,NULL,0,NULL,'2025-11-13 14:48:47',NULL,'2025-11-13 14:48:47',NULL),(386,35,9,17,'procesado',4,1423500.00,4,NULL,0,NULL,'2025-11-13 14:48:47',NULL,'2025-11-13 14:48:47',NULL),(387,35,10,20,'entregado',4,1423500.00,9,NULL,0,NULL,'2025-11-13 14:48:47','2025-11-13','2025-11-13 14:49:54',1),(388,35,16,15,'entregado',4,1900000.00,1,NULL,0,NULL,'2025-11-13 14:48:47','2025-11-13','2025-11-13 14:49:47',1),(389,35,20,18,'procesado',5,2200000.00,19,NULL,0,NULL,'2025-11-13 14:48:47',NULL,'2025-11-14 14:01:13',NULL),(390,35,21,20,'entregado',3,1900000.00,9,NULL,0,NULL,'2025-11-13 14:48:47','2025-11-13','2025-11-13 14:50:01',1),(392,35,64,18,'procesado',8,2550000.00,3,NULL,0,NULL,'2025-11-13 14:48:47',NULL,'2025-11-13 14:48:47',NULL),(393,35,66,15,'procesado',4,1800000.00,1,NULL,0,NULL,'2025-11-13 14:48:47',NULL,'2025-11-13 14:48:47',NULL),(394,35,68,16,'procesado',5,2100000.00,19,NULL,0,NULL,'2025-11-13 14:48:47',NULL,'2025-11-14 14:01:13',NULL),(395,35,72,16,'procesado',3,1300000.00,10,NULL,0,NULL,'2025-11-13 14:48:47',NULL,'2025-11-14 14:01:13',NULL),(396,35,73,17,'entregado',6,2400000.00,4,NULL,0,NULL,'2025-11-13 14:48:47','2025-11-13','2025-11-13 14:50:09',1),(398,35,77,20,'entregado',58,2599999.97,9,NULL,0,NULL,'2025-11-13 14:48:47','2025-11-13','2025-11-13 14:49:57',1),(409,34,76,18,'procesado',10,2000000.00,3,NULL,0,NULL,'2025-11-13 17:07:41',NULL,'2025-11-13 17:07:41',NULL),(410,34,77,20,'procesado',58,2599999.97,9,NULL,0,NULL,'2025-11-13 17:07:41',NULL,'2025-11-13 17:07:41',NULL),(413,35,11,18,'procesado',1,19078700.00,1,NULL,1,'por que el dueño del chuzo dije que si','2025-11-14 11:30:54',NULL,'2025-11-14 11:30:54',1),(414,36,1,18,'procesado',4,1900600.00,3,NULL,0,NULL,'2025-11-14 13:27:05',NULL,'2025-11-14 13:27:05',NULL),(415,36,2,16,'procesado',4,1500865.00,4,NULL,0,NULL,'2025-11-14 13:27:05',NULL,'2025-11-14 13:27:05',NULL),(416,36,3,17,'procesado',4,1789546.00,3,NULL,0,NULL,'2025-11-14 13:27:05',NULL,'2025-11-14 13:27:05',NULL),(417,36,4,16,'procesado',4,1500865.00,2,NULL,0,NULL,'2025-11-14 13:27:05',NULL,'2025-11-14 13:27:05',NULL),(418,36,5,18,'procesado',4,1900600.00,1,NULL,0,NULL,'2025-11-14 13:27:05',NULL,'2025-11-14 13:27:05',NULL),(419,36,6,20,'procesado',4,1789546.00,3,NULL,0,NULL,'2025-11-14 13:27:05',NULL,'2025-11-14 13:27:05',NULL),(420,36,7,15,'procesado',4,1900600.00,1,NULL,0,NULL,'2025-11-14 13:27:05',NULL,'2025-11-14 13:27:05',NULL),(421,36,8,20,'procesado',4,1789546.00,4,NULL,0,NULL,'2025-11-14 13:27:05',NULL,'2025-11-14 14:01:13',NULL),(422,36,9,16,'procesado',4,1423500.00,4,NULL,0,NULL,'2025-11-14 13:27:05',NULL,'2025-11-14 13:27:05',NULL),(423,36,10,17,'procesado',4,1423500.00,9,NULL,0,NULL,'2025-11-14 13:27:05',NULL,'2025-11-14 13:27:05',NULL),(424,36,16,16,'procesado',4,1900000.00,1,NULL,0,NULL,'2025-11-14 13:27:05',NULL,'2025-11-14 13:27:05',NULL),(425,36,20,17,'procesado',5,2200000.00,19,NULL,0,NULL,'2025-11-14 13:27:05',NULL,'2025-11-14 13:27:05',NULL),(426,36,21,16,'procesado',3,1900000.00,9,NULL,0,NULL,'2025-11-14 13:27:05',NULL,'2025-11-14 13:27:05',NULL),(427,36,22,17,'procesado',7,2300000.00,22,NULL,0,NULL,'2025-11-14 13:27:05',NULL,'2025-11-14 13:27:05',NULL),(428,36,64,20,'procesado',8,2550000.00,3,NULL,0,NULL,'2025-11-14 13:27:05',NULL,'2025-11-14 13:27:05',NULL),(429,36,66,17,'procesado',4,1800000.00,1,NULL,0,NULL,'2025-11-14 13:27:05',NULL,'2025-11-14 13:27:05',NULL),(430,36,68,16,'procesado',5,2100000.00,19,NULL,0,NULL,'2025-11-14 13:27:05',NULL,'2025-11-14 13:27:05',NULL),(431,36,72,18,'procesado',3,1300000.00,10,NULL,0,NULL,'2025-11-14 13:27:05',NULL,'2025-11-14 14:01:13',NULL),(432,36,73,17,'procesado',6,2400000.00,4,NULL,0,NULL,'2025-11-14 13:27:05',NULL,'2025-11-14 13:27:05',NULL),(433,36,76,18,'procesado',10,2000000.00,3,NULL,0,NULL,'2025-11-14 13:27:05',NULL,'2025-11-14 13:27:05',NULL),(434,36,77,20,'procesado',58,2599999.97,9,NULL,0,NULL,'2025-11-14 13:27:05',NULL,'2025-11-14 13:27:05',NULL),(445,37,1,18,'procesado',4,1900600.00,3,NULL,0,NULL,'2025-11-14 15:56:53',NULL,'2025-11-14 15:56:53',NULL),(446,37,2,16,'procesado',4,1500865.00,4,NULL,0,NULL,'2025-11-14 15:56:53',NULL,'2025-11-14 15:56:53',NULL),(447,37,3,17,'procesado',4,1789546.00,3,NULL,0,NULL,'2025-11-14 15:56:53',NULL,'2025-11-14 15:56:53',NULL),(448,37,4,16,'procesado',4,1500865.00,2,NULL,0,NULL,'2025-11-14 15:56:53',NULL,'2025-11-14 15:56:53',NULL),(449,37,5,18,'procesado',4,1900600.00,1,NULL,0,NULL,'2025-11-14 15:56:53',NULL,'2025-11-14 15:56:53',NULL),(450,37,6,20,'procesado',4,1789546.00,3,NULL,0,NULL,'2025-11-14 15:56:53',NULL,'2025-11-14 15:56:53',NULL),(451,37,7,15,'procesado',4,1900600.00,1,NULL,0,NULL,'2025-11-14 15:56:53',NULL,'2025-11-14 15:56:53',NULL),(452,37,8,19,'procesado',4,1789546.00,4,NULL,0,NULL,'2025-11-14 15:56:53',NULL,'2025-11-14 15:56:53',NULL),(453,37,9,16,'procesado',4,1423500.00,4,NULL,0,NULL,'2025-11-14 15:56:53',NULL,'2025-11-14 15:56:53',NULL),(454,37,10,17,'procesado',4,1423500.00,9,NULL,0,NULL,'2025-11-14 15:56:53',NULL,'2025-11-14 15:56:53',NULL),(455,37,16,16,'procesado',4,1900000.00,1,NULL,0,NULL,'2025-11-14 15:56:53',NULL,'2025-11-14 15:56:53',NULL),(456,37,20,17,'procesado',5,2200000.00,19,NULL,0,NULL,'2025-11-14 15:56:53',NULL,'2025-11-14 15:56:53',NULL),(457,37,21,16,'procesado',3,1900000.00,9,NULL,0,NULL,'2025-11-14 15:56:53',NULL,'2025-11-14 15:56:53',NULL),(458,37,22,17,'procesado',7,2300000.00,22,NULL,0,NULL,'2025-11-14 15:56:53',NULL,'2025-11-14 15:56:53',NULL),(459,37,64,20,'procesado',8,2550000.00,3,NULL,0,NULL,'2025-11-14 15:56:53',NULL,'2025-11-14 15:56:53',NULL),(460,37,66,17,'procesado',4,1800000.00,1,NULL,0,NULL,'2025-11-14 15:56:53',NULL,'2025-11-14 15:56:53',NULL),(461,37,68,16,'procesado',5,2100000.00,19,NULL,0,NULL,'2025-11-14 15:56:53',NULL,'2025-11-14 15:56:53',NULL),(462,37,72,19,'procesado',3,1300000.00,10,NULL,0,NULL,'2025-11-14 15:56:53',NULL,'2025-11-14 15:56:53',NULL),(463,37,73,17,'procesado',6,2400000.00,4,NULL,0,NULL,'2025-11-14 15:56:53',NULL,'2025-11-14 15:56:53',NULL),(464,37,76,18,'procesado',10,2000000.00,3,NULL,0,NULL,'2025-11-14 15:56:53',NULL,'2025-11-14 15:56:53',NULL),(465,37,77,20,'procesado',58,2599999.97,9,NULL,0,NULL,'2025-11-14 15:56:53',NULL,'2025-11-14 15:56:53',NULL);
/*!40000 ALTER TABLE `empleado_ciclo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `empleado_talla_dotacion`
--

DROP TABLE IF EXISTS `empleado_talla_dotacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `empleado_talla_dotacion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_empleado` int NOT NULL,
  `id_dotacion` int NOT NULL,
  `id_talla` int NOT NULL,
  `fecha_actualizacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_empleado_dotacion` (`id_empleado`,`id_dotacion`),
  KEY `fk_etd_dotacion` (`id_dotacion`),
  KEY `fk_etd_talla` (`id_talla`),
  CONSTRAINT `fk_etd_dotacion` FOREIGN KEY (`id_dotacion`) REFERENCES `dotacion` (`id_dotacion`),
  CONSTRAINT `fk_etd_empleado` FOREIGN KEY (`id_empleado`) REFERENCES `empleado` (`id_empleado`),
  CONSTRAINT `fk_etd_talla` FOREIGN KEY (`id_talla`) REFERENCES `talla` (`id_talla`)
) ENGINE=InnoDB AUTO_INCREMENT=81 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `empleado_talla_dotacion`
--

LOCK TABLES `empleado_talla_dotacion` WRITE;
/*!40000 ALTER TABLE `empleado_talla_dotacion` DISABLE KEYS */;
INSERT INTO `empleado_talla_dotacion` VALUES (1,1,11,39,'2025-11-14 13:46:43'),(2,1,9,3,'2025-11-10 16:41:51'),(3,1,10,6,'2025-11-10 16:41:51'),(4,2,11,33,'2025-11-13 07:46:55'),(5,2,6,59,'2025-11-13 07:46:55'),(6,2,5,52,'2025-11-13 07:46:55'),(7,2,2,24,'2025-11-13 07:46:55'),(9,1,1,3,'2025-11-14 13:46:43'),(10,3,11,40,'2025-11-14 14:59:49'),(11,3,1,2,'2025-11-14 13:48:40'),(14,9,11,44,'2025-11-14 14:42:47'),(15,9,6,55,'2025-11-14 13:49:26'),(16,9,5,48,'2025-11-14 13:49:26'),(17,9,2,6,'2025-11-14 13:49:26'),(18,77,11,37,'2025-11-14 13:55:31'),(19,77,1,18,'2025-11-14 13:55:31'),(20,77,9,21,'2025-11-14 13:55:31'),(21,76,11,42,'2025-11-14 13:56:07'),(22,76,1,2,'2025-11-14 13:56:07'),(23,75,11,41,'2025-11-14 13:56:26'),(24,75,9,2,'2025-11-14 13:56:26'),(25,75,10,7,'2025-11-14 13:56:26'),(26,74,11,35,'2025-11-14 13:56:48'),(27,74,6,60,'2025-11-14 13:56:48'),(28,74,5,51,'2025-11-14 13:56:48'),(29,74,2,24,'2025-11-14 13:56:48'),(30,73,11,42,'2025-11-14 13:57:21'),(31,73,6,56,'2025-11-14 13:57:21'),(32,73,5,46,'2025-11-14 13:57:21'),(33,73,2,8,'2025-11-14 13:57:21'),(34,72,11,36,'2025-11-14 14:22:32'),(35,72,1,18,'2025-11-14 14:22:32'),(36,72,9,18,'2025-11-14 14:22:32'),(37,10,11,40,'2025-11-14 15:02:31'),(38,66,11,40,'2025-11-14 15:26:11'),(44,3,6,54,'2025-11-14 14:59:49'),(45,3,5,46,'2025-11-14 14:59:49'),(46,3,2,8,'2025-11-14 14:59:49'),(47,4,11,33,'2025-11-14 15:00:24'),(48,5,11,41,'2025-11-14 15:00:52'),(49,5,1,1,'2025-11-14 15:00:52'),(50,6,11,35,'2025-11-14 15:01:14'),(51,6,1,19,'2025-11-14 15:01:14'),(52,6,9,19,'2025-11-14 15:01:14'),(53,7,11,42,'2025-11-14 15:01:38'),(54,7,9,2,'2025-11-14 15:01:38'),(55,7,10,7,'2025-11-14 15:01:38'),(56,8,11,34,'2025-11-14 15:02:00'),(57,8,1,18,'2025-11-14 15:02:00'),(58,8,9,19,'2025-11-14 15:02:00'),(60,10,6,53,'2025-11-14 15:02:31'),(61,10,5,47,'2025-11-14 15:02:31'),(62,10,2,8,'2025-11-14 15:02:31'),(63,16,11,40,'2025-11-14 15:22:20'),(64,20,11,43,'2025-11-14 15:23:01'),(65,20,6,56,'2025-11-14 15:23:01'),(66,20,5,47,'2025-11-14 15:23:01'),(67,20,2,6,'2025-11-14 15:23:01'),(68,21,11,36,'2025-11-14 15:23:28'),(69,22,11,41,'2025-11-14 15:23:50'),(70,22,6,55,'2025-11-14 15:23:50'),(71,22,5,48,'2025-11-14 15:23:50'),(72,22,2,7,'2025-11-14 15:23:50'),(73,64,11,40,'2025-11-14 15:24:12'),(74,64,1,2,'2025-11-14 15:24:12'),(75,64,9,3,'2025-11-14 15:24:12'),(77,66,6,53,'2025-11-14 15:26:11'),(78,66,5,49,'2025-11-14 15:26:11'),(79,66,2,7,'2025-11-14 15:26:11'),(80,68,11,40,'2025-11-14 15:26:27');
/*!40000 ALTER TABLE `empleado_talla_dotacion` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=135 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `entregadotacion`
--

LOCK TABLES `entregadotacion` WRITE;
/*!40000 ALTER TABLE `entregadotacion` DISABLE KEYS */;
INSERT INTO `entregadotacion` VALUES (99,6,NULL,13,64,1,'2025-11-11',''),(100,6,NULL,11,33,1,'2025-11-11',''),(101,6,NULL,1,20,1,'2025-11-11',''),(102,1,NULL,9,3,1,'2025-11-11',''),(103,1,NULL,10,6,1,'2025-11-11',''),(104,1,NULL,11,39,1,'2025-11-11',''),(105,1,NULL,4,63,1,'2025-11-11',''),(106,1,NULL,12,63,1,'2025-11-11',''),(107,1,NULL,7,63,1,'2025-11-11',''),(108,4,NULL,13,64,1,'2025-11-11',''),(109,4,NULL,11,33,1,'2025-11-11',''),(110,4,NULL,12,64,1,'2025-11-11',''),(111,4,NULL,4,64,1,'2025-11-11',''),(112,1,NULL,9,3,1,'2025-11-11',''),(113,1,NULL,10,6,1,'2025-11-11',''),(114,1,NULL,11,39,1,'2025-11-11',''),(115,1,NULL,4,63,1,'2025-11-11',''),(116,1,NULL,12,63,1,'2025-11-11',''),(117,1,NULL,7,63,1,'2025-11-11',''),(118,1,NULL,9,3,1,'2025-11-11',''),(119,1,NULL,10,6,1,'2025-11-11',''),(120,1,NULL,11,39,1,'2025-11-11',''),(121,1,NULL,4,63,1,'2025-11-11',''),(122,1,NULL,12,63,1,'2025-11-11',''),(123,1,NULL,7,63,1,'2025-11-11',''),(124,4,NULL,13,64,1,'2025-11-13',''),(125,4,NULL,11,33,1,'2025-11-13',''),(126,4,NULL,12,64,1,'2025-11-13',''),(127,4,NULL,4,64,1,'2025-11-13',''),(128,4,NULL,13,64,1,'2025-11-13',''),(129,4,NULL,11,33,1,'2025-11-13',''),(130,4,NULL,12,64,1,'2025-11-13',''),(131,4,NULL,4,64,1,'2025-11-13',''),(132,6,NULL,13,64,1,'2025-11-13',''),(133,6,NULL,11,33,1,'2025-11-13',''),(134,6,NULL,1,20,1,'2025-11-13','');
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
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historialmovimientos`
--

LOCK TABLES `historialmovimientos` WRITE;
/*!40000 ALTER TABLE `historialmovimientos` DISABLE KEYS */;
INSERT INTO `historialmovimientos` VALUES (1,'Empleado',1,'INSERT','2025-10-07 10:05:01','admin','Registro nuevo empleado Juan Carlos Rodríguez'),(2,'SolicitudDotacion',1,'INSERT','2025-10-07 10:05:01','supervisor','Nueva solicitud kit operario'),(3,'StockDotacion',1,'UPDATE','2025-10-07 10:05:01','almacenista','Actualización stock por entrega'),(4,'EntregaDotacion',1,'INSERT','2025-10-07 10:05:01','almacenista','Registro entrega a empleado'),(5,'PedidoCompras',1,'INSERT','2025-10-07 10:05:01','admin','Nuevo pedido de compra generado'),(6,'entregadotacion',6,'INSERT','2025-10-29 12:24:09','sistema','Entrega registrada: Camisa Polo Empresa - Cantidad: 1 - Empleado: Juan Carlos Rodríguez Silva'),(7,'entregadotacion',7,'INSERT','2025-11-04 07:19:30','sistema','Entrega registrada: Camisa Polo Empresa - Cantidad: 1 - Empleado: Juan Carlos Rodríguez Silva'),(8,'entregadotacion',23,'DELETE','2025-11-05 13:35:03','sistema','Entrega eliminada (grupo empleado/fecha)'),(9,'entregadotacion',7,'DELETE','2025-11-05 13:35:06','sistema','Entrega eliminada (grupo empleado/fecha)'),(10,'entregadotacion',6,'DELETE','2025-11-05 13:35:08','sistema','Entrega eliminada (grupo empleado/fecha)'),(11,'entregadotacion',4,'DELETE','2025-11-05 13:35:10','sistema','Entrega eliminada (grupo empleado/fecha)'),(12,'entregadotacion',1,'DELETE','2025-11-05 13:35:12','sistema','Entrega eliminada (grupo empleado/fecha)'),(13,'entregadotacion',77,'UPDATE','2025-11-06 14:17:26','sistema','Entrega actualizada (grupo empleado/fecha)'),(14,'entregadotacion',77,'UPDATE','2025-11-06 14:17:35','sistema','Entrega actualizada (grupo empleado/fecha)'),(15,'entregadotacion',83,'DELETE','2025-11-06 16:36:31','sistema','Entrega eliminada (grupo empleado/fecha)'),(16,'entregadotacion',77,'DELETE','2025-11-10 11:00:00','sistema','Entrega eliminada (grupo empleado/fecha)'),(17,'entregadotacion',90,'DELETE','2025-11-10 11:00:03','sistema','Entrega eliminada (grupo empleado/fecha)'),(18,'entregadotacion',93,'DELETE','2025-11-10 12:04:01','sistema','Entrega eliminada (grupo empleado/fecha)');
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
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kitdotacion`
--

LOCK TABLES `kitdotacion` WRITE;
/*!40000 ALTER TABLE `kitdotacion` DISABLE KEYS */;
INSERT INTO `kitdotacion` VALUES (15,'kit producción ',1,1),(16,'kit administración ',2,1),(17,'Kit calidad',4,1),(18,'kit mantenimiento',3,1),(19,'cualquiera ',12,0),(20,'Kit recepcion',9,1),(21,'kit sistemas',6,1),(22,'kIT COCINA',12,1),(23,'kIt servicio general',12,1),(24,'kit noche',12,1);
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
  `id_ciclo` int DEFAULT NULL,
  `fecha` date NOT NULL,
  `estado` enum('enviado','recibido_parcial','recibido_completo') NOT NULL DEFAULT 'enviado',
  `observaciones` text,
  `total_pedido` decimal(12,2) DEFAULT '0.00',
  PRIMARY KEY (`id_pedido`),
  KEY `idx_pedidocompras_ciclo` (`id_ciclo`),
  CONSTRAINT `fk_pedidocompras_ciclo` FOREIGN KEY (`id_ciclo`) REFERENCES `ciclo_dotacion` (`id_ciclo`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pedidocompras`
--

LOCK TABLES `pedidocompras` WRITE;
/*!40000 ALTER TABLE `pedidocompras` DISABLE KEYS */;
INSERT INTO `pedidocompras` VALUES (1,NULL,'2024-09-15','recibido_completo','Pedido mensual uniformes',15750000.00),(2,NULL,'2024-10-01','enviado','Reposición stock EPP',8500000.00),(3,NULL,'2024-10-07','enviado','Pedido urgente calzado seguridad',12000000.00),(4,36,'2025-11-14','enviado','Pedido generado automáticamente para ciclo PRUEVA PEDIDO',4236000.00),(5,36,'2025-11-14','enviado','Pedido generado automáticamente para ciclo PRUEVA PEDIDO',4236000.00),(6,36,'2025-11-14','enviado','Pedido generado automáticamente para ciclo PRUEVA PEDIDO',4236000.00),(7,37,'2025-11-14','enviado','Pedido generado automáticamente para ciclo Ultimo intento',4276000.00);
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
INSERT INTO `proveedor` VALUES (1,'Textiles Industriales S.A.S.','601-234-5678','ventas@textilesindustriales.com','Zona Industrial Puente Aranda, Bogotá',0),(2,'Uniformes y Dotaciones Ltda.','604-876-5432','comercial@uniformesdotaciones.com','Itagüí, Antioquia',0),(3,'EPP Seguridad Total','801-345-6789','info@eppseguridad.com','Fontibón, Bogotá',1),(4,'Calzado Industrial Cñolombia','602-567-8999','pedidos@calzadoindustrial.com','Cali, Valle del Cauca',1),(5,'flexxooo','3102023477','juan_duran@gmail.com','Bogota Colombia',0);
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
INSERT INTO `usuario` VALUES (1,9,'fabianmurcia.gomez','murcia21.gmz@gmail.com','$2a$12$lx3o6GMtKRDX/4bIUg1z8OntlSmYksOhm6kcISDR1L.g0tWkj/lLG',4,1,'2025-11-14 16:03:51','2025-10-15 08:40:49','2025-11-14 16:03:51',NULL,NULL,NULL,NULL),(3,10,'juansebastian.durancastellanos','jdurancastellanos21@gmail.com','$2a$12$g0Q4FGAe78qgkRq.VyE2mebYLZGR.zzVe4W6L7qMdNMZ2JiiDy7tO',3,1,'2025-10-21 15:57:01','2025-10-21 10:41:14','2025-11-13 10:37:14',1,1,NULL,NULL),(4,12,'pepito','rbohorquez@arrozsonora.com.co','$2a$12$OJ6QWvnUQ.3/vAWbHrc93uOWu7ziQwzjgAnTvAtRtfAUNY2YQVUZC',1,1,NULL,'2025-10-31 12:10:46','2025-11-13 10:37:14',1,1,NULL,NULL);
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

-- Dump completed on 2025-11-14 16:11:14
