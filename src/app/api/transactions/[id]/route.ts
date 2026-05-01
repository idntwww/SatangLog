import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  TransactionNotFoundError,
} from "@/lib/services/transaction.service";
import { transactionUpdateSchema } from "@/lib/validators/transaction";
import { ZodError } from "zod";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const transaction = await getTransactionById(session.user.id, params.id);

    return NextResponse.json({ data: transaction });
  } catch (error) {
    if (error instanceof TransactionNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    console.error("Get transaction error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const result = transactionUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          error: "ข้อมูลไม่ถูกต้อง",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const transaction = await updateTransaction(
      session.user.id,
      params.id,
      result.data
    );

    return NextResponse.json({ data: transaction });
  } catch (error) {
    if (error instanceof TransactionNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "ข้อมูลไม่ถูกต้อง",
          details: error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    console.error("Update transaction error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    await deleteTransaction(session.user.id, params.id);

    return NextResponse.json({ message: "ลบรายการสำเร็จ" });
  } catch (error) {
    if (error instanceof TransactionNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    console.error("Delete transaction error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
