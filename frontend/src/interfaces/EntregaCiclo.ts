interface EntregaCiclo {
  id_empleado_ciclo: number;
  id_ciclo: number;
  id_empleado: number;
  id_kit: number;
  estado: 'procesado' | 'entregado' | 'omitido';
  antiguedad_meses: number;
  sueldo_al_momento: number;
  id_area: number;
  observaciones: string | null;
  fecha_asignacion: string;
  fecha_entrega_real: string | null;
  fecha_actualizacion: string;
  actualizado_por: number | null;
  nombre: string;
  apellido: string;
  identificacion: string;
  cargo: string;
  nombre_area: string;
  nombre_kit: string;
  actualizado_por_nombre: string | null;
  fecha_entrega_programada: string;
}

interface EntregasResponse {
  success: boolean;
  data: {
    entregas: EntregaCiclo[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface EntregasStats {
  total: number;
  procesados: number;
  entregados: number;
  omitidos: number;
  total_areas: number;
  total_empleados: number;
}

export type { EntregaCiclo, EntregasResponse, EntregasStats };