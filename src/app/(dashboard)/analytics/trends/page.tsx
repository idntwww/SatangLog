"use client";

import { useState, useMemo } from "react";
import { LineChart } from "@/components/charts/LineChart";
import type { LineChartDataPoint } from "@/components/charts/LineChart";
import { TrendingUp, TrendingDown, Calendar, BarChart3 } from "lucide-react";

// ===== Placeholder Data =====

const MONTHLY_DATA: LineChartDataPoint[] = [
  { period: "ก.ค. 66", income: 45000, expense: 32000 },
  { period: "ส.ค. 66", income: 47000, expense: 35000 },
  { period: "ก.ย. 66", income: 45000, expense: 28000 },
  { period: "ต.ค. 66", income: 50000, expense: 38000 },
  { period: "พ.ย. 66", income: 48000, expense: 42000 },
  { period: "ธ.ค. 66", income: 55000, expense: 48000 },
  { period: "ม.ค. 67", income: 45000, expense: 30000 },
  { period: "ก.พ. 67", income: 46000, expense: 33000 },
  { period: "มี.ค. 67", income: 48000, expense: 36000 },
  { period: "เม.ย. 67", income: 52000, expense: 40000 },
  { period: "พ.ค. 67", income: 49000, expense: 37000 },
  { period: "มิ.ย. 67", income: 51000, expense: 35000 },
];

const WEEKLY_DATA: LineChartDataPoint[] = [
  { period: "สัปดาห์ 1", income: 12000, expense: 8500 },
  { period: "สัปดาห์ 2", income: 11500, expense: 9200 },
  { period: "สัปดาห์ 3", income: 13000, expense: 7800 },
  { period: "สัปดาห์ 4", income: 12500, expense: 10500 },
  { period: "สัปดาห์ 5", income: 11000, expense: 8000 },
  { period: "สัปดาห์ 6", income: 14000, expense: 9500 },
  { period: "สัปดาห์ 7", income: 12000, expense: 11000 },
  { period: "สัปดาห์ 8", income: 13500, expense: 8800 },
  { period: "สัปดาห์ 9", income: 12800, expense: 9100 },
  { period: "สัปดาห์ 10", income: 11500, expense: 10200 },
  { period: "สัปดาห์ 11", income: 13200, expense: 8600 },
  { period: "สัปดาห์ 12", income: 12700, expense: 9300 },
];

// ===== Helpers =====

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(amount);
}

type ViewMode = "monthly" | "weekly";

// ===== Component =====

export default function TrendAnalyticsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("monthly");

  const data = viewMode === "monthly" ? MONTHLY_DATA : WEEKLY_DATA;

  const averageIncome = useMemo(() => {
    if (data.length === 0) return 0;
    return data.reduce((sum, d) => sum + d.income, 0) / data.length;
  }, [data]);

  const averageExpense = useMemo(() => {
    if (data.length === 0) return 0;
    return data.reduce((sum, d) => sum + d.expense, 0) / data.length;
  }, [data]);

  const highestExpense = useMemo(() => {
    if (data.length === 0) return { period: "-", amount: 0 };
    const max = data.reduce((prev, curr) =>
      curr.expense > prev.expense ? curr : prev
    );
    return { period: max.period, amount: max.expense };
  }, [data]);

  const lowestExpense = useMemo(() => {
    if (data.length === 0) return { period: "-", amount: 0 };
    const min = data.reduce((prev, curr) =>
      curr.expense < prev.expense ? curr : prev
    );
    return { period: min.period, amount: min.expense };
  }, [data]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">วิเคราะห์แนวโน้ม</h1>
          <p className="text-muted-foreground text-sm">
            แนวโน้มรายรับ-รายจ่ายตามช่วงเวลา
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 rounded-lg border p-1 bg-muted/50">
          <button
            onClick={() => setViewMode("monthly")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === "monthly"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calendar className="h-4 w-4" />
            รายเดือน
          </button>
          <button
            onClick={() => setViewMode("weekly")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === "weekly"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            รายสัปดาห์
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Average Income */}
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <p className="text-sm text-muted-foreground">
              ค่าเฉลี่ยรายรับ/{viewMode === "monthly" ? "เดือน" : "สัปดาห์"}
            </p>
          </div>
          <p className="text-xl font-bold text-green-600">
            {formatCurrency(averageIncome)}
          </p>
        </div>

        {/* Average Expense */}
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-4 w-4 text-red-600" />
            <p className="text-sm text-muted-foreground">
              ค่าเฉลี่ยรายจ่าย/{viewMode === "monthly" ? "เดือน" : "สัปดาห์"}
            </p>
          </div>
          <p className="text-xl font-bold text-red-600">
            {formatCurrency(averageExpense)}
          </p>
        </div>

        {/* Highest Expense */}
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">
            รายจ่ายสูงสุด
          </p>
          <p className="text-xl font-bold">{formatCurrency(highestExpense.amount)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {highestExpense.period}
          </p>
        </div>

        {/* Lowest Expense */}
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">
            รายจ่ายต่ำสุด
          </p>
          <p className="text-xl font-bold">{formatCurrency(lowestExpense.amount)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {lowestExpense.period}
          </p>
        </div>
      </div>

      {/* Line Chart */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">
          {viewMode === "monthly"
            ? "รายรับ-รายจ่ายย้อนหลัง 12 เดือน"
            : "รายรับ-รายจ่ายย้อนหลัง 12 สัปดาห์"}
        </h3>
        <LineChart data={data} />
      </div>
    </div>
  );
}
