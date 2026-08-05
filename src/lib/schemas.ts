import { z } from "zod";

/**
 * Shared Zod schemas for forms and API validation.
 */

export const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amountCents: z.number().int().positive("Amount must be greater than zero"),
  currency: z.string(),
  categoryId: z.string().min(1, "Category is required"),
  note: z.string().optional(),
  date: z.date(),
  accountId: z.string().optional(),
});

export type TransactionFormData = z.infer<typeof transactionSchema>;

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
  kind: z.enum(["income", "expense"]),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
  icon: z.string().min(1, "Icon is required"),
  monthlyBudgetCents: z.number().int().positive().optional(),
  sortOrder: z.number().int().default(0),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

export const quickAddTemplateSchema = z.object({
  label: z.string().min(1, "Label is required").max(30, "Label too long"),
  amountCents: z.number().int().positive("Amount must be greater than zero"),
  currency: z.string().default("QAR"),
  type: z.enum(["income", "expense"]),
  categoryId: z.string().min(1, "Category is required"),
  icon: z.string().min(1, "Icon is required"),
  sortOrder: z.number().int().default(0),
  recurringRuleId: z.string().optional(),
});

export type QuickAddTemplateFormData = z.infer<typeof quickAddTemplateSchema>;

export const recurringRuleSchema = z.object({
  label: z.string().min(1, "Label is required").max(50, "Label too long"),
  amountCents: z.number().int().positive("Amount must be greater than zero"),
  currency: z.string(),
  type: z.enum(["income", "expense"]),
  categoryId: z.string().min(1, "Category is required"),
  cadence: z.enum(["daily", "weekly", "biweekly", "monthly", "yearly"]),
  nextDueDate: z.date(),
  autoPost: z.boolean(),
  note: z.string().optional(),
});

export type RecurringRuleFormData = z.infer<typeof recurringRuleSchema>;

export const goalSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
  targetCents: z.number().int().positive("Target must be greater than zero"),
  savedCents: z.number().int().nonnegative(),
  targetDate: z.date().optional(),
  currency: z.string(),
  priority: z.number().int(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export type GoalFormData = z.infer<typeof goalSchema>;
