const { query } = require('../config/database');

class Proveedor {
  // Crear nuevo proveedor
  static async crear(proveedorData) {
    try {
      const { nombre, telefono, email, direccion } = proveedorData;
      
      // Validar campos requeridos
      if (!nombre || nombre.trim() === '') {
        throw new Error('El nombre del proveedor es requerido');
      }

      // Verificar si ya existe un proveedor con el mismo nombre
      const existingByName = await this.buscarPorNombre(nombre.trim());
      if (existingByName) {
        throw new Error('Ya existe un proveedor con este nombre');
      }

      // Verificar si ya existe un proveedor con el mismo email (si se proporciona)
      if (email && email.trim() !== '') {
        const existingByEmail = await this.buscarPorEmail(email.trim());
        if (existingByEmail) {
          throw new Error('Ya existe un proveedor con este email');
        }
      }

      const queryText = `
        INSERT INTO Proveedor (nombre, telefono, email, direccion)
        VALUES (?, ?, ?, ?)
      `;
      
      const values = [
        nombre.trim(),
        telefono || null,
        email || null,
        direccion || null
      ];

      const result = await query(queryText, values);
      
      // Retornar el proveedor creado
      return await this.obtenerPorId(result.insertId);
    } catch (error) {
      console.error('Error al crear proveedor:', error);
      throw error;
    }
  }

  // Obtener todos los proveedores (solo activos por defecto)
  static async obtenerTodos(incluirInactivos = false) {
    try {
      let queryText = `
        SELECT 
          id_proveedor,
          nombre,
          telefono,
          email,
          direccion,
          activo
        FROM Proveedor
      `;
      
      if (!incluirInactivos) {
        queryText += ' WHERE activo = TRUE';
      }
      
      queryText += ' ORDER BY nombre ASC';
      
      const rows = await query(queryText);
      
      // Convertir el campo activo de MySQL (0/1) a boolean
      return rows.map(row => ({
        ...row,
        activo: Boolean(row.activo)
      }));
    } catch (error) {
      console.error('Error al obtener proveedores:', error);
      throw error;
    }
  }

  // Obtener proveedor por ID
  static async obtenerPorId(id) {
    try {
      const queryText = `
        SELECT 
          id_proveedor,
          nombre,
          telefono,
          email,
          direccion,
          activo
        FROM Proveedor
        WHERE id_proveedor = ?
      `;
      
      const rows = await query(queryText, [id]);
      
      if (rows.length > 0) {
        const row = rows[0];
        return {
          ...row,
          activo: Boolean(row.activo)
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error al obtener proveedor por ID:', error);
      throw error;
    }
  }

  // Buscar proveedor por nombre
  static async buscarPorNombre(nombre) {
    try {
      const queryText = `
        SELECT 
          id_proveedor,
          nombre,
          telefono,
          email,
          direccion
        FROM Proveedor
        WHERE LOWER(nombre) = LOWER(?)
      `;
      
      const rows = await query(queryText, [nombre]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error al buscar proveedor por nombre:', error);
      throw error;
    }
  }

  // Buscar proveedor por email
  static async buscarPorEmail(email) {
    try {
      const queryText = `
        SELECT 
          id_proveedor,
          nombre,
          telefono,
          email,
          direccion
        FROM Proveedor
        WHERE LOWER(email) = LOWER(?)
      `;
      
      const rows = await query(queryText, [email]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error al buscar proveedor por email:', error);
      throw error;
    }
  }

  // Actualizar proveedor
  static async actualizar(id, proveedorData) {
    try {
      const { nombre, telefono, email, direccion } = proveedorData;
      
      // Validar que el proveedor existe
      const proveedorExistente = await this.obtenerPorId(id);
      if (!proveedorExistente) {
        throw new Error('Proveedor no encontrado');
      }

      // Validar campos requeridos
      if (!nombre || nombre.trim() === '') {
        throw new Error('El nombre del proveedor es requerido');
      }

      // Verificar si ya existe otro proveedor con el mismo nombre
      const existingByName = await this.buscarPorNombre(nombre.trim());
      if (existingByName && existingByName.id_proveedor !== parseInt(id)) {
        throw new Error('Ya existe otro proveedor con este nombre');
      }

      // Verificar si ya existe otro proveedor con el mismo email (si se proporciona)
      if (email && email.trim() !== '') {
        const existingByEmail = await this.buscarPorEmail(email.trim());
        if (existingByEmail && existingByEmail.id_proveedor !== parseInt(id)) {
          throw new Error('Ya existe otro proveedor con este email');
        }
      }

      const queryText = `
        UPDATE Proveedor 
        SET nombre = ?, telefono = ?, email = ?, direccion = ?
        WHERE id_proveedor = ?
      `;
      
      const values = [
        nombre.trim(),
        telefono || null,
        email || null,
        direccion || null,
        id
      ];

      const result = await query(queryText, values);
      
      if (result.affectedRows === 0) {
        throw new Error('No se pudo actualizar el proveedor');
      }

      // Retornar el proveedor actualizado
      return await this.obtenerPorId(id);
    } catch (error) {
      console.error('Error al actualizar proveedor:', error);
      throw error;
    }
  }

  // Verificar dependencias del proveedor
  static async verificarDependencias(id) {
    try {
      const dependencias = [];
      
      // Verificar tabla dotacion
      const dotacionQuery = 'SELECT COUNT(*) as count FROM dotacion WHERE id_proveedor = ?';
      const dotacionResult = await query(dotacionQuery, [id]);
      if (dotacionResult[0].count > 0) {
        dependencias.push({ 
          tabla: 'dotacion', 
          cantidad: dotacionResult[0].count,
          descripcion: 'elementos de dotación'
        });
      }

      // Aquí puedes agregar más tablas que referencien al proveedor
      // Ejemplo:
      // const comprasQuery = 'SELECT COUNT(*) as count FROM compras WHERE id_proveedor = ?';
      // const comprasResult = await query(comprasQuery, [id]);
      // if (comprasResult[0].count > 0) {
      //   dependencias.push({ tabla: 'compras', cantidad: comprasResult[0].count, descripcion: 'compras' });
      // }

      return dependencias;
    } catch (error) {
      console.error('Error al verificar dependencias:', error);
      return [];
    }
  }

  // Inactivar proveedor (soft delete)
  static async inactivar(id) {
    try {
      // Validar que el proveedor existe
      const proveedor = await this.obtenerPorId(id);
      if (!proveedor) {
        throw new Error('Proveedor no encontrado');
      }

      // Verificar si ya está inactivo
      if (!proveedor.activo) {
        throw new Error('El proveedor ya está inactivo');
      }

      const queryText = 'UPDATE Proveedor SET activo = FALSE WHERE id_proveedor = ?';
      const result = await query(queryText, [id]);
      
      if (result.affectedRows === 0) {
        throw new Error('No se pudo inactivar el proveedor');
      }

      return { mensaje: `Proveedor "${proveedor.nombre}" inactivado exitosamente` };
    } catch (error) {
      console.error('Error al inactivar proveedor:', error);
      throw error;
    }
  }

  // Activar proveedor
  static async activar(id) {
    try {
      // Validar que el proveedor existe
      const proveedor = await this.obtenerPorId(id);
      if (!proveedor) {
        throw new Error('Proveedor no encontrado');
      }

      // Verificar si ya está activo
      if (proveedor.activo) {
        throw new Error('El proveedor ya está activo');
      }

      const queryText = 'UPDATE Proveedor SET activo = TRUE WHERE id_proveedor = ?';
      const result = await query(queryText, [id]);
      
      if (result.affectedRows === 0) {
        throw new Error('No se pudo activar el proveedor');
      }

      return { mensaje: `Proveedor "${proveedor.nombre}" activado exitosamente` };
    } catch (error) {
      console.error('Error al activar proveedor:', error);
      throw error;
    }
  }

  // Eliminar proveedor físicamente (solo para casos excepcionales)
  static async eliminarFisicamente(id) {
    try {
      // Validar que el proveedor existe
      const proveedor = await this.obtenerPorId(id);
      if (!proveedor) {
        throw new Error('Proveedor no encontrado');
      }

      // Verificar dependencias antes de eliminar
      const dependencias = await this.verificarDependencias(id);
      if (dependencias.length > 0) {
        const mensajeDependencias = dependencias
          .map(dep => `${dep.cantidad} ${dep.descripcion}`)
          .join(', ');
        throw new Error(`No se puede eliminar físicamente el proveedor "${proveedor.nombre}" porque está siendo utilizado en: ${mensajeDependencias}.`);
      }
      
      const queryText = 'DELETE FROM Proveedor WHERE id_proveedor = ?';
      const result = await query(queryText, [id]);
      
      if (result.affectedRows === 0) {
        throw new Error('No se pudo eliminar el proveedor');
      }

      return { mensaje: 'Proveedor eliminado físicamente' };
    } catch (error) {
      console.error('Error al eliminar proveedor físicamente:', error);
      
      // Mejorar el mensaje de error para restricciones de clave foránea
      if (error.message.includes('foreign key constraint fails')) {
        throw new Error('No se puede eliminar físicamente el proveedor porque está siendo utilizado en otros registros del sistema.');
      }
      
      throw error;
    }
  }

  // Buscar proveedores con filtros
  static async buscar(filtros = {}) {
    try {
      let queryText = `
        SELECT 
          id_proveedor,
          nombre,
          telefono,
          email,
          direccion,
          activo
        FROM Proveedor
        WHERE 1=1
      `;
      
      const values = [];

      // Filtro por estado activo (por defecto solo activos)
      if (filtros.incluirInactivos !== true) {
        queryText += ' AND activo = TRUE';
      }

      // Filtro por búsqueda general
      if (filtros.busqueda) {
        queryText += ` AND (
          LOWER(nombre) LIKE LOWER(?) OR
          LOWER(email) LIKE LOWER(?) OR
          LOWER(telefono) LIKE LOWER(?) OR
          LOWER(direccion) LIKE LOWER(?)
        )`;
        const busquedaParam = `%${filtros.busqueda}%`;
        values.push(busquedaParam, busquedaParam, busquedaParam, busquedaParam);
      }

      queryText += ' ORDER BY activo DESC, nombre ASC';

      const rows = await query(queryText, values);
      
      // Convertir el campo activo de MySQL (0/1) a boolean
      return rows.map(row => ({
        ...row,
        activo: Boolean(row.activo)
      }));
    } catch (error) {
      console.error('Error al buscar proveedores:', error);
      throw error;
    }
  }
}

module.exports = Proveedor;
