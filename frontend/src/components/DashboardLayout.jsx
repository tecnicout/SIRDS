import React, { useState } from 'react';
import Sidebar from './Sidebar';
import NavPrivada from './NavPrivada';

export default function DashboardLayout({ children, onLogout }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Iniciar cerrado

  const handleSidebarMouseEnter = () => {
    setSidebarCollapsed(false);
  };

  const handleSidebarMouseLeave = () => {
    setSidebarCollapsed(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavPrivada onLogout={onLogout} />
      <div className="pt-24 flex">
        <Sidebar 
          collapsed={sidebarCollapsed}
          onMouseEnter={handleSidebarMouseEnter}
          onMouseLeave={handleSidebarMouseLeave}
          onLogout={onLogout}
        />
        <main className={`flex-1 p-6 transition-all duration-500 ease-in-out ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}>
          {children}
        </main>
      </div>
    </div>
  );
}
