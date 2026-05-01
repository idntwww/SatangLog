import { z } from "zod";

export const transactionCreateSchema = z.object({
  amount: z.number().positive("จำนวนเงินต้องมากกว่าศูนย์"),
  type: z.enum(["INCOME", "EXPENSE"]),
  categoryId: z.string().cuid().optional(),
  date: z.string().datetime(),
  note: z.string().max(500).optional(),
  currency: z.string().length(3).default("THB"),
});

export const transactionUpdateSchema = z.object({
  amount: z.number().positive("จำนวนเงินต้องมากกว่าศูนย์").optional(),
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  categoryId: z.string().cuid().nullable().optional(),
  date: z.string().datetime().optional(),
  note: z.string().max(500).nullable().optional(),
  currency: z.string().length(3).optional(),
});

export const transactionBulkDeleteSchema = z.object({
  ids: z.array(z.string().cuid()).min(1, "ต้องระบุอย่างน้อย 1 รายการ"),
});

export type TransactionCreateSchema = z.infer<typeof transactionCreateSchema>;
export type TransactionUpdateSchema = z.infer<typeof transactionUpdateSchema>;
export type TransactionBulkDeleteSchema = z.infer<typeof transactionBulkDeleteSchema>;
