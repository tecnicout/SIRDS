import React from 'react';
import Modal from './Modal';

/**
 * ViewModal - Modal especializado para mostrar información de solo lectura
 * Optimizado para mostrar detalles de registros en formato de 2 columnas
 */
const ViewModal = ({
  isOpen = false,
  onClose,
  title = 'Detalles',
  data = {},
  fields = [],
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      className={className}
      {...props}
    >
      {children || <ViewModal.Content data={data} fields={fields} />}
    </Modal>
  );
};

/**
 * ViewModal.Content - Componente para renderizar contenido de vista detallada
 */
ViewModal.Content = ({ 
  data = {}, 
  fields = [],
  columns = 2,
  className = ''
}) => {
  // Si no se proporcionan campos, generar automáticamente desde las claves del objeto
  const displayFields = fields.length > 0 ? fields : 
    Object.keys(data).map(key => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      render: (value) => value ?? 'No especificado'
    }));

  const formatFieldValue = (field, value) => {
    if (field.render) {
      return field.render(value, data);
    }

    // Formateo automático basado en el tipo de valor
    if (value === null || value === undefined || value === '') {
      return 'No especificado';
    }

    // Fechas
    if (field.type === 'date' || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))) {
      try {
        return new Date(value).toLocaleDateString();
      } catch {
        return value;
      }
    }

    // Números con formato de moneda
    if (field.type === 'currency' || (field.key && field.key.toLowerCase().includes('sueldo'))) {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        return `$${num.toLocaleString()}`;
      }
    }

    // Booleanos
    if (typeof value === 'boolean') {
      return value ? 'Sí' : 'No';
    }

    // Estados
    if (field.key === 'estado') {
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Activo' : 'Inactivo'}
        </span>
      );
    }

    return String(value);
  };

  const gridCols = columns === 1 ? 'grid-cols-1' : 'grid-cols-2';

  return (
    <div className={`space-y-6 ${className}`}>
      <div className={`grid ${gridCols} gap-6`}>
        {displayFields.map((field) => {
          const value = data[field.key];
          
          return (
            <div key={field.key} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {field.label}
              </label>
              <div className="text-gray-900 bg-gray-50/50 rounded-xl px-4 py-3 border border-gray-200/50 min-h-[2.75rem] flex items-center">
                {formatFieldValue(field, value)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * ViewModal.Field - Componente para campos individuales personalizados
 */
ViewModal.Field = ({ 
  label, 
  children, 
  className = '' 
}) => (
  <div className={`space-y-2 ${className}`}>
    <label className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    <div className="text-gray-900 bg-gray-50/50 rounded-xl px-4 py-3 border border-gray-200/50 min-h-[2.75rem] flex items-center">
      {children}
    </div>
  </div>
);

// Configuraciones predefinidas para diferentes entidades
export const EMPLEADO_VIEW_FIELDS = [
  { key: 'Identificacion', label: 'Identificación' },
  { key: 'tipo_identificacion', label: 'Tipo de Identificación' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'apellido', label: 'Apellido' },
  { key: 'fecha_nacimiento', label: 'Fecha de Nacimiento', type: 'date' },
  { key: 'email', label: 'Email' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'cargo', label: 'Cargo' },
  { key: 'genero_nombre', label: 'Género' },
  { key: 'nombre_area', label: 'Área' },
  { key: 'fecha_inicio', label: 'Fecha de Inicio', type: 'date' },
  { key: 'sueldo', label: 'Sueldo', type: 'currency' },
  { key: 'fecha_fin', label: 'Fecha de Fin', type: 'date' },
  { key: 'estado', label: 'Estado' }
];

export default ViewModal;