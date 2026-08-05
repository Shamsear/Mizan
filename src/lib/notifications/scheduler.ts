import { db } from "../db/dexie";
import { createNotification } from "../db/repository";
import { formatCents } from "../money";
import { differenceInDays, startOfDay } from "date-fns";

/**
 * Checks for upcoming due bills and schedules local alerts.
 * Run on app startup or settings updates.
 */
export async function checkBillReminders(userId: string) {
  const settings = await db.settings.where("userId").equals(userId).first();
  if (!settings || !settings.notificationsEnabled) return;

  const reminderDays = settings.billReminderDays ?? 1;
  const today = startOfDay(new Date());

  // Fetch all active expense recurring rules
  const rules = await db.recurringRules
    .where("userId")
    .equals(userId)
    .filter((r) => r.deletedAt === null && r.type === "expense")
    .toArray();

  for (const rule of rules) {
    const dueDate = startOfDay(new Date(rule.nextDueDate));
    const diff = differenceInDays(dueDate, today);

    // If the bill is due within the reminder window (0 to X days away)
    if (diff >= 0 && diff <= reminderDays) {
      const formattedAmount = formatCents(rule.amountCents, rule.currency, { symbol: true });
      const title = diff === 0 ? "Bill Due Today" : "Upcoming Bill Due";
      const body = diff === 0
        ? `Your recurring bill "${rule.label}" of ${formattedAmount} is due today.`
        : `Your recurring bill "${rule.label}" of ${formattedAmount} is due in ${diff} ${diff === 1 ? "day" : "days"}.`;

      // Deduplicate: check if a similar notification has already been sent for this due date
      const keyString = `bill-${rule.id}-${dueDate.toISOString()}`;
      const existing = await db.notifications
        .where("userId")
        .equals(userId)
        .filter((n) => n.deletedAt === null && n.url.includes(keyString))
        .first();

      if (!existing) {
        // Trigger browser notification
        triggerLocalPush(title, body);

        // Store in inbox
        await createNotification(userId, {
          title,
          body,
          category: "bills",
          url: `/bills?key=${keyString}`,
          isRead: false,
        });
      }
    }
  }
}

/**
 * Checks if a transaction log pushes a category over its 80% or 100% budget cap.
 * Run immediately after creating/updating transactions.
 */
export async function checkBudgetWarnings(userId: string, categoryId: string) {
  const settings = await db.settings.where("userId").equals(userId).first();
  if (!settings || !settings.notificationsEnabled) return;

  const category = await db.categories.get(categoryId);
  if (!category || !category.monthlyBudgetCents || category.deletedAt !== null) return;

  const budgetLimit = category.monthlyBudgetCents;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Sum up all expenses in this category for the current month
  const txs = await db.transactions
    .where("userId")
    .equals(userId)
    .filter((t) => t.deletedAt === null && t.categoryId === categoryId && t.type === "expense" && t.date >= start && t.date <= end)
    .toArray();

  const totalSpent = txs.reduce((sum, t) => sum + t.amountCents, 0);
  const ratio = totalSpent / budgetLimit;

  let warningType: "warning" | "cap" | null = null;
  if (ratio >= 1.0) {
    warningType = "cap";
  } else if (ratio >= 0.8) {
    warningType = "warning";
  }

  if (warningType) {
    const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
    const keyString = `budget-${categoryId}-${warningType}-${monthKey}`;

    // Check if notification already dispatched this month
    const existing = await db.notifications
      .where("userId")
      .equals(userId)
      .filter((n) => n.deletedAt === null && n.url.includes(keyString))
      .first();

    if (!existing) {
      const categoryName = category.name;
      const pct = Math.round(ratio * 100);
      const title = warningType === "cap" ? "Budget Limit Exceeded" : "Budget Limit Approaching";
      const body = warningType === "cap"
        ? `You have spent ${pct}% of your monthly budget for "${categoryName}".`
        : `You have spent ${pct}% of your monthly budget for "${categoryName}" (${formatCents(totalSpent, settings.baseCurrency, { symbol: true })} of ${formatCents(budgetLimit, settings.baseCurrency, { symbol: true })}).`;

      triggerLocalPush(title, body);

      await createNotification(userId, {
        title,
        body,
        category: "budgets",
        url: `/budgets?key=${keyString}`,
        isRead: false,
      });
    }
  }
}

/**
 * Checks savings goals progress and triggers milestone alerts (50% and 100%).
 * Run immediately after goal progress changes.
 */
export async function checkGoalMilestones(userId: string, goalId: string) {
  const settings = await db.settings.where("userId").equals(userId).first();
  if (!settings || !settings.notificationsEnabled) return;

  const goal = await db.goals.get(goalId);
  if (!goal || goal.deletedAt !== null || goal.targetCents <= 0) return;

  const progress = goal.savedCents / goal.targetCents;
  let milestone: 50 | 100 | null = null;
  if (progress >= 1.0) {
    milestone = 100;
  } else if (progress >= 0.50) {
    milestone = 50;
  }

  if (milestone) {
    const keyString = `goal-${goalId}-${milestone}`;

    // Check if milestone notification already sent
    const existing = await db.notifications
      .where("userId")
      .equals(userId)
      .filter((n) => n.deletedAt === null && n.url.includes(keyString))
      .first();

    if (!existing) {
      const title = milestone === 100 ? "Savings Goal Reached!" : "Savings Goal Milestone";
      const body = milestone === 100
        ? `Congratulations! You've fully funded your savings goal "${goal.name}".`
        : `Great job! You've reached 50% of your savings goal "${goal.name}".`;

      triggerLocalPush(title, body);

      await createNotification(userId, {
        title,
        body,
        category: "goals",
        url: `/goals?key=${keyString}`,
        isRead: false,
      });
    }
  }
}

/**
 * Helper triggering the native browser push tray notification
 */
function triggerLocalPush(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  if (Notification.permission === "granted") {
    // Show via service worker registration if available for best PWA background display
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          body,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          vibrate: [200, 100, 200],
        } as any);
      });
    } else {
      new Notification(title, { body });
    }
  }
}
