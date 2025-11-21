import React, { useCallback, useEffect, useMemo, useState } from 'react';
import accountService from '../../services/accountService';
import AccountModalLayout from './AccountModalLayout';

const NOTIFICATION_ICONS = {
  alerta: 'bx-error-circle',
  sistema: 'bx-cog',
  inventario: 'bx-package',
  seguridad: 'bx-shield-quarter',
  default: 'bx-bell'
};

function NotificationCard({ notification, onToggle }) {
  const icon = NOTIFICATION_ICONS[notification.tipo?.toLowerCase()] || NOTIFICATION_ICONS.default;
  const dateLabel = new Date(notification.created_at).toLocaleString('es-ES', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className={`flex gap-4 rounded-3xl border px-5 py-4 ${notification.leido ? 'border-gray-100 bg-gray-50' : 'border-[#D6E4FF] bg-white shadow-sm'}`}>
      <div className={`relative mt-1 flex h-10 w-10 items-center justify-center rounded-2xl ${notification.leido ? 'bg-gray-100 text-gray-500' : 'bg-[#E8F0FF] text-[#0C4DCD]'}`}>
        <i className={`${icon} text-lg`}></i>
        <span className="absolute -bottom-4 left-1/2 h-8 w-px -translate-x-1/2 bg-gray-200"></span>
      </div>
      <div className="flex-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">{notification.titulo}</p>
            <p className="text-xs text-gray-500">{dateLabel}</p>
          </div>
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[0.65rem] font-semibold ${notification.leido ? 'bg-gray-100 text-gray-500' : 'bg-[#E8F0FF] text-[#0C4DCD]'}`}>
            <i className="bx bx-pulse"></i>
            {notification.tipo}
          </span>
        </div>
        <p className="mt-3 text-sm text-gray-700">{notification.mensaje}</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className={`text-xs font-semibold ${notification.leido ? 'text-gray-500' : 'text-[#0C4DCD]'}`}>
            {notification.leido ? 'Leída' : 'Pendiente de revisar'}
          </span>
          <button
            type="button"
            onClick={() => onToggle(notification)}
            className="text-xs font-semibold text-[#0C4DCD] hover:underline"
          >
            {notification.leido ? 'Marcar como no leída' : 'Marcar como leída'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AccountNotificationsModal({ open, onClose }) {
  const [notifications, setNotifications] = useState({ items: [], pagination: { page: 1, pageSize: 10, total: 0 } });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const unreadCount = useMemo(() => notifications.items.filter((item) => !item.leido).length, [notifications.items]);
  const typeOptions = useMemo(() => {
    const unique = Array.from(new Set(notifications.items.map((item) => item.tipo).filter(Boolean)));
    return ['all', ...unique];
  }, [notifications.items]);
  const filteredNotifications = useMemo(() => {
    return notifications.items.filter((notification) => {
      const statusMatches =
        statusFilter === 'all' ||
        (statusFilter === 'unread' && !notification.leido) ||
        (statusFilter === 'read' && notification.leido);
      const typeMatches = typeFilter === 'all' || notification.tipo === typeFilter;
      return statusMatches && typeMatches;
    });
  }, [notifications.items, statusFilter, typeFilter]);

  const loadNotifications = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const data = await accountService.getNotifications({ page, pageSize: 10, filter: 'all' });
      setNotifications(data);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las notificaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    loadNotifications();
  }, [open, loadNotifications]);

  const handleToggle = async (notification) => {
    try {
      await accountService.markNotification(notification.id_notificacion, !notification.leido);
      loadNotifications(notifications.pagination.page);
    } catch (err) {
      setError(err.message || 'No se pudo actualizar la notificación');
    }
  };

  const handleMarkAll = async () => {
    try {
      await accountService.markAllRead();
      loadNotifications(notifications.pagination.page);
    } catch (err) {
      setError(err.message || 'No se pudieron marcar todas');
    }
  };

  return (
    <AccountModalLayout
      open={open}
      onClose={onClose}
      title="Notificaciones"
      description="Consulta tu actividad reciente"
      maxWidthClass="max-w-3xl"
    >
      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <section className="mb-5 rounded-3xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">Bandeja de notificaciones</p>
            <p className="text-xs text-gray-500">{notifications.pagination.total} registradas · {unreadCount} sin leer</p>
          </div>
          <button
            type="button"
            onClick={handleMarkAll}
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            <i className="bx bx-check-double"></i>
            Marcar todas como leídas
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {[{ key: 'all', label: 'Todas' }, { key: 'unread', label: `No leídas (${unreadCount})` }, { key: 'read', label: 'Leídas' }].map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setStatusFilter(filter.key)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${statusFilter === filter.key ? 'border-[#0C4DCD] bg-[#E8F0FF] text-[#0C4DCD]' : 'border-gray-200 bg-white text-gray-600 hover:border-[#0C4DCD]/40'}`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <i className="bx bx-filter-alt"></i>
            <span>Tipo</span>
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 focus:border-[#0C4DCD]"
          >
            {typeOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? 'Todos los tipos' : option}
              </option>
            ))}
          </select>
        </div>
      </section>

      {loading ? (
        <p className="text-sm text-gray-500">Cargando...</p>
      ) : filteredNotifications.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white/80 px-6 py-12 text-center text-sm text-gray-500">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3F6FF] text-[#0C4DCD]">
            <i className="bx bx-bell-off text-2xl"></i>
          </div>
          No encontramos notificaciones para este filtro.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <NotificationCard key={notification.id_notificacion} notification={notification} onToggle={handleToggle} />
          ))}
        </div>
      )}
    </AccountModalLayout>
  );
}
