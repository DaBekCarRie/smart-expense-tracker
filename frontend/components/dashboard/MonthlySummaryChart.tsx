"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Expense } from "@/types";
import { formatCurrency } from "@/lib/utils/formatters";

interface Props {
  expenses: Expense[];
}

interface MonthBucket {
  month: string; // e.g. "Jan 24"
  amount: number;
  key: string; // "YYYY-MM" for sorting
}

function getLast6MonthKeys(): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    keys.push(key);
  }
  return keys;
}

function keyToLabel(key: string): string {
  const [year, month] = key.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "2-digit",
  }).format(d);
}

export default function MonthlySummaryChart({ expenses }: Props) {
  const monthKeys = getLast6MonthKeys();

  // Initialise buckets for the last 6 months
  const bucketMap = new Map<string, MonthBucket>(
    monthKeys.map((key) => [
      key,
      { key, month: keyToLabel(key), amount: 0 },
    ])
  );

  for (const expense of expenses) {
    const date = new Date(expense.expense_date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const bucket = bucketMap.get(key);
    if (bucket) {
      bucket.amount += expense.amount;
    }
  }

  const data = monthKeys.map((key) => bucketMap.get(key)!);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) =>
            v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`
          }
          width={48}
        />
        <Tooltip
          formatter={(value: number) => [formatCurrency(value, "USD"), "Total"]}
          cursor={{ fill: "#eff6ff" }}
        />
        <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
