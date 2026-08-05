"use client";

import { useMemo } from "react";
import { SpendingByCategory } from "@/components/Charts/SpendingByCategory";
import { CashFlowTrend } from "@/components/Charts/CashFlowTrend";
import { useTransactions, useCategories, useCurrency } from "@/lib/db/hooks";
import { formatCents } from "@/lib/money";
import { startOfMonth, endOfMonth, startOfDay, subDays, eachDayOfInterval } from "date-fns";
import { Icon } from "@/components/Icon/Icon";
import styles from "./page.module.css";

export default function InsightsPage() {
  const transactions = useTransactions();
  const categories = useCategories();

  // Calculate spending by category for current month
  const categoryData = useMemo(() => {
    if (!transactions || !categories) return [];

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Filter to current month expenses
    const monthlyExpenses = transactions.filter(
      (txn) =>
        txn.type === "expense" &&
        txn.date >= monthStart &&
        txn.date <= monthEnd
    );

    // Aggregate by category
    const categoryMap = new Map<string, number>();
    monthlyExpenses.forEach((txn) => {
      const current = categoryMap.get(txn.categoryId) || 0;
      categoryMap.set(txn.categoryId, current + txn.amountCents);
    });

    // Map to category details
    return Array.from(categoryMap.entries())
      .map(([categoryId, amount]) => {
        const category = categories.find((c) => c.id === categoryId);
        return category
          ? {
              id: category.id,
              name: category.name,
              icon: category.icon,
              color: category.color,
              amount,
            }
          : null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, categories]);

  // Calculate daily cash flow for last 30 days
  const cashFlowData = useMemo(() => {
    if (!transactions) return [];

    const now = new Date();
    const startDate = startOfDay(subDays(now, 29)); // Last 30 days
    const endDate = startOfDay(now);

    // Generate all days in range
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // Aggregate transactions by day
    return days.map((date) => {
      const dayStart = startOfDay(date);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dayTransactions = transactions.filter(
        (txn) => txn.date >= dayStart && txn.date <= dayEnd
      );

      const income = dayTransactions
        .filter((txn) => txn.type === "income")
        .reduce((sum, txn) => sum + txn.amountCents, 0);

      const expense = dayTransactions
        .filter((txn) => txn.type === "expense")
        .reduce((sum, txn) => sum + txn.amountCents, 0);

      return {
        date,
        income,
        expense,
        net: income - expense,
      };
    });
  }, [transactions]);

  // Calculate summary stats
  const stats = useMemo(() => {
    if (!transactions) {
      return { totalIncome: 0, totalExpenses: 0, savingsRate: 0 };
    }

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const monthlyTransactions = transactions.filter(
      (txn) => txn.date >= monthStart && txn.date <= monthEnd
    );

    const totalIncome = monthlyTransactions
      .filter((txn) => txn.type === "income")
      .reduce((sum, txn) => sum + txn.amountCents, 0);

    const totalExpenses = monthlyTransactions
      .filter((txn) => txn.type === "expense")
      .reduce((sum, txn) => sum + txn.amountCents, 0);

    const savingsRate =
      totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    return { totalIncome, totalExpenses, savingsRate };
  }, [transactions]);

  const currency = useCurrency();

  return (
    <main className={`app-shell page-enter ${styles.page}`}>
      <header className={styles.header}>
        <h1 className={styles.title}>Insights</h1>
      </header>

      {/* Summary Stats Cards */}
      <section className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Income</span>
          <span className={`${styles.statValue} ${styles.income}`}>
            {formatCents(stats.totalIncome, currency, { symbol: true })}
          </span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>Expenses</span>
          <span className={`${styles.statValue} ${styles.expense}`}>
            {formatCents(stats.totalExpenses, currency, { symbol: true })}
          </span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>Savings Rate</span>
          <span
            className={styles.statValue}
            style={{ color: stats.savingsRate >= 0 ? "var(--ok)" : "var(--over)" }}
          >
            {stats.savingsRate.toFixed(0)}%
          </span>
        </div>
      </section>

      {/* Charts Section */}
      <section className={styles.charts}>
        <div className={styles.chartWrapper}>
          <h2 className={styles.chartTitle}>Spending by Category</h2>
          <SpendingByCategory data={categoryData} currency={currency} />
        </div>

        <div className={styles.chartWrapper}>
          <h2 className={styles.chartTitle}>30-Day Cash Flow</h2>
          <CashFlowTrend data={cashFlowData} currency={currency} />
        </div>
      </section>

      {/* Quick Insights List */}
      <section className={styles.insights}>
        <h2 className={styles.insightsTitle}>Quick Insights</h2>
        <div className={styles.insightsList}>
          {stats.savingsRate >= 20 && (
            <div className={styles.insightItem}>
              <span className={styles.insightIcon} style={{ color: "var(--electric)" }}>
                <Icon name="sparkles" size={16} />
              </span>
              <span className={styles.insightText}>
                Great job! You're saving {stats.savingsRate.toFixed(0)}% of your income this
                month.
              </span>
            </div>
          )}
          {stats.savingsRate < 0 && (
            <div className={styles.insightItem}>
              <span className={styles.insightIcon} style={{ color: "var(--over)" }}>
                <Icon name="alert-triangle" size={16} />
              </span>
              <span className={styles.insightText}>
                You're spending more than you earn this month. Consider reviewing your
                budgets.
              </span>
            </div>
          )}
          {categoryData.length > 0 && (
            <div className={styles.insightItem}>
              <span className={styles.insightIcon} style={{ color: "var(--amber)" }}>
                <Icon name="tag" size={16} />
              </span>
              <span className={styles.insightText}>
                Your top spending category is {categoryData[0].name} at{" "}
                {formatCents(categoryData[0].amount, currency, { symbol: true })}.
              </span>
            </div>
          )}
          {transactions && transactions.length > 0 && (
            <div className={styles.insightItem}>
              <span className={styles.insightIcon} style={{ color: "var(--electric)" }}>
                <Icon name="list" size={16} />
              </span>
              <span className={styles.insightText}>
                You've logged {transactions.length} transaction
                {transactions.length !== 1 ? "s" : ""} so far.
              </span>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
