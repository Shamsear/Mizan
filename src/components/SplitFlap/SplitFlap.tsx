"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./SplitFlap.module.css";

type SplitFlapProps = {
  /** The full string to display, e.g. "$1,240" or "1240". */
  value: string;
  /** Font size for the digits. Any CSS length; defaults to the hero step. */
  size?: string;
  /** Accessible label announced to screen readers (the plain value). */
  label?: string;
  className?: string;
};

/** Characters we treat as "flippable" digits; everything else renders static. */
const isFlippable = (ch: string) => /[0-9]/.test(ch);

/**
 * A single cell. When its `char` changes, it plays one flap animation.
 * We re-key the flipper on each change so the CSS animation restarts.
 */
function Cell({ char }: { char: string }) {
  const prev = useRef(char);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (prev.current !== char) {
      prev.current = char;
      setAnimKey((k) => k + 1);
    }
  }, [char]);

  if (!isFlippable(char)) {
    return (
      <span className={`${styles.cell} ${styles.static}`} aria-hidden="true">
        <span className={styles.char}>{char}</span>
      </span>
    );
  }

  return (
    <span className={styles.cell} aria-hidden="true">
      <span key={animKey} className={styles.flipper}>
        <span className={styles.char}>{char}</span>
      </span>
    </span>
  );
}

/**
 * Split-flap departures-board display — the app's signature element.
 * Digits physically flip when the value changes (e.g. after a quick-add tap).
 * Respects prefers-reduced-motion (flip collapses to an instant swap).
 */
export function SplitFlap({ value, size, label, className }: SplitFlapProps) {
  const chars = value.split("");
  return (
    <span
      className={`${styles.board} tnum ${className ?? ""}`}
      style={size ? { fontSize: size } : undefined}
      role="img"
      aria-label={label ?? value}
    >
      {chars.map((ch, i) => (
        <Cell key={`${i}-${ch}`} char={ch} />
      ))}
    </span>
  );
}
