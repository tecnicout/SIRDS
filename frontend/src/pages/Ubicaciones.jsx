import React, { useState, useEffect } from 'react';
import DataTable from '../components/DataTable/DataTable';
import { ViewModal, EditModal } from '../components/Modal';

// Configuración de columnas para la tabla de ubicaciones
const UBICACIONES_COLUMNS = [
  {
    key: 'nombre',
    label: 'Nombre',
    sortable: true,
    render: (value, row) => (
      <div className="flex items-center">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-blue-600 font-medium text-sm">
            {value?.charAt(0)?.toUpperCase() || 'U'}
          </span>
        </div>
        <div className="ml-4">
          <div className="text-sm font-medium text-gray-900">
            {value}
          </div>
          <div className="text-sm text-gray-500">
            ID: {row.id_ubicacion}
          </div>
        </div>
      </div>
    )
  },
  {
    key: 'tipo',
    label: 'Tipo',
    sortable: true,
    render: (value, row) => (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        value === 'planta' 
          ? 'bg-blue-100 text-blue-800' 
          : 'bg-green-100 text-green-800'
      }`}>
        {value === 'planta' ? '🏭 Planta' : '📦 Bodega'}
      </span>
    )
  },
  {
    key: 'direccion',
    label: 'Dirección',
    render: (value, row) => (
      <div className="text-sm text-gray-900 max-w-xs truncate">
        {value || 'No especificada'}
      </div>
    )
  }
];

// Configuración de campos para el modal de vista
const UBICACION_VIEW_FIELDS = [
  { key: 'id_ubicacion', label: 'ID' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'tipo', label: 'Tipo', render: (value) => value === 'planta' ? '🏭 Planta' : '📦 Bodega' },
  { key: 'direccion', label: 'Dirección' }
];

// Configuración de campos para el modal de edición
const UBICACION_FORM_FIELDS = [
  {
    name: 'nombre',
    label: 'Nombre',
    type: 'text',
    required: true,
    placeholder: 'Nombre de la ubicación',
    fullWidth: false
  },
  {
    name: 'tipo',
    label: 'Tipo',
    type: 'select',
    required: true,
    fullWidth: false,
    options: [
      { value: 'planta', label: '🏭 Planta' },
      { value: 'bodega', label: '📦 Bodega' }
    ]
  },
  {
    name: 'direccion',
    label: 'Dirección',
    type: 'textarea',
    placeholder: 'Dirección de la ubicación',
    rows: 3,
    fullWidth: true
  }
];

// Reglas de validación para ubicaciones
const UBICACION_VALIDATION_RULES = {
  nombre: { required: true },
  tipo: { required: true }
};

export default function Ubicaciones() {
  const [ubicaciones, setUbicaciones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para modales
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUbicacion, setSelectedUbicacion] = useState(null);
  const [editingUbicacion, setEditingUbicacion] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para búsqueda y filtros
  const [searchQuery, setSearchQuery] = useState('');

  // Cargar ubicaciones al iniciar el componente
  useEffect(() => {
    cargarUbicaciones();
  }, []);

  const cargarUbicaciones = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/ubicaciones', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setUbicaciones(result.data || []);
        setError('');
      } else {
        throw new Error(result.message || 'Error al cargar ubicaciones');
      }
    } catch (error) {
      console.error('Error al cargar ubicaciones:', error);
      setError('Error al cargar las ubicaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const url = editingUbicacion 
        ? `/api/ubicaciones/${editingUbicacion.id_ubicacion}`
        : '/api/ubicaciones';
      
      const method = editingUbicacion ? 'PUT' : 'POST';
      
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
        await cargarUbicaciones();
        setShowEditModal(false);
        setEditingUbicacion(null);
        setError('');
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Error al guardar ubicación:', error);
      setError('Error al guardar la ubicación');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejar acciones de fila del DataTable
  const handleRowAction = (action, ubicacion) => {
    switch (action) {
      case 'view':
        setSelectedUbicacion(ubicacion);
        setShowViewModal(true);
        break;
      case 'edit':
        setEditingUbicacion(ubicacion);
        setShowEditModal(true);
        break;
      case 'delete':
        handleDelete(ubicacion);
        break;
      default:
        break;
    }
  };

  const handleEdit = (ubicacion) => {
    setEditingUbicacion(ubicacion);
    setShowEditModal(true);
  };

  const handleDelete = async (ubicacion) => {
    if (window.confirm(`¿Está seguro de eliminar la ubicación "${ubicacion.nombre}"?`)) {
      try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`/api/ubicaciones/${ubicacion.id_ubicacion}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const result = await response.json();
        
        if (result.success) {
          await cargarUbicaciones();
          setError('');
          // Mostrar mensaje si había áreas reasignadas
          if (result.data && result.data.areasReasignadas > 0) {
            alert(`Ubicación eliminada. Se reasignaron ${result.data.areasReasignadas} área(s) a ubicación temporal.`);
          }
        } else {
          setError(result.message);
        }
      } catch (error) {
        console.error('Error al eliminar ubicación:', error);
        setError('Error al eliminar la ubicación');
      }
    }
  };

  const handleNewUbicacion = () => {
    setEditingUbicacion(null);
    setShowEditModal(true);
  };

  // Función para filtrar ubicaciones
  const ubicacionesFiltradas = ubicaciones.filter(ubicacion =>
    ubicacion.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ubicacion.tipo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ubicacion.direccion?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Ubicaciones</h1>
          <p className="text-gray-600">Administra las plantas y bodegas del sistema</p>
        </div>
        <button
          onClick={handleNewUbicacion}
          className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-5 py-2.5 font-medium transition-all duration-200 flex items-center gap-2 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Ubicación
        </button>
      </div>

      {/* Mensajes de error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-xl">
          {error}
        </div>
      )}

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {ubicaciones.length}
              </p>
              <p className="text-gray-600 text-sm">
                Total Ubicaciones
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {ubicaciones.filter(u => u.tipo === 'planta').length}
              </p>
              <p className="text-gray-600 text-sm">
                Plantas
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏭</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {ubicaciones.filter(u => u.tipo === 'bodega').length}
              </p>
              <p className="text-gray-600 text-sm">
                Bodegas
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
          </div>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={UBICACIONES_COLUMNS}
        data={ubicacionesFiltradas}
        rowKey="id_ubicacion"
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
            label: 'Eliminar',
            action: 'delete',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            ),
            className: 'text-red-600 hover:text-red-900'
          }
        ]}
        emptyState={{
          icon: (
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
          title: 'No hay ubicaciones disponibles',
          description: 'Comience creando una nueva ubicación',
          action: {
            label: 'Crear Primera Ubicación',
            onClick: handleNewUbicacion
          }
        }}
      />

      {/* Modal de Vista */}
      <ViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detalles de Ubicación"
        data={selectedUbicacion}
        fields={UBICACION_VIEW_FIELDS}
        size="md"
      />

      {/* Modal de Edición */}
      <EditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleSubmit}
        title={editingUbicacion ? 'Editar Ubicación' : 'Nueva Ubicación'}
        initialData={editingUbicacion || { tipo: 'planta' }}
        fields={UBICACION_FORM_FIELDS}
        validationRules={UBICACION_VALIDATION_RULES}
        size="md"
        isSubmitting={isSubmitting}
        submitText={editingUbicacion ? 'Actualizar' : 'Crear'}
      />
    </div>
  );
}