"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Sheet } from "@/components/Sheet/Sheet";
import { Icon } from "@/components/Icon/Icon";
import styles from "./ConfirmDialog.module.css";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  dangerous?: boolean;
}

interface PromptOptions {
  title: string;
  label?: string;
  placeholder?: string;
  confirmLabel?: string;
  currencySymbol?: string;
}

interface DialogState {
  type: "confirm" | "prompt";
  options: ConfirmOptions | PromptOptions;
  resolve: (value: boolean | number | null) => void;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  promptAmount: (options: PromptOptions) => Promise<number | null>;
}

/* ─── Context ────────────────────────────────────────────────────────────── */
const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within a ConfirmProvider");
  return ctx;
}

/* ─── Provider ───────────────────────────────────────────────────────────── */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [inputValue, setInputValue] = useState("");

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog({ type: "confirm", options, resolve: resolve as (v: boolean | number | null) => void });
    });
  }, []);

  const promptAmount = useCallback((options: PromptOptions): Promise<number | null> => {
    setInputValue("");
    return new Promise((resolve) => {
      setDialog({ type: "prompt", options, resolve: resolve as (v: boolean | number | null) => void });
    });
  }, []);

  const handleConfirm = () => {
    if (!dialog) return;
    if (dialog.type === "prompt") {
      const val = parseFloat(inputValue.replace(/,/g, ""));
      dialog.resolve(isNaN(val) || val <= 0 ? null : Math.round(val * 100));
    } else {
      dialog.resolve(true);
    }
    setDialog(null);
  };

  const handleCancel = () => {
    if (!dialog) return;
    dialog.resolve(dialog.type === "confirm" ? false : null);
    setDialog(null);
  };

  const isConfirm = dialog?.type === "confirm";
  const opts = dialog?.options as (ConfirmOptions & PromptOptions) | undefined;
  const isDangerous = isConfirm && (dialog?.options as ConfirmOptions).dangerous;
  const promptOpts = !isConfirm ? (dialog?.options as PromptOptions) : undefined;

  return (
    <ConfirmContext.Provider value={{ confirm, promptAmount }}>
      {children}
      <Sheet open={!!dialog} onClose={handleCancel} label={opts?.title}>
        <div className={styles.inner}>
          {isDangerous && (
            <span className={styles.dangerIcon}>
              <Icon name="alert-triangle" size={28} color="var(--over)" />
            </span>
          )}
          <h2 className={styles.title}>{opts?.title}</h2>
          {isConfirm && opts?.message && (
            <p className={styles.message}>{opts.message}</p>
          )}
          {!isConfirm && (
            <div className={styles.inputWrap}>
              {promptOpts?.currencySymbol && (
                <span className={styles.currencyPrefix}>{promptOpts.currencySymbol}</span>
              )}
              <input
                type="number"
                inputMode="decimal"
                className={styles.input}
                placeholder={promptOpts?.placeholder ?? "0.00"}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleConfirm();
                  if (e.key === "Escape") handleCancel();
                }}
              />
            </div>
          )}
          <div className={styles.actions}>
            <button className={styles.cancelBtn} onClick={handleCancel}>
              {opts?.cancelLabel ?? "Cancel"}
            </button>
            <button
              className={`${styles.confirmBtn} ${isDangerous ? styles.dangerous : ""}`}
              onClick={handleConfirm}
              disabled={!isConfirm && (inputValue.trim() === "" || parseFloat(inputValue) <= 0)}
            >
              {opts?.confirmLabel ?? (isConfirm ? "Confirm" : "Add")}
            </button>
          </div>
        </div>
      </Sheet>
    </ConfirmContext.Provider>
  );
}
