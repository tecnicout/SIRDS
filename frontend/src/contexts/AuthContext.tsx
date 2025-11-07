import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

interface User {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar sesión almacenada
    const checkSession = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const { user: currentUser } = await authService.checkSession();
          setUser(currentUser);
        }
      } catch (err) {
        console.error('Error al verificar sesión:', err);
        setError('Error al verificar sesión');
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const { token, user } = await authService.login(email, password);
      localStorage.setItem('token', token);
      setUser(user);
    } catch (err) {
      console.error('Error en login:', err);
      setError('Error al iniciar sesión');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      localStorage.removeItem('token');
      setUser(null);
    } catch (err) {
      console.error('Error en logout:', err);
      setError('Error al cerrar sesión');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;