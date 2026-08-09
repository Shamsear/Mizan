"use client";

import styles from "./FAB.module.css";

type FABProps = {
  onClick: () => void;
  icon?: string;
  label?: string;
  isOpen?: boolean;
};

/**
 * Floating Action Button — primary action button with rotation states.
 * Connects directly to forms, transforms on active state.
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
        {icon}
      </span>
    </button>
  );
}
