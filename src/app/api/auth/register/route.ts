import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators/auth";
import { sendVerificationEmail } from "@/lib/email";

const DEFAULT_CATEGORIES = [
  { name: "อาหาร", icon: "🍔" },
  { name: "ค่าเดินทาง", icon: "🚗" },
  { name: "ที่พัก", icon: "🏠" },
  { name: "เงินเดือน", icon: "💰" },
  { name: "รายได้เสริม", icon: "💵" },
  { name: "อื่นๆ", icon: "📁" },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input with Zod
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          error: "ข้อมูลไม่ถูกต้อง",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password, name } = result.data;

    // Check for duplicate email
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "อีเมลนี้ถูกใช้งานแล้ว" },
        { status: 409 }
      );
    }

    // Hash password with bcrypt (salt rounds 12)
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate verify token
    const verifyToken = crypto.randomUUID();

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        verifyToken,
      },
    });

    // Create default categories for the new user
    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map((cat) => ({
        name: cat.name,
        icon: cat.icon,
        isDefault: true,
        userId: user.id,
      })),
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, name, verifyToken);
    } catch (emailError) {
      // Log error but don't fail registration if email fails
      console.error("Failed to send verification email:", emailError);
    }

    // Return 201 with user data (excluding passwordHash)
    return NextResponse.json(
      {
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
        },
        message: "ลงทะเบียนสำเร็จ กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
