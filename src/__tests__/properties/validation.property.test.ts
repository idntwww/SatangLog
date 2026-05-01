import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { transactionCreateSchema } from "@/lib/validators/transaction";
import { registerSchema } from "@/lib/validators/auth";

/**
 * Validates: Requirements 2.4, 3.4
 *
 * Property 3: Transaction Amount Positivity
 * For any amount <= 0, the system must always reject.
 * For any amount > 0, the system must always accept.
 */
describe("Property 3: Transaction Amount Positivity", () => {
  // Valid base data for transaction (all fields except amount)
  const validBaseTransaction = {
    type: "EXPENSE" as const,
    date: "2024-06-15T10:00:00.000Z",
    note: "test note",
    currency: "THB",
  };

  it("rejects any amount that is zero or negative", () => {
    fc.assert(
      fc.property(
        fc.double({ max: 0, noNaN: true, noDefaultInfinity: true }),
        (amount) => {
          const result = transactionCreateSchema.safeParse({
            ...validBaseTransaction,
            amount,
          });
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("accepts any amount that is positive", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 999_999_999, noNaN: true, noDefaultInfinity: true }).filter(
          (n) => n > 0
        ),
        (amount) => {
          const result = transactionCreateSchema.safeParse({
            ...validBaseTransaction,
            amount,
          });
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects non-finite numbers (NaN, -Infinity) as amounts", () => {
    const invalidAmounts = [NaN, -Infinity];
    for (const amount of invalidAmounts) {
      const result = transactionCreateSchema.safeParse({
        ...validBaseTransaction,
        amount,
      });
      expect(result.success).toBe(false);
    }
  });
});

/**
 * Validates: Requirements 1.1
 *
 * Property 4: Password Strength Validation
 * For any password shorter than 8 chars, or without uppercase, or without digits,
 * the system must always reject.
 * For valid passwords (8+ chars, has uppercase, has digit), the system must accept.
 */
describe("Property 4: Password Strength Validation", () => {
  // Valid base data for registration (all fields except password)
  const validBaseRegister = {
    email: "test@example.com",
    name: "Test User",
  };

  it("rejects passwords shorter than 8 characters", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 7 }),
        (password) => {
          const result = registerSchema.safeParse({
            ...validBaseRegister,
            password,
          });
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects passwords without uppercase letters", () => {
    // Generate strings of 8+ chars that contain digits but no uppercase
    const arbNoUppercase = fc
      .stringOf(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789!@#$%"), {
        minLength: 8,
        maxLength: 30,
      })
      .filter((s) => /[0-9]/.test(s) && !/[A-Z]/.test(s));

    fc.assert(
      fc.property(arbNoUppercase, (password) => {
        const result = registerSchema.safeParse({
          ...validBaseRegister,
          password,
        });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("rejects passwords without digits", () => {
    // Generate strings of 8+ chars that contain uppercase but no digits
    const arbNoDigits = fc
      .stringOf(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%"), {
        minLength: 8,
        maxLength: 30,
      })
      .filter((s) => /[A-Z]/.test(s) && !/[0-9]/.test(s));

    fc.assert(
      fc.property(arbNoDigits, (password) => {
        const result = registerSchema.safeParse({
          ...validBaseRegister,
          password,
        });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("accepts valid passwords (8+ chars, has uppercase, has digit)", () => {
    // Generate valid passwords: guaranteed to have uppercase, digit, and 8+ length
    const arbValidPassword = fc
      .tuple(
        fc.string({ minLength: 5, maxLength: 20 }), // base string
        fc.constantFrom(..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"), // guaranteed uppercase
        fc.constantFrom(..."0123456789"), // guaranteed digit
        fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz") // guaranteed lowercase for variety
      )
      .map(([base, upper, digit, lower]) => {
        // Combine to ensure all requirements are met
        const password = `${lower}${upper}${digit}${base}`;
        return password.slice(0, Math.max(8, password.length));
      })
      .filter((s) => s.length >= 8 && /[A-Z]/.test(s) && /[0-9]/.test(s));

    fc.assert(
      fc.property(arbValidPassword, (password) => {
        const result = registerSchema.safeParse({
          ...validBaseRegister,
          password,
        });
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
