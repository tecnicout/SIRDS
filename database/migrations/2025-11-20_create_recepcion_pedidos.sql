USE sirds;

-- Tabla para recepciones de pedidos (cabecera)
CREATE TABLE IF NOT EXISTS RecepcionPedido (
    id_recepcion INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_proveedor INT NULL,
    proveedor_nombre VARCHAR(150) NULL,
    documento_referencia VARCHAR(120) NULL,
    fecha_recepcion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT NULL,
    usuario_registro VARCHAR(100) NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_recepcion_pedido
        FOREIGN KEY (id_pedido) REFERENCES PedidoCompras(id_pedido)
        ON DELETE CASCADE,
    CONSTRAINT fk_recepcion_proveedor
        FOREIGN KEY (id_proveedor) REFERENCES Proveedor(id_proveedor)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_recepcion_id_pedido ON RecepcionPedido(id_pedido);

-- Tabla para recepciones de pedidos (detalle)
CREATE TABLE IF NOT EXISTS DetalleRecepcionPedido (
    id_recepcion_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_recepcion INT NOT NULL,
    id_detalle_pedido INT NOT NULL,
    id_dotacion INT NOT NULL,
    id_talla INT NULL,
    cantidad_recibida INT NOT NULL,
    precio_unitario DECIMAL(12,2) NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_detalle_recepcion
        FOREIGN KEY (id_recepcion) REFERENCES RecepcionPedido(id_recepcion)
        ON DELETE CASCADE,
    CONSTRAINT fk_detalle_recepcion_pedido
        FOREIGN KEY (id_detalle_pedido) REFERENCES DetallePedidoCompras(id_detalle)
        ON DELETE CASCADE,
    CONSTRAINT fk_detalle_recepcion_dotacion
        FOREIGN KEY (id_dotacion) REFERENCES Dotacion(id_dotacion)
        ON DELETE RESTRICT,
    CONSTRAINT fk_detalle_recepcion_talla
        FOREIGN KEY (id_talla) REFERENCES Talla(id_talla)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_detalle_recepcion_pedido_detalle ON DetalleRecepcionPedido(id_detalle_pedido);
