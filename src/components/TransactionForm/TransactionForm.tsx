"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser } from "@clerk/nextjs";
import { transactionSchema, type TransactionFormData } from "@/lib/schemas";
import { createTransaction, updateTransaction } from "@/lib/db/repository";
import { useCategories, useCurrency } from "@/lib/db/hooks";
import { checkBudgetWarnings } from "@/lib/notifications/scheduler";
import { parseAmountToCents } from "@/lib/money";
import { useState, useEffect } from "react";
import { type Transaction } from "@/lib/db/dexie";
import { Sheet } from "@/components/Sheet/Sheet";
import { Icon } from "@/components/Icon/Icon";
import { useToast } from "@/components/Toast/Toast";
import styles from "./TransactionForm.module.css";

type TransactionFormProps = {
  onClose: () => void;
  onSuccess?: () => void;
  defaultType?: "income" | "expense";
  editTransaction?: Transaction;
};

/**
  * Full transaction entry form.
  * Displays inside the Bottom Sheet, matches app style.
  */
export function TransactionForm({
  onClose,
  onSuccess,
  defaultType = "expense",
  editTransaction,
}: TransactionFormProps) {
  const { user } = useUser();
  const categories = useCategories();
  const toast = useToast();
  const currency = useCurrency();
  const currencySymbol = currency === "QAR" ? "QR" : currency;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!editTransaction;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: editTransaction
      ? {
          type: editTransaction.type,
          amountCents: editTransaction.amountCents,
          currency: editTransaction.currency,
          categoryId: editTransaction.categoryId,
          date: editTransaction.date,
          note: editTransaction.note || "",
        }
      : {
          type: defaultType,
          currency,
          date: new Date(),
        },
  });

  // Set initial amount display for edit mode
  useEffect(() => {
    if (editTransaction) {
      const displayAmount = (editTransaction.amountCents / 100).toFixed(2);
      const amountInput = document.getElementById("amount") as HTMLInputElement;
      if (amountInput) {
        amountInput.value = displayAmount;
      }
    }
  }, [editTransaction]);

  const type = watch("type");
  const filteredCategories = categories?.filter((cat) => cat.kind === type) ?? [];

  async function onSubmit(data: TransactionFormData) {
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      if (isEditMode && editTransaction) {
        await updateTransaction(editTransaction.id, user.id, data);
        toast.success("Transaction updated");
        await checkBudgetWarnings(user.id, data.categoryId);
      } else {
        await createTransaction(user.id, data);
        toast.success("Transaction added");
        await checkBudgetWarnings(user.id, data.categoryId);
      }
      onSuccess?.();
      onClose();
    } catch {
      toast.error(`Failed to ${isEditMode ? "update" : "save"} transaction.`);
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

  return (
    <Sheet open onClose={onClose} label={isEditMode ? "Edit Transaction" : "Add Transaction"}>
      <header className={styles.header}>
        <h2 className={styles.title}>{isEditMode ? "Edit Transaction" : "Add Transaction"}</h2>
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="Close"
        >
          <Icon name="x" size={20} />
        </button>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        {/* Type Toggle */}
        <div className={styles.typeToggle}>
          <button
            type="button"
            className={`${styles.typeBtn} ${type === "expense" ? styles.active : ""}`}
            onClick={() => setValue("type", "expense")}
          >
            Expense
          </button>
          <button
            type="button"
            className={`${styles.typeBtn} ${type === "income" ? styles.active : ""}`}
            onClick={() => setValue("type", "income")}
          >
            Income
          </button>
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

        {/* Date */}
        <div className={styles.field}>
          <label htmlFor="date" className={styles.label}>
            Date
          </label>
          <input
            id="date"
            type="date"
            {...register("date", { valueAsDate: true })}
            className={styles.input}
          />
          {errors.date && (
            <span className={styles.error}>{errors.date.message}</span>
          )}
        </div>

        {/* Note */}
        <div className={styles.field}>
          <label htmlFor="note" className={styles.label}>
            Note <span className={styles.optional}>(optional)</span>
          </label>
          <input
            id="note"
            type="text"
            placeholder="Add a note..."
            {...register("note")}
            className={styles.input}
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
            {isSubmitting ? "Saving..." : isEditMode ? "Update" : "Add"}
          </button>
        </div>
      </form>
    </Sheet>
  );
}
