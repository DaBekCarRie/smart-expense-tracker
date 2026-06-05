"use client";

import { useState } from "react";
import { useExpenses, useDeleteExpense, useCategories, useCreateExpense } from "@/lib/hooks/useExpenses";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { ExpenseFilter } from "@/components/expenses/ExpenseFilter";
import { ReceiptUploader } from "@/components/upload/ReceiptUploader";
import { DateInput } from "@/components/ui/date-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [categoryId, setCategoryId] = useState<string>("none");
  const [notes, setNotes] = useState("");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: expensePage, isLoading } = useExpenses(filters);
  const { data: categories, isLoading: categoriesLoading } = useCategories();
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
  function handleOCRApply(data: Partial<ExpenseCreate & { category: string | null }>) {
    if (data.merchant) setMerchant(data.merchant);
    if (data.amount !== undefined) setAmount(String(data.amount));
    if (data.currency) setCurrency(data.currency);
    if (data.expense_date) setExpenseDate(data.expense_date);
    if (data.receipt_url) setReceiptUrl(data.receipt_url);
    
    // Smart categorization: match suggested category name to existing ID
    if (data.category && categories) {
      const match = categories.find(
        (c) => c.name.toLowerCase() === data.category?.toLowerCase()
      );
      if (match) {
        setCategoryId(String(match.id));
      }
    }

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
      category_id: categoryId !== "none" ? Number(categoryId) : null,
      notes: notes.trim() || null,
      receipt_url: receiptUrl,
    };

    try {
      await createExpense.mutateAsync(payload);
      // Reset form
      setMerchant("");
      setAmount("");
      setCurrency("USD");
      setExpenseDate(today());
      setCategoryId("none");
      setNotes("");
      setReceiptUrl(null);
      setShowForm(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create expense.";
      setFormError(message);
    }
  }

  const isSubmitting = createExpense.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black tracking-wide">Expenses</h1>
          {!isLoading && (
            <p className="text-sm font-bold text-gray-600 mt-0.5">
              {total} expense{total !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-doodle border-doodle shadow-doodle bg-pastel-blue text-base font-bold text-black hover:bg-blue-300 hover:translate-y-[-2px] hover:shadow-[4px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none focus:outline-none transition-all"
        >
          <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d={showForm ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
          </svg>
          {showForm ? "Cancel" : "Add expense"}
        </button>
      </div>

      {/* Add expense panel (Receipt Uploader + manual form) */}
      {showForm && (
        <div className="bg-paper rounded-doodle border-doodle p-6 shadow-doodle space-y-6">
          {/* Receipt Upload */}
          <div>
            <h2 className="text-lg font-bold text-black tracking-wide mb-3">
              Scan a receipt <span className="text-gray-500 font-normal font-sans text-sm">(optional)</span>
            </h2>
            <ReceiptUploader onApply={handleOCRApply} />
          </div>

          <hr className="border-t-2 border-black border-dashed" />

          {/* Manual / pre-filled form */}
          <div>
            <h2 className="text-lg font-bold text-black tracking-wide mb-4">Expense details</h2>
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Merchant */}
              <div>
                <label htmlFor="exp-merchant" className="block text-sm font-bold text-black mb-1">
                  Merchant <span className="text-red-600">*</span>
                </label>
                <input
                  id="exp-merchant"
                  type="text"
                  required
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  placeholder="e.g. Starbucks"
                  disabled={isSubmitting}
                  className="w-full rounded-doodle-input border-doodle-input bg-white px-3 py-2 text-sm font-sans shadow-doodle-sm focus:outline-none focus:ring-0 focus:bg-[#fffdf0] disabled:opacity-50 transition-colors placeholder:text-gray-500"
                />
              </div>

              {/* Amount + Currency */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label htmlFor="exp-amount" className="block text-sm font-bold text-black mb-1">
                    Amount <span className="text-red-600">*</span>
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
                    className="w-full rounded-doodle-input border-doodle-input bg-white px-3 py-2 text-sm font-sans shadow-doodle-sm focus:outline-none focus:ring-0 focus:bg-[#fffdf0] disabled:opacity-50 transition-colors placeholder:text-gray-500"
                  />
                </div>
                <div className="w-32">
                  <label htmlFor="exp-currency" className="block text-sm font-bold text-black mb-1">
                    Currency
                  </label>
                  <Select
                    value={currency}
                    onValueChange={setCurrency}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="exp-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date */}
              <div>
                <label htmlFor="exp-date" className="block text-sm font-bold text-black mb-1">
                  Date <span className="text-red-600">*</span>
                </label>
                <DateInput
                  id="exp-date"
                  value={expenseDate}
                  onChange={setExpenseDate}
                  disabled={isSubmitting}
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="exp-category" className="block text-sm font-bold text-black mb-1">
                  Category
                </label>
                <Select
                  value={categoryId}
                  onValueChange={setCategoryId}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="exp-category">
                    <SelectValue placeholder="No category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {(categories ?? []).map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="exp-notes" className="block text-sm font-bold text-black mb-1">
                  Notes
                </label>
                <textarea
                  id="exp-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes…"
                  disabled={isSubmitting}
                  className="w-full rounded-doodle-input border-doodle-input bg-white px-3 py-2 text-sm font-sans shadow-doodle-sm focus:outline-none focus:ring-0 focus:bg-[#fffdf0] resize-none disabled:opacity-50 transition-colors placeholder:text-gray-500"
                />
              </div>

              {formError && (
                <div className="rounded-doodle bg-pastel-pink border-doodle shadow-doodle-sm px-4 py-3 text-sm font-bold text-black">
                  {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-doodle bg-pastel-blue px-4 py-2.5 text-base font-bold text-black shadow-doodle border-doodle hover:bg-blue-300 hover:translate-y-[-2px] hover:shadow-[4px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition-all"
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
        isLoadingCategories={categoriesLoading}
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
        <div className="text-center pt-2">
          <button
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                cursor: expensePage.next_cursor ?? undefined,
              }))
            }
            className="text-base font-bold text-black hover:underline decoration-2 underline-offset-4"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
