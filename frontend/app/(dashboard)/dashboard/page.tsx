"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useExpenses, useCategories } from "@/lib/hooks/useExpenses";
import { formatCurrency } from "@/lib/utils/formatters";
import type { Expense } from "@/types";
import { cn } from "@/lib/utils/cn";

// Dynamic imports — charts are heavy Recharts bundles; no SSR needed
const CategoryBreakdownChart = dynamic(
  () => import("@/components/dashboard/CategoryBreakdownChart"),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
);

const MonthlySummaryChart = dynamic(
  () => import("@/components/dashboard/MonthlySummaryChart"),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
);

function ChartSkeleton() {
  return (
    <div className="h-[280px] w-full rounded-lg bg-gray-100 animate-pulse" />
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
      <div className="h-4 w-28 bg-gray-200 rounded mb-3" />
      <div className="h-7 w-36 bg-gray-200 rounded" />
    </div>
  );
}

function getMonthExpenses(expenses: Expense[], monthOffset: number): Expense[] {
  const now = new Date();
  const targetDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
  return expenses.filter((e) => {
    const d = new Date(e.expense_date);
    return (
      d.getFullYear() === targetDate.getFullYear() && d.getMonth() === targetDate.getMonth()
    );
  });
}

export default function DashboardPage() {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const dateFrom = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, "0")}-01`;

  // Fetch last 6 months of expenses for charts (up to 200 items)
  const { data: expensePage, isLoading: expensesLoading } = useExpenses({
    limit: 200,
    date_from: dateFrom,
  });
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const expenses = expensePage?.items ?? [];
  
  const thisMonthExpenses = useMemo(() => getMonthExpenses(expenses, 0), [expenses]);
  const lastMonthExpenses = useMemo(() => getMonthExpenses(expenses, 1), [expenses]);

  const thisMonthTotal = useMemo(() => thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0), [thisMonthExpenses]);
  const lastMonthTotal = useMemo(() => lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0), [lastMonthExpenses]);

  const allTimeTotal = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);

  const topCategory = useMemo(() => {
    if (thisMonthExpenses.length === 0) return null;
    const totals = new Map<number | null, number>();
    for (const e of thisMonthExpenses) {
      const cid = e.category_id;
      totals.set(cid, (totals.get(cid) || 0) + e.amount);
    }
    let max = -1;
    let maxId: number | null = null;
    for (const [id, total] of totals.entries()) {
      if (total > max) {
        max = total;
        maxId = id;
      }
    }
    return categories?.find(c => c.id === maxId)?.name ?? (maxId === null ? "Uncategorized" : "Other");
  }, [thisMonthExpenses, categories]);

  const monthDiff = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : null;

  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(now);

  const isLoading = expensesLoading || categoriesLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Overview of your spending
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {monthLabel}
              </p>
              <div className="flex items-baseline gap-2">
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {formatCurrency(thisMonthTotal, "USD")}
                </p>
                {monthDiff !== null && (
                  <span className={cn(
                    "text-xs font-bold",
                    monthDiff > 0 ? "text-red-500" : "text-green-500"
                  )}>
                    {monthDiff > 0 ? "↑" : ""}{monthDiff.toFixed(0)}%
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-400">
                {thisMonthExpenses.length} expense
                {thisMonthExpenses.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Top Category
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900 truncate">
                {topCategory ?? "—"}
              </p>
              <p className="mt-1 text-xs text-gray-400">most spent this month</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last 6 Months
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {formatCurrency(allTimeTotal, "USD")}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Avg per Month
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {formatCurrency(allTimeTotal / 6, "USD")}
              </p>
              <p className="mt-1 text-xs text-gray-400">over 6 months</p>
            </div>
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Monthly Spending
          </h2>
          <MonthlySummaryChart expenses={expenses} />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Spending by Category
          </h2>
          <CategoryBreakdownChart
            expenses={expenses}
            categories={categories ?? []}
          />
        </div>
      </div>
    </div>
  );
}
