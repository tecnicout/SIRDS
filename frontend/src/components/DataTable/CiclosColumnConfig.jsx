// CiclosColumnConfig.js - Configuración de columnas para tabla de ciclos

/**
 * Configuración de columnas para la tabla de ciclos de dotación
 * Reutiliza el componente DataTable.jsx existente
 */

export const CICLOS_COLUMNS = [
  {
    key: 'nombre_ciclo',
    label: 'Nombre del Ciclo',
    sortable: true,
    className: 'min-w-[200px]',
    render: (value, row) => (
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-[#B39237] to-[#D4AF37] rounded-lg flex items-center justify-center">
          <i className='bx bx-calendar-event text-white text-xl'></i>
        </div>
        <div>
          <p className="font-semibold text-gray-900">{value}</p>
          {row.observaciones && (
            <p className="text-xs text-gray-500 truncate max-w-xs">{row.observaciones}</p>
          )}
        </div>
      </div>
    )
  },
  {
    key: 'fecha_entrega',
    label: 'Fecha de Entrega',
    sortable: true,
    className: 'min-w-[150px]',
    render: (value) => {
      if (!value) return 'N/A';
      const fecha = new Date(value);
      return (
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <i className='bx bx-calendar text-lg text-gray-400'></i>
          <span>{fecha.toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })}</span>
        </div>
      );
    }
  },
  {
    key: 'estado',
    label: 'Estado',
    sortable: true,
    align: 'center',
    className: 'min-w-[120px]',
    render: (value) => {
      const estadoConfig = {
        'pendiente': {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          icon: 'bx-time-five',
          label: 'Pendiente'
        },
        'activo': {
          bg: 'bg-green-100',
          text: 'text-green-800',
          icon: 'bx-play-circle',
          label: 'Activo'
        },
        'cerrado': {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          icon: 'bx-check-circle',
          label: 'Cerrado'
        }
      };

      const config = estadoConfig[value] || estadoConfig['pendiente'];
      
      return (
        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
          <i className={`bx ${config.icon} text-sm mr-1.5`}></i>
          {config.label}
        </span>
      );
    }
  },
  {
    key: 'total_empleados',
    label: 'Empleados',
    align: 'center',
    className: 'min-w-[100px]',
    render: (value) => (
      <div className="flex items-center justify-center gap-2">
        <i className='bx bx-group text-xl text-gray-400'></i>
        <span className="font-bold text-gray-900">{value || 0}</span>
      </div>
    )
  },
  {
    key: 'procesados',
    label: 'Procesados',
    align: 'center',
    className: 'min-w-[100px]',
    render: (value, row) => {
      const total = row.total_empleados || 0;
      const procesados = value || 0;
      const porcentaje = total > 0 ? Math.round((procesados / total) * 100) : 0;
      
      return (
        <div className="flex flex-col items-center">
          <span className="font-semibold text-blue-600">{procesados}</span>
          <span className="text-xs text-gray-500">{porcentaje}%</span>
        </div>
      );
    }
  },
  {
    key: 'entregados',
    label: 'Entregados',
    align: 'center',
    className: 'min-w-[100px]',
    render: (value, row) => {
      const total = row.total_empleados || 0;
      const entregados = value || 0;
      const porcentaje = total > 0 ? Math.round((entregados / total) * 100) : 0;
      
      return (
        <div className="flex flex-col items-center">
          <span className="font-semibold text-green-600">{entregados}</span>
          <span className="text-xs text-gray-500">{porcentaje}%</span>
        </div>
      );
    }
  },
  {
    key: 'omitidos',
    label: 'Omitidos',
    align: 'center',
    className: 'min-w-[100px]',
    render: (value, row) => {
      const total = row.total_empleados || 0;
      const omitidos = value || 0;
      const porcentaje = total > 0 ? Math.round((omitidos / total) * 100) : 0;
      
      return (
        <div className="flex flex-col items-center">
          <span className="font-semibold text-gray-600">{omitidos}</span>
          <span className="text-xs text-gray-500">{porcentaje}%</span>
        </div>
      );
    }
  },
  {
    key: 'creado_en',
    label: 'Creado',
    sortable: true,
    className: 'min-w-[150px]',
    render: (value) => {
      if (!value) return 'N/A';
      const fecha = new Date(value);
      return (
        <div className="text-xs text-gray-600">
          <div>{fecha.toLocaleDateString('es-ES')}</div>
          <div className="text-gray-400">{fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      );
    }
  }
];

/**
 * Acciones personalizadas para cada fila de la tabla de ciclos
 */
export const CICLOS_CUSTOM_ACTIONS = [
  {
    id: 'ver_empleados',
    label: 'Ver empleados',
    icon: 'bx-group',
    className: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50',
    condition: (row) => true // Siempre visible
  },
  {
    id: 'cerrar_ciclo',
    label: 'Cerrar ciclo',
    icon: 'bx-lock',
    className: 'text-orange-600 hover:text-orange-800 hover:bg-orange-50',
    condition: (row) => row.estado === 'activo'
  }
];

/**
 * Estados de filtro para ciclos
 */
export const ESTADOS_CICLO = [
  { value: '', label: 'Todos los estados' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'activo', label: 'Activo' },
  { value: 'cerrado', label: 'Cerrado' }
];

/**
 * Configuración de filtros para año
 */
export const getAnioOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  
  for (let i = currentYear; i >= currentYear - 3; i--) {
    years.push({ value: i.toString(), label: i.toString() });
  }
  
  return [{ value: '', label: 'Todos los años' }, ...years];
};
