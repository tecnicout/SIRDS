import api from '../config/axios';
import type { EntregasResponse, EntregasStats } from '../interfaces/EntregaCiclo';

interface EntregasFilter {
  page?: number;
  limit?: number;
  estado?: string;
  area?: number;
  search?: string;
}

const entregasService = {
  /**
   * Obtener entregas del ciclo activo con paginación y filtros
   */
  getEntregas: async (filters: EntregasFilter = {}): Promise<EntregasResponse['data']> => {
    const params: Record<string,string> = {};
    if (filters.page) params.page = String(filters.page);
    if (filters.limit) params.limit = String(filters.limit);
    if (filters.estado) params.estado = filters.estado;
    if (filters.area) params.area = String(filters.area);
    if (filters.search) params.search = filters.search;
    try {
      const response = await api.get<EntregasResponse>('/entregas-ciclo', { params });
      if (!response.data.success) throw new Error('Error obteniendo entregas');
      return response.data.data;
    } catch (err:any) {
      throw new Error(err.message || 'Error al obtener entregas');
    }
  },

  /**
   * Actualizar estado de una entrega
   */
  actualizarEstado: async (id:number, estado:string, observaciones?:string): Promise<{success:boolean}> => {
    try {
      const response = await api.put(`/entregas-ciclo/${id}/estado`, { estado, observaciones });
      if (!response.data.success) throw new Error(response.data.message || 'No se pudo actualizar estado');
      return { success: true };
    } catch (err:any) {
      throw new Error(err.message || 'Error al actualizar estado');
    }
  },

  /**
   * Obtener estadísticas del ciclo
   */
  getEstadisticas: async (idCiclo:number): Promise<EntregasStats> => {
    try {
      const response = await api.get<{success:boolean; data:EntregasStats; message?:string}>(`/entregas-ciclo/estadisticas/${idCiclo}`);
      if (!response.data.success) throw new Error(response.data.message || 'Error obteniendo estadísticas');
      return response.data.data;
    } catch (err:any) {
      throw new Error(err.message || 'Error al obtener estadísticas');
    }
  }
};

export default entregasService;