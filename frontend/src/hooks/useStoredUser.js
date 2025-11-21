import { useEffect, useState } from 'react';
import { USER_STORAGE_KEY, USER_UPDATED_EVENT, getStoredUser, setStoredUser } from '../utils/userStorage';

export default function useStoredUser() {
  const [user, setUserState] = useState(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    return getStoredUser();
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const syncFromStorage = (nextValue) => {
      if (nextValue === undefined) {
        setUserState(getStoredUser());
        return;
      }
      setUserState(nextValue);
    };

    const handleUserUpdated = (event) => {
      syncFromStorage(event.detail ?? undefined);
    };

    const handleStorage = (event) => {
      if (event.key !== USER_STORAGE_KEY) {
        return;
      }
      try {
        const next = event.newValue ? JSON.parse(event.newValue) : null;
        syncFromStorage(next);
      } catch (error) {
        console.error('No se pudo sincronizar el usuario desde storage:', error);
        syncFromStorage(null);
      }
    };

    window.addEventListener(USER_UPDATED_EVENT, handleUserUpdated);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(USER_UPDATED_EVENT, handleUserUpdated);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const updateUser = (nextValue) => {
    setUserState((prev) => {
      const computed = typeof nextValue === 'function' ? nextValue(prev) : nextValue;
      setStoredUser(computed || null);
      return computed || null;
    });
  };

  return [user, updateUser];
}
