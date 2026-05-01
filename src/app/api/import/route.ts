import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { parseCSV } from "@/lib/csv/parser";
import { createTransaction } from "@/lib/services/transaction.service";
import type { ImportResult } from "@/types";
import type { TransactionCreateSchema } from "@/lib/validators/transaction";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "กรุณาอัปโหลดไฟล์ CSV" },
        { status: 400 }
      );
    }

    // Read file content as text
    const content = await file.text();

    if (!content.trim()) {
      return NextResponse.json(
        { error: "ไฟล์ CSV ว่างเปล่า" },
        { status: 400 }
      );
    }

    // Parse CSV content
    const parseResult = parseCSV(content);

    // If there are only errors and no valid transactions
    if (parseResult.transactions.length === 0 && parseResult.errors.length > 0) {
      const result: ImportResult = {
        imported: 0,
        errors: parseResult.errors,
      };
      return NextResponse.json({ data: result });
    }

    // Create transactions for each valid parsed row
    const importErrors: Array<{ row: number; message: string }> = [
      ...parseResult.errors,
    ];
    let importedCount = 0;

    for (let i = 0; i < parseResult.transactions.length; i++) {
      const txInput = parseResult.transactions[i]!;
      try {
        await createTransaction(session.user.id, txInput as TransactionCreateSchema);
        importedCount++;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "ไม่สามารถบันทึกรายการได้";
        importErrors.push({
          row: i + 2, // +2 because row 1 is header, and array is 0-indexed
          message,
        });
      }
    }

    const result: ImportResult = {
      imported: importedCount,
      errors: importErrors,
    };

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
