"use client";

import { useMemo, useState, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
import { SafeToSpendCard } from "@/components/SafeToSpendCard/SafeToSpendCard";
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
  const { user, isLoaded } = useUser();
  const transactions = useTransactions();
  const recurringRules = useRecurringRules();
  const categories = useCategories();
  const safeToSpendData = useSafeToSpend();
  const isOnline = useOnlineStatus();
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [smartInput, setSmartInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const unreadCount = useUnreadNotificationsCount() ?? 0;

  useEffect(() => {
    if (recurringRules !== undefined && recurringRules.length === 0) {
      setShowOnboarding(true);
    }
  }, [recurringRules]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.lang = "en-US";
        rec.continuous = false;
        rec.interimResults = false;

        rec.onstart = () => {
          setIsListening(true);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        rec.onerror = (e: any) => {
          console.error("Speech recognition error:", e);
          setIsListening(false);
        };

        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setSmartInput(transcript);
            toast.success("Voice captured! Tap + to log.");
          }
        };

        setRecognition(rec);
      }
    }
  }, [toast]);

  function toggleListening() {
    if (!recognition) {
      toast.error("Voice logging not supported on this browser.");
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.error("Failed to start voice logging:", err);
      }
    }
  }

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

  async function handleSmartLog(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!smartInput.trim() || !user?.id || !categories) return;

    // Parse the input
    const match = smartInput.match(/\d+([.,]\d{1,2})?/);
    if (!match) {
      toast.error("Include an amount, e.g. '12 Karak'");
      return;
    }

    const amountStr = match[0];
    const amountCents = Math.round(parseFloat(amountStr.replace(",", ".")) * 100);
    const note = smartInput.replace(amountStr, "").trim();

    if (amountCents <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }

    // Determine category
    const noteLower = note.toLowerCase();
    let matchedCatId = "";
    
    // Quick keyword matcher (with Qatari specific entries)
    const keywords: Record<string, string[]> = {
      food: ["food", "dining", "coffee", "lunch", "dinner", "breakfast", "cafe", "restaurant", "mcdonalds", "starbucks", "tea", "karak", "snacks"],
      grocery: ["grocery", "groceries", "supermarket", "carrefour", "lulu", "spinneys", "foodstuff"],
      transport: ["transport", "car", "uber", "taxi", "petrol", "fuel", "gas", "metro", "bus", "parking", "karwa"],
      housing: ["rent", "mortgage", "housing", "room", "flat", "apartment"],
      utilities: ["utility", "utilities", "electricity", "water", "internet", "wifi", "bill", "phone", "mobile", "ooredoo", "vodafone", "kahramaa"],
      entertainment: ["movie", "netflix", "spotify", "game", "cinema", "show", "leisure", "fun", "subscription", "gym", "fitness"],
    };

    for (const [catKey, keys] of Object.entries(keywords)) {
      if (keys.some(k => noteLower.includes(k))) {
        const found = categories.find(c => {
          const nameLower = c.name.toLowerCase();
          return nameLower.includes(catKey) || catKey.includes(nameLower);
        });
        if (found) {
          matchedCatId = found.id;
          break;
        }
      }
    }

    // Default fallback: first expense category
    if (!matchedCatId) {
      const expenseCat = categories.find(c => c.kind === "expense");
      matchedCatId = expenseCat?.id || "other";
    }

    try {
      await createTransaction(user.id, {
        type: "expense",
        amountCents,
        currency,
        categoryId: matchedCatId,
        date: new Date(),
        note: note.trim() || "Quick expense",
      });

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(10);
      }

      toast.success(`Logged ${formatCents(amountCents, currency)} for "${note.trim() || "Expense"}"`);
      setSmartInput("");
    } catch {
      toast.error("Failed to log transaction");
    }
  }

  // 3 most recent transactions
  const recentTransactions = useMemo(
    () => (transactions ?? []).slice(0, 3),
    [transactions]
  );

  const currency = useCurrency();

  if (!isLoaded || recurringRules === undefined) {
    return (
      <div className={styles.loadingSplash}>
        <div className={styles.splashBrand}>▸ MIZAN</div>
        <div className={styles.splashSpinner} />
      </div>
    );
  }

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

        {/* ── Smart Log Bar ── */}
        <form onSubmit={handleSmartLog} className={styles.smartLogWrap}>
          <div className={styles.smartLogInputBar}>
            <Icon name="sparkles" size={18} color="var(--electric)" />
            <input
              type="text"
              placeholder="Quick log... e.g. '10 Karak' or '150 Lulu'"
              className={styles.smartLogInput}
              value={smartInput}
              onChange={(e) => setSmartInput(e.target.value)}
            />
            {recognition && (
              <button
                type="button"
                className={`${styles.micBtn} ${isListening ? styles.listening : ""}`}
                onClick={toggleListening}
                aria-label="Start voice logging"
              >
                <Icon name={isListening ? "mic-off" : "mic"} size={16} />
              </button>
            )}
            <button type="submit" className={styles.smartLogSubmit} aria-label="Log transaction">
              <Icon name="plus" size={16} />
            </button>
          </div>
          <div className={styles.smartLogHints}>
            <span className={styles.hintLabel}>Try:</span>
            <button type="button" className={styles.smartLogHintChip} onClick={() => setSmartInput("10 Karak")}>
              "10 Karak"
            </button>
            <button type="button" className={styles.smartLogHintChip} onClick={() => setSmartInput("35 Uber")}>
              "35 Uber"
            </button>
            <button type="button" className={styles.smartLogHintChip} onClick={() => setSmartInput("180 Lulu")}>
              "180 Lulu"
            </button>
          </div>
        </form>

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
