"use client";

import { useState, useMemo } from "react";
import { useTransactions, useCategories, useCurrency } from "@/lib/db/hooks";
import { deleteTransaction } from "@/lib/db/repository";
import { type Transaction, type Category } from "@/lib/db/dexie";
import { useUser } from "@clerk/nextjs";
import { formatCents } from "@/lib/money";
import { format, isToday, isYesterday, startOfDay, isSameMonth, addMonths, subMonths } from "date-fns";
import { FAB } from "@/components/FAB/FAB";
import { TransactionForm } from "@/components/TransactionForm/TransactionForm";
import { Icon } from "@/components/Icon/Icon";
import { Skeleton } from "@/components/Skeleton/Skeleton";
import { useToast } from "@/components/Toast/Toast";
import { useConfirm } from "@/components/ConfirmDialog/ConfirmDialog";
import styles from "./page.module.css";

export default function TransactionsPage() {
  const { user } = useUser();
  const transactions = useTransactions();
  const categories = useCategories();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories?.forEach((cat) => map.set(cat.id, cat));
    return map;
  }, [categories]);

  // Summary totals
  const summary = useMemo(() => {
    if (!transactions) return { income: 0, expense: 0 };
    let income = 0;
    let expense = 0;
    transactions.forEach((t) => {
      if (t.type === "income") income += t.amountCents;
      else expense += t.amountCents;
    });
    return { income, expense };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter((txn) => {
      if (!isSameMonth(txn.date, selectedMonth)) return false;
      if (typeFilter !== "all" && txn.type !== typeFilter) return false;
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        const cat = categoryMap.get(txn.categoryId ?? "");
        if (
          !txn.note?.toLowerCase().includes(s) &&
          !cat?.name.toLowerCase().includes(s)
        )
          return false;
      }
      return true;
    });
  }, [transactions, typeFilter, searchTerm, categoryMap, selectedMonth]);

  const groupedTransactions = useMemo(() => {
    const groups = new Map<string, typeof filteredTransactions>();
    filteredTransactions.forEach((txn) => {
      const key = startOfDay(txn.date).toISOString();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(txn);
    });
    return Array.from(groups.entries())
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([dateKey, txns]) => ({ date: new Date(dateKey), transactions: txns }));
  }, [filteredTransactions]);

  function formatDateLabel(date: Date): string {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "EEEE, MMM dd");
  }

  async function handleDelete(txnId: string) {
    if (!user?.id) return;
    const ok = await confirm({
      title: "Delete transaction?",
      message: "This action cannot be undone.",
      confirmLabel: "Delete",
      dangerous: true,
    });
    if (!ok) return;
    try {
      await deleteTransaction(txnId, user.id);
      toast.success("Transaction deleted");
    } catch {
      toast.error("Failed to delete transaction.");
    }
  }

  const currency = useCurrency();

  return (
    <>
      <main className={`app-shell page-enter ${styles.page}`}>
        <header className={styles.header}>
          <h1 className={styles.title}>Transactions</h1>
        </header>

        {/* Summary strip */}
        {transactions !== undefined && transactions.length > 0 && (
          <div className={styles.summaryStrip}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Income</span>
              <span className={`${styles.summaryValue} ${styles.income}`}>
                {formatCents(summary.income, currency, { symbol: true })}
              </span>
            </div>
            <div className={styles.stripDivider} />
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Expenses</span>
              <span className={`${styles.summaryValue} ${styles.expense}`}>
                {formatCents(summary.expense, currency, { symbol: true })}
              </span>
            </div>
            <div className={styles.stripDivider} />
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Net</span>
              <span
                className={styles.summaryValue}
                style={{
                  color:
                    summary.income - summary.expense >= 0
                      ? "var(--ok)"
                      : "var(--over)",
                }}
              >
                {formatCents(
                  summary.income - summary.expense,
                  currency,
                  { symbol: true, signed: true }
                )}
              </span>
            </div>
          </div>
        )}

        {/* Search + filters */}
        <div className={styles.filters}>
          <div className={styles.searchWrap}>
            <Icon name="search" size={16} color="var(--ink-faint)" />
            <input
              type="search"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            {searchTerm && (
              <button
                className={styles.clearSearch}
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                <Icon name="x" size={14} />
              </button>
            )}
          </div>

          <div className={styles.typeFilters}>
            {(["all", "income", "expense"] as const).map((f) => (
              <button
                key={f}
                className={`${styles.filterBtn} ${typeFilter === f ? styles.active : ""}`}
                onClick={() => setTypeFilter(f)}
              >
                {f === "all" ? "All" : f === "income" ? "Income" : "Expenses"}
              </button>
            ))}
          </div>

          {/* Month Picker */}
          <div className={styles.monthPicker}>
            <button
              className={styles.pickerBtn}
              onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
              aria-label="Previous month"
            >
              <Icon name="chevron-left" size={16} />
            </button>
            <span className={styles.pickerLabel}>
              {format(selectedMonth, "MMMM yyyy")}
            </span>
            <button
              className={styles.pickerBtn}
              onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
              aria-label="Next month"
            >
              <Icon name="chevron-right" size={16} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className={styles.list}>
          {transactions === undefined ? (
            <div className={styles.skeletonList}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton.Card key={i} height="60px" style={{ marginBottom: "0.5rem" }} />
              ))}
            </div>
          ) : groupedTransactions.length === 0 ? (
            <div className={styles.empty}>
              <Icon name="list" size={40} color="var(--ink-faint)" />
              <p className={styles.emptyText}>
                {searchTerm || typeFilter !== "all"
                  ? "No matching transactions"
                  : "No transactions yet"}
              </p>
              <p className={styles.emptyHint}>Tap + to add your first one</p>
            </div>
          ) : (
            groupedTransactions.map((group) => (
              <section key={group.date.toISOString()} className={styles.group}>
                <h2 className={styles.dateLabel}>{formatDateLabel(group.date)}</h2>
                <ul className={styles.transactions}>
                  {group.transactions.map((txn) => {
                    const category = categoryMap.get(txn.categoryId ?? "");
                    const isIncome = txn.type === "income";
                    const catIconName = (category?.icon ?? (isIncome ? "arrow-up" : "arrow-down")) as any;
                    return (
                      <li key={txn.id} className={styles.transaction}>
                        <div className={styles.swipeContainer}>
                          <div
                            className={styles.typeBorder}
                            style={{
                              background: isIncome ? "var(--ok)" : "var(--over)",
                            }}
                          />
                          <button
                            className={styles.txnContent}
                            onClick={() => {
                              setEditingTransaction(txn);
                              setShowForm(true);
                            }}
                          >
                            <span
                              className={styles.icon}
                              style={{
                                background: isIncome
                                  ? "rgba(87,217,163,0.12)"
                                  : "rgba(255,107,90,0.10)",
                              }}
                            >
                              <Icon
                                name={catIconName}
                                size={16}
                                color={isIncome ? "var(--ok)" : "var(--over)"}
                              />
                            </span>
                            <div className={styles.txnMeta}>
                              <span className={styles.categoryName}>
                                {category?.name ?? "Uncategorized"}
                              </span>
                              {txn.note && (
                                <span className={styles.note}>{txn.note}</span>
                              )}
                            </div>
                            <span
                              className={styles.amount}
                              style={{ color: isIncome ? "var(--ok)" : "var(--over)" }}
                            >
                              {isIncome ? "+" : "−"}
                              {formatCents(txn.amountCents, txn.currency, { symbol: true })}
                            </span>
                          </button>
                          <button
                            className={styles.deleteZone}
                            onClick={() => handleDelete(txn.id)}
                            aria-label="Delete transaction"
                          >
                            <Icon name="trash-2" size={18} />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
        </div>
      </main>

      <FAB
        onClick={() => {
          setEditingTransaction(null);
          setShowForm(true);
        }}
      />

      {showForm && (
        <TransactionForm
          onClose={() => {
            setShowForm(false);
            setEditingTransaction(null);
          }}
          onSuccess={() => {
            toast.success("Transaction saved");
          }}
          editTransaction={editingTransaction || undefined}
        />
      )}
    </>
  );
}
