"use client";

import { formatCents, type Cents } from "@/lib/money";
import { Icon } from "@/components/Icon/Icon";
import Link from "next/link";
import styles from "./QuickAdd.module.css";

export type QuickTemplate = {
  id: string;
  label: string;
  icon: string;
  amountCents: Cents;
  type: "income" | "expense";
  categoryId: string;
};

type Props = {
  templates: QuickTemplate[];
  currency?: string;
  onAdd: (t: QuickTemplate) => void;
};

/**
 * One-tap quick-add chips. Each chip logs a saved template instantly
 * (e.g. "Salary +$4,000", "Rent −$800") and updates the balance.
 */
export function QuickAdd({ templates, currency = "QAR", onAdd }: Props) {
  return (
    <section className={styles.wrap} aria-labelledby="qa-head">
      <div className={styles.head}>
        <span className="eyebrow" id="qa-head">
          Quick add
        </span>
        <Link href="/templates" className={styles.editLink}>
          Edit →
        </Link>
      </div>

      <div className={styles.grid}>
        {templates.map((t) => (
          <button
            key={t.id}
            className={styles.chip}
            onClick={() => {
              // Trigger simple haptic vibration on mobile if supported
              if (typeof navigator !== "undefined" && navigator.vibrate) {
                navigator.vibrate(10);
              }
              onAdd(t);
            }}
            aria-label={`Add ${t.label}, ${t.type} ${formatCents(t.amountCents, currency)}`}
          >
            <span className={styles.icon} aria-hidden="true">
              <Icon name={t.icon as any} size={16} />
            </span>
            <div className={styles.meta}>
              <span className={styles.chipLabel}>{t.label}</span>
              <span className={`${styles.amount} ${t.type === "income" ? styles.income : styles.expense}`}>
                {t.type === "income" ? "+" : "−"}
                {formatCents(t.amountCents, currency, { symbol: true })}
              </span>
            </div>
          </button>
        ))}

        <Link href="/templates" className={`${styles.chip} ${styles.add}`} aria-label="Create a quick-add template">
          + New
        </Link>
      </div>
    </section>
  );
}
