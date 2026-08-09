"use client";

import { useState, useMemo } from "react";
import { useCategories, useTransactions, useCurrency } from "@/lib/db/hooks";
import { useUser } from "@clerk/nextjs";
import { db } from "@/lib/db/dexie";
import { formatCents } from "@/lib/money";
import { calculateCategoryBudgetPacing } from "@/lib/finance";
import { useSafeToSpend } from "@/lib/finance/useSafeToSpend";
import { startOfMonth, endOfMonth } from "date-fns";
import { FAB } from "@/components/FAB/FAB";
import { CategoryBudgetForm } from "@/components/CategoryBudgetForm/CategoryBudgetForm";
import { Sheet } from "@/components/Sheet/Sheet";
import { Icon } from "@/components/Icon/Icon";
import { useToast } from "@/components/Toast/Toast";
import { useConfirm } from "@/components/ConfirmDialog/ConfirmDialog";
import styles from "./page.module.css";

export default function BudgetsPage() {
  const { user } = useUser();
  const categories = useCategories("expense");
  const transactions = useTransactions();
  const safeToSpend = useSafeToSpend();
  const toast = useToast();
  const { confirm } = useConfirm();
  
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  
  // Move Money state
  const [showMoveMoney, setShowMoveMoney] = useState(false);
  const [moveFromId, setMoveFromId] = useState("ready"); // "ready" or categoryId
  const [moveToId, setMoveToId] = useState("");
  const [moveAmount, setMoveAmount] = useState("");
  const [isMoving, setIsMoving] = useState(false);

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

  // Overall envelope sums
  const totalBudgeted = budgetedCategories.reduce(
    (s, c) => s + (c.monthlyBudgetCents ?? 0),
    0
  );
  const totalSpent = budgetedCategories.reduce(
    (s, c) => s + (categorySpending.get(c.id) ?? 0),
    0
  );

  const currency = useCurrency();
  const totalBalance = safeToSpend.totalBalance || 0;
  
  // Zero-Based Envelope Budgeting Math
  const readyToAssign = totalBalance - totalBudgeted;

  async function handleRemoveBudget(categoryId: string) {
    if (!user?.id) return;
    const ok = await confirm({
      title: "Remove budget?",
      message: "This category envelope will no longer have allocated funds.",
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
      toast.success("Envelope emptied");
    } catch {
      toast.error("Failed to remove budget.");
    }
  }

  // Quick allocation increment/decrement (+/- QR 50)
  async function handleQuickAdjust(categoryId: string, deltaCents: number) {
    if (!user?.id) return;
    const category = categories?.find((c) => c.id === categoryId);
    if (!category) return;

    const currentBudget = category.monthlyBudgetCents || 0;
    const newBudget = Math.max(0, currentBudget + deltaCents);
    
    try {
      await db.categories.update(categoryId, {
        monthlyBudgetCents: newBudget,
        updatedAt: new Date(),
        dirty: true,
      });
      toast.success(`Budget adjusted: ${formatCents(newBudget, currency)}`);
    } catch {
      toast.error("Failed to adjust budget");
    }
  }

  // Shift cash between envelopes
  async function handleMoveMoneySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id || !moveToId) return;

    const amountCents = parseFloat(moveAmount) * 100;
    if (isNaN(amountCents) || amountCents <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsMoving(true);
    try {
      const now = new Date();

      // Deduct from source if not Ready to Assign
      if (moveFromId !== "ready") {
        const sourceCategory = categories?.find((c) => c.id === moveFromId);
        if (!sourceCategory) return;
        const currentSourceBudget = sourceCategory.monthlyBudgetCents || 0;
        if (currentSourceBudget < amountCents) {
          toast.error(`Not enough funds in ${sourceCategory.name} envelope`);
          setIsMoving(false);
          return;
        }

        await db.categories.update(moveFromId, {
          monthlyBudgetCents: currentSourceBudget - amountCents,
          updatedAt: now,
          dirty: true,
        });
      }

      // Add to destination
      const destCategory = categories?.find((c) => c.id === moveToId);
      if (!destCategory) return;
      const currentDestBudget = destCategory.monthlyBudgetCents || 0;
      await db.categories.update(moveToId, {
        monthlyBudgetCents: currentDestBudget + amountCents,
        updatedAt: now,
        dirty: true,
      });

      toast.success("Money moved successfully");
      setShowMoveMoney(false);
      setMoveAmount("");
      setMoveToId("");
    } catch {
      toast.error("Failed to move money");
    } finally {
      setIsMoving(false);
    }
  }

  return (
    <>
      <main className={`app-shell page-enter ${styles.page}`}>
        <header className={styles.header}>
          <h1 className={styles.title}>Envelopes</h1>
        </header>

        {/* ─── Ready to Assign Banner ─── */}
        <div 
          className={`${styles.readyBanner} ${
            readyToAssign > 0 
              ? styles.readyBannerPositive 
              : readyToAssign === 0 
              ? styles.readyBannerZero 
              : styles.readyBannerNegative
          }`}
        >
          <div className={styles.readyMeta}>
            <span className={styles.readyLabel}>
              {readyToAssign > 0 ? "Ready to Assign" : readyToAssign === 0 ? "Perfectly Budgeted" : "Over-allocated"}
            </span>
            <h2 className={styles.readyAmount}>
              {formatCents(readyToAssign, currency, { symbol: true })}
            </h2>
            <p className={styles.readyDesc}>
              {readyToAssign > 0 
                ? "Assign these funds to envelopes to give every riyal a job." 
                : readyToAssign === 0 
                ? "Every riyal has been assigned to an envelope." 
                : "You have assigned more cash than you currently have in hand."}
            </p>
          </div>
          {categories && categories.length > 0 && (
            <button 
              onClick={() => {
                setMoveFromId("ready");
                setShowMoveMoney(true);
              }}
              className={styles.moveMoneyGlobalBtn}
            >
              <Icon name="repeat" size={14} /> Move Cash
            </button>
          )}
        </div>

        {/* Envelope Metrics Summary Row */}
        {budgetedCategories.length > 0 && (
          <div className={styles.overallRow}>
            <div className={styles.overallMeta}>
              <span className={styles.overallLabel}>Total Envelope Limits</span>
              <span className={styles.overallBudget}>
                {formatCents(totalBudgeted, currency, { symbol: true })}
              </span>
            </div>
            <div className={styles.overallRight}>
              <span className={styles.overallLabel}>Spent this Month</span>
              <span
                className={styles.overallSpent}
                style={{ color: totalSpent > totalBudgeted ? "var(--over)" : "var(--ok)" }}
              >
                {formatCents(totalSpent, currency, { symbol: true })}
              </span>
            </div>
          </div>
        )}

        <div className={styles.content}>
          {/* Active Envelopes List */}
          {budgetedCategories.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Active Envelopes</h2>
              <div className={styles.list}>
                {budgetedCategories.map((category) => {
                  const spentCents = categorySpending.get(category.id) ?? 0;
                  const pacing = calculateCategoryBudgetPacing({
                    monthlyBudgetCents: category.monthlyBudgetCents!,
                    spentCents,
                  });
                  const catIconName = (category.icon ?? "tag") as any;
                  const isUnderBudget = pacing.paceDelta >= 0;

                  return (
                    <div key={category.id} className={styles.card}>
                      <div className={styles.cardHeader}>
                        <span
                          className={styles.cardIcon}
                          style={{ background: (category.color ?? "#888") + "18" }}
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
                        {(() => {
                          const spent = pacing.spentCents;
                          const limit = pacing.monthlyBudgetCents;
                          const overLimit = spent > limit;
                          const nearLimit = spent >= limit * 0.9 && spent <= limit;

                          if (overLimit) {
                            return (
                              <span className={`${styles.statusBadge} ${styles.over}`}>
                                <Icon name="alert-triangle" size={11} /> Overspent
                              </span>
                            );
                          }
                          if (nearLimit) {
                            return (
                              <span className={`${styles.statusBadge} ${styles.warn}`}>
                                <Icon name="alert-triangle" size={11} /> Near Limit
                              </span>
                            );
                          }
                          return (
                            <span className={`${styles.statusBadge} ${styles.onTrack}`}>
                              <Icon name="check-circle" size={11} /> Good Pacing
                            </span>
                          );
                        })()}
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
                            <span className={styles.legendDot} style={{ background: "var(--ink-mute)" }} />
                            Expected ({pacing.percentElapsed}%)
                          </span>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className={styles.details}>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Left in Envelope</span>
                          <span
                            className={styles.detailValue}
                            style={{
                              color: pacing.remainingCents < 0 ? "var(--over)" : "var(--ok)",
                            }}
                          >
                            {pacing.remainingCents < 0 ? "−" : ""}
                            {formatCents(Math.abs(pacing.remainingCents), currency, { symbol: true })}
                          </span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Daily Cap</span>
                          <span className={styles.detailValue}>
                            {formatCents(pacing.dailyAllowance, currency, { symbol: true })}
                          </span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>vs Paceline</span>
                          <span
                            className={styles.detailValue}
                            style={{ color: isUnderBudget ? "var(--ok)" : "var(--over)" }}
                          >
                            {isUnderBudget ? "−" : "+"}
                            {formatCents(Math.abs(pacing.paceDelta), currency, { symbol: true })}
                          </span>
                        </div>
                      </div>

                      {/* Quick Adjust & Move Actions */}
                      <div className={styles.quickAdjustRow}>
                        <button
                          onClick={() => handleQuickAdjust(category.id, -5000)}
                          className={styles.adjustBtn}
                          title="Reduce envelope by 50"
                        >
                          -50
                        </button>
                        <button
                          onClick={() => handleQuickAdjust(category.id, -1000)}
                          className={styles.adjustBtn}
                          title="Reduce envelope by 10"
                        >
                          -10
                        </button>
                        
                        <button
                          onClick={() => {
                            setMoveFromId(category.id);
                            setShowMoveMoney(true);
                          }}
                          className={styles.envelopeMoveBtn}
                          title="Transfer money to other envelope"
                        >
                          <Icon name="repeat" size={12} /> Transfer
                        </button>
                        
                        <button
                          onClick={() => handleQuickAdjust(category.id, 1000)}
                          className={styles.adjustBtn}
                          title="Add 10 to envelope"
                        >
                          +10
                        </button>
                        <button
                          onClick={() => handleQuickAdjust(category.id, 5000)}
                          className={styles.adjustBtn}
                          title="Add 50 to envelope"
                        >
                          +50
                        </button>
                      </div>

                      <div className={styles.cardActions}>
                        <button
                          className={styles.editBtn}
                          onClick={() => setEditingCategory(category.id)}
                        >
                          <Icon name="pen" size={13} />
                          Configure
                        </button>
                        <button
                          className={`${styles.editBtn} ${styles.removeBtn}`}
                          onClick={() => handleRemoveBudget(category.id)}
                        >
                          <Icon name="x" size={13} />
                          Empty
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Unbudgeted Categories */}
          {unbudgetedCategories.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Empty Envelopes</h2>
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
                        style={{ background: (category.color ?? "#888") + "18" }}
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
                            {formatCents(spentCents, currency, { symbol: true })} spent this month
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
              <p className={styles.emptyText}>No envelopes yet</p>
              <p className={styles.emptyHint}>Add categories first, then distribute your cash to them.</p>
            </div>
          )}
        </div>
      </main>

      <FAB onClick={() => setShowForm(!showForm)} isOpen={showForm} icon="+" label="Fill Envelope" />

      {/* ─── Move Money Bottom Drawer ─── */}
      <Sheet open={showMoveMoney} onClose={() => setShowMoveMoney(false)} label="Move Money">
        <header className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Move Cash</h2>
          <button
            type="button"
            className={styles.modalClose}
            onClick={() => setShowMoveMoney(false)}
            aria-label="Close"
          >
            <Icon name="x" size={20} />
          </button>
        </header>

        <form onSubmit={handleMoveMoneySubmit} className={styles.modalForm}>
          <div className={styles.modalField}>
            <label htmlFor="move-from" className={styles.modalLabel}>
              From Envelope
            </label>
            <select
              id="move-from"
              value={moveFromId}
              onChange={(e) => setMoveFromId(e.target.value)}
              className={styles.modalSelect}
              required
            >
              <option value="ready">Ready to Assign (QR {(readyToAssign / 100).toFixed(2)})</option>
              {budgetedCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (QR {((c.monthlyBudgetCents || 0) / 100).toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.modalField}>
            <label htmlFor="move-to" className={styles.modalLabel}>
              To Envelope
            </label>
            <select
              id="move-to"
              value={moveToId}
              onChange={(e) => setMoveToId(e.target.value)}
              className={styles.modalSelect}
              required
            >
              <option value="">Select envelope...</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.monthlyBudgetCents ? `(QR ${((c.monthlyBudgetCents || 0) / 100).toFixed(2)})` : "(Empty)"}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.modalField}>
            <label htmlFor="move-amount" className={styles.modalLabel}>
              Amount (QAR)
            </label>
            <input
              id="move-amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              value={moveAmount}
              onChange={(e) => setMoveAmount(e.target.value)}
              className={styles.modalInput}
              required
            />
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={() => setShowMoveMoney(false)}
              className={styles.modalCancelBtn}
              disabled={isMoving}
            >
              Cancel
            </button>
            <button type="submit" className={styles.modalSubmitBtn} disabled={isMoving}>
              {isMoving ? "Moving..." : "Move Cash"}
            </button>
          </div>
        </form>
      </Sheet>

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
