import React, { useState, useMemo } from 'react';
import TableToolbar from './TableToolbar';
import TableRowActions from './TableRowActions';
import { getVisibleColumns } from './ColumnConfig';

/**
 * DataTable - Componente de tabla reutilizable y configurable
 * Proporciona funcionalidades de ordenamiento, paginación, búsqueda y acciones de fila
 */
const DataTable = ({
  // Datos principales
  columns = [],
  data = [],
  rowKey = 'id',
  
  // Estados de carga
  loading = false,
  error = null,
  
  // Búsqueda
  searchQuery = '',
  onSearch,
  searchPlaceholder = 'Buscar...',
  showSearch = true,
  
  // Ordenamiento
  sortConfig = { key: null, direction: 'asc' },
  onSort,
  
  // Paginación
  pagination = {
    page: 1,
    pageSize: 10,
    total: 0
  },
  onPageChange,
  showPagination = true,
  
  // Acciones de fila
  onRowAction,
  rowActions = ['view', 'edit', 'delete'],
  customRowActions = [],
  getDisabledActions = () => [],
  getProcessingAction = () => null,
  
  // Toolbar personalizado
  showToolbar = true,
  toolbarProps = {},
  
  // Estados vacíos y de error
  emptyState = null,
  
  // Estilos personalizados
  className = '',
  tableClassName = '',
  
  // Props adicionales
  ...props
}) => {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  
  // Columnas visibles
  const visibleColumns = useMemo(() => getVisibleColumns(columns), [columns]);
  
  // Datos filtrados por búsqueda local si no hay función onSearch externa
  const filteredData = useMemo(() => {
    if (!localSearchQuery || onSearch) return data;
    
    return data.filter(row => {
      return visibleColumns.some(column => {
        const value = row[column.key];
        if (value == null) return false;
        return String(value).toLowerCase().includes(localSearchQuery.toLowerCase());
      });
    });
  }, [data, localSearchQuery, visibleColumns, onSearch]);
  
  // Manejar búsqueda
  const handleSearch = (query) => {
    setLocalSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };
  
  // Manejar ordenamiento
  const handleSort = (columnKey) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;
    
    let direction = 'asc';
    if (sortConfig.key === columnKey && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    if (onSort) {
      onSort(columnKey, direction);
    }
  };
  
  // Renderizar contenido de celda
  const renderCellContent = (column, row) => {
    const value = row[column.key];
    
    if (column.render) {
      return column.render(value, row);
    }
    
    return value ?? '';
  };
  
  // Renderizar estado vacío por defecto
  const defaultEmptyState = (
    <div className="p-8 text-center text-gray-500">
      {localSearchQuery ? 
        'No se encontraron registros que coincidan con la búsqueda' : 
        'No hay datos disponibles'
      }
    </div>
  );
  
  // Renderizar estado de error
  const errorState = error && (
    <div className="p-8 text-center">
      <div className="text-red-600 mb-2">❌ {error}</div>
      <button 
        onClick={() => window.location.reload()}
        className="text-primary-600 hover:text-primary-500 font-medium"
      >
        Intentar de nuevo
      </button>
    </div>
  );
  
  // Renderizar estado de carga
  const loadingState = (
    <div className="p-8 text-center">
      <div className="inline-flex items-center space-x-2">
        <svg className="animate-spin h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-gray-600">Cargando datos...</span>
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`} {...props}>
      {/* Toolbar */}
      {showToolbar && (
        <TableToolbar
          searchQuery={onSearch ? searchQuery : localSearchQuery}
          onSearchChange={handleSearch}
          searchPlaceholder={searchPlaceholder}
          showSearch={showSearch}
          {...toolbarProps}
        />
      )}
      
      {/* Tabla */}
      <div className="bg-white shadow border rounded-lg overflow-hidden">
        {loading ? loadingState : error ? errorState : (
          filteredData.length === 0 ? (
            emptyState || defaultEmptyState
          ) : (
            <div className="overflow-x-auto">
              <table className={`min-w-full divide-y divide-gray-200 ${tableClassName}`}>
                {/* Encabezados */}
                <thead className="bg-gray-50">
                  <tr>
                    {visibleColumns.map((column) => (
                      <th
                        key={column.key}
                        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                          column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                        } ${column.className || ''}`}
                        style={{ width: column.width }}
                        onClick={() => column.sortable && handleSort(column.key)}
                      >
                        <div className={`flex items-center ${column.align === 'center' ? 'justify-center' : column.align === 'right' ? 'justify-end' : 'justify-start'}`}>
                          <span>{column.label}</span>
                          {column.sortable && (
                            <svg 
                              className={`ml-1 h-4 w-4 ${
                                sortConfig.key === column.key 
                                  ? 'text-gray-900' 
                                  : 'text-gray-400'
                              } ${
                                sortConfig.key === column.key && sortConfig.direction === 'desc' 
                                  ? 'transform rotate-180' 
                                  : ''
                              }`}
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M5 15l7-7 7 7" 
                              />
                            </svg>
                          )}
                        </div>
                      </th>
                    ))}
                    {/* Columna de acciones */}
                    {(rowActions.length > 0 || customRowActions.length > 0) && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    )}
                  </tr>
                </thead>
                
                {/* Cuerpo de la tabla */}
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((row) => (
                    <tr key={row[rowKey]} className="hover:bg-gray-50">
                      {visibleColumns.map((column) => (
                        <td
                          key={`${row[rowKey]}-${column.key}`}
                          className={`px-6 py-4 whitespace-nowrap ${column.className || ''}`}
                          style={{ 
                            width: column.width,
                            textAlign: column.align || 'left'
                          }}
                        >
                          {renderCellContent(column, row)}
                        </td>
                      ))}
                      
                      {/* Celda de acciones */}
                      {(rowActions.length > 0 || customRowActions.length > 0) && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <TableRowActions
                            row={row}
                            onAction={onRowAction}
                            actions={rowActions}
                            customActions={customRowActions}
                            disabledActions={getDisabledActions(row)}
                            processingAction={getProcessingAction(row)}
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
      
      {/* Paginación */}
      {showPagination && pagination.total > pagination.pageSize && (
        <div className="bg-white px-4 py-3 border rounded-lg flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando{' '}
            <span className="font-medium">
              {(pagination.page - 1) * pagination.pageSize + 1}
            </span>{' '}
            a{' '}
            <span className="font-medium">
              {Math.min(pagination.page * pagination.pageSize, pagination.total)}
            </span>{' '}
            de{' '}
            <span className="font-medium">{pagination.total}</span>{' '}
            resultados
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => onPageChange?.(pagination.page - 1, pagination.pageSize)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Anterior
            </button>
            <button
              onClick={() => onPageChange?.(pagination.page + 1, pagination.pageSize)}
              disabled={pagination.page * pagination.pageSize >= pagination.total}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;