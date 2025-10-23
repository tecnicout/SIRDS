const Proveedor = require('../models/Proveedor');

class ProveedorController {
  
  // Obtener todos los proveedores
  static async obtenerTodos(req, res) {
    try {
      const { incluirInactivos } = req.query;
      const incluir = incluirInactivos === 'true';
      
      const proveedores = await Proveedor.obtenerTodos(incluir);
      
      res.status(200).json({
        success: true,
        data: proveedores,
        message: 'Proveedores obtenidos exitosamente'
      });
    } catch (error) {
      console.error('Error en obtenerTodos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener proveedores',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtener proveedor por ID
  static async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      
      // Validar ID
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de proveedor inválido'
        });
      }

      const proveedor = await Proveedor.obtenerPorId(id);
      
      if (!proveedor) {
        return res.status(404).json({
          success: false,
          message: 'Proveedor no encontrado'
        });
      }

      res.status(200).json({
        success: true,
        data: proveedor,
        message: 'Proveedor obtenido exitosamente'
      });
    } catch (error) {
      console.error('Error en obtenerPorId:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener proveedor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Crear nuevo proveedor
  static async crear(req, res) {
    try {
      const { nombre, telefono, email, direccion } = req.body;
      
      // Validación básica
      if (!nombre || nombre.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'El nombre del proveedor es requerido'
        });
      }

      // Validación de email (si se proporciona)
      if (email && email.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            success: false,
            message: 'El formato del email no es válido'
          });
        }
      }

      // Validar longitudes
      if (nombre.length > 150) {
        return res.status(400).json({
          success: false,
          message: 'El nombre no puede exceder 150 caracteres'
        });
      }

      const proveedorData = {
        nombre: nombre.trim(),
        telefono: telefono?.trim() || null,
        email: email?.trim() || null,
        direccion: direccion?.trim() || null
      };

      const nuevoProveedor = await Proveedor.crear(proveedorData);
      
      res.status(201).json({
        success: true,
        data: nuevoProveedor,
        message: 'Proveedor creado exitosamente'
      });
    } catch (error) {
      console.error('Error en crear:', error);
      
      // Manejar errores específicos
      if (error.message.includes('Ya existe')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al crear proveedor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Actualizar proveedor
  static async actualizar(req, res) {
    try {
      const { id } = req.params;
      const { nombre, telefono, email, direccion } = req.body;
      
      // Validar ID
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de proveedor inválido'
        });
      }

      // Validación básica
      if (!nombre || nombre.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'El nombre del proveedor es requerido'
        });
      }

      const proveedorData = {
        nombre: nombre.trim(),
        telefono: telefono?.trim() || null,
        email: email?.trim() || null,
        direccion: direccion?.trim() || null
      };

      const proveedorActualizado = await Proveedor.actualizar(id, proveedorData);
      
      res.status(200).json({
        success: true,
        data: proveedorActualizado,
        message: 'Proveedor actualizado exitosamente'
      });
    } catch (error) {
      console.error('Error en actualizar:', error);
      
      // Manejar errores específicos
      if (error.message === 'Proveedor no encontrado') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('Ya existe')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al actualizar proveedor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Inactivar proveedor
  static async inactivar(req, res) {
    try {
      const { id } = req.params;
      
      // Validar ID
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de proveedor inválido'
        });
      }

      const resultado = await Proveedor.inactivar(id);
      
      res.status(200).json({
        success: true,
        data: resultado,
        message: resultado.mensaje
      });
    } catch (error) {
      console.error('Error en inactivar:', error);
      
      // Manejar errores específicos
      if (error.message === 'Proveedor no encontrado') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message === 'El proveedor ya está inactivo') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      // Error genérico
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al inactivar proveedor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Activar proveedor
  static async activar(req, res) {
    try {
      const { id } = req.params;
      
      // Validar ID
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de proveedor inválido'
        });
      }

      const resultado = await Proveedor.activar(id);
      
      res.status(200).json({
        success: true,
        data: resultado,
        message: resultado.mensaje
      });
    } catch (error) {
      console.error('Error en activar:', error);
      
      // Manejar errores específicos
      if (error.message === 'Proveedor no encontrado') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message === 'El proveedor ya está activo') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      // Error genérico
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al activar proveedor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Buscar proveedores
  static async buscar(req, res) {
    try {
      const { busqueda } = req.query;
      
      const filtros = {};
      if (busqueda) {
        filtros.busqueda = busqueda.trim();
      }

      const proveedores = await Proveedor.buscar(filtros);
      
      res.status(200).json({
        success: true,
        data: proveedores,
        message: 'Búsqueda realizada exitosamente'
      });
    } catch (error) {
      console.error('Error en buscar:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al buscar proveedores',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = ProveedorController;