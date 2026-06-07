"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useExpenses, useCategories } from "@/lib/hooks/useExpenses";
import { formatCurrency } from "@/lib/utils/formatters";
import type { Expense } from "@/types";
import { cn } from "@/lib/utils/cn";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/lib/i18n/LanguageContext";

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
    <Skeleton className="h-[280px] w-full" />
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-paper rounded-doodle border-doodle shadow-doodle p-5">
      <Skeleton className="h-4 w-28 mb-3" />
      <Skeleton className="h-7 w-36" />
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
  const { t, locale } = useTranslation();
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const dateFrom = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, "0")}-01`;

  // Fetch last 6 months of expenses for charts (up to 200 items)
  const { data: expensePage, isLoading: expensesLoading } = useExpenses({
    limit: 100,
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
    const totals = new Map<number, number>();
    for (const e of thisMonthExpenses) {
      for (const item of e.items ?? []) {
        if (item.category_id != null) {
          totals.set(item.category_id, (totals.get(item.category_id) || 0) + Number(item.price));
        }
      }
    }
    if (totals.size === 0) return t.dashboardUncategorized;
    let max = -1;
    let maxId = -1;
    for (const [id, total] of totals.entries()) {
      if (total > max) { max = total; maxId = id; }
    }
    return categories?.find(c => c.id === maxId)?.name ?? t.chartOther;
  }, [thisMonthExpenses, categories, t]);

  const monthDiff = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : null;

  const monthLabel = new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(now);

  const isLoading = expensesLoading || categoriesLoading;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-black tracking-wide">{t.dashboardTitle}</h1>
        <p className="text-sm font-bold text-gray-600 mt-0.5">
          {t.dashboardOverview}
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
            <div className="bg-pastel-pink rounded-doodle border-doodle shadow-doodle p-5 hover:translate-y-[-2px] hover:shadow-[4px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
              <p className="text-xs font-bold text-black uppercase tracking-wider">
                {monthLabel}
              </p>
              <div className="flex items-baseline gap-2">
                <p className="mt-2 text-3xl font-bold text-black tracking-wide">
                  {formatCurrency(thisMonthTotal, "USD")}
                </p>
                {monthDiff !== null && (
                  <span className={cn(
                    "text-sm font-bold",
                    monthDiff > 0 ? "text-red-700" : "text-green-700"
                  )}>
                    {monthDiff > 0 ? "↑" : ""}{monthDiff.toFixed(0)}%
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm font-bold text-black opacity-80">
                {locale === "th" ? `${thisMonthExpenses.length} รายการ` : `${thisMonthExpenses.length} expense${thisMonthExpenses.length !== 1 ? "s" : ""}`}
              </p>
            </div>

            <div className="bg-pastel-blue rounded-doodle border-doodle shadow-doodle p-5 hover:translate-y-[-2px] hover:shadow-[4px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
              <p className="text-xs font-bold text-black uppercase tracking-wider">
                {t.dashboardTopCategory}
              </p>
              <p className="mt-2 text-3xl font-bold text-black tracking-wide truncate">
                {topCategory ?? "—"}
              </p>
              <p className="mt-2 text-sm font-bold text-black opacity-80">{t.dashboardMostSpent}</p>
            </div>

            <div className="bg-pastel-yellow rounded-doodle border-doodle shadow-doodle p-5 hover:translate-y-[-2px] hover:shadow-[4px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
              <p className="text-xs font-bold text-black uppercase tracking-wider">
                {t.dashboardLast6Months}
              </p>
              <p className="mt-2 text-3xl font-bold text-black tracking-wide">
                {formatCurrency(allTimeTotal, "USD")}
              </p>
              <p className="mt-2 text-sm font-bold text-black opacity-80">
                {locale === "th" ? `${expenses.length} รายการ` : `${expenses.length} expense${expenses.length !== 1 ? "s" : ""}`}
              </p>
            </div>

            <div className="bg-pastel-green rounded-doodle border-doodle shadow-doodle p-5 hover:translate-y-[-2px] hover:shadow-[4px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
              <p className="text-xs font-bold text-black uppercase tracking-wider">
                {t.dashboardAvgPerMonth}
              </p>
              <p className="mt-2 text-3xl font-bold text-black tracking-wide">
                {formatCurrency(allTimeTotal / 6, "USD")}
              </p>
              <p className="mt-2 text-sm font-bold text-black opacity-80">{t.dashboardOver6Months}</p>
            </div>
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-paper rounded-doodle border-doodle shadow-doodle p-4 sm:p-5 overflow-x-auto">
          <h2 className="text-base sm:text-lg font-bold text-black tracking-wide mb-4">
            {t.dashboardMonthlySpending}
          </h2>
          <MonthlySummaryChart expenses={expenses} />
        </div>

        <div className="bg-paper rounded-doodle border-doodle shadow-doodle p-4 sm:p-5 overflow-x-auto">
          <h2 className="text-base sm:text-lg font-bold text-black tracking-wide mb-4">
            {t.dashboardSpendingByCategory}
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
