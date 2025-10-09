-- Script de inicialización para SIRDS
-- Sistema Integrado para el Registro de Dotación Sonora

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS SIRDS;
USE SIRDS;

-- Tabla: Ubicacion
CREATE TABLE Ubicacion (
    id_ubicacion INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo ENUM('planta', 'bodega') NOT NULL,
    direccion TEXT
);

-- Tabla: Area
CREATE TABLE Area (
    id_area INT AUTO_INCREMENT PRIMARY KEY,
    nombre_area VARCHAR(100) NOT NULL,
    id_ubicacion INT NOT NULL,
    FOREIGN KEY (id_ubicacion) REFERENCES Ubicacion(id_ubicacion)
);

-- Tabla: Genero
CREATE TABLE Genero (
    id_genero INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);

-- Tabla: Rol
CREATE TABLE Rol (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre_rol VARCHAR(100) NOT NULL
);

-- Tabla: Empleado
CREATE TABLE Empleado (
    id_empleado INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    telefono VARCHAR(20),
    cargo VARCHAR(100),
    estado BOOLEAN DEFAULT 1,
    id_genero INT NOT NULL,
    id_area INT NOT NULL,
    id_rol INT NOT NULL,
    FOREIGN KEY (id_genero) REFERENCES Genero(id_genero),
    FOREIGN KEY (id_area) REFERENCES Area(id_area),
    FOREIGN KEY (id_rol) REFERENCES Rol(id_rol)
);

-- Tabla: Proveedor
CREATE TABLE Proveedor (
    id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    telefono VARCHAR(50),
    email VARCHAR(150),
    direccion TEXT
);

-- Tabla: CategoriaDotacion
CREATE TABLE CategoriaDotacion (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre_categoria VARCHAR(100) NOT NULL
);

-- Tabla: Dotacion
CREATE TABLE Dotacion (
    id_dotacion INT AUTO_INCREMENT PRIMARY KEY,
    nombre_dotacion VARCHAR(100) NOT NULL,
    descripcion TEXT,
    talla_requerida BOOLEAN DEFAULT 0,
    unidad_medida VARCHAR(20),
    id_categoria INT NOT NULL,
    id_proveedor INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_categoria) REFERENCES CategoriaDotacion(id_categoria),
    FOREIGN KEY (id_proveedor) REFERENCES Proveedor(id_proveedor)
);

-- Tabla: Talla
CREATE TABLE Talla (
    id_talla INT AUTO_INCREMENT PRIMARY KEY,
    tipo_articulo VARCHAR(50) NOT NULL,
    talla VARCHAR(10) NOT NULL,
    id_genero INT NOT NULL,
    FOREIGN KEY (id_genero) REFERENCES Genero(id_genero)
);

-- Tabla: StockDotacion
CREATE TABLE StockDotacion (
    id_stock INT AUTO_INCREMENT PRIMARY KEY,
    id_dotacion INT NOT NULL,
    id_talla INT NOT NULL,
    id_area INT NOT NULL,
    id_ubicacion INT NOT NULL,
    cantidad INT NOT NULL,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_dotacion) REFERENCES Dotacion(id_dotacion),
    FOREIGN KEY (id_talla) REFERENCES Talla(id_talla),
    FOREIGN KEY (id_area) REFERENCES Area(id_area),
    FOREIGN KEY (id_ubicacion) REFERENCES Ubicacion(id_ubicacion)
);

-- Tabla: KitDotacion
CREATE TABLE KitDotacion (
    id_kit INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    id_area INT NOT NULL,
    activo BOOLEAN DEFAULT 1,
    FOREIGN KEY (id_area) REFERENCES Area(id_area)
);

-- Tabla: DetalleKitDotacion
CREATE TABLE DetalleKitDotacion (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_kit INT NOT NULL,
    id_dotacion INT NOT NULL,
    cantidad INT NOT NULL,
    FOREIGN KEY (id_kit) REFERENCES KitDotacion(id_kit),
    FOREIGN KEY (id_dotacion) REFERENCES Dotacion(id_dotacion)
);

-- Tabla: AreaRolKit
CREATE TABLE AreaRolKit (
    id_area_rol_kit INT AUTO_INCREMENT PRIMARY KEY,
    id_area INT NOT NULL,
    id_rol INT NOT NULL,
    id_kit INT NOT NULL,
    FOREIGN KEY (id_area) REFERENCES Area(id_area),
    FOREIGN KEY (id_rol) REFERENCES Rol(id_rol),
    FOREIGN KEY (id_kit) REFERENCES KitDotacion(id_kit)
);

-- Tabla: SolicitudDotacion
CREATE TABLE SolicitudDotacion (
    id_solicitud INT AUTO_INCREMENT PRIMARY KEY,
    id_empleado INT NOT NULL,
    id_kit INT NOT NULL,
    fecha_creacion DATE NOT NULL,
    estado ENUM('pendiente', 'procesado', 'entregado') DEFAULT 'pendiente',
    FOREIGN KEY (id_empleado) REFERENCES Empleado(id_empleado),
    FOREIGN KEY (id_kit) REFERENCES KitDotacion(id_kit)
);

-- Tabla: DetalleSolicitudDotacion
CREATE TABLE DetalleSolicitudDotacion (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_solicitud INT NOT NULL,
    id_dotacion INT NOT NULL,
    id_talla INT NOT NULL,
    cantidad INT NOT NULL,
    FOREIGN KEY (id_solicitud) REFERENCES SolicitudDotacion(id_solicitud),
    FOREIGN KEY (id_dotacion) REFERENCES Dotacion(id_dotacion),
    FOREIGN KEY (id_talla) REFERENCES Talla(id_talla)
);

-- Tabla: PedidoCompras
CREATE TABLE PedidoCompras (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    estado ENUM('enviado', 'recibido_parcial', 'recibido_completo') NOT NULL DEFAULT 'enviado',
    observaciones TEXT,
    total_pedido DECIMAL(12,2) DEFAULT 0.00
);

-- Tabla: DetallePedidoCompras
CREATE TABLE DetallePedidoCompras (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_dotacion INT NOT NULL,
    id_talla INT NOT NULL,
    cantidad_solicitada INT NOT NULL,
    cantidad_recibida INT DEFAULT 0,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (id_pedido) REFERENCES PedidoCompras(id_pedido),
    FOREIGN KEY (id_dotacion) REFERENCES Dotacion(id_dotacion),
    FOREIGN KEY (id_talla) REFERENCES Talla(id_talla)
);

-- Tabla: EntregaDotacion
CREATE TABLE EntregaDotacion (
    id_entrega INT AUTO_INCREMENT PRIMARY KEY,
    id_empleado INT NOT NULL,
    id_dotacion INT NOT NULL,
    id_talla INT NOT NULL,
    cantidad INT NOT NULL,
    fecha_entrega DATE NOT NULL,
    observaciones TEXT,
    FOREIGN KEY (id_empleado) REFERENCES Empleado(id_empleado),
    FOREIGN KEY (id_dotacion) REFERENCES Dotacion(id_dotacion),
    FOREIGN KEY (id_talla) REFERENCES Talla(id_talla)
);

-- Tabla: HistorialMovimientos
CREATE TABLE HistorialMovimientos (
    id_historial INT AUTO_INCREMENT PRIMARY KEY,
    tabla_modificada VARCHAR(50) NOT NULL,
    id_registro INT NOT NULL,
    tipo_movimiento VARCHAR(20) NOT NULL,
    fecha_movimiento DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usuario_responsable VARCHAR(100),
    detalle_cambio TEXT
);

-- INSERTAR DATOS DE PRUEBA

-- Géneros
INSERT INTO Genero (nombre) VALUES 
('Masculino'),
('Femenino');

-- Ubicaciones
INSERT INTO Ubicacion (nombre, tipo, direccion) VALUES 
('Planta Principal Bogotá', 'planta', 'Av. Caracas #45-67, Bogotá D.C.'),
('Planta Medellín', 'planta', 'Carrera 50 #23-45, Medellín, Antioquia'),
('Bodega Central', 'bodega', 'Zona Industrial, Calle 13 #78-90, Bogotá D.C.'),
('Bodega Norte', 'bodega', 'Autopista Norte Km 15, Chía, Cundinamarca');

-- Áreas
INSERT INTO Area (nombre_area, id_ubicacion) VALUES 
('Producción', 1),
('Administración', 1),
('Mantenimiento', 1),
('Calidad', 1),
('Producción', 2),
('Administración', 2),
('Almacén Principal', 3),
('Despachos', 3),
('Recepción', 4),
('Inventario', 4);

-- Roles
INSERT INTO Rol (nombre_rol) VALUES 
('Operario de Producción'),
('Supervisor de Producción'),
('Administrador'),
('Técnico de Mantenimiento'),
('Inspector de Calidad'),
('Almacenista'),
('Coordinador de Despachos'),
('Auxiliar Administrativo'),
('Gerente de Planta'),
('Analista de Inventario');

-- Proveedores
INSERT INTO Proveedor (nombre, telefono, email, direccion) VALUES 
('Textiles Industriales S.A.S.', '601-234-5678', 'ventas@textilesindustriales.com', 'Zona Industrial Puente Aranda, Bogotá'),
('Uniformes y Dotaciones Ltda.', '604-876-5432', 'comercial@uniformesdotaciones.com', 'Itagüí, Antioquia'),
('EPP Seguridad Total', '601-345-6789', 'info@eppseguridad.com', 'Fontibón, Bogotá'),
('Calzado Industrial Colombia', '602-567-8901', 'pedidos@calzadoindustrial.com', 'Cali, Valle del Cauca');

-- Categorías de Dotación
INSERT INTO CategoriaDotacion (nombre_categoria) VALUES 
('Uniformes'),
('Calzado de Seguridad'),
('Elementos de Protección Personal (EPP)'),
('Accesorios'),
('Herramientas Personales');

-- Dotaciones
INSERT INTO Dotacion (nombre_dotacion, descripcion, talla_requerida, unidad_medida, id_categoria, id_proveedor, precio_unitario) VALUES 
('Camisa Polo Empresa', 'Camisa polo con logo bordado, 100% algodón', 1, 'Unidad', 1, 1, 35000.00),
('Pantalón Jean Industrial', 'Pantalón jean reforzado para trabajo industrial', 1, 'Unidad', 1, 1, 65000.00),
('Zapatos de Seguridad', 'Zapatos con puntera de acero y suela antideslizante', 1, 'Par', 2, 4, 120000.00),
('Casco de Seguridad', 'Casco industrial con barboquejo ajustable', 0, 'Unidad', 3, 3, 25000.00),
('Guantes de Seguridad', 'Guantes antideslizantes para manipulación', 1, 'Par', 3, 3, 8000.00),
('Chaleco Reflectivo', 'Chaleco con bandas reflectivas alta visibilidad', 1, 'Unidad', 3, 3, 18000.00),
('Gafas de Seguridad', 'Gafas protectoras con filtro UV', 0, 'Unidad', 3, 3, 12000.00),
('Overol Industrial', 'Overol completo para áreas de producción', 1, 'Unidad', 1, 1, 85000.00);

-- Tallas
INSERT INTO Talla (tipo_articulo, talla, id_genero) VALUES 
-- Tallas para ropa masculina
('Camisa', 'S', 1), ('Camisa', 'M', 1), ('Camisa', 'L', 1), ('Camisa', 'XL', 1), ('Camisa', 'XXL', 1),
('Pantalón', '28', 1), ('Pantalón', '30', 1), ('Pantalón', '32', 1), ('Pantalón', '34', 1), ('Pantalón', '36', 1), ('Pantalón', '38', 1),
('Overol', 'S', 1), ('Overol', 'M', 1), ('Overol', 'L', 1), ('Overol', 'XL', 1), ('Overol', 'XXL', 1),
-- Tallas para ropa femenina
('Camisa', 'XS', 2), ('Camisa', 'S', 2), ('Camisa', 'M', 2), ('Camisa', 'L', 2), ('Camisa', 'XL', 2),
('Pantalón', '6', 2), ('Pantalón', '8', 2), ('Pantalón', '10', 2), ('Pantalón', '12', 2), ('Pantalón', '14', 2), ('Pantalón', '16', 2),
('Overol', 'XS', 2), ('Overol', 'S', 2), ('Overol', 'M', 2), ('Overol', 'L', 2), ('Overol', 'XL', 2),
-- Tallas de calzado
('Zapato', '36', 2), ('Zapato', '37', 2), ('Zapato', '38', 2), ('Zapato', '39', 2), ('Zapato', '40', 2), ('Zapato', '41', 2),
('Zapato', '38', 1), ('Zapato', '39', 1), ('Zapato', '40', 1), ('Zapato', '41', 1), ('Zapato', '42', 1), ('Zapato', '43', 1), ('Zapato', '44', 1),
-- Tallas de guantes
('Guante', 'S', 1), ('Guante', 'M', 1), ('Guante', 'L', 1), ('Guante', 'XL', 1),
('Guante', 'S', 2), ('Guante', 'M', 2), ('Guante', 'L', 2),
-- Tallas de chaleco
('Chaleco', 'S', 1), ('Chaleco', 'M', 1), ('Chaleco', 'L', 1), ('Chaleco', 'XL', 1), ('Chaleco', 'XXL', 1),
('Chaleco', 'XS', 2), ('Chaleco', 'S', 2), ('Chaleco', 'M', 2), ('Chaleco', 'L', 2), ('Chaleco', 'XL', 2);

-- Empleados de ejemplo
INSERT INTO Empleado (nombre, apellido, email, telefono, cargo, id_genero, id_area, id_rol) VALUES 
('Juan Carlos', 'Rodríguez Silva', 'juan.rodriguez@empresa.com', '300-123-4567', 'Operario Senior', 1, 1, 1),
('María Elena', 'González Pérez', 'maria.gonzalez@empresa.com', '301-234-5678', 'Supervisora de Calidad', 2, 4, 5),
('Carlos Andrés', 'Martínez López', 'carlos.martinez@empresa.com', '302-345-6789', 'Técnico de Mantenimiento', 1, 3, 4),
('Ana María', 'Hernández Castro', 'ana.hernandez@empresa.com', '303-456-7890', 'Auxiliar Administrativo', 2, 2, 8),
('Luis Fernando', 'Vargas Moreno', 'luis.vargas@empresa.com', '304-567-8901', 'Coordinador de Producción', 1, 1, 2),
('Sandra Patricia', 'Jiménez Ruiz', 'sandra.jimenez@empresa.com', '305-678-9012', 'Almacenista', 2, 7, 6),
('Diego Alejandro', 'Torres Gómez', 'diego.torres@empresa.com', '306-789-0123', 'Operario', 1, 5, 1),
('Claudia Marcela', 'Ramírez Soto', 'claudia.ramirez@empresa.com', '307-890-1234', 'Inspector de Calidad', 2, 4, 5);

-- Kits de Dotación
INSERT INTO KitDotacion (nombre, id_area) VALUES 
('Kit Operario Producción', 1),
('Kit Supervisor', 1),
('Kit Administrativo', 2),
('Kit Mantenimiento', 3),
('Kit Almacén', 7);

-- Detalles de Kits
INSERT INTO DetalleKitDotacion (id_kit, id_dotacion, cantidad) VALUES 
-- Kit Operario Producción
(1, 1, 2), -- 2 Camisas polo
(1, 2, 2), -- 2 Pantalones
(1, 3, 1), -- 1 Par zapatos seguridad
(1, 4, 1), -- 1 Casco
(1, 5, 2), -- 2 Pares guantes
(1, 7, 1), -- 1 Gafas seguridad
-- Kit Supervisor
(2, 1, 3), -- 3 Camisas polo
(2, 2, 2), -- 2 Pantalones
(2, 3, 1), -- 1 Par zapatos
(2, 4, 1), -- 1 Casco
(2, 7, 1), -- 1 Gafas
-- Kit Administrativo
(3, 1, 2), -- 2 Camisas polo
(3, 2, 1), -- 1 Pantalón
-- Kit Mantenimiento
(4, 8, 2), -- 2 Overoles
(4, 3, 1), -- 1 Par zapatos
(4, 4, 1), -- 1 Casco
(4, 5, 3), -- 3 Pares guantes
(4, 7, 1); -- 1 Gafas

-- Stock inicial
INSERT INTO StockDotacion (id_dotacion, id_talla, id_area, id_ubicacion, cantidad) VALUES 
-- Stock en Bodega Central
(1, 2, 7, 3, 150), -- Camisa M
(1, 3, 7, 3, 200), -- Camisa L
(1, 4, 7, 3, 100), -- Camisa XL
(2, 7, 7, 3, 80),  -- Pantalón 30
(2, 8, 7, 3, 120), -- Pantalón 32
(2, 9, 7, 3, 90),  -- Pantalón 34
(3, 29, 7, 3, 50), -- Zapatos 40
(3, 30, 7, 3, 45), -- Zapatos 41
(3, 31, 7, 3, 40), -- Zapatos 42
(4, 1, 7, 3, 200), -- Cascos (sin talla)
(7, 1, 7, 3, 300); -- Gafas (sin talla)

-- Solicitudes de ejemplo
INSERT INTO SolicitudDotacion (id_empleado, id_kit, fecha_creacion, estado) VALUES 
(1, 1, '2024-10-01', 'entregado'),
(2, 2, '2024-10-02', 'procesado'),
(3, 4, '2024-10-03', 'pendiente'),
(4, 3, '2024-10-04', 'pendiente'),
(5, 2, '2024-10-05', 'entregado');

-- Entregas realizadas
INSERT INTO EntregaDotacion (id_empleado, id_dotacion, id_talla, cantidad, fecha_entrega, observaciones) VALUES 
(1, 1, 3, 2, '2024-10-01', 'Entrega kit completo operario'),
(1, 2, 8, 2, '2024-10-01', 'Entrega kit completo operario'),
(1, 3, 29, 1, '2024-10-01', 'Entrega kit completo operario'),
(5, 1, 3, 3, '2024-10-05', 'Kit supervisor - entrega completa'),
(5, 2, 8, 2, '2024-10-05', 'Kit supervisor - entrega completa');

-- Pedidos de compra
INSERT INTO PedidoCompras (fecha, estado, observaciones, total_pedido) VALUES 
('2024-09-15', 'recibido_completo', 'Pedido mensual uniformes', 15750000.00),
('2024-10-01', 'enviado', 'Reposición stock EPP', 8500000.00),
('2024-10-07', 'enviado', 'Pedido urgente calzado seguridad', 12000000.00);

-- Historial de movimientos
INSERT INTO HistorialMovimientos (tabla_modificada, id_registro, tipo_movimiento, usuario_responsable, detalle_cambio) VALUES 
('Empleado', 1, 'INSERT', 'admin', 'Registro nuevo empleado Juan Carlos Rodríguez'),
('SolicitudDotacion', 1, 'INSERT', 'supervisor', 'Nueva solicitud kit operario'),
('StockDotacion', 1, 'UPDATE', 'almacenista', 'Actualización stock por entrega'),
('EntregaDotacion', 1, 'INSERT', 'almacenista', 'Registro entrega a empleado'),
('PedidoCompras', 1, 'INSERT', 'admin', 'Nuevo pedido de compra generado');

COMMIT;