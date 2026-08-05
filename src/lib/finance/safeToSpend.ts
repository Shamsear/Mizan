import type { Cents } from "../money";
import { getDaysInMonth, getDate } from "date-fns";

/**
 * Core Safe-to-Spend calculation engine.
 * This is the signature feature — tells the user how much they can spend TODAY
 * based on income, fixed bills, savings requirements, and discretionary spending so far.
 */

export interface SafeToSpendInput {
  /** Total income for the month (in cents). */
  monthlyIncomeCents: Cents;

  /** Fixed bills due this month (rent, subscriptions, etc.) in cents. */
  monthlyFixedBillsCents: Cents;

  /** Required savings this month (auto-savings plans) in cents. */
  monthlyRequiredSavingsCents: Cents;

  /** Discretionary expenses spent so far this month (in cents). */
  spentSoFarCents: Cents;

  /** Discretionary expenses spent today (in cents). */
  spentTodayCents: Cents;

  /** Current date (defaults to today). */
  date?: Date;

  /** Enable unspent daily allowance rollover (default true). */
  rolloverEnabled?: boolean;
}

export interface SafeToSpendResult {
  /** How much is safe to spend today (in cents). Can be negative if overspent. */
  safeToSpendToday: Cents;

  /** Ahead (+) or behind (−) the expected pace (in cents). */
  paceDelta: Cents;

  /** Daily allowance (monthly discretionary / days in month). */
  dailyAllowance: Cents;

  /** Discretionary budget for the month (income - bills - savings). */
  discretionaryMonthly: Cents;

  /** Total elapsed allowance up to today (dailyAllowance × day of month). */
  elapsedAllowance: Cents;
}

/**
 * Calculate how much the user can safely spend today.
 *
 * **Algorithm:**
 * 1. discretionaryMonthly = income − fixedBills − requiredSavings
 * 2. dailyAllowance = discretionaryMonthly / daysInMonth
 * 3. elapsedAllowance = dailyAllowance × currentDayOfMonth
 * 4. safeToSpendToday = elapsedAllowance − spentSoFar
 * 5. paceDelta = safeToSpendToday (positive = ahead, negative = behind)
 *
 * **Rollover behavior:** Unused budget from previous days rolls forward.
 * If you overspend, it eats into future days.
 */
export function calculateSafeToSpend(input: SafeToSpendInput): SafeToSpendResult {
  const {
    monthlyIncomeCents,
    monthlyFixedBillsCents,
    monthlyRequiredSavingsCents,
    spentSoFarCents,
    spentTodayCents,
    date = new Date(),
    rolloverEnabled = true,
  } = input;

  // Step 1: Calculate discretionary pool (what's left after bills + savings)
  const discretionaryMonthly =
    monthlyIncomeCents - monthlyFixedBillsCents - monthlyRequiredSavingsCents;

  // Step 2: Daily allowance
  const daysInMonth = getDaysInMonth(date);
  const dailyAllowance = Math.round(discretionaryMonthly / daysInMonth);

  // Step 3: Elapsed allowance (how much should be available by today)
  const dayOfMonth = getDate(date);
  const elapsedAllowance = dailyAllowance * dayOfMonth;

  // Step 4: Safe to spend today (what's left after actual spending)
  const safeToSpendToday = rolloverEnabled
    ? elapsedAllowance - spentSoFarCents
    : dailyAllowance - spentTodayCents;

  // Step 5: Pace delta (same as safe-to-spend in rollover model, or monthly delta in strict model)
  const paceDelta = rolloverEnabled
    ? safeToSpendToday
    : elapsedAllowance - spentSoFarCents;

  return {
    safeToSpendToday,
    paceDelta,
    dailyAllowance,
    discretionaryMonthly,
    elapsedAllowance,
  };
}

/**
 * Calculate simple balance (total income − total expenses).
 * This is separate from safe-to-spend — it's a running total.
 */
export function calculateBalance(
  totalIncomeCents: Cents,
  totalExpensesCents: Cents,
): Cents {
  return totalIncomeCents - totalExpensesCents;
}
