# Modal Components

Conjunto de componentes para modales accesibles y reutilizables con diferentes casos de uso especializados.

## Componentes Incluidos

- `Modal` - Componente base accesible
- `ViewModal` - Modal para vista detallada de registros
- `EditModal` - Modal para formularios de edición
- `FormFieldsFactory` - Utilitarios para generación de campos

## Modal Base

Componente modal accesible con focus trap, cierre con ESC y manejo de foco.

### Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `isOpen` | `boolean` | `false` | Si el modal está abierto |
| `onClose` | `function` | - | Callback para cerrar |
| `title` | `string` | `''` | Título del modal |
| `size` | `'sm'\|'md'\|'lg'\|'xl'\|'full'` | `'md'` | Tamaño del modal |
| `children` | `ReactNode` | - | Contenido del modal |
| `footer` | `ReactNode` | `null` | Contenido del footer |
| `initialFocusRef` | `Ref` | `null` | Elemento que recibe foco inicial |
| `closeOnBackdropClick` | `boolean` | `true` | Cerrar al hacer click en backdrop |
| `closeOnEsc` | `boolean` | `true` | Cerrar con tecla ESC |
| `showCloseButton` | `boolean` | `true` | Mostrar botón de cerrar |
| `className` | `string` | `''` | Clases CSS adicionales |

### Características de Accesibilidad

- ✅ Focus trap automático
- ✅ Retorno de foco al elemento anterior
- ✅ Cierre con tecla ESC
- ✅ Prevención del scroll del body
- ✅ Atributos ARIA correctos
- ✅ Navegación por teclado

### Uso Básico

```jsx
import { Modal } from '../components/Modal';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Abrir Modal
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Mi Modal"
        size="md"
      >
        <p>Contenido del modal</p>
      </Modal>
    </>
  );
}
```

## ViewModal

Modal especializado para mostrar información de solo lectura en formato estructurado.

### Props Adicionales

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `data` | `object` | `{}` | Datos a mostrar |
| `fields` | `Array<FieldConfig>` | `[]` | Configuración de campos |
| `columns` | `number` | `2` | Número de columnas |

### FieldConfig

```javascript
{
  key: 'nombre',              // Clave del campo en los datos
  label: 'Nombre',            // Etiqueta a mostrar
  type: 'text',               // Tipo para formateo automático
  render: (value, data) => {  // Función personalizada de renderizado
    return <span>{value}</span>;
  }
}
```

### Uso Básico

```jsx
import { ViewModal, EMPLEADO_VIEW_FIELDS } from '../components/Modal';

function EmpleadosList() {
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState(null);

  return (
    <>
      <ViewModal
        isOpen={viewOpen}
        onClose={() => setViewOpen(false)}
        title="Detalles del Empleado"
        data={selectedEmpleado}
        fields={EMPLEADO_VIEW_FIELDS}
        size="lg"
      />
    </>
  );
}
```

### Uso con ViewModal.Content

```jsx
<ViewModal
  isOpen={viewOpen}
  onClose={() => setViewOpen(false)}
  title="Detalles del Empleado"
>
  <ViewModal.Content 
    data={selectedEmpleado} 
    fields={EMPLEADO_VIEW_FIELDS}
    columns={2}
  />
</ViewModal>
```

### Campos Personalizados

```jsx
<ViewModal
  isOpen={viewOpen}
  onClose={() => setViewOpen(false)}
  title="Información Personalizada"
>
  <div className="space-y-4">
    <ViewModal.Field label="Nombre Completo">
      {empleado.nombre} {empleado.apellido}
    </ViewModal.Field>
    
    <ViewModal.Field label="Estado">
      <span className={empleado.estado ? 'text-green-600' : 'text-red-600'}>
        {empleado.estado ? 'Activo' : 'Inactivo'}
      </span>
    </ViewModal.Field>
  </div>
</ViewModal>
```

## EditModal

Modal especializado para formularios de edición con validación y manejo de estado.

### Props Adicionales

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `onSubmit` | `function` | - | Callback para envío del formulario |
| `initialData` | `object` | `{}` | Datos iniciales del formulario |
| `fields` | `Array<FieldConfig>` | `[]` | Configuración de campos |
| `validationRules` | `object` | `{}` | Reglas de validación |
| `submitText` | `string` | `'Guardar'` | Texto del botón de envío |
| `cancelText` | `string` | `'Cancelar'` | Texto del botón de cancelar |
| `isSubmitting` | `boolean` | `false` | Estado de envío |

### Configuración de Campos

```javascript
{
  name: 'nombre',             // Nombre del campo
  label: 'Nombre',            // Etiqueta
  type: 'text',               // Tipo de input
  required: true,             // Si es requerido
  placeholder: 'Ingrese...',  // Placeholder
  fullWidth: false,           // Si ocupa todo el ancho
  options: [],                // Opciones para select
  rows: 3,                    // Filas para textarea
  step: '0.01',              // Step para number
  min: '0',                  // Valor mínimo
  max: '100'                 // Valor máximo
}
```

### Reglas de Validación

```javascript
{
  fieldName: {
    required: true,           // Campo requerido
    email: true,             // Validar email
    numeric: true,           // Solo números
    positive: true,          // Número positivo
    custom: (value, formData) => {  // Validación personalizada
      if (value.length < 3) {
        return 'Mínimo 3 caracteres';
      }
      return null; // Sin error
    }
  }
}
```

### Uso Básico

```jsx
import { EditModal, EMPLEADO_FORM_FIELDS, EMPLEADO_VALIDATION_RULES } from '../components/Modal';

function EmpleadoForm() {
  const [editOpen, setEditOpen] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      await fetch('/api/empleados', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setEditOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <EditModal
      isOpen={editOpen}
      onClose={() => setEditOpen(false)}
      onSubmit={handleSubmit}
      title="Editar Empleado"
      initialData={selectedEmpleado}
      fields={EMPLEADO_FORM_FIELDS}
      validationRules={EMPLEADO_VALIDATION_RULES}
      submitText="Actualizar"
      isSubmitting={isSubmitting}
      size="lg"
    />
  );
}
```

### Formulario Personalizado

```jsx
<EditModal
  isOpen={editOpen}
  onClose={() => setEditOpen(false)}
  onSubmit={handleSubmit}
  title="Formulario Personalizado"
>
  <EditModal.Form
    fields={customFields}
    formData={formData}
    errors={errors}
    onChange={handleInputChange}
    onSubmit={handleSubmit}
  />
</EditModal>
```

## FormFieldsFactory

Utilidades para generar configuraciones de campos dinámicamente.

### Funciones Disponibles

```javascript
import { 
  createField,
  createTextField,
  createEmailField,
  createSelectField,
  createDateField,
  PREDEFINED_OPTIONS 
} from '../components/Modal/FormFieldsFactory';

// Campo básico
const nombreField = createTextField('nombre', 'Nombre', {
  required: true,
  placeholder: 'Ingrese el nombre'
});

// Campo de email
const emailField = createEmailField('email', 'Email');

// Campo select
const generoField = createSelectField('genero', 'Género', PREDEFINED_OPTIONS.GENDER, {
  required: true
});

// Campo de fecha
const fechaField = createDateField('fecha_nacimiento', 'Fecha de Nacimiento');
```

### Opciones Predefinidas

```javascript
PREDEFINED_OPTIONS = {
  GENDER: [
    { value: '1', label: 'Masculino' },
    { value: '2', label: 'Femenino' }
  ],
  ID_TYPES: [
    { value: 'CC', label: 'Cédula de Ciudadanía' },
    { value: 'CE', label: 'Cédula de Extranjería' },
    // ...
  ],
  STATUS: [
    { value: true, label: 'Activo' },
    { value: false, label: 'Inactivo' }
  ]
}
```

## Ejemplo Completo - Empleados

```jsx
import React, { useState, useEffect } from 'react';
import { ViewModal, EditModal, EMPLEADO_VIEW_FIELDS, EMPLEADO_FORM_FIELDS, EMPLEADO_VALIDATION_RULES } from '../components/Modal';

function Empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [selectedEmpleado, setSelectedEmpleado] = useState(null);
  
  // Estados de modales
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  
  // Estados de formulario
  const [areas, setAreas] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar áreas para el formulario
  useEffect(() => {
    fetch('/api/areas')
      .then(res => res.json())
      .then(data => setAreas(data));
  }, []);

  // Preparar campos con áreas cargadas
  const formFields = EMPLEADO_FORM_FIELDS.map(field => {
    if (field.name === 'id_area') {
      return {
        ...field,
        options: areas.map(area => ({
          value: area.id_area,
          label: area.nombre_area
        }))
      };
    }
    return field;
  });

  const handleView = (empleado) => {
    setSelectedEmpleado(empleado);
    setViewOpen(true);
  };

  const handleEdit = (empleado) => {
    setSelectedEmpleado(empleado);
    setEditOpen(true);
  };

  const handleCreate = () => {
    setSelectedEmpleado(null);
    setCreateOpen(true);
  };

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      const url = selectedEmpleado 
        ? `/api/empleados/${selectedEmpleado.id}` 
        : '/api/empleados';
      
      const response = await fetch(url, {
        method: selectedEmpleado ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        // Recargar lista
        loadEmpleados();
        setEditOpen(false);
        setCreateOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Lista de empleados con botones */}
      
      {/* Modal de Vista */}
      <ViewModal
        isOpen={viewOpen}
        onClose={() => setViewOpen(false)}
        title="Detalles del Empleado"
        data={selectedEmpleado}
        fields={EMPLEADO_VIEW_FIELDS}
        size="lg"
      />

      {/* Modal de Edición */}
      <EditModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={handleSubmit}
        title="Editar Empleado"
        initialData={selectedEmpleado}
        fields={formFields}
        validationRules={EMPLEADO_VALIDATION_RULES}
        submitText="Actualizar"
        isSubmitting={isSubmitting}
        size="lg"
      />

      {/* Modal de Creación */}
      <EditModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleSubmit}
        title="Nuevo Empleado"
        fields={formFields}
        validationRules={EMPLEADO_VALIDATION_RULES}
        submitText="Crear"
        isSubmitting={isSubmitting}
        size="lg"
      />
    </div>
  );
}
```

## Tipos de Campo Soportados

- `text` - Input de texto
- `email` - Input de email con validación
- `password` - Input de contraseña
- `number` - Input numérico
- `tel` - Input de teléfono
- `date` - Selector de fecha
- `datetime-local` - Fecha y hora
- `time` - Selector de hora
- `select` - Lista desplegable
- `textarea` - Área de texto
- `checkbox` - Casilla de verificación
- `radio` - Botón de radio
- `file` - Selector de archivos

## Validaciones Disponibles

- `required` - Campo requerido
- `email` - Formato de email válido
- `numeric` - Solo números
- `positive` - Número positivo
- `minLength` - Longitud mínima
- `maxLength` - Longitud máxima
- `pattern` - Expresión regular
- `custom` - Función de validación personalizada