"use client";

import { useState, useMemo } from "react";
import { CompareChart } from "@/components/charts/CompareChart";
import type { CompareChartDataPoint } from "@/components/charts/CompareChart";
import { TrendingUp, TrendingDown, ArrowRightLeft } from "lucide-react";

// ===== Placeholder Data =====

interface CategoryChange {
  categoryId: string;
  name: string;
  month1Amount: number;
  month2Amount: number;
  changePercent: number;
}

interface CompareData {
  month1: { period: string; income: number; expense: number };
  month2: { period: string; income: number; expense: number };
  changes: {
    income: number;
    expense: number;
    byCategory: CategoryChange[];
  };
}

const PLACEHOLDER_DATA: CompareData = {
  month1: { period: "2024-05", income: 49000, expense: 37000 },
  month2: { period: "2024-06", income: 51000, expense: 35000 },
  changes: {
    income: 4.08,
    expense: -5.41,
    byCategory: [
      {
        categoryId: "1",
        name: "อาหาร",
        month1Amount: 12000,
        month2Amount: 10500,
        changePercent: -12.5,
      },
      {
        categoryId: "2",
        name: "ค่าเดินทาง",
        month1Amount: 5000,
        month2Amount: 5800,
        changePercent: 16.0,
      },
      {
        categoryId: "3",
        name: "ที่พัก",
        month1Amount: 10000,
        month2Amount: 10000,
        changePercent: 0,
      },
      {
        categoryId: "4",
        name: "ช้อปปิ้ง",
        month1Amount: 6000,
        month2Amount: 4200,
        changePercent: -30.0,
      },
      {
        categoryId: "5",
        name: "สาธารณูปโภค",
        month1Amount: 4000,
        month2Amount: 4500,
        changePercent: 12.5,
      },
    ],
  },
};

// ===== Month Options =====

const MONTH_OPTIONS = [
  { value: "2024-01", label: "มกราคม 2567" },
  { value: "2024-02", label: "กุมภาพันธ์ 2567" },
  { value: "2024-03", label: "มีนาคม 2567" },
  { value: "2024-04", label: "เมษายน 2567" },
  { value: "2024-05", label: "พฤษภาคม 2567" },
  { value: "2024-06", label: "มิถุนายน 2567" },
  { value: "2024-07", label: "กรกฎาคม 2567" },
  { value: "2024-08", label: "สิงหาคม 2567" },
  { value: "2024-09", label: "กันยายน 2567" },
  { value: "2024-10", label: "ตุลาคม 2567" },
  { value: "2024-11", label: "พฤศจิกายน 2567" },
  { value: "2024-12", label: "ธันวาคม 2567" },
];

// ===== Helpers =====

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(amount);
}

function getMonthLabel(value: string): string {
  const option = MONTH_OPTIONS.find((o) => o.value === value);
  return option?.label ?? value;
}

function ChangeIndicator({ value }: { value: number }) {
  if (value === 0) {
    return <span className="text-muted-foreground text-sm">0%</span>;
  }

  const isPositive = value > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-sm font-medium ${
        isPositive ? "text-green-600" : "text-red-600"
      }`}
    >
      {isPositive ? (
        <TrendingUp className="h-3.5 w-3.5" />
      ) : (
        <TrendingDown className="h-3.5 w-3.5" />
      )}
      {isPositive ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  );
}

// ===== Component =====

export default function CompareAnalyticsPage() {
  const [month1, setMonth1] = useState("2024-05");
  const [month2, setMonth2] = useState("2024-06");

  // Use placeholder data
  const data = PLACEHOLDER_DATA;

  const chartData: CompareChartDataPoint[] = useMemo(
    () => [
      {
        label: "รายรับ",
        month1: data.month1.income,
        month2: data.month2.income,
      },
      {
        label: "รายจ่าย",
        month1: data.month1.expense,
        month2: data.month2.expense,
      },
      {
        label: "คงเหลือ",
        month1: data.month1.income - data.month1.expense,
        month2: data.month2.income - data.month2.expense,
      },
    ],
    [data]
  );

  const month1Label = getMonthLabel(month1);
  const month2Label = getMonthLabel(month2);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">เปรียบเทียบช่วงเวลา</h1>
        <p className="text-muted-foreground text-sm">
          เปรียบเทียบรายรับ-รายจ่ายระหว่าง 2 เดือน
        </p>
      </div>

      {/* Month Selectors */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="month1-select" className="text-sm font-medium whitespace-nowrap">
            เดือนที่ 1:
          </label>
          <select
            id="month1-select"
            value={month1}
            onChange={(e) => setMonth1(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {MONTH_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <ArrowRightLeft className="h-4 w-4 text-muted-foreground hidden sm:block" />

        <div className="flex items-center gap-2">
          <label htmlFor="month2-select" className="text-sm font-medium whitespace-nowrap">
            เดือนที่ 2:
          </label>
          <select
            id="month2-select"
            value={month2}
            onChange={(e) => setMonth2(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {MONTH_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Change Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">รายรับเปลี่ยนแปลง</p>
          <div className="flex items-baseline gap-2">
            <ChangeIndicator value={data.changes.income} />
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {formatCurrency(data.month1.income)} → {formatCurrency(data.month2.income)}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">รายจ่ายเปลี่ยนแปลง</p>
          <div className="flex items-baseline gap-2">
            <ChangeIndicator value={data.changes.expense} />
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {formatCurrency(data.month1.expense)} → {formatCurrency(data.month2.expense)}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">ยอดคงเหลือเปลี่ยนแปลง</p>
          <div className="flex items-baseline gap-2">
            <ChangeIndicator
              value={
                data.month1.income - data.month1.expense === 0
                  ? 0
                  : (((data.month2.income - data.month2.expense) -
                      (data.month1.income - data.month1.expense)) /
                      Math.abs(data.month1.income - data.month1.expense)) *
                    100
              }
            />
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {formatCurrency(data.month1.income - data.month1.expense)} →{" "}
            {formatCurrency(data.month2.income - data.month2.expense)}
          </div>
        </div>
      </div>

      {/* Compare Chart */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">
          กราฟเปรียบเทียบ {month1Label} vs {month2Label}
        </h3>
        <CompareChart
          data={chartData}
          month1Label={month1Label}
          month2Label={month2Label}
        />
      </div>

      {/* Category Breakdown Table */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">
          การเปลี่ยนแปลงแยกตามหมวดหมู่
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-medium">หมวดหมู่</th>
                <th className="text-right py-3 px-2 font-medium">{month1Label}</th>
                <th className="text-right py-3 px-2 font-medium">{month2Label}</th>
                <th className="text-right py-3 px-2 font-medium">เปลี่ยนแปลง</th>
              </tr>
            </thead>
            <tbody>
              {data.changes.byCategory.map((cat) => (
                <tr key={cat.categoryId} className="border-b last:border-b-0">
                  <td className="py-3 px-2 font-medium">{cat.name}</td>
                  <td className="py-3 px-2 text-right">
                    {formatCurrency(cat.month1Amount)}
                  </td>
                  <td className="py-3 px-2 text-right">
                    {formatCurrency(cat.month2Amount)}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <ChangeIndicator value={cat.changePercent} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
