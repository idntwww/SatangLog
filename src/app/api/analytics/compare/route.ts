import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCompare } from "@/lib/services/analytics.service";

const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

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
    const month1 = searchParams.get("month1");
    const month2 = searchParams.get("month2");

    // Validate required parameters
    if (!month1 || !month2) {
      return NextResponse.json(
        { error: "กรุณาระบุ month1 และ month2 (รูปแบบ YYYY-MM)" },
        { status: 400 }
      );
    }

    // Validate format
    if (!MONTH_REGEX.test(month1)) {
      return NextResponse.json(
        { error: "month1 ต้องอยู่ในรูปแบบ YYYY-MM (เช่น 2024-01)" },
        { status: 400 }
      );
    }

    if (!MONTH_REGEX.test(month2)) {
      return NextResponse.json(
        { error: "month2 ต้องอยู่ในรูปแบบ YYYY-MM (เช่น 2024-02)" },
        { status: 400 }
      );
    }

    const compare = await getCompare(session.user.id, { month1, month2 });

    return NextResponse.json({ data: compare });
  } catch (error) {
    console.error("Get compare analytics error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
