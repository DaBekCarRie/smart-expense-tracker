"use client";

import { useState } from "react";
import type { Expense } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";
import { CategoryIcon } from "../ui/CategoryIcon";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Image as ImageIcon } from "lucide-react";

import { Skeleton } from "../ui/skeleton";

interface Props {
  expenses: Expense[];
  isLoading: boolean;
  onDelete?: (id: string) => void;
  pendingDeleteId?: string | null;
  onCancelDelete?: () => void;
}

function SkeletonRow() {
  return (
    <tr>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-20" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-32" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-16" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-6 w-24" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-12" />
      </td>
    </tr>
  );
}

export function ExpenseList({ expenses, isLoading, onDelete, pendingDeleteId, onCancelDelete }: Props) {
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  return (
    <>
      <div className="bg-paper rounded-doodle border-doodle shadow-doodle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="border-b-2 border-black bg-pastel-blue">
                <th className="px-4 py-3 text-left font-bold text-black uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left font-bold text-black uppercase tracking-wider">
                  Merchant
                </th>
                <th className="px-4 py-3 text-right font-bold text-black uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left font-bold text-black uppercase tracking-wider">
                  Category
                </th>
                {onDelete && (
                  <th className="px-4 py-3 text-right font-bold text-black uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black">
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
                    className="px-4 py-12 text-center text-lg font-bold text-gray-500 bg-white"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <svg
                        className="w-8 h-8 text-black"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
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
                    className="hover:bg-paper transition-colors bg-white"
                  >
                    <td className="px-4 py-3 text-black font-bold whitespace-nowrap">
                      {formatDate(expense.expense_date)}
                    </td>
                    <td className="px-4 py-3 font-bold text-black max-w-[200px] truncate">
                      <div className="flex items-center gap-2">
                        {expense.receipt_url && (
                          <button
                            type="button"
                            onClick={() => {
                              const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                              setPreviewImageUrl(`${baseUrl}${expense.receipt_url}`);
                            }}
                            className="text-black hover:text-blue-600 transition-colors flex-shrink-0"
                            title="View receipt"
                          >
                            <ImageIcon className="w-4 h-4" strokeWidth={2.5} />
                          </button>
                        )}
                        <span>
                          {expense.merchant}
                          {expense.notes && (
                            <span className="ml-2 text-sm text-gray-600 font-sans font-normal">
                              — {expense.notes}
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-black whitespace-nowrap text-lg tracking-wider">
                      {formatCurrency(expense.amount, expense.currency)}
                    </td>
                    <td className="px-4 py-3">
                      {expense.category ? (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-doodle border-doodle text-sm font-bold text-black shadow-doodle-sm"
                          )}
                          style={{ backgroundColor: expense.category.color }}
                        >
                          <CategoryIcon name={expense.category.name} icon={expense.category.icon} className="w-3.5 h-3.5" />
                          {expense.category.name}
                        </span>
                      ) : (
                        <span className="text-gray-500 font-bold">—</span>
                      )}
                    </td>
                    {onDelete && (
                      <td className="px-4 py-3 text-right">
                        {pendingDeleteId === expense.id ? (
                          <span className="inline-flex items-center gap-2">
                            <button
                              onClick={() => onDelete(expense.id)}
                              className="text-sm text-black font-bold hover:text-red-600 transition-colors underline decoration-2 underline-offset-4"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={onCancelDelete}
                              className="text-sm text-gray-500 font-bold hover:text-black transition-colors"
                            >
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => onDelete(expense.id)}
                            className="text-sm text-black font-bold hover:bg-pastel-pink border-2 border-transparent hover:border-black rounded-doodle px-2 py-1 transition-all"
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

      <Dialog open={!!previewImageUrl} onOpenChange={(open) => !open && setPreviewImageUrl(null)}>
        <DialogContent className="max-w-2xl bg-paper">
          <DialogHeader>
            <DialogTitle>Receipt Preview</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-2 rounded-doodle border-2 border-black bg-white shadow-doodle-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImageUrl || ""}
              alt="Receipt Preview"
              className="max-h-[70vh] max-w-full object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
