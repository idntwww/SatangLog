// ===== Enums =====

export type Role = "USER" | "ADMIN";
export type TxType = "INCOME" | "EXPENSE";
export type RecurringFreq = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

// ===== Base Models (Client-side representations of Prisma models) =====

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  emailVerified: boolean;
  failedAttempts: number;
  lockedUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TxType;
  note: string | null;
  date: string;
  currency: string;
  userId: string;
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
  // Relations (optional, included when populated)
  category?: Category | null;
  user?: Pick<User, "id" | "name" | "email">;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  isDefault: boolean;
  userId: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  amount: number;
  month: string;
  userId: string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  // Relations (optional)
  category?: Category;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringRule {
  id: string;
  amount: number;
  type: TxType;
  frequency: RecurringFreq;
  nextRun: string;
  active: boolean;
  userId: string;
  categoryId: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue: unknown;
  newValue: unknown;
  userId: string;
  createdAt: string;
}

// ===== API Request Payloads =====

export interface TransactionCreateInput {
  amount: number;
  type: TxType;
  categoryId?: string;
  date: string;
  note?: string;
  currency?: string;
}

export interface TransactionUpdateInput {
  amount?: number;
  type?: TxType;
  categoryId?: string | null;
  date?: string;
  note?: string | null;
  currency?: string;
}

export interface CategoryCreateInput {
  name: string;
  icon?: string;
}

export interface CategoryUpdateInput {
  name?: string;
  icon?: string;
}

export interface BudgetCreateInput {
  categoryId: string;
  amount: number;
  month: string;
}

export interface BudgetUpdateInput {
  amount?: number;
  month?: string;
  categoryId?: string;
}

export interface GoalCreateInput {
  name: string;
  targetAmount: number;
  deadline?: string;
}

export interface GoalUpdateInput {
  name?: string;
  targetAmount?: number;
  deadline?: string | null;
}

export interface GoalContributeInput {
  amount: number;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

// ===== API Response Types =====

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiErrorResponse {
  error: string;
  details?: Record<string, string[]>;
}

export interface ApiSuccessResponse<T = unknown> {
  data: T;
  message?: string;
}

// ===== Analytics Types =====

export interface AnalyticsSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
}

export interface CategoryAnalytics {
  categoryId: string;
  name: string;
  icon: string;
  total: number;
  percentage: number;
  changeFromLastMonth: number;
}

export interface TrendDataPoint {
  period: string;
  income: number;
  expense: number;
  balance: number;
}

export interface TrendAnalytics {
  data: TrendDataPoint[];
  averages: {
    income: number;
    expense: number;
  };
  highest: { period: string; amount: number };
  lowest: { period: string; amount: number };
}

export interface CompareAnalytics {
  month1: {
    period: string;
    income: number;
    expense: number;
  };
  month2: {
    period: string;
    income: number;
    expense: number;
  };
  changes: {
    income: number;
    expense: number;
    byCategory: Array<{
      categoryId: string;
      name: string;
      month1Amount: number;
      month2Amount: number;
      changePercent: number;
    }>;
  };
}

export interface ForecastPrediction {
  month: string;
  predictedIncome: number;
  predictedExpense: number;
}

// ===== CSV Import Types =====

export interface CSVParseResult {
  transactions: TransactionCreateInput[];
  errors: Array<{ row: number; message: string }>;
}

export interface ImportResult {
  imported: number;
  errors: Array<{ row: number; message: string }>;
}

// ===== Filter & Query Types =====

export interface TransactionFilters {
  type?: TxType;
  categoryId?: string;
  from?: string;
  to?: string;
  search?: string;
}

export interface TransactionQueryParams extends TransactionFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ===== Admin Types =====

export interface AdminStats {
  totalUsers: number;
  totalTransactions: number;
  activeUsers: number;
  anomalies: number;
}
