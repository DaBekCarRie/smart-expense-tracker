"use client";

import type { OCRResult, ExpenseCreate } from "@/types";
import { formatDate, formatCurrency } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";

interface Props {
  result: OCRResult;
  onApply: (data: Partial<ExpenseCreate>) => void;
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color =
    pct >= 80
      ? "bg-green-100 text-green-700"
      : pct >= 50
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700";

  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold", color)}>
      {pct}% confidence
    </span>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-gray-900">
        {value ?? <span className="text-gray-400 font-normal">Not detected</span>}
      </dd>
    </div>
  );
}

export function OCRResultPreview({ result, onApply }: Props) {
  function handleApply() {
    const data: Partial<ExpenseCreate> = {};
    if (result.merchant) data.merchant = result.merchant;
    if (result.amount !== null) data.amount = result.amount;
    if (result.currency) data.currency = result.currency;
    if (result.expense_date) data.expense_date = result.expense_date;
    onApply(data);
  }

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-semibold text-blue-900">OCR Extraction Result</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <ConfidenceBadge confidence={result.confidence} />
          {result.cached && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
              Cached
            </span>
          )}
          <span className="text-xs text-gray-500">
            {result.processing_time_ms}ms
          </span>
        </div>
      </div>

      {/* Extracted fields */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Field label="Merchant" value={result.merchant} />
        <Field
          label="Amount"
          value={
            result.amount !== null && result.currency
              ? formatCurrency(result.amount, result.currency)
              : result.amount !== null
              ? String(result.amount)
              : null
          }
        />
        <Field label="Currency" value={result.currency} />
        <Field
          label="Date"
          value={result.expense_date ? formatDate(result.expense_date) : null}
        />
      </dl>

      {/* Apply button */}
      <button
        type="button"
        onClick={handleApply}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        Apply to form
      </button>
    </div>
  );
}
