"use client";

import styles from "./FAB.module.css";

type FABProps = {
  onClick: () => void;
  icon?: string;
  label?: string;
};

/**
 * Floating Action Button — primary add action on mobile.
 * Positioned bottom-right, follows Material Design 3 spec.
 */
export function FAB({ onClick, icon = "+", label }: FABProps) {
  return (
    <button
      className={styles.fab}
      onClick={onClick}
      aria-label={label ?? "Add transaction"}
      type="button"
    >
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
    </button>
  );
}
