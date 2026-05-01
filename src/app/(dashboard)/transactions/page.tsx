"use client";

import { useState, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Plus, Pencil, Trash2, Download } from "lucide-react";
import Link from "next/link";

import type { Transaction } from "@/types";
import { DataTable } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";

// Placeholder data — will be replaced with TanStack Query in task 5.5
const PLACEHOLDER_TRANSACTIONS: Transaction[] = [
  {
    id: "1",
    amount: 45000,
    type: "INCOME",
    note: "เงินเดือนประจำเดือน",
    date: "2024-01-25T00:00:00.000Z",
    currency: "THB",
    userId: "user1",
    categoryId: "cat1",
    createdAt: "2024-01-25T00:00:00.000Z",
    updatedAt: "2024-01-25T00:00:00.000Z",
    category: { id: "cat1", name: "เงินเดือน", icon: "💰", isDefault: true, userId: "user1", createdAt: "2024-01-01T00:00:00.000Z" },
  },
  {
    id: "2",
    amount: 350,
    type: "EXPENSE",
    note: "อาหารกลางวัน",
    date: "2024-01-26T00:00:00.000Z",
    currency: "THB",
    userId: "user1",
    categoryId: "cat2",
    createdAt: "2024-01-26T00:00:00.000Z",
    updatedAt: "2024-01-26T00:00:00.000Z",
    category: { id: "cat2", name: "อาหาร", icon: "🍔", isDefault: true, userId: "user1", createdAt: "2024-01-01T00:00:00.000Z" },
  },
  {
    id: "3",
    amount: 1500,
    type: "EXPENSE",
    note: "ค่าน้ำมัน",
    date: "2024-01-27T00:00:00.000Z",
    currency: "THB",
    userId: "user1",
    categoryId: "cat3",
    createdAt: "2024-01-27T00:00:00.000Z",
    updatedAt: "2024-01-27T00:00:00.000Z",
    category: { id: "cat3", name: "ค่าเดินทาง", icon: "🚗", isDefault: true, userId: "user1", createdAt: "2024-01-01T00:00:00.000Z" },
  },
  {
    id: "4",
    amount: 5000,
    type: "INCOME",
    note: "รายได้เสริมจากฟรีแลนซ์",
    date: "2024-01-28T00:00:00.000Z",
    currency: "THB",
    userId: "user1",
    categoryId: "cat4",
    createdAt: "2024-01-28T00:00:00.000Z",
    updatedAt: "2024-01-28T00:00:00.000Z",
    category: { id: "cat4", name: "รายได้เสริม", icon: "💼", isDefault: true, userId: "user1", createdAt: "2024-01-01T00:00:00.000Z" },
  },
  {
    id: "5",
    amount: 8500,
    type: "EXPENSE",
    note: "ค่าเช่าห้อง",
    date: "2024-01-01T00:00:00.000Z",
    currency: "THB",
    userId: "user1",
    categoryId: "cat5",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    category: { id: "cat5", name: "ที่พัก", icon: "🏠", isDefault: true, userId: "user1", createdAt: "2024-01-01T00:00:00.000Z" },
  },
];

function formatCurrency(amount: number, currency: string = "THB"): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency,
  }).format(amount);
}

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sortColumn, setSortColumn] = useState<string | undefined>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Placeholder: will be replaced with TanStack Query hook
  const transactions = PLACEHOLDER_TRANSACTIONS;
  const isLoading = false;
  const total = transactions.length;
  const pageSize = 10;

  const handleSort = (column: string, direction: "asc" | "desc") => {
    setSortColumn(column);
    setSortDirection(direction);
  };

  const handleDelete = (transaction: Transaction) => {
    setDeleteTarget(transaction);
  };

  const confirmDelete = () => {
    // Placeholder: will call delete mutation in task 5.5
    console.log("Deleting transaction:", deleteTarget?.id);
    setDeleteTarget(null);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/export");
      if (!response.ok) return;

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `satanglog-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const columns: ColumnDef<Transaction, unknown>[] = useMemo(
    () => [
      {
        accessorKey: "date",
        header: "วันที่",
        enableSorting: true,
        cell: ({ row }) => {
          const date = new Date(row.original.date);
          return format(date, "dd MMM yyyy", { locale: th });
        },
      },
      {
        accessorKey: "type",
        header: "ประเภท",
        enableSorting: true,
        cell: ({ row }) => {
          const isIncome = row.original.type === "INCOME";
          return (
            <span
              className={
                isIncome
                  ? "text-green-600 font-medium"
                  : "text-red-600 font-medium"
              }
            >
              {isIncome ? "รายรับ" : "รายจ่าย"}
            </span>
          );
        },
      },
      {
        accessorKey: "amount",
        header: "จำนวนเงิน",
        enableSorting: true,
        cell: ({ row }) => {
          const isIncome = row.original.type === "INCOME";
          return (
            <span className={isIncome ? "text-green-600" : "text-red-600"}>
              {isIncome ? "+" : "-"}
              {formatCurrency(row.original.amount, row.original.currency)}
            </span>
          );
        },
      },
      {
        accessorKey: "category",
        header: "หมวดหมู่",
        enableSorting: false,
        cell: ({ row }) => {
          const category = row.original.category;
          if (!category) return <span className="text-muted-foreground">ไม่ระบุ</span>;
          return (
            <span>
              {category.icon} {category.name}
            </span>
          );
        },
      },
      {
        accessorKey: "note",
        header: "หมายเหตุ",
        enableSorting: false,
        cell: ({ row }) => {
          const note = row.original.note;
          if (!note) return <span className="text-muted-foreground">-</span>;
          return (
            <span className="max-w-[200px] truncate block">{note}</span>
          );
        },
      },
      {
        id: "actions",
        header: "จัดการ",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              asChild
              aria-label="แก้ไขรายการ"
            >
              <Link href={`/transactions/${row.original.id}`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(row.original);
              }}
              aria-label="ลบรายการ"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">รายการธุรกรรม</h1>
          <p className="text-muted-foreground">
            จัดการรายรับรายจ่ายทั้งหมดของคุณ
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "กำลังส่งออก..." : "ส่งออก CSV"}
          </Button>
          <Button asChild>
            <Link href="/transactions/new">
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มรายการใหม่
            </Link>
          </Button>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        data={transactions}
        columns={columns}
        pagination={{ page, pageSize, total }}
        onSort={handleSort}
        onPageChange={setPage}
        isLoading={isLoading}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="ยืนยันการลบ"
        description={`คุณต้องการลบรายการ "${deleteTarget?.note || "ไม่มีหมายเหตุ"}" จำนวน ${deleteTarget ? formatCurrency(deleteTarget.amount, deleteTarget.currency) : ""} หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
        onConfirm={confirmDelete}
        confirmText="ลบรายการ"
        cancelText="ยกเลิก"
        variant="destructive"
      />
    </div>
  );
}
