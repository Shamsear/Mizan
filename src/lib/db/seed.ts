import { db, type Category, type Settings } from "./dexie";
import { detectCurrency } from "@/lib/currency";
import { addMonths } from "date-fns";

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
    rolloverEnabled: true,
    profileType: "worker",
    deletedAt: null,
  };

  await db.settings.add({
    ...defaultSettings,
    createdAt: now,
    updatedAt: now,
  });

  /* ───────────────────────────────────────────────────────────────
     Import temporary guest onboarding data if present
     ─────────────────────────────────────────────────────────────── */
  if (typeof window !== "undefined" && window.localStorage) {
      const temp = localStorage.getItem("mizan_onboarding_temp");
      if (temp) {
        try {
          const data = JSON.parse(temp);
          const detected = detectCurrency(userId);
          const currency = detected || "QAR";

          // Add Income rule
          const incomeCents = Math.round(parseFloat(data.incomeAmount) * 100);
          if (incomeCents > 0) {
            await db.recurringRules.add({
              id: `${Date.now()}-income`,
              userId,
              label: "Salary",
              amountCents: incomeCents,
              currency,
              type: "income",
              categoryId: "income",
              cadence: (data.incomeFrequency || "monthly") as any,
              nextDueDate: now,
              autoPost: true,
              createdAt: now,
              updatedAt: now,
              deletedAt: null,
              dirty: true,
            });
          }

          // Add Bills rules
          const billsCategory = await db.categories
            .where("userId")
            .equals(userId)
            .filter((c) => c.name === "Bills" || c.name === "Housing" || c.name === "Utilities")
            .first();
          const billsCatId = billsCategory?.id || "bills";

          for (const bill of data.bills) {
            const billCents = Math.round(parseFloat(bill.amount) * 100);
            if (bill.label.trim() && billCents > 0) {
              await db.recurringRules.add({
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                userId,
                label: bill.label.trim(),
                amountCents: billCents,
                currency,
                type: "expense",
                categoryId: billsCatId,
                cadence: "monthly",
                nextDueDate: now,
                autoPost: true,
                createdAt: now,
                updatedAt: now,
                deletedAt: null,
                dirty: true,
              });
            }
          }

          // Add Goal
          const goalCents = Math.round(parseFloat(data.goalAmount) * 100);
          if (data.goalName && data.goalName.trim() && goalCents > 0) {
            await db.goals.add({
              id: `${Date.now()}-goal`,
              userId,
              name: data.goalName.trim(),
              targetCents: goalCents,
              savedCents: 0,
              targetDate: addMonths(now, data.goalMonths || 6),
              currency,
              priority: 1,
              icon: "target",
              createdAt: now,
              updatedAt: now,
              deletedAt: null,
              dirty: true,
            });
          }

          // Job Seeker setup import
          if (data.profileType === "jobseeker") {
            const isCustom = data.qatarBudgetPreset === "custom";
            const rent = isCustom ? data.qatarCustomRent : 0;
            const food = isCustom ? data.qatarCustomFood : 0;
            const transport = isCustom ? data.qatarCustomTransport : 0;
            const dataVal = isCustom ? data.qatarCustomData : 0;
            const miscVal = isCustom ? data.qatarCustomMisc : 50;

            const presets = {
              survival: { rent: 450, food: 200, transport: 70, data: 30 },
              standard: { rent: 900, food: 400, transport: 200, data: 100 },
              comfortable: { rent: 1800, food: 700, transport: 400, data: 100 },
            };

            const presetRent = isCustom ? rent : presets[data.qatarBudgetPreset as keyof typeof presets]?.rent || 450;
            const presetFood = isCustom ? food : presets[data.qatarBudgetPreset as keyof typeof presets]?.food || 200;
            const presetTransport = isCustom ? transport : presets[data.qatarBudgetPreset as keyof typeof presets]?.transport || 70;
            const presetData = isCustom ? dataVal : presets[data.qatarBudgetPreset as keyof typeof presets]?.data || 30;
            const presetMisc = isCustom ? miscVal : 50;

            const qatarSavingsQAR = Math.round((data.qatarSavingsCents) / (data.qatarExchangeRate || 1));

            // Find settings ID for the user
            const userSettings = await db.settings
              .where("userId")
              .equals(userId)
              .first();

            if (userSettings) {
              await db.settings.update(userSettings.id, {
                profileType: "jobseeker",
                baseCurrency: "QAR",
                qatarSavingsCents: qatarSavingsQAR,
                qatarVisaDays: data.qatarVisaDays,
                qatarHomeCurrency: data.qatarHomeCurrency,
                qatarExchangeRate: data.qatarExchangeRate,
                qatarBudgetPreset: data.qatarBudgetPreset,
                qatarCustomRentCents: presetRent * 100,
                qatarCustomFoodCents: presetFood * 100,
                qatarCustomTransportCents: presetTransport * 100,
                qatarCustomDataCents: presetData * 100,
                qatarCustomMiscCents: presetMisc * 100,
                updatedAt: now,
                dirty: true,
              });
            }

            // Create initial savings transaction if empty
            const txnsCount = await db.transactions.where("userId").equals(userId).count();
            if (txnsCount === 0) {
              await db.transactions.add({
                id: `${Date.now()}-savings-capital`,
                userId,
                type: "income",
                amountCents: qatarSavingsQAR,
                currency: "QAR",
                categoryId: "income",
                note: `Initial job seeker savings (${Math.round(data.qatarSavingsCents / 100)} ${data.qatarHomeCurrency})`,
                date: now,
                createdAt: now,
                updatedAt: now,
                deletedAt: null,
                dirty: true,
              });
            }
          }

          localStorage.removeItem("mizan_onboarding_temp");
        } catch (e) {
          console.error("Failed to parse temp guest onboarding:", e);
        }
      }
    }
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
