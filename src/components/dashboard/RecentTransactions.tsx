"use client";

import type { Transaction } from "@/types";
import { format } from "date-fns";
import { th } from "date-fns/locale";

interface RecentTransactionsProps {
  transactions: Transaction[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">รายการล่าสุด</h3>
        <p className="text-muted-foreground text-sm text-center py-8">
          ยังไม่มีรายการ
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="text-lg font-semibold mb-4">รายการล่าสุด</h3>
      <div className="space-y-3">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between py-2 border-b last:border-b-0"
          >
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  tx.type === "INCOME"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {tx.type === "INCOME" ? "รายรับ" : "รายจ่าย"}
              </span>
              <div>
                <p className="text-sm font-medium">
                  {tx.category?.name ?? "ไม่ระบุ"}
                </p>
                {tx.note && (
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {tx.note}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p
                className={`text-sm font-semibold ${
                  tx.type === "INCOME" ? "text-green-600" : "text-red-600"
                }`}
              >
                {tx.type === "INCOME" ? "+" : "-"}
                {formatCurrency(tx.amount)}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(tx.date), "d MMM yyyy", { locale: th })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
