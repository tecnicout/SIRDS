import React, { useState } from 'react';
import Sidebar from './Sidebar';
import NavPrivada from './NavPrivada';

export default function DashboardLayout({ children, onLogout }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavPrivada onLogout={onLogout} />
      <div className="flex flex-1">
        <Sidebar 
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
          onLogout={onLogout}
        />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
