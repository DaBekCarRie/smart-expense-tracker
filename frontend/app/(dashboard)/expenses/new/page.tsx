"use client";

import Link from "next/link";
import { useState, type FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCreateExpense, useCategories } from "@/lib/hooks/useExpenses";
import { ReceiptUploader } from "@/components/upload/ReceiptUploader";
import { DateInput } from "@/components/ui/date-input";
import { SpinnerOverlay } from "@/components/ui/LoadingStates";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ExpenseCreate, ExpenseItemCreate, OCRResult } from "@/types";
import { formatCurrency } from "@/lib/utils/formatters";
import { Plus, Trash2, Camera, Receipt, Box, FileText, ChevronRight, ChevronDown } from "lucide-react";
import { useTranslation } from "@/lib/i18n/LanguageContext";

const CURRENCIES = ["THB", "USD", "EUR", "GBP", "JPY", "SGD", "AUD", "CAD"];

const UNIT_KEYS = ["kg", "g", "L", "ml", "pcs", "pack", "bottle", "bag", "box", "can", "unit"] as const;
type UnitKey = typeof UNIT_KEYS[number];

const UNIT_LABEL_KEY: Record<UnitKey, keyof import("@/lib/i18n/types").TranslationDictionary> = {
  kg: "unitKg", g: "unitG", L: "unitL", ml: "unitMl",
  pcs: "unitPcs", pack: "unitPack", bottle: "unitBottle",
  bag: "unitBag", box: "unitBox", can: "unitCan", unit: "unitUnit",
};

function today(): string {
  return new Date().toISOString().split("T")[0];
}

export default function NewExpensePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const createExpense = useCreateExpense();
  const { data: categories } = useCategories();

  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("THB");
  const [expenseDate, setExpenseDate] = useState(today());
  const [notes, setNotes] = useState("");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Line items state
  const [items, setItems] = useState<ExpenseItemCreate[]>([]);

  // Track open dropdown for manual items unit field
  const [openDropdownIdx, setOpenDropdownIdx] = useState<number | null>(null);

  // Close unit dropdowns when clicking outside
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".unit-selector-container")) {
        setOpenDropdownIdx(null);
      }
    };
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  // Calculate items total
  const itemsTotal = items.reduce((sum, item) => sum + Number(item.price || 0), 0);
  const showSyncWarning = items.length > 0 && Math.abs(parseFloat(amount || "0") - itemsTotal) > 0.01;

  const handleSyncAmount = () => {
    setAmount(itemsTotal.toFixed(2));
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        name: "",
        quantity: 1,
        unit: t.unitUnit || "หน่วย",
        price: 0,
        unit_price: 0,
        expiry_date: null,
        category_id: null,
      },
    ]);
  };

  const handleItemChange = (index: number, key: keyof ExpenseItemCreate, value: any) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const updated = { ...item, [key]: value };

        // Auto-calculate unit_price if price or quantity changed
        if (key === "price" || key === "quantity") {
          const qty = Number(key === "quantity" ? value : updated.quantity) || 1;
          const total = Number(key === "price" ? value : updated.price) || 0;
          updated.unit_price = Number((total / qty).toFixed(2));
        }

        // Auto-calculate total price if unit_price changed
        if (key === "unit_price") {
          const qty = Number(updated.quantity) || 1;
          const unitPr = Number(value) || 0;
          updated.price = Number((unitPr * qty).toFixed(2));
        }

        return updated;
      })
    );
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleOCRApply = (result: OCRResult) => {
    if (result.merchant) setMerchant(result.merchant);
    if (result.amount !== undefined && result.amount !== null) setAmount(String(result.amount));
    if (result.currency) setCurrency(result.currency);
    if (result.expense_date) setExpenseDate(result.expense_date);
    if (result.receipt_url) setReceiptUrl(result.receipt_url);
    if (result.items) {
      setItems(result.items.map((ocrItem) => {
        const matchedCat = categories?.find(
          (c) => c.name.toLowerCase() === (ocrItem.category ?? "").toLowerCase()
        );
        return {
          name: ocrItem.name,
          quantity: ocrItem.quantity,
          unit: ocrItem.unit || t.unitUnit || "หน่วย",
          price: Number(ocrItem.price ?? 0),
          unit_price: Number(ocrItem.unit_price ?? ocrItem.price ?? 0),
          expiry_date: null,
          category_id: matchedCat?.id ?? null,
        };
      }));
    }
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError(t.error);
      return;
    }

    // Validate items
    for (let i = 0; i < items.length; i++) {
      if (!items[i].name.trim()) {
        setError(`${t.newExpenseColItemName} #${i + 1}: ${t.required}`);
        return;
      }
      if (items[i].quantity <= 0) {
        setError(`${t.newExpenseColItemName} #${i + 1} "${items[i].name}": ${t.required}`);
        return;
      }
    }

    const payload: ExpenseCreate = {
      merchant: merchant.trim(),
      amount: parsedAmount,
      currency,
      expense_date: expenseDate,
      notes: notes.trim() || null,
      receipt_url: receiptUrl,
      items: items.map((item) => ({
        name: item.name.trim(),
        quantity: Number(item.quantity),
        unit: item.unit ? item.unit.trim() : "unit",
        price: Number(item.price),
        unit_price: Number(item.unit_price),
        expiry_date: item.expiry_date || null,
        category_id: item.category_id ?? null,
      })),
    };

    try {
      await createExpense.mutateAsync(payload);
      router.push("/expenses");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t.error;
      setError(message);
    }
  }

  const isLoading = createExpense.isPending;

  return (
    <div className="relative max-w-5xl mx-auto flex flex-col gap-6 py-8 px-5 lg:px-0">
      {isLoading && <SpinnerOverlay />}
      {/* Breadcrumb & Title */}
      <div>
        <div className="flex items-center gap-1.5 text-sm font-bold text-gray-500 mb-2">
          <Link href="/expenses" className="hover:text-black transition-colors">{t.newExpenseBreadcrumb}</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-400">{t.newExpenseAddNew}</span>
        </div>
        <h1 className="text-3xl font-bold text-black tracking-tight leading-tight">
          {t.newExpenseTitle}
        </h1>
      </div>

      <form onSubmit={handleSubmit} noValidate className="contents">

        {/* Receipt Scan Section */}
        <section className="bg-[#fffdf7] rounded-doodle border-doodle border-[2.5px] shadow-doodle p-6">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-400 mb-4 whitespace-nowrap">
            <Camera className="w-4 h-4" /> {t.newExpenseScanSection}
            <span className="text-[11px] bg-pastel-purple border-2 border-black rounded-doodle px-2 py-0.5 text-black ml-2 shadow-doodle-sm">{t.newExpenseRecommended}</span>
          </div>

          <ReceiptUploader onApply={handleOCRApply} />
        </section>

        {/* Receipt Details Section */}
        <section className="bg-[#fffdf7] rounded-doodle-2 border-doodle border-[2.5px] shadow-doodle p-6">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-400 mb-5">
            <Receipt className="w-4 h-4" /> {t.newExpenseDetailsSection}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Merchant */}
            <div className="space-y-1.5">
              <label htmlFor="merchant" className="flex items-baseline gap-1.5 text-xs font-bold text-gray-400">
                {t.newExpenseMerchantLabel} <span className="text-red-500 font-normal">*</span>
              </label>
              <input
                id="merchant"
                type="text"
                required
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="e.g. Makro, Market"
                className="w-full h-[54px] bg-[#fbf8ef] rounded-doodle-input border-2 border-black px-4 text-xl font-bold focus:outline-none focus:shadow-doodle-sm transition-all"
                disabled={isLoading}
              />
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="flex items-baseline gap-1.5 text-xs font-bold text-gray-400">
                {t.newExpenseDateLabel} <span className="text-red-500 font-normal">*</span>
              </label>
              <DateInput
                id="expense_date"
                value={expenseDate}
                onChange={setExpenseDate}
                disabled={isLoading}
                buttonClassName="h-[54px] text-xl bg-[#fbf8ef] border-2 border-black"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[2fr_100px] gap-4">
            {/* Amount */}
            <div className="space-y-1.5">
              <label htmlFor="amount" className="flex items-baseline gap-1.5 text-xs font-bold text-gray-400">
                {t.newExpenseAmountLabel} <span className="text-red-500 font-normal">*</span>
              </label>
              <div className="relative">
                <input
                  id="amount"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-[54px] bg-highlight rounded-doodle-input border-2 border-black px-4 text-2xl font-bold focus:outline-none focus:shadow-doodle-sm transition-all"
                  disabled={isLoading}
                />
              </div>
              <p className="text-[11px] font-bold text-gray-400 mt-1.5">{t.newExpenseAmountNote}</p>
            </div>

            {/* Currency */}
            <div className="space-y-1.5">
              <label htmlFor="currency" className="flex items-baseline gap-1.5 text-xs font-bold text-gray-400">
                Currency
              </label>
              <Select value={currency} onValueChange={setCurrency} disabled={isLoading}>
                <SelectTrigger id="currency" className="bg-[#fbf8ef] text-base font-bold px-3 h-[54px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c} className="font-bold">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Sync warning notification */}
        {showSyncWarning && (
          <div className="rounded-doodle bg-pastel-yellow border-2 border-black p-4 text-sm font-bold text-black flex items-center justify-between shadow-doodle-sm">
            <span className="flex items-center gap-2">
              ⚠️ {t.newExpenseSyncWarning} ({formatCurrency(itemsTotal, currency)} ≠ {formatCurrency(parseFloat(amount || "0"), currency)})
            </span>
            <button
              type="button"
              onClick={handleSyncAmount}
              className="px-4 py-1.5 rounded-doodle bg-white border-2 border-black font-bold text-xs hover:bg-[#fffdf0] shadow-doodle-sm transition-all active:translate-y-[1px] active:shadow-none"
            >
              🔄 {t.newExpenseSyncAmount}
            </button>
          </div>
        )}

        {/* Line items section */}
        <section className="bg-[#fffdf7] rounded-doodle border-doodle border-[3px] shadow-[7px_8px_0px_0px_rgba(0,0,0,1)] p-6">
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <div className="flex items-center gap-2.5 text-xl font-bold text-black tracking-wide">
              <Box className="w-5 h-5" /> {t.newExpenseItemsTitle}
              <span className="text-sm bg-highlight border-2 border-black rounded-doodle px-2.5 py-0.5 shadow-doodle-sm">
                {items.length}
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddItem}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-doodle bg-pastel-green border-2 border-black text-sm font-bold text-black shadow-doodle-sm hover:bg-green-300 hover:translate-y-[-1px] hover:shadow-doodle active:translate-y-[1px] active:shadow-none transition-all"
            >
              <Plus className="w-4 h-4" strokeWidth={3} /> {t.newExpenseAddItem}
            </button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-8 px-6 bg-[#fbf8ef] rounded-doodle border-2 border-black border-dashed text-gray-500 font-bold leading-relaxed">
              {t.newExpenseNoItems}
            </div>
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto pb-4">
                <div className="min-w-[860px]">
                  {/* Header */}
                  <div className="grid grid-cols-[2fr_.7fr_1fr_.95fr_1fr_1.15fr_1.4fr_34px] gap-2.5 items-center px-1 pb-3 mb-1 border-b-[2.5px] border-black">
                    <div className="text-[12px] font-bold text-gray-400 text-center">{t.newExpenseColItemName}</div>
                    <div className="text-[12px] font-bold text-gray-400 text-center">{t.newExpenseColQty}</div>
                    <div className="text-[12px] font-bold text-gray-400 text-center">{t.newExpenseColUnit}</div>
                    <div className="text-[12px] font-bold text-gray-400 text-center">{t.newExpenseColPriceUnit}</div>
                    <div className="text-[12px] font-bold text-gray-400 text-center">{t.newExpenseColTotal}</div>
                    <div className="text-[12px] font-bold text-gray-400 text-center">{t.newExpenseColExpiry}</div>
                    <div className="text-[12px] font-bold text-gray-400 text-center">🏷️ {t.newExpenseColCategory}</div>
                    <div></div>
                  </div>

                  {/* Rows */}
                  <div className="space-y-0">
                    {items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-[2fr_.7fr_1fr_.95fr_1fr_1.15fr_1.4fr_34px] gap-2.5 items-center py-3 px-1 border-b-2 border-black border-dashed last:border-b-0">
                        <input
                          type="text"
                          required
                          value={item.name}
                          placeholder="Item name…"
                          onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                          className="w-full bg-white rounded-doodle-input border-2 border-black px-3 py-2 text-base font-bold focus:outline-none focus:shadow-doodle-sm"
                          disabled={isLoading}
                        />
                        <input
                          type="number"
                          required
                          min="0.01"
                          step="any"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                          className="w-full bg-[#fbf8ef] rounded-doodle-input border-2 border-black px-1.5 py-2 text-base font-bold text-center focus:outline-none focus:shadow-doodle-sm"
                          disabled={isLoading}
                        />
                        <div className="relative unit-selector-container w-full">
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              required
                              value={item.unit || ""}
                              placeholder={t.newExpenseColUnit}
                              onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
                              onFocus={() => setOpenDropdownIdx(idx)}
                              className="w-full bg-[#fbf8ef] rounded-doodle-input border-2 border-black pl-2 pr-7 py-2 text-sm font-bold text-center focus:outline-none focus:shadow-doodle-sm"
                              disabled={isLoading}
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownIdx(openDropdownIdx === idx ? null : idx);
                              }}
                              disabled={isLoading}
                              className="absolute right-2 text-black hover:scale-110 transition-transform active:scale-95 flex items-center justify-center"
                            >
                              <ChevronDown className="w-4 h-4" strokeWidth={2.5} />
                            </button>
                          </div>
                          {openDropdownIdx === idx && (
                            <div className="absolute left-0 mt-1.5 w-full min-w-[120px] bg-white border-2 border-black rounded-doodle-input shadow-doodle z-50 max-h-[200px] overflow-y-auto">
                              {UNIT_KEYS.map((u) => {
                                const label = t[UNIT_LABEL_KEY[u]];
                                return (
                                  <button
                                    key={u}
                                    type="button"
                                    onClick={() => {
                                      handleItemChange(idx, "unit", label);
                                      setOpenDropdownIdx(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-sm font-bold text-black hover:bg-highlight transition-colors border-b last:border-b-0 border-black/10"
                                  >
                                    {label}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(idx, "unit_price", e.target.value)}
                          className="w-full bg-[#fbf8ef] rounded-doodle-input border-2 border-black px-2 py-2 text-[15px] font-bold text-right focus:outline-none focus:shadow-doodle-sm"
                          disabled={isLoading}
                        />
                        <div className="bg-highlight rounded-doodle border-2 border-black px-2.5 py-2 text-right text-lg font-bold">
                          {(Number(item.price || 0)).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </div>
                        <DateInput
                          value={item.expiry_date || ""}
                          onChange={(iso) => handleItemChange(idx, "expiry_date", iso || null)}
                          disabled={isLoading}
                          placeholder="Expiry date"
                          align="right"
                          className="w-full"
                        />
                        {/* Category select per item */}
                        <Select
                          value={String(item.category_id ?? "none")}
                          onValueChange={(val) => handleItemChange(idx, "category_id", val === "none" ? null : Number(val))}
                          disabled={isLoading}
                        >
                          <SelectTrigger className="h-[38px] text-xs font-bold bg-[#fbf8ef] border-2 border-black px-2">
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none" className="font-bold text-xs">—</SelectItem>
                            {(categories ?? []).map((cat) => (
                              <SelectItem key={cat.id} value={String(cat.id)} className="font-bold text-xs">
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={isLoading}
                          className="w-8 h-8 flex items-center justify-center text-red-500 hover:scale-110 transition-transform active:scale-95"
                          title="ลบรายการ"
                        >
                          <Trash2 className="w-4.5 h-4.5" strokeWidth={2.5} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Grand Total Footer */}
                  <div className="flex items-center justify-end gap-4 mt-6 pt-4 border-t-[2.5px] border-black">
                    <span className="text-[15px] font-bold text-gray-500">{t.newExpenseBillTotal}</span>
                    <div className="bg-highlight rounded-doodle border-[3px] border-black px-5 py-1.5 shadow-doodle-sm text-3xl font-bold">
                      {formatCurrency(itemsTotal, currency)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile View */}
              <div className="block md:hidden space-y-4">
                {items.map((item, idx) => (
                  <div key={idx} className="bg-[#fbf8ef] rounded-doodle border-2 border-black shadow-doodle p-4 space-y-3 relative">
                    {/* Header: Item # with Delete */}
                    <div className="flex justify-between items-center pb-2 border-b border-black/10">
                      <span className="font-bold text-sm text-black">
                        #{idx + 1} {item.name ? `- ${item.name}` : ""}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={isLoading}
                        className="w-9 h-9 flex items-center justify-center text-red-500 border border-black/30 rounded-doodle hover:border-black hover:bg-pastel-pink transition-all active:scale-95"
                        title="ลบรายการ"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={2} />
                      </button>
                    </div>

                    {/* Name input */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {t.newExpenseColItemName} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={item.name}
                        placeholder="Item name…"
                        onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                        className="w-full bg-white rounded-doodle-input border-2 border-black px-3 py-2 text-base font-bold focus:outline-none focus:shadow-doodle-sm"
                        disabled={isLoading}
                      />
                    </div>

                    {/* Quantity & Unit inputs */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          {t.newExpenseColQty} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          min="0.01"
                          step="any"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                          className="w-full h-11 bg-white rounded-doodle-input border-2 border-black px-2 py-1 text-base font-bold text-center focus:outline-none focus:shadow-doodle-sm"
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-1 relative unit-selector-container">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          {t.newExpenseColUnit}
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            required
                            value={item.unit || ""}
                            placeholder={t.newExpenseColUnit}
                            onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
                            onFocus={() => setOpenDropdownIdx(idx)}
                            className="w-full h-11 bg-white rounded-doodle-input border-2 border-black pl-2 pr-7 py-1 text-sm font-bold text-center focus:outline-none focus:shadow-doodle-sm"
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownIdx(openDropdownIdx === idx ? null : idx);
                            }}
                            disabled={isLoading}
                            className="absolute right-2 text-black hover:scale-110 transition-transform active:scale-95 flex items-center justify-center"
                          >
                            <ChevronDown className="w-4 h-4" strokeWidth={2.5} />
                          </button>
                        </div>
                        {openDropdownIdx === idx && (
                          <div className="absolute left-0 mt-1.5 w-full min-w-[120px] bg-white border-2 border-black rounded-doodle-input shadow-doodle z-50 max-h-[160px] overflow-y-auto">
                            {UNIT_KEYS.map((u) => {
                              const label = t[UNIT_LABEL_KEY[u]];
                              return (
                                <button
                                  key={u}
                                  type="button"
                                  onClick={() => {
                                    handleItemChange(idx, "unit", label);
                                    setOpenDropdownIdx(null);
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-sm font-bold text-black hover:bg-highlight transition-colors border-b last:border-b-0 border-black/10"
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price per Unit & Total */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          {t.newExpenseColPriceUnit}
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(idx, "unit_price", e.target.value)}
                          className="w-full h-11 bg-white rounded-doodle-input border-2 border-black px-2 py-1 text-[15px] font-bold text-right focus:outline-none focus:shadow-doodle-sm"
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          {t.newExpenseColTotal}
                        </label>
                        <div className="bg-highlight rounded-doodle border-2 border-black px-3 h-11 flex items-center justify-end text-right text-base font-bold">
                          {(Number(item.price || 0)).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>

                    {/* Expiry date & Category inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          {t.newExpenseColExpiry}
                        </label>
                        <DateInput
                          value={item.expiry_date || ""}
                          onChange={(iso) => handleItemChange(idx, "expiry_date", iso || null)}
                          disabled={isLoading}
                          placeholder="Expiry date"
                          align="right"
                          className="w-full"
                          buttonClassName="h-11 text-sm bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          🏷️ {t.newExpenseColCategory}
                        </label>
                        <Select
                          value={String(item.category_id ?? "none")}
                          onValueChange={(val) => handleItemChange(idx, "category_id", val === "none" ? null : Number(val))}
                          disabled={isLoading}
                        >
                          <SelectTrigger className="h-11 text-xs font-bold bg-white border-2 border-black px-2">
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none" className="font-bold text-xs">—</SelectItem>
                            {(categories ?? []).map((cat) => (
                              <SelectItem key={cat.id} value={String(cat.id)} className="font-bold text-xs">
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Grand Total Footer for Mobile */}
                <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t-[2.5px] border-black">
                  <span className="text-[15px] font-bold text-gray-500">{t.newExpenseBillTotal}</span>
                  <div className="bg-highlight rounded-doodle border-[3px] border-black px-5 py-1.5 shadow-doodle-sm text-2xl font-bold">
                    {formatCurrency(itemsTotal, currency)}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Notes */}
        <section className="bg-[#fffdf7] rounded-doodle-2 border-doodle border-[2.5px] shadow-doodle p-6">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-400 mb-4">
            <FileText className="w-4 h-4" /> {t.newExpenseNotesSection}
          </div>
          <textarea
            id="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes..."
            className="w-full bg-[#fbf8ef] rounded-doodle border-2 border-black px-4 py-3 text-base font-bold focus:outline-none focus:shadow-doodle-sm transition-all resize-none min-h-[80px]"
            disabled={isLoading}
          />
        </section>

        {error && (
          <div className="rounded-doodle bg-pastel-pink border-2 border-black shadow-doodle-sm p-4 text-base font-bold text-black">
            ⚠️ {error}
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 pt-2 mb-12">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isLoading}
            className="rounded-doodle-2 border-[2.5px] border-black bg-[#fffdf7] px-3 py-2.5 sm:px-6 sm:py-4 text-base sm:text-xl font-bold text-black shadow-doodle hover:translate-y-[-1px] hover:shadow-[5px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all"
          >
            {t.expensesCancel}
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-doodle-2 border-[2.5px] border-black bg-pastel-blue px-3 py-2.5 sm:px-6 sm:py-4 text-base sm:text-xl font-bold text-black shadow-doodle hover:translate-y-[-1px] hover:shadow-[5px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all"
          >
            {isLoading ? t.newExpenseSaving : t.newExpenseSave}
          </button>
        </div>
      </form>
    </div>
  );
}
