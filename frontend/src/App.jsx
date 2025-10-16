import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import Dashboard from './pages/Dashboard';
import Empleados from './pages/Empleados';
import Ubicaciones from './pages/Ubicaciones';
import Areas from './pages/Areas';
import Usuarios from './pages/Usuarios';
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Componente de Login Modal
function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
            rol_sistema: result.data.usuario.rol_sistema,
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
            rol_sistema: payload.rol_sistema,
            cargo: payload.cargo,
            area: payload.nombre_area
          }));
        }
        
        // Cerrar modal y notificar éxito
        onClose();
        onLoginSuccess();
        
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-screen overflow-y-auto">
        {/* Header del Modal */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                <img src="/logo.png" alt="SIRDS" className="w-20 h-20" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Iniciar Sesión</h2>
                <p className="text-sm text-gray-600">SIRDS - Sistema integrado para el Registro de Dotación Sonora</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Formulario de Login */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Mensaje de error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={loginData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              placeholder="murcia21.gmz@gmail.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={loginData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-primary-500 focus:ring-primary-500" />
              <span className="ml-2 text-sm text-gray-600">Recordarme</span>
            </label>
            <a href="#" className="text-sm text-primary-600 hover:text-primary-500">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        {/* Footer del Modal */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
          <p className="text-center text-sm text-gray-600">
            ¿Necesitas ayuda? Contacta al administrador del sistema
          </p>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // No verificar token automáticamente - siempre empezar en landing page
  // Los usuarios deben hacer login manualmente cada vez

  const openLogin = () => setIsLoginOpen(true);
  const closeLogin = () => setIsLoginOpen(false);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    closeLogin();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Ruta pública - Landing Page */}
          <Route 
            path="/" 
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <LandingPage 
                  openLogin={openLogin} 
                  isLoginOpen={isLoginOpen} 
                  closeLogin={closeLogin}
                  onLoginSuccess={handleLoginSuccess}
                />
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
          
          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

// Componente separado para la Landing Page
function LandingPage({ openLogin, isLoginOpen, closeLogin, onLoginSuccess }) {
  return (
    <>
      {/* Header Principal */}
      <header className="bg-primary-600 shadow-lg border-b border-primary-600">
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
            <button
              onClick={openLogin}
              className="bg-white hover:bg-primary-50 text-black border-2 border-primary-500 hover:border-primary-600 hover:text-primary-600 px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span>Iniciar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-blue-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Sistema Integrado de
              <span className="text-primary-600 block">Gestión de Dotación</span>
            </h2>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Optimiza y controla la distribución de uniformes, equipos de protección y herramientas 
              para los empleados de Arroz Sonora con tecnología moderna y eficiente.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-4 mb-4">
                <div>
                  <img src="/logo.png" alt="SIRDS" className="w-16 h-11" />
                </div>
                <span className="text-xl font-bold">SIRDS - Arroz Sonora</span>
              </div>
              <p className="text-gray-400 leading-relaxed mb-4">
                Sistema Integrado para el Registro de Dotación Sonora. 
                Optimizando la gestión de recursos humanos y materiales desde 2024.
              </p>
              <p className="text-gray-500 text-sm">
                © 2024 Arroz Sonora. Todos los derechos reservados.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Contacto</h4>
              <div className="space-y-2 text-gray-400">
                <p>📧 soporte@arrozsonora.com</p>
                <p>📞 +52 (662) 123-4567</p>
                <p>📍 Hermosillo, Sonora</p>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Enlaces</h4>
              <div className="space-y-2 text-gray-400">
                <a href="#" className="block hover:text-primary-400 transition-colors">Manual de Usuario</a>
                <a href="#" className="block hover:text-primary-400 transition-colors">Soporte Técnico</a>
                <a href="#" className="block hover:text-primary-400 transition-colors">Políticas de Privacidad</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal de Login */}
      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={closeLogin} 
        onLoginSuccess={onLoginSuccess}
      />
    </>
  );
}

export default App;
