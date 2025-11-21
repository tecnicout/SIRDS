import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import useBodyLock from './hooks/useBodyLock';

export default function AccountModalLayout({
  open,
  onClose,
  title,
  description,
  children,
  maxWidthClass = 'max-w-4xl'
}) {
  useBodyLock(open);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-white/60 px-4 py-10 backdrop-blur-xl">
      <div className={`w-full ${maxWidthClass} rounded-3xl bg-white shadow-2xl ring-1 ring-black/5`}>
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Mi Cuenta</p>
            <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
            {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="rounded-full border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-100"
          >
            <i className="bx bx-x text-2xl"></i>
          </button>
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}
