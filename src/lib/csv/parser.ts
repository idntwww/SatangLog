import type { CSVParseResult, TransactionCreateInput, TxType } from "@/types";

const EXPECTED_HEADERS = ["date", "type", "amount", "category", "note", "currency"];

/**
 * Parse RFC 4180 compliant CSV content into TransactionCreateInput[].
 * Pure function — no side effects, no database access.
 */
export function parseCSV(content: string): CSVParseResult {
  const transactions: TransactionCreateInput[] = [];
  const errors: Array<{ row: number; message: string }> = [];

  const rows = parseCSVRows(content);

  if (rows.length === 0) {
    errors.push({ row: 1, message: "CSV file is empty" });
    return { transactions, errors };
  }

  // Validate header row
  const headers = rows[0]!.map((h) => h.trim().toLowerCase());
  const headerErrors = validateHeaders(headers);
  if (headerErrors.length > 0) {
    errors.push({ row: 1, message: headerErrors.join("; ") });
    return { transactions, errors };
  }

  // Map header positions
  const colIndex = Object.fromEntries(
    EXPECTED_HEADERS.map((h) => [h, headers.indexOf(h)])
  ) as Record<string, number>;

  // Parse data rows (starting from row 2)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]!;
    const rowNum = i + 1; // 1-indexed for user display

    // Skip empty rows
    if (row.length === 1 && row[0]!.trim() === "") {
      continue;
    }

    if (row.length < EXPECTED_HEADERS.length) {
      errors.push({
        row: rowNum,
        message: `Expected ${EXPECTED_HEADERS.length} columns but got ${row.length}`,
      });
      continue;
    }

    const result = parseRow(row, colIndex, rowNum);
    if (result.error) {
      errors.push({ row: rowNum, message: result.error });
    } else if (result.transaction) {
      transactions.push(result.transaction);
    }
  }

  return { transactions, errors };
}

function validateHeaders(headers: string[]): string[] {
  const errors: string[] = [];
  for (const expected of EXPECTED_HEADERS) {
    if (!headers.includes(expected)) {
      errors.push(`Missing required column: "${expected}"`);
    }
  }
  return errors;
}

function parseRow(
  fields: string[],
  colIndex: Record<string, number>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _rowNum: number
): { transaction?: TransactionCreateInput; error?: string } {
  const dateStr = (fields[colIndex["date"]!] ?? "").trim();
  const typeStr = (fields[colIndex["type"]!] ?? "").trim().toUpperCase();
  const amountStr = (fields[colIndex["amount"]!] ?? "").trim();
  const category = (fields[colIndex["category"]!] ?? "").trim();
  const note = (fields[colIndex["note"]!] ?? "").trim();
  const currency = (fields[colIndex["currency"]!] ?? "").trim().toUpperCase();

  // Validate type
  if (typeStr !== "INCOME" && typeStr !== "EXPENSE") {
    return { error: `Invalid type "${typeStr}". Must be INCOME or EXPENSE` };
  }

  // Validate amount
  const amount = Number(amountStr);
  if (isNaN(amount) || !isFinite(amount)) {
    return { error: `Invalid amount "${amountStr}". Must be a number` };
  }
  if (amount <= 0) {
    return { error: `Amount must be positive, got ${amount}` };
  }

  // Validate date
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return { error: `Invalid date "${dateStr}"` };
  }

  // Validate currency (3-letter code)
  const currencyCode = currency || "THB";
  if (currencyCode.length !== 3) {
    return {
      error: `Invalid currency "${currencyCode}". Must be a 3-letter code`,
    };
  }

  const transaction: TransactionCreateInput = {
    amount,
    type: typeStr as TxType,
    date: date.toISOString(),
    currency: currencyCode,
  };

  if (category) {
    transaction.categoryId = category;
  }

  if (note) {
    transaction.note = note;
  }

  return { transaction };
}

/**
 * Parse CSV content into a 2D array of fields, handling RFC 4180 quoting rules:
 * - Fields containing commas, double quotes, or newlines must be enclosed in double quotes
 * - Double quotes within quoted fields are escaped by doubling them ("")
 */
export function parseCSVRows(content: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;
  let i = 0;

  while (i < content.length) {
    const char = content[i];

    if (inQuotes) {
      if (char === '"') {
        // Check if it's an escaped quote (doubled)
        if (i + 1 < content.length && content[i + 1] === '"') {
          currentField += '"';
          i += 2;
        } else {
          // End of quoted field
          inQuotes = false;
          i++;
        }
      } else {
        currentField += char;
        i++;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
      } else if (char === ",") {
        currentRow.push(currentField);
        currentField = "";
        i++;
      } else if (char === "\r") {
        // Handle \r\n or standalone \r
        currentRow.push(currentField);
        currentField = "";
        if (i + 1 < content.length && content[i + 1] === "\n") {
          i += 2;
        } else {
          i++;
        }
        rows.push(currentRow);
        currentRow = [];
      } else if (char === "\n") {
        currentRow.push(currentField);
        currentField = "";
        i++;
        rows.push(currentRow);
        currentRow = [];
      } else {
        currentField += char;
        i++;
      }
    }
  }

  // Don't forget the last field/row
  if (currentField !== "" || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}
