import type { Transaction } from "@/types";

const CSV_HEADER = "date,type,amount,category,note,currency";

/**
 * Generate RFC 4180 compliant CSV from Transaction[].
 * Pure function — no side effects, no database access.
 */
export function printCSV(transactions: Transaction[]): string {
  const rows: string[] = [CSV_HEADER];

  for (const tx of transactions) {
    const fields = [
      escapeField(tx.date),
      escapeField(tx.type),
      escapeField(String(tx.amount)),
      escapeField(tx.category?.name ?? ""),
      escapeField(tx.note ?? ""),
      escapeField(tx.currency),
    ];
    rows.push(fields.join(","));
  }

  return rows.join("\n");
}

/**
 * Escape a CSV field according to RFC 4180:
 * - If the field contains commas, double quotes, or newlines, wrap it in double quotes
 * - Double quotes within the field are escaped by doubling them ("")
 */
export function escapeField(value: string): string {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}
