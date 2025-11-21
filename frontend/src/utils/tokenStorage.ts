let inMemoryToken: string | null = null;

const hasSessionStorage = () => {
  try {
    return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
  } catch (error) {
    return false;
  }
};

export const getToken = (): string | null => {
  if (hasSessionStorage()) {
    try {
      const token = window.sessionStorage.getItem('token');
      if (token) {
        inMemoryToken = token;
      }
      return token ?? inMemoryToken;
    } catch (error) {
      return inMemoryToken;
    }
  }
  return inMemoryToken;
};

export const setToken = (token: string) => {
  inMemoryToken = token;
  if (hasSessionStorage()) {
    try {
      window.sessionStorage.setItem('token', token);
    } catch (error) {
      // Ignorar fallos de almacenamiento (por ejemplo, modo incógnito)
    }
  }
};

export const clearToken = () => {
  inMemoryToken = null;
  if (hasSessionStorage()) {
    try {
      window.sessionStorage.removeItem('token');
    } catch (error) {
      // Ignorar fallos al limpiar
    }
  }
};
