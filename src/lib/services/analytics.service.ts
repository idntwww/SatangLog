import { prisma } from "@/lib/prisma";
import type {
  AnalyticsSummary,
  CategoryAnalytics,
  CompareAnalytics,
  TrendAnalytics,
  TrendDataPoint,
  TxType,
} from "@/types";

export interface GetSummaryParams {
  from?: string;
  to?: string;
}

export interface GetByCategoryParams {
  from?: string;
  to?: string;
  type?: TxType;
}

export interface GetTrendsParams {
  period?: "monthly" | "weekly";
  months?: number;
}

/**
 * คำนวณข้อมูลสรุปรายรับรายจ่าย (totalIncome, totalExpense, balance, transactionCount)
 * กรองตามช่วงเวลาที่เลือก (from/to)
 */
export async function getSummary(
  userId: string,
  params: GetSummaryParams = {}
): Promise<AnalyticsSummary> {
  const { from, to } = params;

  // Build date filter
  const dateFilter: Record<string, Date> | undefined =
    from || to
      ? {
          ...(from && { gte: new Date(from) }),
          ...(to && { lte: new Date(to) }),
        }
      : undefined;

  const where: Record<string, unknown> = { userId };
  if (dateFilter) {
    where.date = dateFilter;
  }

  // Execute aggregate queries in parallel
  const [incomeResult, expenseResult, transactionCount] = await Promise.all([
    prisma.transaction.aggregate({
      where: { ...where, type: "INCOME" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...where, type: "EXPENSE" },
      _sum: { amount: true },
    }),
    prisma.transaction.count({ where }),
  ]);

  const totalIncome = Number(incomeResult._sum.amount ?? 0);
  const totalExpense = Number(expenseResult._sum.amount ?? 0);
  const balance = totalIncome - totalExpense;

  return {
    totalIncome,
    totalExpense,
    balance,
    transactionCount,
  };
}

/**
 * วิเคราะห์รายรับ/รายจ่ายตามหมวดหมู่
 * คำนวณ: ยอดรวมต่อ Category, เปอร์เซ็นต์สัดส่วน, เปอร์เซ็นต์เปลี่ยนแปลงเทียบเดือนก่อน
 */
export async function getByCategory(
  userId: string,
  params: GetByCategoryParams = {}
): Promise<CategoryAnalytics[]> {
  const { from, to, type } = params;

  // Build date filter for current period
  const dateFilter: Record<string, Date> | undefined =
    from || to
      ? {
          ...(from && { gte: new Date(from) }),
          ...(to && { lte: new Date(to) }),
        }
      : undefined;

  const where: Record<string, unknown> = { userId };
  if (dateFilter) {
    where.date = dateFilter;
  }
  if (type) {
    where.type = type;
  }

  // Group transactions by categoryId for the current period
  const grouped = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where,
    _sum: { amount: true },
  });

  // Calculate grand total for percentage
  const grandTotal = grouped.reduce(
    (sum, g) => sum + Number(g._sum.amount ?? 0),
    0
  );

  // Get category details
  const categoryIds = grouped
    .map((g) => g.categoryId)
    .filter((id): id is string => id !== null);

  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
  });

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // Calculate previous period for change comparison
  // Determine the previous period based on from/to range
  let previousPeriodWhere: Record<string, unknown> | null = null;

  if (from && to) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const durationMs = toDate.getTime() - fromDate.getTime();
    const prevTo = new Date(fromDate.getTime() - 1); // day before current from
    const prevFrom = new Date(prevTo.getTime() - durationMs);

    previousPeriodWhere = {
      userId,
      date: { gte: prevFrom, lte: prevTo },
      ...(type && { type }),
    };
  } else if (from) {
    // If only from is specified, compare with same duration before
    const fromDate = new Date(from);
    const now = new Date();
    const durationMs = now.getTime() - fromDate.getTime();
    const prevTo = new Date(fromDate.getTime() - 1);
    const prevFrom = new Date(prevTo.getTime() - durationMs);

    previousPeriodWhere = {
      userId,
      date: { gte: prevFrom, lte: prevTo },
      ...(type && { type }),
    };
  } else {
    // Default: compare current month vs previous month
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(currentMonthStart.getTime() - 1);

    previousPeriodWhere = {
      userId,
      date: { gte: prevMonthStart, lte: prevMonthEnd },
      ...(type && { type }),
    };
  }

  // Get previous period data
  const previousGrouped = previousPeriodWhere
    ? await prisma.transaction.groupBy({
        by: ["categoryId"],
        where: previousPeriodWhere,
        _sum: { amount: true },
      })
    : [];

  const previousMap = new Map(
    previousGrouped.map((g) => [g.categoryId, Number(g._sum.amount ?? 0)])
  );

  // Build result
  const result: CategoryAnalytics[] = grouped.map((g) => {
    const categoryId = g.categoryId ?? "uncategorized";
    const category = g.categoryId ? categoryMap.get(g.categoryId) : null;
    const total = Number(g._sum.amount ?? 0);
    const percentage = grandTotal > 0 ? (total / grandTotal) * 100 : 0;

    const previousTotal = previousMap.get(g.categoryId) ?? 0;
    const changeFromLastMonth =
      previousTotal > 0
        ? ((total - previousTotal) / previousTotal) * 100
        : total > 0
          ? 100
          : 0;

    return {
      categoryId,
      name: category?.name ?? "ไม่ระบุ",
      icon: category?.icon ?? "📁",
      total,
      percentage: Math.round(percentage * 100) / 100,
      changeFromLastMonth: Math.round(changeFromLastMonth * 100) / 100,
    };
  });

  // Sort by total descending
  result.sort((a, b) => b.total - a.total);

  return result;
}

/**
 * วิเคราะห์แนวโน้มรายรับ/รายจ่ายตามช่วงเวลา (monthly หรือ weekly)
 * คำนวณ: รายรับ/รายจ่าย/ยอดคงเหลือต่อช่วงเวลา, ค่าเฉลี่ย, ช่วงที่สูงสุด/ต่ำสุด
 */
export async function getTrends(
  userId: string,
  params: GetTrendsParams = {}
): Promise<TrendAnalytics> {
  const { period = "monthly", months = 12 } = params;

  const now = new Date();
  let startDate: Date;

  if (period === "monthly") {
    // Go back `months` months from the start of the current month
    startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
  } else {
    // Weekly: go back `months * 4` weeks (approximate)
    const weeksBack = months * 4;
    startDate = new Date(now.getTime() - weeksBack * 7 * 24 * 60 * 60 * 1000);
    // Align to start of week (Monday)
    const day = startDate.getDay();
    const diff = day === 0 ? 6 : day - 1; // Monday = 0 offset
    startDate.setDate(startDate.getDate() - diff);
    startDate.setHours(0, 0, 0, 0);
  }

  // Fetch all transactions in the date range
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: startDate },
    },
    select: {
      amount: true,
      type: true,
      date: true,
    },
    orderBy: { date: "asc" },
  });

  // Group transactions by period
  const periodMap = new Map<
    string,
    { income: number; expense: number }
  >();

  // Generate all period keys to ensure we have entries even for empty periods
  if (period === "monthly") {
    for (let i = 0; i < months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - months + 1 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      periodMap.set(key, { income: 0, expense: 0 });
    }
  } else {
    // Generate weekly keys
    const current = new Date(startDate);
    while (current <= now) {
      const key = getWeekKey(current);
      periodMap.set(key, { income: 0, expense: 0 });
      current.setDate(current.getDate() + 7);
    }
  }

  // Aggregate transactions into periods
  for (const tx of transactions) {
    const txDate = new Date(tx.date);
    const key =
      period === "monthly"
        ? `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, "0")}`
        : getWeekKey(txDate);

    const entry = periodMap.get(key);
    if (entry) {
      const amount = Number(tx.amount);
      if (tx.type === "INCOME") {
        entry.income += amount;
      } else {
        entry.expense += amount;
      }
    }
  }

  // Build data array
  const data: TrendDataPoint[] = [];
  periodMap.forEach((values, periodKey) => {
    data.push({
      period: periodKey,
      income: Math.round(values.income * 100) / 100,
      expense: Math.round(values.expense * 100) / 100,
      balance: Math.round((values.income - values.expense) * 100) / 100,
    });
  });

  // Calculate averages
  const totalPeriods = data.length || 1;
  const totalIncome = data.reduce((sum, d) => sum + d.income, 0);
  const totalExpense = data.reduce((sum, d) => sum + d.expense, 0);

  const averages = {
    income: Math.round((totalIncome / totalPeriods) * 100) / 100,
    expense: Math.round((totalExpense / totalPeriods) * 100) / 100,
  };

  // Find highest and lowest expense periods
  let highest = { period: "", amount: -Infinity };
  let lowest = { period: "", amount: Infinity };

  for (const d of data) {
    if (d.expense > highest.amount) {
      highest = { period: d.period, amount: d.expense };
    }
    if (d.expense < lowest.amount) {
      lowest = { period: d.period, amount: d.expense };
    }
  }

  // Handle edge case: no data
  if (data.length === 0) {
    highest = { period: "", amount: 0 };
    lowest = { period: "", amount: 0 };
  }

  return {
    data,
    averages,
    highest,
    lowest,
  };
}

/**
 * Helper: Get ISO week key for a date (format: "YYYY-Www")
 */
function getWeekKey(date: Date): string {
  const d = new Date(date);
  // Adjust to Monday-based week
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);

  const year = d.getFullYear();
  // Calculate week number
  const startOfYear = new Date(year, 0, 1);
  const dayOfYear = Math.floor(
    (d.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)
  );
  const weekNumber = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);

  return `${year}-W${String(weekNumber).padStart(2, "0")}`;
}

// ===== Compare Analytics =====

export interface GetCompareParams {
  month1: string; // format: "YYYY-MM"
  month2: string; // format: "YYYY-MM"
}

/**
 * เปรียบเทียบข้อมูลรายรับรายจ่ายระหว่าง 2 เดือน
 * คำนวณ: ข้อมูลแต่ละเดือน, เปอร์เซ็นต์เปลี่ยนแปลง (รายรับ, รายจ่าย, แยกตาม Category)
 */
export async function getCompare(
  userId: string,
  params: GetCompareParams
): Promise<CompareAnalytics> {
  const { month1, month2 } = params;

  // Parse month strings to date ranges
  const month1Start = new Date(`${month1}-01T00:00:00.000Z`);
  const month1End = new Date(
    month1Start.getFullYear(),
    month1Start.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );

  const month2Start = new Date(`${month2}-01T00:00:00.000Z`);
  const month2End = new Date(
    month2Start.getFullYear(),
    month2Start.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );

  // Fetch aggregated income/expense for both months in parallel
  const [
    month1Income,
    month1Expense,
    month2Income,
    month2Expense,
    month1ByCategory,
    month2ByCategory,
  ] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: "INCOME", date: { gte: month1Start, lte: month1End } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "EXPENSE", date: { gte: month1Start, lte: month1End } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "INCOME", date: { gte: month2Start, lte: month2End } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "EXPENSE", date: { gte: month2Start, lte: month2End } },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, date: { gte: month1Start, lte: month1End } },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, date: { gte: month2Start, lte: month2End } },
      _sum: { amount: true },
    }),
  ]);

  const m1Income = Number(month1Income._sum.amount ?? 0);
  const m1Expense = Number(month1Expense._sum.amount ?? 0);
  const m2Income = Number(month2Income._sum.amount ?? 0);
  const m2Expense = Number(month2Expense._sum.amount ?? 0);

  // Calculate percentage changes
  const incomeChange =
    m1Income > 0
      ? Math.round(((m2Income - m1Income) / m1Income) * 100 * 100) / 100
      : m2Income > 0
        ? 100
        : 0;

  const expenseChange =
    m1Expense > 0
      ? Math.round(((m2Expense - m1Expense) / m1Expense) * 100 * 100) / 100
      : m2Expense > 0
        ? 100
        : 0;

  // Build category comparison maps
  const month1CatMap = new Map<string | null, number>(
    month1ByCategory.map((g) => [g.categoryId, Number(g._sum.amount ?? 0)])
  );
  const month2CatMap = new Map<string | null, number>(
    month2ByCategory.map((g) => [g.categoryId, Number(g._sum.amount ?? 0)])
  );

  // Collect all unique category IDs from both months
  const allCategoryIdsSet = new Set<string | null>();
  month1ByCategory.forEach((g) => allCategoryIdsSet.add(g.categoryId));
  month2ByCategory.forEach((g) => allCategoryIdsSet.add(g.categoryId));
  const allCategoryIds = Array.from(allCategoryIdsSet);

  // Fetch category details
  const categoryIds = allCategoryIds.filter((id): id is string => id !== null);
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
  });
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // Build byCategory comparison
  const byCategory: CompareAnalytics["changes"]["byCategory"] = [];

  for (const catId of allCategoryIds) {
    const m1Amount = month1CatMap.get(catId) ?? 0;
    const m2Amount = month2CatMap.get(catId) ?? 0;

    const changePercent =
      m1Amount > 0
        ? Math.round(((m2Amount - m1Amount) / m1Amount) * 100 * 100) / 100
        : m2Amount > 0
          ? 100
          : 0;

    const category = catId ? categoryMap.get(catId) : null;

    byCategory.push({
      categoryId: catId ?? "uncategorized",
      name: category?.name ?? "ไม่ระบุ",
      month1Amount: Math.round(m1Amount * 100) / 100,
      month2Amount: Math.round(m2Amount * 100) / 100,
      changePercent,
    });
  }

  // Sort by absolute change descending
  byCategory.sort(
    (a, b) => Math.abs(b.month2Amount - b.month1Amount) - Math.abs(a.month2Amount - a.month1Amount)
  );

  return {
    month1: {
      period: month1,
      income: m1Income,
      expense: m1Expense,
    },
    month2: {
      period: month2,
      income: m2Income,
      expense: m2Expense,
    },
    changes: {
      income: incomeChange,
      expense: expenseChange,
      byCategory,
    },
  };
}
