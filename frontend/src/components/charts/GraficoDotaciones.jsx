import React, { useState, useEffect } from 'react';

const GraficoDotaciones = () => {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    area: ''
  });

  useEffect(() => {
    const fetchStock = async () => {
      try {
  const response = await fetch('http://localhost:3001/api/dotaciones/stock', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const result = await response.json();
        const stockList = Array.isArray(result) ? result : (result?.data ?? []);
        setStockData(stockList);
      } catch (error) {
        console.error('Error al cargar stock:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStock();
  }, []);

  // Agrupar stock por dotación
  const stockAgrupado = stockData.reduce((acc, item) => {
    const key = item.nombre_dotacion;
    if (!acc[key]) {
      acc[key] = {
        nombre_dotacion: item.nombre_dotacion,
        items: [],
        total_stock: 0
      };
    }
    acc[key].items.push(item);
    acc[key].total_stock += item.cantidad;
    return acc;
  }, {});

  const stockFiltrado = Object.values(stockAgrupado).filter(grupo => {
    const coincideBusqueda = !filtros.busqueda || 
      grupo.nombre_dotacion.toLowerCase().includes(filtros.busqueda.toLowerCase());
    
    const coincideArea = !filtros.area || 
      grupo.items.some(item => item.area_nombre === filtros.area);
    
    return coincideBusqueda && coincideArea;
  });

  const getStockColor = (cantidad) => {
    if (cantidad <= 5) return 'text-red-600 bg-red-50';
    if (cantidad <= 15) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  const getStockIcon = (cantidad) => {
    if (cantidad <= 5) return 'bx-error';
    if (cantidad <= 15) return 'bx-time';
    return 'bx-check';
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded"></div>
      </div>
    );
  }

  // Estadísticas de stock
  const totalDotaciones = Object.keys(stockAgrupado).length;
  const stockBajo = Object.values(stockAgrupado).filter(g => g.total_stock <= 5).length;
  const stockMedio = Object.values(stockAgrupado).filter(g => g.total_stock > 5 && g.total_stock <= 15).length;
  const stockAlto = Object.values(stockAgrupado).filter(g => g.total_stock > 15).length;

  return (
    <div>
      {/* Estadísticas de stock */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalDotaciones}</p>
              <p className="text-sm text-gray-600">Total Dotaciones</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="bx bx-package text-blue-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-red-600">{stockBajo}</p>
              <p className="text-sm text-gray-600">Stock Bajo (≤5)</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <i className="bx bx-error text-red-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-orange-600">{stockMedio}</p>
              <p className="text-sm text-gray-600">Stock Medio (6-15)</p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <i className="bx bx-time text-orange-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-600">{stockAlto}</p>
              <p className="text-sm text-gray-600">Stock Alto (&gt;15)</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="bx bx-check text-green-600 text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <input
            type="text"
            placeholder="Buscar dotación..."
            value={filtros.busqueda}
            onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B39237] focus:border-transparent"
          />
        </div>
        
        <div>
          <select
            value={filtros.area}
            onChange={(e) => setFiltros(prev => ({ ...prev, area: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B39237] focus:border-transparent"
          >
            <option value="">Todas las áreas</option>
            {Array.isArray(stockData) ? [...new Set(stockData.map(s => s.area_nombre).filter(Boolean))].map(area => (
              <option key={area} value={area}>{area}</option>
            )) : null}
          </select>
        </div>
      </div>

      {/* Lista de stock */}
      <div className="space-y-4">
        {stockFiltrado.map((grupo, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getStockColor(grupo.total_stock)}`}>
                  <i className={`bx ${getStockIcon(grupo.total_stock)} text-xl`}></i>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{grupo.nombre_dotacion}</h3>
                  <p className="text-sm text-gray-500">Stock total: {grupo.total_stock} unidades</p>
                </div>
              </div>
              
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStockColor(grupo.total_stock)}`}>
                {grupo.total_stock <= 5 ? 'Crítico' : grupo.total_stock <= 15 ? 'Bajo' : 'Disponible'}
              </div>
            </div>

            {/* Detalles por talla y área */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {grupo.items.map((item, itemIndex) => (
                <div key={itemIndex} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      {item.talla && (
                        <p className="text-sm font-medium text-gray-700">Talla: {item.talla}</p>
                      )}
                      {item.area_nombre && (
                        <p className="text-xs text-gray-500">Área: {item.area_nombre}</p>
                      )}
                      {item.unidad_medida && (
                        <p className="text-xs text-gray-500">Unidad: {item.unidad_medida}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${item.cantidad <= 5 ? 'text-red-600' : item.cantidad <= 15 ? 'text-orange-600' : 'text-green-600'}`}>
                        {item.cantidad}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {stockFiltrado.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="bx bx-package text-4xl text-gray-400"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay stock disponible</h3>
          <p className="text-gray-500">No se encontraron dotaciones con stock disponible</p>
        </div>
      )}
    </div>
  );
};

export default GraficoDotaciones;