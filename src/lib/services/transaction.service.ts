import { prisma } from "@/lib/prisma";
import {
  transactionCreateSchema,
  transactionUpdateSchema,
  transactionBulkDeleteSchema,
  type TransactionCreateSchema,
  type TransactionUpdateSchema,
  type TransactionBulkDeleteSchema,
} from "@/lib/validators/transaction";
import type { PaginationMeta } from "@/types";

const UNCATEGORIZED_NAME = "ไม่ระบุ";
const UNCATEGORIZED_ICON = "📁";

// ===== Custom Error Classes =====

export class TransactionNotFoundError extends Error {
  constructor(message: string = "ไม่พบรายการ") {
    super(message);
    this.name = "TransactionNotFoundError";
  }
}

// ===== Query Parameters =====

export interface GetTransactionsParams {
  page?: number;
  limit?: number;
  type?: "INCOME" | "EXPENSE";
  categoryId?: string;
  from?: string;
  to?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface GetTransactionsResult {
  data: Awaited<ReturnType<typeof prisma.transaction.findMany>>;
  meta: PaginationMeta;
}

// ===== Service Functions =====

export async function getTransactions(
  userId: string,
  params: GetTransactionsParams = {}
): Promise<GetTransactionsResult> {
  const {
    page = 1,
    limit = 20,
    type,
    categoryId,
    from,
    to,
    search,
    sortBy = "date",
    sortOrder = "desc",
  } = params;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: Record<string, unknown> = { userId };

  if (type) {
    where.type = type;
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (from || to) {
    where.date = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    };
  }

  if (search) {
    where.note = {
      contains: search,
      mode: "insensitive",
    };
  }

  // Build orderBy
  const allowedSortFields = ["date", "amount", "createdAt", "type"];
  const actualSortBy = allowedSortFields.includes(sortBy) ? sortBy : "date";
  const orderBy = { [actualSortBy]: sortOrder };

  // Execute queries in parallel
  const [data, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: {
      page,
      pageSize: limit,
      total,
      totalPages,
    },
  };
}

export async function getTransactionById(userId: string, id: string) {
  const transaction = await prisma.transaction.findFirst({
    where: { id, userId },
    include: { category: true },
  });

  if (!transaction) {
    throw new TransactionNotFoundError();
  }

  return transaction;
}

export async function createTransaction(
  userId: string,
  data: TransactionCreateSchema
) {
  const parsed = transactionCreateSchema.parse(data);

  let categoryId = parsed.categoryId ?? null;

  // If no categoryId, find or create "ไม่ระบุ" category
  if (!categoryId) {
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

    categoryId = uncategorized.id;
  }

  return prisma.transaction.create({
    data: {
      amount: parsed.amount,
      type: parsed.type,
      date: new Date(parsed.date),
      note: parsed.note ?? null,
      currency: parsed.currency,
      userId,
      categoryId,
    },
    include: { category: true },
  });
}

export async function updateTransaction(
  userId: string,
  id: string,
  data: TransactionUpdateSchema
) {
  const parsed = transactionUpdateSchema.parse(data);

  // Check ownership
  const existing = await prisma.transaction.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new TransactionNotFoundError();
  }

  // Build update data
  const updateData: Record<string, unknown> = {};

  if (parsed.amount !== undefined) {
    updateData.amount = parsed.amount;
  }
  if (parsed.type !== undefined) {
    updateData.type = parsed.type;
  }
  if (parsed.date !== undefined) {
    updateData.date = new Date(parsed.date);
  }
  if (parsed.note !== undefined) {
    updateData.note = parsed.note;
  }
  if (parsed.currency !== undefined) {
    updateData.currency = parsed.currency;
  }
  if (parsed.categoryId !== undefined) {
    updateData.categoryId = parsed.categoryId;
  }

  return prisma.transaction.update({
    where: { id },
    data: updateData,
    include: { category: true },
  });
}

export async function deleteTransaction(userId: string, id: string) {
  // Check ownership
  const existing = await prisma.transaction.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new TransactionNotFoundError();
  }

  return prisma.transaction.delete({
    where: { id },
  });
}

export async function bulkDeleteTransactions(
  userId: string,
  data: TransactionBulkDeleteSchema
) {
  const parsed = transactionBulkDeleteSchema.parse(data);

  // Delete only transactions owned by user
  const result = await prisma.transaction.deleteMany({
    where: {
      id: { in: parsed.ids },
      userId,
    },
  });

  return { deletedCount: result.count };
}
