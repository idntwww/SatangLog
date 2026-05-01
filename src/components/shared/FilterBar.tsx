"use client";

import * as React from "react";
import { Search, X } from "lucide-react";

import { useFilterStore } from "@/stores/filter.store";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import { Button } from "@/components/ui/button";
import type { Category, TxType } from "@/types";

interface FilterBarProps {
  categories: Category[];
}

export function FilterBar({ categories }: FilterBarProps) {
  const {
    type,
    categoryId,
    from,
    to,
    search,
    setType,
    setCategoryId,
    setDateRange,
    setSearch,
    resetFilters,
  } = useFilterStore();

  const [searchInput, setSearchInput] = React.useState(search ?? "");
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external search state changes to local input
  React.useEffect(() => {
    setSearchInput(search ?? "");
  }, [search]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setSearch(value || undefined);
    }, 300);
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleTypeChange = (value: string) => {
    if (value === "ALL") {
      setType(undefined);
    } else {
      setType(value as TxType);
    }
  };

  const handleCategoryChange = (value: string) => {
    if (value === "ALL") {
      setCategoryId(undefined);
    } else {
      setCategoryId(value);
    }
  };

  const hasActiveFilters = type || categoryId || from || to || search;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Type Selector */}
      <Select value={type ?? "ALL"} onValueChange={handleTypeChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="ประเภท" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">ทั้งหมด</SelectItem>
          <SelectItem value="INCOME">รายรับ</SelectItem>
          <SelectItem value="EXPENSE">รายจ่าย</SelectItem>
        </SelectContent>
      </Select>

      {/* Category Dropdown */}
      <Select value={categoryId ?? "ALL"} onValueChange={handleCategoryChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="หมวดหมู่" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">ทุกหมวดหมู่</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date Range Picker */}
      <DateRangePicker from={from} to={to} onChange={setDateRange} />

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="ค้นหาบันทึก..."
          value={searchInput}
          onChange={handleSearchChange}
          className="w-[200px] pl-8"
        />
      </div>

      {/* Reset Filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={resetFilters}>
          <X className="mr-1 h-4 w-4" />
          ล้างตัวกรอง
        </Button>
      )}
    </div>
  );
}
