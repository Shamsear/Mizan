"use client";

import { useState, useMemo } from "react";
import { useCategories, useTransactions, useCurrency } from "@/lib/db/hooks";
import { useUser } from "@clerk/nextjs";
import { db } from "@/lib/db/dexie";
import { formatCents } from "@/lib/money";
import { calculateCategoryBudgetPacing } from "@/lib/finance";
import { startOfMonth, endOfMonth } from "date-fns";
import { FAB } from "@/components/FAB/FAB";
import { CategoryBudgetForm } from "@/components/CategoryBudgetForm/CategoryBudgetForm";
import { Icon } from "@/components/Icon/Icon";
import { useToast } from "@/components/Toast/Toast";
import { useConfirm } from "@/components/ConfirmDialog/ConfirmDialog";
import styles from "./page.module.css";

export default function BudgetsPage() {
  const { user } = useUser();
  const categories = useCategories("expense");
  const transactions = useTransactions();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

  const categorySpending = useMemo(() => {
    if (!transactions) return new Map<string, number>();
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());
    const s = new Map<string, number>();
    transactions.forEach((txn) => {
      if (txn.type !== "expense") return;
      if (txn.date < monthStart || txn.date > monthEnd) return;
      s.set(txn.categoryId ?? "", (s.get(txn.categoryId ?? "") ?? 0) + txn.amountCents);
    });
    return s;
  }, [transactions]);

  const sortedCategories = useMemo(() => {
    if (!categories) return [];
    return [...categories].sort((a, b) => {
      if (a.monthlyBudgetCents && !b.monthlyBudgetCents) return -1;
      if (!a.monthlyBudgetCents && b.monthlyBudgetCents) return 1;
      return (categorySpending.get(b.id) ?? 0) - (categorySpending.get(a.id) ?? 0);
    });
  }, [categories, categorySpending]);

  const budgetedCategories = sortedCategories.filter((c) => c.monthlyBudgetCents);
  const unbudgetedCategories = sortedCategories.filter((c) => !c.monthlyBudgetCents);

  // Overall summary
  const totalBudgeted = budgetedCategories.reduce(
    (s, c) => s + (c.monthlyBudgetCents ?? 0),
    0
  );
  const totalSpent = budgetedCategories.reduce(
    (s, c) => s + (categorySpending.get(c.id) ?? 0),
    0
  );

  async function handleRemoveBudget(categoryId: string) {
    if (!user?.id) return;
    const ok = await confirm({
      title: "Remove budget?",
      message: "This category will no longer be tracked.",
      confirmLabel: "Remove",
      dangerous: true,
    });
    if (!ok) return;
    try {
      const now = new Date();
      await db.categories.update(categoryId, {
        monthlyBudgetCents: undefined,
        updatedAt: now,
        dirty: true,
      });
      toast.success("Budget removed");
    } catch {
      toast.error("Failed to remove budget.");
    }
  }

  const currency = useCurrency();

  return (
    <>
      <main className={`app-shell page-enter ${styles.page}`}>
        <header className={styles.header}>
          <h1 className={styles.title}>Budgets</h1>
        </header>

        {/* Overall summary row */}
        {budgetedCategories.length > 0 && (
          <div className={styles.overallRow}>
            <div className={styles.overallMeta}>
              <span className={styles.overallLabel}>Total budgeted</span>
              <span className={styles.overallBudget}>
                {formatCents(totalBudgeted, currency, { symbol: true })}
              </span>
            </div>
            <div className={styles.overallRight}>
              <span className={styles.overallLabel}>Spent this month</span>
              <span
                className={styles.overallSpent}
                style={{ color: totalSpent > totalBudgeted ? "var(--over)" : "var(--ok)" }}
              >
                {formatCents(totalSpent, currency, { symbol: true })}
              </span>
            </div>
            <div className={styles.overallRemaining}>
              <span
                style={{
                  color:
                    totalBudgeted - totalSpent >= 0 ? "var(--ok)" : "var(--over)",
                }}
              >
                {formatCents(Math.abs(totalBudgeted - totalSpent), currency, { symbol: true })}
                {totalBudgeted - totalSpent < 0 ? " over" : " left"}
              </span>
            </div>
          </div>
        )}

        <div className={styles.content}>
          {/* Budgeted */}
          {budgetedCategories.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Budgeted</h2>
              <div className={styles.list}>
                {budgetedCategories.map((category) => {
                  const spentCents = categorySpending.get(category.id) ?? 0;
                  const pacing = calculateCategoryBudgetPacing({
                    monthlyBudgetCents: category.monthlyBudgetCents!,
                    spentCents,
                  });
                  const catIconName = (category.icon ?? "tag") as any;
                  // FIX: paceDelta >= 0 means under budget = positive = good
                  const isUnderBudget = pacing.paceDelta >= 0;

                  return (
                    <div key={category.id} className={styles.card}>
                      <div className={styles.cardHeader}>
                        <span
                          className={styles.cardIcon}
                          style={{ background: (category.color ?? "#888") + "22" }}
                        >
                          <Icon
                            name={catIconName}
                            size={18}
                            color={category.color ?? "var(--ink-mute)"}
                          />
                        </span>
                        <div className={styles.cardMeta}>
                          <h3 className={styles.cardTitle}>{category.name}</h3>
                          <p className={styles.cardSubtitle}>
                            {formatCents(pacing.spentCents, currency, { symbol: true })} of{" "}
                            {formatCents(pacing.monthlyBudgetCents, currency, { symbol: true })}
                          </p>
                        </div>
                        <span
                          className={`${styles.statusBadge} ${
                            pacing.onTrack ? styles.onTrack : styles.over
                          }`}
                        >
                          {pacing.onTrack ? (
                            <><Icon name="check-circle" size={11} /> On pace</>
                          ) : (
                            <><Icon name="alert-triangle" size={11} /> Over pace</>
                          )}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className={styles.progressSection}>
                        <div className={styles.progressTrack}>
                          <div
                            className={`${styles.progressFill} ${!pacing.onTrack ? styles.progressOver : ""}`}
                            style={{ "--pct": `${Math.min(pacing.percentUsed, 100)}%` } as React.CSSProperties}
                          />
                          <div
                            className={styles.paceMarker}
                            style={{ left: `${Math.min(pacing.percentElapsed, 100)}%` }}
                            title={`Expected: ${pacing.percentElapsed}%`}
                          />
                        </div>
                        <div className={styles.progressLegend}>
                          <span className={styles.legendItem}>
                            <span className={styles.legendDot} style={{ background: "var(--electric)" }} />
                            Spent ({pacing.percentUsed}%)
                          </span>
                          <span className={styles.legendItem}>
                            <span className={styles.legendDot} style={{ background: "var(--ink-faint)" }} />
                            Expected ({pacing.percentElapsed}%)
                          </span>
                        </div>
                      </div>

                      {/* Details */}
                      <div className={styles.details}>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Remaining</span>
                          <span
                            className={styles.detailValue}
                            style={{
                              color: pacing.remainingCents < 0 ? "var(--over)" : "var(--ok)",
                            }}
                          >
                            {pacing.remainingCents < 0 ? "−" : ""}
                            {formatCents(Math.abs(pacing.remainingCents), currency, { symbol: true })}
                            {pacing.remainingCents < 0 && " over"}
                          </span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Daily allowance</span>
                          <span className={styles.detailValue}>
                            {formatCents(pacing.dailyAllowance, currency, { symbol: true })}
                          </span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>vs Pace</span>
                          {/* FIX: paceDelta >= 0 means we spent less than expected = good */}
                          <span
                            className={styles.detailValue}
                            style={{ color: isUnderBudget ? "var(--ok)" : "var(--over)" }}
                          >
                            {isUnderBudget ? "−" : "+"}
                            {formatCents(Math.abs(pacing.paceDelta), currency, { symbol: true })}
                          </span>
                        </div>
                      </div>

                      <div className={styles.cardActions}>
                        <button
                          className={styles.editBtn}
                          onClick={() => setEditingCategory(category.id)}
                        >
                          <Icon name="pen" size={14} />
                          Edit
                        </button>
                        <button
                          className={`${styles.editBtn} ${styles.removeBtn}`}
                          onClick={() => handleRemoveBudget(category.id)}
                        >
                          <Icon name="x" size={14} />
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Unbudgeted */}
          {unbudgetedCategories.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>No budget set</h2>
              <div className={styles.simpleList}>
                {unbudgetedCategories.map((category) => {
                  const spentCents = categorySpending.get(category.id) ?? 0;
                  const catIconName = (category.icon ?? "tag") as any;
                  return (
                    <button
                      key={category.id}
                      className={styles.simpleCard}
                      onClick={() => setEditingCategory(category.id)}
                    >
                      <span
                        className={styles.simpleIcon}
                        style={{ background: (category.color ?? "#888") + "22" }}
                      >
                        <Icon
                          name={catIconName}
                          size={16}
                          color={category.color ?? "var(--ink-mute)"}
                        />
                      </span>
                      <div className={styles.simpleMeta}>
                        <span className={styles.simpleName}>{category.name}</span>
                        {spentCents > 0 && (
                          <span className={styles.simpleSpent}>
                            {formatCents(spentCents, currency, { symbol: true })} this month
                          </span>
                        )}
                      </div>
                      <Icon name="plus-circle" size={18} color="var(--electric)" />
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {budgetedCategories.length === 0 && unbudgetedCategories.length === 0 && (
            <div className={styles.empty}>
              <Icon name="wallet" size={40} color="var(--ink-faint)" />
              <p className={styles.emptyText}>No categories yet</p>
              <p className={styles.emptyHint}>Add transactions first, then set budgets</p>
            </div>
          )}
        </div>
      </main>

      <FAB onClick={() => setShowForm(true)} icon="+" label="Set budget" />

      {showForm && (
        <CategoryBudgetForm
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); toast.success("Budget set"); }}
        />
      )}

      {editingCategory && (
        <CategoryBudgetForm
          categoryId={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSuccess={() => { setEditingCategory(null); toast.success("Budget updated"); }}
        />
      )}
    </>
  );
}
