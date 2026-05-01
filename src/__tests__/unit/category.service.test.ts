import { describe, it, expect, vi, beforeEach } from "vitest";

// Declare mock functions using vi.hoisted
const mockFindMany = vi.hoisted(() => vi.fn());
const mockFindUnique = vi.hoisted(() => vi.fn());
const mockFindFirst = vi.hoisted(() => vi.fn());
const mockCreate = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockDelete = vi.hoisted(() => vi.fn());
const mockTransactionCount = vi.hoisted(() => vi.fn());
const mockTransactionUpdateMany = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: {
    category: {
      findMany: mockFindMany,
      findUnique: mockFindUnique,
      findFirst: mockFindFirst,
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
    },
    transaction: {
      count: mockTransactionCount,
      updateMany: mockTransactionUpdateMany,
    },
  },
}));

import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  CategoryNotFoundError,
  CategoryConflictError,
} from "@/lib/services/category.service";

const TEST_USER_ID = "user-123";

describe("Category Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCategories", () => {
    it("should return categories ordered by name for a user", async () => {
      const mockCategories = [
        { id: "cat-1", name: "ค่าเดินทาง", icon: "🚗", userId: TEST_USER_ID },
        { id: "cat-2", name: "อาหาร", icon: "🍔", userId: TEST_USER_ID },
      ];
      mockFindMany.mockResolvedValue(mockCategories);

      const result = await getCategories(TEST_USER_ID);

      expect(result).toEqual(mockCategories);
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { userId: TEST_USER_ID },
        orderBy: { name: "asc" },
      });
    });
  });

  describe("createCategory", () => {
    it("should create a category successfully", async () => {
      mockFindUnique.mockResolvedValue(null);
      const createdCategory = {
        id: "cat-new",
        name: "ช้อปปิ้ง",
        icon: "🛍️",
        userId: TEST_USER_ID,
      };
      mockCreate.mockResolvedValue(createdCategory);

      const result = await createCategory(TEST_USER_ID, {
        name: "ช้อปปิ้ง",
        icon: "🛍️",
      });

      expect(result).toEqual(createdCategory);
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          name: "ช้อปปิ้ง",
          icon: "🛍️",
          userId: TEST_USER_ID,
        },
      });
    });

    it("should use default icon when icon is not provided", async () => {
      mockFindUnique.mockResolvedValue(null);
      const createdCategory = {
        id: "cat-new",
        name: "สุขภาพ",
        icon: "📁",
        userId: TEST_USER_ID,
      };
      mockCreate.mockResolvedValue(createdCategory);

      await createCategory(TEST_USER_ID, { name: "สุขภาพ" });

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          name: "สุขภาพ",
          icon: "📁",
          userId: TEST_USER_ID,
        },
      });
    });

    it("should throw CategoryConflictError for duplicate name", async () => {
      mockFindUnique.mockResolvedValue({
        id: "cat-existing",
        name: "อาหาร",
        userId: TEST_USER_ID,
      });

      await expect(
        createCategory(TEST_USER_ID, { name: "อาหาร", icon: "🍔" })
      ).rejects.toThrow(CategoryConflictError);

      await expect(
        createCategory(TEST_USER_ID, { name: "อาหาร", icon: "🍔" })
      ).rejects.toThrow('หมวดหมู่ "อาหาร" มีอยู่แล้ว');
    });
  });

  describe("updateCategory", () => {
    it("should update a category successfully", async () => {
      mockFindFirst.mockResolvedValueOnce({
        id: "cat-1",
        name: "อาหาร",
        icon: "🍔",
        userId: TEST_USER_ID,
      });
      // No duplicate found
      mockFindFirst.mockResolvedValueOnce(null);

      const updatedCategory = {
        id: "cat-1",
        name: "อาหารและเครื่องดื่ม",
        icon: "🍕",
        userId: TEST_USER_ID,
      };
      mockUpdate.mockResolvedValue(updatedCategory);

      const result = await updateCategory(TEST_USER_ID, "cat-1", {
        name: "อาหารและเครื่องดื่ม",
        icon: "🍕",
      });

      expect(result).toEqual(updatedCategory);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "cat-1" },
        data: {
          name: "อาหารและเครื่องดื่ม",
          icon: "🍕",
        },
      });
    });

    it("should throw CategoryNotFoundError if category not found", async () => {
      mockFindFirst.mockResolvedValue(null);

      await expect(
        updateCategory(TEST_USER_ID, "non-existent", { name: "ใหม่" })
      ).rejects.toThrow(CategoryNotFoundError);

      await expect(
        updateCategory(TEST_USER_ID, "non-existent", { name: "ใหม่" })
      ).rejects.toThrow("ไม่พบหมวดหมู่");
    });

    it("should throw CategoryConflictError for duplicate name (excluding self)", async () => {
      // Category exists
      mockFindFirst.mockResolvedValueOnce({
        id: "cat-1",
        name: "อาหาร",
        icon: "🍔",
        userId: TEST_USER_ID,
      });
      // Duplicate found (different category with same name)
      mockFindFirst.mockResolvedValueOnce({
        id: "cat-2",
        name: "ค่าเดินทาง",
        icon: "🚗",
        userId: TEST_USER_ID,
      });

      const error = await updateCategory(TEST_USER_ID, "cat-1", {
        name: "ค่าเดินทาง",
      }).catch((e) => e);

      expect(error).toBeInstanceOf(CategoryConflictError);
      expect(error.message).toBe('หมวดหมู่ "ค่าเดินทาง" มีอยู่แล้ว');
    });
  });

  describe("deleteCategory", () => {
    it("should delete a category with no transactions", async () => {
      mockFindFirst.mockResolvedValue({
        id: "cat-1",
        name: "อาหาร",
        icon: "🍔",
        userId: TEST_USER_ID,
      });
      mockTransactionCount.mockResolvedValue(0);
      mockDelete.mockResolvedValue({
        id: "cat-1",
        name: "อาหาร",
        icon: "🍔",
        userId: TEST_USER_ID,
      });

      const result = await deleteCategory(TEST_USER_ID, "cat-1");

      expect(result).toEqual(
        expect.objectContaining({ id: "cat-1", name: "อาหาร" })
      );
      expect(mockDelete).toHaveBeenCalledWith({ where: { id: "cat-1" } });
      expect(mockTransactionUpdateMany).not.toHaveBeenCalled();
    });

    it("should move transactions to 'ไม่ระบุ' when deleting category with transactions", async () => {
      // Category exists
      mockFindFirst.mockResolvedValueOnce({
        id: "cat-1",
        name: "อาหาร",
        icon: "🍔",
        userId: TEST_USER_ID,
      });
      // Has transactions
      mockTransactionCount.mockResolvedValue(3);
      // "ไม่ระบุ" category already exists
      mockFindFirst.mockResolvedValueOnce({
        id: "cat-uncategorized",
        name: "ไม่ระบุ",
        icon: "📁",
        isDefault: true,
        userId: TEST_USER_ID,
      });
      mockTransactionUpdateMany.mockResolvedValue({ count: 3 });
      mockDelete.mockResolvedValue({
        id: "cat-1",
        name: "อาหาร",
        userId: TEST_USER_ID,
      });

      await deleteCategory(TEST_USER_ID, "cat-1");

      expect(mockTransactionUpdateMany).toHaveBeenCalledWith({
        where: { categoryId: "cat-1", userId: TEST_USER_ID },
        data: { categoryId: "cat-uncategorized" },
      });
      expect(mockDelete).toHaveBeenCalledWith({ where: { id: "cat-1" } });
    });

    it("should create 'ไม่ระบุ' category if it doesn't exist when moving transactions", async () => {
      // Category exists
      mockFindFirst.mockResolvedValueOnce({
        id: "cat-1",
        name: "อาหาร",
        icon: "🍔",
        userId: TEST_USER_ID,
      });
      // Has transactions
      mockTransactionCount.mockResolvedValue(2);
      // "ไม่ระบุ" category does NOT exist
      mockFindFirst.mockResolvedValueOnce(null);
      // Create "ไม่ระบุ"
      mockCreate.mockResolvedValue({
        id: "cat-uncategorized-new",
        name: "ไม่ระบุ",
        icon: "📁",
        isDefault: true,
        userId: TEST_USER_ID,
      });
      mockTransactionUpdateMany.mockResolvedValue({ count: 2 });
      mockDelete.mockResolvedValue({
        id: "cat-1",
        name: "อาหาร",
        userId: TEST_USER_ID,
      });

      await deleteCategory(TEST_USER_ID, "cat-1");

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          name: "ไม่ระบุ",
          icon: "📁",
          isDefault: true,
          userId: TEST_USER_ID,
        },
      });
      expect(mockTransactionUpdateMany).toHaveBeenCalledWith({
        where: { categoryId: "cat-1", userId: TEST_USER_ID },
        data: { categoryId: "cat-uncategorized-new" },
      });
      expect(mockDelete).toHaveBeenCalledWith({ where: { id: "cat-1" } });
    });

    it("should throw CategoryNotFoundError if category not found", async () => {
      mockFindFirst.mockResolvedValue(null);

      await expect(
        deleteCategory(TEST_USER_ID, "non-existent")
      ).rejects.toThrow(CategoryNotFoundError);

      await expect(
        deleteCategory(TEST_USER_ID, "non-existent")
      ).rejects.toThrow("ไม่พบหมวดหมู่");
    });
  });
});
