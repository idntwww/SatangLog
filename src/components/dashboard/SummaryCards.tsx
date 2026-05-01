"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

interface SummaryCardsProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  period: string;
  comparedToPrevious?: {
    incomeChange: number;
    expenseChange: number;
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function ChangeIndicator({ change }: { change: number }) {
  if (change === 0) return null;
  const isPositive = change > 0;
  return (
    <span
      className={`text-xs font-medium ${
        isPositive ? "text-green-600" : "text-red-600"
      }`}
    >
      {isPositive ? "+" : ""}
      {change.toFixed(1)}% จากเดือนก่อน
    </span>
  );
}

export function SummaryCards({
  totalIncome,
  totalExpense,
  balance,
  period,
  comparedToPrevious,
}: SummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* รายรับ */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            รายรับ
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(totalIncome)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{period}</p>
          {comparedToPrevious && (
            <ChangeIndicator change={comparedToPrevious.incomeChange} />
          )}
        </CardContent>
      </Card>

      {/* รายจ่าย */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            รายจ่าย
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(totalExpense)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{period}</p>
          {comparedToPrevious && (
            <ChangeIndicator change={comparedToPrevious.expenseChange} />
          )}
        </CardContent>
      </Card>

      {/* ยอดคงเหลือ */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            ยอดคงเหลือ
          </CardTitle>
          <Wallet className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(balance)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{period}</p>
        </CardContent>
      </Card>
    </div>
  );
}
