"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { db } from "@/lib/db/dexie";
import { useCategories, useCurrency } from "@/lib/db/hooks";
import { parseAmountToCents, formatCents } from "@/lib/money";
import { Sheet } from "@/components/Sheet/Sheet";
import { Icon } from "@/components/Icon/Icon";
import { useToast } from "@/components/Toast/Toast";
import styles from "./CategoryBudgetForm.module.css";

type CategoryBudgetFormProps = {
  categoryId?: string;
  onClose: () => void;
  onSuccess?: () => void;
};

export function CategoryBudgetForm({
  categoryId,
  onClose,
  onSuccess,
}: CategoryBudgetFormProps) {
  const { user } = useUser();
  const categories = useCategories("expense");
  const toast = useToast();
  const currency = useCurrency();
  const currencySymbol = currency === "QAR" ? "QR" : currency;
  const [selectedCategoryId, setSelectedCategoryId] = useState(categoryId || "");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!categoryId);

  // Load existing budget if editing
  useEffect(() => {
    if (categoryId && user?.id) {
      setIsLoading(true);
      db.categories.get(categoryId).then((category) => {
        if (category && category.userId === user.id && category.monthlyBudgetCents) {
          setBudgetAmount((category.monthlyBudgetCents / 100).toFixed(2));
        }
        setIsLoading(false);
      });
    }
  }, [categoryId, user?.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id || !selectedCategoryId) return;

    const budgetCents = parseAmountToCents(budgetAmount);
    if (budgetCents === null || budgetCents <= 0) {
      toast.error("Please enter a valid budget amount");
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      await db.categories.update(selectedCategoryId, {
        monthlyBudgetCents: budgetCents,
        updatedAt: now,
        dirty: true,
      });

      toast.success("Monthly budget saved");
      onSuccess?.();
      onClose();
    } catch {
      toast.error("Failed to save budget");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <Sheet open onClose={onClose} label="Loading budget">
        <div className={styles.loading}>Loading...</div>
      </Sheet>
    );
  }

  const selectedCategory = categories?.find((cat) => cat.id === selectedCategoryId);
  const catIconName = (selectedCategory?.icon ?? "tag") as any;

  return (
    <Sheet
      open
      onClose={onClose}
      label={categoryId ? "Edit Budget" : "Set Budget"}
    >
      <header className={styles.header}>
        <h2 className={styles.title}>
          {categoryId ? "Edit Budget" : "Set Budget"}
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

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Category Selector */}
        {!categoryId && (
          <div className={styles.field}>
            <label htmlFor="category" className={styles.label}>
              Category *
            </label>
            <select
              id="category"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className={styles.select}
              required
            >
              <option value="">Select a category</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Show selected category if editing */}
        {categoryId && selectedCategory && (
          <div className={styles.categoryDisplay}>
            <span
              className={styles.categoryIcon}
              style={{ background: (selectedCategory.color ?? "#888") + "15" }}
            >
              <Icon
                name={catIconName}
                size={18}
                color={selectedCategory.color ?? "var(--ink-mute)"}
              />
            </span>
            <span className={styles.categoryName}>{selectedCategory.name}</span>
          </div>
        )}

        {/* Giant Centered Budget Amount Input */}
        <div className={styles.amountContainer}>
          <span className={styles.amountLabel}>Monthly Budget</span>
          <div className={styles.amountInputWrap}>
            <span className={styles.amountCurrency}>{currencySymbol}</span>
            <input
              id="budget"
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
              className={styles.amountInput}
              required
            />
          </div>
          <p className={styles.hint} style={{ marginTop: "0.5rem" }}>
            This is how much you want to spend on this category per month
          </p>
        </div>

        {/* Quick amounts */}
        <div className={styles.quickAmounts}>
          {(["100.00", "250.00", "500.00", "1000.00"] as const).map((amt) => (
            <button
              key={amt}
              type="button"
              className={styles.quickBtn}
              onClick={() => setBudgetAmount(amt)}
            >
              {currencySymbol} {parseFloat(amt).toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </button>
          ))}
        </div>

        {/* Daily breakdown */}
        {budgetAmount && parseAmountToCents(budgetAmount) && (
          <div className={styles.breakdown}>
            <span className={styles.breakdownLabel}>Daily allowance</span>
            <span className={styles.breakdownAmount}>
              ~{" "}
              {formatCents(
                Math.round((parseAmountToCents(budgetAmount) || 0) / 30.44),
                currency,
                { symbol: true }
              )}
              /day
            </span>
          </div>
        )}

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
            {isSubmitting ? "Saving..." : categoryId ? "Update" : "Set Budget"}
          </button>
        </div>
      </form>
    </Sheet>
  );
}
