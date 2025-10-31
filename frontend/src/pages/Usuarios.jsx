import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/DataTable/DataTable';
import { ViewModal, EditModal } from '../components/Modal';

// Configuración de columnas para la tabla de usuarios
const USUARIOS_COLUMNS = [
  {
    key: 'username',
    label: 'Usuario',
    sortable: true,
    render: (value, row) => (
      <div className="flex items-center">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-green-600 font-medium text-sm">
            {value?.charAt(0)?.toUpperCase() || 'U'}
          </span>
        </div>
        <div className="ml-4">
          <div className="text-sm font-medium text-gray-900">
            {value}
          </div>
          <div className="text-sm text-gray-500">
            {row.email_usuario}
          </div>
        </div>
      </div>
    )
  },
  {
    key: 'empleado_info',
    label: 'Empleado',
    sortable: true,
    render: (value, row) => (
      <div>
        <div className="text-sm font-medium text-gray-900">
          {row.nombre} {row.apellido}
        </div>
        <div className="text-sm text-gray-500">
          {row.cargo}
        </div>
      </div>
    )
  },
      {
        key: 'nombre_rol',
        label: 'Rol Sistema',
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

          // Display a human-friendly label (capitalize words)
          const displayLabel = value ? value.toString().replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Sin rol';
          
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRolBadgeColor(rolKey)}`}>
              {displayLabel}
            </span>
          );
        }
      },
  {
    key: 'usuario_activo',
    label: 'Estado',
    align: 'center',
    render: (value, row) => (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        value 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {value ? 'Activo' : 'Inactivo'}
      </span>
    )
  },
  {
    key: 'ultimo_acceso',
    label: 'Último Acceso',
    sortable: true,
    render: (value, row) => (
      <div className="text-sm text-gray-500">
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
      const token = localStorage.getItem('token');
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
      const token = localStorage.getItem('token');
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
      const token = localStorage.getItem('token');
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
  const handleRowAction = (action, usuario) => {
    switch (action) {
      case 'view':
        setSelectedUser(usuario);
        setShowViewModal(true);
        break;
      case 'edit':
        setEditingUser(usuario);
        setShowEditModal(true);
        break;
      case 'toggle':
        handleToggleStatus(usuario);
        break;
      case 'reset':
        handleResetPassword(usuario);
        break;
      default:
        break;
    }
  };

  // Función para cambiar estado del usuario
  const handleToggleStatus = async (usuario) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = usuario.usuario_activo 
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
        await cargarUsuarios();
        showToast(`Usuario ${usuario.usuario_activo ? 'desactivado' : 'activado'} correctamente`, 'success');
        setError('');
      } else {
        const result = await response.json();
        showToast(result.message || 'Error al cambiar estado del usuario', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('Error de conexión', 'error');
    }
  };

  // Función para resetear contraseña
  const handleResetPassword = async (usuario) => {
    if (!window.confirm(`¿Estás seguro de que quieres resetear la contraseña de ${usuario.username}?`)) {
      return;
    }

    const newPassword = prompt('Ingresa la nueva contraseña (mínimo 6 caracteres):');
    if (!newPassword || newPassword.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
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
    }
  };

  // Manejar envío del formulario de edición
  const handleEditSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      
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
      const token = localStorage.getItem('token');
      
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Usuarios</h1>
          <p className="text-gray-600">Administra los usuarios del sistema SIRDS</p>
        </div>
        <button
          onClick={handleNewUser}
          className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-5 py-2.5 font-medium transition-all duration-200 flex items-center gap-2 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Usuario
        </button>
      </div>

      {/* Mensajes de error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-xl">
          {error}
        </div>
      )}

      {/* Estadísticas rápidas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total_usuarios}
                </p>
                <p className="text-gray-600 text-sm">
                  Total Usuarios
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.usuarios_activos}
                </p>
                <p className="text-gray-600 text-sm">
                  Activos
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.administradores}
                </p>
                <p className="text-gray-600 text-sm">
                  Administradores
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.activos_ultimo_mes}
                </p>
                <p className="text-gray-600 text-sm">
                  Último Mes
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros adicionales para usuarios */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
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
      </div>

      {/* DataTable */}
      <DataTable
        columns={USUARIOS_COLUMNS}
        data={usuariosFiltrados}
        rowKey="id_usuario"
        loading={isLoading}
        error={error}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        searchPlaceholder="Buscar por usuario, nombre, email..."
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
            label: (row) => row.usuario_activo ? 'Desactivar' : 'Activar',
            action: 'toggle',
            icon: (row) => row.usuario_activo ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            className: (row) => row.usuario_activo ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
          },
          {
            label: 'Reset Password',
            action: 'reset',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2a2 2 0 00-2 2m2-2V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 0a2 2 0 00-2 2m2-2a2 2 0 012 2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            className: 'text-orange-600 hover:text-orange-900'
          }
        ]}
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
