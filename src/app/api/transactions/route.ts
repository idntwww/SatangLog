import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getTransactions,
  createTransaction,
} from "@/lib/services/transaction.service";
import { transactionCreateSchema } from "@/lib/validators/transaction";
import { ZodError } from "zod";

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

    const params = {
      page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
      type: searchParams.get("type") as "INCOME" | "EXPENSE" | undefined,
      categoryId: searchParams.get("category") ?? searchParams.get("categoryId") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      sortBy: searchParams.get("sortBy") ?? undefined,
      sortOrder: searchParams.get("sortOrder") as "asc" | "desc" | undefined,
    };

    // Validate type if provided
    if (params.type && !["INCOME", "EXPENSE"].includes(params.type)) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: { type: ["ประเภทต้องเป็น INCOME หรือ EXPENSE"] } },
        { status: 400 }
      );
    }

    const result = await getTransactions(session.user.id, params);

    return NextResponse.json({ data: result.data, meta: result.meta });
  } catch (error) {
    console.error("Get transactions error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate input with Zod
    const result = transactionCreateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          error: "ข้อมูลไม่ถูกต้อง",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const transaction = await createTransaction(session.user.id, result.data);

    return NextResponse.json({ data: transaction }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "ข้อมูลไม่ถูกต้อง",
          details: error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    console.error("Create transaction error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
