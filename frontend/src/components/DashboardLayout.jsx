import React from 'react';
import Sidebar from './Sidebar';
import NavPrivada from './NavPrivada';

export default function DashboardLayout({ children, onLogout }) {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <div className="flex-1 min-h-screen flex flex-col">
        <NavPrivada onLogout={onLogout} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
