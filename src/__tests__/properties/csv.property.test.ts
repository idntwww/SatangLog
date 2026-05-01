import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { parseCSV, parseCSVRows } from "@/lib/csv/parser";
import { printCSV, escapeField } from "@/lib/csv/printer";
import type { Transaction } from "@/types";

/**
 * Validates: Requirements 10.4
 *
 * Property 1: CSV Round-Trip Consistency
 * For any Transaction exported as CSV then imported back,
 * the resulting data must be equivalent to the original.
 * (printCSV → parseCSV → equivalent to original)
 */
describe("Property 1: CSV Round-Trip Consistency", () => {
  // Arbitrary for generating valid Transaction objects
  const arbTransaction = fc
    .record({
      amount: fc
        .double({ min: 0.01, max: 999999.99, noNaN: true, noDefaultInfinity: true })
        .map((n) => Math.round(n * 100) / 100)
        .filter((n) => n > 0),
      type: fc.constantFrom("INCOME" as const, "EXPENSE" as const),
      date: fc
        .date({ min: new Date(2020, 0, 1), max: new Date(2030, 0, 1) })
        .map((d) => d.toISOString()),
      note: fc
        .string({ minLength: 0, maxLength: 50 })
        .filter((s) => !s.includes("\0") && !s.includes("\r"))
        .map((s) => {
          // The parser trims notes, so we generate pre-trimmed notes
          // to test the round-trip property cleanly
          const trimmed = s.trim();
          return trimmed.length === 0 ? null : trimmed;
        }),
      currency: fc.constantFrom("THB", "USD", "EUR", "JPY"),
      categoryName: fc
        .string({ minLength: 1, maxLength: 20 })
        .filter(
          (s) =>
            !s.includes("\0") &&
            !s.includes("\r") &&
            s.trim().length > 0 &&
            s === s.trim() // no leading/trailing whitespace (parser trims fields)
        ),
    })
    .map(({ amount, type, date, note, currency, categoryName }) => {
      const tx: Transaction = {
        id: "test-id",
        amount,
        type,
        date,
        note,
        currency,
        userId: "user-1",
        categoryId: "cat-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        category: {
          id: "cat-1",
          name: categoryName,
          icon: "📁",
          isDefault: false,
          userId: "user-1",
          createdAt: new Date().toISOString(),
        },
      };
      return tx;
    });

  it("printCSV → parseCSV produces equivalent transaction data", () => {
    fc.assert(
      fc.property(arbTransaction, (tx) => {
        // Export to CSV
        const csvString = printCSV([tx]);

        // Import back from CSV
        const result = parseCSV(csvString);

        // Should parse without errors
        expect(result.errors).toHaveLength(0);
        expect(result.transactions).toHaveLength(1);

        const parsed = result.transactions[0]!;

        // Amount should match
        expect(parsed.amount).toBeCloseTo(tx.amount, 2);

        // Type should match
        expect(parsed.type).toBe(tx.type);

        // Date should match (both are ISO strings, parseCSV normalizes via new Date().toISOString())
        expect(new Date(parsed.date).getTime()).toBe(
          new Date(tx.date).getTime()
        );

        // Note should match
        if (tx.note) {
          expect(parsed.note).toBe(tx.note);
        } else {
          expect(parsed.note).toBeUndefined();
        }

        // Category: printer uses category.name, parser stores it as categoryId
        expect(parsed.categoryId).toBe(tx.category!.name);

        // Currency should match
        expect(parsed.currency).toBe(tx.currency);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Validates: Requirements 10.3, 10.4
 *
 * Property 2: CSV Special Character Handling
 * For any note containing commas, quotes, or newlines,
 * the system must escape/unescape correctly through a round-trip.
 */
describe("Property 2: CSV Special Character Handling", () => {
  // Arbitrary for strings with special CSV characters
  const arbSpecialString = fc
    .stringOf(
      fc.constantFrom(",", '"', "\n", "a", "b", " ", "1", "ก", "!")
    )
    .filter((s) => s.length > 0);

  it("escapeField → parseCSVRows recovers the original string", () => {
    fc.assert(
      fc.property(arbSpecialString, (str) => {
        // Escape the field
        const escaped = escapeField(str);

        // Build a minimal CSV row: "header\nescapedValue"
        const csvContent = `col\n${escaped}`;

        // Parse it back
        const rows = parseCSVRows(csvContent);

        // Should have header row and data row
        expect(rows.length).toBe(2);
        expect(rows[1]![0]).toBe(str);
      }),
      { numRuns: 100 }
    );
  });

  it("printCSV with special character notes → parseCSV recovers the note", () => {
    // Generate strings with special chars that have non-whitespace content
    // (parser trims notes, so whitespace-only strings would become undefined)
    const arbSpecialNote = fc
      .stringOf(
        fc.constantFrom(",", '"', "\n", "a", "b", " ", "1", "ก", "!")
      )
      .filter((s) => s.trim().length > 0);

    fc.assert(
      fc.property(arbSpecialNote, (specialNote) => {
        const tx: Transaction = {
          id: "test-id",
          amount: 100,
          type: "EXPENSE",
          date: "2024-06-15T10:00:00.000Z",
          note: specialNote,
          currency: "THB",
          userId: "user-1",
          categoryId: "cat-1",
          createdAt: "2024-06-15T10:00:00.000Z",
          updatedAt: "2024-06-15T10:00:00.000Z",
          category: {
            id: "cat-1",
            name: "food",
            icon: "🍔",
            isDefault: false,
            userId: "user-1",
            createdAt: "2024-01-01T00:00:00.000Z",
          },
        };

        // Export to CSV
        const csvString = printCSV([tx]);

        // Import back
        const result = parseCSV(csvString);

        // Should parse without errors
        expect(result.errors).toHaveLength(0);
        expect(result.transactions).toHaveLength(1);

        // Note should be recovered (parser trims whitespace)
        expect(result.transactions[0]!.note).toBe(specialNote.trim());
      }),
      { numRuns: 100 }
    );
  });
});
