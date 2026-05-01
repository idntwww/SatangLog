import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  updateCategory,
  deleteCategory,
  CategoryNotFoundError,
  CategoryConflictError,
} from "@/lib/services/category.service";
import { categoryUpdateSchema } from "@/lib/validators/category";

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
    const result = categoryUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          error: "ข้อมูลไม่ถูกต้อง",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const category = await updateCategory(
      session.user.id,
      params.id,
      result.data
    );

    return NextResponse.json({ data: category });
  } catch (error) {
    if (error instanceof CategoryNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (error instanceof CategoryConflictError) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    console.error("Update category error:", error);
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

    await deleteCategory(session.user.id, params.id);

    return NextResponse.json({
      message: "ลบหมวดหมู่สำเร็จ",
    });
  } catch (error) {
    if (error instanceof CategoryNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    console.error("Delete category error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
