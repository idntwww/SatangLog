import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTrends } from "@/lib/services/analytics.service";
import { forecast } from "@/lib/analytics/forecast";
import type { DataPoint } from "@/lib/analytics/forecast";
import type { ForecastPrediction } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const monthsParam = searchParams.get("months") ?? "3";

    // Validate months parameter
    const monthsAhead = parseInt(monthsParam, 10);
    if (isNaN(monthsAhead) || monthsAhead < 1 || monthsAhead > 12) {
      return NextResponse.json(
        { error: "months ต้องเป็นตัวเลขระหว่าง 1-12" },
        { status: 400 }
      );
    }

    // Fetch last 12 months of trend data
    const trends = await getTrends(session.user.id, {
      period: "monthly",
      months: 12,
    });

    // Convert trend data to DataPoints for income and expense
    const incomePoints: DataPoint[] = trends.data.map((d, i) => ({
      x: i,
      y: d.income,
    }));

    const expensePoints: DataPoint[] = trends.data.map((d, i) => ({
      x: i,
      y: d.expense,
    }));

    // Forecast future months
    const predictedIncome = forecast(incomePoints, monthsAhead);
    const predictedExpense = forecast(expensePoints, monthsAhead);

    // Generate future month labels
    const lastPeriod = trends.data[trends.data.length - 1]?.period;
    const predictions: ForecastPrediction[] = [];

    if (lastPeriod) {
      const parts = lastPeriod.split("-");
      const yearStr = parts[0] ?? "2024";
      const monthStr = parts[1] ?? "01";
      let year = parseInt(yearStr, 10);
      let month = parseInt(monthStr, 10);

      for (let i = 0; i < monthsAhead; i++) {
        month++;
        if (month > 12) {
          month = 1;
          year++;
        }

        predictions.push({
          month: `${year}-${String(month).padStart(2, "0")}`,
          predictedIncome: Math.round((predictedIncome[i] ?? 0) * 100) / 100,
          predictedExpense: Math.round((predictedExpense[i] ?? 0) * 100) / 100,
        });
      }
    }

    return NextResponse.json({ data: predictions });
  } catch (error) {
    console.error("Forecast analytics error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
