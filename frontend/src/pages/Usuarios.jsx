import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DataTable from '../components/DataTable/DataTable';
import { ViewModal, EditModal } from '../components/Modal';
import ResourceHeader from '../components/UI/ResourceHeader';
import CardPanel from '../components/UI/CardPanel';
import useStoredUser from '../hooks/useStoredUser';
import { getToken } from '../utils/tokenStorage';

// Configuración de columnas para la tabla de usuarios
const buildUsuarioColumns = (currentUser) => [
  {
    key: 'username',
    label: 'Usuario',
    icon: 'bx-user',
    sortable: true,
    render: (value, row) => (
      <div className="flex items-center">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center border border-gray-200 shadow-sm overflow-hidden"
          style={!((row.avatar_url || (currentUser && row.id_usuario === currentUser.id_usuario && currentUser.avatar_url))) ? { backgroundColor: row.avatar_color || (currentUser && row.id_usuario === currentUser.id_usuario ? currentUser.avatar_color : '#C8F7DC') } : undefined}
        >
          {(() => {
            const effectiveAvatar = row.avatar_url || (currentUser && row.id_usuario === currentUser.id_usuario ? currentUser.avatar_url : null);
            if (effectiveAvatar) {
              return <img src={effectiveAvatar} alt={value} className="w-full h-full object-cover" />;
            }
            return (
              <span className="text-green-600 font-medium text-sm">
                {value?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            );
          })()}
        </div>
        <div className="ml-4">
          <div className="text-sm font-medium text-gray-900">
            <i className="bx bx-user text-gray-400 mr-1"></i>{value}
          </div>
          <div className="text-sm text-gray-500">
            <i className="bx bx-envelope mr-1"></i>{row.email_usuario}
          </div>
        </div>
      </div>
    )
  },
  {
    key: 'empleado_info',
    label: 'Empleado',
    icon: 'bx-id-card',
    sortable: true,
    render: (value, row) => (
      <div>
        <div className="text-sm font-medium text-gray-900">
          <i className="bx bx-user-pin text-[#B39237] mr-1"></i>{row.nombre} {row.apellido}
        </div>
        <div className="text-sm text-gray-500">
          <i className="bx bx-briefcase-alt mr-1"></i>{row.cargo}
        </div>
      </div>
    )
  },
      {
        key: 'nombre_rol',
        label: 'Rol Sistema',
        icon: 'bx-shield-quarter',
        sortable: true,
        render: (value, row) => {
          // Normalize value to lowercase for matching backend role keys
          const rolKey = (value || '').toString().toLowerCase();
          const getRolBadgeColor = (rol) => {
            switch (rol) {
              case 'administrador':
                return 'bg-red-100 text-red-800';
              case 'recursos_humanos':
                return 'bg-blue-100 text-blue-800';
              case 'almacen':
                return 'bg-green-100 text-green-800';
              case 'compras':
                return 'bg-purple-100 text-purple-800';
              default:
                return 'bg-gray-100 text-gray-800';
            }
          };

          const getRolIcon = (rol) => {
            switch (rol) {
              case 'administrador':
                return 'bx-crown';
              case 'recursos_humanos':
                return 'bx-group';
              case 'almacen':
                return 'bx-archive';
              case 'compras':
                return 'bx-cart';
              default:
                return 'bx-user';
            }
          };

          // Display a human-friendly label (capitalize words)
          const displayLabel = value ? value.toString().replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Sin rol';
          
          return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getRolBadgeColor(rolKey)}`}>
              <i className={`bx ${getRolIcon(rolKey)} text-sm`}></i>
              {displayLabel}
            </span>
          );
        }
      },
  {
    key: 'usuario_activo',
    label: 'Estado',
    icon: 'bx-toggle-left',
    align: 'center',
    render: (value, row) => (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
        value 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        <i className={`bx ${value ? 'bx-check-circle' : 'bx-x-circle'} text-sm`}></i>
        {value ? 'Activo' : 'Inactivo'}
      </span>
    )
  },
  {
    key: 'ultimo_acceso',
    label: 'Último Acceso',
    icon: 'bx-time-five',
    sortable: true,
    render: (value, row) => (
      <div className="text-sm text-gray-500 flex items-center gap-1">
        <i className="bx bx-time-five"></i>
        {value 
          ? new Date(value).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : 'Nunca'
        }
      </div>
    )
  }
];

// Configuración de campos para el modal de vista
const USUARIO_VIEW_FIELDS = [
  { key: 'id_usuario', label: 'ID Usuario' },
  { key: 'username', label: 'Username' },
  { key: 'email_usuario', label: 'Email' },
  { 
    key: 'empleado_info', 
    label: 'Empleado', 
    render: (value, data) => `${data.nombre} ${data.apellido}` 
  },
  { key: 'cargo', label: 'Cargo' },
  { key: 'nombre_rol', label: 'Rol del Sistema' },
  { 
    key: 'usuario_activo', 
    label: 'Estado',
    render: (value) => value ? 'Activo' : 'Inactivo'
  },
  { 
    key: 'ultimo_acceso', 
    label: 'Último Acceso',
    render: (value) => value 
      ? new Date(value).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'Nunca'
  }
];

// Configuración de campos para el modal de edición
const USUARIO_FORM_FIELDS = [
  {
    name: 'username',
    label: 'Username',
    type: 'text',
    required: true,
    placeholder: 'Nombre de usuario',
    fullWidth: true
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    required: true,
    placeholder: 'email@ejemplo.com',
    fullWidth: true
  },
  {
    name: 'id_rol',
    label: 'Rol del Sistema',
    type: 'select',
    required: true,
    placeholder: 'Seleccionar rol',
    fullWidth: true,
    options: [
      { value: '1', label: 'Compras' },
      { value: '2', label: 'Almacén' },
      { value: '3', label: 'Recursos Humanos' },
      { value: '4', label: 'Administrador' }
    ]
  }
];

// Configuración de campos para el modal de creación
const USUARIO_CREATE_FORM_FIELDS = [
  {
    name: 'id_empleado',
    label: 'Empleado',
    type: 'select',
    required: true,
    placeholder: 'Seleccionar empleado',
    fullWidth: true,
    options: [] // Se llenará dinámicamente
  },
  {
    name: 'username',
    label: 'Username',
    type: 'text',
    required: true,
    placeholder: 'Nombre de usuario',
    fullWidth: true
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    required: true,
    placeholder: 'email@ejemplo.com',
    fullWidth: true
  },
  {
    name: 'password',
    label: 'Contraseña',
    type: 'password',
    required: true,
    placeholder: 'Mínimo 6 caracteres',
    fullWidth: true
  },
  {
    name: 'id_rol',
    label: 'Rol del Sistema',
    type: 'select',
    required: true,
    placeholder: 'Seleccionar rol',
    fullWidth: true,
    options: [
      { value: '1', label: 'Compras' },
      { value: '2', label: 'Almacén' },
      { value: '3', label: 'Recursos Humanos' },
      { value: '4', label: 'Administrador' }
    ]
  }
];

// Reglas de validación
const USUARIO_VALIDATION_RULES = {
  username: { required: true },
  email: { required: true, email: true },
  id_rol: { required: true },
  id_empleado: { required: true },
  password: { required: true, custom: (value) => value && value.length < 6 ? 'La contraseña debe tener al menos 6 caracteres' : null }
};

export default function Usuarios() {
  const [currentUser] = useStoredUser();
  const [usuarios, setUsuarios] = useState([]);
  const [empleadosSinUsuario, setEmpleadosSinUsuario] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  
  // Estados para modales
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para búsqueda y filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [rolFiltro, setRolFiltro] = useState('');

  // Toast notification system
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const usuarioColumns = useMemo(() => buildUsuarioColumns(currentUser), [currentUser]);

  // Show toast function
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 2500);
  };

  // Fix: Usar useCallback para evitar bucle infinito en useEffect
  const cargarUsuarios = useCallback(async () => {
    try {
      const token = getToken();
      const response = await fetch('/api/usuarios', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setUsuarios(result.data || []);
        setError('');
      } else {
        throw new Error('Error al cargar usuarios');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar usuarios');
    }
  }, []);

  // Fix: Usar useCallback para cargarEmpleadosSinUsuario
  const cargarEmpleadosSinUsuario = useCallback(async () => {
    try {
      const token = getToken();
      const response = await fetch('/api/usuarios/employees-without-user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setEmpleadosSinUsuario(result.data || []);
      }
    } catch (error) {
      console.error('Error cargando empleados sin usuario:', error);
    }
  }, []);

  // Fix: Usar useCallback para cargarEstadisticas
  const cargarEstadisticas = useCallback(async () => {
    try {
      const token = getToken();
      const response = await fetch('/api/usuarios/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  }, []);

  // Fix: Función de carga completa con useCallback
  const cargarDatos = useCallback(async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        cargarUsuarios(),
        cargarEmpleadosSinUsuario(),
        cargarEstadisticas()
      ]);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  }, [cargarUsuarios, cargarEmpleadosSinUsuario, cargarEstadisticas]);

  // Cargar datos al iniciar el componente
  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    if (!currentUser?.id_usuario) {
      return;
    }
    setUsuarios((prev) => prev.map((usuario) => (
      usuario.id_usuario === currentUser.id_usuario
        ? {
            ...usuario,
            avatar_url: currentUser.avatar_url ?? usuario.avatar_url,
            avatar_color: currentUser.avatar_color ?? usuario.avatar_color
          }
        : usuario
    )));
  }, [currentUser?.id_usuario, currentUser?.avatar_url, currentUser?.avatar_color]);

  // Filtrar usuarios
  const usuariosFiltrados = usuarios.filter(usuario => {
    const matchesText = (
      usuario.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      usuario.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      usuario.apellido?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      usuario.email_usuario?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const matchesRole = !rolFiltro || usuario.nombre_rol === rolFiltro;
    
    return matchesText && matchesRole;
  });

  // Manejar acciones de fila del DataTable
  // Estado para acción en proceso por fila (toggle/reset/etc.)
  const [processingRowId, setProcessingRowId] = useState(null);

  const handleRowAction = (action, usuario) => {
    if (!usuario) return;
    if (processingRowId && processingRowId === usuario.id_usuario) return; // evita doble clic
    switch (action) {
      case 'view': {
        setSelectedUser(usuario);
        setShowViewModal(true);
        break;
      }
      case 'edit': {
        setEditingUser(usuario);
        setShowEditModal(true);
        break;
      }
      case 'toggle': {
        handleToggleStatus(usuario);
        break;
      }
      case 'delete': {
        handleDeleteUsuario(usuario);
        break;
      }
      case 'reset': {
        handleResetPassword(usuario);
        break;
      }
      default:
        break;
    }
  };

  // Función para cambiar estado del usuario
  const handleToggleStatus = async (usuario) => {
    setProcessingRowId(usuario.id_usuario);
    // Optimista: reflejar cambio inmediato
    const previo = usuario.usuario_activo;
    setUsuarios(prev => prev.map(u => u.id_usuario === usuario.id_usuario ? { ...u, usuario_activo: !previo } : u));
    try {
      const token = getToken();
      const endpoint = previo 
        ? `/api/usuarios/${usuario.id_usuario}/deactivate`
        : `/api/usuarios/${usuario.id_usuario}/activate`;
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Refrescar usuarios y estadísticas para consistencia
        await Promise.all([cargarUsuarios(), cargarEstadisticas()]);
        showToast(`Usuario ${previo ? 'desactivado' : 'activado'} correctamente`, 'success');
        setError('');
      } else {
        const result = await response.json();
        // Revertir optimista
        setUsuarios(prev => prev.map(u => u.id_usuario === usuario.id_usuario ? { ...u, usuario_activo: previo } : u));
        showToast(result.message || 'Error al cambiar estado del usuario', 'error');
      }
    } catch (error) {
      console.error('Error toggle usuario:', error);
      // Revertir optimista
      setUsuarios(prev => prev.map(u => u.id_usuario === usuario.id_usuario ? { ...u, usuario_activo: previo } : u));
      showToast('Error de conexión', 'error');
    } finally {
      setProcessingRowId(null);
    }
  };

  // Función para resetear contraseña
  const handleResetPassword = async (usuario) => {
    if (processingRowId) return;
    if (!window.confirm(`¿Estás seguro de que quieres resetear la contraseña de ${usuario.username}?`)) {
      return;
    }

    const newPassword = prompt('Ingresa la nueva contraseña (mínimo 6 caracteres):');
    if (!newPassword || newPassword.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    setProcessingRowId(usuario.id_usuario);
    try {
      const token = getToken();
      const response = await fetch(`/api/usuarios/${usuario.id_usuario}/reset-password`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newPassword })
      });

      if (response.ok) {
        showToast('Contraseña restablecida correctamente', 'success');
        setError('');
      } else {
        const result = await response.json();
        showToast(result.message || 'Error al resetear contraseña', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('Error de conexión', 'error');
    } finally {
      setProcessingRowId(null);
    }
  };

  // Eliminar usuario definitivamente (requiere inactivo)
  const handleDeleteUsuario = async (usuario) => {
    if (processingRowId) return;

    // Si está activo, ofrecer desactivar y eliminar en cadena
    if (usuario.usuario_activo) {
      const confirmDeactivate = window.confirm(`El usuario "${usuario.username}" está activo. ¿Deseas desactivarlo y eliminarlo?`);
      if (!confirmDeactivate) return;
      try {
        setProcessingRowId(usuario.id_usuario);
        const token = getToken();
        // 1) Desactivar
        const deact = await fetch(`/api/usuarios/${usuario.id_usuario}/deactivate`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!deact.ok) {
          const res = await deact.json().catch(()=>({}));
          showToast(res.message || 'No se pudo desactivar el usuario', 'error');
          setProcessingRowId(null);
          return;
        }
        // 2) Eliminar
        const del = await fetch(`/api/usuarios/${usuario.id_usuario}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const delRes = await del.json().catch(()=>({}));
        if (del.ok && delRes?.success !== false) {
          await Promise.all([cargarUsuarios(), cargarEstadisticas()]);
          showToast(delRes.message || 'Usuario eliminado correctamente', 'success');
        } else {
          showToast(delRes.message || 'No se pudo eliminar el usuario', 'error');
        }
      } catch (err) {
        console.error('Error al desactivar/eliminar usuario:', err);
        showToast('Error de conexión', 'error');
      } finally {
        setProcessingRowId(null);
      }
      return;
    }

    // Si ya está inactivo, confirmar eliminación directa
    if (!window.confirm(`¿Eliminar definitivamente al usuario "${usuario.username}"? Esta acción no se puede deshacer.`)) return;

    try {
      setProcessingRowId(usuario.id_usuario);
      const token = getToken();
      const response = await fetch(`/api/usuarios/${usuario.id_usuario}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result?.success !== false) {
        await Promise.all([cargarUsuarios(), cargarEstadisticas()]);
        showToast(result.message || 'Usuario eliminado correctamente', 'success');
      } else {
        showToast(result.message || 'No se pudo eliminar el usuario', 'error');
      }
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      showToast('Error de conexión', 'error');
    } finally {
      setProcessingRowId(null);
    }
  };

  // Manejar envío del formulario de edición
  const handleEditSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      const token = getToken();
      
      const response = await fetch(`/api/usuarios/${editingUser.id_usuario}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (result.success) {
        await cargarUsuarios();
        setShowEditModal(false);
        setEditingUser(null);
        showToast(result.message || 'Usuario actualizado correctamente', 'success');
        setError('');
      } else {
        showToast(result.message || 'Error al actualizar usuario', 'error');
      }
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      showToast('Error al actualizar usuario', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejar envío del formulario de creación
  const handleCreateSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      const token = getToken();
      
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (result.success) {
        await cargarDatos(); // Recargar todo para actualizar empleados sin usuario
        setShowCreateModal(false);
        showToast(result.message || 'Usuario creado correctamente', 'success');
        setError('');
      } else {
        showToast(result.message || 'Error al crear usuario', 'error');
      }
    } catch (error) {
      console.error('Error al crear usuario:', error);
      showToast('Error al crear usuario', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewUser = () => {
    setShowCreateModal(true);
  };

  // Preparar opciones de empleados para el formulario de creación
  const empleadosOptions = empleadosSinUsuario.map(empleado => ({
    value: empleado.id_empleado,
    label: `${empleado.nombre} ${empleado.apellido} - ${empleado.cargo}`
  }));

  // Actualizar campos del formulario de creación con opciones de empleados
  const createFormFieldsWithOptions = USUARIO_CREATE_FORM_FIELDS.map(field => {
    if (field.name === 'id_empleado') {
      return { ...field, options: empleadosOptions };
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
        title="Gestión de Usuarios"
        subtitle="Administra los usuarios del sistema SIRDS"
        stats={stats ? [
          { icon: 'bx-group', label: 'Total', value: stats.total_usuarios },
          { icon: 'bx-toggle-left', label: 'Activos', value: stats.usuarios_activos },
          { icon: 'bx-shield-quarter', label: 'Admins', value: stats.administradores },
          { icon: 'bx-time', label: 'Último Mes', value: stats.activos_ultimo_mes }
        ] : []}
        action={(
          <button
            onClick={handleNewUser}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#B39237] hover:from-[#B39237] hover:to-[#9C7F2F] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-[#E2BE69] focus:ring-offset-2"
          >
            <i className="bx bx-user-plus"></i>
            Nuevo Usuario
          </button>
        )}
      />

      {/* Mensajes de error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-xl">
          {error}
        </div>
      )}

      {/* Eliminado bloque duplicado de estadísticas rápidas: los valores ya se muestran en ResourceHeader */}

      {/* Filtros adicionales para usuarios */}
      <CardPanel title="Filtros" icon="bx-filter-alt">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por rol
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              value={rolFiltro}
              onChange={(e) => setRolFiltro(e.target.value)}
            >
              <option value="">Todos los roles</option>
              {/* value uses backend role keys (lowercase) while label is user-friendly */}
              <option value="administrador">Administrador</option>
              <option value="recursos_humanos">Recursos Humanos</option>
              <option value="almacen">Almacén</option>
              <option value="compras">Compras</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => { setSearchQuery(''); setRolFiltro(''); }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </CardPanel>

      <CardPanel title="Usuarios" icon="bx-id-card">
        <DataTable
          columns={usuarioColumns}
          data={usuariosFiltrados}
          rowKey="id_usuario"
          loading={isLoading}
          error={error}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          searchPlaceholder="Buscar por usuario, nombre, email..."
          onRowAction={handleRowAction}
          // Usamos acciones estándar del DataTable: view, edit y toggle (personalizada), sin delete
          rowActions={[ 'view', 'edit', 'toggle', 'delete', 'reset' ]}
          getProcessingAction={(row) => processingRowId === row.id_usuario ? 'toggle' : null}
          getDisabledActions={(row) => {
            const disabled = [];
            if (processingRowId === row.id_usuario) disabled.push('toggle','reset','edit','delete');
            return disabled;
          }}
          emptyState={{
            icon: (
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            ),
            title: 'No hay usuarios disponibles',
            description: searchQuery || rolFiltro ? 'No se encontraron usuarios que coincidan con los filtros' : 'Comience creando un nuevo usuario',
            action: {
              label: 'Crear Primer Usuario',
              onClick: handleNewUser
            }
          }}
        />
      </CardPanel>

      {/* Modal de Vista */}
      <ViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detalles del Usuario"
        data={selectedUser}
        fields={USUARIO_VIEW_FIELDS}
        size="md"
      />

      {/* Modal de Edición */}
      <EditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingUser(null);
        }}
        onSubmit={handleEditSubmit}
        title="Editar Usuario"
        initialData={editingUser ? {
          username: editingUser.username,
          email: editingUser.email_usuario,
          id_rol: editingUser.id_rol?.toString()
        } : {}}
        fields={USUARIO_FORM_FIELDS}
        validationRules={USUARIO_VALIDATION_RULES}
        size="md"
        isSubmitting={isSubmitting}
        submitText="Actualizar"
      />

      {/* Modal de Creación */}
      <EditModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateSubmit}
        title="Crear Nuevo Usuario"
        initialData={{}}
        fields={createFormFieldsWithOptions}
        validationRules={USUARIO_VALIDATION_RULES}
        size="md"
        isSubmitting={isSubmitting}
        submitText="Crear Usuario"
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
