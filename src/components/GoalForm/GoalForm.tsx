"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser } from "@clerk/nextjs";
import { goalSchema, type GoalFormData } from "@/lib/schemas";
import { db } from "@/lib/db/dexie";
import { parseAmountToCents } from "@/lib/money";
import { addMonths } from "date-fns";
import { useCurrency } from "@/lib/db/hooks";
import { Sheet } from "@/components/Sheet/Sheet";
import { Icon } from "@/components/Icon/Icon";
import { useToast } from "@/components/Toast/Toast";
import { checkGoalMilestones } from "@/lib/notifications/scheduler";
import styles from "./GoalForm.module.css";

const GOAL_ICONS = [
  "target", "wallet", "home", "car", "briefcase", "zap", "star", "gift",
  "heart-pulse", "clapperboard", "shopping-bag", "book-open", "smartphone",
];

type GoalFormProps = {
  goalId?: string;
  onClose: () => void;
  onSuccess?: () => void;
};

export function GoalForm({ goalId, onClose, onSuccess }: GoalFormProps) {
  const { user } = useUser();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!goalId);
  const [selectedIcon, setSelectedIcon] = useState(GOAL_ICONS[0]);
  const currency = useCurrency();
  const currencySymbol = currency === "QAR" ? "QR" : currency;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      currency,
      priority: 1,
      savedCents: 0,
      icon: GOAL_ICONS[0],
    },
  });

  // Load existing goal if editing
  useEffect(() => {
    if (goalId && user?.id) {
      setIsLoading(true);
      db.goals.get(goalId).then((goal) => {
        if (goal && goal.userId === user.id) {
          setValue("name", goal.name);
          setValue("targetCents", goal.targetCents);
          setValue("savedCents", goal.savedCents);
          if (goal.targetDate) setValue("targetDate", goal.targetDate);
          setValue("priority", goal.priority);
          if (goal.icon) {
            // Strip emoji if present and map it, or use fallback
            const finalIcon = goal.icon.includes("🎯") ? "target" : goal.icon;
            setValue("icon", finalIcon);
            setSelectedIcon(finalIcon);
          }
          if (goal.color) setValue("color", goal.color);

          // Populate input fields
          const targetInput = document.getElementById("targetAmount") as HTMLInputElement;
          if (targetInput) {
            targetInput.value = (goal.targetCents / 100).toFixed(2);
          }
          const savedInput = document.getElementById("savedAmount") as HTMLInputElement;
          if (savedInput) {
            savedInput.value = (goal.savedCents / 100).toFixed(2);
          }
        }
        setIsLoading(false);
      });
    }
  }, [goalId, user?.id, setValue]);

  async function onSubmit(data: GoalFormData) {
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      const now = new Date();
      const finalData = { ...data, icon: selectedIcon };

      if (goalId) {
        await db.goals.update(goalId, {
          ...finalData,
          updatedAt: now,
          dirty: true,
        });
        toast.success("Savings goal updated");
        await checkGoalMilestones(user.id, goalId);
      } else {
        const newGoalId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        await db.goals.add({
          id: newGoalId,
          userId: user.id,
          ...finalData,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          dirty: true,
        });
        toast.success("Savings goal created");
        await checkGoalMilestones(user.id, newGoalId);
      }

      onSuccess?.();
      onClose();
    } catch {
      toast.error("Failed to save savings goal");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleTargetAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const cents = parseAmountToCents(e.target.value);
    if (cents !== null) {
      setValue("targetCents", cents);
    }
  }

  function handleSavedAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const cents = parseAmountToCents(e.target.value);
    if (cents !== null) {
      setValue("savedCents", cents);
    }
  }

  function quickTargetDate(months: number) {
    setValue("targetDate", addMonths(new Date(), months));
  }

  return (
    <Sheet
      open
      onClose={onClose}
      label={goalId ? "Edit Goal" : "New Savings Goal"}
    >
      <header className={styles.header}>
        <h2 className={styles.title}>{goalId ? "Edit Goal" : "New Savings Goal"}</h2>
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="Close"
        >
          <Icon name="x" size={20} />
        </button>
      </header>

      {isLoading ? (
        <div className={styles.loading}>Loading...</div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          {/* Name */}
          <div className={styles.field}>
            <label htmlFor="name" className={styles.label}>
              Goal Name *
            </label>
            <input
              id="name"
              type="text"
              placeholder="e.g. Emergency Fund, Laptop"
              {...register("name")}
              className={styles.input}
              autoFocus
            />
            {errors.name && <span className={styles.error}>{errors.name.message}</span>}
          </div>

          {/* Giant Centered Target Amount Input */}
          <div className={styles.amountContainer}>
            <span className={styles.amountLabel}>Target Amount</span>
            <div className={styles.amountInputWrap}>
              <span className={styles.amountCurrency}>{currencySymbol}</span>
              <input
                id="targetAmount"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="0.00"
                className={styles.amountInput}
                onChange={handleTargetAmountChange}
              />
            </div>
            {errors.targetCents && (
              <span className={styles.error} style={{ marginTop: "0.5rem" }}>
                {errors.targetCents.message}
              </span>
            )}
          </div>

          {/* Already Saved */}
          <div className={styles.field}>
            <label htmlFor="savedAmount" className={styles.label}>
              Already Saved <span className={styles.optional}>(optional)</span>
            </label>
            <input
              id="savedAmount"
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              className={styles.input}
              onChange={handleSavedAmountChange}
            />
          </div>

          {/* Target Date */}
          <div className={styles.field}>
            <label htmlFor="targetDate" className={styles.label}>
              Target Date <span className={styles.optional}>(optional)</span>
            </label>
            <input
              id="targetDate"
              type="date"
              {...register("targetDate", { valueAsDate: true })}
              className={styles.input}
            />
            <div className={styles.quickDates}>
              <button
                type="button"
                className={styles.quickDateBtn}
                onClick={() => quickTargetDate(3)}
              >
                3 mo
              </button>
              <button
                type="button"
                className={styles.quickDateBtn}
                onClick={() => quickTargetDate(6)}
              >
                6 mo
              </button>
              <button
                type="button"
                className={styles.quickDateBtn}
                onClick={() => quickTargetDate(12)}
              >
                1 yr
              </button>
            </div>
          </div>

          {/* Icon Selector Grid */}
          <div className={styles.field}>
            <label className={styles.label}>Icon</label>
            <div className={styles.iconGrid}>
              {GOAL_ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  className={`${styles.iconItem} ${selectedIcon === i ? styles.iconActive : ""}`}
                  onClick={() => setSelectedIcon(i)}
                  aria-label={`Select icon ${i}`}
                >
                  <Icon name={i as any} size={18} />
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelBtn}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : goalId ? "Update" : "Create"}
            </button>
          </div>
        </form>
      )}
    </Sheet>
  );
}
