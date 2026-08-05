"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Icon } from "@/components/Icon/Icon";
import styles from "./Toast.module.css";

/* ─── Types ──────────────────────────────────────────────────────────────── */
export type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: string;
  variant: ToastVariant;
  message: string;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

/* ─── Context ────────────────────────────────────────────────────────────── */
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

/* ─── Provider ───────────────────────────────────────────────────────────── */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const push = useCallback((variant: ToastVariant, message: string) => {
    const id = `toast-${++counterRef.current}`;
    setToasts((prev) => [...prev, { id, variant, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const value: ToastContextValue = {
    success: (m) => push("success", m),
    error: (m) => push("error", m),
    info: (m) => push("info", m),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.region} role="region" aria-label="Notifications" aria-live="polite">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() =>
            setToasts((prev) => prev.filter((x) => x.id !== t.id))
          } />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ─── Single Toast Item ──────────────────────────────────────────────────── */
const ICON_MAP: Record<ToastVariant, Parameters<typeof Icon>[0]["name"]> = {
  success: "check-circle",
  error: "alert-triangle",
  info: "info",
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  return (
    <div className={`${styles.toast} ${styles[toast.variant]}`} role="alert">
      <span className={styles.icon}>
        <Icon name={ICON_MAP[toast.variant]} size={16} />
      </span>
      <span className={styles.message}>{toast.message}</span>
      <button className={styles.close} onClick={onDismiss} aria-label="Dismiss">
        <Icon name="x" size={14} />
      </button>
      <div className={styles.drain} />
    </div>
  );
}
