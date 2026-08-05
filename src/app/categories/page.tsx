"use client";

import { useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useCategories } from "@/lib/db/hooks";
import { createCategory, updateCategory, deleteCategory } from "@/lib/db/repository";
import { db, type Category } from "@/lib/db/dexie";
import { Icon } from "@/components/Icon/Icon";
import { Sheet } from "@/components/Sheet/Sheet";
import { useToast } from "@/components/Toast/Toast";
import { useConfirm } from "@/components/ConfirmDialog/ConfirmDialog";
import Link from "next/link";
import styles from "./page.module.css";

const CATEGORY_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e",
  "#10b981", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7",
  "#d946ef", "#ec4899", "#f43f5e", "#64748b",
];

const CATEGORY_ICONS = [
  "briefcase", "monitor", "trending-up", "trending-down", "circle-dollar",
  "utensils", "car", "shopping-cart", "zap", "heart-pulse", "clapperboard",
  "shopping-bag", "book-open", "smartphone", "bus", "coffee", "target",
  "calendar", "clock", "tag", "wallet", "home", "star", "gift",
];

export default function CategoriesPage() {
  const { user } = useUser();
  const categories = useCategories();
  const toast = useToast();
  const { confirm } = useConfirm();

  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [icon, setIcon] = useState(CATEGORY_ICONS[0]);
  const [monthlyBudget, setMonthlyBudget] = useState("");

  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    return categories.filter((c) => c.kind === activeTab);
  }, [categories, activeTab]);

  async function moveCategory(index: number, direction: "up" | "down") {
    if (!categories || !user?.id) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredCategories.length) return;

    const currentCat = filteredCategories[index];
    const targetCat = filteredCategories[targetIndex];

    const currentOrder = currentCat.sortOrder;
    const targetOrder = targetCat.sortOrder;

    try {
      const now = new Date();
      await db.categories.update(currentCat.id, { sortOrder: targetOrder, updatedAt: now, dirty: true });
      await db.categories.update(targetCat.id, { sortOrder: currentOrder, updatedAt: now, dirty: true });
    } catch {
      toast.error("Failed to reorder categories");
    }
  }

  function openEdit(cat: Category) {
    setEditingCategory(cat);
    setName(cat.name);
    setKind(cat.kind);
    setColor(cat.color || CATEGORY_COLORS[0]);
    setIcon(cat.icon || CATEGORY_ICONS[0]);
    setMonthlyBudget(
      cat.monthlyBudgetCents ? (cat.monthlyBudgetCents / 100).toString() : ""
    );
  }

  function openAdd() {
    setName("");
    setKind(activeTab);
    setColor(CATEGORY_COLORS[0]);
    setIcon(CATEGORY_ICONS[0]);
    setMonthlyBudget("");
    setShowAddForm(true);
  }

  function closeForm() {
    setEditingCategory(null);
    setShowAddForm(false);
  }

  async function handleSave() {
    if (!user?.id) return;
    if (!name.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    const budgetCents = monthlyBudget ? Math.round(parseFloat(monthlyBudget) * 100) : undefined;

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, user.id, {
          name: name.trim(),
          kind,
          color,
          icon,
          monthlyBudgetCents: budgetCents,
        });
        toast.success("Category updated");
      } else {
        await createCategory(user.id, {
          name: name.trim(),
          kind,
          color,
          icon,
          monthlyBudgetCents: budgetCents,
          sortOrder: categories ? categories.length : 0,
        });
        toast.success("Category created");
      }
      closeForm();
    } catch {
      toast.error("Failed to save category");
    }
  }

  async function handleDelete(id: string) {
    if (!user?.id) return;
    const ok = await confirm({
      title: "Delete category?",
      message: "Transactions in this category will display as uncategorized.",
      confirmLabel: "Delete",
      dangerous: true,
    });
    if (!ok) return;

    try {
      await deleteCategory(id, user.id);
      toast.success("Category deleted");
      closeForm();
    } catch {
      toast.error("Failed to delete category");
    }
  }

  const isFormOpen = showAddForm || !!editingCategory;

  return (
    <>
      <main className={`app-shell page-enter ${styles.page}`}>
        <header className={styles.header}>
          <Link href="/settings" className={styles.backBtn} aria-label="Back">
            <Icon name="chevron-left" size={20} />
          </Link>
          <h1 className={styles.title}>Categories</h1>
          {filteredCategories.length > 1 && (
            <button
              className={`${styles.reorderToggle} ${isReordering ? styles.reorderToggleActive : ""}`}
              onClick={() => setIsReordering(!isReordering)}
            >
              {isReordering ? "Done" : "Reorder"}
            </button>
          )}
        </header>

        {/* Tab switcher */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tabBtn} ${activeTab === "expense" ? styles.tabActive : ""}`}
            onClick={() => { setActiveTab("expense"); setIsReordering(false); }}
          >
            Expenses
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "income" ? styles.tabActive : ""}`}
            onClick={() => { setActiveTab("income"); setIsReordering(false); }}
          >
            Income
          </button>
        </div>

        {/* Category list */}
        <div className={styles.list}>
          {filteredCategories.length === 0 ? (
            <div className={styles.empty}>
              <Icon name="tag" size={40} color="var(--ink-faint)" />
              <p>No categories in this group</p>
            </div>
          ) : (
            filteredCategories.map((cat, idx) => (
              <div
                key={cat.id}
                className={`${styles.row} ${isReordering ? styles.rowReordering : ""}`}
                onClick={() => !isReordering && openEdit(cat)}
                role="button"
                tabIndex={0}
              >
                <span
                  className={styles.iconCircle}
                  style={{ background: `${cat.color}15` }}
                >
                  <Icon name={cat.icon as any} size={18} color={cat.color} />
                </span>
                <span className={styles.name}>{cat.name}</span>
                {cat.monthlyBudgetCents && (
                  <span className={styles.budgetBadge}>
                    Budget: ${(cat.monthlyBudgetCents / 100).toFixed(0)}
                  </span>
                )}
                {isReordering ? (
                  <div className={styles.reorderControls} onClick={(e) => e.stopPropagation()}>
                    <button
                      className={styles.reorderBtn}
                      onClick={() => moveCategory(idx, "up")}
                      disabled={idx === 0}
                      aria-label="Move up"
                    >
                      <Icon name="chevron-up" size={16} />
                    </button>
                    <button
                      className={styles.reorderBtn}
                      onClick={() => moveCategory(idx, "down")}
                      disabled={idx === filteredCategories.length - 1}
                      aria-label="Move down"
                    >
                      <Icon name="chevron-down" size={16} />
                    </button>
                  </div>
                ) : (
                  <Icon name="chevron-right" size={16} color="var(--ink-faint)" />
                )}
              </div>
            ))
          )}
        </div>

        <button className={styles.addBtn} onClick={openAdd}>
          <Icon name="plus" size={18} />
          New category
        </button>
      </main>

      {/* Slide up Category Sheet */}
      {isFormOpen && (
        <Sheet
          open={isFormOpen}
          onClose={closeForm}
          label={editingCategory ? "Edit Category" : "New Category"}
        >
          <header className={styles.sheetHeader}>
            <h2 className={styles.sheetTitle}>
              {editingCategory ? "Edit Category" : "New Category"}
            </h2>
            <button className={styles.closeBtn} onClick={closeForm} aria-label="Close">
              <Icon name="x" size={18} />
            </button>
          </header>

          <div className={styles.form}>
            {/* Kind Selector */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Type</label>
              <div className={styles.pillToggle}>
                <button
                  type="button"
                  className={`${styles.pill} ${kind === "expense" ? styles.pillActive : ""}`}
                  onClick={() => setKind("expense")}
                >
                  Expense
                </button>
                <button
                  type="button"
                  className={`${styles.pill} ${kind === "income" ? styles.pillActive : ""}`}
                  onClick={() => setKind("income")}
                >
                  Income
                </button>
              </div>
            </div>

            {/* Name Input */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Name</label>
              <input
                type="text"
                placeholder="e.g. Shopping"
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            {/* Monthly Budget (Only for expense category) */}
            {kind === "expense" && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Monthly Budget <span className={styles.optional}>(optional)</span>
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  className={styles.input}
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                />
              </div>
            )}

            {/* Color Swatches */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Color</label>
              <div className={styles.colorGrid}>
                {CATEGORY_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`${styles.colorSwatch} ${color === c ? styles.colorActive : ""}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                    aria-label={`Select color ${c}`}
                  />
                ))}
              </div>
            </div>

            {/* Icon Selection */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Icon</label>
              <div className={styles.iconGrid}>
                {CATEGORY_ICONS.map((i) => (
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
              {editingCategory && (
                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(editingCategory.id)}
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
