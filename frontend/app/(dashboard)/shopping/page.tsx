"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  getShoppingList,
  createShoppingItem,
  toggleShoppingItem,
  deleteShoppingItem,
  autoGenerateShoppingList,
} from "@/lib/api/inventory";
import type { ShoppingListItem } from "@/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown } from "lucide-react";

const UNIT_KEYS = ["kg", "g", "L", "ml", "pcs", "pack", "bottle", "bag", "box", "can", "unit"] as const;
type UnitKey = typeof UNIT_KEYS[number];

const UNIT_LABEL_KEY: Record<UnitKey, keyof import("@/lib/i18n/types").TranslationDictionary> = {
  kg: "unitKg", g: "unitG", L: "unitL", ml: "unitMl",
  pcs: "unitPcs", pack: "unitPack", bottle: "unitBottle",
  bag: "unitBag", box: "unitBox", can: "unitCan", unit: "unitUnit",
};

function ShoppingSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="space-y-8 min-h-screen pb-12 p-4 md:p-8 max-w-5xl mx-auto animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-40 rounded-doodle" />
      </div>

      <div className="flex flex-col gap-8">
        {/* Left Card: Form Skeleton */}
        <div className="w-full bg-paper rounded-doodle border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5">
          <Skeleton className="h-5 w-36 mb-6" />
          <div className="space-y-4">
            <div>
              <Skeleton className="h-3.5 w-16 mb-2" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Skeleton className="h-3.5 w-16 mb-2" />
                <Skeleton className="h-9 w-full" />
              </div>
              <div>
                <Skeleton className="h-3.5 w-16 mb-2" />
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
            <Skeleton className="h-10 w-full mt-4" />
          </div>
        </div>

        {/* Right Card: List Skeleton */}
        <div className="w-full bg-paper rounded-doodle border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 min-h-[400px]">
          <div className="flex justify-between items-center mb-6 pb-2 border-b border-black border-dashed">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-doodle border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] bg-[#faf8f5]">
                <div className="flex items-center gap-3 w-3/4">
                  <Skeleton className="h-6 w-6 rounded shrink-0" />
                  <div className="space-y-2 w-full">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
                <Skeleton className="h-8 w-8 rounded-doodle shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShoppingListPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(false);

  // Custom Toast State
  const [toasts, setToasts] = useState<{
    id: string;
    title: string;
    description: string;
    variant: "default" | "success" | "destructive";
  }[]>([]);

  const showToast = (
    title: string,
    description: string,
    variant: "default" | "success" | "destructive" = "default"
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".unit-selector-container")) {
        setOpenDropdown(false);
      }
    };
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  const fetchList = async () => {
    try {
      setIsLoading(true);
      const data = await getShoppingList();
      setItems(sortItems(data));
      setError(null);
    } catch (err) {
      console.error(err);
      setError(t.error);
    } finally {
      setIsLoading(false);
    }
  };

  const sortItems = (list: ShoppingListItem[]) => {
    return [...list].sort((a, b) => {
      if (a.is_purchased === b.is_purchased)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return a.is_purchased ? 1 : -1;
    });
  };

  useEffect(() => { fetchList(); }, []);

  const handleCreateItem = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) return;
    const qtyVal = parseFloat(quantity);
    if (isNaN(qtyVal) || qtyVal <= 0) {
      showToast(t.error, "", "destructive");
      return;
    }
    setIsAdding(true);
    try {
      const newItem = await createShoppingItem(name.trim(), qtyVal, unit.trim() || t.inventoryUnit);
      setItems((prev) => sortItems([newItem, ...prev]));
      setName("");
      setQuantity("1");
      setUnit("");
      showToast(t.success, "", "success");
    } catch (err) {
      console.error(err);
      showToast(t.error, "", "destructive");
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleItem = async (itemId: string) => {
    try {
      const updated = await toggleShoppingItem(itemId);
      setItems((prev) => sortItems(prev.map((item) => (item.id === itemId ? updated : item))));
    } catch (err) {
      console.error(err);
      showToast(t.error, "", "destructive");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteShoppingItem(itemId);
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (err) {
      console.error(err);
      showToast(t.error, "", "destructive");
    }
  };

  const handleAutoGenerate = async () => {
    setIsAutoGenerating(true);
    setError(null);
    try {
      const newItems = await autoGenerateShoppingList();
      if (newItems.length === 0) {
        showToast(
          t.shoppingAutoGenerateEmptyTitle,
          t.shoppingAutoGenerateEmptyDesc,
          "default"
        );
      } else {
        showToast(
          t.shoppingAutoGenerateSuccessTitle,
          t.shoppingAutoGenerateSuccessDesc.replace("{count}", String(newItems.length)),
          "success"
        );
        fetchList();
      }
    } catch (err) {
      console.error(err);
      setError(t.error);
      showToast(t.error, "", "destructive");
    } finally {
      setIsAutoGenerating(false);
    }
  };

  if (isLoading) {
    return <ShoppingSkeleton />;
  }

  return (
    <div className="space-y-8 min-h-screen pb-12 p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b-2 border-black border-dashed">
        <div>
          <h1 className="text-3xl font-bold text-black tracking-wide font-sans">
            🛒 {t.shoppingTitle}
          </h1>
          <p className="text-sm font-bold text-gray-600 mt-1">{t.shoppingDescription}</p>
        </div>
        <div className="flex flex-col items-stretch sm:items-end gap-1.5 min-w-[240px]">
          <button
            onClick={handleAutoGenerate}
            disabled={isAutoGenerating}
            className="flex-shrink-0 rounded-doodle bg-pastel-yellow border-2 border-black px-4 py-2.5 font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-200 active:translate-y-[2px] active:shadow-none disabled:opacity-50 transition-all text-sm flex items-center justify-center gap-2"
          >
            {isAutoGenerating ? "⏳ " + t.loading : "✨ " + t.shoppingAutoGenerate}
          </button>
          <span className="text-[11px] font-bold text-gray-500 text-left sm:text-right px-1 leading-normal">
            💡 {t.shoppingAutoGenerateDetail}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-pastel-pink border-2 border-black rounded-doodle p-4 text-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          ⚠️ {error}
        </div>
      )}

      <div className="flex flex-col gap-8">
        {/* Manual Add Form */}
        <div>
          <div className="bg-paper rounded-doodle border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5">
            <h2 className="text-lg font-bold text-black tracking-wide mb-4 pb-2 border-b border-black border-dashed">
              ✍️ {t.shoppingManualAddTitle}
            </h2>
            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  {t.shoppingItemName}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t.shoppingIngredientPlaceholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isAdding}
                  className="w-full rounded-doodle border-2 border-black bg-paper px-3 py-2 text-sm shadow-doodle-sm focus:outline-none focus:bg-[#fffdf0]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-black mb-1">
                    {t.shoppingQuantity}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    disabled={isAdding}
                    className="w-full rounded-doodle border-2 border-black bg-paper px-3 py-2 text-sm shadow-doodle-sm focus:outline-none focus:bg-[#fffdf0]"
                  />
                </div>
                <div className="relative unit-selector-container w-full">
                  <label className="block text-xs font-bold text-black mb-1">
                    {t.shoppingUnit}
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder="kg, pack…"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      onFocus={() => setOpenDropdown(true)}
                      disabled={isAdding}
                      className="w-full rounded-doodle border-2 border-black bg-paper pl-3 pr-8 py-2 text-sm shadow-doodle-sm focus:outline-none focus:bg-[#fffdf0]"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdown(!openDropdown);
                      }}
                      disabled={isAdding}
                      className="absolute right-2.5 text-black hover:scale-110 transition-transform active:scale-95 flex items-center justify-center"
                    >
                      <ChevronDown className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                  </div>
                  {openDropdown && (
                    <div className="absolute left-0 mt-1.5 w-full min-w-[120px] bg-white border-2 border-black rounded-doodle shadow-doodle z-50 max-h-[200px] overflow-y-auto">
                      {UNIT_KEYS.map((u) => {
                        const label = t[UNIT_LABEL_KEY[u]];
                        return (
                          <button
                            key={u}
                            type="button"
                            onClick={() => {
                              setUnit(label);
                              setOpenDropdown(false);
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

              <button
                type="submit"
                disabled={isAdding}
                className="w-full mt-2 rounded-doodle bg-pastel-blue border-2 border-black py-2 font-bold text-black shadow-doodle-sm hover:bg-blue-300 hover:translate-y-[-1px] hover:shadow-doodle active:translate-y-[1px] active:shadow-none disabled:opacity-50 transition-all text-sm"
              >
                {isAdding ? t.shoppingAdding : `➕ ${t.shoppingAddItem}`}
              </button>
            </form>
          </div>
        </div>

        {/* Checklist */}
        <div>
          <div className="bg-paper rounded-doodle border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 min-h-[400px]">
            <h2 className="text-xl font-bold text-black tracking-wide mb-6 pb-2 border-b border-black border-dashed flex justify-between items-center">
              <span>📝 {t.shoppingChecklistTitle}</span>
              <span className="text-xs px-3 py-1 bg-pastel-purple border border-black rounded-full text-black">
                {t.shoppingItemsRemaining} {items.filter((i) => !i.is_purchased).length}
              </span>
            </h2>

            {items.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-lg font-bold text-gray-500">{t.shoppingNoItems}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-4 rounded-doodle border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all ${
                      item.is_purchased
                        ? "bg-gray-100 opacity-60 line-through text-gray-500 shadow-none translate-y-[2px]"
                        : "bg-[#faf8f5] hover:bg-paper"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => handleToggleItem(item.id)}>
                      <div className={`w-6 h-6 border-2 border-black rounded flex items-center justify-center flex-shrink-0 transition-colors ${item.is_purchased ? "bg-pastel-green" : "bg-paper"}`}>
                        {item.is_purchased && (
                          <svg className="w-4 h-4 text-black stroke-[3px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className={`font-bold text-base block truncate ${item.is_purchased ? "line-through text-gray-400" : "text-black"}`}>
                          {item.name}
                        </span>
                        <span className="text-xs text-gray-500 block mt-0.5">
                          {t.shoppingOrderQty} {item.quantity} {item.unit}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 rounded-doodle border-2 border-transparent hover:border-black hover:bg-pastel-pink text-gray-400 hover:text-black transition-all"
                      title={t.shoppingDelete}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full p-4 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-doodle border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all animate-fadeIn ${
              toast.variant === "success"
                ? "bg-pastel-green"
                : toast.variant === "destructive"
                ? "bg-pastel-pink"
                : "bg-pastel-blue"
            }`}
          >
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1">
                <h4 className="font-bold text-black text-sm">{toast.title}</h4>
                {toast.description && (
                  <p className="text-xs text-gray-700 mt-1 font-bold font-sans leading-normal">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-black hover:scale-110 active:scale-95 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border border-black/20 bg-black/5"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
