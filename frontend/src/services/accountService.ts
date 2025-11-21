import api from '../config/axios';

export interface AccountSummary {
  profile: {
    id_usuario: number;
    username: string;
    email: string;
    ultimo_acceso: string | null;
    rol: string;
    empleado: {
      id_empleado: number;
      nombre: string;
      apellido: string;
      cargo: string;
      telefono: string | null;
      email: string | null;
    };
    customization: {
      avatar_url: string | null;
      avatar_color: string;
      telefono_alterno: string | null;
      extension: string | null;
      timezone: string;
      bio: string | null;
      firma_digital: string | null;
    };
  };
  preferences: {
    idioma: string;
    tema: 'claro' | 'oscuro' | 'sistema';
    notificar_email: boolean;
    notificar_push: boolean;
    notificar_inventario: boolean;
    notificar_ciclos: boolean;
    resumen_semanal: boolean;
  };
  notifications: {
    unreadCount: number;
    latest: Array<{
      id_notificacion: number;
      tipo: string;
      titulo: string;
      mensaje: string;
      leido: number;
      created_at: string;
    }>;
  };
}

export interface NotificationPage {
  items: Array<{
    id_notificacion: number;
    tipo: string;
    titulo: string;
    mensaje: string;
    metadata: Record<string, unknown> | null;
    leido: number;
    created_at: string;
    read_at?: string | null;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

const extractData = <T>(response: { data?: { success?: boolean; data?: T; message?: string } }): T => {
  if (!response || !response.data) {
    throw new Error('Respuesta inválida del servidor');
  }
  const payload: any = response.data;
  if (payload.success === false) {
    throw new Error(payload.message || 'Operación no permitida');
  }
  return (payload.data ?? payload) as T;
};

const accountService = {
  async getSummary(): Promise<AccountSummary> {
    const response = await api.get('/account/summary');
    return extractData<AccountSummary>(response);
  },

  async updateProfile(payload: Record<string, unknown>): Promise<AccountSummary> {
    const response = await api.put('/account/profile', payload);
    return extractData<AccountSummary>(response);
  },

  async updatePreferences(payload: Record<string, unknown>): Promise<AccountSummary> {
    const response = await api.put('/account/preferences', payload);
    return extractData<AccountSummary>(response);
  },

  async getNotifications(params: { page?: number; pageSize?: number; filter?: string }): Promise<NotificationPage> {
    const response = await api.get('/account/notifications', { params });
    return extractData<NotificationPage>(response);
  },

  async markNotification(id: number, read = true): Promise<void> {
    await api.patch(`/account/notifications/${id}`, { read });
  },

  async markAllRead(): Promise<number> {
    const response = await api.post('/account/notifications/read-all');
    const data = extractData<{ count: number }>(response);
    return data.count;
  }
};

export default accountService;
