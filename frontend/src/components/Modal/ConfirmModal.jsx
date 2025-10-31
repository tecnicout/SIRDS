import React from 'react';

/**
 * ConfirmModal - Modal de confirmación reutilizable
 * Permite confirmar acciones críticas con mejor UX que window.confirm
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmar Acción",
  message = "¿Estás seguro de que deseas continuar?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "danger", // danger, warning, info
  isLoading = false
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          icon: 'text-red-600',
          iconBg: 'bg-red-100'
        };
      case 'warning':
        return {
          button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
          icon: 'text-yellow-600',
          iconBg: 'bg-yellow-100'
        };
      case 'info':
        return {
          button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          icon: 'text-blue-600',
          iconBg: 'bg-blue-100'
        };
      default:
        return {
          button: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500',
          icon: 'text-gray-600',
          iconBg: 'bg-gray-100'
        };
    }
  };

  const styles = getTypeStyles();

  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleCancel}
        ></div>

        {/* Spacer para centrar el modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden={true}>
          &#8203;
        </span>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 mx-2 md:mx-0">
          <div className="sm:flex sm:items-start">
            {/* Icono */}
            <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${styles.iconBg} sm:mx-0 sm:h-10 sm:w-10`}>
              {type === 'danger' && (
                <svg className={`h-6 w-6 ${styles.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              )}
              {type === 'warning' && (
                <svg className={`h-6 w-6 ${styles.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              )}
              {type === 'info' && (
                <svg className={`h-6 w-6 ${styles.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>

            {/* Contenido */}
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-base md:text-lg leading-6 font-medium text-gray-700">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm md:text-base text-gray-500">
                  {message}
                </p>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              disabled={isLoading}
              onClick={handleConfirm}
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-3 py-2 md:px-4 md:py-2 text-sm md:text-base font-medium text-white ${styles.button} focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </>
              ) : (
                confirmText
              )}
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleCancel}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-3 py-2 md:px-4 md:py-2 bg-white text-sm md:text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;