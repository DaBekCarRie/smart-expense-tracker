"use client";

import { useEffect, useState } from "react";
import type { Category, ExpenseFilters } from "@/types";
import { useDebounce } from "@/lib/hooks/useDebounce";

interface Props {
  filters: ExpenseFilters;
  categories: Category[];
  onChange: (filters: ExpenseFilters) => void;
}

export function ExpenseFilter({ filters, categories, onChange }: Props) {
  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const debouncedSearch = useDebounce(searchInput, 300);

  // Propagate debounced search value upward
  useEffect(() => {
    if (debouncedSearch !== (filters.search ?? "")) {
      onChange({ ...filters, search: debouncedSearch || undefined, cursor: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    onChange({
      ...filters,
      category_id: value ? Number(value) : undefined,
      cursor: undefined,
    });
  }

  function handleDateFrom(e: React.ChangeEvent<HTMLInputElement>) {
    onChange({ ...filters, date_from: e.target.value || undefined, cursor: undefined });
  }

  function handleDateTo(e: React.ChangeEvent<HTMLInputElement>) {
    onChange({ ...filters, date_to: e.target.value || undefined, cursor: undefined });
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
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex flex-wrap gap-3 items-end">
        {/* Search */}
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Search
          </label>
          <div className="relative">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Merchant, notes…"
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Category */}
        <div className="min-w-[150px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Category
          </label>
          <select
            value={filters.category_id ?? ""}
            onChange={handleCategoryChange}
            className="w-full py-2 pl-3 pr-8 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date from */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            From
          </label>
          <input
            type="date"
            value={filters.date_from ?? ""}
            onChange={handleDateFrom}
            className="py-2 px-3 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Date to */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            To
          </label>
          <input
            type="date"
            value={filters.date_to ?? ""}
            onChange={handleDateTo}
            className="py-2 px-3 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Clear */}
        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="py-2 px-3 text-sm font-medium text-gray-500 hover:text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
