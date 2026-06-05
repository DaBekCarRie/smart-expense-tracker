"use client";

import React, { useEffect, useState } from "react";
import type { Category, ExpenseFilters } from "@/types";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { DateInput } from "@/components/ui/date-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "../ui/skeleton";

interface Props {
  filters: ExpenseFilters;
  categories: Category[];
  isLoadingCategories?: boolean;
  onChange: (filters: ExpenseFilters) => void;
}

export function ExpenseFilter({ filters, categories, isLoadingCategories, onChange }: Props) {
  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const debouncedSearch = useDebounce(searchInput, 300);

  // Propagate debounced search value upward
  useEffect(() => {
    if (debouncedSearch !== (filters.search ?? "")) {
      onChange({ ...filters, search: debouncedSearch || undefined, cursor: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  function handleCategoryChange(value: string) {
    onChange({
      ...filters,
      category_id: value ? Number(value) : undefined,
      cursor: undefined,
    });
  }

  function handleDateFrom(iso: string) {
    onChange({ ...filters, date_from: iso || undefined, cursor: undefined });
  }

  function handleDateTo(iso: string) {
    onChange({ ...filters, date_to: iso || undefined, cursor: undefined });
  }

  function handleClear() {
    setSearchInput("");
    onChange({});
  }

  const hasActiveFilters =
    !!filters.search ||
    filters.category_id !== undefined ||
    !!filters.date_from ||
    !!filters.date_to;

  return (
    <div className="bg-paper rounded-doodle border-doodle p-4 shadow-doodle">
      <div className="flex flex-wrap gap-4 items-end">
        {/* Search */}
        <div className="flex-1 min-w-[180px]">
          <label className="block text-sm font-bold text-black tracking-wide mb-1">
            Search
          </label>
          <div className="relative">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Merchant, notes…"
              className="w-full pl-8 pr-3 py-2 text-sm font-sans rounded-doodle-input border-doodle-input shadow-doodle-sm bg-white focus:outline-none focus:ring-0 focus:bg-[#fffdf0] transition-colors placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Category */}
        <div className="min-w-[180px]">
          <label className="block text-sm font-bold text-black tracking-wide mb-1">
            Category
          </label>
          {isLoadingCategories ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select
              value={filters.category_id ? String(filters.category_id) : "all"}
              onValueChange={(val) => handleCategoryChange(val === "all" ? "" : val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Date from */}
        <div>
          <label className="block text-sm font-bold text-black tracking-wide mb-1">
            From
          </label>
          <DateInput
            value={filters.date_from ?? ""}
            onChange={handleDateFrom}
          />
        </div>

        {/* Date to */}
        <div>
          <label className="block text-sm font-bold text-black tracking-wide mb-1">
            To
          </label>
          <DateInput
            value={filters.date_to ?? ""}
            onChange={handleDateTo}
          />
        </div>

        {/* Clear */}
        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="py-2 px-4 text-sm font-bold text-black rounded-doodle border-doodle shadow-doodle-sm bg-pastel-pink hover:bg-red-300 transition-all hover:translate-y-[-2px] hover:shadow-[4px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none whitespace-nowrap"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
