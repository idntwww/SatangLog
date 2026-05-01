import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTransactions } from "@/lib/services/transaction.service";
import { printCSV } from "@/lib/csv/printer";

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
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;

    // Fetch all transactions within the date range (no pagination limit)
    const result = await getTransactions(session.user.id, {
      from,
      to,
      limit: 10000, // Large limit to get all transactions
      sortBy: "date",
      sortOrder: "asc",
    });

    // Map Prisma results to the Transaction type expected by printCSV
    const transactions = result.data.map((tx) => {
      const record = tx as typeof tx & { category?: { id: string; name: string; icon: string; isDefault: boolean; userId: string; createdAt: Date } | null };
      return {
        id: record.id,
        amount: Number(record.amount),
        type: record.type as "INCOME" | "EXPENSE",
        note: record.note,
        date: record.date.toISOString(),
        currency: record.currency,
        userId: record.userId,
        categoryId: record.categoryId,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        category: record.category
          ? {
              id: record.category.id,
              name: record.category.name,
              icon: record.category.icon,
              isDefault: record.category.isDefault,
              userId: record.category.userId,
              createdAt: record.category.createdAt.toISOString(),
            }
          : null,
      };
    });

    // Generate CSV
    const csv = printCSV(transactions);

    // Return as file download
    const headers = new Headers();
    headers.set("Content-Type", "text/csv; charset=utf-8");
    headers.set(
      "Content-Disposition",
      `attachment; filename="satanglog-export-${new Date().toISOString().slice(0, 10)}.csv"`
    );

    return new NextResponse(csv, { status: 200, headers });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
