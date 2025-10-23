/**
 * FormFieldsFactory - Utilidades para generar configuraciones de campos dinámicamente
 * Ayuda a mapear definiciones de campo a componentes de input
 */

/**
 * Tipos de campo disponibles
 */
export const FIELD_TYPES = {
  TEXT: 'text',
  EMAIL: 'email',
  PASSWORD: 'password',
  NUMBER: 'number',
  TEL: 'tel',
  DATE: 'date',
  DATETIME: 'datetime-local',
  TIME: 'time',
  SELECT: 'select',
  TEXTAREA: 'textarea',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  FILE: 'file'
};

/**
 * Crea una configuración de campo básica
 */
export const createField = (name, label, type = FIELD_TYPES.TEXT, options = {}) => ({
  name,
  label,
  type,
  required: false,
  placeholder: '',
  fullWidth: false,
  ...options
});

/**
 * Crea un campo de texto
 */
export const createTextField = (name, label, options = {}) => 
  createField(name, label, FIELD_TYPES.TEXT, options);

/**
 * Crea un campo de email
 */
export const createEmailField = (name, label = 'Email', options = {}) => 
  createField(name, label, FIELD_TYPES.EMAIL, {
    placeholder: 'email@ejemplo.com',
    ...options
  });

/**
 * Crea un campo de contraseña
 */
export const createPasswordField = (name, label = 'Contraseña', options = {}) => 
  createField(name, label, FIELD_TYPES.PASSWORD, options);

/**
 * Crea un campo numérico
 */
export const createNumberField = (name, label, options = {}) => 
  createField(name, label, FIELD_TYPES.NUMBER, {
    step: '1',
    min: '0',
    ...options
  });

/**
 * Crea un campo de moneda
 */
export const createCurrencyField = (name, label, options = {}) => 
  createNumberField(name, label, {
    step: '0.01',
    placeholder: '0.00',
    ...options
  });

/**
 * Crea un campo de fecha
 */
export const createDateField = (name, label, options = {}) => 
  createField(name, label, FIELD_TYPES.DATE, options);

/**
 * Crea un campo de teléfono
 */
export const createPhoneField = (name, label = 'Teléfono', options = {}) => 
  createField(name, label, FIELD_TYPES.TEL, {
    placeholder: '(662) 123-4567',
    ...options
  });

/**
 * Crea un campo select
 */
export const createSelectField = (name, label, options = [], fieldOptions = {}) => 
  createField(name, label, FIELD_TYPES.SELECT, {
    options,
    placeholder: `Seleccionar ${label.toLowerCase()}`,
    ...fieldOptions
  });

/**
 * Crea un campo de área de texto
 */
export const createTextareaField = (name, label, options = {}) => 
  createField(name, label, FIELD_TYPES.TEXTAREA, {
    rows: 3,
    ...options
  });

/**
 * Crea un campo checkbox
 */
export const createCheckboxField = (name, label, options = {}) => 
  createField(name, label, FIELD_TYPES.CHECKBOX, {
    checkboxLabel: label,
    ...options
  });

/**
 * Crea un campo de estado activo/inactivo
 */
export const createStatusField = (name = 'estado', label = 'Estado', options = {}) => 
  createSelectField(name, label, [
    { value: true, label: 'Activo' },
    { value: false, label: 'Inactivo' }
  ], {
    required: true,
    ...options
  });

/**
 * Genera opciones para select desde un array de objetos
 */
export const createOptionsFromArray = (array, valueKey = 'id', labelKey = 'name') => 
  array.map(item => ({
    value: item[valueKey],
    label: item[labelKey]
  }));

/**
 * Genera opciones simples desde un array de strings
 */
export const createSimpleOptions = (array) => 
  array.map(item => ({
    value: item,
    label: item
  }));

/**
 * Crea reglas de validación básicas
 */
export const createValidationRules = (rules = {}) => ({
  required: false,
  email: false,
  numeric: false,
  positive: false,
  minLength: null,
  maxLength: null,
  pattern: null,
  custom: null,
  ...rules
});

/**
 * Reglas de validación comunes
 */
export const COMMON_VALIDATION_RULES = {
  required: { required: true },
  email: { email: true },
  numeric: { numeric: true },
  positiveNumber: { positive: true },
  requiredEmail: { required: true, email: true },
  requiredNumeric: { required: true, numeric: true },
  requiredPositive: { required: true, positive: true }
};

/**
 * Opciones predefinidas comunes
 */
export const PREDEFINED_OPTIONS = {
  GENDER: [
    { value: '1', label: 'Masculino' },
    { value: '2', label: 'Femenino' }
  ],
  ID_TYPES: [
    { value: 'CC', label: 'Cédula de Ciudadanía' },
    { value: 'CE', label: 'Cédula de Extranjería' },
    { value: 'TI', label: 'Tarjeta de Identidad' },
    { value: 'PA', label: 'Pasaporte' }
  ],
  STATUS: [
    { value: true, label: 'Activo' },
    { value: false, label: 'Inactivo' }
  ],
  YES_NO: [
    { value: true, label: 'Sí' },
    { value: false, label: 'No' }
  ]
};

/**
 * Genera un conjunto completo de campos para una entidad
 */
export const generateEntityFields = (entityConfig) => {
  return entityConfig.map(config => {
    const { name, label, type, validation, ...options } = config;
    
    const field = createField(name, label, type, options);
    
    return field;
  });
};

/**
 * Configuración predefinida para empleados
 */
export const EMPLEADO_ENTITY_CONFIG = [
  {
    name: 'Identificacion',
    label: 'Identificación',
    type: FIELD_TYPES.TEXT,
    required: true,
    placeholder: 'Número de identificación'
  },
  {
    name: 'tipo_identificacion',
    label: 'Tipo de Identificación',
    type: FIELD_TYPES.SELECT,
    required: true,
    options: PREDEFINED_OPTIONS.ID_TYPES
  },
  {
    name: 'nombre',
    label: 'Nombre',
    type: FIELD_TYPES.TEXT,
    required: true,
    placeholder: 'Nombre del empleado'
  },
  {
    name: 'apellido',
    label: 'Apellido',
    type: FIELD_TYPES.TEXT,
    required: true,
    placeholder: 'Apellido del empleado'
  },
  {
    name: 'fecha_nacimiento',
    label: 'Fecha de Nacimiento',
    type: FIELD_TYPES.DATE
  },
  {
    name: 'email',
    label: 'Email',
    type: FIELD_TYPES.EMAIL,
    placeholder: 'email@ejemplo.com'
  },
  {
    name: 'telefono',
    label: 'Teléfono',
    type: FIELD_TYPES.TEL,
    placeholder: '(662) 123-4567'
  },
  {
    name: 'cargo',
    label: 'Cargo',
    type: FIELD_TYPES.TEXT,
    placeholder: 'Cargo del empleado'
  },
  {
    name: 'estado',
    label: 'Estado',
    type: FIELD_TYPES.SELECT,
    required: true,
    options: PREDEFINED_OPTIONS.STATUS
  },
  {
    name: 'id_genero',
    label: 'Género',
    type: FIELD_TYPES.SELECT,
    required: true,
    placeholder: 'Seleccionar género',
    options: PREDEFINED_OPTIONS.GENDER
  },
  {
    name: 'fecha_inicio',
    label: 'Fecha de Inicio',
    type: FIELD_TYPES.DATE
  },
  {
    name: 'sueldo',
    label: 'Sueldo',
    type: FIELD_TYPES.NUMBER,
    placeholder: '0.00',
    step: '0.01',
    min: '0'
  },
  {
    name: 'fecha_fin',
    label: 'Fecha de Fin',
    type: FIELD_TYPES.DATE
  }
];

export default {
  createField,
  createTextField,
  createEmailField,
  createPasswordField,
  createNumberField,
  createCurrencyField,
  createDateField,
  createPhoneField,
  createSelectField,
  createTextareaField,
  createCheckboxField,
  createStatusField,
  createOptionsFromArray,
  createSimpleOptions,
  createValidationRules,
  generateEntityFields,
  FIELD_TYPES,
  COMMON_VALIDATION_RULES,
  PREDEFINED_OPTIONS,
  EMPLEADO_ENTITY_CONFIG
};