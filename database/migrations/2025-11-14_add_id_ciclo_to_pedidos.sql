ALTER TABLE PedidoCompras
ADD COLUMN id_ciclo INT NULL AFTER id_pedido,
ADD KEY idx_pedidocompras_ciclo (id_ciclo),
ADD CONSTRAINT fk_pedidocompras_ciclo
    FOREIGN KEY (id_ciclo) REFERENCES ciclo_dotacion(id_ciclo)
    ON DELETE SET NULL;
