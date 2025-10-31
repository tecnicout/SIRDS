import React, { useState, useCallback, useMemo } from 'react';
import Sidebar from './Sidebar';
import NavPrivada from './NavPrivada';

// Estado global del sidebar para evitar parpadeo entre navegaciones
let globalSidebarState = true;

export default function DashboardLayout({ children, onLogout }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(globalSidebarState);

  const handleSidebarMouseEnter = useCallback(() => {
    setSidebarCollapsed(false);
    globalSidebarState = false;
  }, []);

  const handleSidebarMouseLeave = useCallback(() => {
    setSidebarCollapsed(true);
    globalSidebarState = true;
  }, []);

  const sidebarProps = useMemo(() => ({
    collapsed: sidebarCollapsed,
    onMouseEnter: handleSidebarMouseEnter,
    onMouseLeave: handleSidebarMouseLeave,
    onLogout
  }), [sidebarCollapsed, handleSidebarMouseEnter, handleSidebarMouseLeave, onLogout]);

  const mainClassName = useMemo(() => 
    `flex-1 p-6 transition-all duration-500 ease-in-out ${
      sidebarCollapsed ? 'ml-16' : 'ml-64'
    }`, [sidebarCollapsed]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <NavPrivada onLogout={onLogout} />
      <div className="pt-24 flex">
        <Sidebar {...sidebarProps} />
        <main className={mainClassName}>
          {children}
        </main>
      </div>
    </div>
  );
}
