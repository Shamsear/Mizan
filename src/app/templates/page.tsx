"use client";

import { useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuickAddTemplates, useCategories, useCurrency } from "@/lib/db/hooks";
import {
  createQuickAddTemplate,
  updateQuickAddTemplate,
  deleteQuickAddTemplate,
} from "@/lib/db/repository";
import { db, type QuickAddTemplate, type Category } from "@/lib/db/dexie";
import { Icon } from "@/components/Icon/Icon";
import { Sheet } from "@/components/Sheet/Sheet";
import { useToast } from "@/components/Toast/Toast";
import { useConfirm } from "@/components/ConfirmDialog/ConfirmDialog";
import { formatCents } from "@/lib/money";
import Link from "next/link";
import styles from "./page.module.css";

const TEMPLATE_ICONS = [
  "circle-dollar", "utensils", "car", "shopping-cart", "zap", "heart-pulse",
  "clapperboard", "shopping-bag", "book-open", "smartphone", "bus", "coffee",
  "target", "calendar", "clock", "tag", "wallet", "home", "star", "gift",
];

export default function TemplatesPage() {
  const { user } = useUser();
  const templates = useQuickAddTemplates();
  const categories = useCategories();
  const toast = useToast();
  const { confirm } = useConfirm();

  const [editingTemplate, setEditingTemplate] = useState<QuickAddTemplate | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  // Form states
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [categoryId, setCategoryId] = useState("");
  const [icon, setIcon] = useState(TEMPLATE_ICONS[0]);

  const categoryMap = useMemo(() => {
    const m = new Map<string, Category>();
    categories?.forEach((c) => m.set(c.id, c));
    return m;
  }, [categories]);

  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    return categories.filter((c) => c.kind === type);
  }, [categories, type]);

  async function moveTemplate(index: number, direction: "up" | "down") {
    if (!templates || !user?.id) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= templates.length) return;

    const currentTpl = templates[index];
    const targetTpl = templates[targetIndex];

    const currentOrder = currentTpl.sortOrder;
    const targetOrder = targetTpl.sortOrder;

    try {
      const now = new Date();
      await db.quickAddTemplates.update(currentTpl.id, { sortOrder: targetOrder, updatedAt: now, dirty: true });
      await db.quickAddTemplates.update(targetTpl.id, { sortOrder: currentOrder, updatedAt: now, dirty: true });
    } catch {
      toast.error("Failed to reorder templates");
    }
  }

  function openEdit(tpl: QuickAddTemplate) {
    setEditingTemplate(tpl);
    setLabel(tpl.label);
    setAmount((tpl.amountCents / 100).toString());
    setType(tpl.type);
    setCategoryId(tpl.categoryId);
    setIcon(tpl.icon || TEMPLATE_ICONS[0]);
  }

  function openAdd() {
    setLabel("");
    setAmount("");
    setType("expense");
    setCategoryId("");
    setIcon(TEMPLATE_ICONS[0]);
    setShowAddForm(true);
  }

  function closeForm() {
    setEditingTemplate(null);
    setShowAddForm(false);
  }

  async function handleSave() {
    if (!user?.id) return;
    if (!label.trim()) {
      toast.error("Please enter a template label");
      return;
    }
    const cents = amount ? Math.round(parseFloat(amount) * 100) : 0;
    if (isNaN(cents) || cents <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!categoryId) {
      toast.error("Please select a category");
      return;
    }

    try {
      if (editingTemplate) {
        await updateQuickAddTemplate(editingTemplate.id, user.id, {
          label: label.trim(),
          amountCents: cents,
          type,
          categoryId,
          icon,
        });
        toast.success("Template updated");
      } else {
        await createQuickAddTemplate(user.id, {
          label: label.trim(),
          amountCents: cents,
          type,
          categoryId,
          icon,
          currency,
          sortOrder: templates ? templates.length : 0,
        });
        toast.success("Template created");
      }
      closeForm();
    } catch {
      toast.error("Failed to save template");
    }
  }

  async function handleDelete(id: string) {
    if (!user?.id) return;
    const ok = await confirm({
      title: "Delete template?",
      message: "This quick-add shortcut will be removed from your dashboard.",
      confirmLabel: "Delete",
      dangerous: true,
    });
    if (!ok) return;

    try {
      await deleteQuickAddTemplate(id, user.id);
      toast.success("Template deleted");
      closeForm();
    } catch {
      toast.error("Failed to delete template");
    }
  }

  const isFormOpen = showAddForm || !!editingTemplate;
  const currency = useCurrency();

  return (
    <>
      <main className={`app-shell page-enter ${styles.page}`}>
        <header className={styles.header}>
          <Link href="/settings" className={styles.backBtn} aria-label="Back">
            <Icon name="chevron-left" size={20} />
          </Link>
          <h1 className={styles.title}>Templates</h1>
          {templates && templates.length > 1 && (
            <button
              className={`${styles.reorderToggle} ${isReordering ? styles.reorderToggleActive : ""}`}
              onClick={() => setIsReordering(!isReordering)}
            >
              {isReordering ? "Done" : "Reorder"}
            </button>
          )}
        </header>

        {/* List of templates */}
        <div className={styles.list}>
          {!templates || templates.length === 0 ? (
            <div className={styles.empty}>
              <Icon name="zap" size={40} color="var(--ink-faint)" />
              <p>No quick-add templates yet</p>
              <p className={styles.emptyHint}>Create one to speed up logging recurring items</p>
            </div>
          ) : (
            templates.map((tpl, idx) => {
              const cat = categoryMap.get(tpl.categoryId);
              const isIncome = tpl.type === "income";
              const catIconName = (tpl.icon || (isIncome ? "circle-dollar" : "tag")) as any;

              return (
                <div
                  key={tpl.id}
                  className={`${styles.row} ${isReordering ? styles.rowReordering : ""}`}
                  onClick={() => !isReordering && openEdit(tpl)}
                  role="button"
                  tabIndex={0}
                >
                  <span
                    className={styles.iconCircle}
                    style={{
                      background: isIncome
                        ? "rgba(87, 217, 163, 0.12)"
                        : "rgba(255, 107, 90, 0.10)",
                    }}
                  >
                    <Icon
                      name={catIconName}
                      size={18}
                      color={isIncome ? "var(--ok)" : "var(--over)"}
                    />
                  </span>
                  <div className={styles.rowMeta}>
                    <span className={styles.rowLabel}>{tpl.label}</span>
                    <span className={styles.rowSub}>
                      {cat?.name ?? "Uncategorized"}
                    </span>
                  </div>
                  <span
                    className={styles.amount}
                    style={{ color: isIncome ? "var(--ok)" : "var(--over)" }}
                  >
                    {isIncome ? "+" : "−"}
                    {formatCents(tpl.amountCents, currency, { symbol: true })}
                  </span>
                  {isReordering ? (
                    <div className={styles.reorderControls} onClick={(e) => e.stopPropagation()} style={{ marginLeft: "0.5rem" }}>
                      <button
                        className={styles.reorderBtn}
                        onClick={() => moveTemplate(idx, "up")}
                        disabled={idx === 0}
                        aria-label="Move up"
                      >
                        <Icon name="chevron-up" size={16} />
                      </button>
                      <button
                        className={styles.reorderBtn}
                        onClick={() => moveTemplate(idx, "down")}
                        disabled={idx === templates.length - 1}
                        aria-label="Move down"
                      >
                        <Icon name="chevron-down" size={16} />
                      </button>
                    </div>
                  ) : (
                    <Icon name="chevron-right" size={16} color="var(--ink-faint)" style={{ marginLeft: "0.5rem" }} />
                  )}
                </div>
              );
            })
          )}
        </div>

        <button className={styles.addBtn} onClick={openAdd}>
          <Icon name="plus" size={18} />
          New template
        </button>
      </main>

      {/* Slide up Template Form Sheet */}
      {isFormOpen && (
        <Sheet
          open={isFormOpen}
          onClose={closeForm}
          label={editingTemplate ? "Edit Template" : "New Template"}
        >
          <header className={styles.sheetHeader}>
            <h2 className={styles.sheetTitle}>
              {editingTemplate ? "Edit Template" : "New Template"}
            </h2>
            <button className={styles.closeBtn} onClick={closeForm} aria-label="Close">
              <Icon name="x" size={18} />
            </button>
          </header>

          <div className={styles.form}>
            {/* Type selector */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Type</label>
              <div className={styles.pillToggle}>
                <button
                  type="button"
                  className={`${styles.pill} ${type === "expense" ? styles.pillActive : ""}`}
                  onClick={() => setType("expense")}
                >
                  Expense
                </button>
                <button
                  type="button"
                  className={`${styles.pill} ${type === "income" ? styles.pillActive : ""}`}
                  onClick={() => setType("income")}
                >
                  Income
                </button>
              </div>
            </div>

            {/* Label Input */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Label</label>
              <input
                type="text"
                placeholder="e.g. Coffee"
                className={styles.input}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                autoFocus
              />
            </div>

            {/* Amount Input */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Amount</label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="0.00"
                className={styles.input}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            {/* Category selection */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Category</label>
              <select
                className={styles.select}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Select a category</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Icon selection */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Icon</label>
              <div className={styles.iconGrid}>
                {TEMPLATE_ICONS.map((i) => (
                  <button
                    key={i}
                    type="button"
                    className={`${styles.iconItem} ${icon === i ? styles.iconActive : ""}`}
                    onClick={() => setIcon(i)}
                    aria-label={`Select icon ${i}`}
                  >
                    <Icon name={i as any} size={18} />
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className={styles.formActions}>
              {editingTemplate && (
                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(editingTemplate.id)}
                >
                  Delete
                </button>
              )}
              <button type="button" className={styles.saveBtn} onClick={handleSave}>
                Save
              </button>
            </div>
          </div>
        </Sheet>
      )}
    </>
  );
}
