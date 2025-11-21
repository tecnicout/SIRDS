const { query } = require('../config/database');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const HEADER_LABELS = {
    id_dotacion: 'ID Dotación',
    nombre_dotacion: 'Nombre Dotación',
    nombre_categoria: 'Categoría',
    precio_unitario: 'Precio Unitario',
    talla_requerida: 'Talla',
    id_entrega: 'ID Entrega',
    id_empleado: 'ID Empleado',
    identificacion: 'Identificación',
    tipo_identificacion: 'Tipo Identificación',
    nombre_completo: 'Nombre Completo',
    nombre: 'Nombre',
    apellido: 'Apellido',
    fecha_nacimiento: 'Fecha de Nacimiento',
    email: 'Email',
    cargo: 'Cargo',
    genero: 'Género',
    area: 'Área',
    area_ciclo: 'Área Ciclo',
    area_actual: 'Área Actual',
    ubicacion: 'Ubicación',
    tipo_ubicacion: 'Tipo Ubicación',
    fecha_inicio: 'Fecha Inicio',
    fecha_fin: 'Fecha Fin',
    fecha_inicio_ventana: 'Inicio Ventana',
    fecha_fin_ventana: 'Fin Ventana',
    sueldo: 'Sueldo',
    fecha: 'Fecha',
    cantidad: 'Cantidad',
    id_ciclo: 'ID Ciclo',
    nombre_ciclo: 'Nombre Ciclo',
    estado_ciclo: 'Estado Ciclo',
    fecha_entrega: 'Fecha de Entrega',
    fecha_entrega_programada: 'Fecha Entrega Programada',
    estado: 'Estado',
    estado_entrega: 'Estado Entrega',
    fecha_asignacion: 'Fecha de Asignación',
    fecha_entrega_real: 'Fecha de Entrega Real',
    valor_smlv_aplicado: 'Valor SMLV Aplicado',
    total_empleados_elegibles: 'Empleados Elegibles',
    stock_actual: 'Stock Actual',
    empleado: 'Empleado',
    nombre_area: 'Área',
    id_proveedor: 'ID Proveedor',
    nombre: 'Proveedor',
    email: 'Email',
    telefono: 'Teléfono',
    activo: 'Estado',
    modelos_asociados: 'Modelos Asociados',
    kit_asignado: 'Kit Asignado',
    antiguedad_meses: 'Antigüedad (Meses)',
    sueldo_al_momento: 'Sueldo al Momento',
    inclusion_manual: 'Incluido Manual',
    motivo_manual: 'Motivo Inclusión'
};

const prettyLabel = (key = '') => HEADER_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const isCurrencyColumn = (key = '') => /(precio|monto|valor|total|sueldo)/i.test(key);
const formatDateLabel = (date = new Date()) => new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'short',
    timeStyle: 'medium'
}).format(date);
const normalizeEstadoFilter = (estado = '') => {
    if (!estado) return null;
    const clean = String(estado).trim().toLowerCase();
    if (['procesado', 'entregado', 'omitido', 'en_proceso'].includes(clean)) return clean;
    if (clean === 'en proceso') return 'en_proceso';
    return null;
};
const describeFilters = (filters = {}) => {
    const parts = [];
    if (filters.fecha_inicio && filters.fecha_fin) {
        parts.push(`${filters.fecha_inicio} - ${filters.fecha_fin}`);
    } else {
        parts.push('Sin filtros de fecha');
    }
    if (filters.area) parts.push(`Área ${filters.area}`);
    if (filters.estado) parts.push(`Estado ${filters.estado}`);
    if (filters.id_ciclo) parts.push(`Ciclo ${filters.id_ciclo}`);
    return parts.join(' | ');
};

async function buildExcelReport(modulo, rows, filtros = {}) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SIRDS';
    workbook.created = new Date();
    const sheet = workbook.addWorksheet('Reporte', {
        properties: { defaultRowHeight: 22 },
        views: [{ state: 'frozen', ySplit: 13 }],
        pageSetup: { fitToPage: true, fitToWidth: 1, orientation: 'landscape', horizontalCentered: true }
    });

    const keys = Object.keys(rows[0]);
    const columnCount = keys.length;
    const gridWidth = Math.max(columnCount, 6);
    const mainColor = '4A77B0';
    const headerFill = '9ABCE7';
    const infoFill = 'F4F8FF';
    const border = { style: 'thin', color: { argb: 'D5DEEF' } };

    const mergeFullRow = (row) => sheet.mergeCells(row, 1, row, gridWidth);

    mergeFullRow(2);
    const titleCell = sheet.getCell(2, 1);
    titleCell.value = `REPORTE DE ${modulo.toUpperCase()}`;
    titleCell.font = { name: 'Calibri', size: 22, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(2).height = 34;
    sheet.getRow(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: mainColor } };

    mergeFullRow(3);
    const subtitleCell = sheet.getCell(3, 1);
    subtitleCell.value = 'Consolidado corporativo generado automáticamente desde SIRDS.';
    subtitleCell.font = { name: 'Calibri', size: 12, color: { argb: 'FFFFFF' } };
    subtitleCell.alignment = { horizontal: 'center' };
    sheet.getRow(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: mainColor } };

    const currencyKey = keys.find(isCurrencyColumn);
    const subtotal = currencyKey ? rows.reduce((acc, row) => acc + (Number(row[currencyKey]) || 0), 0) : 0;
    const impuesto = subtotal * 0.19;
    const total = subtotal + impuesto;
    const showTotalsBlock = Boolean(currencyKey && modulo !== 'dotaciones' && modulo !== 'empleados');

    const infoRows = [
        { label: 'Fecha de exportación', value: formatDateLabel(new Date()) },
        { label: 'Filtros aplicados', value: describeFilters(filtros) },
        { label: 'Total de registros', value: rows.length }
    ];

    const infoStartRow = 5;
    let infoRowIndex = infoStartRow;
    const valueEndColumn = showTotalsBlock ? Math.max(gridWidth - 3, 4) : gridWidth;
    infoRows.forEach((info) => {
        sheet.mergeCells(infoRowIndex, 1, infoRowIndex, 2);
        sheet.mergeCells(infoRowIndex, 3, infoRowIndex, valueEndColumn);
        const labelCell = sheet.getCell(infoRowIndex, 1);
        labelCell.value = info.label;
        labelCell.font = { bold: true, color: { argb: mainColor } };
        labelCell.alignment = { horizontal: 'left' };
        labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: infoFill } };

        const valueCell = sheet.getCell(infoRowIndex, 3);
        valueCell.value = info.value;
        valueCell.font = { name: 'Calibri', color: { argb: '4A5974' } };
        valueCell.alignment = { horizontal: 'left' };
        valueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: infoFill } };
        infoRowIndex += 1;
    });

    if (showTotalsBlock) {
        const blockStart = valueEndColumn + 1;
        const blockEnd = gridWidth;
        const totals = [
            { label: 'Importe de venta', value: subtotal },
            { label: 'Impuesto sobre las ventas', value: impuesto },
            { label: 'Total estimado', value: total, accent: true }
        ];
        totals.forEach((item, idx) => {
            const rowIndex = infoStartRow + idx;
            const labelEnd = Math.min(blockStart + 1, blockEnd - 1);
            const valueStart = Math.min(labelEnd + 1, blockEnd);
            sheet.mergeCells(rowIndex, blockStart, rowIndex, labelEnd);
            sheet.mergeCells(rowIndex, valueStart, rowIndex, blockEnd);

            const labelCell = sheet.getCell(rowIndex, blockStart);
            labelCell.value = item.label;
            labelCell.font = { bold: true, color: { argb: mainColor } };
            labelCell.alignment = { horizontal: 'left' };
            labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: infoFill } };

            const valueCell = sheet.getCell(rowIndex, valueStart);
            valueCell.value = item.value;
            valueCell.numFmt = '$ #,##0.00';
            valueCell.font = { bold: true, color: { argb: item.accent ? mainColor : '4A5974' } };
            valueCell.alignment = { horizontal: 'right' };
            valueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: infoFill } };
        });
    }

    sheet.getRow(infoRowIndex + 1).height = 8;
    sheet.columns = keys.map((key) => ({ key, width: Math.min(Math.max(prettyLabel(key).length + 6, 14), 44) }));

    const headerStart = infoRowIndex + 2;
    const headerRow = sheet.getRow(headerStart);
    headerRow.height = 28;
    keys.forEach((key, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.value = prettyLabel(key).toUpperCase();
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: headerFill }
        };
        cell.border = { top: border, left: border, bottom: border, right: border };
    });
    sheet.autoFilter = {
        from: { row: headerStart, column: 1 },
        to: { row: headerStart, column: columnCount }
    };

    sheet.getRow(headerStart + 1).height = 6;

    rows.forEach((rowObj, idx) => {
        const row = sheet.addRow(rowObj);
        const isEven = idx % 2 === 0;
        row.eachCell((cell, colIndex) => {
            cell.border = { top: border, left: border, bottom: border, right: border };
            cell.alignment = { vertical: 'middle', horizontal: colIndex === columnCount ? 'right' : 'left', wrapText: true };
            if (isEven) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EEF3FB' } };
            }
            if (isCurrencyColumn(keys[colIndex - 1])) {
                cell.numFmt = '$ #,##0.00';
            }
        });
    });

    sheet.addRow([]);
    const summaryRow = sheet.addRow({});
    const mergeEnd = Math.max(1, columnCount - 1);
    if (mergeEnd > 1) {
        sheet.mergeCells(summaryRow.number, 1, summaryRow.number, mergeEnd);
    }
    summaryRow.getCell(1).value = 'Total de registros incluidos';
    summaryRow.getCell(1).font = { bold: true, color: { argb: mainColor } };
    summaryRow.getCell(columnCount).value = rows.length;
    summaryRow.getCell(columnCount).font = { bold: true };
    summaryRow.eachCell((cell) => {
        cell.border = { top: border, left: border, bottom: border, right: border };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8F0FF' } };
    });

    return workbook.xlsx.writeBuffer();
}

class ReportesController {
    static async ensureHistorialTable() {
        await query(`CREATE TABLE IF NOT EXISTS reportes_historial (
            id_reporte INT AUTO_INCREMENT PRIMARY KEY,
            modulo VARCHAR(50) NOT NULL,
            tipo VARCHAR(30) NOT NULL,
            filtros JSON NULL,
            formato VARCHAR(10) NOT NULL,
            filas INT NOT NULL DEFAULT 0,
            usuario VARCHAR(100) NULL,
            fecha_generacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
    }

    // KPIs generales del módulo de reportes (ajustado a ciclos, prendas, proveedores)
    static async getKpis(req, res) {
        try {
            const sqls = {
                dotaciones: 'SELECT COUNT(*) AS c FROM dotacion',
                entregas: `SELECT COUNT(*) AS c FROM (
                    SELECT ed.id_empleado, DATE(ed.fecha_entrega) AS f
                    FROM entregadotacion ed GROUP BY ed.id_empleado, DATE(ed.fecha_entrega)
                ) t`,
                ciclos: 'SELECT COUNT(*) AS c FROM ciclo_dotacion',
                prendas: 'SELECT COUNT(*) AS c FROM stockdotacion WHERE cantidad > 0',
                proveedores: 'SELECT COUNT(*) AS c FROM proveedor WHERE activo = 1',
                empleados: 'SELECT COUNT(*) AS c FROM empleado'
            };
            const [dotaciones] = await query(sqls.dotaciones);
            const [entregas] = await query(sqls.entregas);
            const [ciclos] = await query(sqls.ciclos);
            const [prendas] = await query(sqls.prendas);
            const [proveedores] = await query(sqls.proveedores);
            const [empleados] = await query(sqls.empleados);
            return res.json({
                success: true,
                data: {
                    total_dotaciones: dotaciones.c || 0,
                    total_entregas: entregas.c || 0,
                    total_ciclos: ciclos.c || 0,
                    total_prendas_stock: prendas.c || 0,
                    total_proveedores_activos: proveedores.c || 0,
                    total_empleados: empleados.c || 0
                },
                message: 'KPIs de reportes obtenidos'
            });
        } catch (error) {
            console.error('[ReportesController.getKpis] error:', error);
            return res.status(500).json({ success: false, message: 'Error al obtener KPIs', error: error.message });
        }
    }

    // Resumen por módulo (actualizado con ciclos, prendas, proveedores)
    static async getResumen(req, res) {
        try {
            const { modulo = 'dotaciones', fecha_inicio, fecha_fin } = req.query || {};
            let data = [];
            if (modulo === 'dotaciones') {
                data = await query(`SELECT c.nombre_categoria, COUNT(d.id_dotacion) AS total_items, SUM(IFNULL(s.cantidad,0)) AS stock_total
                                    FROM categoriadotacion c
                                    LEFT JOIN dotacion d ON d.id_categoria = c.id_categoria
                                    LEFT JOIN stockdotacion s ON s.id_dotacion = d.id_dotacion
                                    GROUP BY c.id_categoria, c.nombre_categoria
                                    ORDER BY c.nombre_categoria`);
            } else if (modulo === 'entregas') {
                const cond = []; const params = [];
                if (fecha_inicio && fecha_fin) { cond.push('ed.fecha_entrega BETWEEN ? AND ?'); params.push(fecha_inicio, fecha_fin); }
                const where = cond.length ? 'WHERE ' + cond.join(' AND ') : '';
                data = await query(`SELECT DATE_FORMAT(ed.fecha_entrega,'%Y-%m') AS mes, COUNT(*) AS total_registros, COUNT(DISTINCT ed.id_empleado) AS empleados_involucrados
                                    FROM entregadotacion ed ${where}
                                    GROUP BY DATE_FORMAT(ed.fecha_entrega,'%Y-%m') ORDER BY mes DESC LIMIT 12`, params);
            } else if (modulo === 'ciclos') {
                data = await query(`SELECT estado, COUNT(*) AS total_ciclos, SUM(IFNULL(valor_smlv_aplicado,0)) AS suma_smlv
                                    FROM ciclo_dotacion GROUP BY estado ORDER BY total_ciclos DESC`);
            } else if (modulo === 'prendas') {
                data = await query(`SELECT c.nombre_categoria, COUNT(d.id_dotacion) AS total_modelos,
                                    SUM(IFNULL(s.cantidad,0)) AS unidades_stock
                                    FROM categoriadotacion c
                                    LEFT JOIN dotacion d ON d.id_categoria = c.id_categoria
                                    LEFT JOIN stockdotacion s ON s.id_dotacion = d.id_dotacion
                                    GROUP BY c.id_categoria, c.nombre_categoria
                                    ORDER BY unidades_stock DESC`);
            } else if (modulo === 'stock') {
                // Resumen de stock por categoría (alias de prendas)
                data = await query(`SELECT c.nombre_categoria, COUNT(d.id_dotacion) AS total_modelos,
                                    SUM(IFNULL(s.cantidad,0)) AS unidades_stock
                                    FROM categoriadotacion c
                                    LEFT JOIN dotacion d ON d.id_categoria = c.id_categoria
                                    LEFT JOIN stockdotacion s ON s.id_dotacion = d.id_dotacion
                                    GROUP BY c.id_categoria, c.nombre_categoria
                                    ORDER BY unidades_stock DESC`);
            } else if (modulo === 'empleados') {
                data = await query(`SELECT a.nombre_area, COUNT(*) AS total_empleados
                                    FROM empleado e INNER JOIN area a ON e.id_area = a.id_area
                                    GROUP BY a.id_area, a.nombre_area
                                    ORDER BY total_empleados DESC`);
            } else if (modulo === 'proveedores') {
                data = await query(`SELECT CASE WHEN p.activo=1 THEN 'Activo' ELSE 'Inactivo' END AS estado, COUNT(*) AS total_proveedores
                                    FROM proveedor p GROUP BY estado ORDER BY total_proveedores DESC`);
            } else {
                return res.status(400).json({ success: false, message: 'Módulo no soportado' });
            }
            return res.json({ success: true, data, message: 'Resumen generado' });
        } catch (error) {
            console.error('[ReportesController.getResumen] error:', error);
            return res.status(500).json({ success: false, message: 'Error al generar resumen', error: error.message });
        }
    }

    // Detalle con filas (paginado básico) actualizado
    static async getDetalle(req, res) {
        try {
            const { modulo = 'dotaciones', page = 1, limit = 20, fecha_inicio, fecha_fin, area, estado, id_ciclo } = req.query || {};
            const pageNum = Math.max(parseInt(page, 10) || 1, 1);
            const limitNum = Math.max(parseInt(limit, 10) || 20, 1);
            const offset = (pageNum - 1) * limitNum;
            const safeLimit = Math.min(Math.max(Number.isFinite(limitNum) ? limitNum : 20, 1), 1000);
            const safeOffset = Math.max(Number.isFinite(offset) ? offset : 0, 0);
            const limitClause = ` LIMIT ${safeLimit} OFFSET ${safeOffset}`;
            let rows = []; let total = 0;

            if (modulo === 'dotaciones') {
                rows = await query(`SELECT d.id_dotacion, d.nombre_dotacion, c.nombre_categoria, d.precio_unitario, d.talla_requerida
                                    FROM dotacion d INNER JOIN categoriadotacion c ON d.id_categoria = c.id_categoria
                                    ORDER BY d.nombre_dotacion${limitClause}`);
                const [{ c }] = await query('SELECT COUNT(*) AS c FROM dotacion'); total = c;
            } else if (modulo === 'entregas') {
                const cond = []; const params = [];
                if (fecha_inicio && fecha_fin) { cond.push('ed.fecha_entrega BETWEEN ? AND ?'); params.push(fecha_inicio, fecha_fin); }
                const where = cond.length ? 'WHERE ' + cond.join(' AND ') : '';
                rows = await query(`SELECT ed.id_entrega, ed.id_empleado, DATE(ed.fecha_entrega) AS fecha, ed.cantidad, d.nombre_dotacion
                                     FROM entregadotacion ed INNER JOIN dotacion d ON ed.id_dotacion = d.id_dotacion
                                     ${where} ORDER BY ed.fecha_entrega DESC${limitClause}`, params);
                const [{ c }] = await query(`SELECT COUNT(*) AS c FROM entregadotacion ed ${where}`, params); total = c;
            } else if (modulo === 'ciclos') {
                const conditions = ['1=1'];
                const params = [];
                if (fecha_inicio && fecha_fin) {
                    conditions.push('cd.fecha_entrega BETWEEN ? AND ?');
                    params.push(fecha_inicio, fecha_fin);
                }
                const cicloId = (id_ciclo ?? '') !== '' ? Number(id_ciclo) : null;
                if (Number.isFinite(cicloId)) {
                    conditions.push('cd.id_ciclo = ?');
                    params.push(cicloId);
                }
                const areaId = (area ?? '') !== '' ? Number(area) : null;
                if (Number.isFinite(areaId)) {
                    conditions.push('ec.id_area = ?');
                    params.push(areaId);
                }
                const normalizedEstado = normalizeEstadoFilter(estado);
                if (normalizedEstado) {
                    conditions.push('ec.estado = ?');
                    params.push(normalizedEstado);
                }
                const whereSql = `WHERE ${conditions.join(' AND ')}`;
                const orderSql = ' ORDER BY cd.fecha_entrega DESC, area_ciclo.nombre_area ASC, nombre_completo ASC';
                const baseSelect = `
                    SELECT
                        cd.id_ciclo,
                        cd.nombre_ciclo,
                        cd.estado AS estado_ciclo,
                        cd.fecha_entrega AS fecha_entrega_programada,
                        cd.fecha_inicio_ventana,
                        cd.fecha_fin_ventana,
                        cd.valor_smlv_aplicado,
                        cd.total_empleados_elegibles,
                        ec.id_empleado,
                        e.Identificacion AS identificacion,
                        CONCAT(e.nombre, ' ', e.apellido) AS nombre_completo,
                        e.cargo,
                        area_ciclo.nombre_area AS area_ciclo,
                        area_actual.nombre_area AS area_actual,
                        u.nombre AS ubicacion,
                        CASE
                            WHEN k.nombre IS NOT NULL THEN k.nombre
                            WHEN area_ciclo.nombre_area IS NOT NULL THEN CONCAT('Kit ', area_ciclo.nombre_area)
                            ELSE 'Sin kit asignado'
                        END AS kit_asignado,
                        CASE
                            WHEN ec.estado = 'entregado' THEN 'Entregado'
                            WHEN ec.estado = 'en_proceso' THEN 'En proceso'
                            WHEN ec.estado = 'omitido' THEN 'Omitido'
                            ELSE 'Procesado'
                        END AS estado_entrega,
                        ec.fecha_asignacion,
                        ec.fecha_entrega_real,
                        ec.antiguedad_meses,
                        ec.sueldo_al_momento,
                        CASE WHEN ec.inclusion_manual = 1 THEN 'Si' ELSE 'No' END AS inclusion_manual,
                        ec.motivo_manual,
                        ec.observaciones
                    FROM empleado_ciclo ec
                    INNER JOIN ciclo_dotacion cd ON ec.id_ciclo = cd.id_ciclo
                    INNER JOIN empleado e ON ec.id_empleado = e.id_empleado
                    LEFT JOIN area area_ciclo ON ec.id_area = area_ciclo.id_area
                    LEFT JOIN area area_actual ON e.id_area = area_actual.id_area
                    LEFT JOIN ubicacion u ON e.id_ubicacion = u.id_ubicacion
                    LEFT JOIN kitdotacion k ON ec.id_kit = k.id_kit
                `;
                const countParams = [...params];
                rows = await query(`${baseSelect} ${whereSql}${orderSql}${limitClause}`, params);
                const countSql = `
                    SELECT COUNT(*) AS c
                    FROM empleado_ciclo ec
                    INNER JOIN ciclo_dotacion cd ON ec.id_ciclo = cd.id_ciclo
                    ${whereSql}
                `;
                const [{ c }] = await query(countSql, countParams);
                total = c;
            } else if (modulo === 'prendas') {
                rows = await query(`SELECT d.id_dotacion, d.nombre_dotacion, c.nombre_categoria, IFNULL(s.cantidad,0) AS stock_actual, d.precio_unitario
                                    FROM dotacion d INNER JOIN categoriadotacion c ON d.id_categoria = c.id_categoria
                                    LEFT JOIN stockdotacion s ON s.id_dotacion = d.id_dotacion
                                    ORDER BY stock_actual DESC, d.nombre_dotacion${limitClause}`);
                const [{ c }] = await query('SELECT COUNT(*) AS c FROM dotacion'); total = c;
            } else if (modulo === 'stock') {
                rows = await query(`SELECT d.id_dotacion, d.nombre_dotacion, c.nombre_categoria, IFNULL(s.cantidad,0) AS stock_actual, d.precio_unitario
                                    FROM dotacion d INNER JOIN categoriadotacion c ON d.id_categoria = c.id_categoria
                                    LEFT JOIN stockdotacion s ON s.id_dotacion = d.id_dotacion
                                    ORDER BY stock_actual DESC, d.nombre_dotacion${limitClause}`);
                const [{ c }] = await query('SELECT COUNT(*) AS c FROM dotacion'); total = c;
            } else if (modulo === 'empleados') {
                rows = await query(`SELECT e.id_empleado,
                                           e.Identificacion AS identificacion,
                                           e.tipo_identificacion,
                                           e.nombre,
                                           e.apellido,
                                           e.fecha_nacimiento,
                                           e.email,
                                           e.cargo,
                                           g.nombre AS genero,
                                           a.nombre_area AS area,
                                           u.nombre AS ubicacion,
                                           u.tipo AS tipo_ubicacion,
                                           e.fecha_inicio,
                                           e.fecha_fin,
                                           e.sueldo
                                    FROM empleado e
                                    LEFT JOIN area a ON e.id_area = a.id_area
                                    LEFT JOIN genero g ON e.id_genero = g.id_genero
                                    LEFT JOIN ubicacion u ON e.id_ubicacion = u.id_ubicacion
                                    ORDER BY a.nombre_area, e.nombre${limitClause}`);
                const [{ c }] = await query('SELECT COUNT(*) AS c FROM empleado'); total = c;
            } else if (modulo === 'proveedores') {
                rows = await query(`SELECT p.id_proveedor, p.nombre, p.email, p.telefono, p.activo, COUNT(d.id_dotacion) AS modelos_asociados
                                    FROM proveedor p LEFT JOIN dotacion d ON d.id_proveedor = p.id_proveedor
                                    GROUP BY p.id_proveedor, p.nombre, p.email, p.telefono, p.activo
                                    ORDER BY modelos_asociados DESC, p.nombre${limitClause}`);
                const [{ c }] = await query('SELECT COUNT(*) AS c FROM proveedor'); total = c;
            } else {
                return res.status(400).json({ success: false, message: 'Módulo no soportado' });
            }
            return res.json({ success: true, data: rows, total, page: pageNum, limit: limitNum, message: 'Detalle generado' });
        } catch (error) {
            console.error('[ReportesController.getDetalle] error:', error);
            return res.status(500).json({ success: false, message: 'Error al obtener detalle', error: error.message });
        }
    }

    static async exportar(req, res) {
        try {
            await ReportesController.ensureHistorialTable();
            const filters = req.query || {};
            const { modulo = 'dotaciones', formato = 'csv', fecha_inicio, fecha_fin } = filters;
            const format = (formato || 'csv').toLowerCase();
            if (!['csv', 'excel', 'pdf'].includes(format)) {
                return res.status(400).json({ success: false, message: 'Formato no soportado. Use csv, excel o pdf.' });
            }

            const rows = await ReportesController.obtenerDatosParaExportar(modulo, filters);
            if (!rows.length) {
                return res.status(400).json({ success: false, message: 'No hay datos para exportar con los filtros seleccionados.' });
            }

            try {
                const filtrosHistorial = {
                    fecha_inicio,
                    fecha_fin,
                    area: filters.area || null,
                    estado: filters.estado || null,
                    id_ciclo: filters.id_ciclo || null
                };
                await query(`INSERT INTO reportes_historial (modulo, tipo, filtros, formato, filas, usuario)
                             VALUES (?, 'export', ?, ?, ?, ?)`,
                    [modulo, JSON.stringify(filtrosHistorial), format, rows.length, (req.user && req.user.email) || 'sistema']);
            } catch (histErr) {
                console.error('[ReportesController.exportar] error historial:', histErr.message);
            }

            if (format === 'csv') {
                const headers = Object.keys(rows[0]);
                const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => {
                    const val = r[h];
                    if (val === null || val === undefined) return '';
                    const s = String(val).replace(/"/g, '""');
                    return /[",\n]/.test(s) ? `"${s}"` : s;
                }).join(','))].join('\n');
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename=${modulo}_reporte.csv`);
                return res.status(200).send(csv);
            }

            if (format === 'excel') {
                const buffer = await buildExcelReport(modulo, rows, filters);
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename=${modulo}_reporte.xlsx`);
                return res.status(200).send(Buffer.from(buffer));
            }

            const doc = new PDFDocument({ margin: 40, size: 'A4' });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${modulo}_reporte.pdf`);
            doc.pipe(res);
            doc.fontSize(16).fillColor('#1F1F1F').text(`Reporte de ${modulo}`, { align: 'center' });
            doc.moveDown();
            doc.fontSize(10).fillColor('#555').text(`Filas exportadas: ${rows.length}`);
            doc.moveDown();
            const headers = Object.keys(rows[0]);
            rows.slice(0, 400).forEach((row, idx) => {
                doc.font('Helvetica-Bold').fillColor('#111').text(`${idx + 1}. ${row[headers[0]] || ''}`);
                headers.forEach((h) => {
                    doc.font('Helvetica').fillColor('#333').text(`${prettyLabel(h)}: ${row[h] ?? ''}`);
                });
                doc.moveDown(0.6);
            });
            doc.end();
        } catch (error) {
            console.error('[ReportesController.exportar] error:', error);
            return res.status(500).json({ success: false, message: 'Error al exportar', error: error.message });
        }
    }

    static async obtenerDatosParaExportar(modulo, filtros = {}) {
        const {
            fecha_inicio,
            fecha_fin,
            area,
            estado,
            id_ciclo
        } = filtros || {};
        if (modulo === 'dotaciones') {
            return query(`SELECT d.id_dotacion, d.nombre_dotacion, c.nombre_categoria, d.precio_unitario
                          FROM dotacion d INNER JOIN categoriadotacion c ON d.id_categoria = c.id_categoria
                          ORDER BY d.nombre_dotacion`);
        }
        if (modulo === 'entregas') {
            const cond = []; const params = [];
            if (fecha_inicio && fecha_fin) {
                cond.push('ed.fecha_entrega BETWEEN ? AND ?');
                params.push(fecha_inicio, fecha_fin);
            }
            const where = cond.length ? 'WHERE ' + cond.join(' AND ') : '';
            return query(`SELECT ed.id_entrega, ed.id_empleado, DATE(ed.fecha_entrega) AS fecha, ed.cantidad, d.nombre_dotacion
                          FROM entregadotacion ed INNER JOIN dotacion d ON ed.id_dotacion = d.id_dotacion
                          ${where} ORDER BY ed.fecha_entrega DESC`, params);
        }
        if (modulo === 'ciclos') {
            const conditions = ['1=1'];
            const params = [];
            if (fecha_inicio && fecha_fin) {
                conditions.push('cd.fecha_entrega BETWEEN ? AND ?');
                params.push(fecha_inicio, fecha_fin);
            }
            const cicloId = (id_ciclo ?? '') !== '' ? Number(id_ciclo) : null;
            if (Number.isFinite(cicloId)) {
                conditions.push('cd.id_ciclo = ?');
                params.push(cicloId);
            }
            const areaId = (area ?? '') !== '' ? Number(area) : null;
            if (Number.isFinite(areaId)) {
                conditions.push('ec.id_area = ?');
                params.push(areaId);
            }
            const normalizedEstado = normalizeEstadoFilter(estado);
            if (normalizedEstado) {
                conditions.push('ec.estado = ?');
                params.push(normalizedEstado);
            }
            const whereSql = `WHERE ${conditions.join(' AND ')}`;
            return query(`
                SELECT
                    cd.id_ciclo,
                    cd.nombre_ciclo,
                    cd.estado AS estado_ciclo,
                    cd.fecha_entrega AS fecha_entrega_programada,
                    cd.fecha_inicio_ventana,
                    cd.fecha_fin_ventana,
                    cd.valor_smlv_aplicado,
                    cd.total_empleados_elegibles,
                    ec.id_empleado,
                    e.Identificacion AS identificacion,
                    CONCAT(e.nombre, ' ', e.apellido) AS nombre_completo,
                    e.cargo,
                    area_ciclo.nombre_area AS area_ciclo,
                    area_actual.nombre_area AS area_actual,
                    u.nombre AS ubicacion,
                    CASE
                        WHEN k.nombre IS NOT NULL THEN k.nombre
                        WHEN area_ciclo.nombre_area IS NOT NULL THEN CONCAT('Kit ', area_ciclo.nombre_area)
                        ELSE 'Sin kit asignado'
                    END AS kit_asignado,
                    CASE
                        WHEN ec.estado = 'entregado' THEN 'Entregado'
                        WHEN ec.estado = 'en_proceso' THEN 'En proceso'
                        WHEN ec.estado = 'omitido' THEN 'Omitido'
                        ELSE 'Procesado'
                    END AS estado_entrega,
                    ec.fecha_asignacion,
                    ec.fecha_entrega_real,
                    ec.antiguedad_meses,
                    ec.sueldo_al_momento,
                    CASE WHEN ec.inclusion_manual = 1 THEN 'Si' ELSE 'No' END AS inclusion_manual,
                    ec.motivo_manual,
                    ec.observaciones
                FROM empleado_ciclo ec
                INNER JOIN ciclo_dotacion cd ON ec.id_ciclo = cd.id_ciclo
                INNER JOIN empleado e ON ec.id_empleado = e.id_empleado
                LEFT JOIN area area_ciclo ON ec.id_area = area_ciclo.id_area
                LEFT JOIN area area_actual ON e.id_area = area_actual.id_area
                LEFT JOIN ubicacion u ON e.id_ubicacion = u.id_ubicacion
                LEFT JOIN kitdotacion k ON ec.id_kit = k.id_kit
                ${whereSql}
                ORDER BY cd.fecha_entrega DESC, area_ciclo.nombre_area ASC, nombre_completo ASC
            `, params);
        }
        if (modulo === 'prendas' || modulo === 'stock') {
            return query(`SELECT d.id_dotacion, d.nombre_dotacion, c.nombre_categoria, IFNULL(s.cantidad,0) AS stock_actual, d.precio_unitario
                          FROM dotacion d INNER JOIN categoriadotacion c ON d.id_categoria = c.id_categoria
                          LEFT JOIN stockdotacion s ON s.id_dotacion = d.id_dotacion
                          ORDER BY stock_actual DESC, d.nombre_dotacion`);
        }
        if (modulo === 'empleados') {
            return query(`SELECT e.id_empleado,
                     e.Identificacion AS identificacion,
                     e.tipo_identificacion,
                     e.nombre,
                     e.apellido,
                     e.fecha_nacimiento,
                     e.email,
                     e.cargo,
                     g.nombre AS genero,
                     a.nombre_area AS area,
                     u.nombre AS ubicacion,
                     u.tipo AS tipo_ubicacion,
                     e.fecha_inicio,
                     e.fecha_fin,
                     e.sueldo
                  FROM empleado e
                  LEFT JOIN area a ON e.id_area = a.id_area
                  LEFT JOIN genero g ON e.id_genero = g.id_genero
                  LEFT JOIN ubicacion u ON e.id_ubicacion = u.id_ubicacion
                  ORDER BY a.nombre_area, e.nombre`);
        }
        if (modulo === 'proveedores') {
            return query(`SELECT p.id_proveedor, p.nombre, p.email, p.telefono, p.activo, COUNT(d.id_dotacion) AS modelos_asociados
                          FROM proveedor p LEFT JOIN dotacion d ON d.id_proveedor = p.id_proveedor
                          GROUP BY p.id_proveedor, p.nombre, p.email, p.telefono, p.activo
                          ORDER BY modelos_asociados DESC, p.nombre`);
        }
        throw new Error('Módulo no soportado');
    }

    static async historial(req, res) {
        try {
            await ReportesController.ensureHistorialTable();
            const rows = await query('SELECT * FROM reportes_historial ORDER BY fecha_generacion DESC LIMIT 50');
            return res.json({ success: true, data: rows, message: 'Historial de reportes' });
        } catch (error) {
            console.error('[ReportesController.historial] error:', error);
            return res.status(500).json({ success: false, message: 'Error al obtener historial', error: error.message });
        }
    }
}

module.exports = ReportesController;
