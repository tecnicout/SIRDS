import React, { useCallback, useEffect, useMemo, useState } from 'react';
import accountService from '../../services/accountService';
import AccountModalLayout from './AccountModalLayout';
import { syncStoredUserWithProfile } from '../../utils/userStorage';

const initialProfileForm = {
  telefono_principal: '',
  telefono_alterno: '',
  extension: '',
  timezone: 'America/Bogota',
  bio: '',
  firma_digital: '',
  avatar_color: '#0C4DCD',
  avatar_url: null,
  avatarBase64: null,
  removeAvatar: false
};

function InfoField({ icon, label, value }) {
  return (
    <div>
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#B39237]">
        <i className={`${icon} text-base text-[#D4AF37]`}></i>
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-gray-900">{value || 'Sin información'}</p>
    </div>
  );
}

export default function AccountProfileModal({ open, onClose }) {
  const [summary, setSummary] = useState(null);
  const [profileForm, setProfileForm] = useState(initialProfileForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const hydrateFromSummary = useCallback((data) => {
    if (!data) return;
    const customization = data.profile?.customization ?? {};
    const employee = data.profile?.empleado ?? {};
    setProfileForm({
      telefono_principal: employee.telefono || customization.telefono_principal || '',
      telefono_alterno: customization.telefono_alterno || '',
      extension: customization.extension || '',
      timezone: customization.timezone || 'America/Bogota',
      bio: customization.bio || '',
      firma_digital: customization.firma_digital || '',
      avatar_color: customization.avatar_color || '#0C4DCD',
      avatar_url: customization.avatar_url || null,
      avatarBase64: null,
      removeAvatar: false
    });
  }, []);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await accountService.getSummary();
      setSummary(data);
      hydrateFromSummary(data);
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'No se pudo cargar la información del perfil');
    } finally {
      setLoading(false);
    }
  }, [hydrateFromSummary]);

  useEffect(() => {
    if (!open) return;
    loadSummary();
  }, [open, loadSummary]);

  const handleProfileChange = (field, value) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = async (file) => {
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      setError('Solo se permiten imágenes');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen no puede superar los 2MB');
      return;
    }
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    setProfileForm((prev) => ({
      ...prev,
      avatarBase64: base64,
      avatar_url: null,
      removeAvatar: false
    }));
  };

  const handleRemoveAvatar = () => {
    setProfileForm((prev) => ({
      ...prev,
      avatarBase64: null,
      avatar_url: null,
      removeAvatar: true
    }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        telefonoAlterno: profileForm.telefono_alterno,
        telefonoPrincipal: profileForm.telefono_principal,
        extension: profileForm.extension,
        timezone: profileForm.timezone,
        bio: profileForm.bio,
        firmaDigital: profileForm.firma_digital,
        avatarColor: profileForm.avatar_color,
        avatarBase64: profileForm.avatarBase64,
        removeAvatar: profileForm.removeAvatar
      };
      const updated = await accountService.updateProfile(payload);
      setSummary(updated);
      hydrateFromSummary(updated);
      syncStoredUserWithProfile(updated.profile);
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'No se pudo guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    hydrateFromSummary(summary);
    setIsEditing(false);
  };

  const employeeProfile = summary?.profile?.empleado || {};
  const roleLabel = summary?.profile?.rol || 'Colaborador';
  const userName = employeeProfile.nombre || employeeProfile.apellido
    ? `${employeeProfile.nombre || ''} ${employeeProfile.apellido || ''}`.trim()
    : summary?.profile?.username;
  const userEmail = summary?.profile?.email || employeeProfile.email || 'Sin email registrado';
  const departmentLabel = employeeProfile.area_nombre || employeeProfile.cargo || 'Sin departamento';
  const locationLabel = employeeProfile.ubicacion_nombre || 'Ubicación no asignada';
  const joinDateLabel = employeeProfile.fecha_inicio
    ? new Date(employeeProfile.fecha_inicio).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'Fecha no registrada';

  const avatarPreview = useMemo(() => {
    if (profileForm.avatarBase64) return profileForm.avatarBase64;
    if (profileForm.avatar_url) return profileForm.avatar_url;
    const baseName = userName || 'Usuario';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(baseName)}&background=1b53c0&color=fff`;
  }, [profileForm.avatarBase64, profileForm.avatar_url, userName]);

  return (
    <AccountModalLayout
      open={open}
      onClose={onClose}
      title="Mi Perfil"
      description="Gestiona tu información personal y permisos"
      maxWidthClass="max-w-4xl"
    >
      {loading ? (
        <p className="text-sm text-gray-500">Cargando...</p>
      ) : (
        <div className="space-y-6">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0C3C99] via-[#1B5BC9] to-[#D4AF37] px-8 py-6 text-white shadow-[0_25px_70px_rgba(12,76,205,0.2)]">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.25), transparent 60%)' }}></div>
            <div className="relative grid gap-6 lg:grid-cols-[auto_1fr_auto]">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white/30 shadow-2xl">
                <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                {isEditing && (
                  <label className="absolute -bottom-2 -right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white text-[#0C4DCD] shadow-lg">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatarUpload(e.target.files?.[0])} />
                    <i className="bx bx-camera text-lg"></i>
                  </label>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Editar Perfil</p>
                <h3 className="text-3xl font-bold leading-tight">{userName}</h3>
                <p className="text-base font-semibold text-white/80">{userEmail}</p>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 font-semibold">
                    <i className="bx bx-shield"></i>
                    {roleLabel}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 font-semibold">
                    <i className="bx bx-buildings"></i>
                    {departmentLabel}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 font-semibold">
                    <i className="bx bx-map"></i>
                    {locationLabel}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-4">
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-6 py-2 text-sm font-semibold text-[#3F2A08] shadow-lg shadow-[#8C6B1B]/30 transition hover:bg-[#C79C2E]"
                  >
                    <i className="bx bx-pencil"></i>
                    Editar Perfil
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/50 px-4 py-1.5 text-xs font-semibold">
                    <i className="bx bx-edit-alt"></i>
                    Modo edición activo
                  </span>
                )}
                <p className="text-xs uppercase tracking-wide text-white/90">
                  Última sincronización: {new Date().toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <aside className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-[#B39237]">Contacto directo</h4>
                <div className="mt-4 space-y-3">
                  {[{
                    icon: 'bx bx-envelope',
                    label: 'Correo corporativo',
                    value: userEmail
                  }, {
                    icon: 'bx bx-phone',
                    label: 'Teléfono principal',
                    value: profileForm.telefono_principal || 'Sin registro'
                  }, {
                    icon: 'bx bx-phone-call',
                    label: 'Teléfono alterno',
                    value: profileForm.telefono_alterno || 'No definido'
                  }, {
                    icon: 'bx bx-extension',
                    label: 'Extensión',
                    value: profileForm.extension || 'No asignada'
                  }].map(({ icon, label, value }) => (
                    <div key={label} className="rounded-2xl bg-gray-50 px-4 py-3">
                      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#B39237]">
                        <i className={`${icon} text-base text-[#D4AF37]`}></i>
                        {label}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-[#B39237]">Datos laborales</h4>
                <div className="mt-4 space-y-3">
                  {[{
                    icon: 'bx bx-building',
                    label: 'Departamento',
                    value: departmentLabel
                  }, {
                    icon: 'bx bx-map',
                    label: 'Ubicación',
                    value: locationLabel
                  }, {
                    icon: 'bx bx-calendar',
                    label: 'Fecha de ingreso',
                    value: joinDateLabel
                  }, {
                    icon: 'bx bx-time-five',
                    label: 'Zona horaria',
                    value: profileForm.timezone
                  }].map(({ icon, label, value }) => (
                    <div key={label} className="rounded-2xl border border-gray-100 px-4 py-3">
                      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#B39237]">
                        <i className={`${icon} text-base text-[#D4AF37]`}></i>
                        {label}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-[#B39237]">Bio y firma</h4>
                <p className="mt-3 rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                  {profileForm.bio ? profileForm.bio : 'Aún no has escrito una descripción personal.'}
                </p>
                {profileForm.firma_digital && (
                  <div className="mt-3 rounded-2xl border border-dashed border-gray-200 px-4 py-3 text-sm text-gray-600">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Firma digital</p>
                    <p className="mt-2 font-semibold text-gray-800">{profileForm.firma_digital}</p>
                  </div>
                )}
              </div>
            </aside>

            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              {!isEditing ? (
                <div className="space-y-8">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold uppercase tracking-wide text-[#B39237]">Información personal</p>
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-1.5 text-xs font-semibold text-gray-700 hover:border-[#D4AF37] hover:text-[#6F581B]"
                      >
                        <i className="bx bx-edit"></i>
                        Actualizar datos
                      </button>
                    </div>
                    <div className="mt-4 grid gap-6 md:grid-cols-2">
                      <InfoField icon="bx bx-envelope" label="Email" value={userEmail} />
                      <InfoField icon="bx bx-phone" label="Teléfono principal" value={profileForm.telefono_principal || 'Sin teléfono registrado'} />
                      <InfoField icon="bx bx-phone-call" label="Teléfono alterno" value={profileForm.telefono_alterno || 'No definido'} />
                      <InfoField icon="bx bx-extension" label="Extensión" value={profileForm.extension || 'No asignada'} />
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-6">
                    <p className="text-sm font-semibold uppercase tracking-wide text-[#B39237]">Preferencias</p>
                    <div className="mt-4 grid gap-6 md:grid-cols-2">
                      <InfoField icon="bx bx-time-five" label="Zona horaria" value={profileForm.timezone} />
                      <InfoField icon="bx bx-palette" label="Color de avatar" value={profileForm.avatar_color.toUpperCase()} />
                      <InfoField icon="bx bx-map" label="Ubicación" value={locationLabel} />
                      <InfoField icon="bx bx-briefcase" label="Departamento" value={departmentLabel} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mx-auto w-full max-w-2xl">
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <fieldset className="rounded-2xl border border-gray-100 px-4 py-4">
                    <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Contacto</legend>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold text-gray-500">Nombre completo</label>
                        <input value={userName} readOnly className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500">Email corporativo</label>
                        <input value={userEmail} readOnly className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500">Teléfono principal</label>
                        <input
                          type="text"
                          value={profileForm.telefono_principal}
                          onChange={(e) => handleProfileChange('telefono_principal', e.target.value)}
                          className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#D4AF37] focus:ring-1 focus:ring-[#E2BE69]/60 focus:outline-none"
                          placeholder="Número principal"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500">Teléfono alterno</label>
                        <input
                          type="text"
                          value={profileForm.telefono_alterno}
                          onChange={(e) => handleProfileChange('telefono_alterno', e.target.value)}
                          className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#D4AF37] focus:ring-1 focus:ring-[#E2BE69]/60 focus:outline-none"
                          placeholder="Número secundario"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500">Extensión</label>
                        <input
                          type="text"
                          value={profileForm.extension}
                          onChange={(e) => handleProfileChange('extension', e.target.value)}
                          className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#D4AF37] focus:ring-1 focus:ring-[#E2BE69]/60 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500">Zona horaria</label>
                        <select
                          value={profileForm.timezone}
                          onChange={(e) => handleProfileChange('timezone', e.target.value)}
                          className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#D4AF37] focus:ring-1 focus:ring-[#E2BE69]/60 focus:outline-none"
                        >
                          <option value="America/Bogota">America/Bogota</option>
                          <option value="America/Mexico_City">America/Mexico_City</option>
                          <option value="America/Lima">America/Lima</option>
                        </select>
                      </div>
                    </div>
                  </fieldset>

                  <fieldset className="rounded-2xl border border-gray-100 px-4 py-4">
                    <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Preferencias visuales</legend>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold text-gray-500">Color del avatar</label>
                        <div className="mt-2 flex items-center gap-3">
                          <input
                            type="color"
                            value={profileForm.avatar_color}
                            onChange={(e) => handleProfileChange('avatar_color', e.target.value)}
                            className="h-10 w-12 rounded border border-gray-200 bg-white"
                          />
                          <span className="text-sm font-semibold text-gray-700">{profileForm.avatar_color.toUpperCase()}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500">Firma digital</label>
                        <textarea
                          value={profileForm.firma_digital}
                          onChange={(e) => handleProfileChange('firma_digital', e.target.value)}
                          rows={3}
                          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#D4AF37] focus:ring-1 focus:ring-[#E2BE69]/60 focus:outline-none"
                          placeholder="Texto que aparecerá en aprobaciones"
                        ></textarea>
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-semibold text-gray-500">Biografía</label>
                        <textarea
                          value={profileForm.bio}
                          onChange={(e) => handleProfileChange('bio', e.target.value)}
                          rows={4}
                          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#D4AF37] focus:ring-1 focus:ring-[#E2BE69]/60 focus:outline-none"
                          placeholder="Describe tu rol, fortalezas o disponibilidad."
                        ></textarea>
                      </div>
                    </div>
                  </fieldset>

                  <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 sm:flex-row sm:items-center">
                    <div className="relative h-20 w-20 overflow-hidden rounded-full border border-dashed border-gray-300 bg-white">
                      <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                      <label className="absolute -bottom-2 -right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#0C4DCD] text-white shadow">
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatarUpload(e.target.files?.[0])} />
                        <i className="bx bx-camera text-lg"></i>
                      </label>
                    </div>
                    <div className="flex-1 text-sm text-gray-600">
                      <p className="font-semibold text-gray-800">Foto de perfil</p>
                      <p className="text-gray-500">Formatos admitidos: JPG, PNG. Tamaño máximo 2 MB.</p>
                      {(profileForm.avatarBase64 || profileForm.avatar_url) ? (
                        <button type="button" onClick={handleRemoveAvatar} className="mt-2 text-sm font-semibold text-red-600">
                          Quitar foto actual
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-end gap-4 border-t border-gray-100 pt-4">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="rounded-full border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B67C16] px-6 py-2 text-sm font-semibold text-white shadow disabled:opacity-60"
                    >
                      {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                  </div>
                </form>
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </AccountModalLayout>
  );
}
