import type { Cents } from "../money";
import { differenceInDays, differenceInMonths } from "date-fns";

/**
 * Goal tracking and contribution calculations.
 */

export interface Goal {
  targetCents: Cents;
  savedCents: Cents;
  targetDate?: Date;
}

export interface GoalContribution {
  /** Remaining amount to reach goal (in cents). */
  remainingCents: Cents;

  /** Required daily contribution to hit goal by target date (in cents). */
  requiredPerDay: Cents;

  /** Required monthly contribution to hit goal by target date (in cents). */
  requiredPerMonth: Cents;

  /** Days remaining until target date. */
  daysRemaining: number;

  /** Months remaining until target date. */
  monthsRemaining: number;

  /** Whether the goal is on track (true if saved >= projected amount by now). */
  onTrack: boolean;
}

/**
 * Calculate required contributions to hit a savings goal.
 */
export function calculateGoalContribution(
  goal: Goal,
  currentDate = new Date(),
): GoalContribution {
  const remainingCents = goal.targetCents - goal.savedCents;

  if (!goal.targetDate) {
    // No deadline — just show remaining amount
    return {
      remainingCents,
      requiredPerDay: 0,
      requiredPerMonth: 0,
      daysRemaining: Infinity,
      monthsRemaining: Infinity,
      onTrack: true, // No deadline = always "on track"
    };
  }

  const daysRemaining = Math.max(0, differenceInDays(goal.targetDate, currentDate));
  const monthsRemaining = Math.max(0, differenceInMonths(goal.targetDate, currentDate));

  const requiredPerDay =
    daysRemaining > 0 ? Math.round(remainingCents / daysRemaining) : remainingCents;

  const requiredPerMonth =
    monthsRemaining > 0 ? Math.round(remainingCents / monthsRemaining) : remainingCents;

  // On-track check: are we ahead of the linear projection?
  const totalDays = differenceInDays(goal.targetDate, new Date(0)); // Assume started from epoch for simplicity
  const elapsedDays = totalDays - daysRemaining;
  const projectedSaved = elapsedDays > 0 ? (goal.targetCents * elapsedDays) / totalDays : 0;
  const onTrack = goal.savedCents >= projectedSaved;

  return {
    remainingCents,
    requiredPerDay,
    requiredPerMonth,
    daysRemaining,
    monthsRemaining,
    onTrack,
  };
}

/**
 * Check if a goal is on track to be met by its target date.
 */
export function isGoalOnTrack(goal: Goal, currentDate = new Date()): boolean {
  const contribution = calculateGoalContribution(goal, currentDate);
  return contribution.onTrack;
}
