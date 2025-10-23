import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';

export default function ResetPassword() {
  const { token } = useParams();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validar token al cargar el componente
  useEffect(() => {
    if (!token) {
      setError('Token de restablecimiento no válido');
      setIsValidating(false);
      return;
    }

    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      setIsValidating(true);
      const response = await fetch(`/api/auth/reset-password/${token}/validate`);
      const result = await response.json();

      if (result.success) {
        setTokenValid(true);
        setUserInfo(result.data);
      } else {
        setError(result.message || 'Token inválido o expirado');
        setTokenValid(false);
      }
    } catch (error) {
      console.error('Error validando token:', error);
      setError('Error de conexión. Verifica que el servidor esté funcionando.');
      setTokenValid(false);
    } finally {
      setIsValidating(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Limpiar errores cuando el usuario empiece a escribir
    if (error) setError('');
  };

  const validateForm = () => {
    const { newPassword, confirmPassword } = formData;

    if (!newPassword || !confirmPassword) {
      setError('Todos los campos son requeridos');
      return false;
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }

    // Validaciones adicionales de seguridad
    if (!/[A-Za-z]/.test(newPassword)) {
      setError('La contraseña debe contener al menos una letra');
      return false;
    }

    if (!/[0-9]/.test(newPassword)) {
      setError('La contraseña debe contener al menos un número');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword
        })
      });

      const result = await response.json();

      if (result.success) {
        setMessage(result.message);
        setIsSuccess(true);
        setFormData({ newPassword: '', confirmPassword: '' });
      } else {
        setError(result.message || 'Error al restablecer la contraseña');
      }

    } catch (error) {
      console.error('Error restableciendo contraseña:', error);
      setError('Error de conexión. Verifica que el servidor esté funcionando.');
    } finally {
      setIsLoading(false);
    }
  };

  // Si no hay token, redirigir
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Pantalla de validación
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl border-2 border-gray-300/70 p-8 text-center">
          <div className="mb-6">
            <i className="bx bx-loader-alt animate-spin text-6xl text-[#B39237]"></i>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Validando enlace...</h2>
          <p className="text-gray-600">Por favor espera mientras verificamos tu enlace de restablecimiento.</p>
        </div>
      </div>
    );
  }

  // Token inválido
  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl border-2 border-gray-300/70 overflow-hidden">
          
          {/* Header de error */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-8 text-center">
            <i className="bx bx-error-circle text-6xl text-white mb-4"></i>
            <h1 className="text-2xl font-bold text-white mb-2">Enlace No Válido</h1>
          </div>

          <div className="p-8 text-center">
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>

            <div className="space-y-4">
              <p className="text-gray-600 mb-6">
                El enlace de restablecimiento puede haber expirado o ya fue usado.
              </p>

              <div className="space-y-3">
                <a
                  href="/forgot-password"
                  className="block w-full bg-gradient-to-r from-[#B39237] to-[#D4AF37] text-white font-semibold py-3 rounded-xl text-center hover:from-[#A0812F] hover:to-[#C19B2F] transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
                >
                  <div className="flex items-center justify-center">
                    <i className="bx bx-refresh mr-2 text-lg"></i>
                    Solicitar Nuevo Enlace
                  </div>
                </a>

                <a
                  href="/login"
                  className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition-colors duration-200"
                >
                  <div className="flex items-center justify-center">
                    <i className="bx bx-arrow-back mr-2 text-lg"></i>
                    Volver al Login
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl border-2 border-gray-300/70 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#B39237] to-[#D4AF37] p-8 text-center">
          <div className="mb-4">
            <img src="/logo.png" alt="Logo SIRDS" className="w-20 h-14 mx-auto mb-4 drop-shadow-xl filter brightness-110" />
          </div>
          {!isSuccess ? (
            <>
              <h1 className="text-2xl font-bold text-white mb-2">Nueva Contraseña</h1>
              <p className="text-white/90 text-sm">
                Ingresa tu nueva contraseña para {userInfo?.username}
              </p>
            </>
          ) : (
            <>
              <i className="bx bx-check-circle text-4xl text-white mb-4"></i>
              <h1 className="text-2xl font-bold text-white mb-2">¡Contraseña Actualizada!</h1>
            </>
          )}
        </div>

        {/* Content */}
        <div className="p-8">
          
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
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
              <div className="flex items-start">
                <i className="bx bx-check-circle text-lg mr-2 mt-0.5"></i>
                <div>
                  <p>{message}</p>
                  <p className="mt-2 text-xs opacity-75">
                    También recibirás un email de confirmación.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Formulario */}
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Información del usuario */}
              {userInfo && (
                <div className="bg-gray-50 p-4 rounded-xl text-sm">
                  <div className="flex items-center text-gray-700">
                    <i className="bx bx-user text-lg mr-2 text-[#B39237]"></i>
                    <span>Restableciendo contraseña para: <strong>{userInfo.email}</strong></span>
                  </div>
                </div>
              )}

              {/* Nueva contraseña */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-4 pl-4 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B39237] focus:border-transparent transition-all duration-200 font-medium"
                    placeholder="Mínimo 6 caracteres"
                    required
                    disabled={isLoading}
                    minLength="6"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#B39237] transition-colors focus:outline-none"
                  >
                    {showPassword ? (
                      <i className="bx bx-hide text-xl"></i>
                    ) : (
                      <i className="bx bx-show text-xl"></i>
                    )}
                  </button>
                </div>
              </div>

              {/* Confirmar contraseña */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-4 pl-4 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B39237] focus:border-transparent transition-all duration-200 font-medium"
                    placeholder="Repite la contraseña"
                    required
                    disabled={isLoading}
                    minLength="6"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#B39237] transition-colors focus:outline-none"
                  >
                    {showConfirmPassword ? (
                      <i className="bx bx-hide text-xl"></i>
                    ) : (
                      <i className="bx bx-show text-xl"></i>
                    )}
                  </button>
                </div>
              </div>

              {/* Requisitos de contraseña */}
              <div className="bg-blue-50 p-4 rounded-xl">
                <h3 className="text-sm font-semibold text-blue-700 mb-2 flex items-center">
                  <i className="bx bx-info-circle mr-2 text-lg"></i>
                  Requisitos de Contraseña
                </h3>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li className={`flex items-center ${formData.newPassword.length >= 6 ? 'text-green-600' : ''}`}>
                    <i className={`bx ${formData.newPassword.length >= 6 ? 'bx-check' : 'bx-x'} mr-2`}></i>
                    Mínimo 6 caracteres
                  </li>
                  <li className={`flex items-center ${/[A-Za-z]/.test(formData.newPassword) ? 'text-green-600' : ''}`}>
                    <i className={`bx ${/[A-Za-z]/.test(formData.newPassword) ? 'bx-check' : 'bx-x'} mr-2`}></i>
                    Al menos una letra
                  </li>
                  <li className={`flex items-center ${/[0-9]/.test(formData.newPassword) ? 'text-green-600' : ''}`}>
                    <i className={`bx ${/[0-9]/.test(formData.newPassword) ? 'bx-check' : 'bx-x'} mr-2`}></i>
                    Al menos un número
                  </li>
                  <li className={`flex items-center ${formData.newPassword && formData.confirmPassword && formData.newPassword === formData.confirmPassword ? 'text-green-600' : ''}`}>
                    <i className={`bx ${formData.newPassword && formData.confirmPassword && formData.newPassword === formData.confirmPassword ? 'bx-check' : 'bx-x'} mr-2`}></i>
                    Las contraseñas coinciden
                  </li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#B39237] to-[#D4AF37] text-white font-semibold py-4 rounded-xl hover:from-[#A0812F] hover:to-[#C19B2F] focus:outline-none focus:ring-2 focus:ring-[#B39237] focus:ring-offset-2 transition-all duration-300 transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <i className="bx bx-loader-alt animate-spin mr-3 text-xl"></i>
                    Actualizando...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <i className="bx bx-check mr-3 text-xl"></i>
                    Actualizar Contraseña
                  </div>
                )}
              </button>
            </form>
          ) : (
            /* Pantalla de éxito */
            <div className="text-center space-y-6">
              <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-xl">
                <i className="bx bx-check-circle text-4xl text-green-600 mb-4"></i>
                <p className="text-green-700 font-medium">
                  Tu contraseña ha sido restablecida exitosamente.
                </p>
              </div>

              <a
                href="/login"
                className="block w-full bg-gradient-to-r from-[#B39237] to-[#D4AF37] text-white font-semibold py-4 rounded-xl text-center hover:from-[#A0812F] hover:to-[#C19B2F] transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
              >
                <div className="flex items-center justify-center">
                  <i className="bx bx-log-in mr-3 text-xl"></i>
                  Iniciar Sesión Ahora
                </div>
              </a>
            </div>
          )}

          {/* Información de seguridad (solo si no es éxito) */}
          {!isSuccess && (
            <div className="mt-8 p-4 bg-gray-50 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <i className="bx bx-shield-alt-2 mr-2 text-lg text-[#B39237]"></i>
                Información de Seguridad
              </h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Este enlace se eliminará después de usar</li>
                <li>• Tu nueva contraseña será encriptada</li>
                <li>• Recibirás un email de confirmación</li>
                <li>• Cerraremos todas las sesiones activas</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}