import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Transaction,
  TransactionCreateInput,
  TransactionUpdateInput,
  TransactionQueryParams,
  PaginatedResponse,
} from "@/types";

// ===== Query Keys =====

export const transactionKeys = {
  all: ["transactions"] as const,
  lists: () => [...transactionKeys.all, "list"] as const,
  list: (params?: TransactionQueryParams) =>
    [...transactionKeys.lists(), params] as const,
  details: () => [...transactionKeys.all, "detail"] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
};

// ===== API Helpers =====

async function fetchTransactions(
  params?: TransactionQueryParams
): Promise<PaginatedResponse<Transaction>> {
  const searchParams = new URLSearchParams();

  if (params) {
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.type) searchParams.set("type", params.type);
    if (params.categoryId) searchParams.set("categoryId", params.categoryId);
    if (params.from) searchParams.set("from", params.from);
    if (params.to) searchParams.set("to", params.to);
    if (params.search) searchParams.set("search", params.search);
    if (params.sortBy) searchParams.set("sortBy", params.sortBy);
    if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  }

  const query = searchParams.toString();
  const url = `/api/transactions${query ? `?${query}` : ""}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch transactions");
  }
  return res.json();
}

async function fetchTransaction(id: string): Promise<Transaction> {
  const res = await fetch(`/api/transactions/${id}`);
  if (!res.ok) {
    throw new Error("Failed to fetch transaction");
  }
  const json = await res.json();
  return json.data ?? json;
}

async function createTransaction(
  data: TransactionCreateInput
): Promise<Transaction> {
  const res = await fetch("/api/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error("Failed to create transaction");
  }
  const json = await res.json();
  return json.data ?? json;
}

async function updateTransaction({
  id,
  data,
}: {
  id: string;
  data: TransactionUpdateInput;
}): Promise<Transaction> {
  const res = await fetch(`/api/transactions/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error("Failed to update transaction");
  }
  const json = await res.json();
  return json.data ?? json;
}

async function deleteTransaction(id: string): Promise<void> {
  const res = await fetch(`/api/transactions/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Failed to delete transaction");
  }
}

// ===== Hooks =====

export function useTransactions(params?: TransactionQueryParams) {
  return useQuery({
    queryKey: transactionKeys.list(params),
    queryFn: () => fetchTransactions(params),
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: () => fetchTransaction(id),
    enabled: !!id,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}
