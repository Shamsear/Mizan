"use client";

import { useState, useRef, useId, useEffect } from "react";
import { createPortal } from "react-dom";
import { useUser } from "@clerk/nextjs";
import { db } from "@/lib/db/dexie";
import { useCategories, useSettings } from "@/lib/db/hooks";
import { addMonths } from "date-fns";
import { Icon } from "@/components/Icon/Icon";
import { useToast } from "@/components/Toast/Toast";
import { getCurrencySymbol } from "@/lib/currency";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./OnboardingWizard.module.css";

/* ─── Interfaces ──────────────────────────────────────────────────────────── */
interface BillRow {
  id: string;
  label: string;
  amount: string;
}

interface OnboardingWizardProps {
  onComplete: () => void;
}

/* ─── Step illustrations (inline SVG art, no emoji) ─────────────────────── */
function WelcomeIllustration() {
  return (
    <svg viewBox="0 0 120 80" className={styles.illustration} aria-hidden="true">
      {/* Runway strip */}
      <rect x="20" y="60" width="80" height="8" rx="2" fill="var(--panel-line)" />
      <rect x="54" y="62" width="12" height="4" rx="1" fill="var(--panel)" />
      {/* Dashes */}
      <rect x="25" y="63.5" width="8" height="1" rx="0.5" fill="var(--ink-faint)" />
      <rect x="87" y="63.5" width="8" height="1" rx="0.5" fill="var(--ink-faint)" />
      {/* Plane body */}
      <path d="M38 58 L65 48 L75 50 L65 55 Z" fill="var(--electric)" opacity="0.9" />
      <path d="M65 48 L72 38 L76 42 L75 50 Z" fill="var(--electric)" opacity="0.6" />
      <path d="M65 55 L70 62 L75 60 L75 50 Z" fill="var(--electric)" opacity="0.6" />
      {/* Glow */}
      <ellipse cx="62" cy="52" rx="20" ry="8" fill="var(--electric)" opacity="0.08" />
      {/* Stars */}
      <circle cx="90" cy="20" r="1.5" fill="var(--amber)" opacity="0.8" />
      <circle cx="30" cy="30" r="1" fill="var(--amber)" opacity="0.6" />
      <circle cx="100" cy="40" r="1" fill="var(--electric)" opacity="0.7" />
      <circle cx="15" cy="50" r="1.5" fill="var(--electric)" opacity="0.5" />
    </svg>
  );
}

function IncomeIllustration() {
  return (
    <svg viewBox="0 0 120 80" className={styles.illustration} aria-hidden="true">
      <rect x="20" y="55" width="14" height="20" rx="2" fill="var(--ok)" opacity="0.6" />
      <rect x="40" y="42" width="14" height="33" rx="2" fill="var(--ok)" opacity="0.75" />
      <rect x="60" y="30" width="14" height="45" rx="2" fill="var(--ok)" opacity="0.85" />
      <rect x="80" y="18" width="14" height="57" rx="2" fill="var(--ok)" />
      <path d="M20 58 L40 45 L60 33 L80 21" stroke="var(--ok)" strokeWidth="1.5" fill="none" strokeDasharray="3 2" />
      <circle cx="80" cy="21" r="3" fill="var(--ok)" />
      <ellipse cx="70" cy="75" rx="40" ry="3" fill="var(--panel-line)" />
    </svg>
  );
}

function BillsIllustration() {
  return (
    <svg viewBox="0 0 120 80" className={styles.illustration} aria-hidden="true">
      {/* Calendar */}
      <rect x="20" y="15" width="80" height="60" rx="4" fill="var(--panel-2)" stroke="var(--panel-line)" strokeWidth="1" />
      <rect x="20" y="15" width="80" height="18" rx="4" fill="var(--electric)" opacity="0.8" />
      <rect x="20" y="25" width="80" height="8" rx="0" fill="var(--electric)" opacity="0.8" />
      {/* Calendar dots */}
      <circle cx="35" cy="48" r="3.5" fill="var(--over)" opacity="0.9" />
      <circle cx="52" cy="48" r="3.5" fill="var(--panel-line)" />
      <circle cx="69" cy="48" r="3.5" fill="var(--panel-line)" />
      <circle cx="86" cy="48" r="3.5" fill="var(--panel-line)" />
      <circle cx="35" cy="63" r="3.5" fill="var(--electric)" opacity="0.6" />
      <circle cx="52" cy="63" r="3.5" fill="var(--panel-line)" />
      <circle cx="69" cy="63" r="3.5" fill="var(--panel-line)" />
      {/* Header circles */}
      <circle cx="30" cy="12" r="3" fill="var(--panel-2)" stroke="var(--electric)" strokeWidth="1.5" />
      <circle cx="90" cy="12" r="3" fill="var(--panel-2)" stroke="var(--electric)" strokeWidth="1.5" />
    </svg>
  );
}

function GoalIllustration() {
  return (
    <svg viewBox="0 0 120 80" className={styles.illustration} aria-hidden="true">
      {/* Target circles */}
      <circle cx="60" cy="40" r="35" fill="none" stroke="var(--panel-line)" strokeWidth="1.5" />
      <circle cx="60" cy="40" r="26" fill="none" stroke="var(--electric)" strokeWidth="1.5" opacity="0.4" />
      <circle cx="60" cy="40" r="17" fill="none" stroke="var(--electric)" strokeWidth="1.5" opacity="0.65" />
      <circle cx="60" cy="40" r="8" fill="var(--electric)" opacity="0.9" />
      <circle cx="60" cy="40" r="4" fill="var(--ink)" />
      {/* Crosshair lines */}
      <line x1="60" y1="2" x2="60" y2="14" stroke="var(--electric)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="60" y1="66" x2="60" y2="78" stroke="var(--electric)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="2" y1="40" x2="14" y2="40" stroke="var(--electric)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="106" y1="40" x2="118" y2="40" stroke="var(--electric)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { user } = useUser();
  const router = useRouter();
  const categories = useCategories();
  const settings = useSettings();
  const toast = useToast();
  const uid = useId();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 2 — Income
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeFrequency, setIncomeFrequency] = useState<"monthly" | "biweekly" | "weekly">("monthly");
  const [incomeError, setIncomeError] = useState("");

  // Step 3 — Bills (dynamic list)
  const [bills, setBills] = useState<BillRow[]>([
    { id: "bill-0", label: "Rent / Mortgage", amount: "" },
  ]);
  const [billError, setBillError] = useState("");

  // Step 4 — Goal
  const [goalName, setGoalName] = useState("Emergency Fund");
  const [goalAmount, setGoalAmount] = useState("");
  const [goalMonths, setGoalMonths] = useState(6);

  const currency = settings?.baseCurrency ?? "QAR";
  const currencySymbol = getCurrencySymbol(currency);
  const salaryCategory = categories?.find((c) => c.name === "Salary");
  const housingCategory = categories?.find((c) => c.name === "Housing");

  function navigate(to: 1 | 2 | 3 | 4, dir: "forward" | "back") {
    setDirection(dir);
    setStep(to);
  }

  /* ── Step 2: Save Income ── */
  async function handleIncomeSubmit() {
    const cents = Math.round(parseFloat(incomeAmount.replace(/,/g, "")) * 100);
    if (!incomeAmount || isNaN(cents) || cents <= 0) {
      setIncomeError("Please enter a valid amount");
      return;
    }
    setIncomeError("");

    // Guest onboarding path: just navigate forward
    if (!user?.id) {
      navigate(3, "forward");
      return;
    }

    if (!salaryCategory) {
      toast.error("Setup data not ready. Please try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const nextMonth = addMonths(now, 1);
      nextMonth.setDate(1);
      const cadenceMap = { monthly: "monthly", biweekly: "biweekly", weekly: "weekly" } as const;

      await db.recurringRules.add({
        id: `${Date.now()}-income`,
        userId: user.id,
        label: "Monthly Salary",
        amountCents: cents,
        currency,
        type: "income",
        categoryId: salaryCategory.id,
        cadence: cadenceMap[incomeFrequency],
        nextDueDate: nextMonth,
        autoPost: true,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        dirty: true,
      });

      navigate(3, "forward");
    } catch {
      toast.error("Failed to save income. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ── Step 3: Save Bills ── */
  async function handleBillsSubmit() {
    const filledBills = bills.filter((b) => b.label.trim() && b.amount.trim());
    if (filledBills.length === 0) {
      setBillError("Please add at least one bill, or skip this step.");
      return;
    }
    setBillError("");

    // Guest onboarding path: just navigate forward
    if (!user?.id) {
      navigate(4, "forward");
      return;
    }

    if (!housingCategory) {
      toast.error("Setup data not ready.");
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const nextMonth = addMonths(now, 1);
      nextMonth.setDate(1);

      await Promise.all(
        filledBills.map((bill, i) => {
          const cents = Math.round(parseFloat(bill.amount.replace(/,/g, "")) * 100);
          if (isNaN(cents) || cents <= 0) return Promise.resolve();
          return db.recurringRules.add({
            id: `${Date.now()}-bill-${i}`,
            userId: user.id,
            label: bill.label || "Bill",
            amountCents: cents,
            currency,
            type: "expense",
            categoryId: housingCategory.id,
            cadence: "monthly",
            nextDueDate: new Date(nextMonth),
            autoPost: true,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
            dirty: true,
          });
        })
      );

      navigate(4, "forward");
    } catch {
      toast.error("Failed to save bills. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ── Step 4: Save Goal ── */
  async function handleGoalSubmit() {
    const cents = Math.round(parseFloat(goalAmount.replace(/,/g, "")) * 100);
    if (!goalName.trim() || isNaN(cents) || cents <= 0) return;
    if (!user?.id) {
      const setupData = {
        incomeAmount,
        incomeFrequency,
        bills,
        goalName,
        goalAmount,
        goalMonths,
      };
      localStorage.setItem("mizan_onboarding_temp", JSON.stringify(setupData));
      router.push("/sign-up");
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      await db.goals.add({
        id: `${Date.now()}-goal`,
        userId: user.id,
        name: goalName.trim(),
        targetCents: cents,
        savedCents: 0,
        targetDate: addMonths(now, goalMonths),
        currency,
        priority: 1,
        icon: "target",
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        dirty: true,
      });
      onComplete();
    } catch {
      toast.error("Failed to save goal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ── Bill list helpers ── */
  function addBillRow() {
    setBills((prev) => [...prev, { id: `bill-${Date.now()}`, label: "", amount: "" }]);
  }

  function removeBillRow(id: string) {
    setBills((prev) => prev.filter((b) => b.id !== id));
  }

  function updateBill(id: string, field: "label" | "amount", value: string) {
    setBills((prev) => prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
  }

  /* ── Render ── */
  const TOTAL_STEPS = 4;
  const slideClass = direction === "forward" ? styles.slideForward : styles.slideBack;

  if (!mounted) return null;

  return createPortal(
    <div className={styles.overlay} aria-modal="true" role="dialog" aria-label="Setup wizard">
      <div className={`${styles.screen} ${slideClass}`} key={step}>

        {/* ── Top bar ── */}
        <div className={styles.topBar}>
          {step > 1 && (
            <button
              className={styles.backBtn}
              onClick={() => navigate((step - 1) as 1 | 2 | 3 | 4, "back")}
              aria-label="Go back"
            >
              <Icon name="chevron-left" size={20} />
            </button>
          )}
          <div className={styles.wordmark}>▸ MIZAN</div>
          {step > 1 && (
            <button className={styles.closeBtn} onClick={onComplete} aria-label="Skip setup">
              <Icon name="x" size={18} />
            </button>
          )}
        </div>

        {/* ── Step dots ── */}
        <div className={styles.dots} role="progressbar" aria-valuenow={step} aria-valuemax={TOTAL_STEPS}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <span
              key={i}
              className={`${styles.dot} ${i + 1 <= step ? styles.dotActive : ""}`}
            />
          ))}
        </div>

        {/* ──────────── STEP 1: WELCOME ──────────── */}
        {step === 1 && (
          <div className={styles.stepContent}>
            <WelcomeIllustration />
            <h1 className={styles.headline}>Know your<br />balance.</h1>
            <p className={styles.body}>
              Tell us about your income and bills — we'll calculate exactly how much is safe to spend each day.
            </p>
            <button className={styles.primaryBtn} onClick={() => navigate(2, "forward")}>
              Get started
              <Icon name="chevron-right" size={18} />
            </button>
            {!user?.id && (
              <div className={styles.signInPrompt}>
                Already have an account? <Link href="/sign-in" className={styles.signInLink}>Sign in</Link>
              </div>
            )}
          </div>
        )}

        {/* ──────────── STEP 2: INCOME ──────────── */}
        {step === 2 && (
          <div className={styles.stepContent}>
            <IncomeIllustration />
            <h2 className={styles.headline}>What comes in<br />each month?</h2>
            <p className={styles.body}>Your monthly take-home salary (tax-free in Qatar)</p>

            <div className={styles.amountField}>
              <span className={styles.currencyMark}>{currencySymbol}</span>
              <input
                id={`${uid}-income`}
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="0.00"
                className={styles.bigInput}
                value={incomeAmount}
                onChange={(e) => { setIncomeAmount(e.target.value); setIncomeError(""); }}
                autoFocus
              />
            </div>
            {incomeError && <p className={styles.fieldError}>{incomeError}</p>}

            <div className={styles.freqToggle}>
              {(["monthly", "biweekly", "weekly"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`${styles.freqBtn} ${incomeFrequency === f ? styles.freqActive : ""}`}
                  onClick={() => setIncomeFrequency(f)}
                >
                  {f === "biweekly" ? "Bi-weekly" : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            <button
              className={styles.primaryBtn}
              onClick={handleIncomeSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Continue"}
              {!isSubmitting && <Icon name="chevron-right" size={18} />}
            </button>
            <button className={styles.ghostBtn} onClick={() => navigate(3, "forward")}>
              Skip for now
            </button>
          </div>
        )}

        {/* ──────────── STEP 3: BILLS ──────────── */}
        {step === 3 && (
          <div className={styles.stepContent}>
            <BillsIllustration />
            <h2 className={styles.headline}>What goes out<br />each month?</h2>
            <p className={styles.body}>Rent, subscriptions, utilities — your fixed costs</p>

            <div className={styles.billList}>
              {bills.map((bill) => (
                <div key={bill.id} className={styles.billRow}>
                  <input
                    type="text"
                    placeholder="Rent / Mortgage"
                    className={styles.billLabel}
                    value={bill.label}
                    onChange={(e) => updateBill(bill.id, "label", e.target.value)}
                  />
                  <div className={styles.billAmountWrap}>
                    <span className={styles.billCurrencyMark}>{currencySymbol}</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      placeholder="0.00"
                      className={styles.billAmount}
                      value={bill.amount}
                      onChange={(e) => updateBill(bill.id, "amount", e.target.value)}
                    />
                  </div>
                  {bills.length > 1 && (
                    <button
                      type="button"
                      className={styles.removeBillBtn}
                      onClick={() => removeBillRow(bill.id)}
                      aria-label="Remove bill"
                    >
                      <Icon name="x" size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className={styles.addBillBtn} onClick={addBillRow}>
                <Icon name="plus" size={16} />
                Add another bill
              </button>
            </div>

            {billError && <p className={styles.fieldError}>{billError}</p>}

            <button
              className={styles.primaryBtn}
              onClick={handleBillsSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Continue"}
              {!isSubmitting && <Icon name="chevron-right" size={18} />}
            </button>
            <button className={styles.ghostBtn} onClick={() => navigate(4, "forward")}>
              Skip for now
            </button>
          </div>
        )}

        {/* ──────────── STEP 4: GOAL ──────────── */}
        {step === 4 && (
          <div className={styles.stepContent}>
            <GoalIllustration />
            <h2 className={styles.headline}>Any savings<br />goals?</h2>
            <p className={styles.body}>We'll factor daily contributions into your target balance.</p>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Goal name</label>
              <input
                type="text"
                placeholder="Emergency Fund"
                className={styles.textInput}
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Target amount</label>
              <div className={styles.amountField}>
                <span className={styles.currencyMark}>{currencySymbol}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  placeholder="0.00"
                  className={styles.bigInput}
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Timeframe</label>
              <div className={styles.stepper}>
                <button
                  type="button"
                  className={styles.stepperBtn}
                  onClick={() => setGoalMonths((m) => Math.max(1, m - 1))}
                  aria-label="Decrease months"
                >
                  <Icon name="minus" size={16} />
                </button>
                <span className={styles.stepperValue}>{goalMonths} months</span>
                <button
                  type="button"
                  className={styles.stepperBtn}
                  onClick={() => setGoalMonths((m) => Math.min(120, m + 1))}
                  aria-label="Increase months"
                >
                  <Icon name="plus" size={16} />
                </button>
              </div>
            </div>

            <button
              className={styles.primaryBtn}
              onClick={handleGoalSubmit}
              disabled={isSubmitting || !goalName.trim() || !goalAmount}
            >
              {isSubmitting ? "Saving..." : "Finish setup"}
              {!isSubmitting && <Icon name="sparkles" size={18} />}
            </button>
            <button className={styles.ghostBtn} onClick={onComplete}>
              Set up later
            </button>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}
