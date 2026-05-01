import { useQuery } from "@tanstack/react-query";
import type {
  AnalyticsSummary,
  CategoryAnalytics,
  TrendAnalytics,
  CompareAnalytics,
} from "@/types";

// ===== Query Keys =====

export const analyticsKeys = {
  all: ["analytics"] as const,
  summary: (params?: { from?: string; to?: string }) =>
    [...analyticsKeys.all, "summary", params] as const,
  byCategory: (params?: { from?: string; to?: string; type?: string }) =>
    [...analyticsKeys.all, "by-category", params] as const,
  trends: (params?: { period?: string; months?: number }) =>
    [...analyticsKeys.all, "trends", params] as const,
  compare: (params?: { month1?: string; month2?: string }) =>
    [...analyticsKeys.all, "compare", params] as const,
};

// ===== API Helpers =====

async function fetchSummary(
  params?: { from?: string; to?: string }
): Promise<AnalyticsSummary> {
  const searchParams = new URLSearchParams();

  if (params) {
    if (params.from) searchParams.set("from", params.from);
    if (params.to) searchParams.set("to", params.to);
  }

  const query = searchParams.toString();
  const url = `/api/analytics/summary${query ? `?${query}` : ""}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch analytics summary");
  }
  const json = await res.json();
  return json.data ?? json;
}

async function fetchCategoryAnalytics(
  params?: { from?: string; to?: string; type?: string }
): Promise<CategoryAnalytics[]> {
  const searchParams = new URLSearchParams();

  if (params) {
    if (params.from) searchParams.set("from", params.from);
    if (params.to) searchParams.set("to", params.to);
    if (params.type) searchParams.set("type", params.type);
  }

  const query = searchParams.toString();
  const url = `/api/analytics/by-category${query ? `?${query}` : ""}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch category analytics");
  }
  const json = await res.json();
  return json.data ?? json;
}

async function fetchTrends(
  params?: { period?: string; months?: number }
): Promise<TrendAnalytics> {
  const searchParams = new URLSearchParams();

  if (params) {
    if (params.period) searchParams.set("period", params.period);
    if (params.months) searchParams.set("months", String(params.months));
  }

  const query = searchParams.toString();
  const url = `/api/analytics/trends${query ? `?${query}` : ""}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch trend analytics");
  }
  const json = await res.json();
  return json.data ?? json;
}

async function fetchCompare(
  params?: { month1?: string; month2?: string }
): Promise<CompareAnalytics> {
  const searchParams = new URLSearchParams();

  if (params) {
    if (params.month1) searchParams.set("month1", params.month1);
    if (params.month2) searchParams.set("month2", params.month2);
  }

  const query = searchParams.toString();
  const url = `/api/analytics/compare${query ? `?${query}` : ""}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch compare analytics");
  }
  const json = await res.json();
  return json.data ?? json;
}

// ===== Hooks =====

export function useSummary(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: analyticsKeys.summary(params),
    queryFn: () => fetchSummary(params),
  });
}

export function useCategoryAnalytics(
  params?: { from?: string; to?: string; type?: string }
) {
  return useQuery({
    queryKey: analyticsKeys.byCategory(params),
    queryFn: () => fetchCategoryAnalytics(params),
  });
}

export function useTrends(params?: { period?: string; months?: number }) {
  return useQuery({
    queryKey: analyticsKeys.trends(params),
    queryFn: () => fetchTrends(params),
  });
}

export function useCompare(params?: { month1?: string; month2?: string }) {
  return useQuery({
    queryKey: analyticsKeys.compare(params),
    queryFn: () => fetchCompare(params),
    enabled: !!(params?.month1 && params?.month2),
  });
}
