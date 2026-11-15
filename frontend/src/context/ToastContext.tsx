import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  addToast: (type: ToastType, title: string, message?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full font-sans">
        {toasts.map((toast) => {
          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-start space-x-3 p-4 rounded-2xl glass-card shadow-2xl transition-all animate-in slide-in-from-bottom-3 border border-white/15"
            >
              {/* Golden Yellow Accent Dot */}
              <div className="w-6 h-6 rounded-full bg-[#FFC900] text-[#08090B] flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5 shadow-md shadow-[#FFC900]/25">
                {toast.type === 'error' ? '!' : '✓'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold font-display text-[#F5F3EF] tracking-tight">{toast.title}</p>
                {toast.message && <p className="text-xs text-[#F5F3EF]/70 mt-0.5 font-sans leading-relaxed">{toast.message}</p>}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="w-5 h-5 rounded-full flex items-center justify-center text-[#F5F3EF]/40 hover:text-[#F5F3EF] hover:bg-white/10 transition-colors"
              >
                ✕
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
