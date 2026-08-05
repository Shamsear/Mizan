import Dexie, { type EntityTable } from "dexie";

/**
 * Runway local database — IndexedDB via Dexie.
 * This is the source of truth; cloud sync is optional backup.
 */

/* ───────────────────────────────────────────────────────────────
   Sync Metadata (on every record)
   ─────────────────────────────────────────────────────────────── */
export interface SyncMeta {
  /** Client-generated UUID/ULID — stable across devices. */
  id: string;
  /** Clerk userId — scopes all user data. */
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  /** Soft delete tombstone (null = active). */
  deletedAt: Date | null;
  /** Local-only: has unsaved changes (for sync push). */
  dirty?: boolean;
}

/* ───────────────────────────────────────────────────────────────
   Table Schemas
   ─────────────────────────────────────────────────────────────── */

export interface Transaction extends SyncMeta {
  type: "income" | "expense";
  /** Amount in minor units (cents). */
  amountCents: number;
  currency: string;
  categoryId: string;
  note?: string;
  /** Transaction date (user-chosen, not createdAt). */
  date: Date;
  /** Link to recurring rule if auto-posted. */
  recurringId?: string;
  /** Optional account/wallet. */
  accountId?: string;
}

export interface Category extends SyncMeta {
  name: string;
  kind: "income" | "expense";
  color: string;
  icon: string;
  /** Monthly budget in cents (optional). */
  monthlyBudgetCents?: number;
  sortOrder: number;
}

export interface RecurringRule extends SyncMeta {
  label: string;
  amountCents: number;
  currency: string;
  type: "income" | "expense";
  categoryId: string;
  /** Cadence: daily, weekly, biweekly, monthly, yearly. */
  cadence: "daily" | "weekly" | "biweekly" | "monthly" | "yearly";
  /** Next due date (updated after each auto-post). */
  nextDueDate: Date;
  /** Auto-generate transaction on due date. */
  autoPost: boolean;
  note?: string;
}

export interface RoutineItem extends SyncMeta {
  label: string;
  amountCents: number;
  currency: string;
  categoryId: string;
  /** Cadence: daily, weekly, weekdays, monthly, yearly. */
  cadence: "daily" | "weekly" | "weekdays" | "monthly" | "yearly";
  /** Normalized daily rate (calculated on save). */
  dailyRateCents: number;
}

export interface Goal extends SyncMeta {
  name: string;
  targetCents: number;
  /** Current saved amount. */
  savedCents: number;
  targetDate?: Date;
  currency: string;
  priority: number;
  color?: string;
  icon?: string;
}

export interface SavingsPlan extends SyncMeta {
  label: string;
  amountCents: number;
  currency: string;
  /** Cadence: daily, weekly, monthly. */
  cadence: "daily" | "weekly" | "monthly";
  /** Link to a goal (optional). */
  linkedGoalId?: string;
  /** Auto-deduct from safe-to-spend. */
  autoApply: boolean;
  nextDueDate: Date;
}

export interface QuickAddTemplate extends SyncMeta {
  label: string;
  amountCents: number;
  currency: string;
  type: "income" | "expense";
  categoryId: string;
  icon: string;
  sortOrder: number;
  /** Link to recurring rule if this is also a recurring item. */
  recurringRuleId?: string;
}

export interface Account extends SyncMeta {
  name: string;
  type: "cash" | "card" | "bank";
  balanceCents: number;
  currency: string;
  color?: string;
  icon?: string;
  sortOrder: number;
}

export interface Settings extends SyncMeta {
  /** Base currency (ISO code). */
  baseCurrency: string;
  /** Week start day (0=Sunday, 1=Monday). */
  weekStart: number;
  /** Theme: light, dark, system. */
  theme: "light" | "dark" | "system";
  /** Sync enabled (default true when signed in). */
  syncEnabled: boolean;
  /** Last successful sync timestamp. */
  lastSyncedAt?: Date;
  /** Notifications enabled. */
  notificationsEnabled: boolean;
  /** Bill reminder days before due (e.g. 1 = remind 1 day before). */
  billReminderDays: number;
}

export interface NotificationItem extends SyncMeta {
  title: string;
  body: string;
  category: "bills" | "budgets" | "goals" | "system";
  url: string;
  isRead: boolean;
}

/* ───────────────────────────────────────────────────────────────
   Dexie Database
   ─────────────────────────────────────────────────────────────── */

export class MizanDB extends Dexie {
  transactions!: EntityTable<Transaction, "id">;
  categories!: EntityTable<Category, "id">;
  recurringRules!: EntityTable<RecurringRule, "id">;
  routineItems!: EntityTable<RoutineItem, "id">;
  goals!: EntityTable<Goal, "id">;
  savingsPlans!: EntityTable<SavingsPlan, "id">;
  quickAddTemplates!: EntityTable<QuickAddTemplate, "id">;
  accounts!: EntityTable<Account, "id">;
  settings!: EntityTable<Settings, "id">;
  notifications!: EntityTable<NotificationItem, "id">;

  constructor() {
    super("MizanDB");

    // Version 3: Added local notifications inbox
    this.version(3).stores({
      transactions:
        "id, userId, date, type, categoryId, recurringId, accountId, deletedAt",
      categories: "id, userId, kind, sortOrder, deletedAt",
      recurringRules: "id, userId, nextDueDate, type, deletedAt",
      routineItems: "id, userId, categoryId, deletedAt",
      goals: "id, userId, targetDate, priority, deletedAt",
      savingsPlans: "id, userId, nextDueDate, linkedGoalId, deletedAt",
      quickAddTemplates: "id, userId, sortOrder, deletedAt",
      accounts: "id, userId, sortOrder, deletedAt",
      settings: "id, userId",
      notifications: "id, userId, isRead, createdAt, deletedAt",
    });

    // Version 2: Removed compound indexes with nullable fields
    this.version(2).stores({
      transactions:
        "id, userId, date, type, categoryId, recurringId, accountId, deletedAt",
      categories: "id, userId, kind, sortOrder, deletedAt",
      recurringRules: "id, userId, nextDueDate, type, deletedAt",
      routineItems: "id, userId, categoryId, deletedAt",
      goals: "id, userId, targetDate, priority, deletedAt",
      savingsPlans: "id, userId, nextDueDate, linkedGoalId, deletedAt",
      quickAddTemplates: "id, userId, sortOrder, deletedAt",
      accounts: "id, userId, sortOrder, deletedAt",
      settings: "id, userId",
    });

    // Version 1: Original schema (deprecated)
    this.version(1).stores({
      transactions:
        "id, userId, date, type, categoryId, recurringId, accountId, deletedAt",
      categories: "id, userId, kind, sortOrder, deletedAt",
      recurringRules: "id, userId, nextDueDate, type, deletedAt",
      routineItems: "id, userId, categoryId, deletedAt",
      goals: "id, userId, targetDate, priority, deletedAt",
      savingsPlans: "id, userId, nextDueDate, linkedGoalId, deletedAt",
      quickAddTemplates: "id, userId, sortOrder, deletedAt",
      accounts: "id, userId, sortOrder, deletedAt",
      settings: "id, userId",
    });
  }
}

export const db = new MizanDB();
