import { db, type Category, type Settings, type QuickAddTemplate } from "./dexie";
import { detectCurrency } from "@/lib/currency";

/**
 * Seed default categories, settings, and quick-add templates for new users.
 * Called on first launch or when userId changes.
 */

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export async function seedUserData(userId: string): Promise<void> {
  const now = new Date();

  // Check if already seeded for this user
  const existingSettings = await db.settings
    .where("userId")
    .equals(userId)
    .first();
  
  if (existingSettings) {
    return; // Already seeded
  }

  /* ───────────────────────────────────────────────────────────────
     Default Categories
     ─────────────────────────────────────────────────────────────── */

  const defaultCategories: Omit<Category, "createdAt" | "updatedAt">[] = [
    // Income
    {
      id: generateId(),
      userId,
      name: "Salary",
      kind: "income",
      color: "#10b981",
      icon: "briefcase",
      sortOrder: 0,
      deletedAt: null,
    },
    {
      id: generateId(),
      userId,
      name: "Freelance",
      kind: "income",
      color: "#06b6d4",
      icon: "monitor",
      sortOrder: 1,
      deletedAt: null,
    },
    {
      id: generateId(),
      userId,
      name: "Investment",
      kind: "income",
      color: "#8b5cf6",
      icon: "trending-up",
      sortOrder: 2,
      deletedAt: null,
    },
    {
      id: generateId(),
      userId,
      name: "Other Income",
      kind: "income",
      color: "#64748b",
      icon: "circle-dollar",
      sortOrder: 3,
      deletedAt: null,
    },

    // Expenses
    {
      id: generateId(),
      userId,
      name: "Housing",
      kind: "expense",
      color: "#ef4444",
      icon: "home",
      monthlyBudgetCents: 80000,
      sortOrder: 10,
      deletedAt: null,
    },
    {
      id: generateId(),
      userId,
      name: "Food & Dining",
      kind: "expense",
      color: "#f59e0b",
      icon: "utensils",
      monthlyBudgetCents: 30000,
      sortOrder: 11,
      deletedAt: null,
    },
    {
      id: generateId(),
      userId,
      name: "Transport",
      kind: "expense",
      color: "#3b82f6",
      icon: "car",
      monthlyBudgetCents: 15000,
      sortOrder: 12,
      deletedAt: null,
    },
    {
      id: generateId(),
      userId,
      name: "Groceries",
      kind: "expense",
      color: "#22c55e",
      icon: "shopping-cart",
      monthlyBudgetCents: 25000,
      sortOrder: 13,
      deletedAt: null,
    },
    {
      id: generateId(),
      userId,
      name: "Utilities",
      kind: "expense",
      color: "#eab308",
      icon: "zap",
      monthlyBudgetCents: 12000,
      sortOrder: 14,
      deletedAt: null,
    },
    {
      id: generateId(),
      userId,
      name: "Healthcare",
      kind: "expense",
      color: "#ec4899",
      icon: "heart-pulse",
      sortOrder: 15,
      deletedAt: null,
    },
    {
      id: generateId(),
      userId,
      name: "Entertainment",
      kind: "expense",
      color: "#a855f7",
      icon: "clapperboard",
      monthlyBudgetCents: 10000,
      sortOrder: 16,
      deletedAt: null,
    },
    {
      id: generateId(),
      userId,
      name: "Shopping",
      kind: "expense",
      color: "#f43f5e",
      icon: "shopping-bag",
      monthlyBudgetCents: 20000,
      sortOrder: 17,
      deletedAt: null,
    },
    {
      id: generateId(),
      userId,
      name: "Education",
      kind: "expense",
      color: "#06b6d4",
      icon: "book-open",
      sortOrder: 18,
      deletedAt: null,
    },
    {
      id: generateId(),
      userId,
      name: "Subscriptions",
      kind: "expense",
      color: "#8b5cf6",
      icon: "smartphone",
      monthlyBudgetCents: 5000,
      sortOrder: 19,
      deletedAt: null,
    },
    {
      id: generateId(),
      userId,
      name: "Other Expense",
      kind: "expense",
      color: "#64748b",
      icon: "arrow-down-circle",
      sortOrder: 20,
      deletedAt: null,
    },
    {
      id: generateId(),
      userId,
      name: "Zakat & Charity",
      kind: "expense",
      color: "#10b981",
      icon: "heart",
      sortOrder: 21,
      deletedAt: null,
    },
    {
      id: generateId(),
      userId,
      name: "Majlis & Social",
      kind: "expense",
      color: "#f59e0b",
      icon: "users",
      sortOrder: 22,
      deletedAt: null,
    },
  ];

  await db.categories.bulkAdd(
    defaultCategories.map((cat) => ({
      ...cat,
      createdAt: now,
      updatedAt: now,
    })),
  );

  /* ───────────────────────────────────────────────────────────────
     Default Settings
     ─────────────────────────────────────────────────────────────── */
  const detected = typeof navigator !== "undefined" ? detectCurrency(navigator.language) : "QAR";

  const defaultSettings: Omit<Settings, "createdAt" | "updatedAt"> = {
    id: generateId(),
    userId,
    baseCurrency: detected || "QAR",
    weekStart: 0, // Qatar starts week on Sunday (0) instead of Monday (1)
    theme: "system",
    syncEnabled: true,
    notificationsEnabled: false,
    billReminderDays: 1,
    deletedAt: null,
  };

  await db.settings.add({
    ...defaultSettings,
    createdAt: now,
    updatedAt: now,
  });

  /* ───────────────────────────────────────────────────────────────
     Starter Quick-Add Templates
     ─────────────────────────────────────────────────────────────── */

  // Get category IDs for templates
  const salaryCategory = await db.categories
    .where("userId")
    .equals(userId)
    .filter((cat) => cat.name === "Salary")
    .first();
  
  const housingCategory = await db.categories
    .where("userId")
    .equals(userId)
    .filter((cat) => cat.name === "Housing")
    .first();
  
  const foodCategory = await db.categories
    .where("userId")
    .equals(userId)
    .filter((cat) => cat.name === "Food & Dining")
    .first();
  
  const groceriesCategory = await db.categories
    .where("userId")
    .equals(userId)
    .filter((cat) => cat.name === "Groceries")
    .first();
  
  const transportCategory = await db.categories
    .where("userId")
    .equals(userId)
    .filter((cat) => cat.name === "Transport")
    .first();

  if (salaryCategory && housingCategory && foodCategory && groceriesCategory && transportCategory) {
    const starterTemplates: Omit<QuickAddTemplate, "createdAt" | "updatedAt">[] = [
      {
        id: generateId(),
        userId,
        label: "Salary",
        amountCents: 400000,
        currency: detected || "QAR",
        type: "income",
        categoryId: salaryCategory.id,
        icon: "briefcase",
        sortOrder: 0,
        deletedAt: null,
      },
      {
        id: generateId(),
        userId,
        label: "Room Rent",
        amountCents: 80000,
        currency: detected || "QAR",
        type: "expense",
        categoryId: housingCategory.id,
        icon: "home",
        sortOrder: 1,
        deletedAt: null,
      },
      {
        id: generateId(),
        userId,
        label: "Coffee",
        amountCents: 300,
        currency: detected || "QAR",
        type: "expense",
        categoryId: foodCategory.id,
        icon: "coffee",
        sortOrder: 2,
        deletedAt: null,
      },
      {
        id: generateId(),
        userId,
        label: "Groceries",
        amountCents: 4500,
        currency: detected || "QAR",
        type: "expense",
        categoryId: groceriesCategory.id,
        icon: "shopping-cart",
        sortOrder: 3,
        deletedAt: null,
      },
      {
        id: generateId(),
        userId,
        label: "Transport",
        amountCents: 250,
        currency: detected || "QAR",
        type: "expense",
        categoryId: transportCategory.id,
        icon: "bus",
        sortOrder: 4,
        deletedAt: null,
      },
    ];

    await db.quickAddTemplates.bulkAdd(
      starterTemplates.map((tpl) => ({
        ...tpl,
        createdAt: now,
        updatedAt: now,
      })),
    );
  }
}

/**
 * Clear all data for a user (useful for testing or logout).
 */
export async function clearUserData(userId: string): Promise<void> {
  await Promise.all([
    db.transactions.where("userId").equals(userId).delete(),
    db.categories.where("userId").equals(userId).delete(),
    db.recurringRules.where("userId").equals(userId).delete(),
    db.routineItems.where("userId").equals(userId).delete(),
    db.goals.where("userId").equals(userId).delete(),
    db.savingsPlans.where("userId").equals(userId).delete(),
    db.quickAddTemplates.where("userId").equals(userId).delete(),
    db.accounts.where("userId").equals(userId).delete(),
    db.settings.where("userId").equals(userId).delete(),
  ]);
}
