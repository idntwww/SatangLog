import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({
      status: "ok",
      database: "connected",
      userCount,
      dbUrl: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":***@") ?? "not set",
    });
  } catch (error) {
    return NextResponse.json({
      status: "error",
      database: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error",
      dbUrl: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":***@") ?? "not set",
    }, { status: 500 });
  }
}
