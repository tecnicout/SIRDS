import React, { useCallback, useEffect, useState } from 'react';
import accountService from '../../services/accountService';
import AccountModalLayout from './AccountModalLayout';

const initialPreferencesForm = {
  idioma: 'es',
  tema: 'sistema',
  notificar_email: true,
  notificar_push: false,
  notificar_inventario: true,
  notificar_ciclos: true,
  resumen_semanal: false
};

const LANGUAGE_LABELS = {
  es: 'Español',
  en: 'English'
};

const THEME_LABELS = {
  claro: 'Claro',
  oscuro: 'Oscuro',
  sistema: 'Seguir al sistema'
};

function PreferenceToggle({ id, label, description, checked, onChange, icon }) {
  return (
    <label
      htmlFor={id}
      className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 shadow-sm ${checked ? 'border-[#0C4DCD]/30 bg-[#F5F8FF]' : 'border-gray-200 bg-white'}`}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${checked ? 'bg-[#0C4DCD]/10 text-[#0C4DCD]' : 'bg-gray-100 text-gray-500'}`}>
            <i className={`${icon} text-lg`}></i>
          </span>
        )}
        <div>
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-[#0C4DCD]' : 'bg-gray-300'}`}
        aria-pressed={checked}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${checked ? 'right-0.5' : 'left-0.5'}`}></span>
        <input id={id} type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      </button>
    </label>
  );
}

export default function AccountPreferencesModal({ open, onClose }) {
  const [preferencesForm, setPreferencesForm] = useState(initialPreferencesForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadPreferences = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await accountService.getSummary();
      setPreferencesForm(data.preferences || initialPreferencesForm);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las preferencias');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    loadPreferences();
  }, [open, loadPreferences]);

  const handlePreferencesChange = (field, value) => {
    setPreferencesForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await accountService.updatePreferences(preferencesForm);
      onClose?.();
    } catch (err) {
      setError(err.message || 'No se pudieron guardar las preferencias');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AccountModalLayout
      open={open}
      onClose={onClose}
      title="Preferencias"
      description="Ajusta idioma, apariencia y notificaciones"
      maxWidthClass="max-w-3xl"
    >
      {loading ? (
        <p className="text-sm text-gray-500">Cargando...</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <section className="rounded-3xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Resumen actual</p>
                <p className="text-sm text-gray-600">Idioma {LANGUAGE_LABELS[preferencesForm.idioma] || 'es'} · Tema {THEME_LABELS[preferencesForm.tema] || 'sistema'}</p>
              </div>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">Sincronizado {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {[{
                label: 'Idioma activo',
                value: LANGUAGE_LABELS[preferencesForm.idioma] || 'Español',
                icon: 'bx bx-globe'
              }, {
                label: 'Tema del sistema',
                value: THEME_LABELS[preferencesForm.tema] || 'Seguir al sistema',
                icon: 'bx bx-moon'
              }, {
                label: 'Canales activos',
                value: [
                  preferencesForm.notificar_email ? 'Correo' : null,
                  preferencesForm.notificar_push ? 'Push' : null,
                  preferencesForm.resumen_semanal ? 'Resumen' : null
                ].filter(Boolean).join(' · ') || 'Solo alertas críticas',
                icon: 'bx bx-bell'
              }].map(({ label, value, icon }) => (
                <div key={label} className="rounded-2xl border border-gray-100 px-4 py-3">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <i className={`${icon} text-base text-[#0C4DCD]`}></i>
                    {label}
                  </p>
                  <p className="mt-2 text-base font-semibold text-gray-900">{value}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <label className="text-xs font-semibold text-gray-600">Idioma</label>
              <p className="text-xs text-gray-400">Afecta correos y etiquetas en la plataforma</p>
              <select
                value={preferencesForm.idioma}
                onChange={(e) => handlePreferencesChange('idioma', e.target.value)}
                className="mt-3 w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm focus:border-[#0C4DCD] focus:outline-none"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <label className="text-xs font-semibold text-gray-600">Tema del sistema</label>
              <p className="text-xs text-gray-400">Sincroniza con tu preferencia de luz/oscuridad</p>
              <select
                value={preferencesForm.tema}
                onChange={(e) => handlePreferencesChange('tema', e.target.value)}
                className="mt-3 w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm focus:border-[#0C4DCD] focus:outline-none"
              >
                <option value="claro">Claro</option>
                <option value="oscuro">Oscuro</option>
                <option value="sistema">Seguir al sistema</option>
              </select>
            </div>
          </div>

          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Alertas y recordatorios</p>
            {[{
              field: 'notificar_email',
              label: 'Alertas por correo',
              description: 'Recibe confirmaciones y avisos críticos en tu bandeja',
              icon: 'bx bx-envelope'
            }, {
              field: 'notificar_push',
              label: 'Notificaciones push',
              description: 'Activa avisos tipo banner en tus dispositivos',
              icon: 'bx bx-mobile-alt'
            }, {
              field: 'notificar_inventario',
              label: 'Alertas de inventario',
              description: 'Mantente al tanto de existencias críticas',
              icon: 'bx bx-package'
            }, {
              field: 'notificar_ciclos',
              label: 'Recordatorios de ciclos',
              description: 'Renovaciones y seguimientos a tiempo',
              icon: 'bx bx-refresh'
            }, {
              field: 'resumen_semanal',
              label: 'Resumen semanal',
              description: 'Un correo consolidado cada lunes',
              icon: 'bx bx-calendar-week'
            }].map(({ field, label, description, icon }) => (
              <PreferenceToggle
                key={field}
                id={field}
                label={label}
                description={description}
                icon={icon}
                checked={Boolean(preferencesForm[field])}
                onChange={(value) => handlePreferencesChange(field, value)}
              />
            ))}
          </section>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[#0C4DCD] px-6 py-2 text-sm font-semibold text-white shadow hover:bg-[#0a3c95] disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Guardar preferencias'}
            </button>
          </div>
        </form>
      )}
    </AccountModalLayout>
  );
}
