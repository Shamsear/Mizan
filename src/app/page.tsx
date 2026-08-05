"use client";

import { useMemo, useState, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
import { SafeToSpendCard } from "@/components/SafeToSpendCard/SafeToSpendCard";
import { QuickAdd, type QuickTemplate } from "@/components/QuickAdd/QuickAdd";
import { FAB } from "@/components/FAB/FAB";
import { TransactionForm } from "@/components/TransactionForm/TransactionForm";
import { OnboardingWizard } from "@/components/Onboarding/OnboardingWizard";
import { Icon } from "@/components/Icon/Icon";
import { Skeleton } from "@/components/Skeleton/Skeleton";
import { useToast } from "@/components/Toast/Toast";
import {
  useQuickAddTemplates,
  useTransactions,
  useRecurringRules,
  useCategories,
  useCurrency,
  useUnreadNotificationsCount,
} from "@/lib/db/hooks";
import { createTransaction } from "@/lib/db/repository";
import { useSafeToSpend } from "@/lib/finance/useSafeToSpend";
import { useOnlineStatus } from "@/lib/useOnlineStatus";
import { useUser } from "@clerk/nextjs";
import { formatCents } from "@/lib/money";
import { formatDistanceToNow } from "date-fns";
import { NotificationsInbox } from "@/components/NotificationsInbox/NotificationsInbox";
import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  const { user } = useUser();
  const templates = useQuickAddTemplates();
  const transactions = useTransactions();
  const recurringRules = useRecurringRules();
  const categories = useCategories();
  const safeToSpendData = useSafeToSpend();
  const isOnline = useOnlineStatus();
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = useUnreadNotificationsCount() ?? 0;

  useEffect(() => {
    if (recurringRules !== undefined && recurringRules.length === 0) {
      setShowOnboarding(true);
    }
  }, [recurringRules]);

  const dateLabel = useMemo(
    () =>
      new Date()
        .toLocaleDateString("en-US", {
          weekday: "short",
          day: "2-digit",
          month: "short",
        })
        .toUpperCase(),
    []
  );

  const categoryMap = useMemo(
    () => new Map(categories?.map((c) => [c.id, c]) ?? []),
    [categories]
  );

  async function handleAdd(t: QuickTemplate) {
    if (!user?.id) return;
    await createTransaction(user.id, {
      type: t.type,
      amountCents: t.amountCents,
      currency,
      categoryId: t.categoryId,
      date: new Date(),
      note: `Quick add: ${t.label}`,
    });
    toast.success(`Added ${t.label}`);
  }

  const quickTemplates: QuickTemplate[] = templates?.map((t) => ({
    id: t.id,
    label: t.label,
    icon: t.icon,
    amountCents: t.amountCents,
    type: t.type,
    categoryId: t.categoryId,
  })) ?? [];

  // 3 most recent transactions
  const recentTransactions = useMemo(
    () => (transactions ?? []).slice(0, 3),
    [transactions]
  );

  const currency = useCurrency();

  return (
    <>
      <main className={`app-shell page-enter ${styles.page}`}>
        {/* ── Header ── */}
        <header className={styles.brand}>
          <span className={styles.mark}>▸</span>
          <span className={styles.wordmark}>MIZAN</span>
          <div className={styles.spacer} />
          <Link href="/search" className={styles.headerBtn} aria-label="Search">
            <Icon name="search" size={20} />
          </Link>
          <button
            className={styles.headerBtn}
            onClick={() => setShowNotifications(true)}
            aria-label="Notifications"
            style={{ position: "relative" }}
          >
            <Icon name="bell" size={20} />
            {unreadCount > 0 && <span className={styles.bellBadge}>{unreadCount}</span>}
          </button>
          <Link href="/settings" className={styles.headerBtn} aria-label="Settings">
            <Icon name="settings" size={20} />
          </Link>
          <UserButton />
        </header>

        {/* ── Safe-to-Spend ── */}
        <SafeToSpendCard
          safeToSpend={safeToSpendData.safeToSpendToday}
          paceDelta={safeToSpendData.paceDelta}
          dateLabel={dateLabel}
          online={isOnline}
        />

        {/* ── Quick Add ── */}
        <QuickAdd templates={quickTemplates} onAdd={handleAdd} />

        {/* ── Recent Transactions ── */}
        <section className={styles.recentSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent</h2>
            <Link href="/transactions" className={styles.seeAll}>
              All <Icon name="chevron-right" size={14} />
            </Link>
          </div>

          <div className={styles.recentList}>
            {transactions === undefined ? (
              // Loading state
              <>
                <Skeleton.Card height="52px" style={{ marginBottom: "0.5rem" }} />
                <Skeleton.Card height="52px" style={{ marginBottom: "0.5rem" }} />
                <Skeleton.Card height="52px" />
              </>
            ) : recentTransactions.length === 0 ? (
              <div className={styles.recentEmpty}>
                <Icon name="list" size={32} color="var(--ink-faint)" />
                <p>No transactions yet</p>
                <p className={styles.recentEmptyHint}>Tap + to add your first one</p>
              </div>
            ) : (
              recentTransactions.map((txn) => {
                const cat = categoryMap.get(txn.categoryId ?? "");
                const isIncome = txn.type === "income";
                const catIconName = cat?.icon ?? (isIncome ? "arrow-up" : "arrow-down");
                return (
                  <Link
                    key={txn.id}
                    href="/transactions"
                    className={styles.recentRow}
                  >
                    <span
                      className={styles.recentIcon}
                      style={{
                        background: isIncome
                          ? "rgba(87, 217, 163, 0.12)"
                          : "rgba(255, 107, 90, 0.10)",
                      }}
                    >
                      <Icon
                        name={catIconName as any}
                        size={16}
                        color={isIncome ? "var(--ok)" : "var(--over)"}
                      />
                    </span>
                    <div className={styles.recentMeta}>
                      <span className={styles.recentCat}>{cat?.name ?? "Uncategorized"}</span>
                      {txn.note && (
                        <span className={styles.recentNote}>{txn.note}</span>
                      )}
                    </div>
                    <div className={styles.recentRight}>
                      <span
                        className={styles.recentAmount}
                        style={{ color: isIncome ? "var(--ok)" : "var(--over)" }}
                      >
                        {isIncome ? "+" : "−"}
                        {formatCents(txn.amountCents, currency, { symbol: true })}
                      </span>
                      <span className={styles.recentTime}>
                        {formatDistanceToNow(txn.date, { addSuffix: true })}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>
      </main>

      <FAB onClick={() => setShowForm(true)} />

      {showForm && (
        <TransactionForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            toast.success("Transaction added");
          }}
        />
      )}

      {showOnboarding && (
        <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
      )}

      {showNotifications && (
        <NotificationsInbox onClose={() => setShowNotifications(false)} />
      )}
    </>
  );
}
