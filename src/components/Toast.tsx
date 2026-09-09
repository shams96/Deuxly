"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

type Toast = {
  id: string;
  message: string;
  type: "success" | "error" | "info";
};

type ToastContextValue = {
  toasts: Toast[];
  addToast: (message: string, type?: Toast["type"]) => void;
  removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    (message: string, type: Toast["type"] = "info") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      const timer = window.setTimeout(() => removeToast(id), 4000);
      timersRef.current.set(id, timer);
      return id;
    },
    [removeToast]
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-xl shadow-lg border text-sm font-medium animate-in slide-in-from-bottom-2 ${
              toast.type === "success"
                ? "bg-[#8A9A7B]/10 border-[#8A9A7B]/30 text-[#8A9A7B]"
                : toast.type === "error"
                  ? "bg-[#B87A7A]/10 border-[#B87A7A]/30 text-[#B87A7A]"
                  : "bg-white border-[#E8E2DA] text-[#1C1C1C]"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span>{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-current opacity-60 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
