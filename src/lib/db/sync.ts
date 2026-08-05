import { db } from "./dexie";

export async function triggerCloudSync(userId: string) {
  // Check online status before initiating network requests
  if (typeof window !== "undefined" && "navigator" in window && !navigator.onLine) {
    return;
  }

  try {
    // 1. Fetch all dirty records scoped by userId
    const dirtyCategories = await db.categories
      .where("userId")
      .equals(userId)
      .filter((c) => !!c.dirty)
      .toArray();

    const dirtyTransactions = await db.transactions
      .where("userId")
      .equals(userId)
      .filter((t) => !!t.dirty)
      .toArray();

    const dirtyRules = await db.recurringRules
      .where("userId")
      .equals(userId)
      .filter((r) => !!r.dirty)
      .toArray();

    const dirtyGoals = await db.goals
      .where("userId")
      .equals(userId)
      .filter((g) => !!g.dirty)
      .toArray();

    const dirtyTemplates = await db.quickAddTemplates
      .where("userId")
      .equals(userId)
      .filter((q) => !!q.dirty)
      .toArray();

    const dirtySettings = await db.settings
      .where("userId")
      .equals(userId)
      .filter((s) => !!s.dirty)
      .first();

    // Get lastSyncedAt timestamp from settings table
    const userSettings = await db.settings.where("userId").equals(userId).first();
    const lastSyncedAt = userSettings?.lastSyncedAt?.toISOString() || null;

    // Verify if there are changes to push, or if we need to pull
    const hasChanges =
      dirtyCategories.length > 0 ||
      dirtyTransactions.length > 0 ||
      dirtyRules.length > 0 ||
      dirtyGoals.length > 0 ||
      dirtyTemplates.length > 0 ||
      !!dirtySettings;

    if (!hasChanges && !lastSyncedAt) {
      return;
    }

    const changes = {
      categories: dirtyCategories,
      transactions: dirtyTransactions,
      recurringRules: dirtyRules,
      goals: dirtyGoals,
      quickAddTemplates: dirtyTemplates,
      settings: dirtySettings ? [dirtySettings] : [],
    };

    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ changes, lastSyncedAt }),
    });

    if (!res.ok) {
      throw new Error(`Sync API returned status: ${res.status}`);
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to synchronize changes");
    }

    // 2. Perform local write operations to clear dirty flags and merge server records
    await db.transaction(
      "rw",
      [
        db.categories,
        db.transactions,
        db.recurringRules,
        db.goals,
        db.quickAddTemplates,
        db.settings,
      ],
      async () => {
        // Clear local dirty flags
        for (const cat of dirtyCategories) {
          await db.categories.update(cat.id, { dirty: false });
        }
        for (const t of dirtyTransactions) {
          await db.transactions.update(t.id, { dirty: false });
        }
        for (const r of dirtyRules) {
          await db.recurringRules.update(r.id, { dirty: false });
        }
        for (const g of dirtyGoals) {
          await db.goals.update(g.id, { dirty: false });
        }
        for (const q of dirtyTemplates) {
          await db.quickAddTemplates.update(q.id, { dirty: false });
        }
        if (dirtySettings) {
          await db.settings.update(dirtySettings.id, { dirty: false });
        }

        const { updates, syncTime } = data;

        // Merge Categories updates
        for (const cat of updates.categories) {
          await db.categories.put({
            ...cat,
            createdAt: new Date(cat.createdAt),
            updatedAt: new Date(cat.updatedAt),
            deletedAt: cat.deletedAt ? new Date(cat.deletedAt) : null,
          });
        }

        // Merge Transactions updates
        for (const t of updates.transactions) {
          await db.transactions.put({
            ...t,
            date: new Date(t.date),
            createdAt: new Date(t.createdAt),
            updatedAt: new Date(t.updatedAt),
            deletedAt: t.deletedAt ? new Date(t.deletedAt) : null,
          });
        }

        // Merge Recurring Rules updates
        for (const r of updates.recurringRules) {
          await db.recurringRules.put({
            ...r,
            startDate: new Date(r.startDate),
            endDate: r.endDate ? new Date(r.endDate) : null,
            nextDueDate: new Date(r.nextDueDate),
            createdAt: new Date(r.createdAt),
            updatedAt: new Date(r.updatedAt),
            deletedAt: r.deletedAt ? new Date(r.deletedAt) : null,
          });
        }

        // Merge Goals updates
        for (const g of updates.goals) {
          await db.goals.put({
            ...g,
            targetDate: new Date(g.targetDate),
            createdAt: new Date(g.createdAt),
            updatedAt: new Date(g.updatedAt),
            deletedAt: g.deletedAt ? new Date(g.deletedAt) : null,
          });
        }

        // Merge Quick Add Templates updates
        for (const q of updates.quickAddTemplates) {
          await db.quickAddTemplates.put({
            ...q,
            createdAt: new Date(q.createdAt),
            updatedAt: new Date(q.updatedAt),
            deletedAt: q.deletedAt ? new Date(q.deletedAt) : null,
          });
        }

        // Merge Settings updates
        for (const s of updates.settings) {
          await db.settings.put({
            ...s,
            lastSyncedAt: new Date(syncTime),
            createdAt: new Date(s.createdAt),
            updatedAt: new Date(s.updatedAt),
            deletedAt: s.deletedAt ? new Date(s.deletedAt) : null,
          });
        }

        // If settings was not updated by server, refresh lastSyncedAt on existing settings record
        if (updates.settings.length === 0 && userSettings) {
          await db.settings.update(userSettings.id, {
            lastSyncedAt: new Date(syncTime),
          });
        }
      }
    );

    console.log("Neon Postgres cloud sync completed successfully at", data.syncTime);
  } catch (err) {
    console.error("Cloud database sync failed:", err);
  }
}
