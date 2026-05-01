"use client";

import { create } from "zustand";
import type { TxType, TransactionFilters } from "@/types";

interface FilterState extends TransactionFilters {
  // Actions
  setType: (type: TxType | undefined) => void;
  setCategoryId: (categoryId: string | undefined) => void;
  setDateRange: (from: string | undefined, to: string | undefined) => void;
  setSearch: (search: string | undefined) => void;
  resetFilters: () => void;
}

const initialState: TransactionFilters = {
  type: undefined,
  categoryId: undefined,
  from: undefined,
  to: undefined,
  search: undefined,
};

export const useFilterStore = create<FilterState>((set) => ({
  ...initialState,

  setType: (type) => set({ type }),

  setCategoryId: (categoryId) => set({ categoryId }),

  setDateRange: (from, to) => set({ from, to }),

  setSearch: (search) => set({ search }),

  resetFilters: () => set(initialState),
}));
