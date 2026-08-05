"use client";

import { SplitFlap } from "@/components/SplitFlap/SplitFlap";
import { boardString, formatCents, type Cents } from "@/lib/money";
import styles from "./SafeToSpendCard.module.css";

type Props = {
  safeToSpend: Cents;
  /** Positive = ahead of pace, negative = behind. */
  paceDelta: Cents;
  currency?: string;
  dateLabel: string;
  online?: boolean;
};

/**
 * The hero. Shows today's safe-to-spend number on the split-flap board,
 * plus whether the user is ahead of or behind their daily pace.
 */
export function SafeToSpendCard({
  safeToSpend,
  paceDelta,
  currency = "QAR",
  dateLabel,
  online = false,
}: Props) {
  const ahead = paceDelta >= 0;
  return (
    <section className={styles.card} aria-labelledby="sts-label">
      <div className={styles.header}>
        <span className={styles.date}>{dateLabel}</span>
        <span className={styles.status}>
          <span className={styles.dot} style={{ background: online ? "var(--ok)" : "var(--ink-faint)" }} />
          {online ? "synced" : "offline"}
        </span>
      </div>

      <span id="sts-label" className={styles.label}>
        Safe to spend today
      </span>

      <div className={styles.flapRow}>
        <SplitFlap
          value={boardString(safeToSpend, currency)}
          size="var(--step-hero)"
          label={`Safe to spend today: ${formatCents(safeToSpend, currency)}`}
        />
      </div>

      <div className={`${styles.hint} ${ahead ? styles.hintAhead : styles.hintBehind}`}>
        {ahead ? "▲" : "▼"}{" "}
        {ahead ? "ahead by" : "behind by"} {formatCents(Math.abs(paceDelta), currency)}
      </div>
    </section>
  );
}
