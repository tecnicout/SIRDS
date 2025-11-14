const CicloDotacionModel = require('../models/CicloDotacionModel');
const EmpleadoCicloModel = require('../models/EmpleadoCicloModel');
const SalarioMinimoModel = require('../models/SalarioMinimoModel');
const { query } = require('../config/database');

const recalcularTotalEmpleados = async (id_ciclo) => {
  const rows = await query(
    'SELECT COUNT(*) as total FROM empleado_ciclo WHERE id_ciclo = ?',
    [id_ciclo]
  );
  const total = Array.isArray(rows) && rows[0] ? Number(rows[0].total) : 0;
  await CicloDotacionModel.updateTotalEmpleados(id_ciclo, total);
  return total;
};

class CiclosController {
  /**
   * Listar todos los ciclos con paginación
   */
  static async listarCiclos(req, res) {
    try {
      const { page = 1, limit = 10, estado, anio } = req.query;
      
      const filters = {};
      if (estado) filters.estado = estado;
      if (anio) filters.anio = anio;

      const result = await CicloDotacionModel.getAll(
        parseInt(page),
        parseInt(limit),
        filters
      );

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Error al listar ciclos:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Obtener detalle de un ciclo específico
   */
  static async obtenerCiclo(req, res) {
    try {
      const { id } = req.params;
      const ciclo = await CicloDotacionModel.getById(id);

      if (!ciclo) {
        return res.status(404).json({
          success: false,
          message: 'Ciclo no encontrado'
        });
      }

      res.json({
        success: true,
        data: ciclo
      });
    } catch (error) {
      console.error('Error al obtener ciclo:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Crear un nuevo ciclo de dotación
   */
  static async crearCiclo(req, res) {
    try {
      const {
        nombre_ciclo,
        fecha_entrega,
        id_area_produccion = 1, // Compatibilidad, ya no limita elegibles
        id_area_mercadista = 22, // Compatibilidad, ya no limita elegibles
        observaciones
      } = req.body;

      const id_usuario = req.usuario.id_usuario;

      // Validar fecha de entrega
      if (!fecha_entrega) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de entrega es requerida'
        });
      }

  // Calcular ventana de ejecución (2 meses antes)
      const fechaEntrega = new Date(fecha_entrega);
      const fechaInicioVentana = new Date(fechaEntrega);
  fechaInicioVentana.setMonth(fechaInicioVentana.getMonth() - 2);

      // Validar que estemos dentro de la ventana
      const validacion = await CicloDotacionModel.validarVentana(fecha_entrega);
      if (!validacion.puede_crear) {
        return res.status(400).json({
          success: false,
          message: 'No se puede crear el ciclo fuera de la ventana de ejecución',
          ventana: validacion
        });
      }

      // Obtener SMLV del año de entrega
      const anioEntrega = fechaEntrega.getFullYear();
      const smlv = await SalarioMinimoModel.getByYear(anioEntrega);
      
      if (!smlv) {
        return res.status(400).json({
          success: false,
          message: `No hay salario mínimo registrado para el año ${anioEntrega}`
        });
      }

      // Calcular empleados elegibles (GLOBAL): antigüedad >= 3 meses y sueldo <= 2 SMLV
      const smlvValor = parseFloat(smlv.valor_mensual);
      const empleadosElegibles = await EmpleadoCicloModel.calcularElegiblesGlobal(smlvValor);

      // Si hay elegibles en preview pero llegan 0 aquí, log comparativo
      try {
        console.log('[crearCiclo] Preview/Elegibles count esperado (global) =', empleadosElegibles.length);
        if (empleadosElegibles.length > 0) {
          console.log('[crearCiclo] Muestra primeros 3 elegibles =>', empleadosElegibles.slice(0,3).map(e => ({ id:e.id_empleado, sueldo:e.sueldo, antig:e.antiguedad_meses })));
        }
      } catch(_) {}

      if (empleadosElegibles.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No hay empleados elegibles para este ciclo',
          criterios: {
            antiguedad_minima: '3 meses',
            tope_salarial_max: `$${smlv.valor_mensual * 2}`
          }
        });
      }

      // Crear el ciclo (ya se marca 'activo' en el modelo)
      const ciclo = await CicloDotacionModel.create({
        nombre_ciclo,
        fecha_entrega,
        fecha_inicio_ventana: fechaInicioVentana.toISOString().split('T')[0],
        fecha_fin_ventana: fecha_entrega,
        id_area_produccion,
        id_area_mercadista,
        valor_smlv_aplicado: smlv.valor_mensual,
        creado_por: id_usuario,
        observaciones
      });

      // Insertar elegibles en una sola sentencia (más robusto frente a errores de loop)
      const resultadoBatch = await EmpleadoCicloModel.insertElegiblesGlobalBatch(
        ciclo.id_ciclo,
        smlvValor
      );

      // Debug mínimo para detectar por qué podría venir 0 insertados
      try {
        console.log('[crearCiclo] elegibles calculados =', empleadosElegibles.length);
        const { insertados, errores, detalles } = resultadoBatch || {};
        console.log('[crearCiclo] insertados =', insertados, 'errores =', errores);
        if (detalles && Array.isArray(detalles.errores) && detalles.errores.length) {
          console.log('[crearCiclo] ejemplo error 1:', detalles.errores[0]);
        }
      } catch (_) {}

      // Actualizar total de empleados elegibles en el ciclo
  // número efectivo insertado (puede ser menor si faltan kits, pero seguimos mostrando los elegibles reales)
  await CicloDotacionModel.updateTotalEmpleados(ciclo.id_ciclo, resultadoBatch.insertados);

      // Backfill defensivo: si por alguna razón quedaron registros sin id_kit, asignarlo por área
      try {
        const corregidos = await EmpleadoCicloModel.backfillKitsPorArea(ciclo.id_ciclo);
        if (corregidos > 0) {
          console.log('[crearCiclo] Backfill id_kit aplicado para', corregidos, 'registros');
        }
      } catch (_) {}

      res.status(201).json({
        success: true,
        message: 'Ciclo creado y activado exitosamente',
        data: {
          id_ciclo: ciclo.id_ciclo,
          nombre_ciclo,
          fecha_entrega,
          estado: 'activo',
          total_empleados: resultadoBatch.insertados,
          smlv_aplicado: smlvValor,
          empleados_asignados: resultadoBatch.insertados,
          total_elegibles: empleadosElegibles.length,
          elegibles_detectados: empleadosElegibles.length,
          elegibles_insertados: resultadoBatch.insertados,
          diferencia_elegibles: empleadosElegibles.length - resultadoBatch.insertados
        },
        empleados: resultadoBatch
      });
    } catch (error) {
      console.error('Error al crear ciclo:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Obtener empleados de un ciclo
   */
  static async obtenerEmpleadosCiclo(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20, estado, area } = req.query;

      const filters = {};
      if (estado) filters.estado = estado;
      if (area) filters.area = area;

      const result = await EmpleadoCicloModel.getByCiclo(
        id,
        parseInt(page),
        parseInt(limit),
        filters
      );

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Error al obtener empleados del ciclo:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Buscar candidatos disponibles para agregar manualmente a un ciclo
   */
  static async buscarCandidatosCiclo(req, res) {
    try {
      const { id } = req.params;
      const { q = '', limit = 10 } = req.query;

      const ciclo = await CicloDotacionModel.getById(id);
      if (!ciclo) {
        return res.status(404).json({ success: false, message: 'Ciclo no encontrado' });
      }

      let smlvValor = Number.parseFloat(ciclo.valor_smlv_aplicado);
      if (!Number.isFinite(smlvValor) && ciclo.fecha_entrega) {
        const year = new Date(ciclo.fecha_entrega).getFullYear();
        const smlv = await SalarioMinimoModel.getByYear(year);
        if (smlv) {
          smlvValor = Number.parseFloat(smlv.valor_mensual);
        }
      }

      const candidatos = await EmpleadoCicloModel.buscarCandidatosDisponibles(
        Number(id),
        q,
        limit,
        Number.isFinite(smlvValor) ? smlvValor : null
      );

      res.json({
        success: true,
        data: candidatos,
        meta: {
          ciclo: { id_ciclo: Number(id), estado: ciclo.estado },
          total: candidatos.length
        }
      });
    } catch (error) {
      console.error('Error al buscar candidatos del ciclo:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Agregar un empleado manualmente al ciclo activo
   */
  static async agregarEmpleadoManual(req, res) {
    try {
      const { id } = req.params;
      const { id_empleado, motivo_manual, id_kit } = req.body || {};

      if (!id_empleado) {
        return res.status(400).json({ success: false, message: 'El id_empleado es requerido' });
      }

      if (!motivo_manual || !motivo_manual.trim()) {
        return res.status(400).json({ success: false, message: 'Debes especificar el motivo manual' });
      }

      const ciclo = await CicloDotacionModel.getById(id);
      if (!ciclo) {
        return res.status(404).json({ success: false, message: 'Ciclo no encontrado' });
      }

      if (ciclo.estado === 'cerrado') {
        return res.status(400).json({ success: false, message: 'No se pueden agregar empleados a un ciclo cerrado' });
      }

      const contextoUsuario = req.usuario || req.user;
      if (!contextoUsuario || !contextoUsuario.id_usuario) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
      }

      const result = await EmpleadoCicloModel.insertManual({
        id_ciclo: Number(id),
        id_empleado,
        motivo_manual: motivo_manual.trim().slice(0, 255),
        id_usuario: contextoUsuario.id_usuario,
        id_kit: id_kit || null
      });

      const total = await recalcularTotalEmpleados(Number(id));

      res.status(201).json({
        success: true,
        message: 'Empleado agregado manualmente al ciclo',
        data: {
          id_empleado_ciclo: result.id_empleado_ciclo,
          id_ciclo: Number(id),
          total_empleados: total
        }
      });
    } catch (error) {
      console.error('Error al agregar empleado manual:', error);
      const mensaje = error.message || 'Error al agregar empleado manual';
      const status = /asociado a este ciclo|inactivo|no encontrado/i.test(mensaje) ? 400 : 500;
      res.status(status).json({ success: false, message: mensaje });
    }
  }

  /**
   * Eliminar (excluir) un empleado del ciclo mientras siga en estado procesado
   */
  static async eliminarEmpleadoManual(req, res) {
    try {
      const { id_empleado_ciclo } = req.params;
      if (!id_empleado_ciclo) {
        return res.status(400).json({ success: false, message: 'ID del empleado_ciclo requerido' });
      }

      const result = await EmpleadoCicloModel.delete(id_empleado_ciclo);
      const total = await recalcularTotalEmpleados(result.id_ciclo);

      res.json({
        success: true,
        message: 'Empleado eliminado del ciclo',
        data: {
          id_empleado_ciclo: Number(id_empleado_ciclo),
          id_ciclo: result.id_ciclo,
          total_empleados: total
        }
      });
    } catch (error) {
      console.error('Error al eliminar empleado del ciclo:', error);
      const mensaje = error.message || 'Error al eliminar empleado';
      const status = /Solo se pueden eliminar empleados en estado "procesado"|Empleado no encontrado/i.test(mensaje) ? 400 : 500;
      res.status(status).json({ success: false, message: mensaje });
    }
  }

  /**
   * Actualizar estado de un empleado en el ciclo
   */
  static async actualizarEstadoEmpleado(req, res) {
    try {
      const { id_empleado_ciclo } = req.params;
      const { estado, observaciones } = req.body;
      const id_usuario = req.usuario.id_usuario;

      // Validar estado
      const estadosValidos = ['procesado', 'entregado', 'omitido'];
      if (!estadosValidos.includes(estado)) {
        return res.status(400).json({
          success: false,
          message: `Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}`
        });
      }

      await EmpleadoCicloModel.updateEstado(
        id_empleado_ciclo,
        estado,
        id_usuario,
        observaciones
      );

      res.json({
        success: true,
        message: 'Estado actualizado correctamente'
      });
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Calcular preview de empleados elegibles (sin crear el ciclo)
   */
  static async previewEmpleadosElegibles(req, res) {
    try {
      const {
        fecha_entrega,
        id_area_produccion = 1,
        id_area_mercadista = 22
      } = req.query;

      if (!fecha_entrega) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de entrega es requerida'
        });
      }

      // Obtener SMLV del año
      const anio = new Date(fecha_entrega).getFullYear();
      const smlv = await SalarioMinimoModel.getByYear(anio);

      if (!smlv) {
        return res.status(400).json({
          success: false,
          message: `No hay salario mínimo registrado para el año ${anio}`
        });
      }

      // Validar ventana
      const validacion = await CicloDotacionModel.validarVentana(fecha_entrega);

      // Calcular lista completa de candidatos y clasificar sin romper compatibilidad
      const smlvValor = parseFloat(smlv.valor_mensual);
      // Consultar elegibles directamente en SQL para evitar inconsistencias
  const empleados = await EmpleadoCicloModel.calcularElegiblesGlobal(smlvValor);

      // Calcular candidatos con sueldo > 2 SMLV (para mostrar como no elegibles por tope)
      const noElegiblesRows = await query(
        `SELECT e.id_empleado, e.nombre, e.apellido, e.sueldo, a.nombre_area,
                TIMESTAMPDIFF(MONTH, e.fecha_inicio, CURDATE()) as antiguedad_meses
         FROM empleado e
         INNER JOIN area a ON e.id_area = a.id_area
         WHERE e.sueldo > (? * 2)
         ORDER BY a.nombre_area, e.apellido, e.nombre`,
        [smlvValor]
      );
      const noElegibles = Array.isArray(noElegiblesRows)
        ? noElegiblesRows.map(r => ({
            ...r,
            motivo: 'sueldo > 2 SMLV'
          }))
        : [];

      // Total candidatos (todos activos con sueldo > 0) para referencia
  const totalActivosRows = await query('SELECT COUNT(*) as total FROM empleado WHERE sueldo > 0');
  const totalActivos = Array.isArray(totalActivosRows) && totalActivosRows[0] ? Number(totalActivosRows[0].total) : 0;

      // Agrupar por área (objeto y arreglo compatible con el frontend)
      const porArea = empleados.reduce((acc, emp) => {
        if (!acc[emp.nombre_area]) acc[emp.nombre_area] = [];
        acc[emp.nombre_area].push(emp);
        return acc;
      }, {});
      const empleadosPorArea = Object.keys(porArea).map(nombre => ({
        nombre_area: nombre,
        total: porArea[nombre].length,
        id_area: porArea[nombre][0] ? porArea[nombre][0].id_area : null
      }));

      // Log mínimo para diagnosticar in situ
      try {
        console.log('[previewEmpleadosElegibles] totalActivos=', totalActivos, 'elegibles=', empleados.length, 'noElegiblesAltos=', noElegibles.length, 'smlv=', smlvValor);
      } catch (_) {}

      res.json({
        success: true,
        data: {
          total_activos: totalActivos,
          total_elegibles: empleados.length,
          total_no_elegibles: noElegibles.length,
          smlv_aplicado: smlv.valor_mensual,
          smlv_aplicable: smlvValor, // compatibilidad con frontend
          rango_salarial: {
            minimo: smlvValor,
            maximo: smlvValor * 2
          },
          ventana: validacion,
          validacion_ventana: {
            en_ventana: !!validacion.puede_crear,
            ventana_inicio: validacion.fecha_inicio_ventana,
            ventana_fin: validacion.fecha_fin_ventana,
            dias_restantes: validacion.dias_restantes
          },
          empleados: empleados,
          no_elegibles: noElegibles,
          por_area: porArea,
          empleados_por_area: empleadosPorArea
        }
      });
    } catch (error) {
      // Respuesta controlada sin exponer stack ni devolver 500 por este tipo de error
      console.error('[previewEmpleadosElegibles] Error:', error.message);
      res.status(400).json({
        success: false,
        message: 'No se pudo calcular la vista previa de empleados elegibles'
      });
    }
  }

  /**
   * Obtener ciclo activo actual
   */
  static async obtenerCicloActivo(req, res) {
    try {
      const ciclo = await CicloDotacionModel.getCicloActivo();

      if (!ciclo) {
        return res.json({
          success: true,
          data: null,
          message: 'No hay ciclo activo en este momento'
        });
      }

      res.json({
        success: true,
        data: ciclo
      });
    } catch (error) {
      console.error('Error al obtener ciclo activo:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Endpoint público: obtener la próxima fecha de entrega del ciclo activo
   */
  static async obtenerProximaEntregaPublica(req, res) {
    try {
      const ciclo = await CicloDotacionModel.getCicloActivo();

      if (!ciclo) {
        return res.json({
          success: true,
          data: null,
          message: 'Aún no hay fecha de entrega programada'
        });
      }

      const fechaEntregaRaw = ciclo.fecha_entrega;
      const fechaEntrega = fechaEntregaRaw instanceof Date
        ? fechaEntregaRaw
        : new Date(fechaEntregaRaw);

      if (!fechaEntrega || Number.isNaN(fechaEntrega.getTime()) || fechaEntrega < new Date()) {
        return res.json({
          success: true,
          data: null,
          message: 'Aún no hay fecha de entrega programada'
        });
      }

      res.json({
        success: true,
        data: {
          id_ciclo: ciclo.id_ciclo,
          nombre_ciclo: ciclo.nombre_ciclo,
          fecha_entrega: ciclo.fecha_entrega,
          fecha_entrega_iso: fechaEntrega.toISOString(),
          total_empleados: ciclo.total_empleados,
          procesados: ciclo.procesados,
          entregados: ciclo.entregados
        }
      });
    } catch (error) {
      console.error('[obtenerProximaEntregaPublica] Error:', error);
      res.status(500).json({
        success: false,
        message: 'No se pudo consultar la próxima entrega'
      });
    }
  }

  /**
   * Obtener estadísticas de ciclos
   */
  static async obtenerEstadisticas(req, res) {
    try {
      const stats = await CicloDotacionModel.getEstadisticas();
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('Error al actualizar estado de ciclo:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Actualizar el estado de un ciclo (activo | cerrado)
   */
  static async actualizarEstadoCiclo(req, res) {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      if (!id) {
        return res.status(400).json({ success: false, message: 'ID de ciclo requerido' });
      }
      const estadosValidos = ['activo', 'cerrado'];
      if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ success: false, message: 'Estado inválido' });
      }

      const ciclo = await CicloDotacionModel.getById(id);
      if (!ciclo) {
        return res.status(404).json({ success: false, message: 'Ciclo no encontrado' });
      }

      // Modelo debería tener método para actualizar estado. Implementación básica aquí si no existe.
      if (typeof CicloDotacionModel.updateEstado === 'function') {
        await CicloDotacionModel.updateEstado(id, estado);
      } else if (typeof CicloDotacionModel.update === 'function') {
        await CicloDotacionModel.update(id, { estado });
      } else {
        return res.status(500).json({ success: false, message: 'Método updateEstado no implementado en CicloDotacionModel' });
      }

      res.json({ success: true, message: 'Estado de ciclo actualizado', data: { id_ciclo: id, estado } });
    } catch (error) {
      console.error('Error al actualizar estado de ciclo:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
  static async eliminarCiclo(req, res) {
    try {
      const { id } = req.params;
      const { force } = req.query;
      if (!id) {
        return res.status(400).json({ success: false, message: 'ID de ciclo requerido' });
      }

      const resultado = await CicloDotacionModel.delete(id, { force: String(force).toLowerCase() === 'true' });
      res.json({ success: true, message: 'Ciclo eliminado correctamente', data: resultado });
    } catch (error) {
      console.error('Error al eliminar ciclo:', error);
      const mensaje = error.message || 'Error al eliminar ciclo';
      const status = /no se puede eliminar|entregas u omisiones/i.test(mensaje) ? 400 : 500;
      res.status(status).json({ success: false, message: mensaje });
    }
  }

  /**
   * Gestión de salarios mínimos
   */
  static async listarSMLV(req, res) {
    try {
      const salarios = await SalarioMinimoModel.getAll();
      res.json({
        success: true,
        data: salarios
      });
    } catch (error) {
      console.error('Error al listar SMLV:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async guardarSMLV(req, res) {
    try {
      const { anio, valor_mensual, observaciones } = req.body;
      // Asegurar que el middleware de auth haya adjuntado el usuario
      if (!req.user && !req.usuario) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
      }
      const contextoUsuario = req.usuario || req.user;
      if (!contextoUsuario || !contextoUsuario.id_usuario) {
        return res.status(401).json({ success: false, message: 'Usuario no disponible en el contexto' });
      }
      const id_usuario = contextoUsuario.id_usuario;

      if (anio === undefined || valor_mensual === undefined) {
        return res.status(400).json({
          success: false,
          message: 'El año y el valor mensual son requeridos'
        });
      }

      // Normalizar tipos
      const anioNum = Number.parseInt(anio, 10);
      const valorNum = Number.parseFloat(valor_mensual);

      if (!Number.isFinite(anioNum) || anioNum < 2000 || anioNum > 3000) {
        return res.status(400).json({ success: false, message: 'Año inválido' });
      }
      if (!Number.isFinite(valorNum) || valorNum <= 0) {
        return res.status(400).json({ success: false, message: 'Valor mensual inválido' });
      }

      // Log mínimo para diagnóstico
      try {
        console.log('[SMLV] Guardar solicitado por usuario', id_usuario, 'anio=', anioNum, 'valor=', valorNum);
      } catch (e) { /* noop */ }

      const result = await SalarioMinimoModel.upsert({
        anio: anioNum,
        valor_mensual: valorNum,
        creado_por: id_usuario,
        observaciones
      });

      res.json({
        success: true,
        message: 'Salario mínimo guardado correctamente',
        data: { anio: anioNum, valor_mensual: valorNum, result }
      });
    } catch (error) {
      console.error('Error al guardar SMLV:', error);
      // Diferenciar errores de validación y de servidor
      const status = /no autenticado|requeridos|valor mensual|año/i.test(error.message) ? 400 : 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Error al guardar SMLV'
      });
    }
  }

  /**
   * Rellenar (sincronizar) elegibles faltantes para un ciclo ya creado.
   * Usa el SMLV aplicado del ciclo y la misma lógica de inserción con NOT EXISTS.
   */
  static async syncElegibles(req, res) {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ success: false, message: 'ID de ciclo requerido' });

      const ciclo = await CicloDotacionModel.getById(id);
      if (!ciclo) return res.status(404).json({ success: false, message: 'Ciclo no encontrado' });

      const smlvValor = Number.parseFloat(ciclo.valor_smlv_aplicado);
      if (!Number.isFinite(smlvValor)) {
        return res.status(400).json({ success: false, message: 'Ciclo no tiene SMLV aplicado válido' });
      }

      const resultado = await EmpleadoCicloModel.insertElegiblesGlobalBatch(Number(id), smlvValor);

      // Intentar backfill de kits por si existen activos
      const kitsAsignados = await EmpleadoCicloModel.backfillKitsPorArea(Number(id));

      // Actualizar total en el ciclo (sumar lo nuevo al existente)
      await CicloDotacionModel.updateTotalEmpleados(Number(id), ciclo.total_empleados + (resultado.insertados || 0));

      res.json({
        success: true,
        message: 'Sincronización de elegibles completada',
        data: {
          id_ciclo: Number(id),
          elegibles_insertados: resultado.insertados || 0,
          kits_asignados: kitsAsignados
        }
      });
    } catch (error) {
      console.error('Error en syncElegibles:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = CiclosController;
