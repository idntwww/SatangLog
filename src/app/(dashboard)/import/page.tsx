"use client";

import * as React from "react";
import { Upload, Download, AlertCircle, CheckCircle2 } from "lucide-react";

import { FileUpload } from "@/components/shared/FileUpload";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { parseCSV } from "@/lib/csv/parser";
import type { ImportResult, TransactionCreateInput } from "@/types";

export default function ImportPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [previewData, setPreviewData] = React.useState<
    TransactionCreateInput[] | null
  >(null);
  const [parseErrors, setParseErrors] = React.useState<
    Array<{ row: number; message: string }>
  >([]);
  const [importResult, setImportResult] = React.useState<ImportResult | null>(
    null
  );
  const [isImporting, setIsImporting] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setImportResult(null);

    try {
      const content = await selectedFile.text();
      const result = parseCSV(content);
      setPreviewData(result.transactions);
      setParseErrors(result.errors);
    } catch {
      setPreviewData(null);
      setParseErrors([{ row: 0, message: "ไม่สามารถอ่านไฟล์ได้" }]);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const json = await response.json();

      if (!response.ok) {
        setImportResult({
          imported: 0,
          errors: [{ row: 0, message: json.error || "เกิดข้อผิดพลาด" }],
        });
      } else {
        setImportResult(json.data as ImportResult);
      }
    } catch {
      setImportResult({
        imported: 0,
        errors: [{ row: 0, message: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้" }],
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/export");

      if (!response.ok) {
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `satanglog-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">นำเข้า / ส่งออกข้อมูล</h1>
        <p className="text-muted-foreground">
          นำเข้าข้อมูลจากไฟล์ CSV หรือส่งออกข้อมูลทั้งหมดของคุณ
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              นำเข้าข้อมูล (Import)
            </CardTitle>
            <CardDescription>
              อัปโหลดไฟล์ CSV เพื่อนำเข้ารายการธุรกรรม
              ไฟล์ต้องมีคอลัมน์: date, type, amount, category, note, currency
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUpload
              onFileSelect={handleFileSelect}
              accept=".csv"
              label="เลือกไฟล์ CSV"
            />

            {previewData && previewData.length > 0 && (
              <Button
                onClick={handleImport}
                disabled={isImporting || previewData.length === 0}
                className="w-full"
              >
                {isImporting ? "กำลังนำเข้า..." : `นำเข้า ${previewData.length} รายการ`}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              ส่งออกข้อมูล (Export)
            </CardTitle>
            <CardDescription>
              ดาวน์โหลดข้อมูลธุรกรรมทั้งหมดของคุณเป็นไฟล์ CSV
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              variant="outline"
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "กำลังส่งออก..." : "ดาวน์โหลด CSV"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Import Result */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle>ผลลัพธ์การนำเข้า</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {importResult.imported > 0 && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>สำเร็จ</AlertTitle>
                <AlertDescription>
                  นำเข้าข้อมูลสำเร็จ {importResult.imported} รายการ
                </AlertDescription>
              </Alert>
            )}

            {importResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>พบข้อผิดพลาด ({importResult.errors.length} รายการ)</AlertTitle>
                <AlertDescription>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    {importResult.errors.map((err, idx) => (
                      <li key={idx} className="text-sm">
                        {err.row > 0 ? `แถวที่ ${err.row}: ` : ""}
                        {err.message}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview Section */}
      {previewData && previewData.length > 0 && !importResult && (
        <Card>
          <CardHeader>
            <CardTitle>ตัวอย่างข้อมูล (แสดง 5 แถวแรก)</CardTitle>
            <CardDescription>
              ตรวจสอบข้อมูลก่อนนำเข้า — ทั้งหมด {previewData.length} รายการ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>วันที่</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>จำนวนเงิน</TableHead>
                  <TableHead>หมวดหมู่</TableHead>
                  <TableHead>หมายเหตุ</TableHead>
                  <TableHead>สกุลเงิน</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.slice(0, 5).map((tx, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      {new Date(tx.date).toLocaleDateString("th-TH")}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          tx.type === "INCOME"
                            ? "text-green-600 font-medium"
                            : "text-red-600 font-medium"
                        }
                      >
                        {tx.type === "INCOME" ? "รายรับ" : "รายจ่าย"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {tx.amount.toLocaleString("th-TH")}
                    </TableCell>
                    <TableCell>
                      {tx.categoryId || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {tx.note || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{tx.currency || "THB"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Parse Errors */}
      {parseErrors.length > 0 && !importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">
              ข้อผิดพลาดในการอ่านไฟล์
            </CardTitle>
            <CardDescription>
              พบปัญหาในไฟล์ CSV — รายการเหล่านี้จะไม่ถูกนำเข้า
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>
                พบข้อผิดพลาด {parseErrors.length} รายการ
              </AlertTitle>
              <AlertDescription>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  {parseErrors.map((err, idx) => (
                    <li key={idx} className="text-sm">
                      {err.row > 0 ? `แถวที่ ${err.row}: ` : ""}
                      {err.message}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle>รูปแบบไฟล์ CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            ไฟล์ CSV ต้องมีคอลัมน์ตามลำดับดังนี้:
          </p>
          <div className="rounded-md bg-muted p-3 font-mono text-xs">
            date,type,amount,category,note,currency
            <br />
            2024-01-15,EXPENSE,350,อาหาร,อาหารกลางวัน,THB
            <br />
            2024-01-16,INCOME,45000,เงินเดือน,เงินเดือนประจำเดือน,THB
          </div>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside mt-2">
            <li>
              <strong>date</strong> — วันที่ (รูปแบบ YYYY-MM-DD)
            </li>
            <li>
              <strong>type</strong> — ประเภท (INCOME หรือ EXPENSE)
            </li>
            <li>
              <strong>amount</strong> — จำนวนเงิน (ตัวเลขมากกว่า 0)
            </li>
            <li>
              <strong>category</strong> — ชื่อหมวดหมู่
            </li>
            <li>
              <strong>note</strong> — หมายเหตุ (ไม่บังคับ)
            </li>
            <li>
              <strong>currency</strong> — สกุลเงิน 3 ตัวอักษร (เช่น THB)
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
