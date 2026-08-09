"use client";

import { useState, useRef, useId, useEffect } from "react";
import { createPortal } from "react-dom";
import { useUser } from "@clerk/nextjs";
import { db } from "@/lib/db/dexie";
import { useCategories, useSettings } from "@/lib/db/hooks";
import { addMonths } from "date-fns";
import { Icon } from "@/components/Icon/Icon";
import { useToast } from "@/components/Toast/Toast";
import { getCurrencySymbol, SUPPORTED_CURRENCIES, QAR_EXCHANGE_RATES } from "@/lib/currency";
import { updateSettings } from "@/lib/db/repository";
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

function ProfileIllustration() {
  return (
    <svg viewBox="0 0 120 80" className={styles.illustration} aria-hidden="true">
      <circle cx="60" cy="40" r="28" fill="var(--electric)" opacity="0.06" />
      <circle cx="45" cy="40" r="10" stroke="var(--electric)" strokeWidth="1.5" fill="none" />
      <path d="M35 56 A10 10 0 0 1 55 56" stroke="var(--electric)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <circle cx="75" cy="40" r="10" stroke="var(--amber)" strokeWidth="1.5" fill="none" />
      <path d="M65 56 A10 10 0 0 1 85 56" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <line x1="60" y1="20" x2="60" y2="60" stroke="var(--panel-line)" strokeWidth="1" strokeDasharray="2 2" />
    </svg>
  );
}

function WorkerIllustration() {
  return (
    <svg viewBox="0 0 120 80" className={styles.illustration} aria-hidden="true">
      <circle cx="60" cy="40" r="28" fill="var(--electric)" opacity="0.06" />
      <rect x="42" y="24" width="36" height="42" rx="3" stroke="var(--ink)" strokeWidth="1.75" fill="var(--panel-2)" />
      <rect x="52" y="20" width="16" height="6" rx="1.5" stroke="var(--ink)" strokeWidth="1.75" fill="var(--panel)" />
      <line x1="48" y1="36" x2="64" y2="36" stroke="var(--electric)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="48" y1="44" x2="72" y2="44" stroke="var(--ink-faint)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="48" y1="52" x2="68" y2="52" stroke="var(--ink-faint)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function JobSeekerIllustration() {
  return (
    <svg viewBox="0 0 120 80" className={styles.illustration} aria-hidden="true">
      <circle cx="60" cy="40" r="28" fill="var(--amber)" opacity="0.06" />
      <circle cx="55" cy="35" r="14" stroke="var(--amber)" strokeWidth="2" fill="none" />
      <line x1="65" y1="45" x2="80" y2="60" stroke="var(--amber)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="52" cy="30" r="1.5" fill="var(--electric)" />
      <circle cx="60" cy="36" r="1" fill="var(--electric)" />
    </svg>
  );
}

function IncomeIllustration() {
  return (
    <svg viewBox="0 0 120 80" className={styles.illustration} aria-hidden="true">
      {/* Outer ambient glow */}
      <circle cx="60" cy="40" r="28" fill="var(--ok)" opacity="0.06" />
      {/* Coin base */}
      <circle cx="60" cy="40" r="20" stroke="var(--ok)" strokeWidth="1.75" fill="var(--panel-2)" />
      {/* Mechanical inner ring */}
      <circle cx="60" cy="40" r="14" stroke="var(--ok)" strokeWidth="1" strokeDasharray="2 2" fill="none" opacity="0.4" />
      {/* Unified upward trending arrow */}
      <path d="M52 48 L68 32 M58 32 H68 V42" stroke="var(--ok)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
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

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Role profile selection
  const [profileType, setProfileType] = useState<"worker" | "jobseeker">("worker");

  // Step 3 (Worker) — Income
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeFrequency, setIncomeFrequency] = useState<"monthly" | "biweekly" | "weekly">("monthly");
  const [incomeError, setIncomeError] = useState("");

  // Step 3 (Job Seeker) — Savings & Visa
  const [jsSavingsAmount, setJsSavingsAmount] = useState("");
  const [jsHomeCurrency, setJsHomeCurrency] = useState("INR");
  const [jsVisaDays, setJsVisaDays] = useState<number>(90);
  const [jsCustomVisaDays, setJsCustomVisaDays] = useState("");
  const [jsSavingsError, setJsSavingsError] = useState("");

  // Step 4 (Worker) — Bills (dynamic list)
  const [bills, setBills] = useState<BillRow[]>([
    { id: "bill-0", label: "Rent", amount: "" },
  ]);
  const [billError, setBillError] = useState("");

  // Step 4 (Job Seeker) — Budget Preset Selection
  const [jsBudgetPreset, setJsBudgetPreset] = useState<"survival" | "standard" | "comfortable" | "custom">("survival");
  const [customRent, setCustomRent] = useState("500");
  const [customFood, setCustomFood] = useState("300");
  const [customTransport, setCustomTransport] = useState("100");
  const [customData, setCustomData] = useState("50");
  const [customMisc, setCustomMisc] = useState("50");

  // Step 5 (Worker) — Goal
  const [goalName, setGoalName] = useState("Emergency Fund");
  const [goalAmount, setGoalAmount] = useState("");
  const [goalMonths, setGoalMonths] = useState(6);

  const currency = settings?.baseCurrency ?? "QAR";
  const currencySymbol = getCurrencySymbol(currency);
  const salaryCategory = categories?.find((c) => c.name === "Salary");
  const housingCategory = categories?.find((c) => c.name === "Housing");

  function navigate(to: 1 | 2 | 3 | 4 | 5, dir: "forward" | "back") {
    setDirection(dir);
    setStep(to);
  }

  // Dual Currency calculations for Job Seeker UI
  const exchangeRate = QAR_EXCHANGE_RATES[jsHomeCurrency] || 1.0;
  const jsSavingsCents = Math.round(parseFloat(jsSavingsAmount.replace(/,/g, "")) * 100) || 0;
  const jsSavingsQAR = Math.round((jsSavingsCents / exchangeRate)); // in cents

  // Custom preset calculations
  const parsedRent = parseFloat(customRent) || 0;
  const parsedFood = parseFloat(customFood) || 0;
  const parsedTransport = parseFloat(customTransport) || 0;
  const parsedData = parseFloat(customData) || 0;
  const parsedMisc = parseFloat(customMisc) || 0;
  const customTotal = parsedRent + parsedFood + parsedTransport + parsedData + parsedMisc;

  // Presets definition
  const presets = {
    survival: { rent: 450, food: 200, transport: 70, data: 30, total: 750, name: "Survival Mode" },
    standard: { rent: 900, food: 400, transport: 200, data: 100, total: 1600, name: "Standard Mode" },
    comfortable: { rent: 1800, food: 700, transport: 400, data: 100, total: 3000, name: "Comfortable Mode" },
    custom: { rent: parsedRent, food: parsedFood, transport: parsedTransport, data: parsedData, total: customTotal, name: "Custom Mode" },
  };

  /* ── Step 3 (Worker): Save Income ── */
  async function handleIncomeSubmit() {
    const cents = Math.round(parseFloat(incomeAmount.replace(/,/g, "")) * 100);
    if (!incomeAmount || isNaN(cents) || cents <= 0) {
      setIncomeError("Please enter a valid amount");
      return;
    }
    setIncomeError("");

    if (!user?.id) {
      navigate(4, "forward");
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

      navigate(4, "forward");
    } catch {
      toast.error("Failed to save income. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ── Step 3 (Job Seeker): Save Savings/Visa Setup ── */
  async function handleJsSetupSubmit() {
    if (!jsSavingsAmount || jsSavingsCents <= 0) {
      setJsSavingsError("Please enter your current savings");
      return;
    }
    setJsSavingsError("");
    navigate(4, "forward");
  }

  /* ── Step 4 (Worker): Save Bills ── */
  async function handleBillsSubmit() {
    const filledBills = bills.filter((b) => b.label.trim() && b.amount.trim());
    if (filledBills.length === 0) {
      setBillError("Please add at least one bill, or skip this step.");
      return;
    }
    setBillError("");

    if (!user?.id) {
      navigate(5, "forward");
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

      navigate(5, "forward");
    } catch {
      toast.error("Failed to save bills. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ── Step 4 (Job Seeker): Save Preset ── */
  async function handleJsPresetSubmit() {
    navigate(5, "forward");
  }

  /* ── Step 5 (Worker): Save Goal & Finish ── */
  async function handleGoalSubmit() {
    const cents = Math.round(parseFloat(goalAmount.replace(/,/g, "")) * 100);
    if (!goalName.trim() || isNaN(cents) || cents <= 0) return;
    
    if (!user?.id) {
      const setupData = {
        profileType: "worker",
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

      // Save profile type to settings
      await updateSettings(user.id, {
        profileType: "worker",
      });

      onComplete();
    } catch {
      toast.error("Failed to save goal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ── Step 5 (Job Seeker): Save All & Finish ── */
  async function handleJsFinishSubmit() {
    const visaDays = jsVisaDays === 0 ? parseInt(jsCustomVisaDays) || 30 : jsVisaDays;
    
    if (!user?.id) {
      // Save data for guest signup transition
      const setupData = {
        profileType: "jobseeker",
        qatarSavingsCents: jsSavingsCents,
        qatarVisaDays: visaDays,
        qatarHomeCurrency: jsHomeCurrency,
        qatarExchangeRate: exchangeRate,
        qatarBudgetPreset: jsBudgetPreset,
        qatarCustomRent: presets[jsBudgetPreset].rent,
        qatarCustomFood: presets[jsBudgetPreset].food,
        qatarCustomTransport: presets[jsBudgetPreset].transport,
        qatarCustomData: presets[jsBudgetPreset].data,
        qatarCustomMisc: jsBudgetPreset === "custom" ? parsedMisc : 50,
      };
      localStorage.setItem("mizan_onboarding_temp", JSON.stringify(setupData));
      router.push("/sign-up");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Update Settings with Job Seeker fields
      const presetData = presets[jsBudgetPreset];
      const miscVal = jsBudgetPreset === "custom" ? parsedMisc : 50;
      await updateSettings(user.id, {
        profileType: "jobseeker",
        baseCurrency: "QAR",
        qatarSavingsCents: jsSavingsQAR, // convert to QAR cents
        qatarVisaDays: visaDays,
        qatarHomeCurrency: jsHomeCurrency,
        qatarExchangeRate: exchangeRate,
        qatarBudgetPreset: jsBudgetPreset,
        qatarCustomRentCents: presetData.rent * 100,
        qatarCustomFoodCents: presetData.food * 100,
        qatarCustomTransportCents: presetData.transport * 100,
        qatarCustomDataCents: presetData.data * 100,
        qatarCustomMiscCents: miscVal * 100, // CVs and Job Hunting miscellaneous
      });

      // 2. Set up initial transactions for their capital injection if they have transactions empty
      const txnsCount = await db.transactions.where("userId").equals(user.id).count();
      if (txnsCount === 0) {
        const now = new Date();
        await db.transactions.add({
          id: `${Date.now()}-savings-capital`,
          userId: user.id,
          type: "income",
          amountCents: jsSavingsQAR,
          currency: "QAR",
          categoryId: "income",
          note: `Initial job seeker savings (${jsSavingsAmount} ${jsHomeCurrency})`,
          date: now,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          dirty: true,
        });
      }

      onComplete();
      router.push("/qatar-runway");
    } catch (e) {
      console.error(e);
      toast.error("Failed to complete setup. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Check if we already have onboarding data stored from when they were a guest, and import it if now logged in
  useEffect(() => {
    if (user?.id) {
      const guestDataStr = localStorage.getItem("mizan_onboarding_temp");
      if (guestDataStr) {
        try {
          const guestData = JSON.parse(guestDataStr);
          if (guestData.profileType === "jobseeker") {
            setProfileType("jobseeker");
            setJsSavingsAmount((guestData.qatarSavingsCents / 100).toString());
            setJsHomeCurrency(guestData.qatarHomeCurrency || "INR");
            setJsVisaDays(guestData.qatarVisaDays || 90);
            setJsBudgetPreset(guestData.qatarBudgetPreset || "survival");
            setStep(5); // Go directly to final step J5 for confirmation
          } else {
            setProfileType("worker");
            setIncomeAmount(guestData.incomeAmount || "");
            setIncomeFrequency(guestData.incomeFrequency || "monthly");
            if (guestData.bills) setBills(guestData.bills);
            setGoalName(guestData.goalName || "Emergency Fund");
            setGoalAmount(guestData.goalAmount || "");
            setGoalMonths(guestData.goalMonths || 6);
            setStep(5); // Go to final step for confirmation
          }
          localStorage.removeItem("mizan_onboarding_temp");
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [user]);

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
  const TOTAL_STEPS = 5;
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
              onClick={() => navigate((step - 1) as any, "back")}
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
            <h1 className={styles.headline}>Know your balance.</h1>
            <p className={styles.body}>
              Tell us about your finances — Mizan helps you stay within limits, roll over unused budget, and maximize your savings.
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

        {/* ──────────── STEP 2: PROFILE SELECTION (NEW) ──────────── */}
        {step === 2 && (
          <div className={styles.stepContent}>
            <ProfileIllustration />
            <h2 className={styles.headline}>Choose your path in Qatar</h2>
            <p className={styles.body}>Tell us how you plan to use Mizan to track your budget.</p>

            <div className={styles.profileSelectorGrid}>
              <div
                className={`${styles.profileCard} ${profileType === "worker" ? styles.profileCardActive : ""}`}
                onClick={() => setProfileType("worker")}
                id="profile-worker"
              >
                <span className={styles.profileIconWrap}>
                  <Icon name="briefcase" size={24} />
                </span>
                <div className={styles.profileTextWrap}>
                  <span className={styles.profileCardTitle}>Regular Worker / Resident</span>
                  <span className={styles.profileCardDesc}>
                    I live or work here. I want to budget monthly salary and track fixed monthly bills.
                  </span>
                </div>
              </div>

              <div
                className={`${styles.profileCard} ${profileType === "jobseeker" ? styles.profileCardActive : ""}`}
                onClick={() => setProfileType("jobseeker")}
                id="profile-jobseeker"
              >
                <span className={styles.profileIconWrap} style={{ color: "var(--amber)", background: "rgba(245, 158, 11, 0.1)" }}>
                  <Icon name="target" size={24} />
                </span>
                <div className={styles.profileTextWrap}>
                  <span className={styles.profileCardTitle}>Job Seeker (Limited Budget)</span>
                  <span className={styles.profileCardDesc}>
                    I recently arrived in Qatar. I want to map my savings to cost of living and calculate my survival runway.
                  </span>
                </div>
              </div>
            </div>

            <button className={styles.primaryBtn} onClick={() => navigate(3, "forward")}>
              Continue
              <Icon name="chevron-right" size={18} />
            </button>
          </div>
        )}

        {/* ──────────── STEP 3: WORKER INCOME OR JOB SEEKER SAVINGS ──────────── */}
        {step === 3 && profileType === "worker" && (
          <div className={styles.stepContent}>
            <IncomeIllustration />
            <h2 className={styles.headline}>What comes in each month?</h2>
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
            <button className={styles.ghostBtn} onClick={() => navigate(4, "forward")}>
              Skip for now
            </button>
          </div>
        )}

        {step === 3 && profileType === "jobseeker" && (
          <div className={styles.stepContent}>
            <JobSeekerIllustration />
            <h2 className={styles.headline}>What are your current savings?</h2>
            <p className={styles.body}>We'll use this to calculate how many days you can survive in Qatar.</p>

            <div className={styles.inlineSelectWrap}>
              <select
                className={styles.inlineSelect}
                value={jsHomeCurrency}
                onChange={(e) => setJsHomeCurrency(e.target.value)}
                aria-label="Select home currency"
              >
                {Object.keys(QAR_EXCHANGE_RATES).map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="Savings amount"
                className={`${styles.bigInput} ${styles.inlineInput}`}
                value={jsSavingsAmount}
                onChange={(e) => { setJsSavingsAmount(e.target.value); setJsSavingsError(""); }}
                autoFocus
              />
            </div>
            {jsSavingsError && <p className={styles.fieldError}>{jsSavingsError}</p>}

            {/* Dynamic currency display */}
            {jsSavingsAmount && jsHomeCurrency !== "QAR" && (
              <div className={styles.conversionSubtitle}>
                ≈ QR {(jsSavingsQAR / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} QAR
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Your Visa Expiry / Target Days</label>
              <div className={styles.visaDurationSelect}>
                {([30, 60, 90, 0] as const).map((days) => (
                  <button
                    key={days}
                    type="button"
                    className={`${styles.visaDurationBtn} ${jsVisaDays === days ? styles.visaDurationBtnActive : ""}`}
                    onClick={() => setJsVisaDays(days)}
                  >
                    {days === 0 ? "Custom" : `${days} Days`}
                  </button>
                ))}
              </div>
              
              {jsVisaDays === 0 && (
                <input
                  type="number"
                  placeholder="Enter custom visa days"
                  className={styles.textInput}
                  value={jsCustomVisaDays}
                  onChange={(e) => setJsCustomVisaDays(e.target.value)}
                  style={{ marginTop: "-0.5rem" }}
                />
              )}
            </div>

            <button
              className={styles.primaryBtn}
              onClick={handleJsSetupSubmit}
            >
              Continue
              <Icon name="chevron-right" size={18} />
            </button>
          </div>
        )}

        {/* ──────────── STEP 4: WORKER BILLS OR JOB SEEKER PRESETS ──────────── */}
        {step === 4 && profileType === "worker" && (
          <div className={styles.stepContent}>
            <BillsIllustration />
            <h2 className={styles.headline}>What goes out each month?</h2>
            <p className={styles.body}>Rent, subscriptions, utilities — your fixed costs</p>

            <div className={styles.billList}>
              {bills.map((bill) => (
                <div key={bill.id} className={styles.billRow}>
                  <input
                    type="text"
                    placeholder="Rent"
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
            <button className={styles.ghostBtn} onClick={() => navigate(5, "forward")}>
              Skip for now
            </button>
          </div>
        )}

        {step === 4 && profileType === "jobseeker" && (
          <div className={styles.stepContent}>
            <BillsIllustration />
            <h2 className={styles.headline}>Select your survival budget</h2>
            <p className={styles.body}>Based on realistic cost of living in Qatar. You can adjust details later.</p>

            <div className={styles.presetSelectorGrid}>
              {(["survival", "standard", "comfortable", "custom"] as const).map((presetKey) => {
                const preset = presets[presetKey];
                const presetTotal = preset.total;
                const cardDailyBurn = presetTotal > 0 ? (presetTotal * 100) / 30 : 1;
                const cardRunwayDays = Math.floor(jsSavingsQAR / cardDailyBurn);

                return (
                  <div
                    key={presetKey}
                    className={`${styles.presetCard} ${jsBudgetPreset === presetKey ? styles.presetCardActive : ""}`}
                    onClick={() => setJsBudgetPreset(presetKey)}
                  >
                    <div className={styles.presetHeader}>
                      <span className={styles.presetName}>{preset.name}</span>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
                        <span className={styles.presetCost}>QR {presetTotal} / mo</span>
                        <span style={{ fontSize: "10px", color: "var(--electric)", fontWeight: 600 }}>
                          {cardRunwayDays} Days Runway
                        </span>
                      </div>
                    </div>
                    <span className={styles.presetDetails}>
                      {presetKey === "custom" ? (
                        "Set custom monthly limits for rent, food, travel, and mobile data caps."
                      ) : (
                        `Rent: QR ${preset.rent} • Food: QR ${preset.food} • Travel: QR ${preset.transport} • Data: QR ${preset.data}`
                      )}
                    </span>
                  </div>
                );
              })}
            </div>

            {jsBudgetPreset === "custom" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem", width: "100%" }}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Rent (QR)</label>
                  <input
                    type="number"
                    className={styles.textInput}
                    value={customRent}
                    onChange={(e) => setCustomRent(e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Food (QR)</label>
                  <input
                    type="number"
                    className={styles.textInput}
                    value={customFood}
                    onChange={(e) => setCustomFood(e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Travel (QR)</label>
                  <input
                    type="number"
                    className={styles.textInput}
                    value={customTransport}
                    onChange={(e) => setCustomTransport(e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Data (QR)</label>
                  <input
                    type="number"
                    className={styles.textInput}
                    value={customData}
                    onChange={(e) => setCustomData(e.target.value)}
                  />
                </div>
                <div className={styles.field} style={{ gridColumn: "span 2" }}>
                  <label className={styles.fieldLabel}>Misc Job-Hunting (QR)</label>
                  <input
                    type="number"
                    className={styles.textInput}
                    value={customMisc}
                    onChange={(e) => setCustomMisc(e.target.value)}
                  />
                </div>
              </div>
            )}

            <button
              className={styles.primaryBtn}
              onClick={handleJsPresetSubmit}
            >
              Continue
              <Icon name="chevron-right" size={18} />
            </button>
          </div>
        )}

        {/* ──────────── STEP 5: WORKER GOAL OR JOB SEEKER SUMMARY ──────────── */}
        {step === 5 && profileType === "worker" && (
          <div className={styles.stepContent}>
            <GoalIllustration />
            <h2 className={styles.headline}>Any savings goals?</h2>
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

        {step === 5 && profileType === "jobseeker" && (
          <div className={styles.stepContent}>
            <GoalIllustration />
            <h2 className={styles.headline}>Your Qatar Runway Plan</h2>
            <p className={styles.body}>We've calculated a preview of your finance strategy.</p>

            <div className={styles.presetSelectorGrid} style={{ marginBottom: "2rem" }}>
              <div className={styles.presetCard} style={{ cursor: "default", border: "1px solid var(--panel-line)", background: "var(--panel)" }}>
                <div className={styles.presetHeader}>
                  <span className={styles.presetName} style={{ color: "var(--ink-mute)" }}>Total Savings</span>
                  <span className={styles.presetCost} style={{ color: "var(--ink)" }}>
                    {parseFloat(jsSavingsAmount).toLocaleString()} {jsHomeCurrency}
                  </span>
                </div>
                <div className={styles.presetHeader} style={{ marginTop: "0.25rem" }}>
                  <span className={styles.presetName} style={{ color: "var(--ink-mute)" }}>In Qatari Riyals</span>
                  <span className={styles.presetCost} style={{ color: "var(--ok)" }}>
                    ≈ QR {(jsSavingsQAR / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className={styles.presetHeader} style={{ marginTop: "0.25rem" }}>
                  <span className={styles.presetName} style={{ color: "var(--ink-mute)" }}>Target Runway</span>
                  <span className={styles.presetCost} style={{ color: "var(--electric)" }}>
                    {jsVisaDays === 0 ? jsCustomVisaDays : jsVisaDays} Days
                  </span>
                </div>
                <div className={styles.presetHeader} style={{ marginTop: "0.25rem" }}>
                  <span className={styles.presetName} style={{ color: "var(--ink-mute)" }}>Monthly Expenses</span>
                  <span className={styles.presetCost} style={{ color: "var(--over)" }}>
                    QR {presets[jsBudgetPreset].total} / mo
                  </span>
                </div>
                <div className={styles.divider} style={{ margin: "0.5rem 0", background: "var(--panel-line)" }} />
                <div className={styles.presetHeader}>
                  <span className={styles.presetName} style={{ color: "var(--electric)" }}>Runway Lifespan</span>
                  <span className={styles.presetCost} style={{ color: "var(--electric)", fontSize: "var(--step-1)" }}>
                    {Math.floor(jsSavingsQAR / ((presets[jsBudgetPreset].total * 100) / 30))} Days
                  </span>
                </div>
              </div>
            </div>

            <button
              className={styles.primaryBtn}
              onClick={handleJsFinishSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Generating..." : "Launch Qatar Runway"}
              {!isSubmitting && <Icon name="sparkles" size={18} />}
            </button>
            <button className={styles.ghostBtn} onClick={onComplete}>
              Cancel and set up later
            </button>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}
