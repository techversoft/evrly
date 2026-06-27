'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);

    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const Icon = {
            success: CheckCircle,
            warning: AlertTriangle,
            error: XCircle,
            info: Info
          }[toast.type] || Info;

          const styles = {
            success: 'bg-gradient-to-r from-pink-50/90 to-indigo-50/90 border border-pink-200/60 shadow-lg shadow-pink-500/5 text-slate-850',
            warning: 'bg-amber-50 border border-amber-200 text-amber-950 shadow-md shadow-amber-500/5',
            error: 'bg-rose-50 border border-rose-200 text-rose-950 shadow-md shadow-rose-500/5',
            info: 'bg-indigo-50 border border-indigo-200 text-indigo-950 shadow-md shadow-indigo-500/5'
          }[toast.type] || 'bg-slate-50 border-slate-200 text-slate-950';

          const iconColor = {
            success: 'text-pink-500',
            warning: 'text-amber-500',
            error: 'text-rose-500',
            info: 'text-indigo-500'
          }[toast.type] || 'text-slate-500';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 border rounded-2xl shadow-xl transition-all duration-300 animate-toast-slide-in ${styles}`}
              role="alert"
            >
              <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
              <div className="flex-1 text-xs font-bold leading-relaxed pr-2 text-slate-800">
                {toast.message}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-gray-650 transition-colors p-0.5 rounded-lg hover:bg-black/5 flex-shrink-0 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
