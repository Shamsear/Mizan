"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser } from "@clerk/nextjs";
import { recurringRuleSchema, type RecurringRuleFormData } from "@/lib/schemas";
import { db } from "@/lib/db/dexie";
import { useCategories, useCurrency } from "@/lib/db/hooks";
import { parseAmountToCents } from "@/lib/money";
import { addMonths } from "date-fns";
import { Sheet } from "@/components/Sheet/Sheet";
import { Icon } from "@/components/Icon/Icon";
import { useToast } from "@/components/Toast/Toast";
import styles from "./RecurringRuleForm.module.css";

type RecurringRuleFormProps = {
  ruleId?: string;
  onClose: () => void;
  onSuccess?: () => void;
};

export function RecurringRuleForm({ ruleId, onClose, onSuccess }: RecurringRuleFormProps) {
  const { user } = useUser();
  const categories = useCategories();
  const toast = useToast();
  const currency = useCurrency();
  const currencySymbol = currency === "QAR" ? "QR" : currency;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!ruleId);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RecurringRuleFormData>({
    resolver: zodResolver(recurringRuleSchema),
    defaultValues: {
      type: "expense",
      currency,
      cadence: "monthly",
      nextDueDate: addMonths(new Date(), 1),
      autoPost: true,
    },
  });

  const type = watch("type");
  const filteredCategories = categories?.filter((cat) => cat.kind === type) ?? [];

  // Load existing rule if editing
  useEffect(() => {
    if (ruleId && user?.id) {
      setIsLoading(true);
      db.recurringRules.get(ruleId).then((rule) => {
        if (rule && rule.userId === user.id) {
          setValue("label", rule.label);
          setValue("amountCents", rule.amountCents);
          setValue("type", rule.type);
          setValue("categoryId", rule.categoryId);
          setValue("cadence", rule.cadence);
          setValue("nextDueDate", rule.nextDueDate);
          setValue("autoPost", rule.autoPost);
          if (rule.note) setValue("note", rule.note);

          // Populate the amount text input
          const amountInput = document.getElementById("amount") as HTMLInputElement;
          if (amountInput) {
            amountInput.value = (rule.amountCents / 100).toFixed(2);
          }
        }
        setIsLoading(false);
      });
    }
  }, [ruleId, user?.id, setValue]);

  async function onSubmit(data: RecurringRuleFormData) {
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      const now = new Date();

      if (ruleId) {
        await db.recurringRules.update(ruleId, {
          ...data,
          updatedAt: now,
          dirty: true,
        });
        toast.success("Recurring rule updated");
      } else {
        await db.recurringRules.add({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          userId: user.id,
          ...data,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          dirty: true,
        });
        toast.success("Recurring rule added");
      }

      onSuccess?.();
      onClose();
    } catch {
      toast.error("Failed to save recurring rule");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const cents = parseAmountToCents(e.target.value);
    if (cents !== null) {
      setValue("amountCents", cents);
    }
  }

  function setNextDueByMonth(months: number) {
    setValue("nextDueDate", addMonths(new Date(), months));
  }

  return (
    <Sheet
      open
      onClose={onClose}
      label={ruleId ? "Edit Recurring Item" : "Add Recurring Item"}
    >
      <header className={styles.header}>
        <h2 className={styles.title}>
          {ruleId ? "Edit Recurring Item" : "Add Recurring Item"}
        </h2>
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
          {/* Type Toggle */}
          <div className={styles.typeToggle}>
            <button
              type="button"
              className={`${styles.typeBtn} ${type === "expense" ? styles.active : ""}`}
              onClick={() => setValue("type", "expense")}
            >
              Bill / Expense
            </button>
            <button
              type="button"
              className={`${styles.typeBtn} ${type === "income" ? styles.active : ""}`}
              onClick={() => setValue("type", "income")}
            >
              Income
            </button>
          </div>

          {/* Label */}
          <div className={styles.field}>
            <label htmlFor="label" className={styles.label}>
              Label *
            </label>
            <input
              id="label"
              type="text"
              placeholder="e.g. Netflix, Rent, Salary"
              {...register("label")}
              className={styles.input}
            />
            {errors.label && (
              <span className={styles.error}>{errors.label.message}</span>
            )}
          </div>

          {/* Giant Centered Amount Input */}
          <div className={styles.amountContainer}>
            <span className={styles.amountLabel}>Amount</span>
            <div className={styles.amountInputWrap}>
              <span className={styles.amountCurrency}>{currencySymbol}</span>
              <input
                id="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="0.00"
                className={styles.amountInput}
                onChange={handleAmountChange}
              />
            </div>
            {errors.amountCents && (
              <span className={styles.error} style={{ marginTop: "0.5rem" }}>
                {errors.amountCents.message}
              </span>
            )}
          </div>

          {/* Category */}
          <div className={styles.field}>
            <label htmlFor="category" className={styles.label}>
              Category *
            </label>
            <select
              id="category"
              {...register("categoryId")}
              className={styles.select}
            >
              <option value="">Select a category</option>
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <span className={styles.error}>{errors.categoryId.message}</span>
            )}
          </div>

          {/* Cadence */}
          <div className={styles.field}>
            <label htmlFor="cadence" className={styles.label}>
              Frequency *
            </label>
            <select
              id="cadence"
              {...register("cadence")}
              className={styles.select}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Next Due Date */}
          <div className={styles.field}>
            <label htmlFor="nextDueDate" className={styles.label}>
              Next Due Date *
            </label>
            <input
              id="nextDueDate"
              type="date"
              {...register("nextDueDate", { valueAsDate: true })}
              className={styles.input}
            />
            <div className={styles.quickDates}>
              <button
                type="button"
                className={styles.quickDateBtn}
                onClick={() => setNextDueByMonth(0)}
              >
                This month
              </button>
              <button
                type="button"
                className={styles.quickDateBtn}
                onClick={() => setNextDueByMonth(1)}
              >
                Next month
              </button>
            </div>
            {errors.nextDueDate && (
              <span className={styles.error}>{errors.nextDueDate.message}</span>
            )}
          </div>

          {/* Auto-post */}
          <div className={styles.checkboxField}>
            <input
              id="autoPost"
              type="checkbox"
              {...register("autoPost")}
              className={styles.checkbox}
            />
            <label htmlFor="autoPost" className={styles.checkboxLabel}>
              Automatically post transactions on due dates
            </label>
          </div>

          {/* Note */}
          <div className={styles.field}>
            <label htmlFor="note" className={styles.label}>
              Note <span className={styles.optional}>(optional)</span>
            </label>
            <textarea
              id="note"
              placeholder="Add any additional details..."
              {...register("note")}
              className={styles.textarea}
              rows={2}
            />
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
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : ruleId ? "Update" : "Add"}
            </button>
          </div>
        </form>
      )}
    </Sheet>
  );
}
