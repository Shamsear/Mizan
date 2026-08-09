"use client";

import styles from "./FAB.module.css";

type FABProps = {
  onClick: () => void;
  icon?: string;
  label?: string;
  isOpen?: boolean;
};

/**
 * Floating Action Button — renders a mathematically symmetric SVG plus icon 
 * that rotates perfectly centered around its axis when open.
 */
export function FAB({ onClick, icon = "+", label, isOpen = false }: FABProps) {
  return (
    <button
      className={styles.fab}
      onClick={onClick}
      aria-label={label ?? "Add transaction"}
      type="button"
      data-open={isOpen}
    >
      <span className={styles.icon} aria-hidden="true">
        {icon === "+" ? (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ display: "block" }}
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        ) : (
          icon
        )}
      </span>
    </button>
  );
}
