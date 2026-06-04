"use client";

import { useState, useEffect, useCallback, createContext, useContext, useRef } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────
type ToastType = "success" | "error" | "info" | "warning";
interface Toast { id: number; type: ToastType; title: string; message?: string; }
interface ToastContextValue { showToast: (type: ToastType, title: string, message?: string) => void; }

// ─── Context ─────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });
export const useToast = () => useContext(ToastContext);

// ─── Icons ───────────────────────────────────────────────────────────────────
const icons: Record<ToastType, string> = {
  success: "check_circle",
  error:   "error",
  info:    "notifications",
  warning: "warning",
};
const colors: Record<ToastType, string> = {
  success: "bg-[#1a3a1a] border-green-500/40 text-green-100",
  error:   "bg-[#3a1a1a] border-red-500/40 text-red-100",
  info:    "bg-[#1a2a3a] border-blue-500/40 text-blue-100",
  warning: "bg-[#3a2a1a] border-yellow-500/40 text-yellow-100",
};
const iconColors: Record<ToastType, string> = {
  success: "text-green-400",
  error:   "text-red-400",
  info:    "text-blue-400",
  warning: "text-yellow-400",
};

// ─── Provider ────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = ++counterRef.current;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container — fixed top-right on desktop, top-center on mobile */}
      <div className="fixed top-20 right-4 md:right-6 z-[9999] flex flex-col gap-3 max-w-sm w-[calc(100vw-2rem)] md:w-96 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-md pointer-events-auto
              animate-in slide-in-from-right-4 fade-in duration-300 ${colors[toast.type]}`}
          >
            <span className={`material-symbols-outlined text-xl flex-shrink-0 mt-0.5 ${iconColors[toast.type]}`}
              style={{ fontVariationSettings: "'FILL' 1" }}>
              {icons[toast.type]}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-tight">{toast.title}</p>
              {toast.message && <p className="text-xs opacity-80 mt-0.5 leading-snug">{toast.message}</p>}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
