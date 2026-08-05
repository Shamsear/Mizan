"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { useSettings } from "@/lib/db/hooks";
import { updateSettings } from "@/lib/db/repository";
import { useToast } from "@/components/Toast/Toast";
import { useConfirm } from "@/components/ConfirmDialog/ConfirmDialog";
import { Icon } from "@/components/Icon/Icon";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import { clearUserData } from "@/lib/db/seed";
import { db } from "@/lib/db/dexie";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

export default function SettingsPage() {
  const { user } = useUser();
  const settings = useSettings();
  const toast = useToast();
  const { confirm } = useConfirm();

  const userId = user?.id;
  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushPermission(Notification.permission);
    }
  }, []);

  async function handleCurrencyChange(code: string) {
    if (!userId || !settings) return;
    await updateSettings(userId, { baseCurrency: code });
    toast.success(`Currency changed to ${code}`);
  }

  async function handleWeekStartChange(v: number) {
    if (!userId) return;
    await updateSettings(userId, { weekStart: v });
    toast.success("Week start updated");
  }

  async function handleThemeChange(t: "light" | "dark" | "system") {
    if (!userId) return;
    await updateSettings(userId, { theme: t });
    toast.success(`Theme updated to ${t}`);
  }

  async function handleRemindersToggle(enabled: boolean) {
    if (!userId) return;
    await updateSettings(userId, { notificationsEnabled: enabled });
    toast.success(enabled ? "Bill reminders enabled" : "Bill reminders disabled");
  }

  async function handleRolloverToggle(enabled: boolean) {
    if (!userId) return;
    await updateSettings(userId, { rolloverEnabled: enabled });
    toast.success(enabled ? "Daily rollover enabled" : "Daily rollover disabled");
  }

  async function handleReminderDaysChange(days: number) {
    if (!userId) return;
    if (days < 1 || days > 7) return;
    await updateSettings(userId, { billReminderDays: days });
  }

  async function handleRequestPushPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Push notifications are not supported on this browser.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      if (permission === "granted") {
        toast.success("Push notifications enabled!");
      } else if (permission === "denied") {
        toast.error("Permission denied. Enable them in your browser settings.");
      }
    } catch {
      toast.error("Failed to request permission.");
    }
  }

  async function handleExportCSV() {
    if (!userId) return;
    try {
      const allTx = await db.transactions.toArray();
      const allCats = await db.categories.toArray();
      const catMap = new Map(allCats.map((c) => [c.id, c.name]));
      
      const headers = ["Date", "Type", "Category", "Amount", "Currency", "Note"];
      const rows = allTx
        .filter((t) => !t.deletedAt)
        .map((t) => {
          const dateStr = t.date instanceof Date ? t.date.toISOString().split("T")[0] : new Date(t.date).toISOString().split("T")[0];
          const typeStr = t.type;
          const catName = catMap.get(t.categoryId) || "Uncategorized";
          const escapedCatName = `"${catName.replace(/"/g, '""')}"`;
          const amountStr = (t.amountCents / 100).toFixed(2);
          const currencyStr = t.currency;
          const noteStr = t.note ? `"${t.note.replace(/"/g, '""')}"` : "";
          return [dateStr, typeStr, escapedCatName, amountStr, currencyStr, noteStr].join(",");
        });
      
      const csvContent = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `mizan_export_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV export completed");
    } catch {
      toast.error("Failed to export data");
    }
  }

  async function handleClearData() {
    if (!userId) return;
    const ok = await confirm({
      title: "Clear all data?",
      message:
        "This permanently deletes all transactions, bills, goals, and settings. This cannot be undone.",
      confirmLabel: "Delete everything",
      dangerous: true,
    });
    if (!ok) return;
    await clearUserData(userId);
    toast.success("All data cleared");
  }

  const currentCurrency = settings?.baseCurrency ?? "QAR";

  return (
    <main className={`app-shell page-enter ${styles.page}`}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
      </header>

      {/* Profile */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Profile</h2>
        <div className={styles.card}>
          <div className={styles.profileRow}>
            <UserButton appearance={{ variables: { colorBackground: "var(--panel-2)" } }} />
            <div className={styles.profileInfo}>
              <p className={styles.profileName}>{user?.fullName ?? user?.firstName ?? "—"}</p>
              <p className={styles.profileEmail}>
                {user?.emailAddresses[0]?.emailAddress ?? ""}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Preferences */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Preferences</h2>

        {/* Currency */}
        <div className={styles.card}>
          <div className={styles.cardRow}>
            <span className={styles.rowIcon}><Icon name="circle-dollar" size={18} /></span>
            <span className={styles.rowLabel}>Currency</span>
            <select
              className={styles.select}
              value={currentCurrency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              aria-label="Select currency"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.divider} />

          {/* Week Start */}
          <div className={styles.cardRow}>
            <span className={styles.rowIcon}><Icon name="calendar" size={18} /></span>
            <span className={styles.rowLabel}>Week starts on</span>
            <div className={styles.pillToggle}>
              <button
                className={`${styles.pill} ${settings?.weekStart === 1 ? styles.pillActive : ""}`}
                onClick={() => handleWeekStartChange(1)}
              >
                Mon
              </button>
              <button
                className={`${styles.pill} ${settings?.weekStart === 0 ? styles.pillActive : ""}`}
                onClick={() => handleWeekStartChange(0)}
              >
                Sun
              </button>
            </div>
          </div>

          <div className={styles.divider} />

          {/* Theme */}
          <div className={styles.cardRow}>
            <span className={styles.rowIcon}><Icon name="moon" size={18} /></span>
            <span className={styles.rowLabel}>Theme</span>
            <div className={styles.pillToggle}>
              {(["light", "dark", "system"] as const).map((t) => (
                <button
                  key={t}
                  className={`${styles.pill} ${
                    (settings?.theme || "system") === t ? styles.pillActive : ""
                  }`}
                  onClick={() => handleThemeChange(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.divider} />

          {/* Rollover */}
          <div className={styles.cardRow}>
            <span className={styles.rowIcon}><Icon name="repeat" size={18} /></span>
            <span className={styles.rowLabel}>Daily Rollover</span>
            <input
              type="checkbox"
              className={styles.toggleCheckbox}
              checked={settings?.rolloverEnabled ?? true}
              onChange={(e) => handleRolloverToggle(e.target.checked)}
              aria-label="Toggle daily rollover"
            />
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Notifications</h2>
        <div className={styles.card}>
          <div className={styles.cardRow}>
            <span className={styles.rowIcon}><Icon name="bell" size={18} /></span>
            <span className={styles.rowLabel}>Bill Reminders</span>
            <input
              type="checkbox"
              className={styles.toggleCheckbox}
              checked={settings?.notificationsEnabled ?? false}
              onChange={(e) => handleRemindersToggle(e.target.checked)}
              aria-label="Toggle bill reminders"
            />
          </div>

          {settings?.notificationsEnabled && (
            <>
              <div className={styles.divider} />
              <div className={styles.cardRow}>
                <span className={styles.rowIcon}><Icon name="clock" size={18} /></span>
                <span className={styles.rowLabel}>Remind before due</span>
                <div className={styles.stepper}>
                  <button
                    className={styles.stepperBtn}
                    onClick={() => handleReminderDaysChange((settings?.billReminderDays ?? 1) - 1)}
                    disabled={(settings?.billReminderDays ?? 1) <= 1}
                  >
                    −
                  </button>
                  <span className={styles.stepperVal}>
                    {settings?.billReminderDays ?? 1} {(settings?.billReminderDays ?? 1) === 1 ? "day" : "days"}
                  </span>
                  <button
                    className={styles.stepperBtn}
                    onClick={() => handleReminderDaysChange((settings?.billReminderDays ?? 1) + 1)}
                    disabled={(settings?.billReminderDays ?? 1) >= 7}
                  >
                    +
                  </button>
                </div>
              </div>
            </>
          )}

          <div className={styles.divider} />
          <div className={styles.cardRow}>
            <span className={styles.rowIcon}><Icon name="smartphone" size={18} /></span>
            <span className={styles.rowLabel}>Push Notifications</span>
            <button
              className={styles.permissionBtn}
              onClick={handleRequestPushPermission}
              disabled={pushPermission === "granted"}
            >
              {pushPermission === "granted"
                ? "Enabled"
                : pushPermission === "denied"
                ? "Blocked"
                : "Enable"}
            </button>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Manage</h2>
        <div className={styles.card}>
          <a href="/categories" className={styles.linkRow}>
            <span className={styles.rowIcon}><Icon name="tag" size={18} /></span>
            <span className={styles.rowLabel}>Categories</span>
            <Icon name="chevron-right" size={16} color="var(--ink-faint)" />
          </a>
          <div className={styles.divider} />
          <a href="/templates" className={styles.linkRow}>
            <span className={styles.rowIcon}><Icon name="zap" size={18} /></span>
            <span className={styles.rowLabel}>Quick-Add Templates</span>
            <Icon name="chevron-right" size={16} color="var(--ink-faint)" />
          </a>
          <div className={styles.divider} />
          <a href="/goals" className={styles.linkRow}>
            <span className={styles.rowIcon}><Icon name="target" size={18} /></span>
            <span className={styles.rowLabel}>Savings Goals</span>
            <Icon name="chevron-right" size={16} color="var(--ink-faint)" />
          </a>
        </div>
      </section>

      {/* Data */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Data</h2>
        <div className={styles.card}>
          <button className={styles.linkRow} onClick={handleExportCSV}>
            <span className={styles.rowIcon}><Icon name="download" size={18} /></span>
            <span className={styles.rowLabel}>Export all data as CSV</span>
            <Icon name="chevron-right" size={16} color="var(--ink-faint)" />
          </button>
          <div className={styles.divider} />
          <button className={`${styles.linkRow} ${styles.dangerRow}`} onClick={handleClearData}>
            <span className={styles.rowIcon}><Icon name="trash-2" size={18} color="var(--over)" /></span>
            <span className={styles.rowLabel} style={{ color: "var(--over)" }}>
              Clear all data
            </span>
            <Icon name="chevron-right" size={16} color="var(--over)" />
          </button>
        </div>
      </section>

      {/* About */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>About</h2>
        <div className={styles.card}>
          <div className={styles.cardRow}>
            <span className={styles.rowIcon}><Icon name="info" size={18} /></span>
            <span className={styles.rowLabel}>Version</span>
            <span className={styles.rowValue}>0.1.0</span>
          </div>
        </div>
      </section>
    </main>
  );
}
