"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

type VerifyStatus = "loading" | "success" | "error" | "no-token";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<VerifyStatus>(
    token ? "loading" : "no-token"
  );
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (!token) return;

    async function verifyEmail() {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          setStatus("success");
        } else {
          const body = await response.json();
          setErrorMessage(body.error || "ลิงก์ยืนยันไม่ถูกต้องหรือหมดอายุ");
          setStatus("error");
        }
      } catch {
        setErrorMessage("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
        setStatus("error");
      }
    }

    verifyEmail();
  }, [token]);

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">ยืนยันอีเมล</CardTitle>
        <CardDescription>
          {status === "loading" && "กำลังยืนยันอีเมลของคุณ..."}
          {status === "success" && "อีเมลของคุณได้รับการยืนยันแล้ว"}
          {status === "error" && "ไม่สามารถยืนยันอีเมลได้"}
          {status === "no-token" && "ไม่พบ token สำหรับยืนยันอีเมล"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === "success" && (
          <Alert className="mb-4">
            <AlertDescription>
              ยืนยันอีเมลสำเร็จ คุณสามารถเข้าสู่ระบบได้แล้ว
            </AlertDescription>
          </Alert>
        )}
        {status === "error" && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        {status === "no-token" && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              ลิงก์ยืนยันไม่ถูกต้อง กรุณาตรวจสอบอีเมลของคุณอีกครั้ง
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="justify-center">
        <Button asChild>
          <Link href="/login">ไปหน้าเข้าสู่ระบบ</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">ยืนยันอีเมล</CardTitle>
            <CardDescription>กำลังโหลด...</CardDescription>
          </CardHeader>
        </Card>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
