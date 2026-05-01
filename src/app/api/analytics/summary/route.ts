import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSummary } from "@/lib/services/analytics.service";

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

    const summary = await getSummary(session.user.id, { from, to });

    return NextResponse.json({ data: summary });
  } catch (error) {
    console.error("Get analytics summary error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
