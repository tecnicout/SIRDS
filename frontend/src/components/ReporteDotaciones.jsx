import React, { useState, useEffect, useCallback } from 'react';
import { getToken } from '../utils/tokenStorage';

const ReporteDotaciones = () => {
  const [reporteData, setReporteData] = useState({
    entregas_por_mes: [],
    entregas_por_categoria: [],
    entregas_por_area: []
  });
  const [filtros, setFiltros] = useState({
    fecha_inicio: '',
    fecha_fin: ''
  });
  const [loading, setLoading] = useState(true);
  const [tipoReporte, setTipoReporte] = useState('mes');

  const fetchReportes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
      if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);

      const token = getToken();
      const response = await fetch(`http://localhost:3001/api/dotaciones/reportes?${params.toString()}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const result = await response.json();
      
      if (result.success) {
        setReporteData(result.data);
      }
    } catch (error) {
      console.error('Error al cargar reportes:', error);
    } finally {
      setLoading(false);
    }
  }, [filtros.fecha_fin, filtros.fecha_inicio]);

  useEffect(() => {
    fetchReportes();
  }, [fetchReportes]);

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  const aplicarFiltros = () => {
    fetchReportes();
  };

  const limpiarFiltros = () => {
    setFiltros({
      fecha_inicio: '',
      fecha_fin: ''
    });
    // Refetch con filtros vacíos
    setTimeout(() => {
      fetchReportes();
    }, 100);
  };

  const exportarCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escapar comillas y wrap en comillas si contiene comas
          return typeof value === 'string' && value.includes(',') 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportarJSON = (data, filename) => {
    if (!data || data.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatearMes = (mes) => {
    const [year, month] = mes.split('-');
    const fecha = new Date(year, month - 1);
    return fecha.toLocaleDateString('es-MX', { year: 'numeric', month: 'long' });
  };

  const getCurrentData = () => {
    switch (tipoReporte) {
      case 'mes':
        return reporteData.entregas_por_mes;
      case 'categoria':
        return reporteData.entregas_por_categoria;
      case 'area':
        return reporteData.entregas_por_area;
      default:
        return [];
    }
  };

  const getCurrentFilename = () => {
    switch (tipoReporte) {
      case 'mes':
        return 'entregas_por_mes';
      case 'categoria':
        return 'entregas_por_categoria';
      case 'area':
        return 'entregas_por_area';
      default:
        return 'reporte_dotaciones';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const currentData = getCurrentData();

  return (
    <div>
      {/* Filtros */}
      <div className="mb-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros de Reporte</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Inicio
            </label>
            <input
              type="date"
              name="fecha_inicio"
              value={filtros.fecha_inicio}
              onChange={handleFiltroChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B39237] focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Fin
            </label>
            <input
              type="date"
              name="fecha_fin"
              value={filtros.fecha_fin}
              onChange={handleFiltroChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B39237] focus:border-transparent"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={aplicarFiltros}
              className="w-full bg-gradient-to-r from-[#B39237] to-[#D4AF37] text-white px-4 py-2 rounded-lg hover:from-[#A0812F] hover:to-[#C19B2F] transition-all flex items-center justify-center space-x-2"
            >
              <i className="bx bx-search"></i>
              <span>Filtrar</span>
            </button>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={limpiarFiltros}
              className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
            >
              <i className="bx bx-refresh"></i>
              <span>Limpiar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Selector de tipo de reporte */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'mes', label: 'Por Mes', icon: 'bx-calendar' },
            { id: 'categoria', label: 'Por Categoría', icon: 'bx-category' },
            { id: 'area', label: 'Por Área', icon: 'bx-buildings' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTipoReporte(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                tipoReporte === tab.id
                  ? 'bg-white text-[#B39237] shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <i className={`bx ${tab.icon}`}></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Acciones de exportación */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() => exportarCSV(currentData, getCurrentFilename())}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <i className="bx bx-download"></i>
          <span>Exportar CSV</span>
        </button>
        
        <button
          onClick={() => exportarJSON(currentData, getCurrentFilename())}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <i className="bx bx-data"></i>
          <span>Exportar JSON</span>
        </button>
      </div>

      {/* Tabla de datos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {tipoReporte === 'mes' && 'Entregas por Mes'}
            {tipoReporte === 'categoria' && 'Entregas por Categoría'}
            {tipoReporte === 'area' && 'Entregas por Área'}
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {tipoReporte === 'mes' && 'Mes'}
                  {tipoReporte === 'categoria' && 'Categoría'}
                  {tipoReporte === 'area' && 'Área'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Entregas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Cantidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Promedio
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentData.map((row, index) => {
                const nombre = row.mes || row.nombre_categoria || row.area_nombre;
                const promedio = row.total_entregas > 0 ? (row.total_cantidad / row.total_entregas).toFixed(1) : '0';
                
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {tipoReporte === 'mes' ? formatearMes(nombre) : nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.total_entregas.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.total_cantidad.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {promedio}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {currentData.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="bx bx-bar-chart-alt text-4xl text-gray-400"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay datos disponibles</h3>
            <p className="text-gray-500">No se encontraron entregas para los filtros seleccionados</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReporteDotaciones;