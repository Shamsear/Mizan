import { useMemo } from "react";
import { useTransactions, useRecurringRules, useSavingsPlans } from "../db/hooks";
import { calculateSafeToSpend, calculateBalance, type SafeToSpendResult } from "./safeToSpend";
import { startOfMonth, endOfMonth } from "date-fns";
import type { Cents } from "../money";

/**
 * React hook that calculates the real Safe-to-Spend value from database.
 * Pulls transactions, recurring bills, and savings plans to compute the number.
 */
export function useSafeToSpend(date = new Date()): SafeToSpendResult & {
  totalBalance: Cents;
  isLoading: boolean;
} {
  const transactions = useTransactions();
  const recurringRules = useRecurringRules();
  const savingsPlans = useSavingsPlans();

  const result = useMemo(() => {
    if (!transactions || !recurringRules || !savingsPlans) {
      // Loading state - return defaults
      return {
        safeToSpendToday: 0,
        paceDelta: 0,
        dailyAllowance: 0,
        discretionaryMonthly: 0,
        elapsedAllowance: 0,
        totalBalance: 0,
        isLoading: true,
      };
    }

    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);

    // Calculate monthly income from recurring rules (salary, freelance, etc.)
    const monthlyIncome = recurringRules
      .filter((rule) => rule.type === "income" && rule.autoPost)
      .reduce((sum, rule) => {
        // Normalize to monthly amount based on cadence
        let monthlyAmount = rule.amountCents;
        switch (rule.cadence) {
          case "weekly":
            monthlyAmount = Math.round((rule.amountCents * 52) / 12);
            break;
          case "biweekly":
            monthlyAmount = Math.round((rule.amountCents * 26) / 12);
            break;
          case "yearly":
            monthlyAmount = Math.round(rule.amountCents / 12);
            break;
          case "daily":
            monthlyAmount = Math.round(rule.amountCents * 30.44);
            break;
          // monthly stays as-is
        }
        return sum + monthlyAmount;
      }, 0);

    // Calculate fixed bills for the month
    const monthlyFixedBills = recurringRules
      .filter((rule) => rule.type === "expense" && rule.autoPost)
      .reduce((sum, rule) => {
        let monthlyAmount = rule.amountCents;
        switch (rule.cadence) {
          case "weekly":
            monthlyAmount = Math.round((rule.amountCents * 52) / 12);
            break;
          case "biweekly":
            monthlyAmount = Math.round((rule.amountCents * 26) / 12);
            break;
          case "yearly":
            monthlyAmount = Math.round(rule.amountCents / 12);
            break;
          case "daily":
            monthlyAmount = Math.round(rule.amountCents * 30.44);
            break;
        }
        return sum + monthlyAmount;
      }, 0);

    // Calculate required savings for the month
    const monthlyRequiredSavings = savingsPlans
      .filter((plan) => plan.autoApply)
      .reduce((sum, plan) => {
        let monthlyAmount = plan.amountCents;
        switch (plan.cadence) {
          case "weekly":
            monthlyAmount = Math.round((plan.amountCents * 52) / 12);
            break;
          case "daily":
            monthlyAmount = Math.round(plan.amountCents * 30.44);
            break;
          // monthly stays as-is
        }
        return sum + monthlyAmount;
      }, 0);

    // Calculate discretionary spending this month (non-recurring expenses)
    const discretionarySpent = transactions
      .filter((txn) => {
        if (txn.type !== "expense") return false;
        if (txn.recurringId) return false; // Exclude recurring (already counted in fixed bills)
        const txnDate = new Date(txn.date);
        return txnDate >= monthStart && txnDate <= monthEnd;
      })
      .reduce((sum, txn) => sum + txn.amountCents, 0);

    // Calculate total balance (all-time)
    const totalIncome = transactions
      .filter((txn) => txn.type === "income")
      .reduce((sum, txn) => sum + txn.amountCents, 0);

    const totalExpenses = transactions
      .filter((txn) => txn.type === "expense")
      .reduce((sum, txn) => sum + txn.amountCents, 0);

    const totalBalance = calculateBalance(totalIncome, totalExpenses);

    // Calculate Safe-to-Spend
    const safeToSpendResult = calculateSafeToSpend({
      monthlyIncomeCents: monthlyIncome,
      monthlyFixedBillsCents: monthlyFixedBills,
      monthlyRequiredSavingsCents: monthlyRequiredSavings,
      spentSoFarCents: discretionarySpent,
      date,
    });

    return {
      ...safeToSpendResult,
      totalBalance,
      isLoading: false,
    };
  }, [transactions, recurringRules, savingsPlans, date]);

  return result;
}
