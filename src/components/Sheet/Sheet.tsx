"use client";

import { type ReactNode, useEffect, useRef } from "react";
import styles from "./Sheet.module.css";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Label for accessibility */
  label?: string;
}

/**
 * Reusable bottom-sheet container.
 * Features: Sibling backdrop design to avoid WebKit blur rendering bugs,
 * centered max-width layouts, and responsive transitions.
 */
export function Sheet({ open, onClose, children, label }: SheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Trap focus and handle Escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    // Prevent body scroll while open
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.wrapper}>
      {/* Sibling backdrop overlay element to prevent child rendering blur bug */}
      <div className={styles.overlay} onClick={onClose} role="presentation" />
      
      <div
        ref={sheetRef}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        {/* Drag handle */}
        <div className={styles.handle} aria-hidden="true" />
        {children}
        
        {/* Curved Speech Bubble Tail SVG */}
        <div className={styles.tailContainer} aria-hidden="true">
          <svg
            className={styles.tailSvg}
            viewBox="0 0 40 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M 30,0 C 28,10 28,20 34,26 C 20,20 12,12 6,0"
              fill="var(--panel)"
              stroke="var(--panel-line)"
              strokeWidth="1"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
