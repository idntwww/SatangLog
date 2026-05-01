import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { bulkDeleteTransactions } from "@/lib/services/transaction.service";
import { transactionBulkDeleteSchema } from "@/lib/validators/transaction";
import { ZodError } from "zod";

export async function DELETE(request: NextRequest) {
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
    const result = transactionBulkDeleteSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          error: "ข้อมูลไม่ถูกต้อง",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { deletedCount } = await bulkDeleteTransactions(
      session.user.id,
      result.data
    );

    return NextResponse.json({
      message: `ลบรายการสำเร็จ ${deletedCount} รายการ`,
      deletedCount,
    });
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

    console.error("Bulk delete transactions error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
