"use client";

import { useState } from "react";
import Link from "next/link";
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
import type { ExpenseCreate, ExpenseFilters, OCRResult } from "@/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";

const CURRENCIES = ["USD", "EUR", "GBP", "THB", "JPY", "SGD", "AUD", "CAD"];

function today() {
  return new Date().toISOString().split("T")[0];
}

export default function ExpensesPage() {
  const { t, locale } = useTranslation();
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
  function handleOCRApply(result: OCRResult) {
    if (result.merchant) setMerchant(result.merchant);
    if (result.amount !== undefined && result.amount !== null) setAmount(String(result.amount));
    if (result.currency) setCurrency(result.currency);
    if (result.expense_date) setExpenseDate(result.expense_date);
    if (result.receipt_url) setReceiptUrl(result.receipt_url);
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
    <div className="max-w-5xl mx-auto px-0 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-black tracking-wide">{t.expensesTitle}</h1>
          {!isLoading && (
            <p className="text-sm font-bold text-gray-600 mt-0.5">
              {locale === "th" ? `${total} รายการ` : `${total} expense${total !== 1 ? "s" : ""}`}
            </p>
          )}
        </div>
        <Link
          href="/expenses/new"
          className="inline-flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-doodle border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-pastel-blue text-sm sm:text-base font-bold text-black hover:bg-blue-300 hover:translate-y-[-2px] hover:shadow-[4px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none focus:outline-none transition-all whitespace-nowrap"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          {t.expensesAddNew}
        </Link>
      </div>

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
            {t.expensesLoadMore}
          </button>
        </div>
      )}
    </div>
  );
}
