import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DataTable from '../components/DataTable/DataTable';
import { Modal, EditModal } from '../components/Modal';
import ResourceHeader from '../components/UI/ResourceHeader';
import CardPanel from '../components/UI/CardPanel';
import useStoredUser from '../hooks/useStoredUser';
import { getToken } from '../utils/tokenStorage';

// Configuración de columnas para la tabla de empleados
const buildEmpleadoColumns = (currentUser) => [
  {
    key: 'empleado_info',
    label: 'Empleado',
    sortable: true,
    width: '20%',
    render: (value, row) => (
      <div className="flex items-center">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-md border-2 border-gray-200 overflow-hidden"
          style={!((row.avatar_url || (currentUser && row.id_empleado === currentUser.id_empleado && currentUser.avatar_url))) ? { backgroundColor: row.avatar_color || (currentUser && row.id_empleado === currentUser.id_empleado ? currentUser.avatar_color : '#9CA3AF') } : undefined}
        >
          {(() => {
            const effectiveAvatar = row.avatar_url || (currentUser && row.id_empleado === currentUser.id_empleado ? currentUser.avatar_url : null);
            if (effectiveAvatar) {
              return <img src={effectiveAvatar} alt={`${row.nombre} ${row.apellido}`} className="w-full h-full object-cover" />;
            }
            const initials = `${row.nombre?.charAt(0) || ''}${row.apellido?.charAt(0) || ''}`.trim() || 'NA';
            return <span className="text-white font-bold text-sm">{initials}</span>;
          })()}
        </div>
        <div className="ml-4">
          <div className="text-sm font-semibold text-gray-700">
            {row.nombre} {row.apellido}
          </div>
          <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-md inline-block border">
            ID: <span className="font-mono text-gray-800">{row.Identificacion}</span>
          </div>
        </div>
      </div>
    )
  },
  {
    key: 'contacto_info',
    label: 'Contacto',
    width: '18%',
    render: (value, row) => (
      <div className="space-y-1">
        <div className="text-sm text-gray-700 flex items-center">
          <div className="w-4 h-4 bg-gray-400 rounded flex items-center justify-center mr-2">
            <i className="bx bx-envelope text-xs text-white"></i>
          </div>
          <span className="truncate">{row.email || 'Sin email'}</span>
        </div>
        <div className="text-sm text-gray-600 flex items-center">
          <div className="w-4 h-4 bg-gray-400 rounded flex items-center justify-center mr-2">
            <i className="bx bx-phone text-xs text-white"></i>
          </div>
          {row.telefono || 'Sin teléfono'}
        </div>
      </div>
    )
  },
  {
    key: 'trabajo_info',
    label: 'Trabajo',
    sortable: true,
    width: '16%',
    render: (value, row) => (
      <div className="space-y-1">
        <div className="text-sm font-semibold text-gray-700 flex items-center">
          <div className="w-5 h-5 bg-gradient-to-r from-[#B39237] to-[#D4AF37] rounded flex items-center justify-center mr-2">
            <i className="bx bx-briefcase text-xs text-white"></i>
          </div>
          {row.cargo}
        </div>
        <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-md inline-block border">
          {row.nombre_area || 'Sin área asignada'}
        </div>
      </div>
    )
  },
  {
    key: 'estado',
    label: 'Estado',
    align: 'center',
    width: '22%',
    render: (value, row) => (
      <div className="flex items-center justify-center space-x-2 w-full">
        {/* Badge de estado - tamaño optimizado */}
        <div className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm transition-all duration-200 min-w-[75px] h-[32px] ${
          row.estado 
            ? 'bg-gradient-to-r from-[#B39237] to-[#D4AF37] text-white hover:shadow-md' 
            : 'bg-gray-500 text-white'
        }`}>
          <i className={`bx ${row.estado ? 'bx-check-circle' : 'bx-x-circle'} text-sm mr-1`}></i>
          <span>{row.estado ? 'Activo' : 'Inactivo'}</span>
        </div>
        
        {/* Separador visual más delgado */}
        <div className="h-6 w-px bg-gray-300"></div>
        
        {/* Información salarial - tamaño optimizado */}
        <div className={`bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-100 transition-colors duration-200 min-w-[110px] h-[32px] flex flex-col justify-center ${
          !row.sueldo ? 'opacity-60' : ''
        }`}>
          <div className="text-xs text-gray-600 font-medium leading-none">Sueldo</div>
          <div className="text-xs font-bold text-gray-800 font-mono leading-none mt-0.5">
            {row.sueldo ? `$${parseFloat(row.sueldo).toLocaleString()}` : 'No definido'}
          </div>
        </div>
      </div>
    )
  },
  {
    key: 'kit_info',
    label: 'Kit',
    width: '14%',
    render: (value, row) => (
      <div className="text-sm text-gray-900">
        {row.kit_nombre || 'Sin kit asignado'}
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
  { key: 'kit_nombre', label: 'Kit' },
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
  const [currentUser] = useStoredUser();
  const [empleados, setEmpleados] = useState([]);
  const [areas, setAreas] = useState([]);
  const [generos, setGeneros] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [kits, setKits] = useState([]);
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

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Toast notification system
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const empleadoColumns = useMemo(() => buildEmpleadoColumns(currentUser), [currentUser]);

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
      const token = getToken();
      
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
      const token = getToken();
      
      // Traer solo áreas activas
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
      const token = getToken();
      
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
      const token = getToken();
      
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

  // Cargar kits disponibles (activos)
  const cargarKits = useCallback(async () => {
    try {
      const token = getToken();
      const response = await fetch('/api/kits', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const result = await response.json();
        setKits(result.data || []);
      } else {
        console.error('Error al cargar kits:', response.status);
        // No mostrar toast de error para no molestar si no es crítico
      }
    } catch (error) {
      console.error('Error al cargar kits:', error);
    }
  }, []);

  // Cargar datos al iniciar el componente
  useEffect(() => {
    cargarEmpleados();
    cargarAreas();
    cargarGeneros();
    cargarUbicaciones();
    cargarKits();
  }, [cargarEmpleados, cargarAreas, cargarGeneros, cargarUbicaciones, cargarKits]);

  useEffect(() => {
    if (!currentUser?.id_empleado) {
      return;
    }
    setEmpleados((prev) => prev.map((empleado) => (
      empleado.id_empleado === currentUser.id_empleado
        ? {
            ...empleado,
            avatar_url: currentUser.avatar_url ?? empleado.avatar_url,
            avatar_color: currentUser.avatar_color ?? empleado.avatar_color
          }
        : empleado
    )));
  }, [currentUser?.id_empleado, currentUser?.avatar_url, currentUser?.avatar_color]);

  // Función de búsqueda avanzada con useCallback
  const buscarEmpleados = useCallback(async (termino) => {
    if (!termino || termino.trim().length < 2) {
      return; // No buscar si el término es muy corto
    }

    try {
      const token = getToken();
      
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

  // Lógica de paginación
  const totalPages = Math.ceil(empleadosFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const empleadosPaginados = empleadosFiltrados.slice(startIndex, endIndex);

  // Resetear página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, estadoFiltro]);

  // Función para crear empleado con validaciones mejoradas
  const crearEmpleado = useCallback(async (empleadoData) => {
    try {
      setIsSubmitting(true);
      const token = getToken();
      
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
      const token = getToken();
      
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
      const token = getToken();
      
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
      estado: empleado.estado ? 1 : 0,
      // id_kit opcional: si viene null/undefined, dejar vacío para el select
      id_kit: empleado.id_kit ?? ''
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
      if (field.name === 'id_kit') {
        return {
          ...field,
          placeholder: 'Selecciona un kit del área',
          // Pasar todas las opciones con id_area para filtrar dinámicamente en el modal
          optionsAll: kits.map(k => ({
            value: k.id_kit,
            label: `${k.nombre}${k.nombre_area ? ' (' + k.nombre_area + ')' : ''}`,
            id_area: k.id_area
          }))
        };
      }
      return field;
    });
  }, [areas, generos, ubicaciones, kits]);

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
    <div className="space-y-6 overflow-hidden">
      {/* Toast Notification Mejorado */}
      {toast.show && (
        <div 
          className={`fixed top-4 right-4 left-4 sm:left-auto z-[9999] p-4 rounded-lg shadow-2xl transition-all duration-300 transform ${
            toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            toast.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            toast.type === 'warning' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
            'bg-blue-50 text-blue-800 border border-blue-200'
          } max-w-md sm:max-w-sm md:max-w-md`}
          style={{ filter: 'none', backdropFilter: 'none' }}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {toast.type === 'success' && (
                <i className="bx bx-check-circle text-xl text-green-400"></i>
              )}
              {toast.type === 'error' && (
                <i className="bx bx-error-circle text-xl text-red-400"></i>
              )}
              {toast.type === 'warning' && (
                <i className="bx bx-error text-xl text-yellow-400"></i>
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
                <i className="bx bx-x text-xl"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Encabezado y métricas */}
      <ResourceHeader
        title="Gestión de Empleados"
        subtitle="Administra la información de los empleados de Arroz Sonora"
        stats={[
          { icon: 'bx-group', label: 'Total', value: empleados.length },
          { icon: 'bx-check-circle', label: 'Activos', value: empleados.filter(emp => emp.estado).length },
          { icon: 'bx-x-circle', label: 'Inactivos', value: empleados.filter(emp => !emp.estado).length }
        ]}
        action={(
          <button
            onClick={handleCrearEmpleado}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#B39237] hover:from-[#B39237] hover:to-[#9C7F2F] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-[#E2BE69] focus:ring-offset-2"
          >
            <i className="bx bx-plus"></i>
            Nuevo Empleado
          </button>
        )}
      />

      {/* Filtros */}
      <CardPanel title="Filtros" icon="bx-filter">
        <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-3 md:gap-4 md:items-end">
          {/* Búsqueda principal */}
          <div className="md:col-span-2">
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
              Buscar empleado
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ID, nombre, apellido, email, cargo..."
                className="w-full pl-10 pr-3 py-2 md:py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B39237] focus:border-[#B39237]"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="bx bx-search text-xl text-gray-400"></i>
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <i className="bx bx-x text-xl text-gray-400 hover:text-gray-600"></i>
                </button>
              )}
            </div>
          </div>

          {/* Filtro por estado */}
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Estado</label>
            <select
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B39237] focus:border-[#B39237]"
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
          </div>
        </div>
      </CardPanel>

      {/* Tabla de empleados */}
      <CardPanel
        title="Lista de Empleados"
        icon="bx-spreadsheet"
        actions={(
          <div className="hidden sm:block">
            <button
              onClick={handleCrearEmpleado}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#B39237] to-[#D4AF37] text-white px-4 py-2 rounded-lg hover:from-[#A0812F] hover:to-[#C19B2F] transition-all duration-200 shadow-md"
            >
              <i className="bx bx-plus"></i>
              <span>Nuevo</span>
            </button>
          </div>
        )}
      >
        <div className="border-b border-gray-200 px-5 py-3 text-sm text-gray-600">
          Mostrando {startIndex + 1} a {Math.min(endIndex, empleadosFiltrados.length)} de {empleadosFiltrados.length} empleados
        </div>

        <div className="overflow-x-auto">
          <DataTable
            data={empleadosPaginados}
            columns={empleadoColumns}
            onRowAction={handleRowAction}
            loading={isLoading}
            emptyMessage="No se encontraron empleados"
            rowActions={['view', 'edit', 'toggle']}
            rowKey="id_empleado"
            showSearch={false}
            showToolbar={false}
          />
        </div>

        {/* Paginador */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-xs md:text-sm text-gray-700 text-center sm:text-left">
                Mostrando {startIndex + 1} a {Math.min(endIndex, empleadosFiltrados.length)} de {empleadosFiltrados.length} empleados
              </div>
              
              <div className="flex items-center justify-center space-x-1 md:space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-2 md:px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <i className="bx bx-chevron-left text-lg"></i>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-2 md:px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-[#B39237] text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-2 md:px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <i className="bx bx-chevron-right text-lg"></i>
                </button>
              </div>
            </div>
          </div>
        )}
      </CardPanel>

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
            id_ubicacion: '',
            id_kit: ''
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
