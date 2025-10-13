import React from 'react';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-4 border-b">
        <h3 className="text-lg font-bold">SIRDS</h3>
        <p className="text-sm text-gray-500">Panel</p>
      </div>
      <nav className="p-4">
        <ul className="space-y-2">
          <li>
            <a href="#" className="block px-3 py-2 rounded hover:bg-gray-100">Dashboard</a>
          </li>
          <li>
            <a href="#" className="block px-3 py-2 rounded hover:bg-gray-100">Empleados</a>
          </li>
          <li>
            <a href="#" className="block px-3 py-2 rounded hover:bg-gray-100">Dotaciones</a>
          </li>
          <li>
            <a href="#" className="block px-3 py-2 rounded hover:bg-gray-100">Solicitudes</a>
          </li>
          <li>
            <a href="#" className="block px-3 py-2 rounded hover:bg-gray-100">Reportes</a>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
