import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getCategories,
  createCategory,
  CategoryConflictError,
} from "@/lib/services/category.service";
import { categoryCreateSchema } from "@/lib/validators/category";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const categories = await getCategories(session.user.id);

    return NextResponse.json({ data: categories });
  } catch (error) {
    console.error("Get categories error:", error);
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
    const result = categoryCreateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          error: "ข้อมูลไม่ถูกต้อง",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const category = await createCategory(session.user.id, result.data);

    return NextResponse.json({ data: category }, { status: 201 });
  } catch (error) {
    if (error instanceof CategoryConflictError) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    console.error("Create category error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
