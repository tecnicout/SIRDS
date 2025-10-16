import React, { useState, useEffect } from 'react';

export default function Areas() {
  const [areas, setAreas] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
  const [selectedArea, setSelectedArea] = useState(null);
  const [formData, setFormData] = useState({
    nombre_area: '',
    id_ubicacion: ''
  });
  const [formErrors, setFormErrors] = useState({});
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

  // Cargar áreas y ubicaciones al iniciar el componente
  useEffect(() => {
    cargarAreas();
    cargarUbicaciones();
  }, []);

  // Efecto para recargar áreas cuando cambia el filtro
  useEffect(() => {
    cargarAreas();
  }, [mostrarInactivas]);

  const cargarAreas = async () => {
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
  };

  const cargarUbicaciones = async () => {
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
  };

  // Función para abrir modal de nueva área
  const abrirModalNueva = () => {
    setModalMode('create');
    setSelectedArea(null);
    setFormData({
      nombre_area: '',
      id_ubicacion: ''
    });
    setFormErrors({});
    setShowModal(true);
  };

  // Función para abrir modal de edición
  const abrirModalEditar = (area) => {
    setModalMode('edit');
    setSelectedArea(area);
    setFormData({
      nombre_area: area.nombre_area || '',
      id_ubicacion: area.id_ubicacion || ''
    });
    setFormErrors({});
    setShowModal(true);
  };

  // Función para ver detalles del área
  const abrirModalVer = (area) => {
    setModalMode('view');
    setSelectedArea(area);
    setShowModal(true);
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
      showToast('Error de conexión', 'error');
    }
  };

  // Función para reactivar área
  const reactivarArea = async (area) => {
    if (!window.confirm(`¿Deseas reactivar el área "${area.nombre_area}"?\n\nEsta acción permitirá que vuelva a estar disponible en el sistema.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/areas/${area.id_area}/reactivar`, {
        method: 'PUT',
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
        showToast(result.message || 'Error al reactivar área', 'error');
      }
    } catch (error) {
      console.error('Error al reactivar área:', error);
      showToast('Error de conexión', 'error');
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
    
    if (!formData.nombre_area.trim()) errores.nombre_area = 'El nombre del área es requerido';
    if (!formData.id_ubicacion) errores.id_ubicacion = 'La ubicación es requerida';
    
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
        ? '/api/areas'
        : `/api/areas/${selectedArea.id_area}`;
      
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
        await cargarAreas(); // Recargar lista
        setShowModal(false);
        showToast(result.message, 'success');
      } else {
        showToast('Error: ' + result.message, 'error');
      }
    } catch (error) {
      console.error('Error al guardar área:', error);
      showToast('Error de conexión', 'error');
    }
  };

  // Filtrar áreas según el término de búsqueda
  const areasFiltradas = areas.filter(area =>
    area.nombre_area?.toLowerCase().includes(filtro.toLowerCase()) ||
    area.ubicacion_nombre?.toLowerCase().includes(filtro.toLowerCase())
  );

  // Contadores para estadísticas
  const totalAreas = areas.length;
  const areasConUbicacion = areas.filter(area => area.id_ubicacion).length;
  const areasSinUbicacion = areas.filter(area => !area.id_ubicacion).length;
  const ubicacionesConAreas = new Set(areas.filter(area => area.id_ubicacion).map(area => area.id_ubicacion)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Áreas</h1>
          <p className="text-gray-600">Administra las áreas organizacionales de Arroz Sonora</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Toggle para mostrar inactivas */}
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={mostrarInactivas}
              onChange={(e) => setMostrarInactivas(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Mostrar áreas inactivas
          </label>
          
          <button 
            onClick={abrirModalNueva}
            className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Nueva Área</span>
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Áreas</p>
              <p className="text-2xl font-bold text-gray-900">{totalAreas}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Con Ubicación</p>
              <p className="text-2xl font-bold text-gray-900">{areasConUbicacion}</p>
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
              <p className="text-sm font-medium text-gray-600">Sin Ubicación</p>
              <p className="text-2xl font-bold text-gray-900">{areasSinUbicacion}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ubicaciones Activas</p>
              <p className="text-2xl font-bold text-gray-900">{ubicacionesConAreas}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
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
              Buscar áreas
            </label>
            <div className="relative">
              <input
                type="text"
                id="buscar"
                placeholder="Nombre del área o ubicación..."
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

      {/* Tabla de áreas */}
      <div className="bg-white shadow border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center space-x-2">
              <svg className="animate-spin h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-gray-600">Cargando áreas...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="text-red-600 mb-2">❌ {error}</div>
            <button 
              onClick={cargarAreas}
              className="text-primary-600 hover:text-primary-500 font-medium"
            >
              Intentar de nuevo
            </button>
          </div>
        ) : areasFiltradas.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {filtro ? 'No se encontraron áreas que coincidan con la búsqueda' : 'No hay áreas registradas'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Área
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {areasFiltradas.map((area) => (
                  <tr key={area.id_area} className={`hover:bg-gray-50 ${area.estado === 'inactiva' ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          area.estado === 'inactiva' ? 'bg-red-100' : 'bg-primary-100'
                        }`}>
                          <span className={`font-medium text-sm ${
                            area.estado === 'inactiva' ? 'text-red-600' : 'text-primary-600'
                          }`}>
                            🏢
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center gap-2">
                            <div className={`text-sm font-medium ${
                              area.estado === 'inactiva' ? 'text-gray-500' : 'text-gray-900'
                            }`}>
                              {area.nombre_area}
                            </div>
                            {area.estado === 'inactiva' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                Inactiva
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {area.id_area}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {area.ubicacion_nombre ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {area.ubicacion_nombre}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Sin ubicación
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => abrirModalEditar(area)}
                          disabled={area.estado === 'inactiva'}
                          className={`${
                            area.estado === 'inactiva' 
                              ? 'text-gray-400 cursor-not-allowed' 
                              : 'text-primary-600 hover:text-primary-900'
                          }`}
                          title={area.estado === 'inactiva' ? 'No se puede editar área inactiva' : 'Editar área'}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => abrirModalVer(area)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Ver detalles"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {area.estado === 'activa' && (
                          <button 
                            onClick={() => inactivarArea(area)}
                            className="text-red-600 hover:text-red-900"
                            title="Inactivar área"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                            </svg>
                          </button>
                        )}
                        {area.estado === 'inactiva' && (
                          <button 
                            onClick={() => reactivarArea(area)}
                            className="text-green-600 hover:text-green-900"
                            title="Reactivar área"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para Crear/Editar/Ver Área */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-screen overflow-y-auto">
            {/* Header del Modal */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {modalMode === 'create' && 'Nueva Área'}
                  {modalMode === 'edit' && 'Editar Área'}
                  {modalMode === 'view' && 'Detalles del Área'}
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
              {modalMode === 'view' && selectedArea ? (
                // Vista de solo lectura
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Área</label>
                      <p className="text-gray-900">{selectedArea.nombre_area}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                      <p className="text-gray-900">{selectedArea.ubicacion_nombre || 'Sin ubicación asignada'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedArea.estado === 'activa' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedArea.estado === 'activa' ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                // Formulario de crear/editar
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label htmlFor="nombre_area" className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre del Área <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="nombre_area"
                        name="nombre_area"
                        value={formData.nombre_area}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          formErrors.nombre_area ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Nombre del área"
                        required
                      />
                      {formErrors.nombre_area && <p className="text-red-500 text-sm mt-1">{formErrors.nombre_area}</p>}
                    </div>
                    
                    <div>
                      <label htmlFor="id_ubicacion" className="block text-sm font-medium text-gray-700 mb-1">
                        Ubicación <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="id_ubicacion"
                        name="id_ubicacion"
                        value={formData.id_ubicacion}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          formErrors.id_ubicacion ? 'border-red-500' : 'border-gray-300'
                        }`}
                        required
                      >
                        <option value="">Seleccionar ubicación</option>
                        {ubicaciones.map((ubicacion) => (
                          <option key={ubicacion.id_ubicacion} value={ubicacion.id_ubicacion}>
                            {ubicacion.nombre} ({ubicacion.tipo})
                          </option>
                        ))}
                      </select>
                      {formErrors.id_ubicacion && <p className="text-red-500 text-sm mt-1">{formErrors.id_ubicacion}</p>}
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
                      {modalMode === 'create' ? 'Crear Área' : 'Actualizar Área'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

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