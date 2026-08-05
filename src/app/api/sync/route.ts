import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";

// Ensure DATABASE_URL is present
const databaseUrl = process.env.DATABASE_URL;

async function ensureTables(sql: any) {
  // Create all required sync tables in Neon Postgres
  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      kind TEXT NOT NULL,
      monthly_limit INT,
      sort_order INT NOT NULL,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL,
      deleted_at TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount_cents INT NOT NULL,
      currency TEXT NOT NULL,
      category_id TEXT NOT NULL,
      note TEXT,
      date TIMESTAMP NOT NULL,
      recurring_id TEXT,
      account_id TEXT,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL,
      deleted_at TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS recurring_rules (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      amount_cents INT NOT NULL,
      currency TEXT NOT NULL,
      category_id TEXT NOT NULL,
      frequency TEXT NOT NULL,
      interval INT NOT NULL,
      day_of_month INT,
      day_of_week INT,
      start_date TIMESTAMP NOT NULL,
      end_date TIMESTAMP,
      next_due_date TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL,
      deleted_at TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      target_cents INT NOT NULL,
      current_cents INT NOT NULL,
      currency TEXT NOT NULL,
      target_date TIMESTAMP NOT NULL,
      priority INT NOT NULL,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL,
      deleted_at TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS quick_add_templates (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      amount_cents INT NOT NULL,
      currency TEXT NOT NULL,
      category_id TEXT NOT NULL,
      sort_order INT NOT NULL,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL,
      deleted_at TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      currency TEXT NOT NULL,
      week_start INT NOT NULL,
      theme TEXT NOT NULL,
      notifications_enabled BOOLEAN NOT NULL,
      bill_reminder_days INT NOT NULL,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL,
      deleted_at TIMESTAMP
    );
  `;
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!databaseUrl) {
      return NextResponse.json(
        { error: "DATABASE_URL is not configured" },
        { status: 500 }
      );
    }

    const sql = neon(databaseUrl);
    await ensureTables(sql);

    const body = await req.json();
    const { changes, lastSyncedAt } = body;
    const clientSyncTime = new Date();

    // 1. Process client pushes
    if (changes) {
      const {
        categories = [],
        transactions = [],
        recurringRules = [],
        goals = [],
        quickAddTemplates = [],
        settings = [],
      } = changes;

      // Upsert Categories
      for (const cat of categories) {
        await sql`
          INSERT INTO categories (id, user_id, name, icon, color, kind, monthly_limit, sort_order, created_at, updated_at, deleted_at)
          VALUES (${cat.id}, ${userId}, ${cat.name}, ${cat.icon}, ${cat.color}, ${cat.kind}, ${cat.monthlyLimit || null}, ${cat.sortOrder}, ${new Date(cat.createdAt)}, ${new Date(cat.updatedAt)}, ${cat.deletedAt ? new Date(cat.deletedAt) : null})
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            icon = EXCLUDED.icon,
            color = EXCLUDED.color,
            kind = EXCLUDED.kind,
            monthly_limit = EXCLUDED.monthly_limit,
            sort_order = EXCLUDED.sort_order,
            updated_at = EXCLUDED.updated_at,
            deleted_at = EXCLUDED.deleted_at;
        `;
      }

      // Upsert Transactions
      for (const t of transactions) {
        await sql`
          INSERT INTO transactions (id, user_id, type, amount_cents, currency, category_id, note, date, recurring_id, account_id, created_at, updated_at, deleted_at)
          VALUES (${t.id}, ${userId}, ${t.type}, ${t.amountCents}, ${t.currency}, ${t.categoryId}, ${t.note || null}, ${new Date(t.date)}, ${t.recurringId || null}, ${t.accountId || null}, ${new Date(t.createdAt)}, ${new Date(t.updatedAt)}, ${t.deletedAt ? new Date(t.deletedAt) : null})
          ON CONFLICT (id) DO UPDATE SET
            type = EXCLUDED.type,
            amount_cents = EXCLUDED.amount_cents,
            currency = EXCLUDED.currency,
            category_id = EXCLUDED.category_id,
            note = EXCLUDED.note,
            date = EXCLUDED.date,
            recurring_id = EXCLUDED.recurring_id,
            account_id = EXCLUDED.account_id,
            updated_at = EXCLUDED.updated_at,
            deleted_at = EXCLUDED.deleted_at;
        `;
      }

      // Upsert Recurring Rules
      for (const r of recurringRules) {
        await sql`
          INSERT INTO recurring_rules (id, user_id, name, amount_cents, currency, category_id, frequency, interval, day_of_month, day_of_week, start_date, end_date, next_due_date, created_at, updated_at, deleted_at)
          VALUES (${r.id}, ${userId}, ${r.name}, ${r.amountCents}, ${r.currency}, ${r.categoryId}, ${r.frequency}, ${r.interval}, ${r.dayOfMonth || null}, ${r.dayOfWeek || null}, ${new Date(r.startDate)}, ${r.endDate ? new Date(r.endDate) : null}, ${new Date(r.nextDueDate)}, ${new Date(r.createdAt)}, ${new Date(r.updatedAt)}, ${r.deletedAt ? new Date(r.deletedAt) : null})
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            amount_cents = EXCLUDED.amount_cents,
            currency = EXCLUDED.currency,
            category_id = EXCLUDED.category_id,
            frequency = EXCLUDED.frequency,
            interval = EXCLUDED.interval,
            day_of_month = EXCLUDED.day_of_month,
            day_of_week = EXCLUDED.day_of_week,
            start_date = EXCLUDED.start_date,
            end_date = EXCLUDED.end_date,
            next_due_date = EXCLUDED.next_due_date,
            updated_at = EXCLUDED.updated_at,
            deleted_at = EXCLUDED.deleted_at;
        `;
      }

      // Upsert Goals
      for (const g of goals) {
        await sql`
          INSERT INTO goals (id, user_id, name, target_cents, current_cents, currency, target_date, priority, created_at, updated_at, deleted_at)
          VALUES (${g.id}, ${userId}, ${g.name}, ${g.targetCents}, ${g.currentCents}, ${g.currency}, ${new Date(g.targetDate)}, ${g.priority}, ${new Date(g.createdAt)}, ${new Date(g.updatedAt)}, ${g.deletedAt ? new Date(g.deletedAt) : null})
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            target_cents = EXCLUDED.target_cents,
            current_cents = EXCLUDED.current_cents,
            currency = EXCLUDED.currency,
            target_date = EXCLUDED.target_date,
            priority = EXCLUDED.priority,
            updated_at = EXCLUDED.updated_at,
            deleted_at = EXCLUDED.deleted_at;
        `;
      }

      // Upsert Quick Add Templates
      for (const q of quickAddTemplates) {
        await sql`
          INSERT INTO quick_add_templates (id, user_id, name, amount_cents, currency, category_id, sort_order, created_at, updated_at, deleted_at)
          VALUES (${q.id}, ${userId}, ${q.name}, ${q.amountCents}, ${q.currency}, ${q.categoryId}, ${q.sortOrder}, ${new Date(q.createdAt)}, ${new Date(q.updatedAt)}, ${q.deletedAt ? new Date(q.deletedAt) : null})
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            amount_cents = EXCLUDED.amount_cents,
            currency = EXCLUDED.currency,
            category_id = EXCLUDED.category_id,
            sort_order = EXCLUDED.sort_order,
            updated_at = EXCLUDED.updated_at,
            deleted_at = EXCLUDED.deleted_at;
        `;
      }

      // Upsert Settings
      for (const s of settings) {
        await sql`
          INSERT INTO settings (id, user_id, currency, week_start, theme, notifications_enabled, bill_reminder_days, created_at, updated_at, deleted_at)
          VALUES (${s.id}, ${userId}, ${s.currency}, ${s.weekStart}, ${s.theme}, ${s.notificationsEnabled}, ${s.billReminderDays}, ${new Date(s.createdAt)}, ${new Date(s.updatedAt)}, ${s.deletedAt ? new Date(s.deletedAt) : null})
          ON CONFLICT (id) DO UPDATE SET
            currency = EXCLUDED.currency,
            week_start = EXCLUDED.week_start,
            theme = EXCLUDED.theme,
            notifications_enabled = EXCLUDED.notifications_enabled,
            bill_reminder_days = EXCLUDED.bill_reminder_days,
            updated_at = EXCLUDED.updated_at,
            deleted_at = EXCLUDED.deleted_at;
        `;
      }
    }

    // 2. Fetch server updates to return to the client
    const lastSyncDate = lastSyncedAt ? new Date(lastSyncedAt) : new Date(0);

    const updatedCategories = await sql`
      SELECT * FROM categories WHERE user_id = ${userId} AND updated_at > ${lastSyncDate}
    `;
    const updatedTransactions = await sql`
      SELECT * FROM transactions WHERE user_id = ${userId} AND updated_at > ${lastSyncDate}
    `;
    const updatedRecurringRules = await sql`
      SELECT * FROM recurring_rules WHERE user_id = ${userId} AND updated_at > ${lastSyncDate}
    `;
    const updatedGoals = await sql`
      SELECT * FROM goals WHERE user_id = ${userId} AND updated_at > ${lastSyncDate}
    `;
    const updatedTemplates = await sql`
      SELECT * FROM quick_add_templates WHERE user_id = ${userId} AND updated_at > ${lastSyncDate}
    `;
    const updatedSettings = await sql`
      SELECT * FROM settings WHERE user_id = ${userId} AND updated_at > ${lastSyncDate}
    `;

    return NextResponse.json({
      success: true,
      syncTime: clientSyncTime.toISOString(),
      updates: {
        categories: updatedCategories.map((c: any) => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          color: c.color,
          kind: c.kind,
          monthlyLimit: c.monthly_limit,
          sortOrder: c.sort_order,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
          deletedAt: c.deleted_at,
        })),
        transactions: updatedTransactions.map((t: any) => ({
          id: t.id,
          type: t.type,
          amountCents: t.amount_cents,
          currency: t.currency,
          categoryId: t.category_id,
          note: t.note,
          date: t.date,
          recurringId: t.recurring_id,
          accountId: t.account_id,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
          deletedAt: t.deleted_at,
        })),
        recurringRules: updatedRecurringRules.map((r: any) => ({
          id: r.id,
          name: r.name,
          amountCents: r.amount_cents,
          currency: r.currency,
          categoryId: r.category_id,
          frequency: r.frequency,
          interval: r.interval,
          dayOfMonth: r.day_of_month,
          dayOfWeek: r.day_of_week,
          startDate: r.start_date,
          endDate: r.end_date,
          nextDueDate: r.next_due_date,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          deletedAt: r.deleted_at,
        })),
        goals: updatedGoals.map((g: any) => ({
          id: g.id,
          name: g.name,
          targetCents: g.target_cents,
          currentCents: g.current_cents,
          currency: g.currency,
          targetDate: g.target_date,
          priority: g.priority,
          createdAt: g.created_at,
          updatedAt: g.updated_at,
          deletedAt: g.deleted_at,
        })),
        quickAddTemplates: updatedTemplates.map((q: any) => ({
          id: q.id,
          name: q.name,
          amountCents: q.amount_cents,
          currency: q.currency,
          categoryId: q.category_id,
          sortOrder: q.sort_order,
          createdAt: q.created_at,
          updatedAt: q.updated_at,
          deletedAt: q.deleted_at,
        })),
        settings: updatedSettings.map((s: any) => ({
          id: s.id,
          currency: s.currency,
          weekStart: s.week_start,
          theme: s.theme,
          notificationsEnabled: s.notifications_enabled,
          billReminderDays: s.bill_reminder_days,
          createdAt: s.created_at,
          updatedAt: s.updated_at,
          deletedAt: s.deleted_at,
        })),
      },
    });
  } catch (err: any) {
    console.error("Sync error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to sync database" },
      { status: 500 }
    );
  }
}
