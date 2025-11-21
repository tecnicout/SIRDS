import React, { useState, useEffect, useRef } from 'react';

import Modal from './Modal';



/**

 * EditModal - Modal especializado para formularios de edición

 * Maneja estado del formulario, validación y envío

 */

const EditModal = ({

  isOpen = false,

  onClose,

  onSubmit,

  title = 'Editar',

  initialData = {},

  fields = [],

  validationRules = {},

  size = 'md',

  submitText = 'Guardar',

  cancelText = 'Cancelar',

  className = '',

  children,

  isSubmitting = false,

  ...props

}) => {

  const [formData, setFormData] = useState(initialData);

  const [errors, setErrors] = useState({});

  

  // Fix: Usar useRef para evitar bucle infinito en useEffect

  // Problema: initialData puede cambiar en cada render causando "Maximum update depth exceeded"

  // Solución: Comparar contenido real en lugar de referencia de objeto

  const prevInitialDataRef = useRef();

  const isFirstRender = useRef(true);



  // Fix: Actualizar formData solo cuando el contenido de initialData realmente cambie

  useEffect(() => {

    // En el primer render o cuando se abre el modal, verificar si hay cambios reales

    if (isFirstRender.current || isOpen) {

      const currentDataStr = JSON.stringify(initialData);

      const prevDataStr = JSON.stringify(prevInitialDataRef.current);

      

      // Solo actualizar estado si los datos realmente cambiaron (contenido, no referencia)

      if (currentDataStr !== prevDataStr || isFirstRender.current) {

        setFormData(initialData || {});

        setErrors({});

        prevInitialDataRef.current = initialData;

        isFirstRender.current = false;

      }

    }

  }, [initialData, isOpen]); // Mantener dependencias pero con comparación de contenido



  // Manejar cambios en el formulario

  const handleInputChange = (e) => {

    const { name, value, type, checked } = e.target;

    let processedValue = value;



    // Manejar checkboxes

    if (type === 'checkbox') {

      processedValue = checked;

    } else if (name === 'estado') {

      // Para el campo estado, mantener como número entero (1 o 0)

      // Solo convertir si el valor no está vacío

      processedValue = value !== '' ? parseInt(value, 10) : '';

    } else if (name === 'id_genero' || name === 'id_area' || name === 'id_kit') {

      // Para campos de ID, convertir a número entero

      processedValue = value ? parseInt(value, 10) : '';

    }



    setFormData(prev => ({

      ...prev,

      [name]: processedValue,

      // Si cambia el área, reiniciar el kit seleccionado para evitar inconsistencias

      ...(name === 'id_area' ? { id_kit: '' } : {})

    }));



    // Limpiar error del campo modificado

    if (errors[name]) {

      setErrors(prev => ({

        ...prev,

        [name]: ''

      }));

    }

  };



  // Validar formulario

  const validateForm = () => {

    const newErrors = {};



    fields.forEach(field => {

      const value = formData[field.name];

      const rules = validationRules[field.name];



      if (rules) {

        // Campo requerido - solo validar si es realmente requerido

        // Para fechas opcionales, no marcar error si está vacío

        const isDateField = field.type === 'date';

        const isOptionalDate = isDateField && !field.required;

        

        if (rules.required) {

          // Para campo estado, validar que sea 0 o 1 (no undefined/null/empty)

          if (field.name === 'estado') {

            if (value !== 0 && value !== 1) {

              newErrors[field.name] = `${field.label} es requerido`;

            }

          } else if (!value || (typeof value === 'string' && !value.trim())) {

            // No validar como requerido las fechas opcionales

            if (!isOptionalDate) {

              newErrors[field.name] = `${field.label} es requerido`;

            }

          }

        }



        // Validación de email

        if (rules.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {

          newErrors[field.name] = 'Email no válido';

        }



        // Validación numérica

        if (rules.numeric && value && !/^\d+$/.test(value)) {

          newErrors[field.name] = 'Debe contener solo números';

        }



        // Validación de número positivo

        if (rules.positive && value && (isNaN(value) || parseFloat(value) < 0)) {

          newErrors[field.name] = 'Debe ser un número positivo';

        }



        // Validación personalizada

        if (rules.custom && typeof rules.custom === 'function') {

          const customError = rules.custom(value, formData);

          if (customError) {

            newErrors[field.name] = customError;

          }

        }

      }

    });



    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;

  };



  // Manejar envío del formulario

  const handleSubmit = async (e) => {

    e.preventDefault();

    

    if (!validateForm()) return;



    try {

      await onSubmit?.(formData);

      onClose?.();

    } catch (error) {

      console.error('Error al enviar formulario:', error);

    }

  };



  // Footer con botones mejorados

  const footer = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
      <button
        type="button"
        onClick={onClose}
        className="inline-flex w-full items-center justify-center rounded-2xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 sm:w-auto"
        disabled={isSubmitting}
      >
        {cancelText}
      </button>
      <button
        type="submit"
        form="edit-form"
        className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#B39237] via-[#D4AF37] to-[#E2BE69] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#B39237]/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[#B39237]/50 focus:outline-none focus:ring-2 focus:ring-[#E2BE69]/50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Guardando...' : submitText}
      </button>
    </div>
  );



  return (

    <Modal

      isOpen={isOpen}

      onClose={onClose}

      title={title}

      size={size}

      footer={footer}

      className={className}

      {...props}

    >

      {children || (

        <EditModal.Form

          fields={fields}

          formData={formData}

          errors={errors}

          onChange={handleInputChange}

          onSubmit={handleSubmit}

        />

      )}

    </Modal>

  );

};



/**

 * EditModal.Form - Componente para renderizar formulario automáticamente

 */

EditModal.Form = ({ 

  fields = [], 

  formData = {}, 

  errors = {}, 

  onChange,

  onSubmit,

  className = ''

}) => {

  const renderField = (field) => {

    const value = formData[field.name] ?? '';

    const error = errors[field.name];



    const baseInputClass = `w-full px-4 py-3 md:px-5 md:py-3.5 rounded-2xl border text-sm md:text-base transition duration-200 focus:outline-none ${

      error

        ? 'border-red-200 bg-red-50/80 text-red-900 focus:border-red-300 focus:ring-2 focus:ring-red-200 shadow-sm'

        : 'border-transparent bg-white/80 shadow-sm hover:shadow-lg focus:border-[#B39237] focus:bg-white focus:ring-2 focus:ring-[#E2BE69]/40'

    }`;



    // Resolver opciones dinámicas (p.ej., kits por área)

    let dynamicOptions = field.options;

    if (field.name === 'id_kit' && Array.isArray(field.optionsAll)) {

      const currentArea = formData.id_area ?? '';

      if (currentArea !== '') {

        dynamicOptions = field.optionsAll.filter(opt => String(opt.id_area) === String(currentArea));

      } else {

        dynamicOptions = [];

      }

    }



    switch (field.type) {

      case 'select':

        return (

          <select

            id={field.name}

            name={field.name}

            value={value}

            onChange={onChange}

            className={baseInputClass}

            required={field.required}

            disabled={field.name === 'id_kit' && (formData.id_area === '' || formData.id_area === undefined || formData.id_area === null)}

          >

            {field.placeholder && (

              <option value="">{field.placeholder}</option>

            )}

            {(dynamicOptions || field.options)?.map(option => (

              <option key={option.value} value={option.value}>

                {option.label}

              </option>

            ))}

          </select>

        );



      case 'textarea':

        return (

          <textarea

            id={field.name}

            name={field.name}

            value={value}

            onChange={onChange}

            className={baseInputClass}

            placeholder={field.placeholder}

            rows={field.rows || 3}

            required={field.required}

          />

        );



      case 'checkbox':

        return (

          <input

            type="checkbox"

            id={field.name}

            name={field.name}

            checked={Boolean(value)}

            onChange={onChange}

            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded transition-colors"

          />

        );



      default:

        return (

          <input

            type={field.type || 'text'}

            id={field.name}

            name={field.name}

            value={value}

            onChange={onChange}

            className={baseInputClass}

            placeholder={field.placeholder}

            required={field.required}

            step={field.step}

            min={field.min}

            max={field.max}

          />

        );

    }

  };



  return (

    <form id="edit-form" onSubmit={onSubmit} className={`space-y-6 ${className}`}>

      <div className="rounded-3xl border border-white/60 bg-gradient-to-b from-white/95 via-white/80 to-white/60 p-4 shadow-xl shadow-[#B39237]/10 backdrop-blur">

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          {fields.map(field => (

            <div

              key={field.name}

              className={`flex flex-col gap-2 ${field.fullWidth ? 'md:col-span-2' : ''}`}

            >

              <label

                htmlFor={field.name}

                className="block text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-gray-500 md:text-xs"

              >

                {field.label}

                {field.required && <span className="text-red-500 ml-1">*</span>}

              </label>



              {field.type === 'checkbox' ? (

                <div className="flex items-center gap-3 rounded-2xl border border-gray-200/70 bg-white/80 px-4 py-3 shadow-sm">

                  {renderField(field)}

                  <label htmlFor={field.name} className="text-sm font-medium text-gray-700">

                    {field.checkboxLabel || field.label}

                  </label>

                </div>

              ) : (

                renderField(field)

              )}



              {errors[field.name] && (

                <p className="mt-1.5 rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 shadow-sm">

                  {errors[field.name]}

                </p>

              )}

            </div>

          ))}

        </div>

      </div>

    </form>

  );



};



// Configuración de campos para empleados

export const EMPLEADO_FORM_FIELDS = [

  {

    name: 'Identificacion',  // Mantener como está en el backend

    label: 'Identificación',

    type: 'text',

    required: true,

    placeholder: 'Número de identificación',

    fullWidth: false

  },

  {

    name: 'tipo_identificacion',

    label: 'Tipo de Identificación',

    type: 'select',

    required: true,

    placeholder: 'Seleccionar tipo',

    fullWidth: false,

    options: [

      { value: 'CC', label: 'Cédula de Ciudadanía' },

      { value: 'CE', label: 'Cédula de Extranjería' },

      { value: 'TI', label: 'Tarjeta de Identidad' },

      { value: 'PA', label: 'Pasaporte' },

      { value: 'PEP', label: 'PEP' },

      { value: 'NIT', label: 'NIT' },

      { value: 'DNI', label: 'DNI' }

    ]

  },

  {

    name: 'nombre',

    label: 'Nombre',

    type: 'text',

    required: true,

    placeholder: 'Nombre del empleado',

    fullWidth: false

  },

  {

    name: 'apellido',

    label: 'Apellido',

    type: 'text',

    required: true,

    placeholder: 'Apellido del empleado',

    fullWidth: false

  },

  {

    name: 'fecha_nacimiento',

    label: 'Fecha de Nacimiento',

    type: 'date',

    required: false,

    fullWidth: false

  },

  {

    name: 'email',

    label: 'Email',

    type: 'email',

    placeholder: 'email@ejemplo.com',

    fullWidth: true

  },

  {

    name: 'telefono',

    label: 'Teléfono',

    type: 'tel',

    placeholder: '(662) 123-4567',

    fullWidth: false

  },

  {

    name: 'cargo',

    label: 'Cargo',

    type: 'text',

    required: true,

    placeholder: 'Cargo del empleado',

    fullWidth: false

  },

  {

    name: 'id_genero',

    label: 'Género',

    type: 'select',

    required: true,

    placeholder: 'Seleccionar género',

    fullWidth: false,

    options: [] // Se llenará dinámicamente desde el backend

  },

  {

    name: 'id_area',

    label: 'Área',

    type: 'select',

    required: true,

    placeholder: 'Seleccionar área',

    fullWidth: false,

    options: [] // Se llenará dinámicamente

  },

  {

    name: 'id_kit',

    label: 'Kit asignado (opcional)',

    type: 'select',

    required: false,

    placeholder: 'Seleccionar kit (opcional)',

    fullWidth: false,

    options: [] // Se llenará dinámicamente

  },

  {

    name: 'id_ubicacion',

    label: 'Ubicación',

    type: 'select',

    required: false,

    placeholder: 'Seleccionar ubicación',

    fullWidth: false,

    options: [] // Se llenará dinámicamente

  },

  {

    name: 'fecha_inicio',

    label: 'Fecha de Inicio',

    type: 'date',

    required: true,

    fullWidth: false

  },

  {

    name: 'sueldo',

    label: 'Sueldo',

    type: 'number',

    placeholder: '0.00',

    step: '0.01',

    min: '0',

    fullWidth: false

  },

  {

    name: 'fecha_fin',

    label: 'Fecha de Fin',

    type: 'date',

    required: false,

    fullWidth: false

  },

  {

    name: 'estado',

    label: 'Estado',

    type: 'select',

    required: true,

    fullWidth: false,

    options: [

      { value: 1, label: 'Activo' },

      { value: 0, label: 'Inactivo' }

    ]

  }

];



// Reglas de validación para empleados

export const EMPLEADO_VALIDATION_RULES = {

  Identificacion: { 

    required: true, 

    custom: (value) => {

      if (!value || value.toString().trim() === '') return 'Identificación es requerida';

      if (value.toString().length < 7) return 'Identificación debe tener al menos 7 caracteres';

      if (value.toString().length > 20) return 'Identificación debe tener máximo 20 caracteres';

      return null;

    }

  },

  tipo_identificacion: { required: true },

  nombre: { 

    required: true,

    custom: (value) => {

      if (!value || value.trim() === '') return 'Nombre es requerido';

      if (value.trim().length < 2) return 'Nombre debe tener al menos 2 caracteres';

      if (value.trim().length > 100) return 'Nombre debe tener máximo 100 caracteres';

      return null;

    }

  },

  apellido: { 

    required: true,

    custom: (value) => {

      if (!value || value.trim() === '') return 'Apellido es requerido';

      if (value.trim().length < 2) return 'Apellido debe tener al menos 2 caracteres';

      if (value.trim().length > 100) return 'Apellido debe tener máximo 100 caracteres';

      return null;

    }

  },

  cargo: { 

    required: true,

    custom: (value) => {

      if (!value || value.trim() === '') return 'Cargo es requerido';

      if (value.trim().length < 2) return 'Cargo debe tener al menos 2 caracteres';

      if (value.trim().length > 100) return 'Cargo debe tener máximo 100 caracteres';

      return null;

    }

  },

  id_genero: { required: true },

  id_area: { required: true },

  fecha_inicio: { required: true },

  estado: { required: true },

  fecha_nacimiento: {

    custom: (value) => {

      // Solo validar si se proporciona una fecha

      if (value && value.trim() !== '') {

        const date = new Date(value);

        if (isNaN(date.getTime())) {

          return 'Fecha de nacimiento no válida';

        }

        const today = new Date();

        const age = (today - date) / (365.25 * 24 * 60 * 60 * 1000);

        if (age < 16 || age > 100) {

          return 'Edad debe estar entre 16 y 100 años';

        }

      }

      return null;

    }

  },

  email: { 

    email: true,

    custom: (value) => {

      if (value && value.trim() !== '' && value.length > 150) {

        return 'Email debe tener máximo 150 caracteres';

      }

      return null;

    }

  },

  telefono: {

    custom: (value) => {

      if (value && value.trim() !== '' && value.length > 20) {

        return 'Teléfono debe tener máximo 20 caracteres';

      }

      return null;

    }

  },

  sueldo: { 

    positive: true,

    custom: (value) => {

      if (value && (isNaN(value) || parseFloat(value) < 0)) {

        return 'Sueldo debe ser un número positivo';

      }

      if (value && parseFloat(value) > 99999999.99) {

        return 'Sueldo debe ser menor a 100,000,000';

      }

      return null;

    }

  },

  fecha_fin: {

    custom: (value, formData) => {

      // Solo validar si se proporciona una fecha de fin

      if (value && value.trim() !== '') {

        const date = new Date(value);

        if (isNaN(date.getTime())) {

          return 'Fecha de fin no válida';

        }

        

        if (formData.fecha_inicio && formData.fecha_inicio.trim() !== '') {

          const fechaInicio = new Date(formData.fecha_inicio);

          const fechaFin = new Date(value);

          if (fechaFin <= fechaInicio) {

            return 'Fecha de fin debe ser posterior a la fecha de inicio';

          }

        }

      }

      return null;

    }

  }

};



export default EditModal;