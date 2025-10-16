import React, { useState, useEffect } from 'react';

export default function Empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
  const [selectedEmpleado, setSelectedEmpleado] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    cargo: '',
    id_genero: '',
    id_area: '',
    id_rol: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [areas, setAreas] = useState([]);
  const [areasError, setAreasError] = useState('');

  // Cargar empleados al iniciar el componente
  useEffect(() => {
    cargarEmpleados();
  }, []);

  const cargarEmpleados = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
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
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar áreas desde el backend
  const cargarAreas = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/areas', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setAreas(result.data || []);
        setAreasError('');
      } else {
        setAreasError('No se pudieron cargar las áreas');
        console.error('Error al cargar áreas:', response.status);
      }
    } catch (error) {
      setAreasError('No se pudieron cargar las áreas');
      console.error('Error al cargar áreas:', error);
    }
  };

  // Función para abrir modal de nuevo empleado
  const abrirModalNuevo = async () => {
    setModalMode('create');
    setSelectedEmpleado(null);
    setFormData({
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      cargo: '',
      id_genero: '',
      id_area: '',
      id_rol: ''
    });
    setFormErrors({});
    setShowModal(true);
    
    // Cargar áreas al abrir el modal
    await cargarAreas();
  };

  // Función para abrir modal de edición
  const abrirModalEditar = async (empleado) => {
    setModalMode('edit');
    setSelectedEmpleado(empleado);
    setFormData({
      nombre: empleado.nombre || '',
      apellido: empleado.apellido || '',
      email: empleado.email || '',
      telefono: empleado.telefono || '',
      cargo: empleado.cargo || '',
      id_genero: empleado.id_genero || '',
      id_area: empleado.id_area || '',
      id_rol: empleado.id_rol || ''
    });
    setFormErrors({});
    setShowModal(true);
    
    // Cargar áreas al abrir el modal
    await cargarAreas();
  };

  // Función para ver detalles del empleado
  const abrirModalVer = (empleado) => {
    setModalMode('view');
    setSelectedEmpleado(empleado);
    setShowModal(true);
  };

  // Función para cambiar estado del empleado
  const cambiarEstado = async (empleado) => {
    if (!window.confirm(`¿Estás seguro de ${empleado.estado ? 'desactivar' : 'activar'} a ${empleado.nombre} ${empleado.apellido}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/empleados/${empleado.id_empleado}/estado`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estado: !empleado.estado })
      });

      const result = await response.json();
      
      if (result.success) {
        await cargarEmpleados(); // Recargar lista
        alert(result.message);
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert('Error de conexión');
    }
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo modificado
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validar formulario
  const validarFormulario = () => {
    const errores = {};
    
    if (!formData.nombre.trim()) errores.nombre = 'El nombre es requerido';
    if (!formData.apellido.trim()) errores.apellido = 'El apellido es requerido';
    if (!formData.id_genero) errores.id_genero = 'El género es requerido';
    if (!formData.id_area) errores.id_area = 'El área es requerida';
    if (!formData.id_rol) errores.id_rol = 'El rol es requerido';
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errores.email = 'El email no es válido';
    }
    
    setFormErrors(errores);
    return Object.keys(errores).length === 0;
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) return;
    
    try {
      const token = localStorage.getItem('token');
      const url = modalMode === 'create' 
        ? '/api/empleados'
        : `/api/empleados/${selectedEmpleado.id_empleado}`;
      
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (result.success) {
        await cargarEmpleados(); // Recargar lista
        setShowModal(false);
        alert(result.message);
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      console.error('Error al guardar empleado:', error);
      alert('Error de conexión');
    }
  };

  // Filtrar empleados según el término de búsqueda
  const empleadosFiltrados = empleados.filter(empleado =>
    empleado.nombre?.toLowerCase().includes(filtro.toLowerCase()) ||
    empleado.apellido?.toLowerCase().includes(filtro.toLowerCase()) ||
    empleado.email?.toLowerCase().includes(filtro.toLowerCase()) ||
    empleado.puesto?.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Empleados</h1>
          <p className="text-gray-600">Administra la información de los empleados de Arroz Sonora</p>
        </div>
        <button 
          onClick={abrirModalNuevo}
          className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Nuevo Empleado</span>
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Empleados</p>
              <p className="text-2xl font-bold text-gray-900">{empleados.length}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Con Acceso</p>
              <p className="text-2xl font-bold text-gray-900">
                {empleados.filter(emp => emp.password).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Activos</p>
              <p className="text-2xl font-bold text-gray-900">
                {empleados.filter(emp => emp.estado).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Departamentos</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(empleados.map(emp => emp.departamento).filter(Boolean)).size}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex-1 max-w-md">
            <label htmlFor="buscar" className="block text-sm font-medium text-gray-700 mb-2">
              Buscar empleados
            </label>
            <div className="relative">
              <input
                type="text"
                id="buscar"
                placeholder="Nombre, apellido, email o puesto..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
              </svg>
              <span>Filtros</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              <span>Exportar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de empleados */}
      <div className="bg-white shadow border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center space-x-2">
              <svg className="animate-spin h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-gray-600">Cargando empleados...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="text-red-600 mb-2">❌ {error}</div>
            <button 
              onClick={cargarEmpleados}
              className="text-primary-600 hover:text-primary-500 font-medium"
            >
              Intentar de nuevo
            </button>
          </div>
        ) : empleadosFiltrados.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {filtro ? 'No se encontraron empleados que coincidan con la búsqueda' : 'No hay empleados registrados'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empleado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Puesto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Departamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {empleadosFiltrados.map((empleado) => (
                  <tr key={empleado.id_empleado} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-medium text-sm">
                            {empleado.nombre?.charAt(0)}{empleado.apellido?.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {empleado.nombre} {empleado.apellido}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {empleado.id_empleado}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{empleado.email}</div>
                      <div className="text-sm text-gray-500">{empleado.telefono}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {empleado.puesto || 'No especificado'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {empleado.departamento || 'No especificado'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          empleado.estado 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {empleado.estado ? 'Activo' : 'Inactivo'}
                        </span>
                        {empleado.password && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Con acceso
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => abrirModalEditar(empleado)}
                          className="text-primary-600 hover:text-primary-900"
                          title="Editar empleado"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => abrirModalVer(empleado)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Ver detalles"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => cambiarEstado(empleado)}
                          className={`${empleado.estado ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                          title={empleado.estado ? 'Desactivar empleado' : 'Activar empleado'}
                        >
                          {empleado.estado ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para Crear/Editar/Ver Empleado */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-screen overflow-y-auto">
            {/* Header del Modal */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {modalMode === 'create' && 'Nuevo Empleado'}
                  {modalMode === 'edit' && 'Editar Empleado'}
                  {modalMode === 'view' && 'Detalles del Empleado'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="px-6 py-4">
              {modalMode === 'view' && selectedEmpleado ? (
                // Vista de solo lectura
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                      <p className="text-gray-900">{selectedEmpleado.nombre}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                      <p className="text-gray-900">{selectedEmpleado.apellido}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <p className="text-gray-900">{selectedEmpleado.email || 'No especificado'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                      <p className="text-gray-900">{selectedEmpleado.telefono || 'No especificado'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                      <p className="text-gray-900">{selectedEmpleado.cargo || 'No especificado'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
                      <p className="text-gray-900">{selectedEmpleado.genero_nombre || 'No especificado'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
                      <p className="text-gray-900">{selectedEmpleado.nombre_area || 'No especificado'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                      <p className="text-gray-900">{selectedEmpleado.nombre_rol || 'No especificado'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedEmpleado.estado 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedEmpleado.estado ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                // Formulario de crear/editar
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="nombre"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          formErrors.nombre ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Nombre del empleado"
                        required
                      />
                      {formErrors.nombre && <p className="text-red-500 text-sm mt-1">{formErrors.nombre}</p>}
                    </div>
                    
                    <div>
                      <label htmlFor="apellido" className="block text-sm font-medium text-gray-700 mb-1">
                        Apellido <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="apellido"
                        name="apellido"
                        value={formData.apellido}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          formErrors.apellido ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Apellido del empleado"
                        required
                      />
                      {formErrors.apellido && <p className="text-red-500 text-sm mt-1">{formErrors.apellido}</p>}
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          formErrors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="email@ejemplo.com"
                      />
                      {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
                    </div>
                    
                    <div>
                      <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        id="telefono"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="(662) 123-4567"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="cargo" className="block text-sm font-medium text-gray-700 mb-1">
                        Cargo
                      </label>
                      <input
                        type="text"
                        id="cargo"
                        name="cargo"
                        value={formData.cargo}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Puesto del empleado"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="id_genero" className="block text-sm font-medium text-gray-700 mb-1">
                        Género <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="id_genero"
                        name="id_genero"
                        value={formData.id_genero}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          formErrors.id_genero ? 'border-red-500' : 'border-gray-300'
                        }`}
                        required
                      >
                        <option value="">Seleccionar género</option>
                        <option value="1">Masculino</option>
                        <option value="2">Femenino</option>
                      </select>
                      {formErrors.id_genero && <p className="text-red-500 text-sm mt-1">{formErrors.id_genero}</p>}
                    </div>
                    
                    <div>
                      <label htmlFor="id_area" className="block text-sm font-medium text-gray-700 mb-1">
                        Área <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="id_area"
                        name="id_area"
                        value={formData.id_area}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          formErrors.id_area ? 'border-red-500' : 'border-gray-300'
                        }`}
                        required
                      >
                        <option value="">Seleccionar área</option>
                        {areas.map((area) => (
                          <option key={area.id_area} value={area.id_area}>
                            {area.nombre_area}
                          </option>
                        ))}
                      </select>
                      {formErrors.id_area && <p className="text-red-500 text-sm mt-1">{formErrors.id_area}</p>}
                      {areasError && (
                        <p className="text-orange-600 text-sm mt-1 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          {areasError}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="id_rol" className="block text-sm font-medium text-gray-700 mb-1">
                        Rol <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="id_rol"
                        name="id_rol"
                        value={formData.id_rol}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          formErrors.id_rol ? 'border-red-500' : 'border-gray-300'
                        }`}
                        required
                      >
                        <option value="">Seleccionar rol</option>
                        <option value="1">Empleado</option>
                        <option value="2">Supervisor</option>
                        <option value="3">Jefe de Área</option>
                        <option value="4">Administrador</option>
                      </select>
                      {formErrors.id_rol && <p className="text-red-500 text-sm mt-1">{formErrors.id_rol}</p>}
                    </div>
                  </div>
                  
                  {/* Botones del formulario */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      {modalMode === 'create' ? 'Crear Empleado' : 'Actualizar Empleado'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
