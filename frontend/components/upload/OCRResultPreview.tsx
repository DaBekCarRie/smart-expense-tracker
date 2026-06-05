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
      ? "bg-pastel-green text-black"
      : pct >= 50
      ? "bg-pastel-yellow text-black"
      : "bg-pastel-pink text-black";

  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-doodle border-2 border-black shadow-doodle-sm text-xs font-bold", color)}>
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
      <dt className="text-xs font-bold text-gray-700 tracking-wide uppercase">{label}</dt>
      <dd className="mt-0.5 text-base font-bold text-black">
        {value ?? <span className="text-gray-500 font-sans font-normal">Not detected</span>}
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
    if (result.receipt_url) data.receipt_url = result.receipt_url;
    onApply(data);
  }

  return (
    <div className="rounded-doodle border-doodle bg-pastel-blue p-5 space-y-5 shadow-doodle">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b-2 border-black pb-2">
        <h3 className="text-lg font-bold text-black tracking-wide">OCR Extraction Result</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <ConfidenceBadge confidence={result.confidence} />
          {result.cached && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-doodle border-2 border-black shadow-doodle-sm text-xs font-bold bg-pastel-purple text-black">
              Cached
            </span>
          )}
          <span className="text-xs font-bold text-gray-700 bg-white border-2 border-black px-2 py-0.5 rounded-doodle shadow-doodle-sm">
            {result.processing_time_ms}ms
          </span>
        </div>
      </div>

      {/* Extracted fields */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
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
        className="w-full rounded-doodle border-doodle bg-white px-4 py-2.5 text-base font-bold text-black shadow-doodle hover:bg-paper hover:translate-y-[-2px] hover:shadow-[4px_6px_0px_0px_rgba(0,0,0,1)] focus:outline-none active:translate-y-[2px] active:shadow-none transition-all"
      >
        Apply to form
      </button>
    </div>
  );
}
