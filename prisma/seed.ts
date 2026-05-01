import { PrismaClient, Role, TxType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ===== Default Categories =====
const defaultCategories = [
  { name: "อาหาร", icon: "🍜" },
  { name: "ค่าเดินทาง", icon: "🚗" },
  { name: "ที่พัก", icon: "🏠" },
  { name: "เงินเดือน", icon: "💰" },
  { name: "รายได้เสริม", icon: "💵" },
  { name: "อื่นๆ", icon: "📁" },
  { name: "ช้อปปิ้ง", icon: "🛍️" },
  { name: "สุขภาพ", icon: "🏥" },
  { name: "บันเทิง", icon: "🎬" },
  { name: "การศึกษา", icon: "📚" },
];

// ===== Users =====
const users = [
  {
    email: "admin@satanglog.app",
    name: "Admin SatangLog",
    password: "Admin123!",
    role: "ADMIN" as Role,
  },
  {
    email: "user1@satanglog.app",
    name: "สมชาย ใจดี",
    password: "User1234!",
    role: "USER" as Role,
  },
  {
    email: "user2@satanglog.app",
    name: "สมหญิง รักสวย",
    password: "User1234!",
    role: "USER" as Role,
  },
];

// ===== Helper Functions =====

function randomAmount(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomDate(monthsBack: number): Date {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
  const end = now;
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

function getMonthString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// ===== Main Seed Function =====

async function main() {
  console.log("🌱 Starting seed...");

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.category.deleteMany();
  await prisma.recurringRule.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Cleaned existing data");

  // Create users
  const createdUsers = [];
  for (const userData of users) {
    const passwordHash = await bcrypt.hash(userData.password, 10);
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        passwordHash,
        role: userData.role,
        emailVerified: true,
      },
    });
    createdUsers.push(user);
    console.log(`👤 Created user: ${user.email} (${user.role})`);
  }

  // Create categories for each user
  for (const user of createdUsers) {
    const createdCategories = [];
    for (const cat of defaultCategories) {
      const category = await prisma.category.create({
        data: {
          name: cat.name,
          icon: cat.icon,
          isDefault: true,
          userId: user.id,
        },
      });
      createdCategories.push(category);
    }
    console.log(
      `📂 Created ${createdCategories.length} categories for ${user.email}`
    );

    // Separate income and expense categories
    const expenseCategories = createdCategories.filter(
      (c) =>
        ["อาหาร", "ค่าเดินทาง", "ที่พัก", "ช้อปปิ้ง", "สุขภาพ", "บันเทิง", "การศึกษา", "อื่นๆ"].includes(c.name)
    );
    const incomeCategories = createdCategories.filter(
      (c) => ["เงินเดือน", "รายได้เสริม"].includes(c.name)
    );

    // Create ~50 transactions per user over last 6 months
    const transactions = [];
    for (let i = 0; i < 50; i++) {
      const isIncome = Math.random() < 0.3; // 30% income, 70% expense
      const type: TxType = isIncome ? "INCOME" : "EXPENSE";
      const categories = isIncome ? incomeCategories : expenseCategories;
      const category = categories[Math.floor(Math.random() * categories.length)]!;

      let amount: number;
      if (isIncome) {
        // Income: salary-like amounts or side income
        amount =
          category!.name === "เงินเดือน"
            ? randomAmount(25000, 80000)
            : randomAmount(1000, 15000);
      } else {
        // Expense: varies by category
        switch (category!.name) {
          case "อาหาร":
            amount = randomAmount(50, 500);
            break;
          case "ค่าเดินทาง":
            amount = randomAmount(30, 300);
            break;
          case "ที่พัก":
            amount = randomAmount(5000, 15000);
            break;
          case "ช้อปปิ้ง":
            amount = randomAmount(200, 5000);
            break;
          case "สุขภาพ":
            amount = randomAmount(100, 3000);
            break;
          case "บันเทิง":
            amount = randomAmount(100, 2000);
            break;
          case "การศึกษา":
            amount = randomAmount(500, 5000);
            break;
          default:
            amount = randomAmount(50, 1000);
        }
      }

      const notes = isIncome
        ? ["เงินเดือนประจำเดือน", "รายได้ freelance", "โบนัส", "ค่าคอมมิชชั่น", "ขายของออนไลน์"]
        : [
            "อาหารกลางวัน",
            "กาแฟ",
            "ค่ารถ BTS",
            "ค่าน้ำมัน",
            "ค่าเช่าห้อง",
            "ซื้อเสื้อผ้า",
            "ค่ายา",
            "ดูหนัง",
            "ค่าคอร์สเรียน",
            "ค่าอินเทอร์เน็ต",
          ];

      transactions.push({
        amount,
        type,
        note: notes[Math.floor(Math.random() * notes.length)],
        date: randomDate(6),
        currency: "THB",
        userId: user.id,
        categoryId: category.id,
      });
    }

    await prisma.transaction.createMany({ data: transactions });
    console.log(
      `💳 Created ${transactions.length} transactions for ${user.email}`
    );

    // Create budgets (3-5 per user for current and previous months)
    const now = new Date();
    const currentMonth = getMonthString(now);
    const prevMonth = getMonthString(
      new Date(now.getFullYear(), now.getMonth() - 1, 1)
    );

    const budgetCategories = expenseCategories.slice(0, 4);
    for (const budgetCat of budgetCategories) {
      await prisma.budget.create({
        data: {
          amount: randomAmount(3000, 15000),
          month: currentMonth,
          userId: user.id,
          categoryId: budgetCat.id,
        },
      });
      await prisma.budget.create({
        data: {
          amount: randomAmount(3000, 15000),
          month: prevMonth,
          userId: user.id,
          categoryId: budgetCat.id,
        },
      });
    }
    console.log(
      `📊 Created ${budgetCategories.length * 2} budgets for ${user.email}`
    );

    // Create goals (1-2 per user)
    const goals = [
      {
        name: "เก็บเงินซื้อ MacBook",
        targetAmount: 50000,
        currentAmount: randomAmount(5000, 30000),
        deadline: new Date(now.getFullYear() + 1, 5, 30),
        userId: user.id,
      },
      {
        name: "กองทุนฉุกเฉิน",
        targetAmount: 100000,
        currentAmount: randomAmount(10000, 60000),
        deadline: null,
        userId: user.id,
      },
    ];

    for (const goal of goals) {
      await prisma.goal.create({ data: goal });
    }
    console.log(`🎯 Created ${goals.length} goals for ${user.email}`);
  }

  console.log("\n✅ Seed completed successfully!");
  console.log("\n📋 Login credentials:");
  console.log("  Admin: admin@satanglog.app / Admin123!");
  console.log("  User1: user1@satanglog.app / User1234!");
  console.log("  User2: user2@satanglog.app / User1234!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
