import React, { useState, useEffect } from 'react';
import { ViewModal, EditModal } from '../components/Modal';
import Modal from '../components/Modal/Modal';
import ResourceHeader from '../components/UI/ResourceHeader';
import CardPanel from '../components/UI/CardPanel';
import { getToken } from '../utils/tokenStorage';

const TIPO_FILTERS = [
  { key: 'all', label: 'Todas' },
  { key: 'planta', label: 'Plantas' },
  { key: 'maquila', label: 'Maquilas' },
  { key: 'bodega', label: 'Bodegas' }
];

const TIPO_META = {
  planta: {
    icon: 'bx-buildings',
    label: 'Planta',
    badge: 'bg-blue-50 text-blue-700',
    chip: 'bg-blue-100/70 text-blue-800'
  },
  maquila: {
    icon: 'bx-cog',
    label: 'Maquila',
    badge: 'bg-purple-50 text-purple-700',
    chip: 'bg-purple-100/70 text-purple-800'
  },
  bodega: {
    icon: 'bx-package',
    label: 'Bodega',
    badge: 'bg-emerald-50 text-emerald-700',
    chip: 'bg-emerald-100/70 text-emerald-800'
  }
};

const DEFAULT_META = {
  icon: 'bx-map',
  label: 'Ubicación',
  badge: 'bg-gray-100 text-gray-600',
  chip: 'bg-gray-100 text-gray-700'
};

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
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [empleadosRelacionados, setEmpleadosRelacionados] = useState([]);
  const [ubicacionPendiente, setUbicacionPendiente] = useState(null);
  const [nuevaUbicacionId, setNuevaUbicacionId] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);
  const [reassignError, setReassignError] = useState('');

  // Estados para búsqueda y filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('all');

  // Cargar ubicaciones al iniciar el componente
  useEffect(() => {
    cargarUbicaciones();
  }, []);

  const cargarUbicaciones = async () => {
    try {
      setIsLoading(true);
      const token = getToken();
      
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
      const token = getToken();
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

  const performDelete = async (ubicacion) => {
    try {
      const token = getToken();

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
        if (result.data && result.data.areasReasignadas > 0) {
          alert(`Ubicación eliminada. ${result.data.areasReasignadas} registro(s) se reasignaron temporalmente.`);
        }
        return true;
      }

      setError(result.message);
      return false;
    } catch (error) {
      console.error('Error al eliminar ubicación:', error);
      setError('Error al eliminar la ubicación');
      return false;
    }
  };

  const handleDelete = async (ubicacion) => {
    setReassignError('');
    try {
      const token = getToken();
      const response = await fetch(`/api/ubicaciones/${ubicacion.id_ubicacion}/empleados`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Error al verificar empleados relacionados');
      }

      if (result.data && result.data.length > 0) {
        setEmpleadosRelacionados(result.data);
        setUbicacionPendiente(ubicacion);
        setNuevaUbicacionId('');
        setReassignModalOpen(true);
        return;
      }
    } catch (error) {
      console.error('Error al verificar empleados relacionados:', error);
      setError(error.message || 'Error al verificar empleados relacionados');
      return;
    }

    if (window.confirm(`¿Está seguro de eliminar la ubicación "${ubicacion.nombre}"?`)) {
      await performDelete(ubicacion);
    }
  };

  const handleReassignModalClose = () => {
    setReassignModalOpen(false);
    setUbicacionPendiente(null);
    setEmpleadosRelacionados([]);
    setNuevaUbicacionId('');
    setReassignError('');
  };

  const handleReassignSubmit = async () => {
    if (!ubicacionPendiente) return;
    if (!nuevaUbicacionId) {
      setReassignError('Debes seleccionar la nueva ubicación.');
      return;
    }

    setIsReassigning(true);
    setReassignError('');

    try {
      const ubicacionAEliminar = ubicacionPendiente;
      const token = getToken();
      const response = await fetch(`/api/ubicaciones/${ubicacionPendiente.id_ubicacion}/reasignar-empleados`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nuevaUbicacionId: Number(nuevaUbicacionId) })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Error al reasignar empleados');
      }

      handleReassignModalClose();
      if (ubicacionAEliminar) {
        await performDelete(ubicacionAEliminar);
      }
    } catch (error) {
      console.error('Error al reasignar empleados:', error);
      setReassignError(error.message || 'Error al reasignar empleados');
    } finally {
      setIsReassigning(false);
    }
  };

  const handleNewUbicacion = () => {
    setEditingUbicacion(null);
    setShowEditModal(true);
  };

  // Función para filtrar ubicaciones
  const ubicacionesFiltradas = ubicaciones.filter((ubicacion) => {
    const query = searchQuery.toLowerCase();
    const tipo = ubicacion.tipo?.toLowerCase() || '';
    const matchesSearch =
      ubicacion.nombre?.toLowerCase().includes(query) ||
      tipo.includes(query) ||
      ubicacion.direccion?.toLowerCase().includes(query);
    const matchesTipo = tipoFiltro === 'all' || tipo === tipoFiltro;
    return matchesSearch && matchesTipo;
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

      {/* Listado renovado */}
      <CardPanel title="Listado de Ubicaciones" icon="bx-map">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="relative">
                <i className="bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre, tipo o dirección"
                  className="w-full rounded-2xl border border-gray-200 bg-white px-10 py-2.5 text-sm text-gray-700 focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#E2BE69]/40"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {TIPO_FILTERS.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setTipoFiltro(filter.key)}
                  className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                    tipoFiltro === filter.key
                      ? 'border-[#E2BE69] bg-[#FFF8E7] text-[#6F581B]'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-[#E2BE69]/60'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {ubicacionesFiltradas.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white/80 px-6 py-12 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F9F4E7] text-[#B39237]">
                <i className="bx bx-map-pin text-2xl"></i>
              </div>
              <p className="text-base font-semibold text-gray-800">No encontramos ubicaciones con los filtros actuales.</p>
              <p className="mt-1 text-sm text-gray-500">Ajusta la búsqueda o registra una nueva ubicación.</p>
              <button
                onClick={handleNewUbicacion}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#B39237] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#9C7F2F]"
              >
                <i className="bx bx-plus"></i>
                Crear Ubicación
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {ubicacionesFiltradas.map((ubicacion) => {
                const tipo = ubicacion.tipo?.toLowerCase();
                const meta = TIPO_META[tipo] || DEFAULT_META;

                return (
                  <div key={ubicacion.id_ubicacion} className="rounded-3xl border border-gray-100 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{ubicacion.nombre}</p>
                        <p className="text-xs text-gray-500">ID #{ubicacion.id_ubicacion}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[0.65rem] font-semibold ${meta.badge}`}>
                        <i className={`bx ${meta.icon} text-sm`}></i>
                        {meta.label}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3 text-sm text-gray-600">
                      <div className="flex items-start gap-2">
                        <i className="bx bx-map text-[#B39237] text-base"></i>
                        <p className="leading-snug">{ubicacion.direccion || <span className="text-gray-400 italic">Dirección no especificada</span>}</p>
                      </div>
                      
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => handleRowAction('view', ubicacion)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-gray-700 hover:border-[#B39237]"
                      >
                        <i className="bx bx-show"></i>
                        Ver
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRowAction('edit', ubicacion)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#D4AF37] bg-[#FFF8E7] px-3 py-2 text-[#6F581B] hover:bg-[#F9EDCC]"
                      >
                        <i className="bx bx-edit"></i>
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRowAction('delete', ubicacion)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-100 px-3 py-2 text-red-600 hover:bg-red-50"
                      >
                        <i className="bx bx-trash"></i>
                        Eliminar
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

      <Modal
        isOpen={reassignModalOpen}
        onClose={handleReassignModalClose}
        title="Reasignar empleados antes de eliminar"
        size="lg"
        footer={(
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={handleReassignModalClose}
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-2xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
              disabled={isReassigning}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleReassignSubmit}
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-2xl bg-gradient-to-r from-[#B39237] to-[#D4AF37] px-6 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-60"
              disabled={isReassigning || !nuevaUbicacionId}
            >
              {isReassigning ? 'Procesando...' : 'Reasignar y eliminar'}
            </button>
          </div>
        )}
      >
        <div className="space-y-5">
          <p className="text-sm text-gray-600">
            No se puede eliminar <span className="font-semibold">{ubicacionPendiente?.nombre}</span> porque tiene empleados asociados.
            Selecciona la nueva ubicación para reasignarlos y luego completaremos la eliminación automáticamente.
          </p>

          {reassignError && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">
              {reassignError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Empleados relacionados ({empleadosRelacionados.length})
            </label>
            <div className="max-h-56 overflow-y-auto rounded-2xl border border-gray-100 bg-white/80">
              {empleadosRelacionados.map((empleado) => (
                <div key={empleado.id_empleado} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-none">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{empleado.nombre} {empleado.apellido}</p>
                    <p className="text-xs text-gray-500">#{empleado.Identificacion} · {empleado.cargo || 'Sin cargo'}</p>
                  </div>
                  <span className="text-xs font-semibold text-[#B39237]">ID {empleado.id_empleado}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Nueva ubicación
            </label>
            <select
              value={nuevaUbicacionId}
              onChange={(e) => setNuevaUbicacionId(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:border-[#B39237] focus:ring-2 focus:ring-[#E2BE69]/40"
            >
              <option value="">Selecciona una ubicación</option>
              {ubicaciones
                .filter((u) => u.id_ubicacion !== ubicacionPendiente?.id_ubicacion)
                .map((u) => (
                  <option key={u.id_ubicacion} value={u.id_ubicacion}>
                    {u.nombre}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}