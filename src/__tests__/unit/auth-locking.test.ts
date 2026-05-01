import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted to declare variables that need to be available in mock factories
const { captured, mockFindUnique, mockUpdate, mockCompare } = vi.hoisted(() => {
  return {
    captured: { authorize: null as ((credentials: Record<string, unknown>) => Promise<unknown>) | null },
    mockFindUnique: vi.fn(),
    mockUpdate: vi.fn(),
    mockCompare: vi.fn(),
  };
});

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
  },
}));

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  default: {
    compare: mockCompare,
  },
}));

// Mock next-auth to capture the authorize function
vi.mock("next-auth", () => ({
  default: (config: { providers: Array<{ authorize: (credentials: Record<string, unknown>) => Promise<unknown> }> }) => {
    const credentialsProvider = config.providers[0];
    captured.authorize = credentialsProvider.authorize;
    return {
      handlers: {},
      auth: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    };
  },
}));

vi.mock("next-auth/providers/credentials", () => ({
  default: (config: { authorize: (credentials: Record<string, unknown>) => Promise<unknown> }) => config,
}));

// Force the auth module to load so captured.authorize gets set
import "@/lib/auth";

function createMockUser(overrides: Partial<{
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: string;
  failedAttempts: number;
  lockedUntil: Date | null;
}> = {}) {
  return {
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
    passwordHash: "hashed_password",
    role: "USER",
    failedAttempts: 0,
    lockedUntil: null,
    emailVerified: true,
    verifyToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function authorize(credentials: Record<string, unknown>) {
  if (!captured.authorize) {
    throw new Error("authorize function was not captured from NextAuth config");
  }
  return captured.authorize(credentials);
}

describe("Account Locking - ระบบล็อกบัญชีเมื่อกรอกรหัสผ่านผิดเกิน 5 ครั้ง", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Account gets locked after 5 failed attempts", () => {
    it("should increment failedAttempts on wrong password", async () => {
      const user = createMockUser({ failedAttempts: 0 });
      mockFindUnique.mockResolvedValue(user);
      mockCompare.mockResolvedValue(false);
      mockUpdate.mockResolvedValue(user);

      const result = await authorize({
        email: "test@example.com",
        password: "wrongpassword",
      });

      expect(result).toBeNull();
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { failedAttempts: 1 },
      });
    });

    it("should lock account when failedAttempts reaches 5", async () => {
      const user = createMockUser({ failedAttempts: 4 });
      mockFindUnique.mockResolvedValue(user);
      mockCompare.mockResolvedValue(false);
      mockUpdate.mockResolvedValue(user);

      await expect(
        authorize({
          email: "test@example.com",
          password: "wrongpassword",
        })
      ).rejects.toThrow("ACCOUNT_LOCKED");

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: {
          failedAttempts: 5,
          lockedUntil: expect.any(Date),
        },
      });

      // Verify lockedUntil is approximately 15 minutes from now
      const updateCall = mockUpdate.mock.calls[0][0];
      const lockedUntil = updateCall.data.lockedUntil as Date;
      const fifteenMinutesFromNow = Date.now() + 15 * 60 * 1000;
      expect(lockedUntil.getTime()).toBeCloseTo(fifteenMinutesFromNow, -3);
    });

    it("should lock account when failedAttempts exceeds 5", async () => {
      const user = createMockUser({ failedAttempts: 5 });
      mockFindUnique.mockResolvedValue(user);
      mockCompare.mockResolvedValue(false);
      mockUpdate.mockResolvedValue(user);

      await expect(
        authorize({
          email: "test@example.com",
          password: "wrongpassword",
        })
      ).rejects.toThrow("ACCOUNT_LOCKED");

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: {
          failedAttempts: 6,
          lockedUntil: expect.any(Date),
        },
      });
    });
  });

  describe("Locked account cannot login even with correct password", () => {
    it("should reject login when account is locked (lockedUntil in the future)", async () => {
      const futureDate = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
      const user = createMockUser({
        failedAttempts: 5,
        lockedUntil: futureDate,
      });
      mockFindUnique.mockResolvedValue(user);

      await expect(
        authorize({
          email: "test@example.com",
          password: "CorrectPassword1",
        })
      ).rejects.toThrow("ACCOUNT_LOCKED");

      // Should not even check the password
      expect(mockCompare).not.toHaveBeenCalled();
    });

    it("should allow login when lock has expired (lockedUntil in the past)", async () => {
      const pastDate = new Date(Date.now() - 1 * 60 * 1000); // 1 minute ago
      const user = createMockUser({
        failedAttempts: 5,
        lockedUntil: pastDate,
      });
      mockFindUnique.mockResolvedValue(user);
      mockCompare.mockResolvedValue(true);
      mockUpdate.mockResolvedValue(user);

      const result = await authorize({
        email: "test@example.com",
        password: "CorrectPassword1",
      });

      expect(result).toEqual({
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        role: "USER",
      });
    });
  });

  describe("Failed attempts reset after successful login", () => {
    it("should reset failedAttempts to 0 on successful login", async () => {
      const user = createMockUser({ failedAttempts: 3 });
      mockFindUnique.mockResolvedValue(user);
      mockCompare.mockResolvedValue(true);
      mockUpdate.mockResolvedValue(user);

      const result = await authorize({
        email: "test@example.com",
        password: "CorrectPassword1",
      });

      expect(result).toEqual({
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        role: "USER",
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { failedAttempts: 0, lockedUntil: null },
      });
    });

    it("should not call update if failedAttempts is already 0", async () => {
      const user = createMockUser({ failedAttempts: 0 });
      mockFindUnique.mockResolvedValue(user);
      mockCompare.mockResolvedValue(true);

      const result = await authorize({
        email: "test@example.com",
        password: "CorrectPassword1",
      });

      expect(result).toEqual({
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        role: "USER",
      });

      // Should not update since failedAttempts is already 0
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe("Lock expires after 15 minutes", () => {
    it("should set lockedUntil to 15 minutes from now when locking", async () => {
      const user = createMockUser({ failedAttempts: 4 });
      mockFindUnique.mockResolvedValue(user);
      mockCompare.mockResolvedValue(false);
      mockUpdate.mockResolvedValue(user);

      const beforeTime = Date.now();

      await expect(
        authorize({
          email: "test@example.com",
          password: "wrongpassword",
        })
      ).rejects.toThrow("ACCOUNT_LOCKED");

      const afterTime = Date.now();

      const updateCall = mockUpdate.mock.calls[0][0];
      const lockedUntil = updateCall.data.lockedUntil as Date;

      // lockedUntil should be approximately 15 minutes from now
      const expectedMin = beforeTime + 15 * 60 * 1000;
      const expectedMax = afterTime + 15 * 60 * 1000;
      expect(lockedUntil.getTime()).toBeGreaterThanOrEqual(expectedMin);
      expect(lockedUntil.getTime()).toBeLessThanOrEqual(expectedMax);
    });

    it("should allow login after lock period expires", async () => {
      // Lock expired 1 second ago
      const expiredLock = new Date(Date.now() - 1000);
      const user = createMockUser({
        failedAttempts: 5,
        lockedUntil: expiredLock,
      });
      mockFindUnique.mockResolvedValue(user);
      mockCompare.mockResolvedValue(true);
      mockUpdate.mockResolvedValue(user);

      const result = await authorize({
        email: "test@example.com",
        password: "CorrectPassword1",
      });

      expect(result).not.toBeNull();
      expect(result).toEqual({
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        role: "USER",
      });

      // Should reset failedAttempts
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { failedAttempts: 0, lockedUntil: null },
      });
    });

    it("should still block login during the 15-minute lock period", async () => {
      // Lock still active (10 minutes remaining)
      const activeLock = new Date(Date.now() + 10 * 60 * 1000);
      const user = createMockUser({
        failedAttempts: 5,
        lockedUntil: activeLock,
      });
      mockFindUnique.mockResolvedValue(user);

      await expect(
        authorize({
          email: "test@example.com",
          password: "CorrectPassword1",
        })
      ).rejects.toThrow("ACCOUNT_LOCKED");

      // Password should not be checked
      expect(mockCompare).not.toHaveBeenCalled();
    });
  });

  describe("Edge cases", () => {
    it("should return null for missing credentials", async () => {
      const result = await authorize({});
      expect(result).toBeNull();
    });

    it("should return null for non-existent user", async () => {
      mockFindUnique.mockResolvedValue(null);

      const result = await authorize({
        email: "nonexistent@example.com",
        password: "Password1",
      });

      expect(result).toBeNull();
    });
  });
});
