import { z } from "zod";

export const categoryCreateSchema = z.object({
  name: z.string().min(1, "ชื่อหมวดหมู่ต้องไม่ว่าง"),
  icon: z.string().optional(),
});

export const categoryUpdateSchema = z.object({
  name: z.string().min(1, "ชื่อหมวดหมู่ต้องไม่ว่าง").optional(),
  icon: z.string().optional(),
});

export type CategoryCreateSchema = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateSchema = z.infer<typeof categoryUpdateSchema>;
