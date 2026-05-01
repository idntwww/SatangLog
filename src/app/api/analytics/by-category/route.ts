import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getByCategory } from "@/lib/services/analytics.service";
import type { TxType } from "@/types";

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
    const typeParam = searchParams.get("type") ?? undefined;

    // Validate type parameter
    let type: TxType | undefined;
    if (typeParam) {
      if (typeParam !== "INCOME" && typeParam !== "EXPENSE") {
        return NextResponse.json(
          { error: "ประเภทต้องเป็น INCOME หรือ EXPENSE" },
          { status: 400 }
        );
      }
      type = typeParam as TxType;
    }

    const categories = await getByCategory(session.user.id, { from, to, type });

    return NextResponse.json({ data: { categories } });
  } catch (error) {
    console.error("Get category analytics error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
