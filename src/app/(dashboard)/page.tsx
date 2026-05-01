"use client";

import { useState } from "react";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { MonthlyChart } from "@/components/dashboard/MonthlyChart";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import type { Transaction } from "@/types";

// Placeholder data — จะเชื่อมต่อ TanStack Query hooks ใน task ถัดไป
const PLACEHOLDER_SUMMARY = {
  totalIncome: 85000,
  totalExpense: 42500,
  balance: 42500,
};

const PLACEHOLDER_MONTHLY_DATA = [
  { month: "ม.ค.", income: 75000, expense: 38000 },
  { month: "ก.พ.", income: 80000, expense: 41000 },
  { month: "มี.ค.", income: 78000, expense: 45000 },
  { month: "เม.ย.", income: 82000, expense: 39000 },
  { month: "พ.ค.", income: 85000, expense: 42500 },
  { month: "มิ.ย.", income: 90000, expense: 47000 },
];

const PLACEHOLDER_TRANSACTIONS: Transaction[] = [
  {
    id: "1",
    amount: 45000,
    type: "INCOME",
    note: "เงินเดือน",
    date: "2024-06-01T00:00:00.000Z",
    currency: "THB",
    userId: "user1",
    categoryId: "cat1",
    createdAt: "2024-06-01T00:00:00.000Z",
    updatedAt: "2024-06-01T00:00:00.000Z",
    category: { id: "cat1", name: "เงินเดือน", icon: "💰", isDefault: true, userId: "user1", createdAt: "2024-01-01T00:00:00.000Z" },
  },
  {
    id: "2",
    amount: 350,
    type: "EXPENSE",
    note: "ข้าวกลางวัน",
    date: "2024-06-15T00:00:00.000Z",
    currency: "THB",
    userId: "user1",
    categoryId: "cat2",
    createdAt: "2024-06-15T00:00:00.000Z",
    updatedAt: "2024-06-15T00:00:00.000Z",
    category: { id: "cat2", name: "อาหาร", icon: "🍔", isDefault: true, userId: "user1", createdAt: "2024-01-01T00:00:00.000Z" },
  },
  {
    id: "3",
    amount: 1500,
    type: "EXPENSE",
    note: "ค่ารถไฟฟ้า",
    date: "2024-06-14T00:00:00.000Z",
    currency: "THB",
    userId: "user1",
    categoryId: "cat3",
    createdAt: "2024-06-14T00:00:00.000Z",
    updatedAt: "2024-06-14T00:00:00.000Z",
    category: { id: "cat3", name: "ค่าเดินทาง", icon: "🚗", isDefault: true, userId: "user1", createdAt: "2024-01-01T00:00:00.000Z" },
  },
  {
    id: "4",
    amount: 5000,
    type: "INCOME",
    note: "งานฟรีแลนซ์",
    date: "2024-06-13T00:00:00.000Z",
    currency: "THB",
    userId: "user1",
    categoryId: "cat4",
    createdAt: "2024-06-13T00:00:00.000Z",
    updatedAt: "2024-06-13T00:00:00.000Z",
    category: { id: "cat4", name: "รายได้เสริม", icon: "💼", isDefault: true, userId: "user1", createdAt: "2024-01-01T00:00:00.000Z" },
  },
  {
    id: "5",
    amount: 8500,
    type: "EXPENSE",
    note: "ค่าเช่าห้อง",
    date: "2024-06-01T00:00:00.000Z",
    currency: "THB",
    userId: "user1",
    categoryId: "cat5",
    createdAt: "2024-06-01T00:00:00.000Z",
    updatedAt: "2024-06-01T00:00:00.000Z",
    category: { id: "cat5", name: "ที่พัก", icon: "🏠", isDefault: true, userId: "user1", createdAt: "2024-01-01T00:00:00.000Z" },
  },
  {
    id: "6",
    amount: 200,
    type: "EXPENSE",
    note: "กาแฟ",
    date: "2024-06-12T00:00:00.000Z",
    currency: "THB",
    userId: "user1",
    categoryId: "cat2",
    createdAt: "2024-06-12T00:00:00.000Z",
    updatedAt: "2024-06-12T00:00:00.000Z",
    category: { id: "cat2", name: "อาหาร", icon: "🍔", isDefault: true, userId: "user1", createdAt: "2024-01-01T00:00:00.000Z" },
  },
  {
    id: "7",
    amount: 3500,
    type: "EXPENSE",
    note: "ค่าไฟฟ้า",
    date: "2024-06-10T00:00:00.000Z",
    currency: "THB",
    userId: "user1",
    categoryId: "cat6",
    createdAt: "2024-06-10T00:00:00.000Z",
    updatedAt: "2024-06-10T00:00:00.000Z",
    category: { id: "cat6", name: "อื่นๆ", icon: "📁", isDefault: true, userId: "user1", createdAt: "2024-01-01T00:00:00.000Z" },
  },
  {
    id: "8",
    amount: 15000,
    type: "INCOME",
    note: "โบนัส",
    date: "2024-06-05T00:00:00.000Z",
    currency: "THB",
    userId: "user1",
    categoryId: "cat1",
    createdAt: "2024-06-05T00:00:00.000Z",
    updatedAt: "2024-06-05T00:00:00.000Z",
    category: { id: "cat1", name: "เงินเดือน", icon: "💰", isDefault: true, userId: "user1", createdAt: "2024-01-01T00:00:00.000Z" },
  },
  {
    id: "9",
    amount: 450,
    type: "EXPENSE",
    note: "ค่าโทรศัพท์",
    date: "2024-06-08T00:00:00.000Z",
    currency: "THB",
    userId: "user1",
    categoryId: "cat6",
    createdAt: "2024-06-08T00:00:00.000Z",
    updatedAt: "2024-06-08T00:00:00.000Z",
    category: { id: "cat6", name: "อื่นๆ", icon: "📁", isDefault: true, userId: "user1", createdAt: "2024-01-01T00:00:00.000Z" },
  },
  {
    id: "10",
    amount: 2800,
    type: "EXPENSE",
    note: "ซื้อของใช้",
    date: "2024-06-07T00:00:00.000Z",
    currency: "THB",
    userId: "user1",
    categoryId: "cat6",
    createdAt: "2024-06-07T00:00:00.000Z",
    updatedAt: "2024-06-07T00:00:00.000Z",
    category: { id: "cat6", name: "อื่นๆ", icon: "📁", isDefault: true, userId: "user1", createdAt: "2024-01-01T00:00:00.000Z" },
  },
];

type PeriodOption = "this_month" | "last_month" | "last_3_months" | "last_6_months";

const PERIOD_LABELS: Record<PeriodOption, string> = {
  this_month: "เดือนนี้",
  last_month: "เดือนที่แล้ว",
  last_3_months: "3 เดือนล่าสุด",
  last_6_months: "6 เดือนล่าสุด",
};

export default function DashboardPage() {
  const [period, setPeriod] = useState<PeriodOption>("this_month");

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">ภาพรวม</h1>
          <p className="text-muted-foreground text-sm">
            สรุปรายรับรายจ่ายของคุณ
          </p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as PeriodOption)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="เลือกช่วงเวลา"
        >
          {Object.entries(PERIOD_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <SummaryCards
        totalIncome={PLACEHOLDER_SUMMARY.totalIncome}
        totalExpense={PLACEHOLDER_SUMMARY.totalExpense}
        balance={PLACEHOLDER_SUMMARY.balance}
        period={PERIOD_LABELS[period]}
      />

      {/* Monthly Chart */}
      <MonthlyChart data={PLACEHOLDER_MONTHLY_DATA} />

      {/* Recent Transactions */}
      <RecentTransactions transactions={PLACEHOLDER_TRANSACTIONS} />
    </div>
  );
}
