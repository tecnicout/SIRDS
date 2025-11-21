const ExcelJS = require('exceljs');
const { query, getConnection } = require('../config/database');
const CicloDotacionModel = require('../models/CicloDotacionModel');

const buildError = (code, message, meta = {}) => {
  const err = new Error(message);
  err.code = code;
  err.meta = meta;
  return err;
};

const createPlaceholders = (arr = []) => arr.map(() => '?').join(',');

const formatSqlDate = (date = new Date()) => new Date(date).toISOString().slice(0, 10);

let sinTallaCacheId = null;
const ensureSinTallaId = async (connection) => {
  if (sinTallaCacheId) return sinTallaCacheId;
  const [rows] = await connection.query(
    'SELECT id_talla FROM talla WHERE tipo_articulo = ? AND talla = ? LIMIT 1',
    ['General', 'SIN_TALLA']
  );
  if (rows && rows.length) {
    sinTallaCacheId = rows[0].id_talla;
    return sinTallaCacheId;
  }
  const [insert] = await connection.query(
    'INSERT INTO talla (tipo_articulo, talla, id_genero) VALUES (?, ?, ?)',
    ['General', 'SIN_TALLA', 1]
  );
  sinTallaCacheId = insert.insertId;
  return sinTallaCacheId;
};

const recepcionTableSql = `
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
    CONSTRAINT fk_recepcion_pedido FOREIGN KEY (id_pedido) REFERENCES PedidoCompras(id_pedido) ON DELETE CASCADE,
    CONSTRAINT fk_recepcion_proveedor FOREIGN KEY (id_proveedor) REFERENCES Proveedor(id_proveedor) ON DELETE SET NULL,
    INDEX idx_recepcion_id_pedido (id_pedido)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

const detalleRecepcionTableSql = `
  CREATE TABLE IF NOT EXISTS DetalleRecepcionPedido (
    id_recepcion_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_recepcion INT NOT NULL,
    id_detalle_pedido INT NOT NULL,
    id_dotacion INT NOT NULL,
    id_talla INT NULL,
    cantidad_recibida INT NOT NULL,
    precio_unitario DECIMAL(12,2) NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_detalle_recepcion FOREIGN KEY (id_recepcion) REFERENCES RecepcionPedido(id_recepcion) ON DELETE CASCADE,
    CONSTRAINT fk_detalle_recepcion_pedido FOREIGN KEY (id_detalle_pedido) REFERENCES DetallePedidoCompras(id_detalle) ON DELETE CASCADE,
    CONSTRAINT fk_detalle_recepcion_dotacion FOREIGN KEY (id_dotacion) REFERENCES Dotacion(id_dotacion) ON DELETE RESTRICT,
    CONSTRAINT fk_detalle_recepcion_talla FOREIGN KEY (id_talla) REFERENCES Talla(id_talla) ON DELETE SET NULL,
    INDEX idx_detalle_recepcion_pedido_detalle (id_detalle_pedido)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

let recepcionTablesReady = false;
let recepcionInitPromise = null;

const ensureRecepcionTables = async () => {
  if (recepcionTablesReady) return true;
  if (recepcionInitPromise) {
    await recepcionInitPromise;
    return true;
  }
  recepcionInitPromise = (async () => {
    await query(recepcionTableSql);
    await query(detalleRecepcionTableSql);
    recepcionTablesReady = true;
  })().catch((error) => {
    recepcionInitPromise = null;
    console.error('[PedidoController] No fue posible crear tablas de recepción:', error.message);
    throw error;
  });
  await recepcionInitPromise;
  return true;
};

const DEFAULT_STOCK_AREA_ID = Number(process.env.DEFAULT_STOCK_AREA_ID || 7);
const DEFAULT_STOCK_UBICACION_ID = Number(process.env.DEFAULT_STOCK_UBICACION_ID || 3);
const stockLocationCache = new Map();

const resolveStockLocation = async (connection, idDotacion) => {
  if (stockLocationCache.has(idDotacion)) {
    return stockLocationCache.get(idDotacion);
  }

  const [existing] = await connection.query(
    'SELECT id_area, id_ubicacion FROM stockdotacion WHERE id_dotacion = ? LIMIT 1',
    [idDotacion]
  );
  if (existing.length) {
    stockLocationCache.set(idDotacion, existing[0]);
    return existing[0];
  }

  if (DEFAULT_STOCK_AREA_ID == null || DEFAULT_STOCK_UBICACION_ID == null) {
    throw buildError('STOCK_LOCATION_REQUIRED', 'No existe un área/ubicación predeterminada para almacenar la recepción.');
  }

  const fallback = {
    id_area: DEFAULT_STOCK_AREA_ID,
    id_ubicacion: DEFAULT_STOCK_UBICACION_ID
  };
  stockLocationCache.set(idDotacion, fallback);
  return fallback;
};

class PedidoController {
  static async list(req, res) {
    try {
      const pedidos = await query(`
        SELECT p.id_pedido, p.id_ciclo, p.fecha, p.estado, p.total_pedido, p.observaciones,
               cd.nombre_ciclo,
               COALESCE(det.total_items, 0) AS total_items,
               COALESCE(det.total_lineas, 0) AS total_lineas
        FROM PedidoCompras p
        LEFT JOIN ciclo_dotacion cd ON cd.id_ciclo = p.id_ciclo
        LEFT JOIN (
          SELECT id_pedido, SUM(cantidad_solicitada) AS total_items, COUNT(*) AS total_lineas
          FROM DetallePedidoCompras
          GROUP BY id_pedido
        ) det ON det.id_pedido = p.id_pedido
        ORDER BY p.fecha DESC, p.id_pedido DESC
      `);

      return res.json({ success: true, data: pedidos });
    } catch (error) {
      console.error('[PedidoController.list] Error:', error);
      return res.status(500).json({ success: false, message: 'Error al obtener pedidos', error: error.message });
    }
  }

  static async stats(req, res) {
    try {
      const statsResult = await query(`
        SELECT 
          COUNT(*) AS total,
          SUM(CASE WHEN estado = 'enviado' THEN 1 ELSE 0 END) AS enviados,
          SUM(CASE WHEN estado = 'recibido_parcial' THEN 1 ELSE 0 END) AS recibidos_parcial,
          SUM(CASE WHEN estado = 'recibido_completo' THEN 1 ELSE 0 END) AS recibidos_completos,
          COALESCE(SUM(total_pedido), 0) AS monto_total,
          MAX(fecha) AS ultimo_pedido
        FROM PedidoCompras
      `);
      const statsRow = statsResult[0] || {};

      const detalleStatsResult = await query(`
        SELECT 
          COALESCE(SUM(cantidad_solicitada), 0) AS articulos_solicitados,
          COUNT(DISTINCT id_pedido) AS pedidos_con_items
        FROM DetallePedidoCompras
      `);
      const detalleRow = detalleStatsResult[0] || {};

      return res.json({
        success: true,
        data: {
          ...statsRow,
          articulos_solicitados: detalleRow.articulos_solicitados || 0,
          pedidos_con_items: detalleRow.pedidos_con_items || 0
        }
      });
    } catch (error) {
      console.error('[PedidoController.stats] Error:', error);
      return res.status(500).json({ success: false, message: 'Error al obtener estadísticas de pedidos', error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const payload = await PedidoController.fetchPedidoDetalle(Number(id));
      if (!payload.pedido) {
        return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
      }
      return res.json({ success: true, data: payload });
    } catch (error) {
      console.error('[PedidoController.getById] Error:', error);
      return res.status(500).json({ success: false, message: 'Error al obtener el pedido', error: error.message });
    }
  }

  static async generar(req, res) {
    let connection;
    let hasTransaction = false;
    try {
      const ciclo = await CicloDotacionModel.getCicloActivo();
      if (!ciclo) {
        throw buildError('CICLO_INACTIVO', 'No existe un ciclo activo en ventana.');
      }

      connection = await getConnection();
      await connection.beginTransaction();
      hasTransaction = true;

      const [empleados] = await connection.query(`
        SELECT ec.id_empleado, ec.id_empleado_ciclo, ec.inclusion_manual,
               COALESCE(ec.id_kit, k.id_kit_area) AS id_kit_resuelto,
               CONCAT(e.nombre, ' ', e.apellido) AS nombre_completo
        FROM empleado_ciclo ec
        INNER JOIN empleado e ON e.id_empleado = ec.id_empleado
        LEFT JOIN (
          SELECT id_area, id_kit AS id_kit_area
          FROM kitdotacion
          WHERE activo = 1
        ) k ON k.id_area = ec.id_area
        WHERE ec.id_ciclo = ?
          AND ec.estado = 'procesado'
      `, [ciclo.id_ciclo]);

      if (!empleados.length) {
        throw buildError('SIN_EMPLEADOS', 'No hay empleados en estado procesado para el ciclo activo.');
      }

      const sinKit = empleados.filter(emp => !emp.id_kit_resuelto);
      if (sinKit.length) {
        throw buildError('SIN_KIT', 'Existen empleados sin kit asignado.', {
          empleados: sinKit.map(emp => ({
            id_empleado: emp.id_empleado,
            nombre: emp.nombre_completo
          }))
        });
      }

      const [detalleRows] = await connection.query(`
        SELECT 
          ec.id_empleado,
          ec.inclusion_manual,
          e.id_genero,
          COALESCE(ec.id_kit, k_area.id_kit) AS id_kit_resuelto,
          dk.id_dotacion,
          dk.cantidad AS cantidad_kit,
          d.nombre_dotacion,
          d.descripcion,
          d.talla_requerida,
          d.precio_unitario,
          d.id_categoria,
          cat.nombre_categoria,
          etd.id_talla,
          t.talla AS talla_label,
          t.tipo_articulo AS tipo_talla,
          e.nombre,
          e.apellido
        FROM empleado_ciclo ec
        INNER JOIN empleado e ON e.id_empleado = ec.id_empleado
        LEFT JOIN kitdotacion k_area ON k_area.id_area = ec.id_area AND k_area.activo = 1
        INNER JOIN detallekitdotacion dk ON dk.id_kit = COALESCE(ec.id_kit, k_area.id_kit)
        INNER JOIN dotacion d ON d.id_dotacion = dk.id_dotacion
        LEFT JOIN categoriadotacion cat ON cat.id_categoria = d.id_categoria
        LEFT JOIN empleado_talla_dotacion etd ON etd.id_empleado = ec.id_empleado AND etd.id_dotacion = dk.id_dotacion
        LEFT JOIN talla t ON t.id_talla = etd.id_talla
        WHERE ec.id_ciclo = ?
          AND ec.estado = 'procesado'
      `, [ciclo.id_ciclo]);

      if (!detalleRows.length) {
        throw buildError('SIN_DOTACIONES', 'No se encontraron dotaciones asociadas a los kits del ciclo.');
      }

      const faltantesTallaMap = new Map();
      for (const row of detalleRows) {
        if (Number(row.talla_requerida) === 1 && !row.id_talla) {
          const key = `${row.id_empleado}-${row.id_dotacion}`;
          if (!faltantesTallaMap.has(key)) {
            faltantesTallaMap.set(key, {
              id_empleado: row.id_empleado,
              empleado: `${row.nombre} ${row.apellido}`.trim(),
              id_dotacion: row.id_dotacion,
              dotacion: row.nombre_dotacion
            });
          }
        }
      }

      if (faltantesTallaMap.size) {
        throw buildError('TALLAS_PENDIENTES', 'Hay empleados sin tallas registradas para artículos que lo requieren.', {
          faltantes: Array.from(faltantesTallaMap.values())
        });
      }

      const sinTallaId = await ensureSinTallaId(connection);

      const aggregated = new Map();
      for (const row of detalleRows) {
        const requiereTalla = Number(row.talla_requerida) === 1;
        const tallaLabel = requiereTalla ? (row.talla_label || String(row.id_talla)) : 'SIN_TALLA';
        const tallaLabelKey = (tallaLabel || 'SIN_TALLA').toString().trim().toUpperCase();
        const tallaTipo = requiereTalla ? row.tipo_talla || 'General' : 'General';
        const tallaId = requiereTalla ? (row.id_talla || sinTallaId) : sinTallaId;
        const key = `${row.id_dotacion}::${tallaLabelKey}`;

        if (!aggregated.has(key)) {
          aggregated.set(key, {
            id_dotacion: row.id_dotacion,
            nombre_dotacion: row.nombre_dotacion,
            categoria: row.nombre_categoria || null,
            id_talla: tallaId,
            talla: tallaLabel || 'SIN_TALLA',
            tipo_talla: tallaTipo,
            cantidad: 0,
            precio_unitario: Number(row.precio_unitario) || 0,
            subtotal: 0
          });
        }
        const entry = aggregated.get(key);
        entry.cantidad += Number(row.cantidad_kit) || 1;
        entry.subtotal = Number((entry.cantidad * entry.precio_unitario).toFixed(2));

        // Si aún no teníamos un id_talla representativo (p. ej. SIN_TALLA), conservar el primero válido
        if (requiereTalla && (!entry.id_talla || entry.id_talla === sinTallaId) && row.id_talla) {
          entry.id_talla = row.id_talla;
        }
      }

      const detalles = Array.from(aggregated.values()).sort((a, b) => {
        if (a.nombre_dotacion === b.nombre_dotacion) {
          return (a.talla || '').localeCompare(b.talla || '');
        }
        return a.nombre_dotacion.localeCompare(b.nombre_dotacion);
      });

      const totalPedido = detalles.reduce((sum, det) => sum + det.subtotal, 0);
      const fechaSql = formatSqlDate();
      const observaciones = `Pedido generado automáticamente para ciclo ${ciclo.nombre_ciclo || ciclo.id_ciclo}`;

      const [pedidoInsert] = await connection.query(
        `INSERT INTO PedidoCompras (id_ciclo, fecha, estado, observaciones, total_pedido)
         VALUES (?, ?, 'enviado', ?, ?)` ,
        [ciclo.id_ciclo, fechaSql, observaciones, totalPedido]
      );

      const id_pedido = pedidoInsert.insertId;
      const insertDetalleSql = `
        INSERT INTO DetallePedidoCompras
          (id_pedido, id_dotacion, id_talla, cantidad_solicitada, cantidad_recibida, precio_unitario, subtotal)
        VALUES (?, ?, ?, ?, 0, ?, ?)
      `;

      for (const det of detalles) {
        if (!det.id_talla) {
          throw buildError('TALLA_INVALIDA', `El artículo ${det.nombre_dotacion} no tiene talla asociada para el pedido.`);
        }
        await connection.query(insertDetalleSql, [
          id_pedido,
          det.id_dotacion,
          det.id_talla,
          det.cantidad,
          det.precio_unitario,
          det.subtotal
        ]);
      }

      await connection.commit();
      hasTransaction = false;

      const empleadosSet = new Set();
      const manualesSet = new Set();
      for (const emp of empleados) {
        empleadosSet.add(emp.id_empleado);
        if (Number(emp.inclusion_manual) === 1) {
          manualesSet.add(emp.id_empleado);
        }
      }

      return res.status(201).json({
        success: true,
        message: 'Pedido generado correctamente',
        data: {
          pedido: {
            id_pedido,
            fecha: fechaSql,
            estado: 'enviado',
            total_pedido: totalPedido,
            id_ciclo: ciclo.id_ciclo,
            observaciones
          },
          detalles,
          meta: {
            ciclo: {
              id_ciclo: ciclo.id_ciclo,
              nombre: ciclo.nombre_ciclo,
              fecha_entrega: ciclo.fecha_entrega
            },
            empleados_considerados: empleadosSet.size,
            empleados_manuales: manualesSet.size,
            total_items: detalles.reduce((sum, det) => sum + det.cantidad, 0)
          }
        }
      });
    } catch (error) {
      if (connection && hasTransaction) {
        try { await connection.rollback(); } catch (_) { /* ignore */ }
      }
      if (connection) {
        connection.release();
        connection = null;
      }

      const statusByCode = {
        CICLO_INACTIVO: 400,
        SIN_EMPLEADOS: 400,
        SIN_KIT: 409,
        SIN_DOTACIONES: 400,
        TALLAS_PENDIENTES: 409,
        TALLA_INVALIDA: 422
      };
      const status = statusByCode[error.code] || 500;
      const payload = { success: false, message: error.message };
      if (error.meta) {
        payload.details = error.meta;
      }
      console.error('[PedidoController.generar] Error:', error.message, error.meta || '');
      return res.status(status).json(payload);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  static async remove(req, res) {
    const idPedido = Number(req.params.id);
    if (!idPedido) {
      return res.status(400).json({ success: false, message: 'Identificador de pedido inválido.' });
    }

    let connection;
    try {
      connection = await getConnection();
      await connection.beginTransaction();

      const [rows] = await connection.query(
        'SELECT id_pedido, estado FROM PedidoCompras WHERE id_pedido = ? LIMIT 1',
        [idPedido]
      );

        if (stockRows.length) {
          await connection.query(
            'UPDATE stockdotacion SET cantidad = cantidad + ?, fecha_actualizacion = NOW() WHERE id_stock = ?',
            [item.cantidad, stockRows[0].id_stock]
          );
        } else {
          const stockLocation = await resolveStockLocation(connection, item.id_dotacion);
          await connection.query(
            `INSERT INTO stockdotacion (id_dotacion, id_talla, id_area, id_ubicacion, cantidad)
             VALUES (?, ?, ?, ?, ?)` ,
            [
              item.id_dotacion,
              item.id_talla,
              stockLocation.id_area,
              stockLocation.id_ubicacion,
              item.cantidad
            ]
          );
        }
    } catch (error) {
      if (connection) {
        try {
          await connection.rollback();
        } catch (_) { /* noop */ }
      }
      console.error('[PedidoController.remove] Error:', error);
      return res.status(500).json({ success: false, message: 'Error al eliminar el pedido', error: error.message });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  static async registrarRecepcion(req, res) {
    const idPedido = Number(req.params.id);
    if (!idPedido) {
      return res.status(400).json({ success: false, message: 'Identificador de pedido inválido' });
    }

    try {
      await ensureRecepcionTables();
    } catch (err) {
      console.error('[PedidoController.registrarRecepcion] Error creando tablas:', err.message);
      return res.status(500).json({ success: false, message: 'No fue posible preparar las tablas de recepción', error: err.message });
    }

    const {
      proveedorId,
      proveedorNombre,
      documentoReferencia,
      fechaRecepcion,
      observaciones,
      items
    } = req.body || {};

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ success: false, message: 'Debe enviar al menos una línea a recibir' });
    }

    const connection = await getConnection();
    try {
      await connection.beginTransaction();

      const [pedidoRows] = await connection.query(
        'SELECT id_pedido, estado FROM PedidoCompras WHERE id_pedido = ? FOR UPDATE',
        [idPedido]
      );

      if (!pedidoRows.length) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
      }

      const pedido = pedidoRows[0];
      if (!['enviado', 'recibido_parcial'].includes(pedido.estado)) {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: 'Solo se pueden registrar recepciones para pedidos enviados o parcialmente recibidos'
        });
      }

      const detalleRequests = [];
      const dotacionRequests = [];
      for (const item of items) {
        const idDetalle = Number(item.id_detalle_pedido || item.detalleId);
        const idDotacion = Number(item.id_dotacion || item.dotacionId);
        if (idDetalle) {
          detalleRequests.push({ ...item, id_detalle: idDetalle });
        } else if (idDotacion) {
          dotacionRequests.push({ ...item, id_dotacion: idDotacion });
        } else {
          await connection.rollback();
          return res.status(400).json({ success: false, message: 'Cada línea debe indicar id_detalle_pedido o id_dotacion' });
        }
      }

      if (!detalleRequests.length && !dotacionRequests.length) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: 'Debe enviar al menos una línea válida' });
      }

      const detalleMap = new Map();

      if (detalleRequests.length) {
        const detalleIds = detalleRequests.map((item) => item.id_detalle);
        const placeholders = createPlaceholders(detalleIds);
        const [detalleRows] = await connection.query(
          `SELECT dp.id_detalle, dp.id_dotacion, dp.id_talla, dp.cantidad_solicitada, dp.cantidad_recibida,
            dp.precio_unitario,
            (dp.cantidad_solicitada - dp.cantidad_recibida) AS pendiente,
                  d.nombre_dotacion
           FROM DetallePedidoCompras dp
           INNER JOIN dotacion d ON d.id_dotacion = dp.id_dotacion
           WHERE dp.id_pedido = ? AND dp.id_detalle IN (${placeholders})
           FOR UPDATE`,
          [idPedido, ...detalleIds]
        );

        if (detalleRows.length !== detalleIds.length) {
          await connection.rollback();
          return res.status(400).json({ success: false, message: 'Una o más líneas no pertenecen al pedido' });
        }

        detalleRows.forEach((row) => detalleMap.set(row.id_detalle, row));
      }

      let dotacionDetalleMap = new Map();
      if (dotacionRequests.length) {
        const dotacionIds = Array.from(new Set(dotacionRequests.map((item) => item.id_dotacion)));
        const placeholdersDot = createPlaceholders(dotacionIds);
        const [dotacionRows] = await connection.query(
          `SELECT dp.id_detalle, dp.id_dotacion, dp.id_talla, dp.cantidad_solicitada, dp.cantidad_recibida,
                  dp.precio_unitario,
                  (dp.cantidad_solicitada - dp.cantidad_recibida) AS pendiente,
                  d.nombre_dotacion
             FROM DetallePedidoCompras dp
             INNER JOIN dotacion d ON d.id_dotacion = dp.id_dotacion
             WHERE dp.id_pedido = ? AND dp.id_dotacion IN (${placeholdersDot})
             ORDER BY dp.id_dotacion, dp.id_detalle
             FOR UPDATE`,
          [idPedido, ...dotacionIds]
        );

        dotacionDetalleMap = dotacionRows.reduce((acc, row) => {
          if (!acc.has(row.id_dotacion)) {
            acc.set(row.id_dotacion, []);
          }
          const sharedRow = detalleMap.get(row.id_detalle) || row;
          if (!detalleMap.has(row.id_detalle)) {
            detalleMap.set(row.id_detalle, sharedRow);
          }
          acc.get(row.id_dotacion).push(sharedRow);
          return acc;
        }, new Map());

        for (const dotacionId of dotacionIds) {
          if (!dotacionDetalleMap.has(dotacionId)) {
            await connection.rollback();
            return res.status(400).json({
              success: false,
              message: 'El pedido no contiene líneas pendientes para la dotación solicitada'
            });
          }
        }
      }

      const preparedItems = [];

      for (const item of detalleRequests) {
        const cantidad = Number(item.cantidad);
        const detalle = detalleMap.get(item.id_detalle);
        if (!detalle) {
          await connection.rollback();
          return res.status(400).json({ success: false, message: 'Detalle inválido en la solicitud' });
        }
        if (!cantidad || cantidad <= 0) {
          await connection.rollback();
          return res.status(400).json({ success: false, message: 'La cantidad debe ser mayor a cero' });
        }

        preparedItems.push({
          id_detalle: detalle.id_detalle,
          cantidad,
          id_dotacion: detalle.id_dotacion,
          id_talla: detalle.id_talla,
          precio_unitario: detalle.precio_unitario || null
        });
        detalle.pendiente = Math.max((Number(detalle.pendiente) || 0) - cantidad, 0);
      }

      for (const item of dotacionRequests) {
        const cantidadSolicitada = Number(item.cantidad || item.cantidad_total);
        const lineasDotacion = dotacionDetalleMap.get(item.id_dotacion) || [];
        if (!cantidadSolicitada || cantidadSolicitada <= 0) {
          await connection.rollback();
          return res.status(400).json({ success: false, message: 'La cantidad debe ser mayor a cero' });
        }
        if (!lineasDotacion.length) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: 'No hay líneas disponibles para distribuir la recepción agrupada'
          });
        }

        const pendienteTotal = lineasDotacion.reduce((sum, linea) => sum + Math.max(Number(linea.pendiente) || 0, 0), 0);
        if (!pendienteTotal) {
          await connection.rollback();
          return res.status(409).json({
            success: false,
            message: `La dotación ${lineasDotacion[0].nombre_dotacion} ya no tiene cantidades pendientes`
          });
        }

        let restante = cantidadSolicitada;
        for (const linea of lineasDotacion) {
          const pendiente = Math.max(Number(linea.pendiente) || 0, 0);
          if (!pendiente || restante <= 0) {
            continue;
          }
          const asignar = Math.min(pendiente, restante);
          preparedItems.push({
            id_detalle: linea.id_detalle,
            cantidad: asignar,
            id_dotacion: linea.id_dotacion,
            id_talla: linea.id_talla,
            precio_unitario: linea.precio_unitario || null
          });
          linea.pendiente = Math.max(pendiente - asignar, 0);
          restante -= asignar;
          if (restante <= 0) {
            break;
          }
        }

        if (restante > 0) {
          const fallbackLinea = lineasDotacion[0];
          if (!fallbackLinea) {
            await connection.rollback();
            return res.status(500).json({
              success: false,
              message: 'No fue posible resolver la línea para completar la recepción agrupada'
            });
          }
          preparedItems.push({
            id_detalle: fallbackLinea.id_detalle,
            cantidad: restante,
            id_dotacion: fallbackLinea.id_dotacion,
            id_talla: fallbackLinea.id_talla,
            precio_unitario: fallbackLinea.precio_unitario || null
          });
          restante = 0;
        }
      }

      const recepcionFecha = fechaRecepcion ? new Date(fechaRecepcion) : new Date();
      const usuarioRegistro = (req.user && req.user.username) || 'sistema';

      const [recepcionInsert] = await connection.query(
        `INSERT INTO RecepcionPedido
          (id_pedido, id_proveedor, proveedor_nombre, documento_referencia, fecha_recepcion, observaciones, usuario_registro)
         VALUES (?, ?, ?, ?, ?, ?, ?)` ,
        [
          idPedido,
          proveedorId || null,
          proveedorNombre || null,
          documentoReferencia || null,
          recepcionFecha,
          observaciones || null,
          usuarioRegistro
        ]
      );
      const idRecepcion = recepcionInsert.insertId;

      for (const item of preparedItems) {
        await connection.query(
          `INSERT INTO DetalleRecepcionPedido
            (id_recepcion, id_detalle_pedido, id_dotacion, id_talla, cantidad_recibida, precio_unitario)
           VALUES (?, ?, ?, ?, ?, ?)` ,
          [
            idRecepcion,
            item.id_detalle,
            item.id_dotacion,
            item.id_talla,
            item.cantidad,
            item.precio_unitario
          ]
        );

        await connection.query(
          'UPDATE DetallePedidoCompras SET cantidad_recibida = cantidad_recibida + ? WHERE id_detalle = ?',
          [item.cantidad, item.id_detalle]
        );

        const [stockRows] = await connection.query(
          'SELECT id_stock FROM stockdotacion WHERE id_dotacion = ? AND id_talla = ? LIMIT 1',
          [item.id_dotacion, item.id_talla]
        );

        if (stockRows.length) {
          await connection.query(
            'UPDATE stockdotacion SET cantidad = cantidad + ?, fecha_actualizacion = NOW() WHERE id_stock = ?',
            [item.cantidad, stockRows[0].id_stock]
          );
        } else {
          const stockLocation = await resolveStockLocation(connection, item.id_dotacion);
          await connection.query(
            `INSERT INTO stockdotacion (id_dotacion, id_talla, id_area, id_ubicacion, cantidad)
             VALUES (?, ?, ?, ?, ?)` ,
            [
              item.id_dotacion,
              item.id_talla,
              stockLocation.id_area,
              stockLocation.id_ubicacion,
              item.cantidad
            ]
          );
        }
      }

      const [pendientesRows] = await connection.query(
        `SELECT SUM(cantidad_solicitada - cantidad_recibida) AS pendientes
         FROM DetallePedidoCompras
         WHERE id_pedido = ?`,
        [idPedido]
      );

      const pendientes = Number(pendientesRows[0]?.pendientes || 0);
      const nuevoEstado = pendientes > 0 ? 'recibido_parcial' : 'recibido_completo';
      await connection.query('UPDATE PedidoCompras SET estado = ? WHERE id_pedido = ?', [nuevoEstado, idPedido]);

      await connection.query(
        `INSERT INTO historialmovimientos (tabla_modificada, id_registro, tipo_movimiento, fecha_movimiento, usuario_responsable, detalle_cambio)
         VALUES ('PedidoCompras', ?, 'RECEPCION', NOW(), ?, ?)` ,
        [
          idPedido,
          usuarioRegistro,
          `Recepción registrada (${preparedItems.length} líneas, estado ${nuevoEstado})`
        ]
      );

      await connection.commit();

      return res.status(201).json({
        success: true,
        message: 'Recepción registrada correctamente',
        data: {
          id_recepcion: idRecepcion,
          estado_pedido: nuevoEstado
        }
      });
    } catch (error) {
      try { await connection.rollback(); } catch (_) { /* ignore */ }
      console.error('[PedidoController.registrarRecepcion] Error:', error);
      const status = error.code === 'STOCK_LOCATION_REQUIRED' ? 409 : 500;
      const message = error.code === 'STOCK_LOCATION_REQUIRED'
        ? error.message
        : 'Error al registrar la recepción';
      return res.status(status).json({ success: false, message, error: error.message });
    } finally {
      connection.release();
    }
  }

  static async listRecepciones(req, res) {
    const idPedido = Number(req.params.id);
    if (!idPedido) {
      return res.status(400).json({ success: false, message: 'Identificador de pedido inválido' });
    }

    try {
      await ensureRecepcionTables();
    } catch (err) {
      console.error('[PedidoController.listRecepciones] Error creando tablas:', err.message);
      return res.status(500).json({ success: false, message: 'No fue posible preparar las tablas de recepción', error: err.message });
    }

    try {
      const pedidoRows = await query(
        `SELECT p.id_pedido, p.estado, p.fecha, p.total_pedido, cd.nombre_ciclo
         FROM PedidoCompras p
         LEFT JOIN ciclo_dotacion cd ON cd.id_ciclo = p.id_ciclo
         WHERE p.id_pedido = ?
         LIMIT 1`,
        [idPedido]
      );

      if (!pedidoRows.length) {
        return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
      }

      const recepciones = await query(
        `SELECT r.*, pr.nombre AS proveedor_catalogo
         FROM RecepcionPedido r
         LEFT JOIN Proveedor pr ON pr.id_proveedor = r.id_proveedor
         WHERE r.id_pedido = ?
         ORDER BY r.fecha_recepcion DESC, r.id_recepcion DESC`,
        [idPedido]
      );

      let detalles = [];
      if (recepciones.length) {
        const ids = recepciones.map((r) => r.id_recepcion);
        const placeholders = createPlaceholders(ids);
        detalles = await query(
          `SELECT drp.*, d.nombre_dotacion, t.talla, t.tipo_articulo
           FROM DetalleRecepcionPedido drp
           INNER JOIN dotacion d ON d.id_dotacion = drp.id_dotacion
           LEFT JOIN talla t ON t.id_talla = drp.id_talla
           WHERE drp.id_recepcion IN (${placeholders})
           ORDER BY drp.id_recepcion, d.nombre_dotacion`,
          ids
        );
      }

      const detalleMap = recepciones.reduce((acc, recepcion) => {
        acc[recepcion.id_recepcion] = [];
        return acc;
      }, {});
      for (const detalle of detalles) {
        if (!detalleMap[detalle.id_recepcion]) {
          detalleMap[detalle.id_recepcion] = [];
        }
        detalleMap[detalle.id_recepcion].push(detalle);
      }

      const payload = recepciones.map((recepcion) => ({
        ...recepcion,
        proveedor_resumen: recepcion.proveedor_nombre || recepcion.proveedor_catalogo,
        detalles: detalleMap[recepcion.id_recepcion] || []
      }));

      const pendientes = await query(
        `SELECT dp.id_detalle, dp.id_dotacion, dp.id_talla, dp.cantidad_solicitada, dp.cantidad_recibida,
                (dp.cantidad_solicitada - dp.cantidad_recibida) AS pendiente,
                d.nombre_dotacion,
                d.id_proveedor,
                pr.nombre AS nombre_proveedor,
                t.talla
         FROM DetallePedidoCompras dp
         INNER JOIN dotacion d ON d.id_dotacion = dp.id_dotacion
         LEFT JOIN proveedor pr ON pr.id_proveedor = d.id_proveedor
         LEFT JOIN talla t ON t.id_talla = dp.id_talla
         WHERE dp.id_pedido = ?
         ORDER BY dp.id_detalle`,
        [idPedido]
      );

      const pendientesAgrupadosMap = new Map();
      for (const linea of pendientes) {
        const key = linea.id_dotacion;
        if (!pendientesAgrupadosMap.has(key)) {
          pendientesAgrupadosMap.set(key, {
            id_dotacion: linea.id_dotacion,
            nombre_dotacion: linea.nombre_dotacion,
            id_proveedor: linea.id_proveedor || null,
            nombre_proveedor: linea.nombre_proveedor || null,
            total_solicitado: 0,
            total_recibido: 0,
            total_pendiente: 0,
            tallas: []
          });
        }
        const entry = pendientesAgrupadosMap.get(key);
        entry.total_solicitado += Number(linea.cantidad_solicitada || 0);
        entry.total_recibido += Number(linea.cantidad_recibida || 0);
        entry.total_pendiente += Number(linea.pendiente || 0);
        entry.tallas.push({
          id_detalle: linea.id_detalle,
          talla: linea.talla,
          solicitado: Number(linea.cantidad_solicitada || 0),
          recibido: Number(linea.cantidad_recibida || 0),
          pendiente: Number(linea.pendiente || 0)
        });
      }

      const pendientesAgrupados = Array.from(pendientesAgrupadosMap.values()).sort((a, b) => {
        const proveedorCompare = (a.nombre_proveedor || '').localeCompare(b.nombre_proveedor || '');
        if (proveedorCompare !== 0) {
          return proveedorCompare;
        }
        return (a.nombre_dotacion || '').localeCompare(b.nombre_dotacion || '');
      });

      return res.json({
        success: true,
        data: {
          pedido: pedidoRows[0],
          recepciones: payload,
          pendientes,
          pendientesAgrupados
        }
      });
    } catch (error) {
      console.error('[PedidoController.listRecepciones] Error:', error);
      return res.status(500).json({ success: false, message: 'Error al obtener recepciones', error: error.message });
    }
  }

  static async exportar(req, res) {
    try {
      const { id } = req.params;
      const payload = await PedidoController.fetchPedidoDetalle(Number(id));
      if (!payload.pedido) {
        return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
      }

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Pedido');

      sheet.columns = [
        { header: 'Artículo', key: 'articulo', width: 32 },
        { header: 'Categoría', key: 'categoria', width: 22 },
        { header: 'Talla', key: 'talla', width: 12 },
        { header: 'Cantidad solicitada', key: 'cantidad', width: 18 },
        { header: 'Precio unitario', key: 'precio', width: 16 },
        { header: 'Subtotal', key: 'subtotal', width: 16 }
      ];

      payload.detalles.forEach((det) => {
        sheet.addRow({
          articulo: det.nombre_dotacion,
          categoria: det.categoria || '',
          talla: det.talla || 'SIN_TALLA',
          cantidad: det.cantidad_solicitada,
          precio: det.precio_unitario,
          subtotal: det.subtotal
        });
      });

      sheet.addRow({});
      sheet.addRow({ articulo: 'Total pedido', subtotal: payload.pedido.total_pedido });
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(sheet.rowCount).font = { bold: true };

      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Pedido_${payload.pedido.id_pedido}.xlsx`);
      return res.send(buffer);
    } catch (error) {
      console.error('[PedidoController.exportar] Error:', error);
      return res.status(500).json({ success: false, message: 'Error al exportar el pedido', error: error.message });
    }
  }

  static async exportarFaltantes(req, res) {
    try {
      const ciclo = await CicloDotacionModel.getCicloActivo();
      if (!ciclo) {
        return res.status(400).json({ success: false, message: 'No existe un ciclo activo para evaluar faltantes.' });
      }

      const faltantes = await query(`
        SELECT DISTINCT
          ec.id_empleado,
          CONCAT(e.nombre, ' ', e.apellido) AS empleado,
          d.id_dotacion,
          d.nombre_dotacion AS dotacion,
          a.nombre_area AS area
        FROM empleado_ciclo ec
        INNER JOIN empleado e ON e.id_empleado = ec.id_empleado
        LEFT JOIN area a ON a.id_area = ec.id_area
        LEFT JOIN kitdotacion k_area ON k_area.id_area = ec.id_area AND k_area.activo = 1
        INNER JOIN detallekitdotacion dk ON dk.id_kit = COALESCE(ec.id_kit, k_area.id_kit)
        INNER JOIN dotacion d ON d.id_dotacion = dk.id_dotacion
        LEFT JOIN empleado_talla_dotacion etd ON etd.id_empleado = ec.id_empleado AND etd.id_dotacion = dk.id_dotacion
        WHERE ec.id_ciclo = ?
          AND ec.estado = 'procesado'
          AND d.talla_requerida = 1
          AND (etd.id_talla IS NULL OR etd.id_talla = 0)
        ORDER BY empleado, dotacion
      `, [ciclo.id_ciclo]);

      if (!faltantes.length) {
        return res.status(204).send();
      }

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Faltantes tallas');

      sheet.addRow([`Ciclo: ${ciclo.nombre_ciclo || ciclo.id_ciclo}`]);
      sheet.addRow([`Fecha generación: ${new Date().toLocaleString('es-CO')}`]);
      sheet.addRow([]);

      sheet.columns = [
        { header: 'Empleado', key: 'empleado', width: 32 },
        { header: 'Área', key: 'area', width: 20 },
        { header: 'Artículo', key: 'dotacion', width: 28 }
      ];

      faltantes.forEach((row) => {
        sheet.addRow({
          empleado: row.empleado,
          area: row.area || '—',
          dotacion: row.dotacion
        });
      });

      sheet.getRow(4).font = { bold: true }; // header row after metadata

      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Faltantes_tallas_ciclo_${ciclo.id_ciclo}.xlsx`);
      return res.send(buffer);
    } catch (error) {
      console.error('[PedidoController.exportarFaltantes] Error:', error);
      return res.status(500).json({ success: false, message: 'Error al exportar faltantes de talla', error: error.message });
    }
  }

  static async fetchPedidoDetalle(id_pedido) {
    if (!id_pedido) {
      return { pedido: null, detalles: [] };
    }
    const pedidoRows = await query(`
      SELECT p.*, cd.nombre_ciclo
      FROM PedidoCompras p
      LEFT JOIN ciclo_dotacion cd ON cd.id_ciclo = p.id_ciclo
      WHERE p.id_pedido = ?
      LIMIT 1
    `, [id_pedido]);

    if (!pedidoRows.length) {
      return { pedido: null, detalles: [] };
    }

    const pedido = pedidoRows[0];
    const detalles = await query(`
      SELECT dp.id_detalle, dp.id_dotacion, dp.id_talla, dp.cantidad_solicitada, dp.cantidad_recibida,
             dp.precio_unitario, dp.subtotal,
             d.nombre_dotacion,
             cat.nombre_categoria AS categoria,
             t.talla,
             t.tipo_articulo
      FROM DetallePedidoCompras dp
      LEFT JOIN dotacion d ON d.id_dotacion = dp.id_dotacion
      LEFT JOIN categoriadotacion cat ON cat.id_categoria = d.id_categoria
      LEFT JOIN talla t ON t.id_talla = dp.id_talla
      WHERE dp.id_pedido = ?
      ORDER BY d.nombre_dotacion, t.talla
    `, [id_pedido]);

    return {
      pedido,
      detalles: detalles.map(det => ({
        ...det,
        talla: det.talla || 'SIN_TALLA'
      }))
    };
  }
}

module.exports = PedidoController;
