import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTrends } from "@/lib/services/analytics.service";

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
    const periodParam = searchParams.get("period") ?? undefined;
    const monthsParam = searchParams.get("months") ?? undefined;

    // Validate period parameter
    let period: "monthly" | "weekly" | undefined;
    if (periodParam) {
      if (periodParam !== "monthly" && periodParam !== "weekly") {
        return NextResponse.json(
          { error: "period ต้องเป็น monthly หรือ weekly" },
          { status: 400 }
        );
      }
      period = periodParam as "monthly" | "weekly";
    }

    // Validate months parameter
    let months: number | undefined;
    if (monthsParam) {
      months = parseInt(monthsParam, 10);
      if (isNaN(months) || months < 1 || months > 60) {
        return NextResponse.json(
          { error: "months ต้องเป็นตัวเลขระหว่าง 1-60" },
          { status: 400 }
        );
      }
    }

    const trends = await getTrends(session.user.id, { period, months });

    return NextResponse.json({ data: trends });
  } catch (error) {
    console.error("Get trends analytics error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
