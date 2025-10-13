import React from 'react';

export default function NavPrivada({ onLogout }) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <button className="md:hidden text-gray-600">☰</button>
        <h2 className="text-lg font-semibold">Dashboard</h2>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-600">Usuario</div>
        <button onClick={onLogout} className="text-sm text-red-500">Cerrar sesión</button>
      </div>
    </header>
  );
}
