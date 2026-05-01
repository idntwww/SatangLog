import { describe, it, expect, vi, beforeEach } from "vitest";

// Declare mock functions using vi.hoisted
const mockTransactionFindMany = vi.hoisted(() => vi.fn());
const mockTransactionFindFirst = vi.hoisted(() => vi.fn());
const mockTransactionCount = vi.hoisted(() => vi.fn());
const mockTransactionCreate = vi.hoisted(() => vi.fn());
const mockTransactionUpdate = vi.hoisted(() => vi.fn());
const mockTransactionDelete = vi.hoisted(() => vi.fn());
const mockTransactionDeleteMany = vi.hoisted(() => vi.fn());
const mockCategoryFindFirst = vi.hoisted(() => vi.fn());
const mockCategoryCreate = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: {
    transaction: {
      findMany: mockTransactionFindMany,
      findFirst: mockTransactionFindFirst,
      count: mockTransactionCount,
      create: mockTransactionCreate,
      update: mockTransactionUpdate,
      delete: mockTransactionDelete,
      deleteMany: mockTransactionDeleteMany,
    },
    category: {
      findFirst: mockCategoryFindFirst,
      create: mockCategoryCreate,
    },
  },
}));

import {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  bulkDeleteTransactions,
  TransactionNotFoundError,
} from "@/lib/services/transaction.service";

// Use valid CUID format for test IDs (Zod validates cuid format)
const TEST_USER_ID = "clh1234567890abcdefghijkl";
const TEST_TX_ID = "clh2345678901abcdefghijkl";
const TEST_CAT_ID = "clh3456789012abcdefghijkl";
const TEST_UNCAT_ID = "clh4567890123abcdefghijkl";
const TEST_TX_ID_2 = "clh5678901234abcdefghijkl";
const TEST_TX_ID_3 = "clh6789012345abcdefghijkl";

const mockTransaction = {
  id: TEST_TX_ID,
  amount: 100.5,
  type: "EXPENSE",
  note: "ค่าอาหาร",
  date: new Date("2024-01-15"),
  currency: "THB",
  userId: TEST_USER_ID,
  categoryId: TEST_CAT_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
  category: { id: TEST_CAT_ID, name: "อาหาร", icon: "🍔", isDefault: false, userId: TEST_USER_ID },
};

describe("Transaction Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getTransactions", () => {
    it("should return paginated results with correct meta", async () => {
      const mockData = [mockTransaction];
      mockTransactionFindMany.mockResolvedValue(mockData);
      mockTransactionCount.mockResolvedValue(1);

      const result = await getTransactions(TEST_USER_ID, { page: 1, limit: 20 });

      expect(result.data).toEqual(mockData);
      expect(result.meta).toEqual({
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it("should calculate totalPages correctly", async () => {
      mockTransactionFindMany.mockResolvedValue([]);
      mockTransactionCount.mockResolvedValue(45);

      const result = await getTransactions(TEST_USER_ID, { page: 1, limit: 20 });

      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.total).toBe(45);
    });

    it("should use default params when none provided", async () => {
      mockTransactionFindMany.mockResolvedValue([]);
      mockTransactionCount.mockResolvedValue(0);

      await getTransactions(TEST_USER_ID);

      expect(mockTransactionFindMany).toHaveBeenCalledWith({
        where: { userId: TEST_USER_ID },
        include: { category: true },
        orderBy: { date: "desc" },
        skip: 0,
        take: 20,
      });
    });

    it("should apply type filter", async () => {
      mockTransactionFindMany.mockResolvedValue([]);
      mockTransactionCount.mockResolvedValue(0);

      await getTransactions(TEST_USER_ID, { type: "INCOME" });

      expect(mockTransactionFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: TEST_USER_ID, type: "INCOME" },
        })
      );
    });

    it("should apply categoryId filter", async () => {
      mockTransactionFindMany.mockResolvedValue([]);
      mockTransactionCount.mockResolvedValue(0);

      await getTransactions(TEST_USER_ID, { categoryId: TEST_CAT_ID });

      expect(mockTransactionFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: TEST_USER_ID, categoryId: TEST_CAT_ID },
        })
      );
    });

    it("should apply date range filter", async () => {
      mockTransactionFindMany.mockResolvedValue([]);
      mockTransactionCount.mockResolvedValue(0);

      await getTransactions(TEST_USER_ID, {
        from: "2024-01-01",
        to: "2024-01-31",
      });

      expect(mockTransactionFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: TEST_USER_ID,
            date: {
              gte: new Date("2024-01-01"),
              lte: new Date("2024-01-31"),
            },
          },
        })
      );
    });

    it("should apply search filter on note field", async () => {
      mockTransactionFindMany.mockResolvedValue([]);
      mockTransactionCount.mockResolvedValue(0);

      await getTransactions(TEST_USER_ID, { search: "อาหาร" });

      expect(mockTransactionFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: TEST_USER_ID,
            note: { contains: "อาหาร", mode: "insensitive" },
          },
        })
      );
    });
  });

  describe("getTransactionById", () => {
    it("should return transaction when found", async () => {
      mockTransactionFindFirst.mockResolvedValue(mockTransaction);

      const result = await getTransactionById(TEST_USER_ID, TEST_TX_ID);

      expect(result).toEqual(mockTransaction);
      expect(mockTransactionFindFirst).toHaveBeenCalledWith({
        where: { id: TEST_TX_ID, userId: TEST_USER_ID },
        include: { category: true },
      });
    });

    it("should throw TransactionNotFoundError if not found", async () => {
      mockTransactionFindFirst.mockResolvedValue(null);

      await expect(
        getTransactionById(TEST_USER_ID, "clhnonexistent0abcdefghijk")
      ).rejects.toThrow(TransactionNotFoundError);
    });

    it("should throw TransactionNotFoundError if owned by different user", async () => {
      mockTransactionFindFirst.mockResolvedValue(null);

      await expect(
        getTransactionById("clhotheruser000abcdefghijk", TEST_TX_ID)
      ).rejects.toThrow(TransactionNotFoundError);
    });
  });

  describe("createTransaction", () => {
    it("should create transaction successfully with categoryId", async () => {
      const createdTx = { ...mockTransaction };
      mockTransactionCreate.mockResolvedValue(createdTx);

      const result = await createTransaction(TEST_USER_ID, {
        amount: 100.5,
        type: "EXPENSE",
        date: "2024-01-15T00:00:00.000Z",
        note: "ค่าอาหาร",
        currency: "THB",
        categoryId: TEST_CAT_ID,
      });

      expect(result).toEqual(createdTx);
      expect(mockTransactionCreate).toHaveBeenCalledWith({
        data: {
          amount: 100.5,
          type: "EXPENSE",
          date: new Date("2024-01-15T00:00:00.000Z"),
          note: "ค่าอาหาร",
          currency: "THB",
          userId: TEST_USER_ID,
          categoryId: TEST_CAT_ID,
        },
        include: { category: true },
      });
    });

    it("should assign 'ไม่ระบุ' category when no categoryId provided (existing)", async () => {
      const uncategorized = {
        id: TEST_UNCAT_ID,
        name: "ไม่ระบุ",
        icon: "📁",
        isDefault: true,
        userId: TEST_USER_ID,
      };
      mockCategoryFindFirst.mockResolvedValue(uncategorized);
      mockTransactionCreate.mockResolvedValue({
        ...mockTransaction,
        categoryId: TEST_UNCAT_ID,
      });

      await createTransaction(TEST_USER_ID, {
        amount: 50,
        type: "EXPENSE",
        date: "2024-01-15T00:00:00.000Z",
        currency: "THB",
      });

      expect(mockCategoryFindFirst).toHaveBeenCalledWith({
        where: { userId: TEST_USER_ID, name: "ไม่ระบุ" },
      });
      expect(mockTransactionCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            categoryId: TEST_UNCAT_ID,
          }),
        })
      );
    });

    it("should create 'ไม่ระบุ' category if it doesn't exist", async () => {
      const newUncatId = "clh7890123456abcdefghijkl";
      mockCategoryFindFirst.mockResolvedValue(null);
      const newUncategorized = {
        id: newUncatId,
        name: "ไม่ระบุ",
        icon: "📁",
        isDefault: true,
        userId: TEST_USER_ID,
      };
      mockCategoryCreate.mockResolvedValue(newUncategorized);
      mockTransactionCreate.mockResolvedValue({
        ...mockTransaction,
        categoryId: newUncatId,
      });

      await createTransaction(TEST_USER_ID, {
        amount: 50,
        type: "INCOME",
        date: "2024-01-15T00:00:00.000Z",
        currency: "THB",
      });

      expect(mockCategoryCreate).toHaveBeenCalledWith({
        data: {
          name: "ไม่ระบุ",
          icon: "📁",
          isDefault: true,
          userId: TEST_USER_ID,
        },
      });
      expect(mockTransactionCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            categoryId: newUncatId,
          }),
        })
      );
    });

    it("should reject amount <= 0 via Zod validation", async () => {
      await expect(
        createTransaction(TEST_USER_ID, {
          amount: 0,
          type: "EXPENSE",
          date: "2024-01-15T00:00:00.000Z",
          currency: "THB",
        })
      ).rejects.toThrow();

      await expect(
        createTransaction(TEST_USER_ID, {
          amount: -100,
          type: "EXPENSE",
          date: "2024-01-15T00:00:00.000Z",
          currency: "THB",
        })
      ).rejects.toThrow();
    });

    it("should reject missing date via Zod validation", async () => {
      await expect(
        createTransaction(TEST_USER_ID, {
          amount: 100,
          type: "EXPENSE",
          date: "",
          currency: "THB",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
      ).rejects.toThrow();
    });
  });

  describe("updateTransaction", () => {
    it("should update transaction successfully", async () => {
      mockTransactionFindFirst.mockResolvedValue(mockTransaction);
      const updatedTx = { ...mockTransaction, amount: 200 };
      mockTransactionUpdate.mockResolvedValue(updatedTx);

      const result = await updateTransaction(TEST_USER_ID, TEST_TX_ID, {
        amount: 200,
      });

      expect(result).toEqual(updatedTx);
      expect(mockTransactionUpdate).toHaveBeenCalledWith({
        where: { id: TEST_TX_ID },
        data: { amount: 200 },
        include: { category: true },
      });
    });

    it("should throw TransactionNotFoundError if not found", async () => {
      mockTransactionFindFirst.mockResolvedValue(null);

      await expect(
        updateTransaction(TEST_USER_ID, "clhnonexistent0abcdefghijk", { amount: 200 })
      ).rejects.toThrow(TransactionNotFoundError);
    });

    it("should throw TransactionNotFoundError if not owned by user", async () => {
      mockTransactionFindFirst.mockResolvedValue(null);

      await expect(
        updateTransaction("clhotheruser000abcdefghijk", TEST_TX_ID, { amount: 200 })
      ).rejects.toThrow(TransactionNotFoundError);
    });

    it("should only update provided fields", async () => {
      mockTransactionFindFirst.mockResolvedValue(mockTransaction);
      mockTransactionUpdate.mockResolvedValue(mockTransaction);

      await updateTransaction(TEST_USER_ID, TEST_TX_ID, {
        note: "updated note",
        type: "INCOME",
      });

      expect(mockTransactionUpdate).toHaveBeenCalledWith({
        where: { id: TEST_TX_ID },
        data: { note: "updated note", type: "INCOME" },
        include: { category: true },
      });
    });
  });

  describe("deleteTransaction", () => {
    it("should delete transaction successfully", async () => {
      mockTransactionFindFirst.mockResolvedValue(mockTransaction);
      mockTransactionDelete.mockResolvedValue(mockTransaction);

      const result = await deleteTransaction(TEST_USER_ID, TEST_TX_ID);

      expect(result).toEqual(mockTransaction);
      expect(mockTransactionDelete).toHaveBeenCalledWith({
        where: { id: TEST_TX_ID },
      });
    });

    it("should throw TransactionNotFoundError if not found", async () => {
      mockTransactionFindFirst.mockResolvedValue(null);

      await expect(
        deleteTransaction(TEST_USER_ID, "clhnonexistent0abcdefghijk")
      ).rejects.toThrow(TransactionNotFoundError);
    });

    it("should throw TransactionNotFoundError if not owned by user", async () => {
      mockTransactionFindFirst.mockResolvedValue(null);

      await expect(
        deleteTransaction("clhotheruser000abcdefghijk", TEST_TX_ID)
      ).rejects.toThrow(TransactionNotFoundError);
    });
  });

  describe("bulkDeleteTransactions", () => {
    it("should delete only owned transactions", async () => {
      mockTransactionDeleteMany.mockResolvedValue({ count: 2 });

      const result = await bulkDeleteTransactions(TEST_USER_ID, {
        ids: [TEST_TX_ID, TEST_TX_ID_2, TEST_TX_ID_3],
      });

      expect(result).toEqual({ deletedCount: 2 });
      expect(mockTransactionDeleteMany).toHaveBeenCalledWith({
        where: {
          id: { in: [TEST_TX_ID, TEST_TX_ID_2, TEST_TX_ID_3] },
          userId: TEST_USER_ID,
        },
      });
    });

    it("should return deletedCount 0 when no transactions match", async () => {
      mockTransactionDeleteMany.mockResolvedValue({ count: 0 });

      const result = await bulkDeleteTransactions(TEST_USER_ID, {
        ids: [TEST_TX_ID],
      });

      expect(result).toEqual({ deletedCount: 0 });
    });
  });
});
