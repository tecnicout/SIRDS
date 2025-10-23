import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DataTable from '../components/DataTable/DataTable';
import { Modal, EditModal } from '../components/Modal';

// Configuración de columnas para la tabla de empleados
const EMPLEADOS_COLUMNS = [
  {
    key: 'empleado_info',
    label: 'Empleado',
    sortable: true,
    render: (value, row) => (
      <div className="flex items-center">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-green-600 font-medium text-sm">
            {(row.nombre?.charAt(0) || '') + (row.apellido?.charAt(0) || '')}
          </span>
        </div>
        <div className="ml-4">
          <div className="text-sm font-medium text-gray-900">
            {row.nombre} {row.apellido}
          </div>
          <div className="text-sm text-gray-500">
            ID: {row.Identificacion} | {row.id_empleado}
          </div>
        </div>
      </div>
    )
  },
  {
    key: 'contacto_info',
    label: 'Contacto',
    render: (value, row) => (
      <div>
        <div className="text-sm text-gray-900">{row.email || 'Sin email'}</div>
        <div className="text-sm text-gray-500">{row.telefono || 'Sin teléfono'}</div>
      </div>
    )
  },
  {
    key: 'trabajo_info',
    label: 'Trabajo',
    sortable: true,
    render: (value, row) => (
      <div>
        <div className="text-sm font-medium text-gray-900">{row.cargo}</div>
        <div className="text-sm text-gray-500">{row.nombre_area || 'Sin área'}</div>
      </div>
    )
  },
  {
    key: 'estado',
    label: 'Estado',
    align: 'center',
    render: (value, row) => (
      <div className="flex flex-col space-y-1">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row.estado 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {row.estado ? 'Activo' : 'Inactivo'}
        </span>
        {row.sueldo && (
          <span className="text-xs text-gray-500">
            ${parseFloat(row.sueldo).toLocaleString()}
          </span>
        )}
      </div>
    )
  },
  {
    key: 'fechas_info',
    label: 'Fechas',
    render: (value, row) => (
      <div>
        <div className="text-sm text-gray-900">
          Inicio: {row.fecha_inicio ? new Date(row.fecha_inicio).toLocaleDateString() : 'N/A'}
        </div>
        {row.fecha_fin && (
          <div className="text-sm text-red-500">
            Fin: {new Date(row.fecha_fin).toLocaleDateString()}
          </div>
        )}
      </div>
    )
  }
];

// Configuración de campos para el modal de vista
const EMPLEADO_VIEW_FIELDS = [
  { key: 'id_empleado', label: 'ID Empleado' },
  { key: 'Identificacion', label: 'Identificación' },
  { key: 'tipo_identificacion', label: 'Tipo de Identificación' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'apellido', label: 'Apellido' },
  { 
    key: 'fecha_nacimiento', 
    label: 'Fecha de Nacimiento', 
    render: (value) => value ? new Date(value).toLocaleDateString() : 'No especificada' 
  },
  { key: 'email', label: 'Email' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'cargo', label: 'Cargo' },
  { key: 'genero_nombre', label: 'Género' },
  { key: 'nombre_area', label: 'Área' },
  { key: 'ubicacion_nombre', label: 'Ubicación' },
  { 
    key: 'fecha_inicio', 
    label: 'Fecha de Inicio', 
    render: (value) => value ? new Date(value).toLocaleDateString() : 'No especificada' 
  },
  { 
    key: 'sueldo', 
    label: 'Sueldo', 
    render: (value) => value ? `$${parseFloat(value).toLocaleString()}` : 'No especificado' 
  },
  { 
    key: 'fecha_fin', 
    label: 'Fecha de Fin', 
    render: (value) => value ? new Date(value).toLocaleDateString() : 'No especificada' 
  },
  { 
    key: 'estado', 
    label: 'Estado',
    render: (value) => value ? 'Activo' : 'Inactivo'
  }
];

// Configuración de campos para el modal de edición (se importa desde EditModal)
import { EMPLEADO_FORM_FIELDS, EMPLEADO_VALIDATION_RULES } from '../components/Modal/EditModal';

export default function Empleados() {
  // Estados principales
  const [empleados, setEmpleados] = useState([]);
  const [areas, setAreas] = useState([]);
  const [generos, setGeneros] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para modales
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState(null);
  const [editingEmpleado, setEditingEmpleado] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para búsqueda y filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');

  // Toast notification system
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Show toast function mejorada con íconos y mejor UX
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, type === 'error' ? 5000 : 3000); // Errores se muestran más tiempo
  };

  // Fix: Usar useCallback para evitar bucle infinito en useEffect
  const cargarEmpleados = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/empleados', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setEmpleados(result.data || []);
      } else {
        setError('Error al cargar empleados');
        showToast('Error al cargar empleados', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
      showToast('Error de conexión al cargar empleados', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fix: Usar useCallback para cargar áreas
  const cargarAreas = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/areas', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setAreas(result.data || []);
      } else {
        console.error('Error al cargar áreas:', response.status);
        showToast('No se pudieron cargar las áreas', 'error');
      }
    } catch (error) {
      console.error('Error al cargar áreas:', error);
      showToast('Error al cargar áreas', 'error');
    }
  }, []);

  // Fix: Usar useCallback para cargar géneros
  const cargarGeneros = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/generos', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setGeneros(result.data || []);
      } else {
        console.error('Error al cargar géneros:', response.status);
        showToast('No se pudieron cargar los géneros', 'error');
      }
    } catch (error) {
      console.error('Error al cargar géneros:', error);
      showToast('Error al cargar géneros', 'error');
    }
  }, []);

  // Fix: Usar useCallback para cargar ubicaciones
  const cargarUbicaciones = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/ubicaciones', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setUbicaciones(result.data || []);
      } else {
        console.error('Error al cargar ubicaciones:', response.status);
        showToast('No se pudieron cargar las ubicaciones', 'error');
      }
    } catch (error) {
      console.error('Error al cargar ubicaciones:', error);
      showToast('Error al cargar ubicaciones', 'error');
    }
  }, []);

  // Cargar datos al iniciar el componente
  useEffect(() => {
    cargarEmpleados();
    cargarAreas();
    cargarGeneros();
    cargarUbicaciones();
  }, [cargarEmpleados, cargarAreas, cargarGeneros, cargarUbicaciones]);

  // Función de búsqueda avanzada con useCallback
  const buscarEmpleados = useCallback(async (termino) => {
    if (!termino || termino.trim().length < 2) {
      return; // No buscar si el término es muy corto
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/empleados/search?q=${encodeURIComponent(termino.trim())}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        return result.data || [];
      } else {
        console.error('Error en búsqueda:', response.status);
        return [];
      }
    } catch (error) {
      console.error('Error al buscar empleados:', error);
      return [];
    }
  }, []);

  // Filtrar empleados basado en búsqueda y filtros
  const empleadosFiltrados = useMemo(() => {
    return empleados.filter(empleado => {
      // Filtro de búsqueda (insensible a mayúsculas y minúsculas)
      const matchesSearch = !searchQuery || 
        empleado.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        empleado.apellido?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        empleado.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        empleado.cargo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        empleado.Identificacion?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        empleado.nombre_area?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        empleado.genero_nombre?.toLowerCase().includes(searchQuery.toLowerCase());

      // Filtro de estado
      const matchesEstado = !estadoFiltro || 
        (estadoFiltro === 'activo' && empleado.estado) ||
        (estadoFiltro === 'inactivo' && !empleado.estado);

      return matchesSearch && matchesEstado;
    });
  }, [empleados, searchQuery, estadoFiltro]);

  // Función para crear empleado con validaciones mejoradas
  const crearEmpleado = useCallback(async (empleadoData) => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      
      // Limpiar datos antes de enviar
      const cleanData = Object.fromEntries(
        Object.entries(empleadoData).map(([key, value]) => [
          key, 
          (value === '' || value === undefined) ? null : value
        ])
      );
      
      const response = await fetch('/api/empleados', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cleanData)
      });

      const result = await response.json();

      if (response.ok) {
        showToast('✅ Empleado creado exitosamente', 'success');
        await cargarEmpleados(); // Recargar datos
        setShowCreateModal(false);
        return result;
      } else {
        // Manejo específico de errores de validación
        if (result.message?.includes('identificación')) {
          showToast('❌ Ya existe un empleado con esta identificación', 'error');
        } else if (result.message?.includes('email')) {
          showToast('❌ Ya existe un empleado con este email', 'error');
        } else if (result.message?.includes('género') || result.message?.includes('área')) {
          showToast('❌ Género o área especificado no válido', 'error');
        } else {
          showToast(`❌ ${result.message || 'Error al crear empleado'}`, 'error');
        }
        throw new Error(result.message || 'Error al crear empleado');
      }
    } catch (error) {
      console.error('Error al crear empleado:', error);
      if (!error.message?.includes('identificación') && !error.message?.includes('email')) {
        showToast('❌ Error de conexión al crear empleado', 'error');
      }
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [cargarEmpleados]);

  // Función para actualizar empleado con validaciones mejoradas
  const actualizarEmpleado = useCallback(async (empleadoData) => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      
      // Limpiar datos antes de enviar
      const cleanData = Object.fromEntries(
        Object.entries(empleadoData).map(([key, value]) => {
          // Manejar campo estado específicamente
          if (key === 'estado') {
            // Asegurar que estado sea número (1 o 0)
            return [key, parseInt(value, 10)];
          }
          // Para otros campos, convertir cadenas vacías a null
          return [key, value === '' ? null : value];
        })
      );
      
      const response = await fetch(`/api/empleados/${editingEmpleado.id_empleado}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cleanData)
      });

      const result = await response.json();

      if (response.ok) {
        showToast('✅ Empleado actualizado exitosamente', 'success');
        await cargarEmpleados(); // Recargar datos
        setShowEditModal(false);
        setEditingEmpleado(null);
      } else {
        // Manejo específico de errores de validación
        if (result.message?.includes('identificación')) {
          showToast('❌ Ya existe otro empleado con esta identificación', 'error');
        } else if (result.message?.includes('email')) {
          showToast('❌ Ya existe otro empleado con este email', 'error');
        } else if (result.message?.includes('género') || result.message?.includes('área')) {
          showToast('❌ Género o área especificado no válido', 'error');
        } else {
          showToast(`❌ ${result.message || 'Error al actualizar empleado'}`, 'error');
        }
      }
    } catch (error) {
      console.error('Error al actualizar empleado:', error);
      showToast('❌ Error de conexión al actualizar empleado', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [editingEmpleado, cargarEmpleados]);

  // Función para cambiar estado de empleado con useCallback y confirmación mejorada
  const cambiarEstadoEmpleado = useCallback(async (id, nuevoEstado) => {
    try {
      const token = localStorage.getItem('token');
      
      // Validar que tenemos los datos necesarios
      if (!id || !token) {
        showToast('❌ Error: Datos de empleado o token faltantes', 'error');
        return;
      }

      // Convertir booleano a número para consistencia con el backend
      const estadoNumerico = nuevoEstado ? 1 : 0;
      
      console.log(`Cambiando estado del empleado ${id} a ${estadoNumerico}`);
      
      const response = await fetch(`/api/empleados/${id}/estado`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estado: estadoNumerico })
      });

      if (response.ok) {
        const result = await response.json();
        const accion = nuevoEstado ? 'activado' : 'desactivado';
        showToast(`✅ Empleado ${accion} exitosamente`, 'success');
        await cargarEmpleados(); // Recargar datos
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
        console.error('Error del servidor:', errorData);
        showToast(`❌ ${errorData.message || 'Error al cambiar estado del empleado'}`, 'error');
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      showToast('❌ Error de conexión al cambiar estado del empleado', 'error');
    }
  }, [cargarEmpleados, showToast]);

  // Handlers para modales con useCallback
  const handleVerDetalle = useCallback((empleado) => {
    setSelectedEmpleado(empleado);
    setShowViewModal(true);
  }, []);

  const handleEditarEmpleado = useCallback((empleado) => {
    // Función para convertir fecha a formato YYYY-MM-DD para inputs date
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
      } catch (error) {
        return '';
      }
    };

    // Crear copia del empleado con fechas formateadas para inputs y estado convertido
    const empleadoParaEditar = {
      ...empleado,
      fecha_nacimiento: formatDateForInput(empleado.fecha_nacimiento),
      fecha_inicio: formatDateForInput(empleado.fecha_inicio),
      fecha_fin: formatDateForInput(empleado.fecha_fin),
      // Convertir estado boolean a número para el select
      estado: empleado.estado ? 1 : 0
    };

    setEditingEmpleado(empleadoParaEditar);
    setShowEditModal(true);
  }, []);

  const handleCrearEmpleado = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const handleCerrarModales = useCallback(() => {
    setShowViewModal(false);
    setShowEditModal(false);
    setShowCreateModal(false);
    setSelectedEmpleado(null);
    setEditingEmpleado(null);
  }, []);

  // Manejar acciones de fila de la tabla con confirmaciones mejoradas
  const handleRowAction = useCallback(async (action, empleado) => {
    switch (action) {
      case 'view':
        handleVerDetalle(empleado);
        break;
      case 'edit':
        handleEditarEmpleado(empleado);
        break;
      case 'toggle':
        const accionTexto = empleado.estado ? 'desactivar' : 'activar';
        const confirmMessage = `¿Estás seguro de ${accionTexto} a ${empleado.nombre} ${empleado.apellido}?\n\n` +
          `ID: ${empleado.Identificacion}\n` +
          `Cargo: ${empleado.cargo}\n` +
          `Área: ${empleado.nombre_area || 'Sin área'}\n\n` +
          `Estado actual: ${empleado.estado ? 'Activo' : 'Inactivo'}\n` +
          `Nuevo estado: ${!empleado.estado ? 'Activo' : 'Inactivo'}`;
        
        if (window.confirm(confirmMessage)) {
          await cambiarEstadoEmpleado(empleado.id_empleado, !empleado.estado);
        }
        break;
      default:
        console.warn('Acción no reconocida:', action);
    }
  }, [handleVerDetalle, handleEditarEmpleado, cambiarEstadoEmpleado]);

  // Preparar campos de formulario con opciones de áreas, géneros y ubicaciones
  const formFieldsWithAreas = useMemo(() => {
    return EMPLEADO_FORM_FIELDS.map(field => {
      if (field.name === 'id_area') {
        return {
          ...field,
          options: areas.map(area => ({
            value: area.id_area,
            label: area.nombre_area
          }))
        };
      }
      if (field.name === 'id_genero') {
        return {
          ...field,
          options: generos.map(genero => ({
            value: genero.id_genero,
            label: genero.nombre
          }))
        };
      }
      if (field.name === 'id_ubicacion') {
        return {
          ...field,
          options: ubicaciones.map(ubicacion => ({
            value: ubicacion.id_ubicacion,
            label: ubicacion.nombre
          }))
        };
      }
      return field;
    });
  }, [areas, generos, ubicaciones]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification Mejorado */}
      {toast.show && (
        <div 
          className={`fixed top-4 right-4 z-[9999] p-4 rounded-lg shadow-2xl transition-all duration-300 transform ${
            toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            toast.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            toast.type === 'warning' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
            'bg-blue-50 text-blue-800 border border-blue-200'
          } max-w-md`}
          style={{ filter: 'none', backdropFilter: 'none' }}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {toast.type === 'success' && (
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {toast.type === 'error' && (
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {toast.type === 'warning' && (
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              )}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                className={`inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  toast.type === 'success' ? 'text-green-400 hover:text-green-500 focus:ring-green-500' :
                  toast.type === 'error' ? 'text-red-400 hover:text-red-500 focus:ring-red-500' :
                  toast.type === 'warning' ? 'text-yellow-400 hover:text-yellow-500 focus:ring-yellow-500' :
                  'text-blue-400 hover:text-blue-500 focus:ring-blue-500'
                }`}
                onClick={() => setToast({ show: false, message: '', type: 'success' })}
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Empleados</h1>
          <p className="text-gray-600">Administra la información de los empleados de Arroz Sonora</p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Empleados</p>
              <p className="text-2xl font-bold text-gray-900">{empleados.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Empleados Activos</p>
              <p className="text-2xl font-bold text-green-600">
                {empleados.filter(emp => emp.estado).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Empleados Inactivos</p>
              <p className="text-2xl font-bold text-red-600">
                {empleados.filter(emp => !emp.estado).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros simplificados */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Búsqueda principal */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar empleado
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ID, nombre, apellido, email, cargo, área, género..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Filtro por estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <select
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de empleados */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Lista de Empleados</h2>
            <button
              onClick={handleCrearEmpleado}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Nuevo Empleado</span>
            </button>
          </div>
          <p className="text-gray-600 mt-1">
            Mostrando {empleadosFiltrados.length} de {empleados.length} empleados
          </p>
        </div>

        <DataTable
          data={empleadosFiltrados}
          columns={EMPLEADOS_COLUMNS}
          onRowAction={handleRowAction}
          loading={isLoading}
          emptyMessage="No se encontraron empleados"
          rowActions={['view', 'edit', 'toggle']}
          rowKey="id_empleado"
          showSearch={false}
          showToolbar={false}
        />
      </div>

      {/* Modal de vista detallada */}
      {showViewModal && selectedEmpleado && (
        <Modal
          isOpen={showViewModal}
          onClose={handleCerrarModales}
          title="Detalle del Empleado"
          size="lg"
        >
          <div className="space-y-6">
            {/* Información básica del empleado */}
            <div className="flex items-center space-x-4 pb-6 border-b border-gray-200">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-xl">
                  {(selectedEmpleado.nombre?.charAt(0) || '') + (selectedEmpleado.apellido?.charAt(0) || '')}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedEmpleado.nombre} {selectedEmpleado.apellido}
                </h3>
                <p className="text-gray-600">{selectedEmpleado.cargo}</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  selectedEmpleado.estado 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {selectedEmpleado.estado ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>

            {/* Detalles en grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {EMPLEADO_VIEW_FIELDS.map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {field.render 
                      ? field.render(selectedEmpleado[field.key])
                      : selectedEmpleado[field.key] || 'No especificado'
                    }
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de creación */}
      {showCreateModal && (
        <EditModal
          isOpen={showCreateModal}
          onClose={handleCerrarModales}
          title="Crear Nuevo Empleado"
          fields={formFieldsWithAreas}
          validationRules={EMPLEADO_VALIDATION_RULES}
          onSubmit={crearEmpleado}
          isSubmitting={isSubmitting}
          submitText="Crear Empleado"
          initialData={{ 
            estado: 1,
            id_genero: '',
            id_area: '',
            id_ubicacion: ''
          }}
        />
      )}

      {/* Modal de edición */}
      {showEditModal && editingEmpleado && (
        <EditModal
          isOpen={showEditModal}
          onClose={handleCerrarModales}
          title="Editar Empleado"
          fields={formFieldsWithAreas}
          validationRules={EMPLEADO_VALIDATION_RULES}
          onSubmit={actualizarEmpleado}
          initialData={editingEmpleado}
          isSubmitting={isSubmitting}
          submitText="Actualizar Empleado"
        />
      )}
    </div>
  );
}
