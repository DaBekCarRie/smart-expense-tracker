"use client";

import { useState } from "react";
import { useExpenses, useDeleteExpense, useCategories, useCreateExpense } from "@/lib/hooks/useExpenses";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { ExpenseFilter } from "@/components/expenses/ExpenseFilter";
import { ReceiptUploader } from "@/components/upload/ReceiptUploader";
import type { ExpenseCreate, ExpenseFilters } from "@/types";

const CURRENCIES = ["USD", "EUR", "GBP", "THB", "JPY", "SGD", "AUD", "CAD"];

function today() {
  return new Date().toISOString().split("T")[0];
}

export default function ExpensesPage() {
  const [filters, setFilters] = useState<ExpenseFilters>({ limit: 50 });
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // New expense form state
  const [showForm, setShowForm] = useState(false);
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [expenseDate, setExpenseDate] = useState(today());
  const [categoryId, setCategoryId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data: expensePage, isLoading } = useExpenses(filters);
  const { data: categories } = useCategories();
  const deleteExpense = useDeleteExpense();
  const createExpense = useCreateExpense();

  const expenses = expensePage?.items ?? [];
  const total = expensePage?.total ?? 0;

  function handleDelete(id: string) {
    if (pendingDeleteId === id) {
      deleteExpense.mutate(id);
      setPendingDeleteId(null);
    } else {
      setPendingDeleteId(id);
    }
  }

  function handleCancelDelete() {
    setPendingDeleteId(null);
  }

  /** Called when ReceiptUploader extracts OCR data — pre-fills the form. */
  function handleOCRApply(data: Partial<ExpenseCreate>) {
    if (data.merchant) setMerchant(data.merchant);
    if (data.amount !== undefined) setAmount(String(data.amount));
    if (data.currency) setCurrency(data.currency);
    if (data.expense_date) setExpenseDate(data.expense_date);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError("Please enter a valid amount.");
      return;
    }

    const payload: ExpenseCreate = {
      merchant: merchant.trim(),
      amount: parsedAmount,
      currency,
      expense_date: expenseDate,
      category_id: categoryId ? Number(categoryId) : null,
      notes: notes.trim() || null,
    };

    try {
      await createExpense.mutateAsync(payload);
      // Reset form
      setMerchant("");
      setAmount("");
      setCurrency("USD");
      setExpenseDate(today());
      setCategoryId("");
      setNotes("");
      setShowForm(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create expense.";
      setFormError(message);
    }
  }

  const isSubmitting = createExpense.isPending;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Expenses</h1>
          {!isLoading && (
            <p className="text-sm text-gray-500 mt-0.5">
              {total} expense{total !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={showForm ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
          </svg>
          {showForm ? "Cancel" : "Add expense"}
        </button>
      </div>

      {/* Add expense panel (Receipt Uploader + manual form) */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          {/* Receipt Upload */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              Scan a receipt <span className="text-gray-400 font-normal">(optional)</span>
            </h2>
            <ReceiptUploader onApply={handleOCRApply} />
          </div>

          <hr className="border-gray-100" />

          {/* Manual / pre-filled form */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Expense details</h2>
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Merchant */}
              <div>
                <label htmlFor="exp-merchant" className="block text-sm font-medium text-gray-700 mb-1">
                  Merchant <span className="text-red-500">*</span>
                </label>
                <input
                  id="exp-merchant"
                  type="text"
                  required
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  placeholder="e.g. Starbucks"
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
              </div>

              {/* Amount + Currency */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label htmlFor="exp-amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="exp-amount"
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    disabled={isSubmitting}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  />
                </div>
                <div className="w-28">
                  <label htmlFor="exp-currency" className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    id="exp-currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:opacity-50"
                  >
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Date */}
              <div>
                <label htmlFor="exp-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="exp-date"
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="exp-category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="exp-category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:opacity-50"
                >
                  <option value="">No category</option>
                  {(categories ?? []).map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="exp-notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  id="exp-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes…"
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
                />
              </div>

              {formError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? "Saving…" : "Save expense"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <ExpenseFilter
        filters={filters}
        categories={categories ?? []}
        onChange={setFilters}
      />

      {/* List */}
      <ExpenseList
        expenses={expenses}
        isLoading={isLoading}
        onDelete={handleDelete}
        pendingDeleteId={pendingDeleteId}
        onCancelDelete={handleCancelDelete}
      />

      {/* Load more */}
      {expensePage?.has_more && (
        <div className="text-center">
          <button
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                cursor: expensePage.next_cursor ?? undefined,
              }))
            }
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
