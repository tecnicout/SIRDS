import React, { useState, useEffect, useCallback } from 'react';

const DataTableEntregas = ({ refreshTrigger, onChanged }) => {
  const [entregas, setEntregas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estado: '',
    area: '',
    kit: '' // '', 'con', 'sin'
  });
  const [paginacion, setPaginacion] = useState({
    paginaActual: 1,
    itemsPorPagina: 10,
    totalItems: 0
  });
  const [debouncedBusqueda, setDebouncedBusqueda] = useState('');

  const [areas, setAreas] = useState([]);
  const [entregaSeleccionada, setEntregaSeleccionada] = useState(null);
  const [mostrandoDetalle, setMostrandoDetalle] = useState(false);
  const [mostrandoEdicion, setMostrandoEdicion] = useState(false);
  const [editForm, setEditForm] = useState({ fecha_entrega: '', observaciones: '' });

  // Debounce para el buscador (evita interferencias al escribir)
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedBusqueda(filtros.busqueda);
    }, 400);
    return () => clearTimeout(id);
  }, [filtros.busqueda]);

  // Estado para el ciclo activo
  const [cicloActivo, setCicloActivo] = useState(null);

  // Cargar ciclo activo
  useEffect(() => {
    const cargarCicloActivo = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3001/api/ciclos/activo', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setCicloActivo(data.data);
          }
        }
      } catch (error) {
        console.error('Error al cargar ciclo activo:', error);
      }
    };
    cargarCicloActivo();
  }, []);

  const cargarEntregas = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const queryParams = new URLSearchParams({
        page: paginacion.paginaActual,
        limit: paginacion.itemsPorPagina,
        search: debouncedBusqueda,
        estado: filtros.estado,
        area: filtros.area,
        kit: filtros.kit,
        compat: '1'
      });

      if (cicloActivo) {
        queryParams.append('fecha_desde', cicloActivo.fecha_inicio_ventana);
        queryParams.append('fecha_hasta', cicloActivo.fecha_fin_ventana);
      }

      const response = await fetch(`http://localhost:3001/api/dotaciones/entregas?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        let entregasData = [];
        let total = 0;

        if (Array.isArray(data)) {
          entregasData = data;
          total = data.length;
        } else if (data) {
          entregasData = Array.isArray(data.data) ? data.data : (Array.isArray(data.entregas) ? data.entregas : []);
          total = data.total ?? (Array.isArray(entregasData) ? entregasData.length : 0);
        }

        let list = entregasData || [];
        if (filtros.estado) {
          const est = String(filtros.estado).toLowerCase();
          list = list.filter(e => String(e?.estado || '').toLowerCase() === est);
        }
        if (filtros.kit) {
          const kval = String(filtros.kit).toLowerCase();
          if (kval === 'con') list = list.filter(e => e?.id_kit != null);
          else if (kval === 'sin') list = list.filter(e => e?.id_kit == null);
        }

        setEntregas(list);
        setPaginacion(prev => ({
          ...prev,
          totalItems: filtros.estado ? list.length : total
        }));
      } else {
        try {
            const compatParams = new URLSearchParams({
            page: paginacion.paginaActual,
            limit: paginacion.itemsPorPagina,
            search: filtros.busqueda,
            estado: filtros.estado,
              area: filtros.area,
              kit: filtros.kit,
            compat: '1'
          });
          const resp2 = await fetch(`http://localhost:3001/api/dotaciones/entregas?${compatParams}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (resp2.ok) {
            const data2 = await resp2.json();
            const list2 = Array.isArray(data2?.data) ? data2.data : (Array.isArray(data2?.entregas) ? data2.entregas : []);
            let list = list2 || [];
            if (filtros.estado) {
              const est = String(filtros.estado).toLowerCase();
              list = list.filter(e => String(e?.estado || '').toLowerCase() === est);
            }
            if (filtros.kit) {
              const kval = String(filtros.kit).toLowerCase();
              if (kval === 'con') list = list.filter(e => e?.id_kit != null);
              else if (kval === 'sin') list = list.filter(e => e?.id_kit == null);
            }
            const total2 = data2?.total ?? (Array.isArray(list) ? list.length : 0);
            setEntregas(list);
            setPaginacion(prev => ({ ...prev, totalItems: filtros.estado ? list.length : total2 }));
          } else {
            console.error('Error al cargar entregas');
            setEntregas([]);
          }
        } catch (e) {
          console.error('Error al cargar entregas (compat intento):', e);
          setEntregas([]);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setEntregas([]);
    } finally {
      setLoading(false);
    }
  }, [cicloActivo, debouncedBusqueda, filtros.area, filtros.estado, filtros.kit, filtros.busqueda, paginacion.itemsPorPagina, paginacion.paginaActual]);

  // Cargar datos (sin bloquear los filtros)
  useEffect(() => {
    cargarEntregas();
  }, [cargarEntregas, refreshTrigger]);

  // Cargar áreas solo una vez (o cuando realmente se requiera)
  useEffect(() => {
    cargarAreas();
  }, []);

  // Asegurar que `areas` siempre sea un array (protección adicional)
  useEffect(() => {
    if (!Array.isArray(areas)) {
      const normalized = Array.isArray(areas?.data) ? areas.data : [];
      setAreas(normalized);
    }
  }, [areas]);


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
      'en proceso': 'bg-yellow-100 text-yellow-800',
      'procesado': 'bg-blue-100 text-blue-800'
    };
    
    return estilos[estado] || 'bg-gray-100 text-gray-800';
  };

  const [detalleItems, setDetalleItems] = useState([]);

  const verDetalle = async (entrega) => {
    setEntregaSeleccionada(entrega);
    setMostrandoDetalle(true);
    setDetalleItems([]);
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch(`http://localhost:3001/api/dotaciones/entregas/${entrega.id_entrega}/items`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        const data = await resp.json();
        setDetalleItems(Array.isArray(data?.data) ? data.data : []);
      }
    } catch (e) {
      console.error('Error cargando items de entrega:', e);
    }
  };

  const abrirEdicion = (entrega) => {
    setEntregaSeleccionada(entrega);
    setEditForm({
      fecha_entrega: entrega?.fecha_entrega ? new Date(entrega.fecha_entrega).toISOString().split('T')[0] : '',
      observaciones: entrega?.observaciones || ''
    });
    setMostrandoEdicion(true);
  };

  const guardarEdicion = async () => {
    try {
      if (!entregaSeleccionada) return;
      const token = localStorage.getItem('token');
      const resp = await fetch(`http://localhost:3001/api/dotaciones/entregas/${entregaSeleccionada.id_entrega}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });
      if (resp.ok) {
        await cargarEntregas();
        setMostrandoEdicion(false);
        // También refrescar KPIs tras editar por si la fecha cambia de período
        if (typeof onChanged === 'function') onChanged();
      } else {
        console.error('No se pudo actualizar la entrega');
      }
    } catch (e) {
      console.error('Error actualizando entrega:', e);
    }
  };

  const eliminarEntrega = async (entrega) => {
    if (!entrega) return;
    const confirmar = window.confirm('¿Eliminar esta entrega? Esta acción no se puede deshacer.');
    if (!confirmar) return;
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch(`http://localhost:3001/api/dotaciones/entregas/${entrega.id_entrega}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (resp.ok) {
        await cargarEntregas();
        // Notificar al padre para refrescar KPIs
        if (typeof onChanged === 'function') onChanged();
      } else {
        console.error('No se pudo eliminar la entrega');
      }
    } catch (e) {
      console.error('Error eliminando entrega:', e);
    }
  };

  const exportarExcel = async () => {
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        search: filtros.busqueda,
        estado: filtros.estado,
        area: filtros.area,
        kit: filtros.kit,
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

  // Ya no devolvemos un skeleton que reemplaza toda la vista; mantenemos filtros visibles

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        {/* Header minimalista */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 rounded-lg p-2.5">
                <i className='bx bx-clipboard text-2xl text-gray-700'></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Registro de Entregas
                  {cicloActivo && (
                    <span className="ml-2 text-sm font-semibold px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                      Ciclo: {cicloActivo.nombre_ciclo}
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {paginacion.totalItems} {paginacion.totalItems === 1 ? 'registro' : 'registros'} encontrados
                  {cicloActivo && (
                    <span className="ml-2">
                      • Ventana: {new Date(cicloActivo.fecha_inicio_ventana).toLocaleDateString()} - {new Date(cicloActivo.fecha_fin_ventana).toLocaleDateString()}
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <button
              onClick={exportarExcel}
              className="px-5 py-2.5 bg-[#B39237] text-white rounded-lg hover:bg-[#9C7F2F] transition-all duration-200 flex items-center gap-2 font-medium shadow-sm hover:shadow-md"
            >
              <i className='bx bxs-download text-lg'></i>
              Exportar Excel
            </button>
          </div>

          {/* Filtros rediseñados */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <i className='bx bx-search text-xl text-gray-400'></i>
              </div>
              <input
                type="text"
                placeholder="Buscar empleado..."
                value={filtros.busqueda}
                onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#B39237]/20 focus:border-[#B39237] focus:bg-white focus:outline-none text-gray-900 placeholder-gray-400 transition-all duration-150"
              />
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <i className='bx bx-flag text-xl text-gray-400'></i>
              </div>
              <select
                value={filtros.estado}
                onChange={(e) => handleFiltroChange('estado', e.target.value)}
                className="w-full pl-11 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#B39237]/20 focus:border-[#B39237] focus:bg-white focus:outline-none text-gray-900 appearance-none cursor-pointer transition-all duration-150"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
              >
                <option value="">Todos los estados</option>
                <option value="procesado">Procesado</option>
                <option value="en proceso">En Proceso</option>
                <option value="entregado">Entregado</option>
              </select>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <i className='bx bx-buildings text-xl text-gray-400'></i>
              </div>
              <select
                value={filtros.area}
                onChange={(e) => handleFiltroChange('area', e.target.value)}
                className="w-full pl-11 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#B39237]/20 focus:border-[#B39237] focus:bg-white focus:outline-none text-gray-900 appearance-none cursor-pointer transition-all duration-150"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
              >
                <option value="">Todas las áreas</option>
                {Array.isArray(areas) ? areas.map(area => (
                  <option key={area.id_area} value={area.id_area}>
                    {area.nombre_area}
                  </option>
                )) : null}
              </select>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <i className='bx bx-archive text-xl text-gray-400'></i>
              </div>
              <select
                value={filtros.kit}
                onChange={(e) => handleFiltroChange('kit', e.target.value)}
                className="w-full pl-11 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#B39237]/20 focus:border-[#B39237] focus:bg-white focus:outline-none text-gray-900 appearance-none cursor-pointer transition-all duration-150"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
              >
                <option value="">Todos los kits</option>
                <option value="con">Con kit</option>
                <option value="sin">Sin kit</option>
              </select>
            </div>

            <button
              onClick={limpiarFiltros}
              className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-150 font-medium flex items-center justify-center gap-2"
            >
              <i className='bx bx-x text-xl'></i>
              Limpiar filtros
            </button>
          </div>
        </div>

        {/* Tabla con diseño moderno */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider bg-gray-50">
                  Empleado
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider bg-gray-50">Documento</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider bg-gray-50">Teléfono</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider bg-gray-50">Área</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider bg-gray-50">Ubicación</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider bg-gray-50">Kit</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider bg-gray-50">
                  Fecha Entrega
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider bg-gray-50">
                  Estado
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider bg-gray-50">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                // Filas skeleton solo para el cuerpo de tabla
                [...Array(5)].map((_, i) => (
                  <tr key={`sk-${i}`} className="hover:bg-gray-50 transition-colors">
                    {[...Array(9)].map((__, j) => (
                      <td key={`sk-${i}-${j}`} className="px-6 py-4">
                        <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : entregas.length > 0 ? (
                entregas.map((entrega) => (
                  <tr key={entrega.id_entrega} className="hover:bg-[#F7F2E0]/30 transition-all duration-150 group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-400 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {entrega.nombre_empleado?.charAt(0)?.toUpperCase() || 'E'}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-semibold text-gray-900">{entrega.nombre_empleado}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{entrega.documento}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{entrega.telefono || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{entrega.nombre_area}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{entrega.nombre_ubicacion || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{entrega.nombre_kit || 'Sin kit'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600">
                        <i className='bx bx-calendar text-base text-gray-400 mr-1.5'></i>
                        {formatearFecha(entrega.fecha_entrega)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${getEstadoBadge(entrega.estado)}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
                        {entrega.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => abrirEdicion(entrega)}
                          className="p-2 text-gray-600 hover:text-[#B39237] hover:bg-gray-50 rounded-lg transition-colors duration-150"
                          title="Editar"
                        >
                          <i className='bx bx-edit-alt text-lg'></i>
                        </button>
                        <button
                          onClick={() => eliminarEntrega(entrega)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                          title="Eliminar"
                        >
                          <i className='bx bx-trash text-lg'></i>
                        </button>
                        <button
                          onClick={() => verDetalle(entrega)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                          title="Ver detalle"
                        >
                          <i className='bx bx-show text-lg'></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-gray-100 rounded-full p-6 mb-4">
                        <i className='bx bx-folder-open text-6xl text-gray-400'></i>
                      </div>
                      <p className="text-gray-600 font-semibold text-lg">No se encontraron entregas</p>
                      <p className="text-gray-400 text-sm mt-2">Intenta ajustar los filtros de búsqueda</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación con diseño mejorado */}
        {totalPaginas > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600 font-medium">
                Mostrando <span className="text-gray-900 font-semibold">{Math.min((paginacion.paginaActual - 1) * paginacion.itemsPorPagina + 1, paginacion.totalItems)}</span> - <span className="text-gray-900 font-semibold">{Math.min(paginacion.paginaActual * paginacion.itemsPorPagina, paginacion.totalItems)}</span> de <span className="text-gray-900 font-semibold">{paginacion.totalItems}</span> resultados
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => cambiarPagina(paginacion.paginaActual - 1)}
                  disabled={paginacion.paginaActual === 1}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 transition-all duration-150 flex items-center gap-2"
                >
                  <i className='bx bx-chevron-left text-lg'></i>
                  <span className="hidden sm:inline">Anterior</span>
                </button>
                
                <div className="hidden sm:flex items-center gap-1">
                  {[...Array(totalPaginas)].map((_, index) => {
                    const pagina = index + 1;
                    const mostrarPagina = pagina === 1 || 
                                        pagina === totalPaginas || 
                                        (pagina >= paginacion.paginaActual - 1 && pagina <= paginacion.paginaActual + 1);
                    
                    if (!mostrarPagina) {
                      if (pagina === paginacion.paginaActual - 2 || pagina === paginacion.paginaActual + 2) {
                        return <span key={pagina} className="px-3 py-2 text-gray-400">...</span>;
                      }
                      return null;
                    }
                    
                    return (
                      <button
                        key={pagina}
                        onClick={() => cambiarPagina(pagina)}
                        className={`min-w-[40px] h-10 rounded-lg text-sm font-semibold transition-all duration-150 ${
                          pagina === paginacion.paginaActual
                            ? 'bg-[#B39237] text-white shadow-sm'
                            : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pagina}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => cambiarPagina(paginacion.paginaActual + 1)}
                  disabled={paginacion.paginaActual === totalPaginas}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 transition-all duration-150 flex items-center gap-2"
                >
                  <span className="hidden sm:inline">Siguiente</span>
                  <i className='bx bx-chevron-right text-lg'></i>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      {mostrandoDetalle && entregaSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setMostrandoDetalle(false)}></div>
            
            <div className="relative bg-white always-white rounded-2xl shadow-2xl w-full max-w-3xl border border-gray-200 max-h-[80vh] flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#B39237] to-[#D4AF37] px-6 py-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#B39237]">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Detalle de Entrega</h3>
                      <p className="text-xs text-white/90">Información completa del registro</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setMostrandoDetalle(false)}
                    className="rounded-lg p-2 text-white hover:bg-white/20 transition"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Body con scroll */}
              <div className="bg-white always-white px-6 py-4 overflow-y-auto flex-1">
                {/* Información del Empleado */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <svg className="h-4 w-4 text-[#B39237]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Información del Empleado
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 rounded-lg p-3">
                    <div>
                      <span className="text-xs font-medium text-gray-500">Nombre completo</span>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">{entregaSeleccionada.nombre_empleado}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500">Documento</span>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">{entregaSeleccionada.documento}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500">Teléfono</span>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">{entregaSeleccionada.telefono || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500">Cargo</span>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">{entregaSeleccionada.cargo || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Ubicación y Kit */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <svg className="h-4 w-4 text-[#B39237]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Ubicación y Asignación
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-gray-50 rounded-lg p-3">
                    <div>
                      <span className="text-xs font-medium text-gray-500">Área</span>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">{entregaSeleccionada.nombre_area || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500">Ubicación</span>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">{entregaSeleccionada.nombre_ubicacion || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500">Kit asignado</span>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">{entregaSeleccionada.nombre_kit || 'Sin kit'}</p>
                    </div>
                  </div>
                </div>

                {/* Estado y Fecha */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <svg className="h-4 w-4 text-[#B39237]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Detalles de la Entrega
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 rounded-lg p-3">
                    <div>
                      <span className="text-xs font-medium text-gray-500">Fecha de entrega</span>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">{formatearFecha(entregaSeleccionada.fecha_entrega)}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500">Estado</span>
                      <div className="mt-0.5">
                        <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${getEstadoBadge(entregaSeleccionada.estado)}`}>
                          {entregaSeleccionada.estado}
                        </span>
                      </div>
                    </div>
                    {entregaSeleccionada.observaciones && (
                      <div className="md:col-span-2">
                        <span className="text-xs font-medium text-gray-500">Observaciones</span>
                        <p className="text-sm text-gray-900 mt-0.5">{entregaSeleccionada.observaciones}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items Entregados */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <svg className="h-4 w-4 text-[#B39237]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Ítems Entregados ({detalleItems.length})
                  </h4>
                  {detalleItems.length > 0 ? (
                    <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto">
                      <div className="space-y-2">
                        {detalleItems.map((it, idx) => (
                          <div key={it.id_entrega || idx} className="flex items-center justify-between bg-white always-white rounded-lg p-2.5 border border-gray-200">
                            <div className="flex items-center gap-2.5 flex-1">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F7F2E0] text-[#B39237] text-xs font-bold">
                                {idx + 1}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900">{it.nombre_dotacion}</p>
                                {it.talla && <p className="text-xs text-gray-500">Talla: {it.talla}</p>}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="inline-flex items-center rounded-full bg-[#B39237] px-2.5 py-0.5 text-xs font-semibold text-white">
                                Cant. {it.cantidad}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-6 text-center">
                      <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-500">No hay ítems para mostrar</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-3 flex justify-end border-t border-gray-200">
                <button
                  onClick={() => setMostrandoDetalle(false)}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white always-white px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cerrar
                </button>
              </div>
            </div>
        </div>
      )}

      {/* Modal de edición - Diseño profesional sin transparencias */}
      {mostrandoEdicion && entregaSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div 
            className="fixed inset-0" 
            onClick={() => setMostrandoEdicion(false)}
          ></div>
          
          <div className="relative bg-white always-white rounded-2xl shadow-2xl w-full max-w-xl border border-gray-200 transform transition-all">
            {/* Header elegante */}
            <div className="bg-gradient-to-r from-[#B39237] to-[#D4AF37] px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                    <i className='bx bx-edit text-2xl text-white'></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Editar entrega</h3>
                    <p className="text-sm text-white/90 mt-0.5">Modifica los datos del registro</p>
                  </div>
                </div>
                <button
                  onClick={() => setMostrandoEdicion(false)}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all"
                >
                  <i className='bx bx-x text-2xl'></i>
                </button>
              </div>
            </div>

            {/* Cuerpo del formulario */}
            <div className="px-6 py-6 bg-white always-white">
              {/* Información del empleado */}
              <div className="bg-gray-50 always-white rounded-xl p-4 mb-6 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-lg">
                      {entregaSeleccionada.nombre_empleado?.charAt(0)?.toUpperCase() || 'E'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-gray-900 truncate">
                      {entregaSeleccionada.nombre_empleado}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 always-white text-gray-700">
                        <i className='bx bx-id-card text-sm mr-1'></i>
                        {entregaSeleccionada.documento}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 always-white text-gray-700">
                        <i className='bx bx-buildings text-sm mr-1'></i>
                        {entregaSeleccionada.nombre_area}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Formulario de edición */}
              <div className="space-y-5">
                {/* Fecha de entrega */}
                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <i className='bx bx-calendar text-lg mr-2 text-[#B39237]'></i>
                    Fecha de entrega
                  </label>
                  <input
                    type="date"
                    value={editForm.fecha_entrega}
                    onChange={(e) => setEditForm(prev => ({ ...prev, fecha_entrega: e.target.value }))}
                    className="w-full px-4 py-3 bg-white always-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#B39237]/30 focus:border-[#B39237] focus:outline-none transition-all text-gray-900 font-medium"
                  />
                </div>

                {/* Observaciones */}
                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <i className='bx bx-message-square-detail text-lg mr-2 text-[#B39237]'></i>
                    Observaciones
                  </label>
                  <textarea
                    rows="4"
                    value={editForm.observaciones}
                    onChange={(e) => setEditForm(prev => ({ ...prev, observaciones: e.target.value }))}
                    placeholder="Agrega comentarios o notas adicionales..."
                    className="w-full px-4 py-3 bg-white always-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#B39237]/30 focus:border-[#B39237] focus:outline-none transition-all text-gray-900 placeholder-gray-400 resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    <i className='bx bx-info-circle text-sm mr-1'></i>
                    Información adicional sobre la entrega
                  </p>
                </div>
              </div>
            </div>

            {/* Footer con botones */}
            <div className="px-6 py-4 bg-gray-50 always-white border-t border-gray-200 rounded-b-2xl">
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setMostrandoEdicion(false)}
                  className="px-6 py-2.5 bg-white always-white border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 flex items-center gap-2"
                >
                  <i className='bx bx-x text-lg'></i>
                  Cancelar
                </button>
                <button
                  onClick={guardarEdicion}
                  className="px-6 py-2.5 bg-[#B39237] text-white rounded-xl text-sm font-bold hover:bg-[#9C7F2F] transition-all duration-150 flex items-center gap-2 shadow-md hover:shadow-lg"
                >
                  <i className='bx bx-check text-lg'></i>
                  Guardar cambios
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