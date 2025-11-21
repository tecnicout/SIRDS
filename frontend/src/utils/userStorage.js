export const USER_STORAGE_KEY = 'user';
export const USER_UPDATED_EVENT = 'sirds:user-updated';

const hasBrowserStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export function getStoredUser() {
  if (!hasBrowserStorage()) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('No se pudo leer el usuario almacenado:', error);
    window.localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
}

export function setStoredUser(user) {
  if (!hasBrowserStorage()) {
    return;
  }
  try {
    if (user) {
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(USER_STORAGE_KEY);
    }
    window.dispatchEvent(new CustomEvent(USER_UPDATED_EVENT, { detail: user || null }));
  } catch (error) {
    console.error('No se pudo actualizar el usuario en storage:', error);
  }
}

export function clearStoredUser() {
  setStoredUser(null);
}

export function syncStoredUserWithProfile(profile) {
  if (!profile) {
    return null;
  }
  const current = getStoredUser() || {};
  const empleado = profile.empleado || {};
  const composedName = `${empleado.nombre || ''} ${empleado.apellido || ''}`.trim();

  const nextUser = {
    ...current,
    id_usuario: profile.id_usuario ?? current.id_usuario,
    id_empleado: empleado.id_empleado ?? current.id_empleado,
    username: profile.username ?? current.username,
    email: profile.email ?? current.email,
    nombre: empleado.nombre ?? current.nombre,
    apellido: empleado.apellido ?? current.apellido,
    nombre_completo: composedName || profile.username || current.nombre_completo,
    id_rol: current.id_rol ?? profile.id_rol,
    nombre_rol: profile.rol ?? current.nombre_rol,
    cargo: empleado.cargo ?? current.cargo,
    area: empleado.area_nombre ?? current.area,
    ubicacion: empleado.ubicacion_nombre ?? current.ubicacion,
    avatar_url: profile.customization?.avatar_url || null,
    avatar_color: profile.customization?.avatar_color || current.avatar_color || '#9CA3AF'
  };

  setStoredUser(nextUser);
  return nextUser;
}
