import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Modal from '../components/Modal/Modal';
import EditModal from '../components/Modal/EditModal';
import ResourceHeader from '../components/UI/ResourceHeader';
import CardPanel from '../components/UI/CardPanel';
import { getToken } from '../utils/tokenStorage';

const ESTADO_FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'active', label: 'Activos' },
  { key: 'inactive', label: 'Inactivos' }
];

// Campos de vista detallada
const PROVEEDOR_VIEW_FIELDS = [
  { key: 'id_proveedor', label: 'ID del Proveedor' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'email', label: 'Email' },
  { key: 'direccion', label: 'Dirección' },
  { 
    key: 'activo', 
    label: 'Estado',
    render: (value) => Boolean(value) ? 'Activo' : 'Inactivo'
  }
];

// Configuración de campos de formulario
export const PROVEEDOR_FORM_FIELDS = [
  {
    name: 'nombre',
    label: 'Nombre del Proveedor',
    type: 'text',
    required: true,
    placeholder: 'Nombre de la empresa o proveedor',
    fullWidth: true
  },
  {
    name: 'telefono',
    label: 'Teléfono',
    type: 'tel',
    placeholder: '(662) 123-4567',
    fullWidth: false
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    placeholder: 'contacto@proveedor.com',
    fullWidth: false
  },
  {
    name: 'direccion',
    label: 'Dirección',
    type: 'textarea',
    placeholder: 'Dirección completa del proveedor',
    rows: 3,
    fullWidth: true
  }
];

// Reglas de validación para proveedores
export const PROVEEDOR_VALIDATION_RULES = {
  nombre: { 
    required: true,
    custom: (value) => {
      if (!value || value.trim() === '') return 'Nombre del proveedor es requerido';
      if (value.trim().length < 2) return 'Nombre debe tener al menos 2 caracteres';
      if (value.trim().length > 150) return 'Nombre debe tener máximo 150 caracteres';
      return null;
    }
  },
  telefono: {
    custom: (value) => {
      if (value && value.trim() !== '' && value.length > 50) {
        return 'Teléfono debe tener máximo 50 caracteres';
      }
      return null;
    }
  },
  email: { 
    email: true,
    custom: (value) => {
      if (value && value.trim() !== '' && value.length > 150) {
        return 'Email debe tener máximo 150 caracteres';
      }
      return null;
    }
  },
  direccion: {
    custom: (value) => {
      if (value && value.trim() !== '' && value.length > 1000) {
        return 'Dirección debe tener máximo 1000 caracteres';
      }
      return null;
    }
  }
};

export default function Proveedores() {
  // Estados principales
  const [proveedores, setProveedores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState(null);
  const [editingProveedor, setEditingProveedor] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingProveedorId, setDeletingProveedorId] = useState(null);

  // Estados para modal de confirmación
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [proveedorToDelete, setProveedorToDelete] = useState(null);

  // Estado para mostrar proveedores inactivos
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('all');

  // Toast notification system
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Show toast function
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 5000);
  };

  // Cargar proveedores desde la API
  const cargarProveedores = useCallback(async (incluirInactivos = null) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = getToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      // Si no se especifica, usar el estado actual
      const incluir = incluirInactivos !== null ? incluirInactivos : mostrarInactivos;
      
      const url = incluir 
        ? '/api/proveedores?incluirInactivos=true'
        : '/api/proveedores';

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('Proveedores cargados:', result.data);
        // Debug: mostrar tipos de datos
        if (result.data.length > 0) {
          console.log('Primer proveedor debug:', {
            ...result.data[0],
            activo_tipo: typeof result.data[0].activo,
            activo_valor: result.data[0].activo,
            activo_boolean: Boolean(result.data[0].activo)
          });
        }
        setProveedores(result.data || []);
      } else {
        throw new Error(result.message || 'Error al cargar proveedores');
      }
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
      setError(error.message);
      showToast('Error al cargar proveedores', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [mostrarInactivos]);

  // Efecto para cargar datos iniciales
  useEffect(() => {
    cargarProveedores();
  }, [cargarProveedores]);

  // Función para crear proveedor
  const crearProveedor = useCallback(async (proveedorData) => {
    try {
      setIsSubmitting(true);
      const token = getToken();
      
      const response = await fetch('/api/proveedores', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(proveedorData)
      });

      const result = await response.json();

      if (response.ok) {
        showToast('✅ Proveedor creado exitosamente', 'success');
        await cargarProveedores();
        setShowCreateModal(false);
      } else {
        showToast(`❌ ${result.message || 'Error al crear proveedor'}`, 'error');
      }
    } catch (error) {
      console.error('Error al crear proveedor:', error);
      showToast('❌ Error de conexión al crear proveedor', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [cargarProveedores]);

  // Función para actualizar proveedor
  const actualizarProveedor = useCallback(async (proveedorData) => {
    try {
      setIsSubmitting(true);
      const token = getToken();
      
      const response = await fetch(`/api/proveedores/${editingProveedor.id_proveedor}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(proveedorData)
      });

      const result = await response.json();

      if (response.ok) {
        showToast('✅ Proveedor actualizado exitosamente', 'success');
        await cargarProveedores();
        setShowEditModal(false);
        setEditingProveedor(null);
      } else {
        showToast(`❌ ${result.message || 'Error al actualizar proveedor'}`, 'error');
      }
    } catch (error) {
      console.error('Error al actualizar proveedor:', error);
      showToast('❌ Error de conexión al actualizar proveedor', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [editingProveedor, cargarProveedores]);

  // Función para cambiar estado del proveedor (activar/inactivar)
  const cambiarEstadoProveedor = useCallback(async (id, accion) => {
    console.log(`Intentando ${accion} proveedor con ID:`, id);
    
    const mensaje = accion === 'inactivar' 
      ? '¿Estás seguro de que deseas inactivar este proveedor?' 
      : '¿Estás seguro de que deseas activar este proveedor?';
      
    if (!window.confirm(mensaje)) {
      return;
    }

    try {
      const token = getToken();
      console.log('Token obtenido:', token ? 'Presente' : 'No encontrado');
      
      const response = await fetch(`/api/proveedores/${id}/${accion}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Respuesta del servidor:', response.status, response.statusText);
      const result = await response.json();
      console.log('Resultado:', result);

      if (response.ok) {
        const emojiExito = accion === 'inactivar' ? '🔒' : '✅';
        showToast(`${emojiExito} ${result.message}`, 'success');
        await cargarProveedores();
      } else {
        // Manejo mejorado de errores específicos
        if (response.status === 404) {
          showToast('❌ El proveedor no existe', 'error');
        } else if (response.status === 400) {
          showToast(`⚠️ ${result.message}`, 'error');
        } else {
          showToast(`❌ ${result.message || `Error al ${accion} proveedor`}`, 'error');
        }
        
        // Recargar la lista para refrescar el estado
        await cargarProveedores();
      }
    } catch (error) {
      console.error(`Error al ${accion} proveedor:`, error);
      showToast(`❌ Error de conexión al ${accion} proveedor`, 'error');
    }
  }, [cargarProveedores]);

  // Handler unificado para acciones de la tabla
  const handleRowAction = (action, proveedor) => {
    console.log('Acción ejecutada:', action, 'en proveedor:', proveedor);
    
    switch (action) {
      case 'view':
        setSelectedProveedor(proveedor);
        setShowViewModal(true);
        break;
      case 'edit':
        setEditingProveedor(proveedor);
        setShowEditModal(true);
        break;
      case 'toggle':
        const accion = Boolean(proveedor.activo) ? 'inactivar' : 'activar';
        cambiarEstadoProveedor(proveedor.id_proveedor, accion);
        break;
      default:
        console.warn(`Acción desconocida: ${action}`);
    }
  };

  const proveedoresFiltrados = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    return proveedores.filter((proveedor) => {
      const activo = Boolean(proveedor.activo);
      const matchesEstado =
        estadoFiltro === 'all' ||
        (estadoFiltro === 'active' && activo) ||
        (estadoFiltro === 'inactive' && !activo);

      if (!matchesEstado) {
        return false;
      }

      if (!term) {
        return true;
      }

      const valuesToSearch = [
        proveedor.nombre,
        proveedor.email,
        proveedor.telefono,
        proveedor.direccion
      ];

      return valuesToSearch.some((value) =>
        value?.toString().toLowerCase().includes(term)
      );
    });
  }, [proveedores, searchQuery, estadoFiltro]);

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error al cargar proveedores</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button 
            onClick={cargarProveedores}
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 w-full space-y-6">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      <ResourceHeader
        title="Gestión de Proveedores"
        subtitle="Administra los proveedores del sistema"
        stats={[
          { icon: 'bx-store', label: 'Total', value: proveedores.length },
          { icon: 'bx-toggle-left', label: mostrarInactivos ? 'Vista' : 'Activos', value: mostrarInactivos ? 'Todos' : proveedores.filter(p=>Boolean(p.activo)).length },
        ]}
        action={(
          <div className="flex items-center gap-4">
            <label className="flex items-center text-xs text-[#6F581B] bg-white/70 px-3 py-2 rounded-lg ring-1 ring-[#E2BE69]/40">
              <input
                type="checkbox"
                checked={mostrarInactivos}
                onChange={(e) => { setMostrarInactivos(e.target.checked); cargarProveedores(e.target.checked); }}
                className="mr-2 h-4 w-4 text-[#B39237] focus:ring-[#B39237] border-[#E2BE69] rounded"
              />
              Mostrar inactivos
            </label>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#B39237] hover:from-[#B39237] hover:to-[#9C7F2F] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-[#E2BE69] focus:ring-offset-2"
            >
              <i className="bx bx-plus"></i>
              Nuevo Proveedor
            </button>
          </div>
        )}
      />

      <CardPanel title="Listado de Proveedores" icon="bx-spreadsheet" actions={null}>
        <div className="space-y-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex-1">
              <div className="relative">
                <i className="bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre, teléfono, email o dirección"
                  className="w-full rounded-2xl border border-gray-200 bg-white px-10 py-2.5 text-sm text-gray-700 focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#E2BE69]/40"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {ESTADO_FILTERS.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setEstadoFiltro(filter.key)}
                  className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                    estadoFiltro === filter.key
                      ? 'border-[#E2BE69] bg-[#FFF8E7] text-[#6F581B]'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-[#E2BE69]/60'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-3 text-xs text-gray-500">
              <span>{proveedoresFiltrados.length} proveedor{proveedoresFiltrados.length !== 1 ? 'es' : ''} encontrados</span>
              <span className="hidden sm:inline text-[#7A6B46]">{mostrarInactivos ? 'Incluyendo inactivos' : 'Sólo activos'}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-[#F9F4E7] text-[#6F581B]">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Proveedor</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Contacto</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Dirección</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Estado</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {isLoading && (
                    [...Array(5)].map((_, index) => (
                      <tr key={`skeleton-${index}`} className="animate-pulse">
                        {[...Array(7)].map((__, cellIndex) => (
                          <td key={cellIndex} className="px-6 py-4">
                            <div className="h-3 rounded-full bg-gray-200"></div>
                          </td>
                        ))}
                      </tr>
                    ))
                  )}

                  {!isLoading && proveedoresFiltrados.map((proveedor) => {
                    const activo = Boolean(proveedor.activo);
                    return (
                      <tr key={proveedor.id_proveedor} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4 text-xs font-semibold text-gray-500">#{proveedor.id_proveedor}</td>
                        <td className="max-w-xs px-6 py-4">
                          <div className="font-semibold text-gray-900">{proveedor.nombre}</div>
                          {!activo && (
                            <span className="mt-1 inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[0.65rem] font-semibold text-red-600">
                              Inactivo
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {proveedor.telefono || <span className="text-gray-400">No especificado</span>}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {proveedor.email || <span className="text-gray-400">No especificado</span>}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {proveedor.direccion ? (
                            <span
                              title={proveedor.direccion}
                              className="block max-w-xs truncate"
                            >
                              {proveedor.direccion}
                            </span>
                          ) : (
                            <span className="text-gray-400">No especificada</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            activo ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                          }`}>
                            {activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2 text-xs font-semibold">
                            <button
                              type="button"
                              onClick={() => handleRowAction('view', proveedor)}
                              className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-gray-700 hover:border-[#B39237]"
                            >
                              <i className="bx bx-show"></i>
                              Ver
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRowAction('edit', proveedor)}
                              className="inline-flex items-center gap-1 rounded-full border border-[#D4AF37] bg-[#FFF8E7] px-3 py-1.5 text-[#6F581B] hover:bg-[#F9EDCC]"
                            >
                              <i className="bx bx-edit"></i>
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRowAction('toggle', proveedor)}
                              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 ${
                                activo
                                  ? 'border-red-100 text-red-600 hover:bg-red-50'
                                  : 'border-emerald-100 text-emerald-700 hover:bg-emerald-50'
                              }`}
                            >
                              <i className={`bx ${activo ? 'bx-lock' : 'bx-lock-open-alt'}`}></i>
                              {activo ? 'Inactivar' : 'Activar'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {!isLoading && proveedoresFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F9F4E7] text-[#B39237]">
                          <i className="bx bx-store text-2xl"></i>
                        </div>
                        <p className="font-semibold text-gray-800">No encontramos proveedores con los filtros actuales.</p>
                        <p className="mt-1 text-sm text-gray-500">Ajusta la búsqueda o registra un nuevo proveedor.</p>
                        <button
                          onClick={() => setShowCreateModal(true)}
                          className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#B39237] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#9C7F2F]"
                        >
                          <i className="bx bx-plus"></i>
                          Crear proveedor
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardPanel>

      {/* Modal para crear proveedor */}
      <EditModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={crearProveedor}
        title="Crear Nuevo Proveedor"
        fields={PROVEEDOR_FORM_FIELDS}
        validationRules={PROVEEDOR_VALIDATION_RULES}
        isSubmitting={isSubmitting}
      />

      {/* Modal para editar proveedor */}
      <EditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingProveedor(null);
        }}
        onSubmit={actualizarProveedor}
        title="Editar Proveedor"
        fields={PROVEEDOR_FORM_FIELDS}
        validationRules={PROVEEDOR_VALIDATION_RULES}
        initialData={editingProveedor}
        isSubmitting={isSubmitting}
      />

      {/* Modal para ver detalles del proveedor */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedProveedor(null);
        }}
        title="Detalles del Proveedor"
      >
        {selectedProveedor && (
          <div className="space-y-4">
            {PROVEEDOR_VIEW_FIELDS.map((field) => (
              <div key={field.key} className="border-b border-gray-100 pb-3">
                <dt className="text-sm font-medium text-gray-500">{field.label}</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {field.render 
                    ? field.render(selectedProveedor[field.key])
                    : selectedProveedor[field.key] || 'No especificado'
                  }
                </dd>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Modal de confirmación para eliminar - TEMPORALMENTE COMENTADO
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setProveedorToDelete(null);
        }}
        onConfirm={() => proveedorToDelete && eliminarProveedor(proveedorToDelete.id_proveedor)}
        title="Eliminar Proveedor"
        message={
          proveedorToDelete
            ? `¿Estás seguro de que deseas eliminar el proveedor "${proveedorToDelete.nombre}"? Esta acción no se puede deshacer.`
            : "¿Estás seguro de que deseas eliminar este proveedor?"
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        isLoading={deletingProveedorId === proveedorToDelete?.id_proveedor}
      />
      */}
    </div>
  );
}
