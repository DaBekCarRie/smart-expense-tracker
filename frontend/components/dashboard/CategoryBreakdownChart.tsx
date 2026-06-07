"use client";

import { useState, useCallback } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  Sector,
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

const renderActiveShape = (props: any) => {
  const {
    cx, cy,
    innerRadius, outerRadius,
    startAngle, endAngle,
    fill,
  } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="#000"
        strokeWidth={2.5}
      />
    </g>
  );
};

export default function CategoryBreakdownChart({ expenses, categories }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const categoryMap = new Map<number, Category>(
    categories.map((c) => [c.id, c])
  );

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

  const handleClick = useCallback((_: any, index: number) => {
    setActiveIndex((prev) => (prev === index ? undefined : index));
  }, []);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-500 font-bold">
        No expense data to display
      </div>
    );
  }

  const activeEntry = activeIndex !== undefined ? data[activeIndex] : null;

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
          activeIndex={activeIndex}
          activeShape={renderActiveShape}
          onClick={handleClick}
          style={{ cursor: "pointer", outline: "none" }}
          isAnimationActive={true}
          animationBegin={0}
          animationDuration={500}
          animationEasing="ease-out"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>

        {/* Center label when a slice is selected */}
        {activeEntry && (
          <text
            x="50%"
            y="45%"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ pointerEvents: "none" }}
          >
            <tspan
              x="50%"
              dy="-0.6em"
              fontSize="11"
              fontWeight="bold"
              fill="#938d81"
              fontFamily="var(--font-patrick), cursive"
            >
              {activeEntry.name}
            </tspan>
            <tspan
              x="50%"
              dy="1.4em"
              fontSize="14"
              fontWeight="bold"
              fill="#211f1b"
              fontFamily="var(--font-patrick), cursive"
            >
              {formatCurrency(activeEntry.value, "USD")}
            </tspan>
          </text>
        )}

        <Legend
          verticalAlign="bottom"
          height={36}
          content={(props) => {
            const { payload } = props;
            return (
              <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
                {payload?.map((entry: any, index: number) => {
                  const chartData = data[index];
                  const isActive = activeIndex === index;
                  return (
                    <li
                      key={`item-${index}`}
                      className="flex items-center gap-1.5 cursor-pointer"
                      onClick={() => handleClick(null, index)}
                      style={{ opacity: activeIndex !== undefined && !isActive ? 0.45 : 1 }}
                    >
                      <div
                        className="w-3 h-3 border border-black"
                        style={{ backgroundColor: entry.color }}
                      />
                      <CategoryIcon
                        name={chartData.name}
                        icon={chartData.icon}
                        className="w-3.5 h-3.5"
                        strokeWidth={2.5}
                      />
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
