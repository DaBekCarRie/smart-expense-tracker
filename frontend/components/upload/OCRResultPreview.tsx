"use client";

import type { OCRResult } from "@/types";
import { formatDate, formatCurrency } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface Props {
  result: OCRResult;
  onApply: (result: OCRResult) => void;
}

function ConfidenceBadge({ confidence, label }: { confidence: number; label: string }) {
  const pct = Math.round(confidence * 100);
  const color =
    pct >= 80
      ? "bg-pastel-green text-black"
      : pct >= 50
      ? "bg-pastel-yellow text-black"
      : "bg-pastel-pink text-black";

  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-doodle border-2 border-black shadow-doodle-sm text-xs font-bold", color)}>
      {pct}% {label}
    </span>
  );
}

function Field({ label, value, notDetected }: { label: string; value: string | null | undefined; notDetected: string }) {
  return (
    <div className="bg-white border-2 border-black rounded-doodle-2 p-3 shadow-doodle-sm flex flex-col justify-between">
      <dt className="text-[11px] font-bold text-black/60 tracking-wider uppercase">{label}</dt>
      <dd className="mt-1 text-base font-bold text-black break-words">
        {value ?? <span className="text-black/35 font-normal italic">{notDetected}</span>}
      </dd>
    </div>
  );
}

export function OCRResultPreview({ result, onApply }: Props) {
  const { t } = useTranslation();

  function handleApply() {
    onApply(result);
  }

  return (
    <div className="rounded-doodle border-doodle bg-pastel-blue p-5 space-y-5 shadow-doodle">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b-2 border-black pb-2">
        <h3 className="text-lg font-bold text-black tracking-wide">{t.ocrResultTitle}</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <ConfidenceBadge confidence={result.confidence} label={t.ocrConfidenceBadge} />
        </div>
      </div>

      {/* Extracted fields */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
        <Field label={t.ocrMerchant} value={result.merchant} notDetected={t.ocrNotDetected} />
        <Field
          label={t.ocrAmount}
          value={
            result.amount !== null && result.currency
              ? formatCurrency(result.amount, result.currency)
              : result.amount !== null
              ? String(result.amount)
              : null
          }
          notDetected={t.ocrNotDetected}
        />
        <Field label={t.ocrCurrency} value={result.currency} notDetected={t.ocrNotDetected} />
        <Field
          label={t.ocrDate}
          value={result.expense_date ? formatDate(result.expense_date) : null}
          notDetected={t.ocrNotDetected}
        />
      </dl>

      {/* Extracted Items */}
      {result.items && result.items.length > 0 && (
        <div className="border-t-2 border-black border-dashed pt-4">
          <h4 className="text-sm font-bold text-black tracking-wider uppercase mb-3">
            {t.ocrExtractedItems} ({result.items.length})
          </h4>
          <div className="space-y-2.5">
            {result.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm font-bold text-black bg-white p-2.5 rounded-doodle-2 border-2 border-black shadow-doodle-sm">
                <span>{item.name} x {item.quantity} {item.unit || ""}</span>
                <span className="shrink-0 ml-4">{item.price !== null ? formatCurrency(Number(item.price), result.currency || "USD") : ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Apply button */}
      <button
        type="button"
        onClick={handleApply}
        className="w-full rounded-doodle border-doodle bg-white px-4 py-2.5 text-base font-bold text-black shadow-doodle hover:bg-paper hover:translate-y-[-2px] hover:shadow-[4px_6px_0px_0px_rgba(0,0,0,1)] focus:outline-none active:translate-y-[2px] active:shadow-none transition-all"
      >
        {t.ocrApplyToForm}
      </button>
    </div>
  );
}
