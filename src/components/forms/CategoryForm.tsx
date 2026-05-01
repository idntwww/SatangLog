"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { categoryCreateSchema, type CategoryCreateSchema } from "@/lib/validators/category";
import type { Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface CategoryFormProps {
  mode: "create" | "edit";
  initialData?: Category;
  onSubmit: (data: CategoryCreateSchema) => Promise<void>;
  onCancel: () => void;
}

export function CategoryForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
}: CategoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CategoryCreateSchema>({
    resolver: zodResolver(categoryCreateSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      icon: initialData?.icon ?? "📁",
    },
    mode: "onChange",
  });

  async function handleSubmit(data: CategoryCreateSchema) {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      if (mode === "create") {
        form.reset({ name: "", icon: "📁" });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4"
      >
        {/* ชื่อหมวดหมู่ */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ชื่อหมวดหมู่</FormLabel>
              <FormControl>
                <Input
                  placeholder="เช่น อาหาร, ค่าเดินทาง"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ไอคอน */}
        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ไอคอน (Emoji)</FormLabel>
              <FormControl>
                <Input
                  placeholder="📁"
                  {...field}
                  value={field.value ?? "📁"}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ปุ่มดำเนินการ */}
        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {mode === "create" ? "สร้างหมวดหมู่" : "อัปเดตหมวดหมู่"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            ยกเลิก
          </Button>
        </div>
      </form>
    </Form>
  );
}
