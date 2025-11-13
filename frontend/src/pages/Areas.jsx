import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/DataTable/DataTable';
import { ViewModal, EditModal } from '../components/Modal';
import ResourceHeader from '../components/UI/ResourceHeader';
import CardPanel from '../components/UI/CardPanel';

// Configuración de columnas para la tabla de áreas
const AREAS_COLUMNS = [
  {
    key: 'nombre_area',
    label: 'Área',
    sortable: true,
    render: (value, row) => (
      <div className="flex items-center">
        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
          <span className="text-purple-600 font-medium text-sm">
            {value?.charAt(0)?.toUpperCase() || 'A'}
          </span>
        </div>
        <div className="ml-4">
          <div className="text-sm font-medium text-gray-900">
            {value}
          </div>
          <div className="text-sm text-gray-500">
            ID: {row.id_area}
          </div>
        </div>
      </div>
    )
  },
  {
    key: 'ubicacion_info',
    label: 'Ubicación',
    sortable: true,
    render: (value, row) => (
      <div>
        <div className="text-sm font-medium text-gray-900">
          {row.nombre_ubicacion}
        </div>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          row.tipo_ubicacion === 'planta' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-green-100 text-green-800'
        }`}>
          {row.tipo_ubicacion === 'planta' ? '🏭 Planta' : '📦 Bodega'}
        </span>
      </div>
    )
  },
  {
    key: 'estado',
    label: 'Estado',
    align: 'center',
    render: (value, row) => (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        row.estado 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {row.estado ? 'Activa' : 'Inactiva'}
      </span>
    )
  }
];

// Configuración de campos para el modal de vista
const AREA_VIEW_FIELDS = [
  { key: 'id_area', label: 'ID del Área' },
  { key: 'nombre_area', label: 'Nombre del Área' },
  { key: 'nombre_ubicacion', label: 'Ubicación' },
  { 
    key: 'tipo_ubicacion', 
    label: 'Tipo de Ubicación', 
    render: (value) => value === 'planta' ? '🏭 Planta' : '📦 Bodega' 
  },
  { 
    key: 'estado', 
    label: 'Estado',
    render: (value) => value ? 'Activa' : 'Inactiva'
  }
];

// Configuración de campos para el modal de edición
const AREA_FORM_FIELDS = [
  {
    name: 'nombre_area',
    label: 'Nombre del Área',
    type: 'text',
    required: true,
    placeholder: 'Nombre del área',
    fullWidth: true
  },
  {
    name: 'id_ubicacion',
    label: 'Ubicación',
    type: 'select',
    required: true,
    placeholder: 'Seleccionar ubicación',
    fullWidth: true,
    options: [] // Se llenará dinámicamente
  }
];

// Reglas de validación para áreas
const AREA_VALIDATION_RULES = {
  nombre_area: { required: true },
  id_ubicacion: { required: true }
};

export default function Areas() {
  const [areas, setAreas] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para modales
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const [editingArea, setEditingArea] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para búsqueda y filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [mostrarInactivas, setMostrarInactivas] = useState(false);

  // Toast notification system
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Show toast function
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 2500);
  };

  // Fix: Usar useCallback para evitar bucle infinito en useEffect
  // La función cargarAreas necesita ser memoizada ya que se usa en dependencias
  const cargarAreas = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      // Usar endpoint específico según si se quieren ver inactivas
      const endpoint = mostrarInactivas ? '/api/areas/todas' : '/api/areas';
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setAreas(result.data || []);
        setError('');
      } else {
        setError('Error al cargar áreas');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  }, [mostrarInactivas]); // Dependencia: solo se recrea cuando cambia mostrarInactivas

  // Fix: También memoizar cargarUbicaciones para mantener consistencia y evitar warnings
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
        console.error('Error al cargar ubicaciones');
      }
    } catch (error) {
      console.error('Error al cargar ubicaciones:', error);
    }
  }, []); // Sin dependencias ya que no usa estado local

  // Cargar áreas y ubicaciones al iniciar el componente
  useEffect(() => {
    cargarAreas();
    cargarUbicaciones();
  }, [cargarAreas, cargarUbicaciones]); // Fix: agregar ambas funciones como dependencias

  // Fix: Eliminar el segundo useEffect ya que cargarAreas ya tiene mostrarInactivas como dependencia
  // y se ejecutará automáticamente cuando cambie ese valor

  // Manejar envío del formulario
  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      
      const url = editingArea 
        ? `/api/areas/${editingArea.id_area}`
        : '/api/areas';
      
      const method = editingArea ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (result.success) {
        await cargarAreas();
        setShowEditModal(false);
        setEditingArea(null);
        showToast(result.message, 'success');
        setError('');
      } else {
        showToast(result.message || 'Error al guardar área', 'error');
      }
    } catch (error) {
      console.error('Error al guardar área:', error);
      showToast('Error al guardar área', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejar acciones de fila del DataTable
  const handleRowAction = (action, area) => {
    switch (action) {
      case 'view':
        setSelectedArea(area);
        setShowViewModal(true);
        break;
      case 'edit':
        setEditingArea(area);
        setShowEditModal(true);
        break;
      case 'delete':
        inactivarArea(area);
        break;
      default:
        break;
    }
  };

  // Función para inactivar área
  const inactivarArea = async (area) => {
    if (!window.confirm(`¿Estás seguro de inactivar el área "${area.nombre_area}"?\n\nEsta acción ocultará el área de los listados, pero se mantendrá en el sistema para auditoría.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/areas/${area.id_area}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        await cargarAreas(); // Recargar lista
        showToast(result.message, 'success');
      } else {
        showToast(result.message || 'Error al inactivar área', 'error');
      }
    } catch (error) {
      console.error('Error al inactivar área:', error);
      showToast('Error al inactivar área', 'error');
    }
  };

  const handleNewArea = () => {
    setEditingArea(null);
    setShowEditModal(true);
  };

  // Función para filtrar áreas
  const areasFiltradas = areas.filter(area =>
    area.nombre_area?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    area.nombre_ubicacion?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    area.tipo_ubicacion?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Preparar opciones de ubicaciones para el formulario
  const ubicacionesOptions = ubicaciones.map(ubicacion => ({
    value: ubicacion.id_ubicacion,
    label: `${ubicacion.nombre} (${ubicacion.tipo})`
  }));

  // Actualizar campos del formulario con opciones de ubicaciones
  const formFieldsWithOptions = AREA_FORM_FIELDS.map(field => {
    if (field.name === 'id_ubicacion') {
      return { ...field, options: ubicacionesOptions };
    }
    return field;
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 w-full">
      <ResourceHeader
        title="Gestión de Áreas"
        subtitle="Administra las áreas de trabajo del sistema"
        stats={[
          { icon: 'bx-grid-alt', label: 'Total Áreas', value: areas.length },
          { icon: 'bx-toggle-left', label: 'Activas', value: areas.filter(a => a.estado).length },
          { icon: 'bx-buildings', label: 'Plantas', value: areas.filter(a => a.tipo_ubicacion === 'planta').length },
          { icon: 'bx-box', label: 'Bodegas', value: areas.filter(a => a.tipo_ubicacion === 'bodega').length }
        ]}
        action={(
          <div className="flex items-center gap-4">
            <label className="flex items-center text-xs text-[#6F581B] bg-white/70 px-3 py-2 rounded-lg ring-1 ring-[#E2BE69]/40">
              <input
                type="checkbox"
                checked={mostrarInactivas}
                onChange={(e) => setMostrarInactivas(e.target.checked)}
                className="mr-2 h-4 w-4 text-[#B39237] focus:ring-[#B39237] border-[#E2BE69] rounded"
              />
              Mostrar inactivas
            </label>
            <button
              onClick={handleNewArea}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#B39237] hover:from-[#B39237] hover:to-[#9C7F2F] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-[#E2BE69] focus:ring-offset-2"
            >
              <i className="bx bx-plus"></i>
              Nueva Área
            </button>
          </div>
        )}
      />

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-xl">
          {error}
        </div>
      )}

      <CardPanel title="Listado de Áreas" icon="bx-list-ul" actions={null}>
        <DataTable
          columns={AREAS_COLUMNS}
          data={areasFiltradas}
          rowKey="id_area"
          loading={isLoading}
          error={error}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          onRowAction={handleRowAction}
          actions={[
            {
              label: 'Ver',
              action: 'view',
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ),
              className: 'text-blue-600 hover:text-blue-900'
            },
            {
              label: 'Editar',
              action: 'edit',
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              ),
              className: 'text-green-600 hover:text-green-900'
            },
            {
              label: 'Inactivar',
              action: 'delete',
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                </svg>
              ),
              className: 'text-red-600 hover:text-red-900'
            }
          ]}
          emptyState={{
            icon: (
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            ),
            title: 'No hay áreas disponibles',
            description: 'Comience creando una nueva área de trabajo',
            action: {
              label: 'Crear Primera Área',
              onClick: handleNewArea
            }
          }}
        />
      </CardPanel>

      {/* Modal de Vista */}
      <ViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detalles del Área"
        data={selectedArea}
        fields={AREA_VIEW_FIELDS}
        size="md"
      />

      {/* Modal de Edición */}
      <EditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleSubmit}
        title={editingArea ? 'Editar Área' : 'Nueva Área'}
        initialData={editingArea || {}}
        fields={formFieldsWithOptions}
        validationRules={AREA_VALIDATION_RULES}
        size="md"
        isSubmitting={isSubmitting}
        submitText={editingArea ? 'Actualizar' : 'Crear'}
      />

      {/* Toast Notification with Animated Icons */}
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 flex items-center space-x-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all duration-300 transform ${
            toast.type === 'success'
              ? 'bg-green-600 animate-fade-in-up'
              : 'bg-red-600 animate-fade-in-up'
          }`}
          style={{
            animation: 'fade-in-up 0.4s ease-out'
          }}
        >
          {/* Icono dinámico */}
          <div className="flex-shrink-0">
            {toast.type === 'success' ? (
              <span className="animate-bounce text-xl">✅</span>
            ) : (
              <span className="animate-pulse text-xl">❌</span>
            )}
          </div>

          {/* Mensaje */}
          <div>{toast.message}</div>
        </div>
      )}

      {/* Custom CSS Animation */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}