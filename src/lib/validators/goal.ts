import { z } from "zod";

export const goalCreateSchema = z.object({
  name: z.string().min(1, "ชื่อเป้าหมายต้องไม่ว่าง").max(100, "ชื่อเป้าหมายต้องไม่เกิน 100 ตัวอักษร"),
  targetAmount: z.number().positive("จำนวนเงินเป้าหมายต้องมากกว่าศูนย์"),
  deadline: z.string().datetime().optional(),
});

export const goalUpdateSchema = z.object({
  name: z.string().min(1, "ชื่อเป้าหมายต้องไม่ว่าง").max(100, "ชื่อเป้าหมายต้องไม่เกิน 100 ตัวอักษร").optional(),
  targetAmount: z.number().positive("จำนวนเงินเป้าหมายต้องมากกว่าศูนย์").optional(),
  deadline: z.string().datetime().nullable().optional(),
});

export const goalContributeSchema = z.object({
  amount: z.number().positive("จำนวนเงินต้องมากกว่าศูนย์"),
});

export type GoalCreateSchema = z.infer<typeof goalCreateSchema>;
export type GoalUpdateSchema = z.infer<typeof goalUpdateSchema>;
export type GoalContributeSchema = z.infer<typeof goalContributeSchema>;
