import React from 'react';

/**
 * TableToolbar - Barra de herramientas para DataTable
 * Incluye búsqueda, filtros y botones de acción personalizables
 */
const TableToolbar = ({
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  showSearch = true,
  showFilters = true,
  showExport = true,
  customActions = null,
  onFilterClick,
  onExportClick,
  className = ''
}) => {
  return (
    <div className={`bg-white p-6 rounded-lg shadow border ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        {/* Búsqueda */}
        {showSearch && (
          <div className="flex-1 max-w-md">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Buscar registros
            </label>
            <div className="relative">
              <input
                type="text"
                id="search"
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
              />
              <svg 
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                />
              </svg>
            </div>
          </div>
        )}
        
        {/* Acciones de la derecha */}
        <div className="flex space-x-3">
          {/* Acciones personalizadas */}
          {customActions}
          
          {/* Botón de filtros */}
          {showFilters && (
            <button 
              onClick={onFilterClick}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" 
                />
              </svg>
              <span>Filtros</span>
            </button>
          )}
          
          {/* Botón de exportar */}
          {showExport && (
            <button 
              onClick={onExportClick}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" 
                />
              </svg>
              <span>Exportar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TableToolbar;