"use client";

import { useState, useMemo } from "react";
import { useTransactions, useCategories, useCurrency } from "@/lib/db/hooks";
import { type Transaction, type Category } from "@/lib/db/dexie";
import { Icon } from "@/components/Icon/Icon";
import { TransactionForm } from "@/components/TransactionForm/TransactionForm";
import { formatCents } from "@/lib/money";
import { format, startOfDay } from "date-fns";
import { useToast } from "@/components/Toast/Toast";
import Link from "next/link";
import styles from "./page.module.css";

export default function SearchPage() {
  const transactions = useTransactions();
  const categories = useCategories();
  const toast = useToast();

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const categoryMap = useMemo(() => {
    const m = new Map<string, Category>();
    categories?.forEach((c) => m.set(c.id, c));
    return m;
  }, [categories]);

  const filteredResults = useMemo(() => {
    if (!transactions) return [];

    return transactions.filter((txn) => {
      // Type
      if (typeFilter !== "all" && txn.type !== typeFilter) return false;

      // Category
      if (selectedCategoryId && txn.categoryId !== selectedCategoryId) return false;

      // Query match (Note, Category Name, or Amount formatted)
      if (query.trim()) {
        const q = query.toLowerCase();
        const cat = categoryMap.get(txn.categoryId || "");
        const catName = cat?.name.toLowerCase() || "";
        const note = txn.note?.toLowerCase() || "";
        const amountStr = (txn.amountCents / 100).toString();

        if (
          !catName.includes(q) &&
          !note.includes(q) &&
          !amountStr.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, query, typeFilter, selectedCategoryId, categoryMap]);

  // Grouped search results by date
  const groupedResults = useMemo(() => {
    const groups = new Map<string, typeof filteredResults>();
    filteredResults.forEach((txn) => {
      const key = startOfDay(txn.date).toISOString();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(txn);
    });

    return Array.from(groups.entries())
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([dateKey, txns]) => ({
        date: new Date(dateKey),
        transactions: txns,
      }));
  }, [filteredResults]);

  const currency = useCurrency();

  return (
    <>
      <main className={`app-shell page-enter ${styles.page}`}>
        {/* Header */}
        <header className={styles.header}>
          <Link href="/" className={styles.backBtn} aria-label="Back">
            <Icon name="chevron-left" size={20} />
          </Link>
          <h1 className={styles.title}>Search</h1>
        </header>

        {/* Input Wrap */}
        <div className={styles.searchBar}>
          <Icon name="search" size={20} color="var(--ink-mute)" className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search notes, categories, amounts..."
            className={styles.input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button
              className={styles.clearBtn}
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <Icon name="x" size={14} />
            </button>
          )}
        </div>

        {/* Filter Toolbar */}
        <div className={styles.filters}>
          {/* Type Selector */}
          <select
            className={styles.select}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
          >
            <option value="all">All Types</option>
            <option value="expense">Expenses</option>
            <option value="income">Income</option>
          </select>

          {/* Category Selector */}
          <select
            className={styles.select}
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Results */}
        <div className={styles.results}>
          {transactions === undefined ? (
            <div className={styles.empty}>Searching...</div>
          ) : filteredResults.length === 0 ? (
            <div className={styles.empty}>
              <Icon name="search" size={40} color="var(--ink-faint)" />
              <p className={styles.emptyText}>No results found</p>
              <p className={styles.emptyHint}>Try adjusting your keywords or filters</p>
            </div>
          ) : (
            groupedResults.map((group) => (
              <section key={group.date.toISOString()} className={styles.group}>
                <h2 className={styles.dateLabel}>
                  {format(group.date, "EEEE, MMM d, yyyy")}
                </h2>
                <div className={styles.transactions}>
                  {group.transactions.map((txn) => {
                    const category = categoryMap.get(txn.categoryId ?? "");
                    const isIncome = txn.type === "income";
                    const catIconName = (category?.icon ?? (isIncome ? "arrow-up" : "arrow-down")) as any;

                    return (
                      <button
                        key={txn.id}
                        className={styles.row}
                        onClick={() => setEditingTransaction(txn)}
                      >
                        <span
                          className={styles.iconCircle}
                          style={{
                            background: isIncome
                              ? "rgba(87, 217, 163, 0.12)"
                              : "rgba(255, 107, 90, 0.10)",
                          }}
                        >
                          <Icon
                            name={catIconName}
                            size={18}
                            color={isIncome ? "var(--ok)" : "var(--over)"}
                          />
                        </span>
                        <div className={styles.rowMeta}>
                          <span className={styles.rowLabel}>
                            {category?.name ?? "Uncategorized"}
                          </span>
                          {txn.note && (
                            <span className={styles.rowSub}>{txn.note}</span>
                          )}
                        </div>
                        <span
                          className={styles.amount}
                          style={{ color: isIncome ? "var(--ok)" : "var(--over)" }}
                        >
                          {isIncome ? "+" : "−"}
                          {formatCents(txn.amountCents, currency, { symbol: true })}
                        </span>
                        <Icon name="chevron-right" size={16} color="var(--ink-faint)" style={{ marginLeft: "0.5rem" }} />
                      </button>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      </main>

      {editingTransaction && (
        <TransactionForm
          editTransaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSuccess={() => {
            toast.success("Transaction updated");
          }}
        />
      )}
    </>
  );
}
