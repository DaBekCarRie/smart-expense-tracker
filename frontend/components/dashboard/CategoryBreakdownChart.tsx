"use client";

import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Expense, Category } from "@/types";
import { formatCurrency } from "@/lib/utils/formatters";

interface Props {
  expenses: Expense[];
  categories: Category[];
}

interface ChartEntry {
  name: string;
  value: number;
  color: string;
}

const UNCATEGORIZED_COLOR = "#94a3b8";

export default function CategoryBreakdownChart({
  expenses,
  categories,
}: Props) {
  // Build a lookup map for categories
  const categoryMap = new Map<number, Category>(
    categories.map((c) => [c.id, c])
  );

  // Sum amounts per category
  const totals = new Map<string, ChartEntry>();

  for (const expense of expenses) {
    const key =
      expense.category_id !== null
        ? String(expense.category_id)
        : "uncategorized";
    const category = expense.category_id !== null
      ? categoryMap.get(expense.category_id)
      : undefined;
    const name = category?.name ?? "Uncategorized";
    const color = category?.color ?? UNCATEGORIZED_COLOR;

    const existing = totals.get(key);
    if (existing) {
      existing.value += expense.amount;
    } else {
      totals.set(key, { name, value: expense.amount, color });
    }
  }

  const data = Array.from(totals.values()).sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">
        No expense data to display
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          outerRadius={90}
          dataKey="value"
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number | string) => [
            formatCurrency(typeof value === "string" ? parseFloat(value) : value, "USD"),
          ]}
        />
        <Legend
          formatter={(value) => (
            <span className="text-xs text-gray-600">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
