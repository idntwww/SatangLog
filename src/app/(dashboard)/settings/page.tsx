"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";

import type { Category } from "@/types";
import type { CategoryCreateSchema } from "@/lib/validators/category";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/hooks/useCategories";
import { CategoryForm } from "@/components/forms/CategoryForm";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null
  );

  const { data: categories = [], isLoading } = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  async function handleCreate(data: CategoryCreateSchema) {
    await createMutation.mutateAsync(data);
    setShowForm(false);
  }

  async function handleUpdate(data: CategoryCreateSchema) {
    if (!editingCategory) return;
    await updateMutation.mutateAsync({
      id: editingCategory.id,
      data,
    });
    setEditingCategory(null);
  }

  function handleDelete() {
    if (!deletingCategory) return;
    deleteMutation.mutate(deletingCategory.id);
    setDeletingCategory(null);
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">ตั้งค่า</h1>
        <p className="text-muted-foreground text-sm">
          จัดการหมวดหมู่และการตั้งค่าอื่นๆ
        </p>
      </div>

      {/* Category Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>หมวดหมู่</CardTitle>
              <CardDescription>
                จัดการหมวดหมู่สำหรับรายรับรายจ่ายของคุณ
              </CardDescription>
            </div>
            {!showForm && !editingCategory && (
              <Button
                size="sm"
                onClick={() => setShowForm(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                เพิ่มหมวดหมู่
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Create Form */}
          {showForm && (
            <div className="rounded-lg border p-4">
              <h3 className="text-sm font-medium mb-3">สร้างหมวดหมู่ใหม่</h3>
              <CategoryForm
                mode="create"
                onSubmit={handleCreate}
                onCancel={() => setShowForm(false)}
              />
            </div>
          )}

          {/* Edit Form */}
          {editingCategory && (
            <div className="rounded-lg border p-4">
              <h3 className="text-sm font-medium mb-3">
                แก้ไขหมวดหมู่: {editingCategory.icon} {editingCategory.name}
              </h3>
              <CategoryForm
                mode="edit"
                initialData={editingCategory}
                onSubmit={handleUpdate}
                onCancel={() => setEditingCategory(null)}
              />
            </div>
          )}

          <Separator />

          {/* Category List */}
          {isLoading ? (
            <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
          ) : categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              ยังไม่มีหมวดหมู่ กดปุ่ม &quot;เพิ่มหมวดหมู่&quot; เพื่อสร้างใหม่
            </p>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between rounded-md border px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{category.icon}</span>
                    <div>
                      <p className="text-sm font-medium">{category.name}</p>
                      {category.isDefault && (
                        <span className="text-xs text-muted-foreground">
                          ค่าเริ่มต้น
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setShowForm(false);
                        setEditingCategory(category);
                      }}
                      aria-label={`แก้ไข ${category.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingCategory(category)}
                      aria-label={`ลบ ${category.name}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!deletingCategory}
        onOpenChange={(open) => {
          if (!open) setDeletingCategory(null);
        }}
        title="ลบหมวดหมู่"
        description={`คุณต้องการลบหมวดหมู่ "${deletingCategory?.icon} ${deletingCategory?.name}" หรือไม่? รายการธุรกรรมที่อยู่ในหมวดหมู่นี้จะถูกย้ายไปหมวดหมู่ "ไม่ระบุ"`}
        onConfirm={handleDelete}
        confirmText="ลบ"
        cancelText="ยกเลิก"
        variant="destructive"
      />
    </div>
  );
}
