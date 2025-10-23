import React, { useState } from 'react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('El email es requerido');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Por favor ingresa un email válido');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const result = await response.json();

      if (result.success) {
        setMessage(result.message);
        setIsSuccess(true);
        setEmail(''); // Limpiar el formulario
      } else {
        setError(result.message || 'Error al procesar la solicitud');
      }

    } catch (error) {
      console.error('Error enviando solicitud:', error);
      setError('Error de conexión. Verifica que el servidor esté funcionando.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl border-2 border-gray-300/70 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#B39237] to-[#D4AF37] p-8 text-center">
          <div className="mb-4">
            <img src="/logo.png" alt="Logo SIRDS" className="w-20 h-14 mx-auto mb-4 drop-shadow-xl filter brightness-110" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Recuperar Contraseña</h1>
          <p className="text-white/90 text-sm">
            Ingresa tu email para recibir un enlace de restablecimiento
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          
          {/* Botón volver */}
          <button
            onClick={() => window.history.back()}
            className="mb-6 flex items-center text-gray-600 hover:text-[#B39237] transition-colors"
          >
            <i className="bx bx-arrow-back text-xl mr-2"></i>
            <span>Volver al login</span>
          </button>

          {/* Mensajes */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              <div className="flex items-center">
                <i className="bx bx-error-circle text-lg mr-2"></i>
                {error}
              </div>
            </div>
          )}

          {message && (
            <div className={`mb-6 p-4 rounded-xl text-sm ${
              isSuccess 
                ? 'bg-green-50 border border-green-200 text-green-700' 
                : 'bg-blue-50 border border-blue-200 text-blue-700'
            }`}>
              <div className="flex items-start">
                <i className={`text-lg mr-2 mt-0.5 ${
                  isSuccess ? 'bx bx-check-circle' : 'bx bx-info-circle'
                }`}></i>
                <div>
                  <p>{message}</p>
                  {isSuccess && (
                    <p className="mt-2 text-xs opacity-75">
                      Revisa tu bandeja de entrada y carpeta de spam.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Formulario */}
          {!isSuccess && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-4 pl-4 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B39237] focus:border-transparent transition-all duration-200 font-medium"
                    placeholder="ejemplo@molinosonora.com"
                    required
                    disabled={isLoading}
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <i className="bx bx-envelope text-xl text-gray-400"></i>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#B39237] to-[#D4AF37] text-white font-semibold py-4 rounded-xl hover:from-[#A0812F] hover:to-[#C19B2F] focus:outline-none focus:ring-2 focus:ring-[#B39237] focus:ring-offset-2 transition-all duration-300 transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <i className="bx bx-loader-alt animate-spin mr-3 text-xl"></i>
                    Enviando...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <i className="bx bx-envelope mr-3 text-xl"></i>
                    Enviar Enlace de Recuperación
                  </div>
                )}
              </button>
            </form>
          )}

          {/* Acción después del éxito */}
          {isSuccess && (
            <div className="space-y-4">
              <button
                onClick={() => {
                  setIsSuccess(false);
                  setMessage('');
                  setEmail('');
                }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition-colors duration-200"
              >
                <div className="flex items-center justify-center">
                  <i className="bx bx-refresh mr-2 text-lg"></i>
                  Enviar a otro email
                </div>
              </button>
              
              <a
                href="/login"
                className="block w-full bg-gradient-to-r from-[#B39237] to-[#D4AF37] text-white font-semibold py-3 rounded-xl text-center hover:from-[#A0812F] hover:to-[#C19B2F] transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
              >
                <div className="flex items-center justify-center">
                  <i className="bx bx-log-in mr-2 text-lg"></i>
                  Volver al Login
                </div>
              </a>
            </div>
          )}

          {/* Información de seguridad */}
          <div className="mt-8 p-4 bg-gray-50 rounded-xl">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <i className="bx bx-info-circle mr-2 text-lg text-[#B39237]"></i>
              Información de Seguridad
            </h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• El enlace expirará en 1 hora por seguridad</li>
              <li>• Solo se puede usar una vez</li>
              <li>• Si no solicitaste esto, ignora el email</li>
              <li>• Contacta al administrador si tienes dudas</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}