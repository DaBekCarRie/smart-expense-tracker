"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useCreateExpense, useCategories } from "@/lib/hooks/useExpenses";
import { ReceiptUploader } from "@/components/upload/ReceiptUploader";
import { DateInput } from "@/components/ui/date-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ExpenseCreate } from "@/types";

const CURRENCIES = ["USD", "EUR", "GBP", "THB", "JPY", "SGD", "AUD", "CAD"];

function today(): string {
  return new Date().toISOString().split("T")[0];
}

export default function NewExpensePage() {
  const router = useRouter();
  const createExpense = useCreateExpense();
  const { data: categories } = useCategories();

  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [expenseDate, setExpenseDate] = useState(today());
  const [categoryId, setCategoryId] = useState<string>("none");
  const [notes, setNotes] = useState("");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount.");
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
      router.push("/expenses");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create expense.";
      setError(message);
    }
  }

  const isLoading = createExpense.isPending;

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black tracking-wide">New Expense</h1>
        <p className="text-sm font-bold text-gray-600 mt-0.5">
          Fill in the details below
        </p>
      </div>

      {/* ⭐ Receipt uploader — compress → WebP → OCR → pre-fill form */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-black mb-3 tracking-wide">
          Scan a receipt <span className="text-gray-500 font-normal text-sm font-sans">(optional)</span>
        </h2>
        <ReceiptUploader
          onApply={(data) => {
            if (data.merchant) setMerchant(data.merchant);
            if (data.amount !== undefined && data.amount !== null) setAmount(String(data.amount));
            if (data.currency) setCurrency(data.currency);
            if (data.expense_date) setExpenseDate(data.expense_date);
            if (data.receipt_url) setReceiptUrl(data.receipt_url);
          }}
        />
      </div>

      <div className="bg-white rounded-doodle border-doodle shadow-doodle p-6">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Merchant */}
          <div>
            <label
              htmlFor="merchant"
              className="block text-sm font-bold text-black mb-1"
            >
              Merchant <span className="text-red-600">*</span>
            </label>
            <input
              id="merchant"
              type="text"
              required
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="e.g. Starbucks"
              className="w-full rounded-doodle border-doodle bg-white px-3 py-2 text-sm font-sans shadow-doodle-sm focus:outline-none focus:ring-0 focus:bg-paper disabled:opacity-50 transition-colors placeholder:text-gray-500"
              disabled={isLoading}
            />
          </div>

          {/* Amount + Currency */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label
                htmlFor="amount"
                className="block text-sm font-bold text-black mb-1"
              >
                Amount <span className="text-red-600">*</span>
              </label>
              <input
                id="amount"
                type="number"
                required
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-doodle border-doodle bg-white px-3 py-2 text-sm font-sans shadow-doodle-sm focus:outline-none focus:ring-0 focus:bg-paper disabled:opacity-50 transition-colors placeholder:text-gray-500"
                disabled={isLoading}
              />
            </div>
            <div className="w-32">
              <label
                htmlFor="currency"
                className="block text-sm font-bold text-black mb-1"
              >
                Currency
              </label>
              <Select
                value={currency}
                onValueChange={setCurrency}
                disabled={isLoading}
              >
                <SelectTrigger id="currency">
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
            <label className="block text-sm font-bold text-black mb-1">
              Date <span className="text-red-600">*</span>
            </label>
            <DateInput
              id="expense_date"
              value={expenseDate}
              onChange={setExpenseDate}
              disabled={isLoading}
            />
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-bold text-black mb-1"
            >
              Category
            </label>
            <Select
              value={categoryId}
              onValueChange={setCategoryId}
              disabled={isLoading}
            >
              <SelectTrigger id="category">
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
            <label
              htmlFor="notes"
              className="block text-sm font-bold text-black mb-1"
            >
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes…"
              className="w-full rounded-doodle border-doodle bg-white px-3 py-2 text-sm font-sans shadow-doodle-sm focus:outline-none focus:ring-0 focus:bg-paper resize-none disabled:opacity-50 transition-colors placeholder:text-gray-500"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="rounded-doodle bg-pastel-pink border-doodle shadow-doodle-sm px-4 py-3 text-sm font-bold text-black">
              {error}
            </div>
          )}

          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={isLoading}
              className="flex-1 rounded-doodle border-doodle bg-white px-4 py-2.5 text-base font-bold text-black shadow-doodle-sm hover:bg-paper focus:outline-none active:translate-y-[2px] active:shadow-none hover:translate-y-[-2px] hover:shadow-doodle disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-doodle bg-pastel-blue border-doodle px-4 py-2.5 text-base font-bold text-black shadow-doodle hover:bg-blue-300 focus:outline-none active:translate-y-[2px] active:shadow-none hover:translate-y-[-2px] hover:shadow-[4px_6px_0px_0px_rgba(0,0,0,1)] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? "Saving…" : "Save expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
