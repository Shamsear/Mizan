import type { Cents } from "../money";
import { getDaysInMonth, getDate } from "date-fns";

/**
 * Per-category budget tracking and pacing.
 */

export interface CategoryBudget {
  monthlyBudgetCents: Cents;
  spentCents: Cents;
  date?: Date;
}

export interface CategoryBudgetPacing {
  /** Monthly budget for this category (in cents). */
  monthlyBudgetCents: Cents;

  /** Amount spent so far this month (in cents). */
  spentCents: Cents;

  /** Remaining budget (in cents). Can be negative if overspent. */
  remainingCents: Cents;

  /** Daily allowance for this category (budget / days in month). */
  dailyAllowance: Cents;

  /** How much should have been spent by today (based on pacing). */
  expectedSpentByNow: Cents;

  /** Difference from expected pace (negative = overspent, positive = under budget). */
  paceDelta: Cents;

  /** Percentage of budget used (0-100+). */
  percentUsed: number;

  /** Percentage of month elapsed (0-100). */
  percentElapsed: number;

  /** Whether spending is on track (true if under/at pace). */
  onTrack: boolean;
}

/**
 * Calculate pacing for a category budget.
 * Shows whether the user is on track to stay within their monthly budget.
 */
export function calculateCategoryBudgetPacing(
  budget: CategoryBudget,
): CategoryBudgetPacing {
  const { monthlyBudgetCents, spentCents, date = new Date() } = budget;

  const daysInMonth = getDaysInMonth(date);
  const dayOfMonth = getDate(date);

  const dailyAllowance = Math.round(monthlyBudgetCents / daysInMonth);
  const expectedSpentByNow = dailyAllowance * dayOfMonth;

  const remainingCents = monthlyBudgetCents - spentCents;
  const paceDelta = expectedSpentByNow - spentCents;

  const percentUsed = monthlyBudgetCents > 0
    ? Math.round((spentCents / monthlyBudgetCents) * 100)
    : 0;

  const percentElapsed = Math.round((dayOfMonth / daysInMonth) * 100);

  const onTrack = spentCents <= expectedSpentByNow;

  return {
    monthlyBudgetCents,
    spentCents,
    remainingCents,
    dailyAllowance,
    expectedSpentByNow,
    paceDelta,
    percentUsed,
    percentElapsed,
    onTrack,
  };
}
