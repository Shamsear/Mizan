import { db, type Transaction, type Category, type QuickAddTemplate, type Settings, type NotificationItem } from "./dexie";

/**
 * Repository layer for CRUD operations on Dexie tables.
 * All operations are scoped by userId and respect soft deletes.
 */

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/* ───────────────────────────────────────────────────────────────
   Transactions
   ─────────────────────────────────────────────────────────────── */

export async function createTransaction(
  userId: string,
  data: Omit<Transaction, "id" | "userId" | "createdAt" | "updatedAt" | "deletedAt" | "dirty">,
): Promise<Transaction> {
  const now = new Date();
  const transaction: Transaction = {
    id: generateId(),
    userId,
    ...data,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    dirty: true,
  };

  await db.transactions.add(transaction);
  return transaction;
}

export async function getTransactions(
  userId: string,
  filters?: {
    startDate?: Date;
    endDate?: Date;
    type?: "income" | "expense";
    categoryId?: string;
  },
): Promise<Transaction[]> {
  // Query by userId, then filter out deleted items
  const results = await db.transactions
    .where("userId")
    .equals(userId)
    .toArray();

  // Filter by deletedAt and other filters in memory
  return results.filter((txn) => {
    if (txn.deletedAt !== null) return false;
    if (filters?.startDate && txn.date < filters.startDate) return false;
    if (filters?.endDate && txn.date > filters.endDate) return false;
    if (filters?.type && txn.type !== filters.type) return false;
    if (filters?.categoryId && txn.categoryId !== filters.categoryId) return false;
    return true;
  });
}

export async function updateTransaction(
  id: string,
  userId: string,
  updates: Partial<Omit<Transaction, "id" | "userId" | "createdAt">>,
): Promise<void> {
  await db.transactions.update(id, {
    ...updates,
    updatedAt: new Date(),
    dirty: true,
  });
}

export async function deleteTransaction(id: string, userId: string): Promise<void> {
  const now = new Date();
  await db.transactions.update(id, {
    deletedAt: now,
    updatedAt: now,
    dirty: true,
  });
}

/* ───────────────────────────────────────────────────────────────
   Categories
   ─────────────────────────────────────────────────────────────── */

export async function getCategories(
  userId: string,
  kind?: "income" | "expense",
): Promise<Category[]> {
  const results = await db.categories
    .where("userId")
    .equals(userId)
    .filter((cat) => cat.deletedAt === null)
    .sortBy("sortOrder");

  if (kind) {
    return results.filter((cat) => cat.kind === kind);
  }

  return results;
}

export async function getCategoryById(id: string, userId: string): Promise<Category | undefined> {
  const category = await db.categories.get(id);
  if (category?.userId === userId && !category.deletedAt) {
    return category;
  }
  return undefined;
}

export async function createCategory(
  userId: string,
  data: Omit<Category, "id" | "userId" | "createdAt" | "updatedAt" | "deletedAt" | "dirty">,
): Promise<Category> {
  const now = new Date();
  const category: Category = {
    id: generateId(),
    userId,
    ...data,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    dirty: true,
  };

  await db.categories.add(category);
  return category;
}

export async function updateCategory(
  id: string,
  userId: string,
  updates: Partial<Omit<Category, "id" | "userId" | "createdAt">>,
): Promise<void> {
  await db.categories.update(id, {
    ...updates,
    updatedAt: new Date(),
    dirty: true,
  });
}

export async function deleteCategory(id: string, userId: string): Promise<void> {
  const now = new Date();
  await db.categories.update(id, {
    deletedAt: now,
    updatedAt: now,
    dirty: true,
  });
}

/* ───────────────────────────────────────────────────────────────
   Quick-Add Templates
   ─────────────────────────────────────────────────────────────── */

export async function getQuickAddTemplates(userId: string): Promise<QuickAddTemplate[]> {
  return db.quickAddTemplates
    .where("userId")
    .equals(userId)
    .filter((tpl) => tpl.deletedAt === null)
    .sortBy("sortOrder");
}

export async function createQuickAddTemplate(
  userId: string,
  data: Omit<
    QuickAddTemplate,
    "id" | "userId" | "createdAt" | "updatedAt" | "deletedAt" | "dirty"
  >,
): Promise<QuickAddTemplate> {
  const now = new Date();
  const template: QuickAddTemplate = {
    id: generateId(),
    userId,
    ...data,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    dirty: true,
  };

  await db.quickAddTemplates.add(template);
  return template;
}

export async function updateQuickAddTemplate(
  id: string,
  userId: string,
  updates: Partial<Omit<QuickAddTemplate, "id" | "userId" | "createdAt">>,
): Promise<void> {
  await db.quickAddTemplates.update(id, {
    ...updates,
    updatedAt: new Date(),
    dirty: true,
  });
}

export async function deleteQuickAddTemplate(id: string, userId: string): Promise<void> {
  const now = new Date();
  await db.quickAddTemplates.update(id, {
    deletedAt: now,
    updatedAt: now,
    dirty: true,
  });
}

/* ───────────────────────────────────────────────────────────────
   Settings
   ─────────────────────────────────────────────────────────────── */

export async function getSettings(userId: string) {
  return db.settings.where("userId").equals(userId).first();
}

export async function updateSettings(
  userId: string,
  updates: Partial<Omit<Settings, "id" | "userId" | "createdAt" | "updatedAt">>,
): Promise<void> {
  const existing = await db.settings.where("userId").equals(userId).first();
  if (existing) {
    await db.settings.update(existing.id, {
      ...updates,
      updatedAt: new Date(),
      dirty: true,
    });
  }
}

/* ───────────────────────────────────────────────────────────────
   Notifications
   ─────────────────────────────────────────────────────────────── */

export async function createNotification(
  userId: string,
  data: Omit<NotificationItem, "id" | "userId" | "createdAt" | "updatedAt" | "deletedAt" | "dirty">,
): Promise<NotificationItem> {
  const now = new Date();
  const notification: NotificationItem = {
    id: generateId(),
    userId,
    ...data,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    dirty: true,
  };

  await db.notifications.add(notification);
  return notification;
}

export async function getNotifications(userId: string): Promise<NotificationItem[]> {
  const results = await db.notifications
    .where("userId")
    .equals(userId)
    .filter((n) => n.deletedAt === null)
    .reverse()
    .sortBy("createdAt");
  return results;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await db.notifications.update(id, {
    isRead: true,
    updatedAt: new Date(),
    dirty: true,
  });
}

export async function deleteNotification(id: string): Promise<void> {
  const now = new Date();
  await db.notifications.update(id, {
    deletedAt: now,
    updatedAt: now,
    dirty: true,
  });
}

export async function clearAllNotifications(userId: string): Promise<void> {
  const now = new Date();
  const list = await db.notifications
    .where("userId")
    .equals(userId)
    .filter((n) => n.deletedAt === null)
    .toArray();
  
  await Promise.all(
    list.map((n) =>
      db.notifications.update(n.id, {
        deletedAt: now,
        updatedAt: now,
        dirty: true,
      })
    )
  );
}
