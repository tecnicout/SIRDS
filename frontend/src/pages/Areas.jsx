import React, { useState, useEffect, useCallback } from 'react';
import { ViewModal, EditModal } from '../components/Modal';
import ResourceHeader from '../components/UI/ResourceHeader';
import CardPanel from '../components/UI/CardPanel';
import { getToken } from '../utils/tokenStorage';

const LOCATION_FILTERS = [
  { key: 'all', label: 'Todas' },
  { key: 'planta', label: 'Plantas' },
  { key: 'bodega', label: 'Bodegas' }
];

// Configuración de campos para el modal de vista
const AREA_VIEW_FIELDS = [
  { key: 'id_area', label: 'ID del Área' },
  { key: 'nombre_area', label: 'Nombre del Área' },
  { key: 'nombre_ubicacion', label: 'Ubicación' },
  { 
    key: 'tipo_ubicacion', 
    label: 'Tipo de Ubicación', 
    render: (value) => (value?.toLowerCase() === 'planta') ? '🏭 Planta' : '📦 Bodega' 
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
  const [tipoFiltro, setTipoFiltro] = useState('all');

  const isAreaActive = (area) => String(area?.estado ?? '').toLowerCase() === 'activa';

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
      const token = getToken();
      
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
      const token = getToken();
      
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
        if (isAreaActive(area)) {
          inactivarArea(area);
        } else {
          reactivarArea(area);
        }
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
      const token = getToken();
      
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

  const reactivarArea = async (area) => {
    if (!window.confirm(`¿Deseas reactivar el área "${area.nombre_area}" y volver a mostrarla como disponible?`)) {
      return;
    }

    try {
      const token = getToken();

      const response = await fetch(`/api/areas/${area.id_area}/reactivar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        await cargarAreas();
        showToast(result.message, 'success');
      } else {
        showToast(result.message || 'Error al reactivar área', 'error');
      }
    } catch (error) {
      console.error('Error al reactivar área:', error);
      showToast('Error al reactivar área', 'error');
    }
  };

  const handleNewArea = () => {
    setEditingArea(null);
    setShowEditModal(true);
  };

  // Función para filtrar áreas
  const areasFiltradas = areas.filter((area) => {
    const query = searchQuery.toLowerCase();
    const tipo = area.tipo_ubicacion?.toLowerCase() || '';
    const matchesSearch =
      area.nombre_area?.toLowerCase().includes(query) ||
      area.nombre_ubicacion?.toLowerCase().includes(query) ||
      tipo.includes(query);
    const matchesTipo = tipoFiltro === 'all' || tipo === tipoFiltro;
    return matchesSearch && matchesTipo;
  });

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
          { icon: 'bx-toggle-left', label: 'Activas', value: areas.filter(isAreaActive).length },
          { icon: 'bx-buildings', label: 'Plantas', value: areas.filter(a => a.tipo_ubicacion?.toLowerCase() === 'planta').length },
          { icon: 'bx-box', label: 'Bodegas', value: areas.filter(a => a.tipo_ubicacion?.toLowerCase() === 'bodega').length }
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
        <div className="space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="relative">
                <i className="bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre, ubicación o tipo"
                  className="w-full rounded-2xl border border-gray-200 bg-white px-10 py-2.5 text-sm text-gray-700 focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#E2BE69]/50"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {LOCATION_FILTERS.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setTipoFiltro(filter.key)}
                  className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                    tipoFiltro === filter.key
                      ? 'border-[#E2BE69] bg-[#FFF8E7] text-[#6F581B]' : 'border-gray-200 bg-white text-gray-600 hover:border-[#E2BE69]/60'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {areasFiltradas.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white/80 px-6 py-12 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F9F4E7] text-[#B39237]">
                <i className="bx bx-buildings text-2xl"></i>
              </div>
              <p className="text-base font-semibold text-gray-800">No encontramos áreas con los filtros actuales.</p>
              <p className="mt-1 text-sm text-gray-500">Prueba ajustar la búsqueda o crea una nueva área.</p>
              <button
                onClick={handleNewArea}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#B39237] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#9C7F2F]"
              >
                <i className="bx bx-plus"></i>
                Crear Área
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {areasFiltradas.map((area) => {
                const isActive = isAreaActive(area);
                const cardClasses = `rounded-3xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
                  isActive ? 'border-gray-100 bg-white/90' : 'border-red-100 bg-red-50/80'
                }`;
                const avatarClasses = `flex h-12 w-12 items-center justify-center rounded-2xl text-base font-bold ${
                  isActive
                    ? 'bg-gradient-to-br from-[#F7E8C6] to-[#E2BE69] text-[#6F581B]'
                    : 'bg-gradient-to-br from-red-200 to-red-100 text-red-700'
                }`;
                const nameClasses = `text-base font-semibold ${
                  isActive ? 'text-gray-900' : 'text-gray-500'
                }`;

                return (
                  <div key={area.id_area} className={cardClasses}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={avatarClasses}>
                          {area.nombre_area?.charAt(0)?.toUpperCase() || 'A'}
                        </div>
                        <p className={nameClasses}>{area.nombre_area}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[0.65rem] font-semibold ${
                        isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                      }`}>
                        {isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleRowAction('edit', area)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#D4AF37] bg-[#FFF8E7] px-3 py-2 text-xs font-semibold text-[#6F581B] hover:bg-[#F9EDCC]"
                      >
                        <i className="bx bx-edit"></i>
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRowAction('delete', area)}
                        className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${
                          isActive
                            ? 'border-red-100 text-red-600 hover:bg-red-50'
                            : 'border-green-100 text-green-600 hover:bg-green-50'
                        }`}
                      >
                        <i className={`bx ${isActive ? 'bx-block' : 'bx-refresh'}`}></i>
                        {isActive ? 'Inactivar' : 'Reactivar'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
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