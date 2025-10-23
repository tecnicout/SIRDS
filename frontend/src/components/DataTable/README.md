# DataTable Component

Componente de tabla reutilizable y configurable que proporciona funcionalidades de ordenamiento, búsqueda, paginación y acciones de fila.

## Características

- ✅ Búsqueda y filtrado
- ✅ Ordenamiento por columnas
- ✅ Paginación configurable
- ✅ Acciones de fila personalizables
- ✅ Estados de carga y error
- ✅ Responsive design
- ✅ Columnas configurables
- ✅ Toolbar personalizable

## Props

### Principales

| Prop | Tipo | Requerido | Default | Descripción |
|------|------|-----------|---------|-------------|
| `columns` | `Array<ColumnConfig>` | ✅ | `[]` | Configuración de columnas |
| `data` | `Array<object>` | ✅ | `[]` | Datos a mostrar |
| `rowKey` | `string` | ✅ | `'id'` | Clave única para cada fila |

### Estados

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `loading` | `boolean` | `false` | Estado de carga |
| `error` | `string` | `null` | Mensaje de error |

### Búsqueda

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `searchQuery` | `string` | `''` | Query de búsqueda |
| `onSearch` | `function` | - | Callback para búsqueda |
| `searchPlaceholder` | `string` | `'Buscar...'` | Placeholder del input |
| `showSearch` | `boolean` | `true` | Mostrar campo de búsqueda |

### Ordenamiento

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `sortConfig` | `object` | `{ key: null, direction: 'asc' }` | Configuración de ordenamiento |
| `onSort` | `function` | - | Callback para ordenamiento |

### Paginación

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `pagination` | `object` | `{ page: 1, pageSize: 10, total: 0 }` | Configuración de paginación |
| `onPageChange` | `function` | - | Callback para cambio de página |
| `showPagination` | `boolean` | `true` | Mostrar controles de paginación |

### Acciones

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `onRowAction` | `function` | - | Callback para acciones de fila |
| `rowActions` | `Array<string>` | `['view', 'edit', 'delete']` | Acciones disponibles |
| `customRowActions` | `Array<object>` | `[]` | Acciones personalizadas |

### Personalización

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `showToolbar` | `boolean` | `true` | Mostrar toolbar |
| `toolbarProps` | `object` | `{}` | Props para el toolbar |
| `emptyState` | `ReactNode` | - | Componente para estado vacío |
| `className` | `string` | `''` | Clases CSS adicionales |
| `tableClassName` | `string` | `''` | Clases para la tabla |

## ColumnConfig

Configuración para cada columna de la tabla:

```javascript
{
  key: 'nombre',              // Clave del campo en los datos
  label: 'Nombre',            // Etiqueta del encabezado
  sortable: true,             // Si es ordenable (opcional)
  width: '200px',             // Ancho de la columna (opcional)
  visible: true,              // Si es visible (opcional)
  align: 'left',              // Alineación: 'left', 'center', 'right'
  className: 'font-bold',     // Clases CSS adicionales
  render: (value, row) => {   // Función de renderizado personalizada
    return <span>{value}</span>;
  }
}
```

## Uso Básico

```jsx
import DataTable, { EMPLEADOS_COLUMNS } from '../components/DataTable';

function MyComponent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleRowAction = (action, row) => {
    console.log('Action:', action, 'Row:', row);
  };

  return (
    <DataTable
      columns={EMPLEADOS_COLUMNS}
      data={data}
      rowKey="id_empleado"
      loading={loading}
      searchQuery={searchQuery}
      onSearch={setSearchQuery}
      onRowAction={handleRowAction}
    />
  );
}
```

## Ejemplo Avanzado

```jsx
import DataTable from '../components/DataTable';

const columns = [
  {
    key: 'nombre',
    label: 'Nombre',
    sortable: true,
    render: (value, row) => (
      <div className="font-medium">{row.nombre} {row.apellido}</div>
    )
  },
  {
    key: 'email',
    label: 'Contacto',
    render: (value, row) => (
      <div>
        <div>{row.email}</div>
        <div className="text-gray-500">{row.telefono}</div>
      </div>
    )
  },
  {
    key: 'estado',
    label: 'Estado',
    align: 'center',
    render: (value) => (
      <span className={`px-2 py-1 rounded ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        {value ? 'Activo' : 'Inactivo'}
      </span>
    )
  }
];

function AdvancedExample() {
  const [empleados, setEmpleados] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0
  });

  const toolbarProps = {
    customActions: (
      <button className="btn-primary">
        Nuevo Empleado
      </button>
    ),
    searchPlaceholder: "Buscar empleados...",
    onFilterClick: () => console.log('Filtros'),
    onExportClick: () => console.log('Exportar')
  };

  return (
    <DataTable
      columns={columns}
      data={empleados}
      rowKey="id_empleado"
      pagination={pagination}
      onPageChange={(page, pageSize) => setPagination({...pagination, page, pageSize})}
      rowActions={['view', 'edit', 'toggle']}
      toolbarProps={toolbarProps}
      onRowAction={(action, row) => {
        switch (action) {
          case 'view':
            // Abrir modal de vista
            break;
          case 'edit':
            // Abrir modal de edición
            break;
          case 'toggle':
            // Cambiar estado
            break;
        }
      }}
    />
  );
}
```

## Integración con Empleados.jsx

```jsx
import React, { useState, useEffect } from 'react';
import DataTable, { EMPLEADOS_COLUMNS } from '../components/DataTable';

function Empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Cargar empleados desde la API
    fetch('/api/empleados')
      .then(res => res.json())
      .then(data => {
        setEmpleados(data);
        setLoading(false);
      });
  }, []);

  const handleRowAction = (action, empleado) => {
    switch (action) {
      case 'view':
        // Abrir modal de vista
        break;
      case 'edit':
        // Abrir modal de edición
        break;
      case 'toggle':
        // Cambiar estado del empleado
        break;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestión de Empleados</h1>
        <p className="text-gray-600">Administra la información de empleados</p>
      </div>

      <DataTable
        columns={EMPLEADOS_COLUMNS}
        data={empleados}
        rowKey="id_empleado"
        loading={loading}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        onRowAction={handleRowAction}
        rowActions={['view', 'edit', 'toggle']}
        toolbarProps={{
          searchPlaceholder: "Nombre, apellido, email o cargo...",
          customActions: (
            <button className="btn-primary">
              Nuevo Empleado
            </button>
          )
        }}
      />
    </div>
  );
}
```

## Acciones Estándar

El componente incluye estas acciones estándar:

- `view` - Ver detalles del registro
- `edit` - Editar el registro  
- `delete` - Eliminar el registro
- `toggle` - Cambiar estado (activo/inactivo)

## Personalización de Estilos

```jsx
<DataTable
  className="my-custom-table"
  tableClassName="custom-table-styles"
  columns={columns}
  data={data}
  // ... otros props
/>
```

## Estados Especiales

### Estado de Carga
```jsx
<DataTable loading={true} />
```

### Estado de Error
```jsx
<DataTable error="Error al cargar datos" />
```

### Estado Vacío Personalizado
```jsx
<DataTable 
  data={[]} 
  emptyState={
    <div className="text-center py-8">
      <p>No hay empleados registrados</p>
      <button onClick={handleCreate}>Crear Primer Empleado</button>
    </div>
  }
/>
```