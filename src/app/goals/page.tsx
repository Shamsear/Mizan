"use client";

import { useState } from "react";
import { useGoals } from "@/lib/db/hooks";
import { useUser } from "@clerk/nextjs";
import { db } from "@/lib/db/dexie";
import { formatCents } from "@/lib/money";
import { calculateGoalContribution } from "@/lib/finance";
import { format } from "date-fns";
import { FAB } from "@/components/FAB/FAB";
import { GoalForm } from "@/components/GoalForm/GoalForm";
import { Icon } from "@/components/Icon/Icon";
import { useToast } from "@/components/Toast/Toast";
import { useConfirm } from "@/components/ConfirmDialog/ConfirmDialog";
import { checkGoalMilestones } from "@/lib/notifications/scheduler";
import styles from "./page.module.css";

export default function GoalsPage() {
  const { user } = useUser();
  const goals = useGoals();
  const toast = useToast();
  const { confirm, promptAmount } = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);

  async function handleDelete(goalId: string) {
    if (!user?.id) return;
    const ok = await confirm({
      title: "Delete this goal?",
      message: "Your savings progress will be lost.",
      confirmLabel: "Delete",
      dangerous: true,
    });
    if (!ok) return;
    try {
      const now = new Date();
      await db.goals.update(goalId, { deletedAt: now, updatedAt: now, dirty: true });
      toast.success("Goal deleted");
    } catch {
      toast.error("Failed to delete goal.");
    }
  }

  async function handleAddToSavings(goalId: string, currency: string) {
    if (!user?.id) return;
    const cents = await promptAmount({
      title: "Add savings",
      placeholder: "0.00",
      confirmLabel: "Add",
      currencySymbol: getCurrencySymbol(currency),
    });
    if (!cents || cents <= 0) return;
    try {
      const goal = await db.goals.get(goalId);
      if (!goal) return;
      const now = new Date();
      await db.goals.update(goalId, {
        savedCents: goal.savedCents + cents,
        updatedAt: now,
        dirty: true,
      });
      toast.success("Savings added");
      await checkGoalMilestones(user.id, goalId);
    } catch {
      toast.error("Failed to update savings.");
    }
  }

  return (
    <>
      <main className={`app-shell page-enter ${styles.page}`}>
        <header className={styles.header}>
          <h1 className={styles.title}>Savings Goals</h1>
        </header>

        <div className={styles.content}>
          {!goals || goals.length === 0 ? (
            <div className={styles.empty}>
              <Icon name="target" size={40} color="var(--ink-faint)" />
              <p className={styles.emptyText}>No goals yet</p>
              <p className={styles.emptyHint}>Set a savings goal and track your progress</p>
            </div>
          ) : (
            <div className={styles.list}>
              {goals.map((goal) => {
                const contribution = calculateGoalContribution(goal);
                const pct = Math.min(
                  Math.round((goal.savedCents / goal.targetCents) * 100),
                  100
                );
                const isComplete = goal.savedCents >= goal.targetCents;
                const catIconName = (goal.icon && !goal.icon.includes?.("🎯") ? goal.icon : "target") as any;

                return (
                  <div key={goal.id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <span className={styles.cardIcon}>
                        <Icon
                          name={catIconName}
                          size={20}
                          color={isComplete ? "var(--electric)" : "var(--amber)"}
                        />
                      </span>
                      <div className={styles.cardMeta}>
                        <h3 className={styles.cardTitle}>{goal.name}</h3>
                        {goal.targetDate && (
                          <p className={styles.cardSubtitle}>
                            <Icon name="calendar" size={11} color="var(--ink-faint)" />
                            {format(goal.targetDate, "MMM d, yyyy")}
                            {contribution.daysRemaining < Infinity && (
                              <span className={styles.daysLeft}>
                                · {contribution.daysRemaining} days left
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                      {isComplete && (
                        <span className={styles.completeIcon}>
                          <Icon name="sparkles" size={20} color="var(--electric)" />
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className={styles.progressSection}>
                      <div className={styles.progressHeader}>
                        <span className={styles.progressAmount}>
                          {formatCents(goal.savedCents, goal.currency, { symbol: true })}
                        </span>
                        <span className={styles.progressTarget}>
                          of {formatCents(goal.targetCents, goal.currency, { symbol: true })}
                        </span>
                      </div>
                      <div className={styles.progressTrack}>
                        <div
                          className={`${styles.progressFill} ${isComplete ? styles.progressComplete : ""}`}
                          style={{ "--pct": `${pct}%` } as React.CSSProperties}
                        />
                      </div>
                      <div className={styles.progressFooter}>
                        <span className={styles.progressPct}>{pct}%</span>
                        {contribution.onTrack ? (
                          <span className={`${styles.statusBadge} ${styles.onTrack}`}>
                            <Icon name="check-circle" size={11} />
                            On track
                          </span>
                        ) : isComplete ? null : (
                          <span className={`${styles.statusBadge} ${styles.behind}`}>
                            <Icon name="alert-triangle" size={11} />
                            Behind
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Contribution stats */}
                    {!isComplete && contribution.daysRemaining < Infinity && (
                      <div className={styles.contributionGrid}>
                        <div className={styles.contributionItem}>
                          <span className={styles.contLabel}>Daily</span>
                          <span className={styles.contValue}>
                            {formatCents(contribution.requiredPerDay, goal.currency, { symbol: true })}
                          </span>
                        </div>
                        <div className={styles.contributionItem}>
                          <span className={styles.contLabel}>Monthly</span>
                          <span className={styles.contValue}>
                            {formatCents(contribution.requiredPerMonth, goal.currency, { symbol: true })}
                          </span>
                        </div>
                        <div className={styles.contributionItem}>
                          <span className={styles.contLabel}>Remaining</span>
                          <span className={styles.contValue}>
                            {formatCents(contribution.remainingCents, goal.currency, { symbol: true })}
                          </span>
                        </div>
                      </div>
                    )}

                    {isComplete && (
                      <div className={styles.completeMessage}>
                        <Icon name="sparkles" size={16} color="var(--electric)" />
                        Goal achieved! Congratulations!
                      </div>
                    )}

                    <div className={styles.cardActions}>
                      {!isComplete && (
                        <button
                          className={`${styles.actionBtn} ${styles.addBtn}`}
                          onClick={() => handleAddToSavings(goal.id, goal.currency)}
                        >
                          <Icon name="plus" size={14} />
                          Add Savings
                        </button>
                      )}
                      <button className={styles.actionBtn} onClick={() => setEditingGoal(goal.id)}>
                        <Icon name="pen" size={14} />
                        Edit
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        onClick={() => handleDelete(goal.id)}
                      >
                        <Icon name="trash-2" size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <FAB onClick={() => setShowForm(!showForm)} isOpen={showForm} icon="+" label="Add goal" />

      {showForm && (
        <GoalForm
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); toast.success("Goal created"); }}
        />
      )}

      {editingGoal && (
        <GoalForm
          goalId={editingGoal}
          onClose={() => setEditingGoal(null)}
          onSuccess={() => { setEditingGoal(null); toast.success("Goal updated"); }}
        />
      )}
    </>
  );
}

function getCurrencySymbol(code: string): string {
  const map: Record<string, string> = {
    USD: "$", EUR: "€", GBP: "£", JPY: "¥", CAD: "CA$", AUD: "A$",
    INR: "₹", KRW: "₩", CNY: "¥", BRL: "R$",
  };
  return map[code] ?? code;
}
