# แผนการพัฒนา (Implementation Plan): SatangLog

## ภาพรวม

แผนการพัฒนาแอปพลิเคชัน SatangLog — ระบบบันทึกรายรับรายจ่ายส่วนบุคคล สร้างด้วย Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Prisma ORM และ Supabase PostgreSQL โดยแบ่งงานเป็นขั้นตอนที่ต่อเนื่องกัน เริ่มจากโครงสร้างพื้นฐาน ระบบ Authentication ไปจนถึง Analytics และ CSV Import/Export

## Tasks

- [x] 1. ตั้งค่าโครงสร้างโปรเจกต์และ Dependencies พื้นฐาน
  - [x] 1.1 สร้างโปรเจกต์ Next.js 14 (App Router) พร้อม TypeScript strict mode
    - สร้างโปรเจกต์ด้วย `create-next-app` พร้อม TypeScript, Tailwind CSS, App Router
    - ติดตั้ง dependencies ทั้งหมด: Prisma, NextAuth.js v5, Zod, Zustand, TanStack Query, Recharts, shadcn/ui, Resend, fast-check, Vitest
    - ตั้งค่า `tsconfig.json` ให้เป็น strict mode
    - สร้างไฟล์ `.env.example` พร้อมตัวแปรสภาพแวดล้อมทั้งหมด
    - _ข้อกำหนด: ทุกข้อ (โครงสร้างพื้นฐาน)_

  - [x] 1.2 ตั้งค่า Prisma Schema และ Database Migration
    - สร้างไฟล์ `prisma/schema.prisma` ตาม Data Model ในเอกสารออกแบบ (User, Transaction, Category, Budget, Goal, RecurringRule, AuditLog)
    - กำหนด enums: Role, TxType, RecurringFreq
    - กำหนด indexes สำหรับ performance (userId+date, userId+type, userId+categoryId)
    - รัน `prisma migrate dev` เพื่อสร้าง migration
    - สร้าง Prisma client singleton ที่ `src/lib/prisma.ts`
    - _ข้อกำหนด: 2.1, 3.1, 4.1, 5.1_

  - [x] 1.3 สร้าง TypeScript Types และ Zod Validation Schemas
    - สร้างไฟล์ `src/types/index.ts` สำหรับ shared types ทั้งหมด
    - สร้าง Zod schemas ที่ `src/lib/validators/`: transaction.ts, budget.ts, goal.ts, category.ts, auth.ts
    - ตรวจสอบว่า validation rules ตรงกับข้อกำหนด (จำนวนเงินต้องมากกว่าศูนย์, รหัสผ่านอย่างน้อย 8 ตัวอักษร, ฯลฯ)
    - _ข้อกำหนด: 1.1, 2.2, 2.4, 3.2, 3.4_

  - [x] 1.4 ตั้งค่า Vitest และ Testing Framework
    - ตั้งค่า Vitest config สำหรับ TypeScript
    - ติดตั้งและตั้งค่า fast-check สำหรับ property-based testing
    - สร้างโครงสร้างโฟลเดอร์ tests
    - _ข้อกำหนด: ทุกข้อ (โครงสร้างพื้นฐาน)_

- [x] 2. ระบบ Authentication และ User Management
  - [x] 2.1 ตั้งค่า NextAuth.js v5 พร้อม Credentials Provider
    - สร้างไฟล์ `src/lib/auth.ts` สำหรับ NextAuth config
    - สร้าง API route `src/app/api/auth/[...nextauth]/route.ts`
    - Implement Credentials Provider พร้อม password hashing (bcrypt)
    - ตั้งค่า JWT session strategy
    - สร้าง middleware ที่ `src/middleware.ts` สำหรับ Auth Guard (protect /dashboard/*, /api/*)
    - _ข้อกำหนด: 1.2_

  - [x] 2.2 Implement API สำหรับลงทะเบียนผู้ใช้
    - สร้าง API route `POST /api/auth/register`
    - Validate input ด้วย Zod registerSchema (email, password min 8 ตัว + ตัวพิมพ์ใหญ่ + ตัวเลข, name)
    - ตรวจสอบอีเมลซ้ำ → ส่ง 409 Conflict ถ้าซ้ำ
    - Hash password ด้วย bcrypt
    - สร้าง user ใน database พร้อม verifyToken
    - ส่งอีเมลยืนยันผ่าน Resend
    - สร้าง default categories สำหรับ user ใหม่ (อาหาร, ค่าเดินทาง, ที่พัก, เงินเดือน, รายได้เสริม, อื่นๆ)
    - _ข้อกำหนด: 1.1, 1.4, 4.1_

  - [x] 2.3 Implement ระบบล็อกบัญชีเมื่อกรอกรหัสผ่านผิดเกิน 5 ครั้ง
    - เพิ่ม logic ใน Credentials Provider: เพิ่ม failedAttempts เมื่อ login ผิด
    - ล็อกบัญชี 15 นาทีเมื่อ failedAttempts >= 5 (อัปเดต lockedUntil)
    - Reset failedAttempts เมื่อ login สำเร็จ
    - ตรวจสอบ lockedUntil ก่อนอนุญาตให้ login
    - _ข้อกำหนด: 1.3_

  - [x] 2.4 สร้างหน้า Login และ Register (UI)
    - สร้าง `src/app/(auth)/login/page.tsx` พร้อมฟอร์ม login
    - สร้าง `src/app/(auth)/register/page.tsx` พร้อมฟอร์ม register
    - สร้าง `src/app/(auth)/verify-email/page.tsx` สำหรับยืนยันอีเมล
    - ใช้ shadcn/ui components (Input, Button, Card, Form)
    - แสดง validation errors แบบ real-time ด้วย Zod
    - แสดงข้อความแจ้งเตือนเมื่ออีเมลซ้ำหรือบัญชีถูกล็อก
    - _ข้อกำหนด: 1.1, 1.2, 1.3, 1.4_

- [x] 3. Checkpoint — ตรวจสอบระบบ Authentication
  - ตรวจสอบว่า tests ทั้งหมดผ่าน, ถามผู้ใช้หากมีข้อสงสัย

- [x] 4. ระบบจัดการหมวดหมู่ (Category Management)
  - [x] 4.1 Implement Category Service และ API Routes
    - สร้าง `src/lib/services/category.service.ts` พร้อมฟังก์ชัน: getCategories, createCategory, updateCategory, deleteCategory
    - สร้าง API route `src/app/api/categories/route.ts` (GET, POST)
    - เพิ่ม PUT, DELETE endpoints
    - เมื่อลบ Category ที่มี Transaction อ้างอิง → ย้าย Transaction ไปหมวดหมู่ "ไม่ระบุ" ก่อนลบ
    - Validate input ด้วย Zod (ชื่อ unique ต่อ user)
    - _ข้อกำหนด: 4.1, 4.2, 4.3, 4.4_

  - [x] 4.2 เขียน unit tests สำหรับ Category Service
    - ทดสอบการสร้าง, แก้ไข, ลบ Category
    - ทดสอบการย้าย Transaction เมื่อลบ Category
    - ทดสอบ validation (ชื่อซ้ำ, ชื่อว่าง)
    - _ข้อกำหนด: 4.2, 4.3, 4.4_

- [x] 5. ระบบบันทึกรายรับรายจ่าย (Transaction CRUD)
  - [x] 5.1 Implement Transaction Service
    - สร้าง `src/lib/services/transaction.service.ts` พร้อมฟังก์ชัน: getTransactions (พร้อม pagination, filtering, sorting), getTransactionById, createTransaction, updateTransaction, deleteTransaction, bulkDeleteTransactions
    - กำหนดหมวดหมู่เป็น "ไม่ระบุ" อัตโนมัติเมื่อไม่ระบุ categoryId
    - Validate ด้วย Zod (amount > 0, date บังคับ)
    - _ข้อกำหนด: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_

  - [x] 5.2 สร้าง Transaction API Routes
    - สร้าง `src/app/api/transactions/route.ts` (GET list พร้อม pagination/filter, POST create)
    - สร้าง `src/app/api/transactions/[id]/route.ts` (GET, PUT, DELETE)
    - สร้าง `src/app/api/transactions/bulk/route.ts` (DELETE bulk)
    - ทุก route ต้องตรวจสอบ auth session และ ownership
    - _ข้อกำหนด: 2.1, 3.1, 5.1, 5.2, 5.3, 5.4_

  - [x] 5.3 สร้าง TransactionForm Component
    - สร้าง `src/components/forms/TransactionForm.tsx` รองรับ mode create/edit
    - ใช้ shadcn/ui (Input, Select, DatePicker, Textarea, Button)
    - Validate ด้วย Zod แบบ real-time (จำนวนเงินต้องมากกว่าศูนย์)
    - แสดงข้อมูลเดิมเมื่ออยู่ใน edit mode
    - _ข้อกำหนด: 2.1, 2.4, 3.1, 3.4, 5.1_

  - [x] 5.4 สร้างหน้ารายการ Transaction พร้อม DataTable
    - สร้าง `src/components/shared/DataTable.tsx` (generic, reusable)
    - สร้าง `src/app/(dashboard)/transactions/page.tsx` แสดงรายการ Transaction
    - รองรับ pagination, sorting
    - แสดง ConfirmDialog ก่อนลบ
    - _ข้อกำหนด: 5.1, 5.2, 5.3, 5.4_

  - [x] 5.5 สร้าง TanStack Query Hooks สำหรับ Transactions
    - สร้าง `src/hooks/useTransactions.ts` พร้อม queries: useTransactions, useTransaction, mutations: useCreateTransaction, useUpdateTransaction, useDeleteTransaction
    - ตั้งค่า cache invalidation ให้อัปเดตข้อมูลสรุปทันทีหลังแก้ไข/ลบ
    - _ข้อกำหนด: 5.2, 5.4_

  - [x] 5.6 เขียน unit tests สำหรับ Transaction Service
    - ทดสอบ CRUD operations
    - ทดสอบ validation (amount <= 0, missing date)
    - ทดสอบ default category assignment
    - ทดสอบ authorization (ownership check)
    - _ข้อกำหนด: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 5.1, 5.2, 5.3, 5.4_

- [x] 6. Checkpoint — ตรวจสอบระบบ Transaction CRUD
  - ตรวจสอบว่า tests ทั้งหมดผ่าน, ถามผู้ใช้หากมีข้อสงสัย

- [x] 7. ระบบกรองและค้นหา (Filtering & Search)
  - [x] 7.1 Implement ระบบกรองและค้นหาใน Transaction API
    - เพิ่ม query parameters: type (INCOME/EXPENSE), categoryId, from/to (date range), search (keyword)
    - Implement full-text search ในฟิลด์ note
    - ตรวจสอบ performance ให้ตอบสนองภายใน 500ms
    - _ข้อกำหนด: 11.1, 11.2, 11.3, 11.4_

  - [x] 7.2 สร้าง Filter UI Components และ Zustand Store
    - สร้าง `src/stores/filter.store.ts` สำหรับเก็บสถานะ filter/search
    - สร้าง Filter bar component พร้อม: Category dropdown, Date range picker, Type selector, Search input
    - สร้าง `src/components/shared/DateRangePicker.tsx`
    - เชื่อมต่อ filter state กับ TanStack Query
    - _ข้อกำหนด: 11.1, 11.2, 11.3, 11.4_

- [x] 8. Layout และ Responsive Design
  - [x] 8.1 สร้าง Dashboard Layout (Sidebar + Header)
    - สร้าง `src/app/(dashboard)/layout.tsx` พร้อม Sidebar และ Header
    - สร้าง `src/components/layout/Sidebar.tsx` พร้อมเมนูนำทาง
    - สร้าง `src/components/layout/Header.tsx` พร้อมข้อมูล user
    - สร้าง `src/stores/ui.store.ts` สำหรับ sidebar state, theme
    - _ข้อกำหนด: 12.1, 12.2_

  - [x] 8.2 Implement Responsive Design และ Mobile Navigation
    - สร้าง `src/components/layout/MobileNav.tsx` (hamburger menu สำหรับหน้าจอ < 768px)
    - ตรวจสอบ layout ทำงานถูกต้องตั้งแต่ 320px ถึง 1920px
    - รองรับ touch gesture บนมือถือ
    - ปรับกราฟให้อ่านง่ายบนมือถือ (รองรับซูมและเลื่อน)
    - _ข้อกำหนด: 12.1, 12.2, 12.3, 12.4_

- [x] 9. Dashboard ภาพรวม
  - [x] 9.1 Implement Analytics Summary API
    - สร้าง `src/lib/services/analytics.service.ts` พร้อมฟังก์ชัน: getSummary (totalIncome, totalExpense, balance, transactionCount)
    - สร้าง API route `GET /api/analytics/summary?from=date&to=date`
    - คำนวณข้อมูลสรุปตามช่วงเวลาที่เลือก
    - _ข้อกำหนด: 6.1, 6.3_

  - [x] 9.2 สร้าง Dashboard Page พร้อม Summary Cards
    - สร้าง `src/components/dashboard/SummaryCards.tsx` แสดงยอดรวมรายรับ, รายจ่าย, ยอดคงเหลือ
    - สร้าง `src/components/dashboard/RecentTransactions.tsx` แสดง 10 รายการล่าสุด
    - สร้าง `src/components/dashboard/MonthlyChart.tsx` กราฟแท่งเปรียบเทียบรายรับ-รายจ่ายรายเดือน (Recharts)
    - สร้าง `src/app/(dashboard)/page.tsx` ประกอบ components ทั้งหมด
    - รองรับการเปลี่ยนช่วงเวลา → อัปเดตข้อมูลภายใน 1 วินาที
    - _ข้อกำหนด: 6.1, 6.2, 6.3, 6.4_

  - [x] 9.3 สร้าง TanStack Query Hooks สำหรับ Analytics
    - สร้าง `src/hooks/useAnalytics.ts` พร้อม queries: useSummary, useCategoryAnalytics, useTrends, useCompare
    - _ข้อกำหนด: 6.1, 6.3_

- [x] 10. Checkpoint — ตรวจสอบ Dashboard และ Layout
  - ตรวจสอบว่า tests ทั้งหมดผ่าน, ถามผู้ใช้หากมีข้อสงสัย

- [x] 11. ระบบวิเคราะห์ตามหมวดหมู่ (Category Analytics)
  - [x] 11.1 Implement Category Analytics API
    - เพิ่มฟังก์ชัน `getByCategory` ใน analytics.service.ts
    - สร้าง API route `GET /api/analytics/by-category?from=date&to=date&type=EXPENSE`
    - คำนวณ: ยอดรวมต่อ Category, เปอร์เซ็นต์สัดส่วน, เปอร์เซ็นต์เปลี่ยนแปลงเทียบเดือนก่อน
    - _ข้อกำหนด: 7.1, 7.2, 7.4_

  - [x] 11.2 สร้างหน้า Category Analytics พร้อมกราฟ
    - สร้าง `src/components/charts/PieChart.tsx` (Recharts)
    - สร้าง `src/app/(dashboard)/analytics/categories/page.tsx`
    - แสดง Pie Chart สัดส่วนรายจ่ายแต่ละ Category
    - แสดงตารางจัดอันดับ Category (สูงสุด → ต่ำสุด)
    - เมื่อคลิก Category ในกราฟ → แสดงรายละเอียด Transaction ใน Category นั้น
    - แสดงเปอร์เซ็นต์เปลี่ยนแปลงเทียบเดือนก่อน
    - _ข้อกำหนด: 7.1, 7.2, 7.3, 7.4_

- [x] 12. ระบบวิเคราะห์แนวโน้ม (Trend Analytics)
  - [x] 12.1 Implement Trends API
    - เพิ่มฟังก์ชัน `getTrends` ใน analytics.service.ts
    - สร้าง API route `GET /api/analytics/trends?period=monthly|weekly&months=12`
    - คำนวณ: รายรับ/รายจ่ายต่อช่วงเวลา, ค่าเฉลี่ย, เดือนที่สูงสุด/ต่ำสุด
    - _ข้อกำหนด: 8.1, 8.2, 8.3, 8.4_

  - [x] 12.2 สร้างหน้า Trend Analytics พร้อมกราฟเส้น
    - สร้าง `src/components/charts/LineChart.tsx` (Recharts)
    - สร้าง `src/app/(dashboard)/analytics/trends/page.tsx`
    - แสดง Line Chart รายรับ-รายจ่ายย้อนหลัง 12 เดือน/12 สัปดาห์
    - แสดงค่าเฉลี่ยรายรับ-รายจ่ายต่อเดือน
    - แสดงเดือนที่มีรายจ่ายสูงสุดและต่ำสุด
    - รองรับสลับระหว่าง monthly/weekly view
    - _ข้อกำหนด: 8.1, 8.2, 8.3, 8.4_

- [x] 13. ระบบวิเคราะห์เปรียบเทียบ (Comparison Analytics)
  - [x] 13.1 Implement Compare API
    - เพิ่มฟังก์ชัน `getCompare` ใน analytics.service.ts
    - สร้าง API route `GET /api/analytics/compare?month1=2024-01&month2=2024-02`
    - คำนวณ: ข้อมูลแต่ละเดือน, เปอร์เซ็นต์เปลี่ยนแปลง (รายรับ, รายจ่าย, แยกตาม Category)
    - _ข้อกำหนด: 9.1, 9.2, 9.3_

  - [x] 13.2 สร้างหน้า Compare Analytics พร้อมกราฟเปรียบเทียบ
    - สร้าง `src/components/charts/CompareChart.tsx` (Recharts BarChart)
    - สร้าง `src/app/(dashboard)/analytics/compare/page.tsx`
    - แสดงกราฟแท่งเปรียบเทียบ 2 เดือนแบบเคียงข้างกัน
    - แสดงเปอร์เซ็นต์เปลี่ยนแปลงระหว่างช่วงเวลา
    - แสดงการเปลี่ยนแปลงแยกตาม Category
    - _ข้อกำหนด: 9.1, 9.2, 9.3_

- [x] 14. Checkpoint — ตรวจสอบระบบ Analytics ทั้งหมด
  - ตรวจสอบว่า tests ทั้งหมดผ่าน, ถามผู้ใช้หากมีข้อสงสัย

- [ ] 15. ระบบนำเข้าและส่งออก CSV (Import/Export)
  - [x] 15.1 Implement CSV Parser (Pure Function)
    - สร้าง `src/lib/csv/parser.ts` — ฟังก์ชัน `parseCSV(content: string): ParseResult`
    - Parse header row, validate columns
    - แปลงแต่ละแถวเป็น TransactionCreateInput
    - เก็บ errors พร้อมหมายเลขแถวที่มีปัญหา
    - รองรับ special characters (quoting, escaping)
    - _ข้อกำหนด: 10.1, 10.2_

  - [x] 15.2 Implement CSV Pretty Printer (Pure Function)
    - สร้าง `src/lib/csv/printer.ts` — ฟังก์ชัน `printCSV(transactions: Transaction[]): string`
    - สร้าง header row
    - จัดรูปแบบแต่ละ Transaction เป็น CSV row
    - Handle special characters (quoting, escaping commas, newlines)
    - _ข้อกำหนด: 10.3_

  - [x] 15.3 เขียน property-based test สำหรับ CSV round-trip
    - **Property 1: CSV Round-Trip Consistency** — สำหรับ Transaction ใดๆ ที่ส่งออกเป็น CSV แล้วนำเข้ากลับ ข้อมูลที่ได้ต้องเทียบเท่ากับต้นฉบับ (printCSV → parseCSV → เทียบเท่าต้นฉบับ)
    - ใช้ fast-check สร้าง arbitrary Transaction data
    - ตรวจสอบว่า amount, type, date, note, category ตรงกัน
    - **ตรวจสอบ: ข้อกำหนด 10.4**

  - [x] 15.4 เขียน property-based test สำหรับ CSV special characters
    - **Property 2: CSV Special Character Handling** — สำหรับ note ที่มี commas, quotes, newlines ระบบต้อง escape/unescape ได้ถูกต้องผ่าน round-trip
    - ใช้ fast-check สร้าง arbitrary strings ที่มี special characters
    - **ตรวจสอบ: ข้อกำหนด 10.3, 10.4**

  - [x] 15.5 สร้าง Import/Export API Routes
    - สร้าง API route `POST /api/import` (รับ FormData CSV file, parse, บันทึก transactions)
    - สร้าง API route `GET /api/export?from=date&to=date&format=csv` (query transactions, generate CSV, return file download)
    - ส่ง response พร้อมจำนวนที่ import สำเร็จ และ errors
    - _ข้อกำหนด: 10.1, 10.2, 10.3_

  - [x] 15.6 สร้างหน้า Import UI
    - สร้าง `src/components/shared/FileUpload.tsx` (drag & drop + file picker)
    - สร้าง `src/app/(dashboard)/import/page.tsx`
    - แสดง preview ข้อมูลก่อน import
    - แสดงรายละเอียดข้อผิดพลาดพร้อมหมายเลขแถว
    - เพิ่มปุ่ม Export ในหน้า Transactions
    - _ข้อกำหนด: 10.1, 10.2, 10.3_

- [x] 16. Checkpoint — ตรวจสอบระบบ CSV Import/Export
  - ตรวจสอบว่า tests ทั้งหมดผ่าน, ถามผู้ใช้หากมีข้อสงสัย

- [x] 17. Zod Validation Property-Based Tests
  - [x] 17.1 เขียน property-based test สำหรับ Transaction Validation
    - **Property 3: Transaction Amount Positivity** — สำหรับจำนวนเงินใดๆ ที่ <= 0 ระบบต้อง reject เสมอ และสำหรับจำนวนเงินใดๆ ที่ > 0 ระบบต้อง accept เสมอ
    - ใช้ fast-check สร้าง arbitrary numbers (ทั้งบวก, ลบ, ศูนย์, ทศนิยม)
    - **ตรวจสอบ: ข้อกำหนด 2.4, 3.4**

  - [x] 17.2 เขียน property-based test สำหรับ Auth Validation
    - **Property 4: Password Strength Validation** — สำหรับรหัสผ่านใดๆ ที่สั้นกว่า 8 ตัว หรือไม่มีตัวพิมพ์ใหญ่ หรือไม่มีตัวเลข ระบบต้อง reject เสมอ
    - ใช้ fast-check สร้าง arbitrary strings
    - **ตรวจสอบ: ข้อกำหนด 1.1**

- [x] 18. Seed Data และ Analytics Algorithms
  - [x] 18.1 Implement Linear Regression สำหรับ Forecasting
    - สร้าง `src/lib/analytics/forecast.ts` พร้อมฟังก์ชัน linearRegression และ forecast
    - สร้าง API route `GET /api/analytics/forecast?months=3`
    - ค่า predicted ต้องไม่ติดลบ (Math.max(0, predicted))
    - _ข้อกำหนด: 8.1_

  - [x] 18.2 สร้าง Seed Data สำหรับ Development
    - สร้าง `prisma/seed.ts`
    - สร้าง 3 users (1 Admin, 2 Regular)
    - สร้าง default categories, ~50 transactions ต่อ user (ย้อนหลัง 6 เดือน)
    - สร้าง budgets และ goals ตัวอย่าง
    - ตั้งค่า seed script ใน package.json
    - _ข้อกำหนด: ทุกข้อ (ข้อมูลทดสอบ)_

- [x] 19. เชื่อมต่อทุกส่วนและ Final Integration
  - [x] 19.1 สร้างหน้า Analytics Overview
    - สร้าง `src/app/(dashboard)/analytics/page.tsx` เป็นหน้ารวม link ไปยัง categories, trends, compare
    - แสดง summary cards ของแต่ละ analytics module
    - _ข้อกำหนด: 7.1, 8.1, 9.1_

  - [x] 19.2 สร้างหน้า Settings
    - สร้าง `src/app/(dashboard)/settings/page.tsx`
    - จัดการ Category (CRUD) ผ่าน CategoryForm
    - สร้าง `src/components/forms/CategoryForm.tsx`
    - สร้าง `src/hooks/useCategories.ts` (TanStack Query hooks)
    - _ข้อกำหนด: 4.1, 4.2, 4.3, 4.4_

  - [x] 19.3 เชื่อมต่อ Navigation และ Route Guards
    - ตรวจสอบ Sidebar navigation links ทั้งหมดทำงานถูกต้อง
    - ตรวจสอบ middleware redirect ไป login เมื่อไม่มี session
    - ตรวจสอบ CSP headers และ security middleware
    - _ข้อกำหนด: 1.2, 12.1, 12.2_

- [x] 20. Final Checkpoint — ตรวจสอบระบบทั้งหมด
  - ตรวจสอบว่า tests ทั้งหมดผ่าน, ถามผู้ใช้หากมีข้อสงสัย

## หมายเหตุ

- Tasks ที่มีเครื่องหมาย `*` เป็น tasks ที่เป็นทางเลือก สามารถข้ามได้เพื่อ MVP ที่เร็วขึ้น
- ทุก task อ้างอิงข้อกำหนดเฉพาะเพื่อให้ตรวจสอบย้อนกลับได้
- Checkpoints ช่วยให้ตรวจสอบความถูกต้องเป็นระยะ
- Property-based tests ตรวจสอบคุณสมบัติความถูกต้องแบบ universal (CSV round-trip, validation logic)
- Unit tests ตรวจสอบตัวอย่างเฉพาะและ edge cases
