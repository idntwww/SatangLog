import { describe, it, expect } from "vitest";
import { parseCSV, parseCSVRows } from "@/lib/csv/parser";
import { printCSV, escapeField } from "@/lib/csv/printer";
import type { Transaction } from "@/types";

describe("CSV Parser", () => {
  it("parses a valid CSV with header and data rows", () => {
    const csv = [
      "date,type,amount,category,note,currency",
      "2024-01-15T10:00:00.000Z,INCOME,5000,salary,Monthly salary,THB",
      "2024-01-16T12:00:00.000Z,EXPENSE,200,food,Lunch,THB",
    ].join("\n");

    const result = parseCSV(csv);

    expect(result.errors).toHaveLength(0);
    expect(result.transactions).toHaveLength(2);
    expect(result.transactions[0]).toEqual({
      amount: 5000,
      type: "INCOME",
      date: "2024-01-15T10:00:00.000Z",
      categoryId: "salary",
      note: "Monthly salary",
      currency: "THB",
    });
    expect(result.transactions[1]).toEqual({
      amount: 200,
      type: "EXPENSE",
      date: "2024-01-16T12:00:00.000Z",
      categoryId: "food",
      note: "Lunch",
      currency: "THB",
    });
  });

  it("returns error for empty CSV", () => {
    const result = parseCSV("");
    expect(result.transactions).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].row).toBe(1);
    expect(result.errors[0].message).toContain("empty");
  });

  it("returns error for missing required columns", () => {
    const csv = "date,type,amount\n2024-01-15T10:00:00.000Z,INCOME,5000";
    const result = parseCSV(csv);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].row).toBe(1);
    expect(result.errors[0].message).toContain("Missing required column");
  });

  it("returns error for invalid type", () => {
    const csv = [
      "date,type,amount,category,note,currency",
      "2024-01-15T10:00:00.000Z,TRANSFER,5000,salary,note,THB",
    ].join("\n");

    const result = parseCSV(csv);
    expect(result.transactions).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("Invalid type");
  });

  it("returns error for non-positive amount", () => {
    const csv = [
      "date,type,amount,category,note,currency",
      "2024-01-15T10:00:00.000Z,INCOME,-100,salary,note,THB",
    ].join("\n");

    const result = parseCSV(csv);
    expect(result.transactions).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("positive");
  });

  it("returns error for invalid date", () => {
    const csv = [
      "date,type,amount,category,note,currency",
      "not-a-date,INCOME,100,salary,note,THB",
    ].join("\n");

    const result = parseCSV(csv);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("Invalid date");
  });

  it("handles quoted fields with commas", () => {
    const csv = [
      "date,type,amount,category,note,currency",
      '2024-01-15T10:00:00.000Z,EXPENSE,300,food,"Lunch, dinner",THB',
    ].join("\n");

    const result = parseCSV(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.transactions[0].note).toBe("Lunch, dinner");
  });

  it("handles quoted fields with escaped double quotes", () => {
    const csv = [
      "date,type,amount,category,note,currency",
      '2024-01-15T10:00:00.000Z,EXPENSE,300,food,"He said ""hello""",THB',
    ].join("\n");

    const result = parseCSV(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.transactions[0].note).toBe('He said "hello"');
  });

  it("handles quoted fields with newlines", () => {
    const csv =
      'date,type,amount,category,note,currency\n2024-01-15T10:00:00.000Z,EXPENSE,300,food,"Line1\nLine2",THB';

    const result = parseCSV(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.transactions[0].note).toBe("Line1\nLine2");
  });

  it("defaults currency to THB when empty", () => {
    const csv = [
      "date,type,amount,category,note,currency",
      "2024-01-15T10:00:00.000Z,INCOME,1000,salary,note,",
    ].join("\n");

    const result = parseCSV(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.transactions[0].currency).toBe("THB");
  });

  it("omits categoryId when category is empty", () => {
    const csv = [
      "date,type,amount,category,note,currency",
      "2024-01-15T10:00:00.000Z,INCOME,1000,,note,THB",
    ].join("\n");

    const result = parseCSV(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.transactions[0].categoryId).toBeUndefined();
  });

  it("omits note when note is empty", () => {
    const csv = [
      "date,type,amount,category,note,currency",
      "2024-01-15T10:00:00.000Z,INCOME,1000,salary,,THB",
    ].join("\n");

    const result = parseCSV(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.transactions[0].note).toBeUndefined();
  });

  it("skips empty rows", () => {
    const csv = [
      "date,type,amount,category,note,currency",
      "2024-01-15T10:00:00.000Z,INCOME,1000,salary,note,THB",
      "",
      "2024-01-16T10:00:00.000Z,EXPENSE,200,food,lunch,THB",
    ].join("\n");

    const result = parseCSV(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.transactions).toHaveLength(2);
  });
});

describe("parseCSVRows", () => {
  it("parses simple rows", () => {
    const rows = parseCSVRows("a,b,c\n1,2,3");
    expect(rows).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("handles CRLF line endings", () => {
    const rows = parseCSVRows("a,b\r\n1,2");
    expect(rows).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("handles quoted fields with embedded newlines", () => {
    const rows = parseCSVRows('a,"b\nc"\n1,2');
    expect(rows).toEqual([
      ["a", "b\nc"],
      ["1", "2"],
    ]);
  });
});

describe("CSV Printer", () => {
  const baseTx: Transaction = {
    id: "tx1",
    amount: 5000,
    type: "INCOME",
    note: "Monthly salary",
    date: "2024-01-15T10:00:00.000Z",
    currency: "THB",
    userId: "user1",
    categoryId: "cat1",
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z",
    category: { id: "cat1", name: "salary", icon: "💰", isDefault: false, userId: "user1", createdAt: "2024-01-01T00:00:00.000Z" },
  };

  it("generates CSV with header and data rows", () => {
    const csv = printCSV([baseTx]);
    const lines = csv.split("\n");

    expect(lines[0]).toBe("date,type,amount,category,note,currency");
    expect(lines[1]).toBe(
      "2024-01-15T10:00:00.000Z,INCOME,5000,salary,Monthly salary,THB"
    );
  });

  it("handles empty category (no category relation)", () => {
    const tx: Transaction = { ...baseTx, category: null, categoryId: null };
    const csv = printCSV([tx]);
    const lines = csv.split("\n");

    expect(lines[1]).toBe(
      "2024-01-15T10:00:00.000Z,INCOME,5000,,Monthly salary,THB"
    );
  });

  it("handles null note", () => {
    const tx: Transaction = { ...baseTx, note: null };
    const csv = printCSV([tx]);
    const lines = csv.split("\n");

    expect(lines[1]).toBe(
      "2024-01-15T10:00:00.000Z,INCOME,5000,salary,,THB"
    );
  });

  it("quotes fields containing commas", () => {
    const tx: Transaction = { ...baseTx, note: "Lunch, dinner" };
    const csv = printCSV([tx]);
    expect(csv).toContain('"Lunch, dinner"');
  });

  it("escapes double quotes by doubling them", () => {
    const tx: Transaction = { ...baseTx, note: 'He said "hello"' };
    const csv = printCSV([tx]);
    expect(csv).toContain('"He said ""hello"""');
  });

  it("quotes fields containing newlines", () => {
    const tx: Transaction = { ...baseTx, note: "Line1\nLine2" };
    const csv = printCSV([tx]);
    expect(csv).toContain('"Line1\nLine2"');
  });

  it("generates empty CSV (header only) for empty array", () => {
    const csv = printCSV([]);
    expect(csv).toBe("date,type,amount,category,note,currency");
  });
});

describe("escapeField", () => {
  it("returns plain value when no special characters", () => {
    expect(escapeField("hello")).toBe("hello");
  });

  it("quotes value with comma", () => {
    expect(escapeField("a,b")).toBe('"a,b"');
  });

  it("quotes and escapes double quotes", () => {
    expect(escapeField('say "hi"')).toBe('"say ""hi"""');
  });

  it("quotes value with newline", () => {
    expect(escapeField("a\nb")).toBe('"a\nb"');
  });

  it("quotes value with carriage return", () => {
    expect(escapeField("a\rb")).toBe('"a\rb"');
  });
});
