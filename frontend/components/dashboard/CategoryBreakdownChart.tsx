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
import { CategoryIcon } from "../ui/CategoryIcon";

interface Props {
  expenses: Expense[];
  categories: Category[];
}

interface ChartEntry {
  name: string;
  value: number;
  color: string;
  icon: string | null;
}

const UNCATEGORIZED_COLOR = "#e5e7eb";

export default function CategoryBreakdownChart({
  expenses,
  categories,
}: Props) {
  // Build a lookup map for categories
  const categoryMap = new Map<number, Category>(
    categories.map((c) => [c.id, c])
  );

  // Sum item prices per item-level category
  const totals = new Map<string, ChartEntry>();

  for (const expense of expenses) {
    for (const item of expense.items ?? []) {
      const key = item.category_id != null ? String(item.category_id) : "uncategorized";
      const category = item.category_id != null ? categoryMap.get(item.category_id) : undefined;
      const name = category?.name ?? "Uncategorized";
      const color = category?.color ?? UNCATEGORIZED_COLOR;
      const icon = category?.icon ?? null;
      const itemAmount = Number(item.price);

      const existing = totals.get(key);
      if (existing) {
        existing.value += itemAmount;
      } else {
        totals.set(key, { name, value: itemAmount, color, icon });
      }
    }
  }

  const data = Array.from(totals.values()).sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-500 font-bold">
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
          stroke="#000"
          strokeWidth={2}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number | string) => [
            formatCurrency(typeof value === "string" ? parseFloat(value) : value, "USD"),
          ]}
          contentStyle={{ 
            fontFamily: "var(--font-patrick), cursive", 
            fontWeight: "bold",
            borderRadius: "0",
            border: "2px solid black",
            boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)"
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          content={(props) => {
            const { payload } = props;
            return (
              <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
                {payload?.map((entry: any, index: number) => {
                  const chartData = data[index];
                  return (
                    <li key={`item-${index}`} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 border border-black" style={{ backgroundColor: entry.color }} />
                      <CategoryIcon name={chartData.name} icon={chartData.icon} className="w-3.5 h-3.5" strokeWidth={2.5} />
                      <span className="text-sm font-bold text-black">{chartData.name}</span>
                    </li>
                  );
                })}
              </ul>
            );
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
