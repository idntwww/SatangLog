import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    category: {
      createMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/email", () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed_password_123"),
  },
}));

import { POST } from "@/app/api/auth/register/route";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";

const mockedPrisma = vi.mocked(prisma);
const mockedSendEmail = vi.mocked(sendVerificationEmail);

function createRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 for invalid input (missing fields)", async () => {
    const req = createRequest({ email: "bad-email" });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("ข้อมูลไม่ถูกต้อง");
    expect(json.details).toBeDefined();
  });

  it("should return 400 for weak password (no uppercase)", async () => {
    const req = createRequest({
      email: "test@example.com",
      password: "password1",
      name: "Test User",
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.details?.password).toBeDefined();
  });

  it("should return 400 for weak password (no number)", async () => {
    const req = createRequest({
      email: "test@example.com",
      password: "Password",
      name: "Test User",
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.details?.password).toBeDefined();
  });

  it("should return 400 for short password", async () => {
    const req = createRequest({
      email: "test@example.com",
      password: "Ab1",
      name: "Test User",
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.details?.password).toBeDefined();
  });

  it("should return 409 for duplicate email", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: "existing-user",
      email: "test@example.com",
    } as never);

    const req = createRequest({
      email: "test@example.com",
      password: "Password1",
      name: "Test User",
    });
    const res = await POST(req);

    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toBe("อีเมลนี้ถูกใช้งานแล้ว");
  });

  it("should return 201 and create user with default categories on success", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);
    mockedPrisma.user.create.mockResolvedValue({
      id: "new-user-id",
      email: "test@example.com",
      name: "Test User",
      role: "USER",
      emailVerified: false,
      createdAt: new Date("2024-01-01"),
    } as never);
    mockedPrisma.category.createMany.mockResolvedValue({ count: 6 });

    const req = createRequest({
      email: "test@example.com",
      password: "Password1",
      name: "Test User",
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.id).toBe("new-user-id");
    expect(json.data.email).toBe("test@example.com");
    expect(json.data.name).toBe("Test User");
    expect(json.message).toContain("ลงทะเบียนสำเร็จ");

    // Verify user was created with hashed password
    expect(mockedPrisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: "test@example.com",
        name: "Test User",
        passwordHash: "hashed_password_123",
        verifyToken: expect.any(String),
      }),
    });

    // Verify default categories were created
    expect(mockedPrisma.category.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ name: "อาหาร", icon: "🍔", isDefault: true }),
        expect.objectContaining({ name: "ค่าเดินทาง", icon: "🚗", isDefault: true }),
        expect.objectContaining({ name: "ที่พัก", icon: "🏠", isDefault: true }),
        expect.objectContaining({ name: "เงินเดือน", icon: "💰", isDefault: true }),
        expect.objectContaining({ name: "รายได้เสริม", icon: "💵", isDefault: true }),
        expect.objectContaining({ name: "อื่นๆ", icon: "📁", isDefault: true }),
      ]),
    });

    // Verify verification email was sent
    expect(mockedSendEmail).toHaveBeenCalledWith(
      "test@example.com",
      "Test User",
      expect.any(String)
    );
  });

  it("should still succeed if email sending fails", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);
    mockedPrisma.user.create.mockResolvedValue({
      id: "new-user-id",
      email: "test@example.com",
      name: "Test User",
      role: "USER",
      emailVerified: false,
      createdAt: new Date("2024-01-01"),
    } as never);
    mockedPrisma.category.createMany.mockResolvedValue({ count: 6 });
    mockedSendEmail.mockRejectedValue(new Error("Email service down"));

    const req = createRequest({
      email: "test@example.com",
      password: "Password1",
      name: "Test User",
    });
    const res = await POST(req);

    // Registration should still succeed even if email fails
    expect(res.status).toBe(201);
  });

  it("should not include passwordHash in response", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);
    mockedPrisma.user.create.mockResolvedValue({
      id: "new-user-id",
      email: "test@example.com",
      name: "Test User",
      passwordHash: "hashed_password_123",
      role: "USER",
      emailVerified: false,
      createdAt: new Date("2024-01-01"),
    } as never);
    mockedPrisma.category.createMany.mockResolvedValue({ count: 6 });

    const req = createRequest({
      email: "test@example.com",
      password: "Password1",
      name: "Test User",
    });
    const res = await POST(req);

    const json = await res.json();
    expect(json.data.passwordHash).toBeUndefined();
  });
});
