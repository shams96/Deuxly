"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

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
      <div
        className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2"
        role="status"
        aria-live="polite"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              className={`rounded-xl border p-4 text-sm font-medium shadow-lg ${
                toast.type === "success"
                  ? "border-success/30 bg-success/10 text-success-ink"
                  : toast.type === "error"
                    ? "border-danger/30 bg-danger/10 text-danger-ink"
                    : "border-line bg-surface text-ink"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span>{toast.message}</span>
                <button
                  onClick={() => removeToast(toast.id)}
                  aria-label="Dismiss"
                  className="shrink-0 opacity-60 hover:opacity-100"
                >
                  <X size={16} aria-hidden />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
