import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DataTable from '../components/DataTable/DataTable';
import Modal from '../components/Modal/Modal';
import EditModal from '../components/Modal/EditModal';
import ConfirmModal from '../components/Modal/ConfirmModal';

// Configuración de columnas para la tabla de proveedores
const PROVEEDORES_COLUMNS = [
  {
    key: 'id_proveedor',
    label: 'ID',
    sortable: true,
    width: '80px'
  },
  {
    key: 'nombre',
    label: 'Nombre',
    sortable: true,
    render: (value, row) => (
      <div className="font-medium text-gray-900">
        {value}
        {!Boolean(row.activo) && (
          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Inactivo
          </span>
        )}
      </div>
    )
  },
  {
    key: 'telefono',
    label: 'Teléfono',
    sortable: false,
    render: (value) => value || <span className="text-gray-400">No especificado</span>
  },
  {
    key: 'email',
    label: 'Email',
    sortable: true,
    render: (value) => value || <span className="text-gray-400">No especificado</span>
  },
  {
    key: 'direccion',
    label: 'Dirección',
    sortable: false,
    render: (value) => (
      <div className="max-w-xs truncate" title={value}>
        {value || <span className="text-gray-400">No especificada</span>}
      </div>
    )
  },
  {
    key: 'activo',
    label: 'Estado',
    sortable: true,
    width: '100px',
    render: (value) => (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        Boolean(value)
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {Boolean(value) ? 'Activo' : 'Inactivo'}
      </span>
    )
  }
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
      
      const token = localStorage.getItem('token');
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
      const token = localStorage.getItem('token');
      
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
      const token = localStorage.getItem('token');
      
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
      const token = localStorage.getItem('token');
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
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Proveedores</h1>
          <p className="text-gray-600">Administra los proveedores del sistema</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Toggle para mostrar inactivos */}
          <label className="flex items-center space-x-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={mostrarInactivos}
              onChange={(e) => {
                setMostrarInactivos(e.target.checked);
                cargarProveedores(e.target.checked);
              }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Mostrar inactivos</span>
          </label>
          
          {/* Botón crear proveedor */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-[#B39237] to-[#D4AF37] hover:from-[#A0812F] hover:to-[#C19B2F] text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200"
          >
            <i className="bx bx-plus text-lg"></i>
            <span>Nuevo Proveedor</span>
          </button>
        </div>
      </div>

      {/* Tabla de Proveedores */}
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Header con información */}
        {!isLoading && (
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>
                {proveedores.length} proveedor{proveedores.length !== 1 ? 'es' : ''} 
                {mostrarInactivos ? ' (incluyendo inactivos)' : ' activos'}
              </span>
              {mostrarInactivos && (
                <span className="text-blue-600">
                  💡 Los proveedores inactivos tienen un botón verde para reactivar
                </span>
              )}
            </div>
          </div>
        )}
        
        <DataTable
          columns={PROVEEDORES_COLUMNS}
          data={proveedores}
          loading={isLoading}
          onRowAction={handleRowAction}
          rowActions={['view', 'edit', 'toggle']}
          rowKey="id_proveedor"
          searchPlaceholder="Buscar por nombre, email, teléfono o dirección..."
          emptyState={
            <div className="p-8 text-center text-gray-500">
              {mostrarInactivos 
                ? 'No hay proveedores registrados. ¡Crea el primer proveedor!'
                : 'No hay proveedores activos. Activa el toggle "Mostrar inactivos" para ver todos.'
              }
            </div>
          }
        />
      </div>

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
