"use client";

import Link from "next/link";
import { PieChart, TrendingUp, GitCompareArrows } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const analyticsModules = [
  {
    title: "วิเคราะห์ตามหมวดหมู่",
    description: "ดูสัดส่วนรายจ่ายแยกตามหมวดหมู่ พร้อมกราฟวงกลมและตารางจัดอันดับ",
    href: "/analytics/categories",
    icon: PieChart,
    stats: "แสดงสัดส่วน % ของแต่ละหมวดหมู่",
  },
  {
    title: "แนวโน้มรายรับรายจ่าย",
    description: "ดูแนวโน้มรายรับรายจ่ายย้อนหลัง พร้อมค่าเฉลี่ยและจุดสูงสุด/ต่ำสุด",
    href: "/analytics/trends",
    icon: TrendingUp,
    stats: "กราฟเส้นรายเดือน/รายสัปดาห์",
  },
  {
    title: "เปรียบเทียบช่วงเวลา",
    description: "เปรียบเทียบรายรับรายจ่ายระหว่าง 2 เดือน พร้อมเปอร์เซ็นต์เปลี่ยนแปลง",
    href: "/analytics/compare",
    icon: GitCompareArrows,
    stats: "เปรียบเทียบแบบเคียงข้างกัน",
  },
];

export default function AnalyticsOverviewPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">วิเคราะห์ข้อมูล</h1>
        <p className="text-muted-foreground text-sm">
          เลือกมุมมองการวิเคราะห์ที่ต้องการ
        </p>
      </div>

      {/* Module Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {analyticsModules.map((module) => (
          <Link key={module.href} href={module.href}>
            <Card className="h-full transition-colors hover:bg-accent/50 cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <module.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                </div>
                <CardDescription className="mt-2">
                  {module.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {module.stats}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
