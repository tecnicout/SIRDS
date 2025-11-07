import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'boxicons/css/boxicons.min.css';
import './index.css';
import Dashboard from './pages/Dashboard';
import Empleados from './pages/Empleados';
import Ubicaciones from './pages/Ubicaciones';
import Areas from './pages/Areas';
import Usuarios from './pages/Usuarios';
import Proveedores from './pages/Proveedores';
import Dotaciones from './pages/Dotaciones';
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
const LazyBlurText = lazy(() => import('./components/BlurText'));

// Componente de Login Page
function LoginPage({ onLoginSuccess }) {
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Guardar token en localStorage
        localStorage.setItem('token', result.data.token);
        
        // La nueva estructura envía datos del usuario directamente en la respuesta
        // ya no necesitamos decodificar el token manualmente
        if (result.data.usuario) {
          localStorage.setItem('user', JSON.stringify({
            id_usuario: result.data.usuario.id_usuario,
            id_empleado: result.data.usuario.id_empleado,
            username: result.data.usuario.username,
            nombre_completo: result.data.usuario.nombre_completo,
            email: result.data.usuario.email,
            id_rol: result.data.usuario.id_rol,
            nombre_rol: result.data.usuario.nombre_rol,
            cargo: result.data.usuario.cargo,
            area: result.data.usuario.area,
            ubicacion: result.data.usuario.ubicacion
          }));
        } else {
          // Fallback: decodificar token si no viene usuario en respuesta
          const payload = JSON.parse(atob(result.data.token.split('.')[1]));
          localStorage.setItem('user', JSON.stringify({
            id_usuario: payload.id_usuario,
            id_empleado: payload.id_empleado,
            username: payload.username,
            nombre: payload.nombre,
            apellido: payload.apellido,
            email: payload.email_usuario,
            id_rol: payload.id_rol,
            nombre_rol: payload.nombre_rol,
            cargo: payload.cargo,
            area: payload.nombre_area
          }));
        }
        
        // Notificar éxito
        if (typeof onLoginSuccess === 'function') {
          onLoginSuccess();
        }
        
        // Limpiar formulario
        setLoginData({ email: '', password: '' });
      } else {
        setError(result.message || 'Error en las credenciales');
      }
    } catch (error) {
      console.error('Error en login:', error);
      setError('Error de conexión. Verifica que el servidor esté funcionando.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-white flex items-center justify-center p-6">
      <div className="max-w-4xl w-full bg-white rounded-[2.5rem] shadow-2xl border-2 border-gray-300/70 overflow-hidden">
        <div className="flex min-h-[540px]">
          
          {/* Panel Izquierdo - Welcome Section con Diseño Curvo Ovalado */}
          <div className="relative flex-1 overflow-hidden">
            {/* Forma ovalada exacta como la imagen de referencia */}
            <div 
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #B39237 0%, #D4AF37 50%, #E2BE69 100%)',
                borderRadius: '50px 0 0 50px'
              }}
            >
              <div className="text-center text-white z-10 relative px-8 py-12">
                <div className="mb-8">
                  <img src="/logo.png" alt="Logo Arroz Sonora" className="w-28 h-20 mx-auto mb-6 drop-shadow-xl filter brightness-110" />
                </div>
                <h1 className="text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight leading-none drop-shadow-lg font-boris">
                  SIRDS
                </h1>
                <p className="text-lg font-medium text-white/90 leading-relaxed max-w-xs mx-auto drop-shadow-sm">
                  Sistema Integrado para el Registro de Dotación Sonora
                </p>
              </div>
              
              {/* Elementos decorativos ovalados mejorados */}
              <div className="absolute top-12 left-8 w-32 h-20 bg-white bg-opacity-15 rounded-full blur-2xl transform rotate-45"></div>
              <div className="absolute bottom-16 left-16 w-24 h-16 bg-white bg-opacity-20 rounded-full blur-xl transform -rotate-12"></div>
              <div className="absolute top-1/3 right-12 w-16 h-28 bg-white bg-opacity-10 rounded-full blur-lg transform rotate-12"></div>
            </div>
          </div>

          {/* Panel Derecho - Login Form con esquinas perfectas */}
          <div className="flex-1 flex items-center justify-center p-8 lg:p-12 relative rounded-r-[2.5rem]" style={{background: 'linear-gradient(135deg, #FDF6E3 0%, #F9F2E1 50%, #F5EEDC 100%)'}}>
            {/* Botón volver - sutil y profesional */}
            <button
              onClick={() => window.history.back()}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-white/50 rounded-full"
            >
              <i className="bx bx-x text-xl"></i>
            </button>

            <div className="w-full max-w-xs">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-gray-800 mb-2 tracking-tight">Iniciar Sesión</h2>
              </div>
              
              {/* Mensaje de error con diseño mejorado */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Campo Usuario - Diseño exacto */}
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={loginData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-4 pl-4 pr-12 bg-gray-50 border border-gray-200 rounded-2xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B39237] focus:border-transparent transition-all duration-200 font-medium text-base"
                    placeholder="Correo Electrónico"
                    required
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <i className="bx bx-user text-xl text-gray-400"></i>
                  </div>
                </div>

                {/* Campo Contraseña - Diseño exacto */}
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={loginData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-4 pl-4 pr-12 bg-gray-50 border border-gray-200 rounded-2xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B39237] focus:border-transparent transition-all duration-200 font-medium text-base"
                    placeholder="contraseña"
                    required
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

                {/* Forgot Password */}
                <div className="text-center">
                  <a href="/forgot-password" className="text-sm text-gray-500 hover:text-[#B39237] transition-colors font-medium">
                    Olvidó su contraseña?
                  </a>
                  <div className="w-24 h-px bg-gray-300 mx-auto mt-1"></div>
                </div>

                {/* Botón Login - Diseño exacto */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-[#B39237] to-[#D4AF37] text-white font-semibold py-4 rounded-2xl hover:from-[#A0812F] hover:to-[#C19B2F] focus:outline-none focus:ring-2 focus:ring-[#B39237] focus:ring-offset-2 transition-all duration-300 transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <i className="bx bx-loader-alt animate-spin -ml-1 mr-3 text-xl text-white"></i>
                      Iniciando sesión...
                    </div>
                  ) : (
                    'Iniciar Sesión '
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar autenticación al cargar la aplicación
  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem('token');
      
      // Si no hay token, no autenticar
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      // Verificar si el token ha expirado (sin hacer petición al servidor)
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        
        if (tokenPayload.exp && tokenPayload.exp < currentTime) {
          console.log('Token expirado, limpiando sesión');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          return;
        }
      } catch (error) {
        console.error('Error parsing token:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        return;
      }

      // Validar que el token siga siendo válido en el servidor
      try {
        const response = await fetch('/api/auth/validate', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setIsAuthenticated(true);
            console.log('Sesión validada correctamente');
          } else {
            // Token inválido
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setIsAuthenticated(false);
            console.log('Token inválido según servidor');
          }
        } else {
          // Error de validación
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          console.log('Error de validación:', response.status);
        }
      } catch (error) {
        console.error('Error validating session:', error);
        // En caso de error de conexión, permitir trabajar offline temporalmente
        // pero solo si el token no ha expirado
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        
        if (tokenPayload.exp && tokenPayload.exp > currentTime) {
          setIsAuthenticated(true);
          console.log('Trabajando offline con token válido');
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          console.log('Token expirado y sin conexión');
        }
      }
    };

    validateSession();
  }, []);

  // Add a body-level class so we can toggle visual modes (e.g., hide container backgrounds)
  useEffect(() => {
    document.body.classList.add('no-containers');
    return () => document.body.classList.remove('no-containers');
  }, []);

  // Verificación periódica de la sesión
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkSessionPeriodically = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      try {
        // Verificar expiración del token
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        
        // Si el token expira en menos de 5 minutos, alertar al usuario
        if (tokenPayload.exp && (tokenPayload.exp - currentTime) < 300) {
          console.warn('Token expirará pronto');
        }
        
        if (tokenPayload.exp && tokenPayload.exp < currentTime) {
          console.log('Token expirado durante uso, cerrando sesión');
          handleLogout();
          return;
        }
      } catch (error) {
        console.error('Error checking token expiration:', error);
        handleLogout();
      }
    };

    // Verificar cada 5 minutos
    const interval = setInterval(checkSessionPeriodically, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Detectar cuando se cierra la ventana/pestaña para limpiar datos sensibles
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Cuando la pestaña se oculta por mucho tiempo, marcar para revalidación
      if (document.hidden) {
        localStorage.setItem('session_hidden_at', Date.now().toString());
      } else {
        const hiddenAt = localStorage.getItem('session_hidden_at');
        if (hiddenAt) {
          const hiddenTime = Date.now() - parseInt(hiddenAt);
          // Si estuvo oculta por más de 30 minutos, revalidar sesión
          if (hiddenTime > 30 * 60 * 1000) {
            window.location.reload();
          }
          localStorage.removeItem('session_hidden_at');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    // Limpiar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Actualizar estado de autenticación
    setIsAuthenticated(false);
    
    // Forzar navegación inmediata
    window.location.replace('/');
  };

  const handleAnimationComplete = () => {
    console.log('Animation completed!');
  };

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen" >
          <Routes>
          {/* Ruta pública - Landing Page */}
          <Route 
            path="/" 
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <LandingPage />
              )
            } 
          />
          
          {/* Ruta de Login */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <LoginPage onLoginSuccess={handleLoginSuccess} />
              )
            } 
          />

          {/* Ruta de Forgot Password */}
          <Route 
            path="/forgot-password" 
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <ForgotPassword />
              )
            } 
          />

          {/* Ruta de Reset Password */}
          <Route 
            path="/reset-password/:token" 
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <ResetPassword />
              )
            } 
          />
          
          {/* Rutas protegidas - Dashboard */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardLayout onLogout={handleLogout}>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          
          {/* Ruta de Empleados */}
          <Route 
            path="/empleados" 
            element={
              <ProtectedRoute>
                <DashboardLayout onLogout={handleLogout}>
                  <Empleados />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          
          {/* Ruta de Ubicaciones */}
          <Route 
            path="/ubicaciones" 
            element={
              <ProtectedRoute>
                <DashboardLayout onLogout={handleLogout}>
                  <Ubicaciones />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          {/* Ruta de Áreas */}
          <Route 
            path="/areas" 
            element={
              <ProtectedRoute>
                <DashboardLayout onLogout={handleLogout}>
                  <Areas />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          {/* Ruta de Proveedores */}
          <Route 
            path="/proveedores" 
            element={
              <ProtectedRoute>
                <DashboardLayout onLogout={handleLogout}>
                  <Proveedores />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          
          {/* Ruta de Usuarios - Solo para Administradores */}
          <Route 
            path="/usuarios" 
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <DashboardLayout onLogout={handleLogout}>
                    <Usuarios />
                  </DashboardLayout>
                </AdminRoute>
              </ProtectedRoute>
            } 
          />

          {/* Ruta de Dotaciones */}
          <Route 
            path="/dotaciones" 
            element={
              <ProtectedRoute>
                <DashboardLayout onLogout={handleLogout}>
                  <Dotaciones />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          
          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

// Componente separado para la Landing Page
function LandingPage() {
  return (
    <>
      {/* Header Principal */}
      <header className="shadow-lg border-b" style={{backgroundColor: '#B39237', borderBottomColor: '#B39237'}}>
        <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-24">
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <img src="/logo.png" alt="Logo Arroz Sonora" className="w-25 h-16" />
              </div>
              
              {/* Línea separadora */}
              <div className="w-px h-12 bg-primary-300"></div>
              
              <div>
                <h1 className="text-3xl font-bold text-white">
                  SIRDS
                </h1>
                <p className="text-sm text-primary-100 font-medium">
                  Sistema Integrado para el Registro de Dotación Sonora
                </p>
              </div>
            </div>
            
            {/* Botón de Login */}
            <a
              href="/login"
              className="always-white bg-white border-2 border-primary-500 text-primary-500 hover:bg-primary-50 hover:border-primary-400 hover:text-primary-400 px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-2"
            >
              <i className="bx bx-log-in text-xl"></i>
              <span>Iniciar Sesión</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section (mejorado: título centrado a lo largo de toda la pantalla) */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-primary-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          
          {/* Contenido centrado a lo largo de toda la pantalla */}
          <div className="text-center">
            <Suspense fallback={
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-gray-900 leading-tight mb-8">
                <span className="block">Sistema</span>
                <span className="block">Integrado para</span>
                <span className="block">el Registro de</span>
                <span className="block text-[#B39237]">Dotación Sonora</span>
              </h1>
            }>
              <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-gray-900 leading-tight mb-8">
                <div className="w-full hero-title font-boris">
                  <LazyBlurText text="Sistema" delay={250} animateBy="words" direction="top" className="text-center" />
                </div>
                <div className="w-full hero-title font-boris">
                  <LazyBlurText text="Integrado para" delay={250} animateBy="words" direction="top" className="text-center" />
                </div>
                <div className="w-full hero-title font-boris">
                  <LazyBlurText text="el Registro de" delay={250} animateBy="words" direction="top" className="text-center" />
                </div>
                <div className="w-full text-[#B39237] hero-title font-boris">
                  <LazyBlurText text="Dotación Sonora" delay={250} animateBy="words" direction="top" className="text-center" />
                </div>
              </div>
            </Suspense>

            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-4xl mx-auto">
              SIRDS es la plataforma profesional diseñada para gestionar de manera eficiente y controlada todas las dotaciones de uniformes, equipos de protección personal y herramientas en Molino Sonora.
            </p>
          </div>

        </div>
      </section>
      
      
      <section className="relative overflow-hidden">
  <div className="absolute inset-0 bg-primary-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              ¿Qué es SIRDS?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              SIRDS (Sistema Integrado para el Registro de Dotación Sonora) es una plataforma digital desarrollada específicamente para Molino Sonora que centraliza y automatiza la gestión completa de dotaciones de personal. Desde el control de inventarios hasta el seguimiento de entregas, SIRDS simplifica cada aspecto del proceso de dotación.
            </p>
          </div>
        </div>
      </section>

      {/* cards */}
      <section className="relative">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="group bg-transparent rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-shadow duration-200 hover:border-[#D4AF37]">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#FDF4E6] group-hover:bg-[#FFD36B] transition-colors duration-200">
                  <i className="bx bx-time text-xl text-[#D4AF37] group-hover:text-white transition-colors duration-200"></i>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fácil de Usar</h3>
              <p className="text-sm text-gray-600">Interfaz intuitiva que no requiere capacitación extensa. Comienza a trabajar desde el primer día.</p>
            </div>

            {/* Card 2 */}
            <div className="group bg-transparent rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-shadow duration-200 hover:border-[#D4AF37]">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#FDF4E6] group-hover:bg-[#FFD36B] transition-colors duration-200">
                  <i className="bx bx-check text-xl text-[#D4AF37] group-hover:text-white transition-colors duration-200"></i>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Control Total</h3>
              <p className="text-sm text-gray-600">Mantén el control absoluto de todas las dotaciones con visibilidad completa del inventario.</p>
            </div>

            {/* Card 3 */}
            <div className="group bg-transparent rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-shadow duration-200 hover:border-[#D4AF37]">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#FDF4E6] group-hover:bg-[#FFD36B] transition-colors duration-200">
                  <i className="bx bx-bell text-xl text-[#D4AF37] group-hover:text-white transition-colors duration-200"></i>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Alertas Automáticas</h3>
              <p className="text-sm text-gray-600">Recibe notificaciones cuando el inventario esté bajo o cuando se requiera renovación de equipos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección Control Digital Completo */}
      <section className="relative overflow-hidden bg-white py-20">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Columna izquierda - Imagen del inventario */}
            <div className="relative order-2 lg:order-1">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="/inventario.avif" 
                  alt="Sistema de gestión de inventario SIRDS" 
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>

            {/* Columna derecha - Contenido de texto */}
            <div className="text-center lg:text-left order-1 lg:order-2">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Control Digital Completo
              </h2>
              
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8 max-w-2xl mx-auto lg:mx-0">
                Desde el control de inventarios hasta el seguimiento de entregas, SIRDS simplifica cada aspecto del proceso de dotación con una interfaz moderna e intuitiva.
              </p>

              {/* Lista de características */}
              <div className="space-y-4 text-left max-w-2xl mx-auto lg:mx-0">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-[#B39237] rounded-full flex items-center justify-center">
                    <i className="bx bx-check text-sm text-white"></i>
                  </div>
                  <span className="text-gray-700 text-base">Digitalización completa de procesos manuales</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-[#B39237] rounded-full flex items-center justify-center">
                    <i className="bx bx-check text-sm text-white"></i>
                  </div>
                  <span className="text-gray-700 text-base">Reducción de errores y tiempos de gestión</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-[#B39237] rounded-full flex items-center justify-center">
                    <i className="bx bx-check text-sm text-white"></i>
                  </div>
                  <span className="text-gray-700 text-base">Trazabilidad total de todas las operaciones</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <section className="relative overflow-hidden">
  <div className="absolute inset-0 bg-primary-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Lo que Ofrecemos
            </h2>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Herramientas completas para una gestión profesional de dotaciones
            </p>
          </div>

          {/* Tarjetas: 2 filas de 3 columnas con nuevo contenido */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Row 1 - Card 1: Registro Rápido */}
            <div className="group bg-transparent rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-shadow duration-200 hover:border-[#D4AF37]">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#FDF4E6] group-hover:bg-[#FFD36B] transition-colors duration-200">
                  <i className="bx bx-time-five text-xl text-[#D4AF37] group-hover:text-white transition-colors duration-200"></i>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Registro Rápido</h3>
              <p className="text-sm text-gray-600">Registra entregas y devoluciones en segundos con formularios simplificados.</p>
            </div>

            {/* Row 1 - Card 2: Acceso Desde Cualquier Lugar */}
            <div className="group bg-transparent rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-shadow duration-200 hover:border-[#D4AF37]">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#FDF4E6] group-hover:bg-[#FFD36B] transition-colors duration-200">
                  <i className="bx bx-world text-xl text-[#D4AF37] group-hover:text-white transition-colors duration-200"></i>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Acceso Desde Cualquier Lugar</h3>
              <p className="text-sm text-gray-600">Accede al sistema desde cualquier dispositivo con conexión a internet.</p>
            </div>

            {/* Row 1 - Card 3: Búsqueda Inteligente */}
            <div className="group bg-transparent rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-shadow duration-200 hover:border-[#D4AF37]">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#FDF4E6] group-hover:bg-[#FFD36B] transition-colors duration-200">
                  <i className="bx bx-search text-xl text-[#D4AF37] group-hover:text-white transition-colors duration-200"></i>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Búsqueda Inteligente</h3>
              <p className="text-sm text-gray-600">Encuentra cualquier registro o empleado al instante con búsqueda avanzada.</p>
            </div>

            {/* Row 2 - Card 4: Seguridad Garantizada */}
            <div className="group bg-transparent rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-shadow duration-200 hover:border-[#D4AF37]">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#FDF4E6] group-hover:bg-[#FFD36B] transition-colors duration-200">
                  <i className="bx bx-lock-alt text-xl text-[#D4AF37] group-hover:text-white transition-colors duration-200"></i>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Seguridad Garantizada</h3>
              <p className="text-sm text-gray-600">Tus datos están protegidos con los más altos estándares de seguridad.</p>
            </div>

            {/* Row 2 - Card 5: Reportes Automáticos */}
            <div className="group bg-transparent rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-shadow duration-200 hover:border-[#D4AF37]">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#FDF4E6] group-hover:bg-[#FFD36B] transition-colors duration-200">
                  <i className="bx bx-file text-xl text-[#D4AF37] group-hover:text-white transition-colors duration-200"></i>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Reportes Automáticos</h3>
              <p className="text-sm text-gray-600">Genera reportes detallados con un solo clic, sin complicaciones.</p>
            </div>

            {/* Row 2 - Card 6: Soporte Continuo */}
            <div className="group bg-transparent rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-shadow duration-200 hover:border-[#D4AF37]">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#FDF4E6] group-hover:bg-[#FFD36B] transition-colors duration-200">
                  <i className="bx bx-support text-xl text-[#D4AF37] group-hover:text-white transition-colors duration-200"></i>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Soporte Continuo</h3>
              <p className="text-sm text-gray-600">Equipo de soporte disponible para ayudarte cuando lo necesites.</p>
            </div>
          </div>
        </div>
      </section>

      {/* New section: Control Fácil y Eficiente (sigue a 'Lo que Ofrecemos') */}
  <section className="relative">
  <div className="relative max-w-7xl mx-auto px-8 sm:px-10 lg:px-20 xl:px-32 py-16">
          <div className="text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Control Fácil y Eficiente</h2>
            <p className="text-base md:text-lg text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              SIRDS está diseñado pensando en la simplicidad y eficiencia. Con una interfaz intuitiva y procesos
              automatizados, gestionar las dotaciones nunca había sido tan sencillo.
            </p>
          </div>
        </div>
      </section>

      {/* Sección Gestión Simplificada */}
      <section className="relative overflow-hidden bg-white py-20">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Columna izquierda - Contenido de texto */}
            <div className="text-center lg:text-left order-2 lg:order-1">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-8 leading-tight">
                Gestión Simplificada
              </h2>

              {/* Lista de características */}
              <div className="space-y-6 text-left max-w-2xl mx-auto lg:mx-0">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-6 h-6 bg-[#B39237] rounded-full flex items-center justify-center mt-1">
                    <i className="bx bx-check text-sm text-white"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Registro Rápido</h3>
                    <p className="text-gray-600">Registra entregas y devoluciones en segundos con formularios simplificados.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-6 h-6 bg-[#B39237] rounded-full flex items-center justify-center mt-1">
                    <i className="bx bx-check text-sm text-white"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Búsqueda Inteligente</h3>
                    <p className="text-gray-600">Encuentra cualquier registro o empleado al instante con búsqueda avanzada.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-6 h-6 bg-[#B39237] rounded-full flex items-center justify-center mt-1">
                    <i className="bx bx-check text-sm text-white"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Reportes Automáticos</h3>
                    <p className="text-gray-600">Genera reportes detallados con un solo clic, sin complicaciones.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna derecha - Imagen */}
            <div className="relative order-1 lg:order-2">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl max-w-md mx-auto">
                <img 
                  src="/dota.png" 
                  alt="Gestión simplificada de dotaciones SIRDS" 
                  className="w-full h-auto object-cover max-h-96"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Sección Acceso y Seguridad */}
      <section className="relative overflow-hidden py-20" style={{backgroundColor: '#F5F2E8'}}>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Columna izquierda - Imagen */}
            <div className="relative order-2 lg:order-1">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl max-w-md mx-auto">
                <img 
                  src="/sistema.png" 
                  alt="Acceso y seguridad del sistema SIRDS" 
                  className="w-full h-auto object-cover max-h-96"
                />
              </div>
            </div>

            {/* Columna derecha - Contenido de texto */}
            <div className="text-center lg:text-left order-1 lg:order-2">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-8 leading-tight">
                Acceso y Seguridad
              </h2>

              {/* Lista de características */}
              <div className="space-y-6 text-left max-w-2xl mx-auto lg:mx-0">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-6 h-6 bg-[#B39237] rounded-full flex items-center justify-center mt-1">
                    <i className="bx bx-check text-xs text-white"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Acceso Desde Cualquier Lugar</h3>
                    <p className="text-gray-600">Accede al sistema desde cualquier dispositivo con conexión a internet.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-6 h-6 bg-[#B39237] rounded-full flex items-center justify-center mt-1">
                    <i className="bx bx-check text-xs text-white"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Seguridad Garantizada</h3>
                    <p className="text-gray-600">Tus datos están protegidos con los más altos estándares de seguridad.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-6 h-6 bg-[#B39237] rounded-full flex items-center justify-center mt-1">
                    <i className="bx bx-check text-xs text-white"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Soporte Continuo</h3>
                    <p className="text-gray-600">Equipo de soporte disponible para ayudarte cuando lo necesites.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Sección: Optimiza la Gestión de Dotaciones (antes del footer) */}
      <section className="bg-[#B39237] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="flex flex-col items-center">
            <div className="mb-6">
              {/* Icono de trigo */}
              <i className="bx bx-leaf text-4xl text-white"></i>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4">Optimiza la Gestión de<br className="hidden sm:inline"/>Dotaciones en Molino Sonora</h2>

            <p className="max-w-2xl text-base md:text-lg mb-8 text-white/90">
              Únete al sistema que está transformando la manera de gestionar dotaciones en la industria.
            </p>

            <a
              href="/login"
              className="always-white inline-flex items-center gap-3 bg-white border-2 border-primary-500 text-primary-500 hover:bg-primary-50 hover:border-primary-400 hover:text-primary-400 px-6 py-3 rounded-full font-medium shadow-xl hover:shadow-2xl transition-shadow duration-200"
            >
              Acceder al Sistema
              <i className="bx bx-right-arrow-alt text-lg"></i>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
            
            {/* Sección Principal - Logo y Descripción */}
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-3 mb-4">
                <img src="/logo.png" alt="SIRDS" className="w-12 h-8" />
                <div>
                  <h3 className="text-xl font-bold text-white">SIRDS</h3>
                  <p className="text-sm text-slate-300 font-medium">Molino Sonora</p>
                </div>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                Sistema Integrado para el Registro de Dotación. Transformando la gestión de recursos humanos con tecnología de vanguardia.
              </p>
              
              {/* Redes sociales */}
              <div className="flex space-x-3">
                <a href="#" className="w-8 h-8 bg-slate-700 hover:bg-[#1877f2] rounded-lg flex items-center justify-center transition-colors duration-200">
                  <i className="bxl bxl-facebook text-lg"></i>
                </a>
                <a href="#" className="w-8 h-8 bg-slate-700 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 rounded-lg flex items-center justify-center transition-all duration-200">
                  <i className="bxl bxl-pinterest text-lg"></i>
                </a>
                <a href="#" className="w-8 h-8 bg-slate-700 hover:bg-[#1da1f2] rounded-lg flex items-center justify-center transition-colors duration-200">
                  <i className="bxl bxl-twitter text-lg"></i>
                </a>
                <a href="#" className="w-8 h-8 bg-slate-700 hover:bg-[#0077b5] rounded-lg flex items-center justify-center transition-colors duration-200">
                  <i className="bxl bxl-linkedin text-lg"></i>
                </a>
                <a href="#" className="w-8 h-8 bg-slate-700 hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-red-500 hover:to-purple-500 rounded-lg flex items-center justify-center transition-all duration-200">
                  <i className="bxl bxl-instagram text-lg"></i>
                </a>
              </div>
            </div>

            {/* Acceso Rápido */}
            <div>
              <h4 className="text-[#D4AF37] font-semibold text-sm uppercase tracking-wider mb-4">Acceso Rápido</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-400 hover:text-white text-sm transition-colors duration-200 flex items-center"><span className="text-[#B39237] mr-2">→</span> Iniciar Sesión</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white text-sm transition-colors duration-200 flex items-center"><span className="text-[#B39237] mr-2">→</span> Manual de Usuario</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white text-sm transition-colors duration-200 flex items-center"><span className="text-[#B39237] mr-2">→</span> Preguntas Frecuentes</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white text-sm transition-colors duration-200 flex items-center"><span className="text-[#B39237] mr-2">→</span> Tutoriales</a></li>
              </ul>
            </div>

            {/* Recursos */}
            <div>
              <h4 className="text-[#D4AF37] font-semibold text-sm uppercase tracking-wider mb-4">Recursos</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-400 hover:text-white text-sm transition-colors duration-200 flex items-center"><span className="text-[#B39237] mr-2">→</span> Documentación</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white text-sm transition-colors duration-200 flex items-center"><span className="text-[#B39237] mr-2">→</span> Soporte Técnico</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white text-sm transition-colors duration-200 flex items-center"><span className="text-[#B39237] mr-2">→</span> Actualizaciones</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white text-sm transition-colors duration-200 flex items-center"><span className="text-[#B39237] mr-2">→</span> Reportar Problema</a></li>
              </ul>
            </div>

            {/* Contacto */}
            <div>
              <h4 className="text-[#D4AF37] font-semibold text-sm uppercase tracking-wider mb-4">Contacto</h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-4 h-4 text-[#B39237] mt-0.5">
                    <i className="bx bx-envelope text-lg"></i>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Email</p>
                    <p className="text-white text-sm">soporte@molinosonora.com</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-4 h-4 text-[#B39237] mt-0.5">
                    <i className="bx bx-phone text-lg"></i>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Teléfono</p>
                    <p className="text-white text-sm">+52 (662) 123-4567</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-4 h-4 text-[#B39237] mt-0.5">
                    <i className="bx bx-map text-lg"></i>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Ubicación</p>
                    <p className="text-white text-sm">Hermosillo, Sonora, México</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer Bottom - Más compacto */}
          <div className="flex flex-col md:flex-row justify-between items-center pt-6 mt-8 border-t border-slate-600">
            <p className="text-slate-400 text-sm mb-3 md:mb-0">
              © 2025 Molino Sonora. Todos los derechos reservados.
            </p>
            <div className="flex space-x-4 text-sm">
              <a href="#" className="text-slate-400 hover:text-white transition-colors duration-200">Términos de Uso</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors duration-200">Política de Privacidad</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors duration-200">Cookies</a>
            </div>
          </div>
        </div>
      </footer>


    </>
  );
}

export default App;
