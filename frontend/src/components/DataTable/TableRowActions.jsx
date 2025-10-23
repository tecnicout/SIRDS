import React from 'react';

/**
 * TableRowActions - Componente para acciones de fila en DataTable
 * Renderiza botones de acción estándar y personalizados
 */
const TableRowActions = ({
  row,
  onAction,
  actions = ['view', 'edit', 'delete'],
  customActions = [],
  className = '',
  disabledActions = [],
  processingAction = null
}) => {
  const handleAction = (actionName) => {
    if (disabledActions.includes(actionName) || processingAction === actionName) {
      return;
    }
    onAction?.(actionName, row);
  };

  const getActionIcon = (action) => {
    // Mostrar spinner si esta acción está siendo procesada
    if (processingAction === action) {
      return (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      );
    }

    const icons = {
      view: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      edit: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      ),
      delete: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      toggle: (row.estado ?? row.activo) ? (
        // Ícono para desactivar - toggle OFF
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17 7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h10c2.76 0 5-2.24 5-5s-2.24-5-5-5zM7 15c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
        </svg>
      ) : (
        // Ícono para activar - toggle ON  
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17 7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h10c2.76 0 5-2.24 5-5s-2.24-5-5-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
        </svg>
      )
    };
    return icons[action] || null;
  };

  const getActionColor = (action) => {
    // Si la acción está deshabilitada o siendo procesada, usar estilo deshabilitado
    if (disabledActions.includes(action) || processingAction === action) {
      return 'text-gray-400 cursor-not-allowed';
    }

    const colors = {
      view: 'text-gray-600 hover:text-gray-900',
      edit: 'text-primary-600 hover:text-primary-900',
      delete: 'text-red-600 hover:text-red-900',
      toggle: (row.estado ?? row.activo)
        ? 'text-red-600 hover:text-red-900' 
        : 'text-green-600 hover:text-green-900'
    };
    return colors[action] || 'text-gray-600 hover:text-gray-900';
  };

  const getActionTitle = (action) => {
    const titles = {
      view: 'Ver detalles',
      edit: 'Editar registro',
      delete: 'Eliminar registro',
      toggle: (row.estado ?? row.activo) ? 'Desactivar' : 'Activar'
    };
    return titles[action] || action;
  };

  return (
    <div className={`flex space-x-2 ${className}`}>
      {/* Acciones estándar */}
      {actions.map((action) => {
        const isDisabled = disabledActions.includes(action) || processingAction === action;
        return (
          <button
            key={action}
            onClick={() => handleAction(action)}
            disabled={isDisabled}
            className={`${getActionColor(action)} transition-colors ${isDisabled ? 'pointer-events-none' : ''}`}
            title={getActionTitle(action)}
          >
            {getActionIcon(action)}
          </button>
        );
      })}
      
      {/* Acciones personalizadas */}
      {customActions.map((customAction, index) => (
        <button
          key={`custom-${index}`}
          onClick={() => handleAction(customAction.name)}
          className={customAction.className || 'text-gray-600 hover:text-gray-900 transition-colors'}
          title={customAction.title || customAction.name}
        >
          {customAction.icon}
        </button>
      ))}
    </div>
  );
};

// Acciones estándar disponibles
export const STANDARD_ACTIONS = {
  VIEW: 'view',
  EDIT: 'edit',
  DELETE: 'delete',
  TOGGLE: 'toggle'
};

export default TableRowActions;