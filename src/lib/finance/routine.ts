import type { Cents } from "../money";

/**
 * Routine item cadence normalization — converts any cadence to a daily rate.
 * Used for expected daily spend calculation.
 */

export type Cadence = "daily" | "weekly" | "weekdays" | "monthly" | "yearly";

const DAYS_PER_WEEK = 7;
const DAYS_PER_MONTH = 30.44; // Average days per month (365.25 / 12)
const DAYS_PER_YEAR = 365.25; // Accounting for leap years

/**
 * Normalize a routine expense to a daily rate.
 * Examples:
 * - $5 daily → $5/day
 * - $35 weekly → $5/day
 * - $150 monthly → $4.93/day
 */
export function normalizeRoutineToDailyRate(
  amountCents: Cents,
  cadence: Cadence,
): Cents {
  switch (cadence) {
    case "daily":
      return amountCents;

    case "weekly":
      return Math.round(amountCents / DAYS_PER_WEEK);

    case "weekdays":
      // 5 weekdays per week → multiply by 5/7
      return Math.round((amountCents * 5) / DAYS_PER_WEEK);

    case "monthly":
      return Math.round(amountCents / DAYS_PER_MONTH);

    case "yearly":
      return Math.round(amountCents / DAYS_PER_YEAR);

    default:
      // Type guard — should never reach here
      const _exhaustive: never = cadence;
      return amountCents;
  }
}

/**
 * Calculate total expected daily spend from all routine items.
 * This is used to flag if the user's routine is unsustainable.
 */
export function calculateExpectedDailySpend(
  routineItems: Array<{ amountCents: Cents; dailyRateCents: Cents }>,
): Cents {
  return routineItems.reduce((total, item) => total + item.dailyRateCents, 0);
}
