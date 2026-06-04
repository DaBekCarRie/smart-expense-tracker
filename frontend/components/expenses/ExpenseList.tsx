"use client";

import type { Expense } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";

interface Props {
  expenses: Expense[];
  isLoading: boolean;
  onDelete?: (id: string) => void;
  pendingDeleteId?: string | null;
  onCancelDelete?: () => void;
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3">
        <div className="h-3.5 bg-gray-200 rounded w-20" />
      </td>
      <td className="px-4 py-3">
        <div className="h-3.5 bg-gray-200 rounded w-32" />
      </td>
      <td className="px-4 py-3">
        <div className="h-3.5 bg-gray-200 rounded w-16" />
      </td>
      <td className="px-4 py-3">
        <div className="h-5 bg-gray-200 rounded-full w-20" />
      </td>
      <td className="px-4 py-3">
        <div className="h-3.5 bg-gray-200 rounded w-12" />
      </td>
    </tr>
  );
}

export function ExpenseList({ expenses, isLoading, onDelete, pendingDeleteId, onCancelDelete }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Merchant
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Category
              </th>
              {onDelete && (
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : expenses.length === 0 ? (
              <tr>
                <td
                  colSpan={onDelete ? 5 : 4}
                  className="px-4 py-12 text-center text-sm text-gray-400"
                >
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      className="w-8 h-8 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <span>No expenses found</span>
                  </div>
                </td>
              </tr>
            ) : (
              expenses.map((expense) => (
                <tr
                  key={expense.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {formatDate(expense.expense_date)}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">
                    {expense.merchant}
                    {expense.notes && (
                      <span className="ml-1.5 text-xs text-gray-400 font-normal">
                        — {expense.notes}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                    {formatCurrency(expense.amount, expense.currency)}
                  </td>
                  <td className="px-4 py-3">
                    {expense.category ? (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                        )}
                        style={{ backgroundColor: expense.category.color }}
                      >
                        {expense.category.name}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  {onDelete && (
                    <td className="px-4 py-3 text-right">
                      {pendingDeleteId === expense.id ? (
                        <span className="inline-flex items-center gap-2">
                          <button
                            onClick={() => onDelete(expense.id)}
                            className="text-xs text-red-600 font-semibold hover:text-red-800 transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={onCancelDelete}
                            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => onDelete(expense.id)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
