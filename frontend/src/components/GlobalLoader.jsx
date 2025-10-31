import React, { createContext, useContext, useState } from 'react';

const GlobalLoaderContext = createContext(null);

export function GlobalLoaderProvider({ children }) {
  const [isLoading, setIsLoading] = useState(false);

  const showLoader = () => setIsLoading(true);
  const hideLoader = () => setIsLoading(false);

  return (
    <GlobalLoaderContext.Provider value={{ isLoading, showLoader, hideLoader }}>
      {children}
    </GlobalLoaderContext.Provider>
  );
}

export function useGlobalLoader() {
  const ctx = useContext(GlobalLoaderContext);
  if (!ctx) throw new Error('useGlobalLoader must be used within GlobalLoaderProvider');
  return ctx;
}

// Full-screen overlay loader
export function GlobalLoader() {
  const ctx = useContext(GlobalLoaderContext);
  if (!ctx) return null;
  const { isLoading } = ctx;
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full border-4 border-gray-200 border-t-[#B39237] animate-spin"></div>
        <div className="text-white font-medium">Cargando...</div>
      </div>
    </div>
  );
}

// Small inline spinner for buttons
export function SmallSpinner({ className = '' }) {
  return (
    <span className={`inline-block align-middle ${className}`} aria-hidden>
      <span className="inline-block w-5 h-5 rounded-full border-2 border-gray-200 border-t-[#B39237] animate-spin" />
    </span>
  );
}

export default GlobalLoader;
