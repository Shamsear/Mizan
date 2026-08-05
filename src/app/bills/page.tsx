"use client";

import { useState, useMemo } from "react";
import { useRecurringRules, useCategories, useCurrency, useSettings } from "@/lib/db/hooks";
import { useUser } from "@clerk/nextjs";
import { db, type Category } from "@/lib/db/dexie";
import { formatCents } from "@/lib/money";
import { format, isPast, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { FAB } from "@/components/FAB/FAB";
import { RecurringRuleForm } from "@/components/RecurringRuleForm/RecurringRuleForm";
import { Icon } from "@/components/Icon/Icon";
import { useToast } from "@/components/Toast/Toast";
import { useConfirm } from "@/components/ConfirmDialog/ConfirmDialog";
import styles from "./page.module.css";

export default function BillsPage() {
  const { user } = useUser();
  const recurringRules = useRecurringRules();
  const categories = useCategories();
  const settings = useSettings();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  
  // Calendar specific state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const categoryMap = useMemo(() => {
    const m = new Map<string, Category>();
    categories?.forEach((c) => m.set(c.id, c));
    return m;
  }, [categories]);

  const filteredRules = useMemo(() => {
    if (!recurringRules) return [];
    if (filter === "all") return recurringRules;
    return recurringRules.filter((r) => r.type === filter);
  }, [recurringRules, filter]);

  const incomeRules = filteredRules.filter((r) => r.type === "income");
  const expenseRules = filteredRules.filter((r) => r.type === "expense");

  // Summary totals
  const totalIncome = (recurringRules ?? [])
    .filter((r) => r.type === "income")
    .reduce((s, r) => s + r.amountCents, 0);
  const totalExpense = (recurringRules ?? [])
    .filter((r) => r.type === "expense")
    .reduce((s, r) => s + r.amountCents, 0);

  const weekStartsOn = useMemo(() => {
    return (settings?.weekStart ?? 0) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  }, [settings?.weekStart]);

  // Calendar calculations
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn });
    return eachDayOfInterval({ start, end });
  }, [currentMonth, weekStartsOn]);

  // Find rules due on a specific date
  const getRulesForDate = (date: Date) => {
    if (!recurringRules) return [];
    return recurringRules.filter((r) => isSameDay(r.nextDueDate, date));
  };

  const selectedDateRules = useMemo(() => {
    return getRulesForDate(selectedDate);
  }, [selectedDate, recurringRules]);

  async function handleDelete(ruleId: string) {
    if (!user?.id) return;
    const ok = await confirm({
      title: "Delete this rule?",
      message: "Future auto-posts from this rule will stop.",
      confirmLabel: "Delete",
      dangerous: true,
    });
    if (!ok) return;
    try {
      const now = new Date();
      await db.recurringRules.update(ruleId, { deletedAt: now, updatedAt: now, dirty: true });
      toast.success("Rule deleted");
    } catch {
      toast.error("Failed to delete rule.");
    }
  }

  function getCadenceLabel(cadence: string): string {
    const map: Record<string, string> = {
      daily: "Daily", weekly: "Weekly", biweekly: "Bi-weekly",
      monthly: "Monthly", yearly: "Yearly",
    };
    return map[cadence] ?? cadence;
  }

  const currency = useCurrency();

  function RuleCard({ rule }: { rule: (typeof filteredRules)[0] }) {
    const category = categoryMap.get(rule.categoryId);
    const isIncome = rule.type === "income";
    const overdue = isPast(rule.nextDueDate) && !isIncome;
    const catIconName = (category?.icon ?? (isIncome ? "circle-dollar" : "repeat")) as any;

    return (
      <div
        className={styles.card}
        style={{
          borderLeft: `3px solid ${isIncome ? "var(--ok)" : overdue ? "var(--over)" : "var(--panel-line)"}`,
        }}
      >
        <div className={styles.cardHeader}>
          <span
            className={styles.cardIcon}
            style={{
              background: category?.color
                ? `${category.color}26`
                : isIncome
                ? "rgba(87,217,163,0.12)"
                : overdue
                ? "rgba(255,107,90,0.12)"
                : "rgba(255,255,255,0.04)",
            }}
          >
            <Icon
              name={catIconName}
              size={18}
              color={category?.color || (isIncome ? "var(--ok)" : overdue ? "var(--over)" : "var(--ink-mute)")}
            />
          </span>
          <div className={styles.cardMeta}>
            <h3 className={styles.cardTitle}>{rule.label}</h3>
            <p className={styles.cardSubtitle}>
              {getCadenceLabel(rule.cadence)}
              {rule.autoPost && <span className={styles.badge}>Auto</span>}
            </p>
          </div>
          <div className={styles.cardAmount}>
            <span
              className={styles.amount}
              style={{ color: isIncome ? "var(--ok)" : "var(--over)" }}
            >
              {isIncome ? "+" : "−"}
              {formatCents(rule.amountCents, currency, { symbol: true })}
            </span>
            <span className={`${styles.nextDue} ${overdue ? styles.overdue : ""}`}>
              {overdue && <Icon name="alert-triangle" size={11} />}
              {overdue ? "Overdue" : `Next ${format(rule.nextDueDate, "MMM d")}`}
            </span>
          </div>
        </div>
        <div className={styles.cardActions}>
          <button className={styles.editBtn} onClick={() => setEditingRule(rule.id)}>
            <Icon name="pen" size={14} />
            <span>Edit</span>
          </button>
          <button
            className={`${styles.editBtn} ${styles.deleteActionBtn}`}
            onClick={() => handleDelete(rule.id)}
          >
            <Icon name="trash-2" size={14} />
            <span>Delete</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <main className={`app-shell page-enter ${styles.page}`}>
        <header className={styles.header}>
          <h1 className={styles.title}>Bills & Income</h1>
          
          {/* View Mode Toggle */}
          <div className={styles.viewToggle}>
            <button
              className={`${styles.toggleBtn} ${viewMode === "list" ? styles.toggleActive : ""}`}
              onClick={() => setViewMode("list")}
              aria-label="List view"
            >
              <Icon name="list" size={16} />
            </button>
            <button
              className={`${styles.toggleBtn} ${viewMode === "calendar" ? styles.toggleActive : ""}`}
              onClick={() => setViewMode("calendar")}
              aria-label="Calendar view"
            >
              <Icon name="calendar" size={16} />
            </button>
          </div>
        </header>

        {/* Summary banner */}
        {(recurringRules?.length ?? 0) > 0 && (
          <div className={styles.summaryBanner}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Monthly in</span>
              <span className={`${styles.summaryVal} ${styles.income}`}>
                {formatCents(totalIncome, currency, { symbol: true })}
              </span>
            </div>
            <div className={styles.sumDivider} />
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Monthly out</span>
              <span className={`${styles.summaryVal} ${styles.expense}`}>
                {formatCents(totalExpense, currency, { symbol: true })}
              </span>
            </div>
            <div className={styles.sumDivider} />
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Net</span>
              <span
                className={styles.summaryVal}
                style={{
                  color:
                    totalIncome - totalExpense >= 0 ? "var(--ok)" : "var(--over)",
                }}
              >
                {formatCents(totalIncome - totalExpense, currency, {
                  symbol: true,
                  signed: true,
                })}
              </span>
            </div>
          </div>
        )}

        {viewMode === "list" ? (
          <>
            {/* Filters */}
            <div className={styles.filters}>
              {(["all", "income", "expense"] as const).map((f) => (
                <button
                  key={f}
                  className={`${styles.filterBtn} ${filter === f ? styles.active : ""}`}
                  onClick={() => setFilter(f)}
                >
                  {f === "all" ? "All" : f === "income" ? "Income" : "Bills"}
                </button>
              ))}
            </div>

            <div className={styles.content}>
              {filteredRules.length === 0 ? (
                <div className={styles.empty}>
                  <Icon name="repeat" size={40} color="var(--ink-faint)" />
                  <p className={styles.emptyText}>No recurring items yet</p>
                  <p className={styles.emptyHint}>Tap + to add income or a bill</p>
                </div>
              ) : (
                <>
                  {(filter === "all" || filter === "income") && incomeRules.length > 0 && (
                    <section className={styles.section}>
                      <h2 className={styles.sectionTitle}>Income</h2>
                      <div className={styles.list}>
                        {incomeRules.map((r) => <RuleCard key={r.id} rule={r} />)}
                      </div>
                    </section>
                  )}
                  {(filter === "all" || filter === "expense") && expenseRules.length > 0 && (
                    <section className={styles.section}>
                      <h2 className={styles.sectionTitle}>Bills</h2>
                      <div className={styles.list}>
                        {expenseRules.map((r) => <RuleCard key={r.id} rule={r} />)}
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>
          </>
        ) : (
          <div className={styles.calendarContainer}>
            {/* Month Navigator */}
            <div className={styles.calendarHeader}>
              <button
                className={styles.navBtn}
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                aria-label="Previous month"
              >
                <Icon name="chevron-left" size={16} />
              </button>
              <h2 className={styles.monthLabel}>
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <button
                className={styles.navBtn}
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                aria-label="Next month"
              >
                <Icon name="chevron-right" size={16} />
              </button>
            </div>

            {/* Days Header */}
            <div className={styles.daysGridHeader}>
              {(weekStartsOn === 0
                ? ["S", "M", "T", "W", "T", "F", "S"]
                : ["M", "T", "W", "T", "F", "S", "S"]
              ).map((d, i) => (
                <span key={i} className={styles.dayOfWeek}>
                  {d}
                </span>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className={styles.calendarGrid}>
              {calendarDays.map((day, idx) => {
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isTodayDate = isSameDay(day, new Date());
                const dayRules = getRulesForDate(day);
                const hasIncome = dayRules.some((r) => r.type === "income");
                const hasExpense = dayRules.some((r) => r.type === "expense");

                return (
                  <button
                    key={idx}
                    className={`${styles.dayCell} ${!isCurrentMonth ? styles.dayCellOutside : ""} ${
                      isSelected ? styles.dayCellSelected : ""
                    } ${isTodayDate ? styles.dayCellToday : ""}`}
                    onClick={() => setSelectedDate(day)}
                  >
                    <span className={styles.dayNumber}>{format(day, "d")}</span>
                    <div className={styles.dotContainer}>
                      {hasIncome && <span className={`${styles.dot} ${styles.dotIncome}`} />}
                      {hasExpense && <span className={`${styles.dot} ${styles.dotExpense}`} />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected day summary details */}
            <div className={styles.selectedDayDetails}>
              <h3 className={styles.detailsHeader}>
                Due on {format(selectedDate, "MMMM d")}
              </h3>
              {selectedDateRules.length === 0 ? (
                <p className={styles.noDetailsText}>No items due on this day</p>
              ) : (
                <div className={styles.list}>
                  {selectedDateRules.map((rule) => (
                    <RuleCard key={rule.id} rule={rule} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <FAB onClick={() => setShowForm(true)} icon="+" label="Add recurring item" />

      {showForm && (
        <RecurringRuleForm
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); toast.success("Recurring rule saved"); }}
        />
      )}

      {editingRule && (
        <RecurringRuleForm
          ruleId={editingRule}
          onClose={() => setEditingRule(null)}
          onSuccess={() => { setEditingRule(null); toast.success("Rule updated"); }}
        />
      )}
    </>
  );
}
