import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./dexie";
import { useUser } from "@clerk/nextjs";

/**
 * Reactive Dexie hooks using useLiveQuery + Clerk userId scoping.
 */

export function useTransactions(filters?: {
  startDate?: Date;
  endDate?: Date;
  type?: "income" | "expense";
  categoryId?: string;
}) {
  const { user } = useUser();
  const userId = user?.id;

  return useLiveQuery(async () => {
    if (!userId) return [];

    const results = await db.transactions
      .where("userId")
      .equals(userId)
      .reverse()
      .sortBy("date");

    // Apply filters in memory
    return results.filter((txn) => {
      if (txn.deletedAt !== null) return false;
      if (filters?.startDate && txn.date < filters.startDate) return false;
      if (filters?.endDate && txn.date > filters.endDate) return false;
      if (filters?.type && txn.type !== filters.type) return false;
      if (filters?.categoryId && txn.categoryId !== filters.categoryId) return false;
      return true;
    });
  }, [userId, filters?.startDate, filters?.endDate, filters?.type, filters?.categoryId]);
}

export function useCategories(kind?: "income" | "expense") {
  const { user } = useUser();
  const userId = user?.id;

  return useLiveQuery(async () => {
    if (!userId) return [];

    const results = await db.categories
      .where("userId")
      .equals(userId)
      .filter((cat) => cat.deletedAt === null)
      .sortBy("sortOrder");

    if (kind) {
      return results.filter((cat) => cat.kind === kind);
    }

    return results;
  }, [userId, kind]);
}

export function useQuickAddTemplates() {
  const { user } = useUser();
  const userId = user?.id;

  return useLiveQuery(async () => {
    if (!userId) return [];

    return db.quickAddTemplates
      .where("userId")
      .equals(userId)
      .filter((tpl) => tpl.deletedAt === null)
      .sortBy("sortOrder");
  }, [userId]);
}

export function useSettings() {
  const { user } = useUser();
  const userId = user?.id;

  return useLiveQuery(async () => {
    if (!userId) return null;
    return db.settings.where("userId").equals(userId).first();
  }, [userId]);
}

export function useRecurringRules() {
  const { user } = useUser();
  const userId = user?.id;

  return useLiveQuery(async () => {
    if (!userId) return [];

    return db.recurringRules
      .where("userId")
      .equals(userId)
      .filter((rule) => rule.deletedAt === null)
      .sortBy("nextDueDate");
  }, [userId]);
}

export function useRoutineItems() {
  const { user } = useUser();
  const userId = user?.id;

  return useLiveQuery(async () => {
    if (!userId) return [];

    const items = await db.routineItems
      .where("userId")
      .equals(userId)
      .toArray();

    return items.filter((item) => item.deletedAt === null);
  }, [userId]);
}

export function useGoals() {
  const { user } = useUser();
  const userId = user?.id;

  return useLiveQuery(async () => {
    if (!userId) return [];

    return db.goals
      .where("userId")
      .equals(userId)
      .filter((goal) => goal.deletedAt === null)
      .sortBy("priority");
  }, [userId]);
}

export function useSavingsPlans() {
  const { user } = useUser();
  const userId = user?.id;

  return useLiveQuery(async () => {
    if (!userId) return [];

    return db.savingsPlans
      .where("userId")
      .equals(userId)
      .filter((plan) => plan.deletedAt === null)
      .sortBy("nextDueDate");
  }, [userId]);
}

export function useAccounts() {
  const { user } = useUser();
  const userId = user?.id;

  return useLiveQuery(async () => {
    if (!userId) return [];

    return db.accounts
      .where("userId")
      .equals(userId)
      .filter((acc) => acc.deletedAt === null)
      .sortBy("sortOrder");
  }, [userId]);
}

export function useCurrency(): string {
  const settings = useSettings();
  return settings?.baseCurrency ?? "QAR";
}

export function useNotifications() {
  const { user } = useUser();
  const userId = user?.id;

  return useLiveQuery(async () => {
    if (!userId) return [];

    return db.notifications
      .where("userId")
      .equals(userId)
      .filter((n) => n.deletedAt === null)
      .reverse()
      .sortBy("createdAt");
  }, [userId]);
}

export function useUnreadNotificationsCount() {
  const { user } = useUser();
  const userId = user?.id;

  return useLiveQuery(async () => {
    if (!userId) return 0;

    const list = await db.notifications
      .where("userId")
      .equals(userId)
      .filter((n) => n.deletedAt === null && !n.isRead)
      .toArray();
    
    return list.length;
  }, [userId]);
}
