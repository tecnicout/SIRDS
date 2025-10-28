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

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '27519af4-b434-11f0-aee2-f439092d7bcb:1-201';

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
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `area`
--

LOCK TABLES `area` WRITE;
/*!40000 ALTER TABLE `area` DISABLE KEYS */;
INSERT INTO `area` VALUES (1,'Producción','activa'),(2,'Administración','inactiva'),(3,'Mantenimiento','activa'),(4,'Calidad','activa'),(5,'Producción','activa'),(6,'Administración','inactiva'),(7,'Almacén Principal','inactiva'),(8,'Despachos','activa'),(9,'Recepción','activa'),(10,'Inventario','activa'),(11,'Archivo','inactiva'),(12,'Cafeteria','activa'),(19,'Logistica Flota Propia','activa');
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
  KEY `id_area` (`id_area`),
  KEY `id_rol` (`id_rol`),
  KEY `id_kit` (`id_kit`),
  CONSTRAINT `arearolkit_ibfk_1` FOREIGN KEY (`id_area`) REFERENCES `area` (`id_area`),
  CONSTRAINT `arearolkit_ibfk_2` FOREIGN KEY (`id_rol`) REFERENCES `rol` (`id_rol`),
  CONSTRAINT `arearolkit_ibfk_3` FOREIGN KEY (`id_kit`) REFERENCES `kitdotacion` (`id_kit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categoriadotacion`
--

LOCK TABLES `categoriadotacion` WRITE;
/*!40000 ALTER TABLE `categoriadotacion` DISABLE KEYS */;
INSERT INTO `categoriadotacion` VALUES (1,'Uniformes'),(2,'Calzado de Seguridad'),(3,'Elementos de Protección Personal (EPP)'),(4,'Accesorios'),(5,'Herramientas Personales');
/*!40000 ALTER TABLE `categoriadotacion` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detallekitdotacion`
--

LOCK TABLES `detallekitdotacion` WRITE;
/*!40000 ALTER TABLE `detallekitdotacion` DISABLE KEYS */;
INSERT INTO `detallekitdotacion` VALUES (1,1,1,2),(2,1,2,2),(3,1,3,1),(4,1,4,1),(5,1,5,2),(6,1,7,1),(7,2,1,3),(8,2,2,2),(9,2,3,1),(10,2,4,1),(11,2,7,1),(12,3,1,2),(13,3,2,1),(14,4,8,2),(15,4,3,1),(16,4,4,1),(17,4,5,3),(18,4,7,1);
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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dotacion`
--

LOCK TABLES `dotacion` WRITE;
/*!40000 ALTER TABLE `dotacion` DISABLE KEYS */;
INSERT INTO `dotacion` VALUES (1,'Camisa Polo Empresa','Camisa polo con logo bordado, 100% algodón',1,'Unidad',1,1,35000.00),(2,'Pantalón Jean Industrial','Pantalón jean reforzado para trabajo industrial',1,'Unidad',1,1,65000.00),(3,'Zapatos de Seguridad','Zapatos con puntera de acero y suela antideslizante',1,'Par',2,4,120000.00),(4,'Casco de Seguridad','Casco industrial con barboquejo ajustable',0,'Unidad',3,3,25000.00),(5,'Guantes de Seguridad','Guantes antideslizantes para manipulación',1,'Par',3,3,8000.00),(6,'Chaleco Reflectivo','Chaleco con bandas reflectivas alta visibilidad',1,'Unidad',3,3,18000.00),(7,'Gafas de Seguridad','Gafas protectoras con filtro UV',0,'Unidad',3,3,12000.00),(8,'Overol Industrial','Overol completo para áreas de producción',1,'Unidad',1,1,85000.00);
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
INSERT INTO `empleado` VALUES (1,'123456789','CC','Juan Carlos','Rodríguez Silva','2004-12-22','juan.rodriguez@empresa.com','300-123-4567','Operario Senior',1,1,1,'2025-07-02',0.00,NULL,2),(2,'123456798','CC','María Elena','González Pérez','2004-12-26','maria.gonzalez@empresa.com','301-234-5678','Supervisora de Calidad',0,2,4,'2025-07-02',0.00,NULL,2),(3,'123456987','CC','Carlos Andrés','Martínez López','2004-12-15','carlos.martinez@empresa.com','302-345-6789','Técnico de Mantenimiento',0,1,3,'2025-07-02',0.00,NULL,2),(4,'123654789','CC','Ana María','Hernández Castro','2004-12-21','ana.hernandez@empresa.com','303-456-7890','Auxiliar Administrativo',0,2,2,'2025-07-02',0.00,NULL,2),(5,'321456789','CC','Luis Fernando','Vargas Moreno','2004-12-21','luis.vargas@empresa.com','304-567-8901','Coordinador de Producción',1,1,1,'2025-07-02',0.00,NULL,2),(6,'321654987','CC','Sandra Patricia','Jiménez Ruiz','2004-12-21','sandra.jimenez@empresa.com','305-678-9012','Almacenista',0,2,7,'2025-07-02',0.00,NULL,2),(7,'369258147','CC','Diego Alejandro','Torres Gómez','2004-12-21','diego.torres@empresa.com','306-789-0123','Operario',1,1,5,'2025-07-02',0.00,NULL,2),(8,'258369147','CC','Claudia Marcela','Ramírez Soto','2004-12-21','claudia.ramirez@empresa.com','307-890-1234','Inspector de Calidad',1,2,4,'2025-07-02',0.00,NULL,2),(9,'147258369','CC','Fabian Murcia','Gomez','2004-12-21','murcia21.gmz@gmail.com','3102023478','Aprendiz sena',1,1,4,'2025-07-02',0.00,NULL,1),(10,'789456123','CC','Juan Sebastian ','Duran Castellanos','2004-12-21','jdurancastellanos21@gmail.com','3102023477','Aprendiz sena',1,1,2,'2025-07-02',0.00,NULL,2),(11,'987456322','CC','Ricardo Alexander','Bohorquez','2004-12-22','rbohorquez@arrozsonora.com.co','3102023456','Analista de Sistemas',1,1,1,'2025-10-07',19078700.00,'2025-10-16',2),(12,'1076200149','CC','Ricardo Alexander','Gomez','2023-06-07','murcia232gmz@gmail.com','3102023456','Aprendiz sena',0,1,19,'2025-10-06',1700666.00,'2025-10-31',2),(13,'9874567921','CC','Bodega Central','Duran Castellanos','2025-10-11','murcia21mz@gmail.com','3102023478','Analista de Sistemas',1,1,5,'2025-10-30',1999999.00,'2025-11-08',2),(14,'987456312','CC','Ricardo Alexanderrr','perez','2024-02-23','murciagmz@gmail.com','3102023477','Pasante pepe',0,1,19,'2025-10-01',1700000.00,'2027-10-21',12);
/*!40000 ALTER TABLE `empleado` ENABLE KEYS */;
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
  `id_dotacion` int NOT NULL,
  `id_talla` int NOT NULL,
  `cantidad` int NOT NULL,
  `fecha_entrega` date NOT NULL,
  `observaciones` text,
  PRIMARY KEY (`id_entrega`),
  KEY `id_empleado` (`id_empleado`),
  KEY `id_dotacion` (`id_dotacion`),
  KEY `id_talla` (`id_talla`),
  CONSTRAINT `entregadotacion_ibfk_1` FOREIGN KEY (`id_empleado`) REFERENCES `empleado` (`id_empleado`),
  CONSTRAINT `entregadotacion_ibfk_2` FOREIGN KEY (`id_dotacion`) REFERENCES `dotacion` (`id_dotacion`),
  CONSTRAINT `entregadotacion_ibfk_3` FOREIGN KEY (`id_talla`) REFERENCES `talla` (`id_talla`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `entregadotacion`
--

LOCK TABLES `entregadotacion` WRITE;
/*!40000 ALTER TABLE `entregadotacion` DISABLE KEYS */;
INSERT INTO `entregadotacion` VALUES (1,1,1,3,2,'2024-10-01','Entrega kit completo operario'),(2,1,2,8,2,'2024-10-01','Entrega kit completo operario'),(3,1,3,29,1,'2024-10-01','Entrega kit completo operario'),(4,5,1,3,3,'2024-10-05','Kit supervisor - entrega completa'),(5,5,2,8,2,'2024-10-05','Kit supervisor - entrega completa');
/*!40000 ALTER TABLE `entregadotacion` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historialmovimientos`
--

LOCK TABLES `historialmovimientos` WRITE;
/*!40000 ALTER TABLE `historialmovimientos` DISABLE KEYS */;
INSERT INTO `historialmovimientos` VALUES (1,'Empleado',1,'INSERT','2025-10-07 10:05:01','admin','Registro nuevo empleado Juan Carlos Rodríguez'),(2,'SolicitudDotacion',1,'INSERT','2025-10-07 10:05:01','supervisor','Nueva solicitud kit operario'),(3,'StockDotacion',1,'UPDATE','2025-10-07 10:05:01','almacenista','Actualización stock por entrega'),(4,'EntregaDotacion',1,'INSERT','2025-10-07 10:05:01','almacenista','Registro entrega a empleado'),(5,'PedidoCompras',1,'INSERT','2025-10-07 10:05:01','admin','Nuevo pedido de compra generado');
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
  `nombre` varchar(100) NOT NULL,
  `id_area` int NOT NULL,
  `activo` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id_kit`),
  KEY `id_area` (`id_area`),
  CONSTRAINT `kitdotacion_ibfk_1` FOREIGN KEY (`id_area`) REFERENCES `area` (`id_area`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kitdotacion`
--

LOCK TABLES `kitdotacion` WRITE;
/*!40000 ALTER TABLE `kitdotacion` DISABLE KEYS */;
INSERT INTO `kitdotacion` VALUES (1,'Kit Operario Producción',1,1),(2,'Kit Supervisor',1,1),(3,'Kit Administrativo',2,1),(4,'Kit Mantenimiento',3,1),(5,'Kit Almacén',7,1);
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
INSERT INTO `solicituddotacion` VALUES (1,1,1,'2024-10-01','entregado'),(2,2,2,'2024-10-02','procesado'),(3,3,4,'2024-10-03','pendiente'),(4,4,3,'2024-10-04','pendiente'),(5,5,2,'2024-10-05','entregado');
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
INSERT INTO `stockdotacion` VALUES (1,1,2,7,3,150,'2025-10-07 10:05:01'),(2,1,3,7,3,200,'2025-10-07 10:05:01'),(3,1,4,7,3,100,'2025-10-07 10:05:01'),(4,2,7,7,3,80,'2025-10-07 10:05:01'),(5,2,8,7,3,120,'2025-10-07 10:05:01'),(6,2,9,7,3,90,'2025-10-07 10:05:01'),(7,3,29,7,3,50,'2025-10-07 10:05:01'),(8,3,30,7,3,45,'2025-10-07 10:05:01'),(9,3,31,7,3,40,'2025-10-07 10:05:01'),(10,4,1,7,3,200,'2025-10-07 10:05:01'),(11,7,1,7,3,300,'2025-10-07 10:05:01');
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
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `talla`
--

LOCK TABLES `talla` WRITE;
/*!40000 ALTER TABLE `talla` DISABLE KEYS */;
INSERT INTO `talla` VALUES (1,'Camisa','S',1),(2,'Camisa','M',1),(3,'Camisa','L',1),(4,'Camisa','XL',1),(5,'Camisa','XXL',1),(6,'Pantalón','28',1),(7,'Pantalón','30',1),(8,'Pantalón','32',1),(9,'Pantalón','34',1),(10,'Pantalón','36',1),(11,'Pantalón','38',1),(12,'Overol','S',1),(13,'Overol','M',1),(14,'Overol','L',1),(15,'Overol','XL',1),(16,'Overol','XXL',1),(17,'Camisa','XS',2),(18,'Camisa','S',2),(19,'Camisa','M',2),(20,'Camisa','L',2),(21,'Camisa','XL',2),(22,'Pantalón','6',2),(23,'Pantalón','8',2),(24,'Pantalón','10',2),(25,'Pantalón','12',2),(26,'Pantalón','14',2),(27,'Pantalón','16',2),(28,'Overol','XS',2),(29,'Overol','S',2),(30,'Overol','M',2),(31,'Overol','L',2),(32,'Overol','XL',2),(33,'Zapato','36',2),(34,'Zapato','37',2),(35,'Zapato','38',2),(36,'Zapato','39',2),(37,'Zapato','40',2),(38,'Zapato','41',2),(39,'Zapato','38',1),(40,'Zapato','39',1),(41,'Zapato','40',1),(42,'Zapato','41',1),(43,'Zapato','42',1),(44,'Zapato','43',1),(45,'Zapato','44',1),(46,'Guante','S',1),(47,'Guante','M',1),(48,'Guante','L',1),(49,'Guante','XL',1),(50,'Guante','S',2),(51,'Guante','M',2),(52,'Guante','L',2),(53,'Chaleco','S',1),(54,'Chaleco','M',1),(55,'Chaleco','L',1),(56,'Chaleco','XL',1),(57,'Chaleco','XXL',1),(58,'Chaleco','XS',2),(59,'Chaleco','S',2),(60,'Chaleco','M',2),(61,'Chaleco','L',2),(62,'Chaleco','XL',2);
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
  `tipo` enum('planta','bodega') NOT NULL,
  `direccion` text,
  PRIMARY KEY (`id_ubicacion`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ubicacion`
--

LOCK TABLES `ubicacion` WRITE;
/*!40000 ALTER TABLE `ubicacion` DISABLE KEYS */;
INSERT INTO `ubicacion` VALUES (1,'Planta Principal Bogotá','planta','Av. Caracas #45-67, Bogotá D.C.'),(2,'Planta Medellín','planta','Carrera 50 #23-45, Medellín, Antioquia'),(3,'Bodega Central','planta','Zona Industrial, Calle 13 #78-90, Bogotá D.C.'),(9,'UBICACIÓN TEMPORAL - REASIGNADA','bodega','Áreas reasignadas temporalmente por eliminación de ubicación'),(12,'La Maria','planta','Saldaña-Purificacion');
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES (1,9,'fabianmurcia.gomez','murcia21.gmz@gmail.com','$2a$12$lx3o6GMtKRDX/4bIUg1z8OntlSmYksOhm6kcISDR1L.g0tWkj/lLG',4,1,'2025-10-28 15:36:11','2025-10-15 08:40:49','2025-10-28 15:36:11',NULL,NULL,NULL,NULL),(2,2,'mariaelena.gonzalezperez','maria.gonzalez@gmail.com','$2a$12$xLHbVlxZ/mytnpbINq48y.fvzi1rkh74VVnFfjUIjmdXzkNeZcOcC',2,1,'2025-10-15 10:20:57','2025-10-15 09:48:54','2025-10-22 11:15:22',1,1,NULL,NULL),(3,10,'juansebastian.durancastellanos','jdurancastellanos21@gmail.com','$2a$12$g0Q4FGAe78qgkRq.VyE2mebYLZGR.zzVe4W6L7qMdNMZ2JiiDy7tO',2,0,'2025-10-21 15:57:01','2025-10-21 10:41:14','2025-10-22 07:43:16',1,1,NULL,NULL);
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

-- Dump completed on 2025-10-28 15:57:56
