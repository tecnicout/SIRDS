import React, { useState, useEffect } from 'react';

const DataTableEntregas = ({ refreshTrigger }) => {
  const [entregas, setEntregas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estado: '',
    area: ''
  });
  const [paginacion, setPaginacion] = useState({
    paginaActual: 1,
    itemsPorPagina: 10,
    totalItems: 0
  });

  const [areas, setAreas] = useState([]);
  const [entregaSeleccionada, setEntregaSeleccionada] = useState(null);
  const [mostrandoDetalle, setMostrandoDetalle] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    cargarEntregas();
    cargarAreas();
  }, [refreshTrigger, filtros, paginacion.paginaActual]);

  // Asegurar que `areas` siempre sea un array (protección adicional)
  useEffect(() => {
    if (!Array.isArray(areas)) {
      const normalized = Array.isArray(areas?.data) ? areas.data : [];
      setAreas(normalized);
    }
  }, [areas]);

  const cargarEntregas = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const queryParams = new URLSearchParams({
        page: paginacion.paginaActual,
        limit: paginacion.itemsPorPagina,
        search: filtros.busqueda,
        estado: filtros.estado,
        area: filtros.area
      });

  const response = await fetch(`http://localhost:3001/api/dotaciones/entregas?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Normalizar distintos formatos de respuesta:
        // - { success: true, data: [...] }
        // - { entregas: [...], total: N }
        // - [...] (array)
        let entregasData = [];
        let total = 0;

        if (Array.isArray(data)) {
          entregasData = data;
          total = data.length;
        } else if (data) {
          entregasData = Array.isArray(data.data) ? data.data : (Array.isArray(data.entregas) ? data.entregas : []);
          total = data.total ?? (Array.isArray(entregasData) ? entregasData.length : 0);
        }

        setEntregas(entregasData || []);
        setPaginacion(prev => ({
          ...prev,
          totalItems: total
        }));
      } else {
        console.error('Error al cargar entregas');
        setEntregas([]);
      }
    } catch (error) {
      console.error('Error:', error);
      setEntregas([]);
    } finally {
      setLoading(false);
    }
  };

  const cargarAreas = async () => {
    try {
      const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:3001/api/areas', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const areasList = Array.isArray(data) ? data : (data?.data ?? []);
        setAreas(areasList);
      }
    } catch (error) {
      console.error('Error al cargar áreas:', error);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
    setPaginacion(prev => ({
      ...prev,
      paginaActual: 1
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      busqueda: '',
      estado: '',
      area: ''
    });
    setPaginacion(prev => ({
      ...prev,
      paginaActual: 1
    }));
  };

  const cambiarPagina = (nuevaPagina) => {
    setPaginacion(prev => ({
      ...prev,
      paginaActual: nuevaPagina
    }));
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  const getEstadoBadge = (estado) => {
    const estilos = {
      'entregado': 'bg-green-100 text-green-800',
      'pendiente': 'bg-yellow-100 text-yellow-800',
      'vencido': 'bg-red-100 text-red-800'
    };
    
    return estilos[estado] || 'bg-gray-100 text-gray-800';
  };

  const verDetalle = (entrega) => {
    setEntregaSeleccionada(entrega);
    setMostrandoDetalle(true);
  };

  const exportarExcel = async () => {
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        search: filtros.busqueda,
        estado: filtros.estado,
        area: filtros.area,
        export: 'excel'
      });

  const response = await fetch(`http://localhost:3001/api/dotaciones/entregas?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `entregas_dotaciones_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error al exportar:', error);
    }
  };

  const totalPaginas = Math.ceil(paginacion.totalItems / paginacion.itemsPorPagina);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        {/* Header con filtros */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Registro de Entregas ({paginacion.totalItems})
            </h3>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={exportarExcel}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
              >
                <i className="bx bxs-file-export"></i>
                Exportar Excel
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <input
                type="text"
                placeholder="Buscar empleado..."
                value={filtros.busqueda}
                onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <select
                value={filtros.estado}
                onChange={(e) => handleFiltroChange('estado', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos los estados</option>
                <option value="entregado">Entregado</option>
                <option value="pendiente">Pendiente</option>
                <option value="vencido">Vencido</option>
              </select>
            </div>

            <div>
              <select
                value={filtros.area}
                onChange={(e) => handleFiltroChange('area', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas las áreas</option>
                {Array.isArray(areas) ? areas.map(area => (
                  <option key={area.id_area} value={area.id_area}>
                    {area.nombre_area}
                  </option>
                )) : null}
              </select>
            </div>

            <div>
              <button
                onClick={limpiarFiltros}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empleado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Área
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dotación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Entrega
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Próx. Entrega
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
              {entregas.length > 0 ? (
                entregas.map((entrega) => (
                  <tr key={entrega.id_entrega} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {entrega.nombre_empleado}
                        </div>
                        <div className="text-sm text-gray-500">
                          {entrega.documento}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entrega.nombre_area}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {entrega.nombre_dotacion}
                        </div>
                        <div className="text-sm text-gray-500">
                          Talla: {entrega.talla || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatearFecha(entrega.fecha_entrega)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatearFecha(entrega.proxima_entrega)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoBadge(entrega.estado)}`}>
                        {entrega.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => verDetalle(entrega)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    No se encontraron entregas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando {Math.min((paginacion.paginaActual - 1) * paginacion.itemsPorPagina + 1, paginacion.totalItems)} - {Math.min(paginacion.paginaActual * paginacion.itemsPorPagina, paginacion.totalItems)} de {paginacion.totalItems} resultados
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => cambiarPagina(paginacion.paginaActual - 1)}
                disabled={paginacion.paginaActual === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              
              {[...Array(totalPaginas)].map((_, index) => {
                const pagina = index + 1;
                const mostrarPagina = pagina === 1 || 
                                    pagina === totalPaginas || 
                                    (pagina >= paginacion.paginaActual - 1 && pagina <= paginacion.paginaActual + 1);
                
                if (!mostrarPagina) {
                  if (pagina === paginacion.paginaActual - 2 || pagina === paginacion.paginaActual + 2) {
                    return <span key={pagina} className="px-3 py-1 text-gray-500">...</span>;
                  }
                  return null;
                }
                
                return (
                  <button
                    key={pagina}
                    onClick={() => cambiarPagina(pagina)}
                    className={`px-3 py-1 border rounded-md text-sm font-medium ${
                      pagina === paginacion.paginaActual
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-gray-300 text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {pagina}
                  </button>
                );
              })}
              
              <button
                onClick={() => cambiarPagina(paginacion.paginaActual + 1)}
                disabled={paginacion.paginaActual === totalPaginas}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      {mostrandoDetalle && entregaSeleccionada && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setMostrandoDetalle(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Detalle de Entrega
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="font-semibold">Empleado:</span> {entregaSeleccionada.nombre_empleado}
                      </div>
                      <div>
                        <span className="font-semibold">Documento:</span> {entregaSeleccionada.documento}
                      </div>
                      <div>
                        <span className="font-semibold">Área:</span> {entregaSeleccionada.nombre_area}
                      </div>
                      <div>
                        <span className="font-semibold">Dotación:</span> {entregaSeleccionada.nombre_dotacion}
                      </div>
                      <div>
                        <span className="font-semibold">Talla:</span> {entregaSeleccionada.talla || 'N/A'}
                      </div>
                      <div>
                        <span className="font-semibold">Fecha de entrega:</span> {formatearFecha(entregaSeleccionada.fecha_entrega)}
                      </div>
                      <div>
                        <span className="font-semibold">Próxima entrega:</span> {formatearFecha(entregaSeleccionada.proxima_entrega)}
                      </div>
                      <div>
                        <span className="font-semibold">Estado:</span> 
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoBadge(entregaSeleccionada.estado)}`}>
                          {entregaSeleccionada.estado}
                        </span>
                      </div>
                      {entregaSeleccionada.observaciones && (
                        <div>
                          <span className="font-semibold">Observaciones:</span> {entregaSeleccionada.observaciones}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => setMostrandoDetalle(false)}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DataTableEntregas;