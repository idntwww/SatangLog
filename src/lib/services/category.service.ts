import { prisma } from "@/lib/prisma";
import {
  categoryCreateSchema,
  categoryUpdateSchema,
  type CategoryCreateSchema,
  type CategoryUpdateSchema,
} from "@/lib/validators/category";

const UNCATEGORIZED_NAME = "ไม่ระบุ";
const UNCATEGORIZED_ICON = "📁";

export async function getCategories(userId: string) {
  return prisma.category.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
}

export async function createCategory(userId: string, data: CategoryCreateSchema) {
  const parsed = categoryCreateSchema.parse(data);

  // Check unique name per user
  const existing = await prisma.category.findUnique({
    where: { userId_name: { userId, name: parsed.name } },
  });

  if (existing) {
    throw new CategoryConflictError(
      `หมวดหมู่ "${parsed.name}" มีอยู่แล้ว`
    );
  }

  return prisma.category.create({
    data: {
      name: parsed.name,
      icon: parsed.icon ?? "📁",
      userId,
    },
  });
}

export async function updateCategory(
  userId: string,
  categoryId: string,
  data: CategoryUpdateSchema
) {
  const parsed = categoryUpdateSchema.parse(data);

  // Check category exists and belongs to user
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId },
  });

  if (!category) {
    throw new CategoryNotFoundError("ไม่พบหมวดหมู่");
  }

  // Check unique name per user (excluding current category)
  if (parsed.name) {
    const existing = await prisma.category.findFirst({
      where: {
        userId,
        name: parsed.name,
        id: { not: categoryId },
      },
    });

    if (existing) {
      throw new CategoryConflictError(
        `หมวดหมู่ "${parsed.name}" มีอยู่แล้ว`
      );
    }
  }

  return prisma.category.update({
    where: { id: categoryId },
    data: {
      ...(parsed.name !== undefined && { name: parsed.name }),
      ...(parsed.icon !== undefined && { icon: parsed.icon }),
    },
  });
}

export async function deleteCategory(userId: string, categoryId: string) {
  // Check category exists and belongs to user
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId },
  });

  if (!category) {
    throw new CategoryNotFoundError("ไม่พบหมวดหมู่");
  }

  // Check if any transactions reference this category
  const transactionCount = await prisma.transaction.count({
    where: { categoryId, userId },
  });

  if (transactionCount > 0) {
    // Find or create "ไม่ระบุ" category
    let uncategorized = await prisma.category.findFirst({
      where: { userId, name: UNCATEGORIZED_NAME },
    });

    if (!uncategorized) {
      uncategorized = await prisma.category.create({
        data: {
          name: UNCATEGORIZED_NAME,
          icon: UNCATEGORIZED_ICON,
          isDefault: true,
          userId,
        },
      });
    }

    // Move transactions to "ไม่ระบุ"
    await prisma.transaction.updateMany({
      where: { categoryId, userId },
      data: { categoryId: uncategorized.id },
    });
  }

  // Delete the category
  return prisma.category.delete({
    where: { id: categoryId },
  });
}

// Custom error classes
export class CategoryNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CategoryNotFoundError";
  }
}

export class CategoryConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CategoryConflictError";
  }
}
