import React, { useState, useEffect } from 'react';
import DataTable from '../components/DataTable/DataTable';
import { ViewModal, EditModal } from '../components/Modal';
import ResourceHeader from '../components/UI/ResourceHeader';
import CardPanel from '../components/UI/CardPanel';

// Configuración de columnas para la tabla de ubicaciones
const UBICACIONES_COLUMNS = [
  {
    key: 'nombre',
    label: 'Nombre',
    sortable: true,
    width: '35%',
    render: (value, row) => (
      <div className="flex items-center py-2 px-3">
        <div className="w-8 h-8 bg-gradient-to-r from-[#B39237] to-[#D4AF37] rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
          <i className="bx bx-map-pin text-white text-sm"></i>
        </div>
        <div className="ml-3 min-w-0 flex-1">
          <div className="text-sm font-semibold text-gray-700">
            {value}
          </div>
          <div className="text-xs text-gray-500">
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
    width: '25%',
    render: (value, row) => {
      const getTypeConfig = (tipo) => {
        switch (tipo) {
          case 'planta':
            return {
              color: 'text-[#B39237]',
              icon: 'bx-buildings',
              label: 'Planta'
            };
          case 'maquila':
            return {
              color: 'text-gray-600',
              icon: 'bx-cog',
              label: 'Maquila'
            };
          case 'bodega':
          default:
            return {
              color: 'text-gray-600',
              icon: 'bx-package',
              label: 'Bodega'
            };
        }
      };

      const config = getTypeConfig(value);
      
      return (
        <div className="flex items-center py-2 px-2">
          <span className={`inline-flex items-center text-sm font-bold ${config.color}`}>
            <i className={`bx ${config.icon} text-base mr-2`}></i>
            {config.label}
          </span>
        </div>
      );
    }
  },
  {
    key: 'direccion',
    label: 'Dirección',
    width: '40%',
    render: (value, row) => (
      <div className="flex items-center py-2 px-3">
        <div className="w-6 h-6 bg-gray-400 rounded flex items-center justify-center flex-shrink-0">
          <i className="bx bx-map text-white text-xs"></i>
        </div>
        <div className="ml-2 text-sm text-gray-700 min-w-0 flex-1">
          {value || <span className="text-gray-400 italic">No especificada</span>}
        </div>
      </div>
    )
  }
];

// Configuración de campos para el modal de vista
const UBICACION_VIEW_FIELDS = [
  { key: 'id_ubicacion', label: 'ID' },
  { key: 'nombre', label: 'Nombre' },
  { 
    key: 'tipo', 
    label: 'Tipo', 
    render: (value) => {
      switch (value) {
        case 'planta': return 'Planta';
        case 'maquila': return 'Maquila';
        case 'bodega': return 'Bodega';
        default: return value;
      }
    }
  },
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
      { value: 'planta', label: 'Planta' },
      { value: 'maquila', label: 'Maquila' },
      { value: 'bodega', label: 'Bodega' }
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
  <div className="p-6 w-full space-y-6">
      <ResourceHeader
        title="Gestión de Ubicaciones"
        subtitle="Administra las plantas, bodegas y maquilas del sistema"
        stats={[
          { icon: 'bx-map-pin', label: 'Total', value: ubicaciones.length },
          { icon: 'bx-buildings', label: 'Plantas', value: ubicaciones.filter(u => u.tipo === 'planta').length },
          { icon: 'bx-cog', label: 'Maquilas', value: ubicaciones.filter(u => u.tipo === 'maquila').length },
          { icon: 'bx-package', label: 'Bodegas', value: ubicaciones.filter(u => u.tipo === 'bodega').length }
        ]}
        action={(
          <button
            onClick={handleNewUbicacion}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#B39237] hover:from-[#B39237] hover:to-[#9C7F2F] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-[#E2BE69] focus:ring-offset-2"
          >
            <i className="bx bx-plus"></i>
            Nueva Ubicación
          </button>
        )}
      />

      {/* Mensajes de error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-xl">
          {error}
        </div>
      )}

      {/* Tabla dentro de CardPanel */}
      <CardPanel title="Listado de Ubicaciones" icon="bx-map">
        <DataTable
          columns={UBICACIONES_COLUMNS}
          data={ubicacionesFiltradas}
          rowKey="id_ubicacion"
          loading={isLoading}
          error={error}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          onRowAction={handleRowAction}
          rowActions={['view', 'edit', 'delete']}
          emptyState={
            <div className="p-8 text-center text-gray-500">
              <i className="bx bx-map-pin text-4xl text-gray-400 mb-4"></i>
              <h3 className="text-lg font-medium text-gray-700 mb-2">No hay ubicaciones disponibles</h3>
              <p className="text-gray-500 mb-4">Comience creando una nueva ubicación</p>
              <button
                onClick={handleNewUbicacion}
                className="bg-gradient-to-r from-[#B39237] to-[#D4AF37] hover:from-[#A0812F] hover:to-[#C19B2F] text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 mx-auto"
              >
                <i className="bx bx-plus"></i>
                <span>Crear Primera Ubicación</span>
              </button>
            </div>
          }
        />
      </CardPanel>

      

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