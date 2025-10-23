// ColumnConfig.js - Configuración de columnas para DataTable
// Define la estructura estándar para configurar columnas de tabla

/**
 * @typedef {Object} ColumnConfig
 * @property {string} key - Clave del campo en el objeto de datos
 * @property {string} label - Etiqueta a mostrar en el encabezado
 * @property {boolean} [sortable=false] - Si la columna es ordenable
 * @property {string} [width] - Ancho CSS de la columna
 * @property {boolean} [visible=true] - Si la columna es visible
 * @property {function} [render] - Función personalizada de renderizado (value, row) => ReactNode
 * @property {string} [align='left'] - Alineación del contenido: 'left', 'center', 'right'
 * @property {string} [className] - Clases CSS adicionales para la columna
 */

// Función para renderizar empleado (se importa React en el componente que lo usa)
export const renderEmpleado = (value, row) => {
  // Este render se define en el componente que usa React
  return {
    type: 'empleado',
    data: {
      nombre: row.nombre,
      apellido: row.apellido,
      id_empleado: row.id_empleado
    }
  };
};

// Función para renderizar contacto
export const renderContacto = (value, row) => {
  return {
    type: 'contacto', 
    data: {
      email: row.email,
      telefono: row.telefono
    }
  };
};

// Función para renderizar estado
export const renderEstado = (value, row) => {
  return {
    type: 'estado',
    data: {
      estado: row.estado,
      password: row.password
    }
  };
};

// Configuración básica para empleados (sin funciones render)
export const EMPLEADOS_COLUMNS_BASE = [
  {
    key: 'empleado',
    label: 'Empleado',
    sortable: true,
    renderType: 'empleado'
  },
  {
    key: 'contacto',
    label: 'Contacto',
    renderType: 'contacto'
  },
  {
    key: 'cargo',
    label: 'Cargo',
    sortable: true,
    render: (value, row) => row.cargo || 'No especificado'
  },
  {
    key: 'estado',
    label: 'Estado',
    align: 'center',
    renderType: 'estado'
  }
];

// Esta configuración se completa en el componente React
export const EMPLEADOS_COLUMNS = EMPLEADOS_COLUMNS_BASE;

// Función utilitaria para crear configuraciones de columnas básicas
export const createColumn = (key, label, options = {}) => ({
  key,
  label,
  sortable: false,
  visible: true,
  align: 'left',
  ...options
});

// Función para filtrar columnas visibles
export const getVisibleColumns = (columns) => 
  columns.filter(col => col.visible !== false);

// Función para obtener columnas ordenables
export const getSortableColumns = (columns) => 
  columns.filter(col => col.sortable === true);