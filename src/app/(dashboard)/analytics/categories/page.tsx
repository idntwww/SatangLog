"use client";

import { useState, useMemo } from "react";
import { PieChart } from "@/components/charts/PieChart";
import type { PieChartDataItem } from "@/components/charts/PieChart";
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Transaction } from "@/types";

// ===== Placeholder Data =====

interface CategoryData {
  id: string;
  name: string;
  icon: string;
  total: number;
  percentage: number;
  changeFromLastMonth: number;
  transactions: Transaction[];
}

const PLACEHOLDER_CATEGORIES: CategoryData[] = [
  {
    id: "cat1",
    name: "อาหาร",
    icon: "🍔",
    total: 12500,
    percentage: 29.4,
    changeFromLastMonth: 8.5,
    transactions: [
      {
        id: "t1",
        amount: 350,
        type: "EXPENSE",
        note: "ข้าวกลางวัน",
        date: "2024-06-15T00:00:00.000Z",
        currency: "THB",
        userId: "user1",
        categoryId: "cat1",
        createdAt: "2024-06-15T00:00:00.000Z",
        updatedAt: "2024-06-15T00:00:00.000Z",
      },
      {
        id: "t2",
        amount: 200,
        type: "EXPENSE",
        note: "กาแฟ",
        date: "2024-06-14T00:00:00.000Z",
        currency: "THB",
        userId: "user1",
        categoryId: "cat1",
        createdAt: "2024-06-14T00:00:00.000Z",
        updatedAt: "2024-06-14T00:00:00.000Z",
      },
      {
        id: "t3",
        amount: 450,
        type: "EXPENSE",
        note: "อาหารเย็น",
        date: "2024-06-13T00:00:00.000Z",
        currency: "THB",
        userId: "user1",
        categoryId: "cat1",
        createdAt: "2024-06-13T00:00:00.000Z",
        updatedAt: "2024-06-13T00:00:00.000Z",
      },
    ],
  },
  {
    id: "cat2",
    name: "ค่าเดินทาง",
    icon: "🚗",
    total: 8500,
    percentage: 20.0,
    changeFromLastMonth: -5.2,
    transactions: [
      {
        id: "t4",
        amount: 1500,
        type: "EXPENSE",
        note: "ค่ารถไฟฟ้า",
        date: "2024-06-14T00:00:00.000Z",
        currency: "THB",
        userId: "user1",
        categoryId: "cat2",
        createdAt: "2024-06-14T00:00:00.000Z",
        updatedAt: "2024-06-14T00:00:00.000Z",
      },
      {
        id: "t5",
        amount: 500,
        type: "EXPENSE",
        note: "ค่าแท็กซี่",
        date: "2024-06-12T00:00:00.000Z",
        currency: "THB",
        userId: "user1",
        categoryId: "cat2",
        createdAt: "2024-06-12T00:00:00.000Z",
        updatedAt: "2024-06-12T00:00:00.000Z",
      },
    ],
  },
  {
    id: "cat3",
    name: "ที่พัก",
    icon: "🏠",
    total: 8500,
    percentage: 20.0,
    changeFromLastMonth: 0,
    transactions: [
      {
        id: "t6",
        amount: 8500,
        type: "EXPENSE",
        note: "ค่าเช่าห้อง",
        date: "2024-06-01T00:00:00.000Z",
        currency: "THB",
        userId: "user1",
        categoryId: "cat3",
        createdAt: "2024-06-01T00:00:00.000Z",
        updatedAt: "2024-06-01T00:00:00.000Z",
      },
    ],
  },
  {
    id: "cat4",
    name: "สาธารณูปโภค",
    icon: "💡",
    total: 6750,
    percentage: 15.9,
    changeFromLastMonth: 12.3,
    transactions: [
      {
        id: "t7",
        amount: 3500,
        type: "EXPENSE",
        note: "ค่าไฟฟ้า",
        date: "2024-06-10T00:00:00.000Z",
        currency: "THB",
        userId: "user1",
        categoryId: "cat4",
        createdAt: "2024-06-10T00:00:00.000Z",
        updatedAt: "2024-06-10T00:00:00.000Z",
      },
      {
        id: "t8",
        amount: 2800,
        type: "EXPENSE",
        note: "ค่าน้ำ",
        date: "2024-06-10T00:00:00.000Z",
        currency: "THB",
        userId: "user1",
        categoryId: "cat4",
        createdAt: "2024-06-10T00:00:00.000Z",
        updatedAt: "2024-06-10T00:00:00.000Z",
      },
    ],
  },
  {
    id: "cat5",
    name: "บันเทิง",
    icon: "🎬",
    total: 3800,
    percentage: 8.9,
    changeFromLastMonth: -15.0,
    transactions: [
      {
        id: "t9",
        amount: 2000,
        type: "EXPENSE",
        note: "ดูหนัง + ป๊อปคอร์น",
        date: "2024-06-08T00:00:00.000Z",
        currency: "THB",
        userId: "user1",
        categoryId: "cat5",
        createdAt: "2024-06-08T00:00:00.000Z",
        updatedAt: "2024-06-08T00:00:00.000Z",
      },
      {
        id: "t10",
        amount: 1800,
        type: "EXPENSE",
        note: "สมัคร Netflix",
        date: "2024-06-05T00:00:00.000Z",
        currency: "THB",
        userId: "user1",
        categoryId: "cat5",
        createdAt: "2024-06-05T00:00:00.000Z",
        updatedAt: "2024-06-05T00:00:00.000Z",
      },
    ],
  },
  {
    id: "cat6",
    name: "อื่นๆ",
    icon: "📁",
    total: 2450,
    percentage: 5.8,
    changeFromLastMonth: 3.1,
    transactions: [
      {
        id: "t11",
        amount: 450,
        type: "EXPENSE",
        note: "ค่าโทรศัพท์",
        date: "2024-06-08T00:00:00.000Z",
        currency: "THB",
        userId: "user1",
        categoryId: "cat6",
        createdAt: "2024-06-08T00:00:00.000Z",
        updatedAt: "2024-06-08T00:00:00.000Z",
      },
      {
        id: "t12",
        amount: 2000,
        type: "EXPENSE",
        note: "ซื้อของใช้",
        date: "2024-06-07T00:00:00.000Z",
        currency: "THB",
        userId: "user1",
        categoryId: "cat6",
        createdAt: "2024-06-07T00:00:00.000Z",
        updatedAt: "2024-06-07T00:00:00.000Z",
      },
    ],
  },
];

// ===== Helper =====

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ===== Component =====

export default function CategoryAnalyticsPage() {
  const [dateFrom, setDateFrom] = useState<string | undefined>(undefined);
  const [dateTo, setDateTo] = useState<string | undefined>(undefined);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );

  const pieData: PieChartDataItem[] = useMemo(
    () =>
      PLACEHOLDER_CATEGORIES.map((cat) => ({
        name: `${cat.icon} ${cat.name}`,
        value: cat.total,
        id: cat.id,
      })),
    []
  );

  const selectedCategory = useMemo(
    () =>
      PLACEHOLDER_CATEGORIES.find((cat) => cat.id === selectedCategoryId) ??
      null,
    [selectedCategoryId]
  );

  const totalExpense = useMemo(
    () => PLACEHOLDER_CATEGORIES.reduce((sum, cat) => sum + cat.total, 0),
    []
  );

  const handleSliceClick = (item: PieChartDataItem) => {
    const category = PLACEHOLDER_CATEGORIES.find(
      (cat) => `${cat.icon} ${cat.name}` === item.name
    );
    if (category) {
      setSelectedCategoryId((prev) =>
        prev === category.id ? null : category.id
      );
    }
  };

  const handleDateChange = (from: string | undefined, to: string | undefined) => {
    setDateFrom(from);
    setDateTo(to);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">วิเคราะห์ตามหมวดหมู่</h1>
          <p className="text-muted-foreground text-sm">
            สัดส่วนรายจ่ายแยกตามหมวดหมู่
          </p>
        </div>
        <DateRangePicker
          from={dateFrom}
          to={dateTo}
          onChange={handleDateChange}
          className="w-[280px]"
        />
      </div>

      {/* Total Expense Summary */}
      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm text-muted-foreground">รายจ่ายรวมทั้งหมด</p>
        <p className="text-2xl font-bold">{formatCurrency(totalExpense)}</p>
      </div>

      {/* Pie Chart */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">
          สัดส่วนรายจ่ายแต่ละหมวดหมู่
        </h3>
        <PieChart data={pieData} onSliceClick={handleSliceClick} />
        {selectedCategoryId && (
          <p className="text-sm text-muted-foreground text-center mt-2">
            คลิกอีกครั้งเพื่อยกเลิกการเลือก
          </p>
        )}
      </div>

      {/* Category Ranking Table */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">
          จัดอันดับหมวดหมู่ (สูงสุด → ต่ำสุด)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                  อันดับ
                </th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                  หมวดหมู่
                </th>
                <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                  ยอดรวม
                </th>
                <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                  สัดส่วน
                </th>
                <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                  เทียบเดือนก่อน
                </th>
              </tr>
            </thead>
            <tbody>
              {PLACEHOLDER_CATEGORIES.map((cat, index) => (
                <tr
                  key={cat.id}
                  className={`border-b last:border-0 cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedCategoryId === cat.id ? "bg-muted" : ""
                  }`}
                  onClick={() =>
                    setSelectedCategoryId((prev) =>
                      prev === cat.id ? null : cat.id
                    )
                  }
                >
                  <td className="py-3 px-2 font-medium">{index + 1}</td>
                  <td className="py-3 px-2">
                    <span className="mr-2">{cat.icon}</span>
                    {cat.name}
                  </td>
                  <td className="py-3 px-2 text-right font-medium">
                    {formatCurrency(cat.total)}
                  </td>
                  <td className="py-3 px-2 text-right">
                    {cat.percentage.toFixed(1)}%
                  </td>
                  <td className="py-3 px-2 text-right">
                    <ChangeIndicator value={cat.changeFromLastMonth} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Category Transactions */}
      {selectedCategory && (
        <div className="rounded-xl border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">
            <span className="mr-2">{selectedCategory.icon}</span>
            รายการใน &quot;{selectedCategory.name}&quot;
          </h3>
          <div className="space-y-2">
            {selectedCategory.transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-2 px-3 rounded-lg border"
              >
                <div>
                  <p className="font-medium text-sm">{tx.note || "-"}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(tx.date)}
                  </p>
                </div>
                <p className="font-semibold text-sm text-red-600">
                  -{formatCurrency(tx.amount)}
                </p>
              </div>
            ))}
            {selectedCategory.transactions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                ไม่มีรายการในหมวดหมู่นี้
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Sub-components =====

function ChangeIndicator({ value }: { value: number }) {
  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-red-600">
        <TrendingUp className="h-3 w-3" />
        +{value.toFixed(1)}%
      </span>
    );
  }
  if (value < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-green-600">
        <TrendingDown className="h-3 w-3" />
        {value.toFixed(1)}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <Minus className="h-3 w-3" />
      0%
    </span>
  );
}
