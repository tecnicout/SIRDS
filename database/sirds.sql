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

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '27519af4-b434-11f0-aee2-f439092d7bcb:1-1425';

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
INSERT INTO `area` VALUES (1,'Producción','activa'),(2,'Administración','inactiva'),(3,'Mantenimiento','activa'),(4,'Calidad','activa'),(6,'Administración','inactiva'),(7,'Almacén Principal','activa'),(8,'Despachos','activa'),(9,'Recepción','activa'),(10,'Inventario','activa'),(11,'Archivo','inactiva'),(12,'Cafeteria','activa'),(19,'Logistica Flota Propia','activa'),(22,'Mercadista','activa');
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
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ciclo_dotacion`
--

LOCK TABLES `ciclo_dotacion` WRITE;
/*!40000 ALTER TABLE `ciclo_dotacion` DISABLE KEYS */;
INSERT INTO `ciclo_dotacion` VALUES (41,'dE PRUEVA','2026-01-05','2025-11-05','2026-01-05','cerrado',2,1,22,1423500.00,1,'2025-11-20 16:05:45','2025-11-20 16:26:24',''),(44,'Nuevo ciclo','2025-12-15','2025-10-15','2025-12-15','activo',4,1,22,1500000.00,1,'2025-11-20 16:53:32','2025-11-20 16:53:32','');
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
) ENGINE=InnoDB AUTO_INCREMENT=401 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detallepedidocompras`
--

LOCK TABLES `detallepedidocompras` WRITE;
/*!40000 ALTER TABLE `detallepedidocompras` DISABLE KEYS */;
INSERT INTO `detallepedidocompras` VALUES (252,12,13,63,14,14,0.00,0.00),(253,12,11,33,2,2,130000.00,260000.00),(254,12,11,34,1,1,130000.00,130000.00),(255,12,11,39,2,2,130000.00,260000.00),(256,12,11,40,8,8,130000.00,1040000.00),(257,12,11,41,3,3,130000.00,390000.00),(258,12,11,42,3,3,130000.00,390000.00),(259,12,11,43,1,1,130000.00,130000.00),(260,12,11,44,1,1,130000.00,130000.00),(261,12,1,3,1,1,35000.00,35000.00),(262,12,1,19,3,3,35000.00,105000.00),(263,12,1,1,4,4,35000.00,140000.00),(264,12,9,3,1,1,40000.00,40000.00),(265,12,9,19,3,3,40000.00,120000.00),(266,12,9,18,1,1,40000.00,40000.00),(267,12,9,21,1,1,40000.00,40000.00),(268,12,4,63,13,13,25000.00,325000.00),(269,12,6,55,1,1,18000.00,18000.00),(270,12,6,54,1,1,18000.00,18000.00),(271,12,6,53,2,2,18000.00,36000.00),(272,12,6,56,2,2,18000.00,36000.00),(273,12,7,63,7,7,12000.00,84000.00),(274,12,5,48,1,1,8000.00,8000.00),(275,12,5,47,2,2,8000.00,16000.00),(276,12,5,46,2,2,8000.00,16000.00),(277,12,5,49,1,1,8000.00,8000.00),(278,12,2,6,1,1,65000.00,65000.00),(279,12,2,7,2,2,65000.00,130000.00),(280,12,2,8,3,3,65000.00,195000.00),(281,12,10,7,1,1,45000.00,45000.00),(282,12,12,63,13,13,2000.00,26000.00),(338,15,13,63,8,8,0.00,0.00),(339,15,11,33,1,1,130000.00,130000.00),(340,15,11,34,1,1,130000.00,130000.00),(341,15,11,39,1,1,130000.00,130000.00),(342,15,11,40,5,5,130000.00,650000.00),(343,15,11,37,1,1,130000.00,130000.00),(344,15,11,42,2,2,130000.00,260000.00),(345,15,11,44,1,1,130000.00,130000.00),(346,15,1,3,1,1,35000.00,35000.00),(347,15,1,18,3,3,35000.00,105000.00),(348,15,9,2,2,2,40000.00,80000.00),(349,15,9,18,1,1,40000.00,40000.00),(350,15,9,21,1,0,40000.00,40000.00),(351,15,4,63,8,8,25000.00,200000.00),(352,15,6,53,2,2,18000.00,36000.00),(353,15,6,56,1,1,18000.00,18000.00),(354,15,7,63,4,4,12000.00,48000.00),(355,15,5,47,1,1,8000.00,8000.00),(356,15,5,46,1,1,8000.00,8000.00),(357,15,5,49,1,1,8000.00,8000.00),(358,15,2,7,1,0,65000.00,65000.00),(359,15,2,8,2,0,65000.00,130000.00),(360,15,10,7,1,0,45000.00,45000.00),(361,15,12,63,8,14,2000.00,16000.00),(362,16,13,63,1,0,0.00,0.00),(363,16,11,40,1,1,130000.00,130000.00),(364,16,11,44,1,1,130000.00,130000.00),(365,16,4,63,2,0,25000.00,50000.00),(366,16,6,53,1,0,18000.00,18000.00),(367,16,7,63,1,0,12000.00,12000.00),(368,16,5,47,1,0,8000.00,8000.00),(369,16,2,8,1,15,65000.00,65000.00),(370,16,12,63,2,0,2000.00,4000.00),(371,17,13,63,2,0,0.00,0.00),(372,17,11,33,1,8,130000.00,130000.00),(373,17,11,40,1,1,130000.00,130000.00),(374,17,11,43,1,1,130000.00,130000.00),(375,17,11,44,1,1,130000.00,130000.00),(376,17,1,20,1,0,35000.00,35000.00),(377,17,9,18,1,0,40000.00,40000.00),(378,17,4,63,3,0,25000.00,75000.00),(379,17,6,53,1,0,18000.00,18000.00),(380,17,6,56,1,0,18000.00,18000.00),(381,17,7,63,2,0,12000.00,24000.00),(382,17,5,47,2,0,8000.00,16000.00),(383,17,2,6,1,0,65000.00,65000.00),(384,17,2,8,1,0,65000.00,65000.00),(385,17,12,63,3,0,2000.00,6000.00),(386,18,13,63,2,0,0.00,0.00),(387,18,11,33,1,0,130000.00,130000.00),(388,18,11,40,1,0,130000.00,130000.00),(389,18,11,43,1,0,130000.00,130000.00),(390,18,11,44,1,0,130000.00,130000.00),(391,18,1,20,1,0,35000.00,35000.00),(392,18,9,18,1,0,40000.00,40000.00),(393,18,4,63,3,0,25000.00,75000.00),(394,18,6,53,1,0,18000.00,18000.00),(395,18,6,56,1,0,18000.00,18000.00),(396,18,7,63,2,0,12000.00,24000.00),(397,18,5,47,2,0,8000.00,16000.00),(398,18,2,6,1,0,65000.00,65000.00),(399,18,2,8,1,0,65000.00,65000.00),(400,18,12,63,3,0,2000.00,6000.00);
/*!40000 ALTER TABLE `detallepedidocompras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detallerecepcionpedido`
--

DROP TABLE IF EXISTS `detallerecepcionpedido`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detallerecepcionpedido` (
  `id_recepcion_detalle` int NOT NULL AUTO_INCREMENT,
  `id_recepcion` int NOT NULL,
  `id_detalle_pedido` int NOT NULL,
  `id_dotacion` int NOT NULL,
  `id_talla` int DEFAULT NULL,
  `cantidad_recibida` int NOT NULL,
  `precio_unitario` decimal(12,2) DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_recepcion_detalle`),
  KEY `fk_detalle_recepcion` (`id_recepcion`),
  KEY `fk_detalle_recepcion_dotacion` (`id_dotacion`),
  KEY `fk_detalle_recepcion_talla` (`id_talla`),
  KEY `idx_detalle_recepcion_pedido_detalle` (`id_detalle_pedido`),
  CONSTRAINT `fk_detalle_recepcion` FOREIGN KEY (`id_recepcion`) REFERENCES `recepcionpedido` (`id_recepcion`) ON DELETE CASCADE,
  CONSTRAINT `fk_detalle_recepcion_dotacion` FOREIGN KEY (`id_dotacion`) REFERENCES `dotacion` (`id_dotacion`) ON DELETE RESTRICT,
  CONSTRAINT `fk_detalle_recepcion_pedido` FOREIGN KEY (`id_detalle_pedido`) REFERENCES `detallepedidocompras` (`id_detalle`) ON DELETE CASCADE,
  CONSTRAINT `fk_detalle_recepcion_talla` FOREIGN KEY (`id_talla`) REFERENCES `talla` (`id_talla`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detallerecepcionpedido`
--

LOCK TABLES `detallerecepcionpedido` WRITE;
/*!40000 ALTER TABLE `detallerecepcionpedido` DISABLE KEYS */;
INSERT INTO `detallerecepcionpedido` VALUES (1,1,253,11,33,2,130000.00,'2025-11-20 14:15:02'),(2,2,254,11,34,1,130000.00,'2025-11-20 14:15:31'),(3,2,255,11,39,1,130000.00,'2025-11-20 14:15:31'),(4,3,339,11,33,1,130000.00,'2025-11-20 16:00:19'),(5,3,340,11,34,1,130000.00,'2025-11-20 16:00:19'),(6,3,341,11,39,1,130000.00,'2025-11-20 16:00:19'),(7,3,342,11,40,5,130000.00,'2025-11-20 16:00:19'),(8,3,343,11,37,1,130000.00,'2025-11-20 16:00:19'),(9,3,344,11,42,2,130000.00,'2025-11-20 16:00:19'),(10,3,345,11,44,1,130000.00,'2025-11-20 16:00:19'),(11,4,351,4,63,8,25000.00,'2025-11-20 16:00:23'),(12,5,352,6,53,2,18000.00,'2025-11-20 16:00:24'),(13,5,353,6,56,1,18000.00,'2025-11-20 16:00:24'),(14,6,354,7,63,4,12000.00,'2025-11-20 16:00:25'),(15,7,355,5,47,1,8000.00,'2025-11-20 16:00:26'),(16,7,356,5,46,1,8000.00,'2025-11-20 16:00:26'),(17,7,357,5,49,1,8000.00,'2025-11-20 16:00:26'),(18,8,361,12,63,8,2000.00,'2025-11-20 16:00:30'),(19,8,361,12,63,6,2000.00,'2025-11-20 16:00:30'),(20,9,338,13,63,8,0.00,'2025-11-20 16:00:32'),(21,10,348,9,2,2,40000.00,'2025-11-20 16:00:35'),(22,10,349,9,18,1,40000.00,'2025-11-20 16:00:35'),(23,11,346,1,3,1,35000.00,'2025-11-20 16:00:36'),(24,11,347,1,18,3,35000.00,'2025-11-20 16:00:36'),(25,12,363,11,40,1,130000.00,'2025-11-20 16:13:43'),(26,12,364,11,44,1,130000.00,'2025-11-20 16:13:43'),(27,13,369,2,8,1,65000.00,'2025-11-20 16:15:14'),(28,13,369,2,8,14,65000.00,'2025-11-20 16:15:14'),(29,14,268,4,63,13,25000.00,'2025-11-20 16:30:09'),(30,14,269,6,55,1,18000.00,'2025-11-20 16:30:09'),(31,14,270,6,54,1,18000.00,'2025-11-20 16:30:09'),(32,14,271,6,53,2,18000.00,'2025-11-20 16:30:09'),(33,14,272,6,56,2,18000.00,'2025-11-20 16:30:09'),(34,14,273,7,63,7,12000.00,'2025-11-20 16:30:09'),(35,14,274,5,48,1,8000.00,'2025-11-20 16:30:09'),(36,14,275,5,47,2,8000.00,'2025-11-20 16:30:09'),(37,14,276,5,46,2,8000.00,'2025-11-20 16:30:09'),(38,14,277,5,49,1,8000.00,'2025-11-20 16:30:09'),(39,14,282,12,63,13,2000.00,'2025-11-20 16:30:09'),(40,15,255,11,39,1,130000.00,'2025-11-20 16:30:19'),(41,15,256,11,40,8,130000.00,'2025-11-20 16:30:19'),(42,15,257,11,41,3,130000.00,'2025-11-20 16:30:19'),(43,15,258,11,42,3,130000.00,'2025-11-20 16:30:19'),(44,15,259,11,43,1,130000.00,'2025-11-20 16:30:19'),(45,15,260,11,44,1,130000.00,'2025-11-20 16:30:19'),(46,15,252,13,63,14,0.00,'2025-11-20 16:30:19'),(47,15,261,1,3,1,35000.00,'2025-11-20 16:30:19'),(48,15,262,1,19,3,35000.00,'2025-11-20 16:30:19'),(49,15,263,1,1,4,35000.00,'2025-11-20 16:30:19'),(50,15,264,9,3,1,40000.00,'2025-11-20 16:30:19'),(51,15,265,9,19,3,40000.00,'2025-11-20 16:30:19'),(52,15,266,9,18,1,40000.00,'2025-11-20 16:30:19'),(53,15,267,9,21,1,40000.00,'2025-11-20 16:30:19'),(54,15,278,2,6,1,65000.00,'2025-11-20 16:30:19'),(55,15,279,2,7,2,65000.00,'2025-11-20 16:30:19'),(56,15,280,2,8,3,65000.00,'2025-11-20 16:30:19'),(57,15,281,10,7,1,45000.00,'2025-11-20 16:30:19'),(58,16,372,11,33,1,130000.00,'2025-11-20 17:03:45'),(59,16,373,11,40,1,130000.00,'2025-11-20 17:03:45'),(60,16,374,11,43,1,130000.00,'2025-11-20 17:03:45'),(61,16,375,11,44,1,130000.00,'2025-11-20 17:03:45'),(62,16,372,11,33,7,130000.00,'2025-11-20 17:03:45');
/*!40000 ALTER TABLE `detallerecepcionpedido` ENABLE KEYS */;
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
INSERT INTO `dotacion` VALUES (1,'Camisa Polo Empresa','Camisa polo con logo bordado, 100% algodón',1,'Unidad',1,1,35000.00),(2,'Pantalón Jean Industrial','Pantalón jean reforzado para trabajo industrial',1,'Unidad',1,1,65000.00),(3,'Zapatos de Seguridad','Zapatos con puntera de acero y suela antideslizante',1,'Par',2,4,120000.00),(4,'Casco de Seguridad','Casco industrial con barboquejo ajustable',0,'Unidad',3,3,25000.00),(5,'Guantes de Seguridad','Guantes antideslizantes para manipulación',1,'Par',3,3,8000.00),(6,'Chaleco Reflectivo','Chaleco con bandas reflectivas alta visibilidad',1,'Unidad',3,3,18000.00),(7,'Gafas de Seguridad','Gafas protectoras con filtro UV',0,'Unidad',3,3,12000.00),(8,'Overol Industrial','Overol completo para áreas de producción',1,'Unidad',1,1,85000.00),(9,'Camisón Térmico','Camisón térmico para operario',1,'Unidad',1,1,40000.00),(10,'Pantalón Térmico','Pantalón térmico para operario',1,'Unidad',1,1,45000.00),(11,'Botas Punta de Acero','Botas de seguridad con punta de acero',1,'Par',2,4,130000.00),(12,'Tapabocas','Tapabocas de seguridad industrial',0,'Unidad',3,3,2000.00),(13,'Bata desechable ','Batas quirúrgicas. ',0,'unidad',3,5,0.00),(14,'chal','adtaesthuyste',1,'0',4,5,5000.00);
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
) ENGINE=InnoDB AUTO_INCREMENT=80 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `empleado`
--

LOCK TABLES `empleado` WRITE;
/*!40000 ALTER TABLE `empleado` DISABLE KEYS */;
INSERT INTO `empleado` VALUES (1,'123456789','CC','Juan Carlos','Rodríguez Silva','2004-12-22','juan.rodriguez@empresa.com','300-123-4567','Operario Senior',0,1,3,'2025-07-02',1900600.00,NULL,2,18),(2,'123456798','CC','María Elena','González Pérez','2004-12-26','maria.gonzalez@empresa.com','301-234-5678','Supervisora de Calidad',0,2,4,'2025-07-02',1500865.00,NULL,2,16),(3,'123456987','CC','Carlos Andrés','Martínez López','2004-12-15','carlos.martinez@empresa.com','302-345-6789','Técnico de Mantenimiento',0,1,3,'2025-07-02',1789546.00,NULL,2,17),(4,'123654789','CC','Ana María','Hernández Castro','2004-12-21','ana.hernandez@empresa.com','303-456-7890','Auxiliar Administrativo',0,2,2,'2025-07-02',1500865.00,NULL,2,16),(5,'321456789','CC','Luis Fernando','Vargas Moreno','2004-12-21','luis.vargas@empresa.com','304-567-8901','Coordinador de Producción',0,1,1,'2025-07-02',1900600.00,NULL,2,18),(6,'321654987','CC','Sandra Patricia','Jiménez Ruiz','2004-12-21','sandra.jimenez@empresa.com','305-678-9012','Almacenista',0,2,3,'2025-07-02',1789546.00,NULL,2,20),(7,'369258147','CC','Diego Alejandro','Torres Gómez','2004-12-21','diego.torres@empresa.com','306-789-0123','Operario',0,1,1,'2025-07-02',1900600.00,NULL,2,15),(8,'258369147','CC','Claudia Marcela','Ramírez Soto','2004-12-21','claudia.ramirez@empresa.com','307-890-1234','Inspector de Calidad',0,2,4,'2025-07-02',1789546.00,NULL,2,19),(9,'147258369','CC','Fabian Murcia','Gomez','2004-12-21','murcia21.gmz@gmail.com','3102023478','Aprendiz sena',1,1,4,'2025-07-02',1423500.00,NULL,1,16),(10,'789456123','CC','Juan Sebastian ','Duran Castellanos','2004-12-21','jdurancastellanos21@gmail.com','3102023477','Aprendiz sena',1,1,9,'2025-07-09',1423500.00,'2026-01-08',2,17),(11,'987456323','CC','Ricardo Alexander','Bohorquez','2004-12-22','rbohorquez@arrozsonora.com.co','3102023456','Analista de Sistemas',0,1,1,'2025-10-07',19078700.00,'2025-10-16',2,18),(12,'1076200149','CC','Ricardo Alexander','Gomez','2005-11-08','murcia232gmz@gmail.com','3102023456','Aprendiz sena',0,1,4,'2025-10-06',1500000.00,'2025-10-31',2,20),(13,'9874567921','CC','Bodega Central','Duran Castellanos','2025-10-11','murcia21mz@gmail.com','3102023478','Analista de Sistemas',0,1,1,'2025-10-30',1999999.00,'2025-11-08',2,15),(14,'987456312','CC','Ricardo Alexanderrr','perez','2024-02-23','murciagmz@gmail.com','3102023477','Pasante pepe',0,1,2,'2025-10-01',1700000.00,'2027-10-21',16,18),(15,'369852147','CC','roberto carlos ','arboleda castro ','2000-11-07','roberto@gmail.com','3124875963','Analista de Sistemas',0,1,10,'2025-07-09',1500000.00,'2026-01-08',16,19),(16,'101010101','CC','Juan','Pérez','1990-05-10','juan.perez@email.com','3101010101','Operario',0,1,1,'2025-07-11',1900000.00,NULL,1,16),(17,'202020203','CC','Maria','Gómez','1988-09-30','maria.gomez@email.com','3102020202','Analista',0,2,4,'2025-10-11',2800000.00,NULL,2,15),(18,'303030304','CC','Luis','Rodríguez','1985-01-20','luis.rodriguez@email.com','3103030303','Supervisor',0,1,3,'2025-05-11',3200000.00,NULL,9,18),(19,'404040405','CC','Ana','Fernández','1994-03-25','ana.fernandez@email.com','3104040404','Auxiliar',0,2,12,'2025-10-11',1500000.00,NULL,2,20),(20,'505050506','CC','Pedro','Cabrera','1993-08-15','pedro.cabrera@email.com','3105050505','Conductor',1,1,19,'2025-06-11',2200000.00,NULL,9,17),(21,'606060607','CC','Natalia','Ruiz','1996-11-11','natalia.ruiz@email.com','3106060606','Recepcionista',0,2,9,'2025-08-11',1900000.00,NULL,1,16),(22,'707070708','CC','Carlos','Martínez','1991-07-27','carlos.martinez@email.com','3107070707','Mercadista',0,1,22,'2025-04-11',2300000.00,NULL,2,17),(63,'808080809','CC','Carmen','Vásquez','1992-02-18','carmen.vasquez@email.com','3108080808','Despachador',0,2,8,'2025-10-11',1700000.00,NULL,9,19),(64,'909090910','CC','Lucas','Robledo','1984-12-13','lucas.robledo@email.com','3109090909','Mecánico',0,1,3,'2025-03-11',2550000.00,NULL,16,20),(65,'111111112','CC','Andrea','Torres','1999-07-07','andrea.torres@email.com','3101111111','Auxiliar',0,2,10,'2025-10-11',1200000.00,NULL,9,19),(66,'121212122','CC','Santiago','Ortiz','1995-01-22','santiago.ortiz@email.com','3101212121','Operario',0,1,1,'2025-07-11',1800000.00,NULL,1,17),(67,'131313132','CC','Paola','Cortes','1991-10-14','paola.cortes@email.com','3101313131','Analista',0,2,4,'2025-09-11',2600000.00,NULL,2,18),(68,'141414142','CC','Miguel','Jiménez','1982-03-12','miguel.jimenez@email.com','3101414141','Conductor',0,1,19,'2025-06-11',2100000.00,NULL,16,16),(69,'151515152','CC','Andrea','Lopez','1987-11-05','andrea.lopez@email.com','3101515151','Recepcionista',0,2,9,'2025-10-11',1600000.00,NULL,1,16),(70,'161616162','CC','Carlos','Romero','1994-06-17','carlos.romero@email.com','3101616161','Supervisor',0,1,3,'2025-07-11',3150000.00,NULL,2,17),(71,'171717172','CC','Laura','Martínez','1997-04-12','laura.martinez@email.com','3101717171','Despachador',0,2,8,'2025-10-11',1700000.00,NULL,9,16),(72,'181818182','CC','Valentina','Ruiz','2000-12-22','valentina.ruiz@email.com','3101818181','Auxiliar',0,2,10,'2025-08-11',1300000.00,NULL,16,19),(73,'191919192','CC','Jorge','Mora','1989-08-19','jorge.mora@email.com','3101919191','Mecánico',0,1,4,'2025-05-11',2400000.00,NULL,16,17),(74,'212121212','CC','Camila','Sánchez','1993-03-27','camila.sanchez@email.com','3102020222','Analista',0,2,4,'2025-09-11',2250000.00,NULL,1,20),(75,'232323233','CC','David','Gil','1992-02-17','david.gil@email.com','3102323232','Supervisor',0,1,1,'2025-02-11',3100000.00,NULL,9,19),(76,'1076200170','CC','Dario ','Gomez','2000-07-14','murcia25gmz@gmail.com','3102023477','Sistemas',0,1,1,'2025-11-01',2000000.00,NULL,16,15),(77,'1076550170','CC','ANIBAL','GONZALEZ','1996-06-14','mJNHurcia14gmz@gmail.com','31485023477','aDMINISTRACION ',0,2,9,'2020-12-24',2599999.97,NULL,2,20),(78,'987456388','CC','Sandra Milena ','Garcia','2000-01-04','sgarcia@arrozsonora.com.co','310202557','Asistente de Recursos Humanos ',1,2,9,'2022-11-30',2500000.00,NULL,16,20),(79,'987456321','CC','pepe juan','cabrera','1998-07-15','pepejuan@arrozsonora.com.co','3102023477','chef',1,1,12,'2025-02-05',3000000.00,NULL,16,22);
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
) ENGINE=InnoDB AUTO_INCREMENT=566 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `empleado_ciclo`
--

LOCK TABLES `empleado_ciclo` WRITE;
/*!40000 ALTER TABLE `empleado_ciclo` DISABLE KEYS */;
INSERT INTO `empleado_ciclo` VALUES (553,41,9,16,'entregado',4,1423500.00,4,NULL,0,NULL,'2025-11-20 16:05:45','2025-11-20','2025-11-20 16:17:52',1),(554,41,10,17,'entregado',4,1423500.00,9,NULL,0,NULL,'2025-11-20 16:05:45','2025-11-20','2025-11-20 16:26:08',1),(562,44,9,16,'procesado',4,1423500.00,4,NULL,0,NULL,'2025-11-20 16:53:32',NULL,'2025-11-20 16:53:32',NULL),(563,44,10,17,'procesado',4,1423500.00,9,NULL,0,NULL,'2025-11-20 16:53:32',NULL,'2025-11-20 16:53:32',NULL),(564,44,20,17,'procesado',5,2200000.00,19,NULL,0,NULL,'2025-11-20 16:53:32',NULL,'2025-11-20 16:53:32',NULL),(565,44,78,20,'procesado',35,2500000.00,9,NULL,0,NULL,'2025-11-20 16:53:32',NULL,'2025-11-20 16:53:32',NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=84 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `empleado_talla_dotacion`
--

LOCK TABLES `empleado_talla_dotacion` WRITE;
/*!40000 ALTER TABLE `empleado_talla_dotacion` DISABLE KEYS */;
INSERT INTO `empleado_talla_dotacion` VALUES (1,1,11,39,'2025-11-14 13:46:43'),(2,1,9,3,'2025-11-10 16:41:51'),(3,1,10,6,'2025-11-10 16:41:51'),(4,2,11,33,'2025-11-13 07:46:55'),(5,2,6,59,'2025-11-13 07:46:55'),(6,2,5,52,'2025-11-13 07:46:55'),(7,2,2,24,'2025-11-13 07:46:55'),(9,1,1,3,'2025-11-14 13:46:43'),(10,3,11,40,'2025-11-14 14:59:49'),(11,3,1,2,'2025-11-14 13:48:40'),(14,9,11,44,'2025-11-14 14:42:47'),(15,9,6,55,'2025-11-14 13:49:26'),(16,9,5,48,'2025-11-14 13:49:26'),(17,9,2,6,'2025-11-14 13:49:26'),(18,77,11,37,'2025-11-14 13:55:31'),(19,77,1,18,'2025-11-14 13:55:31'),(20,77,9,21,'2025-11-14 13:55:31'),(21,76,11,42,'2025-11-14 13:56:07'),(22,76,1,2,'2025-11-14 13:56:07'),(23,75,11,41,'2025-11-14 13:56:26'),(24,75,9,2,'2025-11-14 13:56:26'),(25,75,10,7,'2025-11-14 13:56:26'),(26,74,11,35,'2025-11-14 13:56:48'),(27,74,6,60,'2025-11-14 13:56:48'),(28,74,5,51,'2025-11-14 13:56:48'),(29,74,2,24,'2025-11-14 13:56:48'),(30,73,11,42,'2025-11-14 13:57:21'),(31,73,6,56,'2025-11-14 13:57:21'),(32,73,5,46,'2025-11-14 13:57:21'),(33,73,2,8,'2025-11-14 13:57:21'),(34,72,11,36,'2025-11-14 14:22:32'),(35,72,1,18,'2025-11-14 14:22:32'),(36,72,9,18,'2025-11-14 14:22:32'),(37,10,11,40,'2025-11-14 15:02:31'),(38,66,11,40,'2025-11-14 15:26:11'),(44,3,6,54,'2025-11-14 14:59:49'),(45,3,5,46,'2025-11-14 14:59:49'),(46,3,2,8,'2025-11-14 14:59:49'),(47,4,11,33,'2025-11-14 15:00:24'),(48,5,11,41,'2025-11-14 15:00:52'),(49,5,1,1,'2025-11-14 15:00:52'),(50,6,11,35,'2025-11-14 15:01:14'),(51,6,1,19,'2025-11-14 15:01:14'),(52,6,9,19,'2025-11-14 15:01:14'),(53,7,11,42,'2025-11-14 15:01:38'),(54,7,9,2,'2025-11-14 15:01:38'),(55,7,10,7,'2025-11-14 15:01:38'),(56,8,11,34,'2025-11-14 15:02:00'),(57,8,1,18,'2025-11-14 15:02:00'),(58,8,9,19,'2025-11-14 15:02:00'),(60,10,6,53,'2025-11-14 15:02:31'),(61,10,5,47,'2025-11-14 15:02:31'),(62,10,2,8,'2025-11-14 15:02:31'),(63,16,11,40,'2025-11-14 15:22:20'),(64,20,11,43,'2025-11-14 15:23:01'),(65,20,6,56,'2025-11-14 15:23:01'),(66,20,5,47,'2025-11-14 15:23:01'),(67,20,2,6,'2025-11-14 15:23:01'),(68,21,11,36,'2025-11-14 15:23:28'),(69,22,11,41,'2025-11-14 15:23:50'),(70,22,6,55,'2025-11-14 15:23:50'),(71,22,5,48,'2025-11-14 15:23:50'),(72,22,2,7,'2025-11-14 15:23:50'),(73,64,11,40,'2025-11-14 15:24:12'),(74,64,1,2,'2025-11-14 15:24:12'),(75,64,9,3,'2025-11-14 15:24:12'),(77,66,6,53,'2025-11-14 15:26:11'),(78,66,5,49,'2025-11-14 15:26:11'),(79,66,2,7,'2025-11-14 15:26:11'),(80,68,11,40,'2025-11-14 15:26:27'),(81,78,11,33,'2025-11-20 16:58:48'),(82,78,1,20,'2025-11-20 16:58:48'),(83,78,9,18,'2025-11-20 16:58:48');
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
) ENGINE=InnoDB AUTO_INCREMENT=154 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `entregadotacion`
--

LOCK TABLES `entregadotacion` WRITE;
/*!40000 ALTER TABLE `entregadotacion` DISABLE KEYS */;
INSERT INTO `entregadotacion` VALUES (99,6,NULL,13,64,1,'2025-11-11',''),(100,6,NULL,11,33,1,'2025-11-11',''),(101,6,NULL,1,20,1,'2025-11-11',''),(102,1,NULL,9,3,1,'2025-11-11',''),(103,1,NULL,10,6,1,'2025-11-11',''),(104,1,NULL,11,39,1,'2025-11-11',''),(105,1,NULL,4,63,1,'2025-11-11',''),(106,1,NULL,12,63,1,'2025-11-11',''),(107,1,NULL,7,63,1,'2025-11-11',''),(108,4,NULL,13,64,1,'2025-11-11',''),(109,4,NULL,11,33,1,'2025-11-11',''),(110,4,NULL,12,64,1,'2025-11-11',''),(111,4,NULL,4,64,1,'2025-11-11',''),(112,1,NULL,9,3,1,'2025-11-11',''),(113,1,NULL,10,6,1,'2025-11-11',''),(114,1,NULL,11,39,1,'2025-11-11',''),(115,1,NULL,4,63,1,'2025-11-11',''),(116,1,NULL,12,63,1,'2025-11-11',''),(117,1,NULL,7,63,1,'2025-11-11',''),(118,1,NULL,9,3,1,'2025-11-11',''),(119,1,NULL,10,6,1,'2025-11-11',''),(120,1,NULL,11,39,1,'2025-11-11',''),(121,1,NULL,4,63,1,'2025-11-11',''),(122,1,NULL,12,63,1,'2025-11-11',''),(123,1,NULL,7,63,1,'2025-11-11',''),(124,4,NULL,13,64,1,'2025-11-13',''),(125,4,NULL,11,33,1,'2025-11-13',''),(126,4,NULL,12,64,1,'2025-11-13',''),(127,4,NULL,4,64,1,'2025-11-13',''),(128,4,NULL,13,64,1,'2025-11-13',''),(129,4,NULL,11,33,1,'2025-11-13',''),(130,4,NULL,12,64,1,'2025-11-13',''),(131,4,NULL,4,64,1,'2025-11-13',''),(132,6,NULL,13,64,1,'2025-11-13',''),(133,6,NULL,11,33,1,'2025-11-13',''),(134,6,NULL,1,20,1,'2025-11-13',''),(135,12,NULL,13,63,1,'2025-11-20',''),(136,12,NULL,11,39,1,'2025-11-20',''),(137,12,NULL,1,3,1,'2025-11-20',''),(138,12,NULL,9,3,1,'2025-11-20',''),(139,9,NULL,13,63,1,'2025-11-20',''),(140,9,NULL,11,41,1,'2025-11-20',''),(141,9,NULL,12,63,1,'2025-11-20',''),(142,9,NULL,4,63,1,'2025-11-20',''),(143,9,NULL,13,63,1,'2025-11-20',''),(144,9,NULL,11,41,1,'2025-11-20',''),(145,9,NULL,12,63,1,'2025-11-20',''),(146,9,NULL,4,63,1,'2025-11-20',''),(147,10,NULL,12,63,1,'2025-11-20',''),(148,10,NULL,2,6,1,'2025-11-20',''),(149,10,NULL,5,48,1,'2025-11-20',''),(150,10,NULL,7,63,1,'2025-11-20',''),(151,10,NULL,6,55,1,'2025-11-20',''),(152,10,NULL,4,63,1,'2025-11-20',''),(153,10,NULL,11,39,1,'2025-11-20','');
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
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historialmovimientos`
--

LOCK TABLES `historialmovimientos` WRITE;
/*!40000 ALTER TABLE `historialmovimientos` DISABLE KEYS */;
INSERT INTO `historialmovimientos` VALUES (1,'Empleado',1,'INSERT','2025-10-07 10:05:01','admin','Registro nuevo empleado Juan Carlos Rodríguez'),(2,'SolicitudDotacion',1,'INSERT','2025-10-07 10:05:01','supervisor','Nueva solicitud kit operario'),(3,'StockDotacion',1,'UPDATE','2025-10-07 10:05:01','almacenista','Actualización stock por entrega'),(4,'EntregaDotacion',1,'INSERT','2025-10-07 10:05:01','almacenista','Registro entrega a empleado'),(5,'PedidoCompras',1,'INSERT','2025-10-07 10:05:01','admin','Nuevo pedido de compra generado'),(6,'entregadotacion',6,'INSERT','2025-10-29 12:24:09','sistema','Entrega registrada: Camisa Polo Empresa - Cantidad: 1 - Empleado: Juan Carlos Rodríguez Silva'),(7,'entregadotacion',7,'INSERT','2025-11-04 07:19:30','sistema','Entrega registrada: Camisa Polo Empresa - Cantidad: 1 - Empleado: Juan Carlos Rodríguez Silva'),(8,'entregadotacion',23,'DELETE','2025-11-05 13:35:03','sistema','Entrega eliminada (grupo empleado/fecha)'),(9,'entregadotacion',7,'DELETE','2025-11-05 13:35:06','sistema','Entrega eliminada (grupo empleado/fecha)'),(10,'entregadotacion',6,'DELETE','2025-11-05 13:35:08','sistema','Entrega eliminada (grupo empleado/fecha)'),(11,'entregadotacion',4,'DELETE','2025-11-05 13:35:10','sistema','Entrega eliminada (grupo empleado/fecha)'),(12,'entregadotacion',1,'DELETE','2025-11-05 13:35:12','sistema','Entrega eliminada (grupo empleado/fecha)'),(13,'entregadotacion',77,'UPDATE','2025-11-06 14:17:26','sistema','Entrega actualizada (grupo empleado/fecha)'),(14,'entregadotacion',77,'UPDATE','2025-11-06 14:17:35','sistema','Entrega actualizada (grupo empleado/fecha)'),(15,'entregadotacion',83,'DELETE','2025-11-06 16:36:31','sistema','Entrega eliminada (grupo empleado/fecha)'),(16,'entregadotacion',77,'DELETE','2025-11-10 11:00:00','sistema','Entrega eliminada (grupo empleado/fecha)'),(17,'entregadotacion',90,'DELETE','2025-11-10 11:00:03','sistema','Entrega eliminada (grupo empleado/fecha)'),(18,'entregadotacion',93,'DELETE','2025-11-10 12:04:01','sistema','Entrega eliminada (grupo empleado/fecha)'),(19,'PedidoCompras',12,'RECEPCION','2025-11-20 14:15:02','tester','Recepción registrada (1 líneas, estado recibido_parcial)'),(20,'PedidoCompras',12,'RECEPCION','2025-11-20 14:15:31','tester','Recepción registrada (2 líneas, estado recibido_parcial)'),(21,'PedidoCompras',15,'RECEPCION','2025-11-20 16:00:19','fabianmurcia.gomez','Recepción registrada (7 líneas, estado recibido_parcial)'),(22,'PedidoCompras',15,'RECEPCION','2025-11-20 16:00:23','fabianmurcia.gomez','Recepción registrada (1 líneas, estado recibido_parcial)'),(23,'PedidoCompras',15,'RECEPCION','2025-11-20 16:00:24','fabianmurcia.gomez','Recepción registrada (2 líneas, estado recibido_parcial)'),(24,'PedidoCompras',15,'RECEPCION','2025-11-20 16:00:25','fabianmurcia.gomez','Recepción registrada (1 líneas, estado recibido_parcial)'),(25,'PedidoCompras',15,'RECEPCION','2025-11-20 16:00:26','fabianmurcia.gomez','Recepción registrada (3 líneas, estado recibido_parcial)'),(26,'PedidoCompras',15,'RECEPCION','2025-11-20 16:00:30','fabianmurcia.gomez','Recepción registrada (2 líneas, estado recibido_parcial)'),(27,'PedidoCompras',15,'RECEPCION','2025-11-20 16:00:32','fabianmurcia.gomez','Recepción registrada (1 líneas, estado recibido_parcial)'),(28,'PedidoCompras',15,'RECEPCION','2025-11-20 16:00:35','fabianmurcia.gomez','Recepción registrada (2 líneas, estado recibido_parcial)'),(29,'PedidoCompras',15,'RECEPCION','2025-11-20 16:00:36','fabianmurcia.gomez','Recepción registrada (2 líneas, estado recibido_completo)'),(30,'PedidoCompras',16,'RECEPCION','2025-11-20 16:13:43','fabianmurcia.gomez','Recepción registrada (2 líneas, estado recibido_parcial)'),(31,'PedidoCompras',16,'RECEPCION','2025-11-20 16:15:14','fabianmurcia.gomez','Recepción registrada (2 líneas, estado recibido_completo)'),(32,'PedidoCompras',12,'RECEPCION','2025-11-20 16:30:09','fabianmurcia.gomez','Recepción registrada (11 líneas, estado recibido_parcial)'),(33,'PedidoCompras',12,'RECEPCION','2025-11-20 16:30:19','fabianmurcia.gomez','Recepción registrada (18 líneas, estado recibido_completo)'),(34,'PedidoCompras',17,'RECEPCION','2025-11-20 17:03:45','fabianmurcia.gomez','Recepción registrada (5 líneas, estado recibido_parcial)');
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
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pedidocompras`
--

LOCK TABLES `pedidocompras` WRITE;
/*!40000 ALTER TABLE `pedidocompras` DISABLE KEYS */;
INSERT INTO `pedidocompras` VALUES (12,NULL,'2025-11-20','recibido_completo','Pedido generado automáticamente para ciclo Ciclo Q4 2025',4276000.00),(15,NULL,'2025-11-20','recibido_completo','Pedido generado automáticamente para ciclo Ultimo',2442000.00),(16,41,'2025-11-20','recibido_completo','Pedido generado automáticamente para ciclo dE PRUEVA',417000.00),(17,44,'2025-11-20','recibido_parcial','Pedido generado automáticamente para ciclo Nuevo ciclo',882000.00),(18,44,'2025-11-21','enviado','Pedido generado automáticamente para ciclo Nuevo ciclo',882000.00);
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
INSERT INTO `proveedor` VALUES (1,'Textiles Industriales S.A.S.','601-234-5678','ventas@textilesindustriales.com','Zona Industrial Puente Aranda, Bogotá',0),(2,'Uniformes y Dotaciones Ltda.','604-876-5432','comercial@uniformesdotaciones.com','Itagüí, Antioquia',0),(3,'EPP Seguridad Total','801-345-6789','info@eppseguridad.com','Fontibón, Bogotá',1),(4,'Calzado Industrial Cñolombia','602-567-8999','pedidos@calzadoindustrial.com','Cali, Valle del Cauca',1),(5,'flexxooo','3102023477','juan_duran@gmail.com','Bogota Colombia',1);
/*!40000 ALTER TABLE `proveedor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recepcionpedido`
--

DROP TABLE IF EXISTS `recepcionpedido`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recepcionpedido` (
  `id_recepcion` int NOT NULL AUTO_INCREMENT,
  `id_pedido` int NOT NULL,
  `id_proveedor` int DEFAULT NULL,
  `proveedor_nombre` varchar(150) DEFAULT NULL,
  `documento_referencia` varchar(120) DEFAULT NULL,
  `fecha_recepcion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `observaciones` text,
  `usuario_registro` varchar(100) DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_recepcion`),
  KEY `fk_recepcion_proveedor` (`id_proveedor`),
  KEY `idx_recepcion_id_pedido` (`id_pedido`),
  CONSTRAINT `fk_recepcion_pedido` FOREIGN KEY (`id_pedido`) REFERENCES `pedidocompras` (`id_pedido`) ON DELETE CASCADE,
  CONSTRAINT `fk_recepcion_proveedor` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedor` (`id_proveedor`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recepcionpedido`
--

LOCK TABLES `recepcionpedido` WRITE;
/*!40000 ALTER TABLE `recepcionpedido` DISABLE KEYS */;
INSERT INTO `recepcionpedido` VALUES (1,12,NULL,NULL,NULL,'2025-11-19 19:00:00',NULL,'tester','2025-11-20 14:15:02','2025-11-20 14:15:02'),(2,12,NULL,NULL,NULL,'2025-11-19 19:00:00',NULL,'tester','2025-11-20 14:15:31','2025-11-20 14:15:31'),(3,15,NULL,NULL,NULL,'2025-11-19 19:00:00',NULL,'fabianmurcia.gomez','2025-11-20 16:00:19','2025-11-20 16:00:19'),(4,15,NULL,NULL,NULL,'2025-11-19 19:00:00',NULL,'fabianmurcia.gomez','2025-11-20 16:00:23','2025-11-20 16:00:23'),(5,15,NULL,NULL,NULL,'2025-11-19 19:00:00',NULL,'fabianmurcia.gomez','2025-11-20 16:00:24','2025-11-20 16:00:24'),(6,15,NULL,NULL,NULL,'2025-11-19 19:00:00',NULL,'fabianmurcia.gomez','2025-11-20 16:00:25','2025-11-20 16:00:25'),(7,15,NULL,NULL,NULL,'2025-11-19 19:00:00',NULL,'fabianmurcia.gomez','2025-11-20 16:00:26','2025-11-20 16:00:26'),(8,15,NULL,NULL,NULL,'2025-11-19 19:00:00',NULL,'fabianmurcia.gomez','2025-11-20 16:00:30','2025-11-20 16:00:30'),(9,15,NULL,NULL,NULL,'2025-11-19 19:00:00',NULL,'fabianmurcia.gomez','2025-11-20 16:00:32','2025-11-20 16:00:32'),(10,15,NULL,NULL,NULL,'2025-11-19 19:00:00',NULL,'fabianmurcia.gomez','2025-11-20 16:00:35','2025-11-20 16:00:35'),(11,15,NULL,NULL,NULL,'2025-11-19 19:00:00',NULL,'fabianmurcia.gomez','2025-11-20 16:00:36','2025-11-20 16:00:36'),(12,16,NULL,NULL,NULL,'2025-11-19 19:00:00',NULL,'fabianmurcia.gomez','2025-11-20 16:13:43','2025-11-20 16:13:43'),(13,16,NULL,NULL,NULL,'2025-11-19 19:00:00',NULL,'fabianmurcia.gomez','2025-11-20 16:15:14','2025-11-20 16:15:14'),(14,12,NULL,'EPP Seguridad Total',NULL,'2025-11-19 19:00:00',NULL,'fabianmurcia.gomez','2025-11-20 16:30:09','2025-11-20 16:30:09'),(15,12,NULL,NULL,NULL,'2025-11-19 19:00:00',NULL,'fabianmurcia.gomez','2025-11-20 16:30:19','2025-11-20 16:30:19'),(16,17,NULL,NULL,NULL,'2025-11-19 19:00:00',NULL,'fabianmurcia.gomez','2025-11-20 17:03:45','2025-11-20 17:03:45');
/*!40000 ALTER TABLE `recepcionpedido` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reportes_historial`
--

DROP TABLE IF EXISTS `reportes_historial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reportes_historial` (
  `id_reporte` int NOT NULL AUTO_INCREMENT,
  `modulo` varchar(50) NOT NULL,
  `tipo` varchar(30) NOT NULL,
  `filtros` json DEFAULT NULL,
  `formato` varchar(10) NOT NULL,
  `filas` int NOT NULL DEFAULT '0',
  `usuario` varchar(100) DEFAULT NULL,
  `fecha_generacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_reporte`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reportes_historial`
--

LOCK TABLES `reportes_historial` WRITE;
/*!40000 ALTER TABLE `reportes_historial` DISABLE KEYS */;
INSERT INTO `reportes_historial` VALUES (1,'dotaciones','export','{}','excel',14,'sistema','2025-11-18 07:52:04'),(2,'dotaciones','export','{}','excel',14,'sistema','2025-11-18 08:05:37'),(3,'dotaciones','export','{}','excel',14,'sistema','2025-11-18 08:10:34'),(4,'dotaciones','export','{}','excel',14,'sistema','2025-11-18 08:12:44'),(5,'dotaciones','export','{}','excel',14,'sistema','2025-11-18 08:13:25'),(6,'dotaciones','export','{}','excel',14,'sistema','2025-11-18 08:20:05'),(7,'dotaciones','export','{}','excel',14,'sistema','2025-11-18 08:21:42'),(8,'empleados','export','{}','excel',37,'sistema','2025-11-18 08:21:58'),(9,'entregas','export','{}','excel',36,'sistema','2025-11-18 08:22:35'),(10,'ciclos','export','{}','excel',4,'sistema','2025-11-18 08:22:47'),(11,'prendas','export','{}','excel',20,'sistema','2025-11-18 08:23:08'),(12,'stock','export','{}','excel',20,'sistema','2025-11-18 08:23:24'),(13,'proveedores','export','{}','excel',5,'sistema','2025-11-18 08:23:32'),(14,'dotaciones','export','{}','excel',14,'sistema','2025-11-18 08:32:59'),(15,'dotaciones','export','{}','excel',14,'sistema','2025-11-18 08:33:41'),(16,'dotaciones','export','{}','excel',14,'sistema','2025-11-18 08:33:47'),(17,'dotaciones','export','{}','excel',14,'sistema','2025-11-18 08:38:56'),(18,'dotaciones','export','{}','excel',14,'sistema','2025-11-18 08:42:53'),(19,'dotaciones','export','{}','excel',14,'sistema','2025-11-18 09:16:34'),(20,'dotaciones','export','{}','excel',14,'sistema','2025-11-18 09:26:59'),(21,'empleados','export','{}','excel',37,'sistema','2025-11-18 09:27:37'),(22,'empleados','export','{}','excel',37,'sistema','2025-11-18 09:34:37'),(23,'empleados','export','{}','excel',37,'sistema','2025-11-18 09:43:04'),(24,'empleados','export','{}','excel',37,'sistema','2025-11-18 09:46:19'),(25,'empleados','export','{}','excel',37,'sistema','2025-11-18 09:47:20'),(26,'dotaciones','export','{}','excel',14,'sistema','2025-11-18 09:48:42'),(27,'entregas','export','{}','excel',36,'sistema','2025-11-18 09:48:58'),(28,'proveedores','export','{}','excel',5,'sistema','2025-11-18 09:49:30'),(29,'ciclos','export','{}','excel',4,'sistema','2025-11-18 09:50:00'),(30,'empleados','export','{}','excel',37,'sistema','2025-11-18 09:54:38'),(31,'empleados','export','{}','pdf',37,'sistema','2025-11-18 10:00:39'),(32,'ciclos','export','{\"area\": null, \"estado\": null, \"id_ciclo\": null}','excel',84,'sistema','2025-11-18 10:04:29');
/*!40000 ALTER TABLE `reportes_historial` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stockdotacion`
--

LOCK TABLES `stockdotacion` WRITE;
/*!40000 ALTER TABLE `stockdotacion` DISABLE KEYS */;
INSERT INTO `stockdotacion` VALUES (1,1,2,7,9,150,'2025-11-21 11:35:07'),(2,1,3,7,9,201,'2025-11-21 11:35:07'),(3,1,4,7,9,99,'2025-11-21 11:35:07'),(4,2,7,7,9,82,'2025-11-21 11:35:07'),(5,2,8,7,9,138,'2025-11-21 11:35:07'),(6,2,9,7,9,90,'2025-11-21 11:35:07'),(7,3,29,7,9,50,'2025-11-21 11:35:07'),(8,3,30,7,9,45,'2025-11-21 11:35:07'),(9,3,31,7,9,40,'2025-11-21 11:35:07'),(10,4,1,7,9,200,'2025-11-21 11:35:07'),(11,7,1,7,9,300,'2025-11-21 11:35:07'),(12,11,33,1,1,11,'2025-11-20 17:03:45'),(13,11,34,1,1,2,'2025-11-20 16:00:19'),(14,11,39,1,1,3,'2025-11-20 16:30:19'),(15,11,40,1,1,15,'2025-11-20 17:03:45'),(16,11,37,1,1,1,'2025-11-20 16:00:19'),(17,11,42,1,1,5,'2025-11-20 16:30:19'),(18,11,44,1,1,4,'2025-11-20 17:03:45'),(19,4,63,7,9,21,'2025-11-21 11:35:07'),(20,6,53,7,9,4,'2025-11-21 11:35:07'),(21,6,56,7,9,3,'2025-11-21 11:35:07'),(22,7,63,7,9,11,'2025-11-21 11:35:07'),(23,5,47,7,9,3,'2025-11-21 11:35:07'),(24,5,46,7,9,3,'2025-11-21 11:35:07'),(25,5,49,7,9,2,'2025-11-21 11:35:07'),(26,12,63,7,9,27,'2025-11-21 11:35:07'),(27,13,63,7,9,22,'2025-11-21 11:35:07'),(28,9,2,7,9,2,'2025-11-21 11:35:07'),(29,9,18,7,9,2,'2025-11-21 11:35:07'),(30,1,18,7,9,3,'2025-11-21 11:35:07'),(31,6,55,7,9,1,'2025-11-21 11:35:07'),(32,6,54,7,9,1,'2025-11-21 11:35:07'),(33,5,48,7,9,1,'2025-11-21 11:35:07'),(34,11,41,1,1,3,'2025-11-20 16:30:19'),(35,11,43,1,1,2,'2025-11-20 17:03:45'),(36,1,19,7,9,3,'2025-11-21 11:35:07'),(37,1,1,7,9,4,'2025-11-21 11:35:07'),(38,9,3,7,9,1,'2025-11-21 11:35:07'),(39,9,19,7,9,3,'2025-11-21 11:35:07'),(40,9,21,7,9,1,'2025-11-21 11:35:07'),(41,2,6,7,9,1,'2025-11-21 11:35:07'),(42,10,7,7,9,1,'2025-11-21 11:35:07');
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
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ubicacion`
--

LOCK TABLES `ubicacion` WRITE;
/*!40000 ALTER TABLE `ubicacion` DISABLE KEYS */;
INSERT INTO `ubicacion` VALUES (1,'Planta Principal Bogotá','planta','Av. Caracas #45-67, Bogotá D.C.'),(2,'Planta Medellín','planta','Carrera 50 #23-45, Medellín, Antioquia'),(9,'UBICACIÓN TEMPORAL - REASIGNADA','bodega','Áreas reasignadas temporalmente por eliminación de ubicación'),(16,'paris','bodega','francia'),(17,'La Maria','planta','Saldaña-Purificacion\n');
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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES (1,9,'fabianmurcia.gomez','murcia21.gmz@gmail.com','$2a$12$lx3o6GMtKRDX/4bIUg1z8OntlSmYksOhm6kcISDR1L.g0tWkj/lLG',4,1,'2025-11-21 12:10:41','2025-10-15 08:40:49','2025-11-21 12:10:41',NULL,NULL,NULL,NULL),(6,10,'Juan_Duran2006','jdurancastellanos21@gmail.com','$2a$12$CyE.VIqMrXQ.zdPCyjrIZ.1JfHDVwbB21mgKK65mmDKBOIpQqMwp6',4,1,'2025-11-18 17:10:57','2025-11-18 16:47:52','2025-11-18 17:10:57',1,NULL,NULL,NULL),(7,6,'sandrala_almacenista07','sandra@gmail.com','$2a$12$vff945spnX.KP76UEs05c.6W3uQU6In9/F7/6WeU4ddi0Y2iWpFzC',2,1,NULL,'2025-11-19 10:45:48','2025-11-19 10:45:48',1,NULL,NULL,NULL),(8,65,'andres_123','andres@gmail.com','$2a$12$A1CejxWcqMT./NPNBLR42uc.ZvaslTYaW8ymCgczSm/5JI4vhLi9S',3,1,NULL,'2025-11-19 10:47:18','2025-11-19 10:47:18',1,NULL,NULL,NULL),(9,17,'maria_55','maria@gmail.com','$2a$12$oUb0i1LCThz4FkO9C6VhL.G7HVGET/cyRIvApqBp1hpgV6pB0/3su',1,1,NULL,'2025-11-19 10:48:28','2025-11-19 10:48:28',1,NULL,NULL,NULL);
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario_notificacion`
--

DROP TABLE IF EXISTS `usuario_notificacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario_notificacion` (
  `id_notificacion` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL,
  `tipo` enum('sistema','inventario','ciclo','alerta') NOT NULL DEFAULT 'sistema',
  `titulo` varchar(150) NOT NULL,
  `mensaje` text NOT NULL,
  `metadata` json DEFAULT NULL,
  `leido` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `read_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id_notificacion`),
  KEY `idx_usuario_notificacion_usuario` (`id_usuario`),
  KEY `idx_usuario_notificacion_leido` (`leido`),
  CONSTRAINT `fk_usuario_notificacion_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario_notificacion`
--

LOCK TABLES `usuario_notificacion` WRITE;
/*!40000 ALTER TABLE `usuario_notificacion` DISABLE KEYS */;
INSERT INTO `usuario_notificacion` VALUES (1,1,'sistema','Bienvenido al Centro de Cuenta','Ahora puedes actualizar tu perfil, preferencias y configurar alertas personalizadas.',NULL,0,'2025-11-18 16:07:21',NULL),(4,6,'sistema','Bienvenido al Centro de Cuenta','Ahora puedes actualizar tu perfil, preferencias y configurar alertas personalizadas.',NULL,0,'2025-11-18 16:54:09',NULL),(5,7,'sistema','Bienvenido al Centro de Cuenta','Ahora puedes actualizar tu perfil, preferencias y configurar alertas personalizadas.',NULL,0,'2025-11-19 11:17:41',NULL),(6,8,'sistema','Bienvenido al Centro de Cuenta','Ahora puedes actualizar tu perfil, preferencias y configurar alertas personalizadas.',NULL,0,'2025-11-19 11:17:41',NULL),(7,9,'sistema','Bienvenido al Centro de Cuenta','Ahora puedes actualizar tu perfil, preferencias y configurar alertas personalizadas.',NULL,0,'2025-11-19 11:17:41',NULL);
/*!40000 ALTER TABLE `usuario_notificacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario_perfil`
--

DROP TABLE IF EXISTS `usuario_perfil`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario_perfil` (
  `id_usuario` int NOT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `avatar_color` varchar(20) DEFAULT '#B39237',
  `telefono_alterno` varchar(20) DEFAULT NULL,
  `extension` varchar(10) DEFAULT NULL,
  `timezone` varchar(60) DEFAULT 'America/Bogota',
  `bio` varchar(255) DEFAULT NULL,
  `firma_digital` varchar(255) DEFAULT NULL,
  `foto_actualizada_en` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  CONSTRAINT `fk_usuario_perfil_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario_perfil`
--

LOCK TABLES `usuario_perfil` WRITE;
/*!40000 ALTER TABLE `usuario_perfil` DISABLE KEYS */;
INSERT INTO `usuario_perfil` VALUES (1,'/uploads/avatars/avatar_1_1763565810021.jpg','#B39237','3547836248',NULL,'America/Bogota',NULL,NULL,'2025-11-18 16:07:21','2025-11-18 16:07:21','2025-11-19 10:23:30'),(6,'/uploads/avatars/avatar_6_1763503778308.jpg','#B39237',NULL,NULL,'America/Bogota',NULL,NULL,'2025-11-18 16:48:56','2025-11-18 16:48:56','2025-11-18 17:09:38'),(7,NULL,'#B39237',NULL,NULL,'America/Bogota',NULL,NULL,'2025-11-19 11:17:41','2025-11-19 11:17:41','2025-11-19 11:17:41'),(8,NULL,'#B39237',NULL,NULL,'America/Bogota',NULL,NULL,'2025-11-19 11:17:41','2025-11-19 11:17:41','2025-11-19 11:17:41'),(9,NULL,'#B39237',NULL,NULL,'America/Bogota',NULL,NULL,'2025-11-19 11:17:41','2025-11-19 11:17:41','2025-11-19 11:17:41');
/*!40000 ALTER TABLE `usuario_perfil` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario_preferencias`
--

DROP TABLE IF EXISTS `usuario_preferencias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario_preferencias` (
  `id_usuario` int NOT NULL,
  `idioma` varchar(5) NOT NULL DEFAULT 'es',
  `tema` enum('claro','oscuro','sistema') NOT NULL DEFAULT 'sistema',
  `notificar_email` tinyint(1) NOT NULL DEFAULT '1',
  `notificar_push` tinyint(1) NOT NULL DEFAULT '0',
  `notificar_inventario` tinyint(1) NOT NULL DEFAULT '1',
  `notificar_ciclos` tinyint(1) NOT NULL DEFAULT '1',
  `resumen_semanal` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  CONSTRAINT `fk_usuario_preferencias_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario_preferencias`
--

LOCK TABLES `usuario_preferencias` WRITE;
/*!40000 ALTER TABLE `usuario_preferencias` DISABLE KEYS */;
INSERT INTO `usuario_preferencias` VALUES (1,'es','claro',1,0,1,1,0,'2025-11-18 16:07:21','2025-11-19 07:24:27'),(6,'es','sistema',1,0,1,1,0,'2025-11-18 16:54:09','2025-11-18 16:54:09'),(7,'es','sistema',1,0,1,1,0,'2025-11-19 11:17:41','2025-11-19 11:17:41'),(8,'es','sistema',1,0,1,1,0,'2025-11-19 11:17:41','2025-11-19 11:17:41'),(9,'es','sistema',1,0,1,1,0,'2025-11-19 11:17:41','2025-11-19 11:17:41');
/*!40000 ALTER TABLE `usuario_preferencias` ENABLE KEYS */;
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

-- Dump completed on 2025-11-21 16:22:57
