const ExcelJS = require('exceljs');
const { query, getConnection } = require('../config/database');
const CicloDotacionModel = require('../models/CicloDotacionModel');

const buildError = (code, message, meta = {}) => {
  const err = new Error(message);
  err.code = code;
  err.meta = meta;
  return err;
};

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
