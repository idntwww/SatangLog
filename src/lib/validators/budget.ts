import { z } from "zod";

export const budgetCreateSchema = z.object({
  categoryId: z.string().cuid(),
  amount: z.number().positive("จำนวนเงินงบประมาณต้องมากกว่าศูนย์"),
  month: z.string().regex(/^\d{4}-\d{2}$/, "รูปแบบเดือนต้องเป็น YYYY-MM"),
});

export const budgetUpdateSchema = z.object({
  categoryId: z.string().cuid().optional(),
  amount: z.number().positive("จำนวนเงินงบประมาณต้องมากกว่าศูนย์").optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/, "รูปแบบเดือนต้องเป็น YYYY-MM").optional(),
});

export const budgetCopySchema = z.object({
  sourceMonth: z.string().regex(/^\d{4}-\d{2}$/, "รูปแบบเดือนต้องเป็น YYYY-MM"),
  targetMonth: z.string().regex(/^\d{4}-\d{2}$/, "รูปแบบเดือนต้องเป็น YYYY-MM"),
});

export type BudgetCreateSchema = z.infer<typeof budgetCreateSchema>;
export type BudgetUpdateSchema = z.infer<typeof budgetUpdateSchema>;
export type BudgetCopySchema = z.infer<typeof budgetCopySchema>;
