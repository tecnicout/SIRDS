const CicloDotacionModel = require('../models/CicloDotacionModel');
const EmpleadoCicloModel = require('../models/EmpleadoCicloModel');
const SalarioMinimoModel = require('../models/SalarioMinimoModel');

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
        id_area_produccion = 1, // Por defecto área Producción
        id_area_mercadista = 22, // Por defecto área Mercadista
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

      // Calcular ventana de ejecución (1 mes antes)
      const fechaEntrega = new Date(fecha_entrega);
      const fechaInicioVentana = new Date(fechaEntrega);
      fechaInicioVentana.setMonth(fechaInicioVentana.getMonth() - 1);

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

      // Calcular empleados elegibles
      const empleadosElegibles = await EmpleadoCicloModel.calcularElegibles(
        id_area_produccion,
        id_area_mercadista,
        parseFloat(smlv.valor_mensual)
      );

      if (empleadosElegibles.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No hay empleados elegibles para este ciclo',
          criterios: {
            antiguedad_minima: '3 meses',
            rango_salarial: `$${smlv.valor_mensual} - $${smlv.valor_mensual * 2}`,
            areas: ['Producción', 'Mercadista']
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

      // Agregar empleados elegibles al ciclo
      const empleadosParaCiclo = empleadosElegibles.map(emp => ({
        id_empleado: emp.id_empleado,
        antiguedad_meses: emp.antiguedad_meses,
        sueldo_al_momento: emp.sueldo,
        id_area: emp.id_area
      }));

      const resultadoBatch = await EmpleadoCicloModel.createBatch(
        ciclo.id_ciclo,
        empleadosParaCiclo
      );

      // Actualizar total de empleados elegibles en el ciclo
      await CicloDotacionModel.updateTotalEmpleados(
        ciclo.id_ciclo,
        resultadoBatch.insertados
      );

      res.status(201).json({
        success: true,
        message: 'Ciclo creado y activado exitosamente',
        data: {
          id_ciclo: ciclo.id_ciclo,
          nombre_ciclo,
          fecha_entrega,
          estado: 'activo',
          total_empleados: resultadoBatch.insertados,
          smlv_aplicado: smlv.valor_mensual
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

      // Calcular elegibles con normalización defensiva
      const smlvValor = parseFloat(smlv.valor_mensual);
      const empleadosRaw = await EmpleadoCicloModel.calcularElegibles(
        id_area_produccion,
        id_area_mercadista,
        smlvValor
      );
      const empleados = Array.isArray(empleadosRaw) ? empleadosRaw : [];
      if (!Array.isArray(empleadosRaw)) {
        console.warn('[previewEmpleadosElegibles] empleados no es array; normalizando a []');
      }

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

      res.json({
        success: true,
        data: {
          total_elegibles: empleados.length,
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
   * Obtener estadísticas de ciclos
   */
  static async obtenerEstadisticas(req, res) {
    try {
      const stats = await CicloDotacionModel.getEstadisticas();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Actualizar estado del ciclo (activo | cerrado)
   */
  static async actualizarEstadoCiclo(req, res) {
    try {
      const { id } = req.params;
      const { estado } = req.body || {};

      if (!estado) {
        return res.status(400).json({ success: false, message: 'Estado requerido' });
      }

      await CicloDotacionModel.updateEstado(id, estado);

      const ciclo = await CicloDotacionModel.getById(id);

      res.json({
        success: true,
        message: `Ciclo actualizado a estado ${estado}`,
        data: ciclo
      });
    } catch (error) {
      console.error('Error al actualizar estado de ciclo:', error);
      res.status(500).json({ success: false, message: error.message });
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
}

module.exports = CiclosController;
