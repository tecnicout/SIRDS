import React, { useEffect, useRef, useCallback } from 'react';

/**
 * Modal - Componente base accesible para modales
 * Incluye focus trap, cierre con ESC, click en backdrop, y retorno de foco
 */
const Modal = ({
  isOpen = false,
  onClose,
  title = '',
  size = 'md',
  children,
  footer = null,
  initialFocusRef = null,
  closeOnBackdropClick = true,
  closeOnEsc = true,
  className = '',
  overlayClassName = '',
  contentClassName = '',
  showCloseButton = true,
  ...props
}) => {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);
  const closeButtonRef = useRef(null);

  // Guardar el elemento que tenía foco antes de abrir el modal
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
    }
  }, [isOpen]);

  // Manejar foco inicial cuando se abre el modal
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusElement = initialFocusRef?.current || closeButtonRef.current;
      if (focusElement) {
        focusElement.focus();
      }
    }
  }, [isOpen, initialFocusRef]);

  // Retornar foco al elemento anterior cuando se cierra el modal
  useEffect(() => {
    return () => {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, []);

  // Manejar tecla ESC
  const handleEscKey = useCallback((event) => {
    if (closeOnEsc && event.key === 'Escape') {
      onClose?.();
    }
  }, [closeOnEsc, onClose]);

  // Manejar click en backdrop
  const handleBackdropClick = useCallback((event) => {
    if (closeOnBackdropClick && event.target === event.currentTarget) {
      onClose?.();
    }
  }, [closeOnBackdropClick, onClose]);

  // Focus trap
  const handleTabKey = useCallback((event) => {
    if (!modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (event.key === 'Tab') {
      if (event.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable?.focus();
          event.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable?.focus();
          event.preventDefault();
        }
      }
    }
  }, []);

  // Event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      document.addEventListener('keydown', handleTabKey);
      // Prevenir scroll del body
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.removeEventListener('keydown', handleEscKey);
        document.removeEventListener('keydown', handleTabKey);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, handleEscKey, handleTabKey]);

  // Tamaños predefinidos con mejor responsividad
  const sizeClasses = {
    sm: 'max-w-md w-full mx-4',
    md: 'max-w-3xl w-full mx-4',
    lg: 'max-w-5xl w-full mx-4',
    xl: 'max-w-7xl w-full mx-4',
    full: 'max-w-none mx-4'
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 ${overlayClassName}`}
      onClick={handleBackdropClick}
      role="dialog"
  aria-modal={true}
      aria-labelledby={title ? 'modal-title' : undefined}
      {...props}
    >
      {/* Backdrop con blur y opacidad mejorada */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-all duration-300" />
      
      {/* Modal con diseño mejorado */}
      <div 
        ref={modalRef}
        className={`relative bg-white/95 backdrop-blur-lg rounded-lg md:rounded-2xl shadow-2xl w-full ${sizeClasses[size]} max-h-[95vh] md:max-h-[90vh] overflow-hidden border border-gray-200/50 ${className}`}
      >
        {/* Header mejorado */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-4 md:px-8 py-4 md:py-6 border-b border-gray-200/70 bg-gradient-to-r from-gray-50/80 to-white/80">
            {title && (
              <h3 id="modal-title" className="text-lg md:text-xl font-semibold text-gray-700 pr-4">
                {title}
              </h3>
            )}
            {showCloseButton && (
              <button
                ref={closeButtonRef}
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl p-2 transition-all duration-200"
                aria-label="Cerrar modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        
        {/* Contenido con scroll mejorado */}
        <div className={`px-4 md:px-8 py-4 md:py-6 overflow-y-auto max-h-[calc(95vh-8rem)] md:max-h-[calc(90vh-8rem)] ${contentClassName}`}>
          {children}
        </div>
        
        {/* Footer mejorado */}
        {footer && (
          <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 px-4 md:px-8 py-4 md:py-6 border-t border-gray-200/70 bg-gradient-to-r from-gray-50/50 to-white/80">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;