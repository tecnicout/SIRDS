import api from '../config/axios';
import { getToken, setToken, clearToken } from '../utils/tokenStorage';

interface AuthUser {
  id_usuario: number;
  id_empleado?: number;
  username: string;
  email: string;
  nombre?: string;
  apellido?: string;
  id_rol?: number;
  nombre_rol?: string;
  roles?: string[];
}

interface LoginResponseRaw {
  success: boolean;
  data: {
    token: string;
    usuario: AuthUser;
  };
}

const authService = {
  login: async (email: string, password: string): Promise<{ token: string; user: AuthUser }> => {
    const response = await api.post<LoginResponseRaw>('/auth/login', { email, password });
    if (!response.data.success) throw new Error('Credenciales inválidas');
    const token = response.data.data.token;
    setToken(token);
    return { token, user: response.data.data.usuario };
  },

  checkSession: async (): Promise<{ user: AuthUser }> => {
    const token = getToken();
    if (!token) throw new Error('No hay token');
    const response = await api.get<LoginResponseRaw>('/auth/validate');
    if (!response.data.success) throw new Error('Sesión inválida');
    return { user: response.data.data.usuario };
  },

  logout: async (): Promise<void> => {
    try { await api.post('/auth/logout'); } catch {}
    clearToken();
  }
};

export default authService;