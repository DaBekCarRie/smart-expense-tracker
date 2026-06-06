"use client";

import { useEffect, useState, useMemo } from "react";
import { getInventory, adjustStock, updateMinStock, deleteProduct } from "@/lib/api/inventory";
import type { Product } from "@/types";
import { formatCurrency } from "@/lib/utils/formatters";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function InventorySkeleton() {
  const { t } = useTranslation();
  return (
    <div className="space-y-8 min-h-screen pb-12 p-4 md:p-8 max-w-5xl mx-auto animate-fadeIn">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[#faf8f5] rounded-doodle border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
            <Skeleton className="h-3.5 w-24 mb-3" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Skeleton className="w-full h-11" />
      </div>

      {/* Table Skeleton */}
      <div className="bg-[#fffdf7] rounded-doodle border-[3px] border-black shadow-[6px_7px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-black text-white">
                <th className="text-left text-[11px] font-bold uppercase tracking-widest px-4 py-3 whitespace-nowrap">
                  {t.inventoryProductName}
                </th>
                <th className="text-center text-[11px] font-bold uppercase tracking-widest px-4 py-3 whitespace-nowrap">
                  {t.inventoryCurrentStockLabel}
                </th>
                <th className="text-left text-[11px] font-bold uppercase tracking-widest px-4 py-3 whitespace-nowrap">
                  {t.inventoryMinStock}
                </th>
                <th className="text-right text-[11px] font-bold uppercase tracking-widest px-4 py-3 whitespace-nowrap">
                  {t.inventoryLastPrice}
                </th>
                <th className="text-right text-[11px] font-bold uppercase tracking-widest px-4 py-3 whitespace-nowrap">
                  {t.inventoryAvgPrice}
                </th>
                <th className="text-center text-[11px] font-bold uppercase tracking-widest px-4 py-3 whitespace-nowrap">
                  {t.inventoryBatches}
                </th>
                <th className="text-center text-[11px] font-bold uppercase tracking-widest px-4 py-3 whitespace-nowrap">
                  Adjust
                </th>
                <th className="text-center text-[11px] font-bold uppercase tracking-widest px-4 py-3 whitespace-nowrap">
                  {t.inventoryDelete}
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 4 }).map((_, r) => (
                <tr key={r} className="border-b-2 border-black/10 last:border-b-0">
                  <td className="px-4 py-4">
                    <Skeleton className="h-4 w-32" />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <Skeleton className="h-4 w-12 mx-auto" />
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-4 w-20" />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <Skeleton className="h-4 w-10 mx-auto" />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <Skeleton className="h-4 w-16 mx-auto" />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <Skeleton className="h-4 w-8 mx-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editingMinStockId, setEditingMinStockId] = useState<string | null>(null);
  const [minStockValue, setMinStockValue] = useState<string>("");
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [isAdjusting, setIsAdjusting] = useState<Record<string, boolean>>({});

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const data = await getInventory();
      setProducts(data);
      setError(null);
    } catch (err: unknown) {
      console.error(err);
      setError(t.error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, []);

  const filteredProducts = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [products, search]
  );

  const getExpiryStatus = (expiryDateStr: string | null) => {
    if (!expiryDateStr) return "none";
    const expiry = new Date(expiryDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "expired";
    if (diffDays <= 3) return "soon";
    return "ok";
  };

  const stats = useMemo(() => {
    let lowStock = 0, expiredBatches = 0, soonBatches = 0;
    products.forEach((p) => {
      if (p.min_stock !== null && p.current_stock < p.min_stock) lowStock++;
      p.batches.forEach((b) => {
        const s = getExpiryStatus(b.expiry_date);
        if (s === "expired") expiredBatches++;
        if (s === "soon") soonBatches++;
      });
    });
    return { totalItems: products.length, lowStock, expiredBatches, soonBatches };
  }, [products]);

  const handleAdjustStock = async (productId: string, change: number) => {
    setIsAdjusting((prev) => ({ ...prev, [productId]: true }));
    try {
      const updated = await adjustStock(productId, change);
      setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
    } catch (err) {
      console.error(err);
      alert(t.error);
    } finally {
      setIsAdjusting((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleSaveMinStock = async (productId: string) => {
    const val = minStockValue.trim() === "" ? null : parseFloat(minStockValue);
    if (val !== null && (isNaN(val) || val < 0)) { alert(t.error); return; }
    try {
      const updated = await updateMinStock(productId, val);
      setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
      setEditingMinStockId(null);
    } catch (err) {
      console.error(err);
      alert(t.error);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm(t.inventoryDeleteConfirm)) return;
    try {
      await deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (err) {
      console.error(err);
      alert(t.error);
    }
  };

  if (isLoading) {
    return <InventorySkeleton />;
  }

  return (
    <div className="space-y-8 min-h-screen pb-12 p-4 md:p-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-black tracking-wide font-sans">
          📦 {t.inventoryTitle}
        </h1>
        <p className="text-sm font-bold text-gray-600 mt-1">{t.inventoryDescription}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#faf8f5] rounded-doodle border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
          <p className="text-xs font-bold text-gray-500 uppercase">{t.inventoryTotalItems}</p>
          <p className="text-2xl font-bold text-black mt-1">{stats.totalItems}</p>
        </div>
        <div className={`rounded-doodle border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 ${stats.lowStock > 0 ? "bg-pastel-yellow" : "bg-[#faf8f5]"}`}>
          <p className="text-xs font-bold text-gray-500 uppercase">{t.inventoryLowStock}</p>
          <p className="text-2xl font-bold text-black mt-1">{stats.lowStock}</p>
        </div>
        <div className={`rounded-doodle border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 ${stats.soonBatches > 0 ? "bg-pastel-orange" : "bg-[#faf8f5]"}`}>
          <p className="text-xs font-bold text-gray-500 uppercase">{t.inventoryExpiringBatches}</p>
          <p className="text-2xl font-bold text-black mt-1">{stats.soonBatches}</p>
        </div>
        <div className={`rounded-doodle border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 ${stats.expiredBatches > 0 ? "bg-pastel-pink" : "bg-[#faf8f5]"}`}>
          <p className="text-xs font-bold text-gray-500 uppercase">{t.inventoryExpiredBatches}</p>
          <p className="text-2xl font-bold text-black mt-1">{stats.expiredBatches}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder={`🔍 ${t.inventorySearch}`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-doodle border-2 border-black bg-paper px-4 py-2.5 text-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:bg-[#fffdf0]"
        />
      </div>

      {error && (
        <div className="bg-pastel-pink border-2 border-black rounded-doodle p-4 text-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          ⚠️ {error}
        </div>
      )}

      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-[#faf8f5] rounded-doodle border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
          <p className="text-lg font-bold text-gray-600">{t.inventoryNoSearchResults}</p>
          <p className="text-sm text-gray-500 mt-1">{t.inventoryAutoCreatedNote}</p>
        </div>
      ) : (
        <div className="bg-[#fffdf7] rounded-doodle border-[3px] border-black shadow-[6px_7px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-black text-white">
                  <th className="text-left text-[11px] font-bold uppercase tracking-widest px-4 py-3 whitespace-nowrap">
                    {t.inventoryProductName}
                  </th>
                  <th className="text-center text-[11px] font-bold uppercase tracking-widest px-4 py-3 whitespace-nowrap">
                    {t.inventoryCurrentStockLabel}
                  </th>
                  <th className="text-left text-[11px] font-bold uppercase tracking-widest px-4 py-3 whitespace-nowrap">
                    {t.inventoryMinStock}
                  </th>
                  <th className="text-right text-[11px] font-bold uppercase tracking-widest px-4 py-3 whitespace-nowrap">
                    {t.inventoryLastPrice}
                  </th>
                  <th className="text-right text-[11px] font-bold uppercase tracking-widest px-4 py-3 whitespace-nowrap">
                    {t.inventoryAvgPrice}
                  </th>
                  <th className="text-center text-[11px] font-bold uppercase tracking-widest px-4 py-3 whitespace-nowrap">
                    {t.inventoryBatches}
                  </th>
                  <th className="text-center text-[11px] font-bold uppercase tracking-widest px-4 py-3 whitespace-nowrap">
                    Adjust
                  </th>
                  <th className="text-center text-[11px] font-bold uppercase tracking-widest px-4 py-3 whitespace-nowrap">
                    {t.inventoryDelete}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product, idx) => {
                  const isLow = product.min_stock !== null && product.current_stock < product.min_stock;
                  const hasExpiryWarning = product.batches.some(
                    (b) => getExpiryStatus(b.expiry_date) === "expired" || getExpiryStatus(b.expiry_date) === "soon"
                  );
                  const isExpanded = expandedProductId === product.id;
                  const isLast = idx === filteredProducts.length - 1;

                  return (
                    <>
                      {/* Main product row */}
                      <tr
                        key={product.id}
                        className={`transition-colors ${isLow ? "bg-[#fefce8]" : "bg-[#fffdf7] hover:bg-[#fffbe8]"} ${!isLast || isExpanded ? "border-b-2 border-black/10" : ""}`}
                      >
                        {/* Product name + badges */}
                        <td className="px-4 py-3 min-w-[160px]">
                          <div className="font-bold text-[15px] text-black">{product.name}</div>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {isLow && (
                              <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-pastel-yellow border border-black">
                                ⚠ {t.inventoryLowStock}
                              </span>
                            )}
                            {hasExpiryWarning && (
                              <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-pastel-pink border border-black animate-pulse">
                                ⚠ {t.inventoryExpiringAlert}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Current stock */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="text-xl font-bold text-black">{product.current_stock}</span>
                          <span className="text-xs text-gray-500 font-semibold ml-1">{product.unit}</span>
                        </td>

                        {/* Min stock — view / edit */}
                        <td className="px-4 py-3 min-w-[140px]">
                          {editingMinStockId === product.id ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                step="any"
                                value={minStockValue}
                                onChange={(e) => setMinStockValue(e.target.value)}
                                placeholder={t.inventoryNotSet}
                                className="w-16 rounded-doodle border-2 border-black px-2 py-1 text-xs font-bold focus:outline-none"
                              />
                              <button
                                onClick={() => handleSaveMinStock(product.id)}
                                className="px-2 py-1 text-[11px] font-bold rounded-doodle bg-pastel-green border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-green-300 active:translate-y-[1px] active:shadow-none transition-all"
                              >
                                {t.inventorySave}
                              </button>
                              <button
                                onClick={() => setEditingMinStockId(null)}
                                className="px-2 py-1 text-[11px] font-bold rounded-doodle bg-gray-200 border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-300 active:translate-y-[1px] active:shadow-none transition-all"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-black">
                                {product.min_stock !== null
                                  ? `${product.min_stock} ${product.unit}`
                                  : <span className="text-gray-400 italic font-normal text-xs">{t.inventoryNotSet}</span>}
                              </span>
                              <button
                                onClick={() => {
                                  setEditingMinStockId(product.id);
                                  setMinStockValue(product.min_stock !== null ? String(product.min_stock) : "");
                                }}
                                className="text-[11px] font-bold px-2 py-0.5 rounded-doodle border-2 border-transparent hover:border-black hover:bg-[#fffdf0] transition-all"
                              >
                                ✏️ {t.inventoryEdit}
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Last price */}
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className="text-sm font-bold text-black">
                            {formatCurrency(Number(product.last_price), "THB")}
                          </span>
                        </td>

                        {/* Avg price */}
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className="text-sm font-bold text-black">
                            {formatCurrency(Number(product.average_price), "THB")}
                          </span>
                        </td>

                        {/* Batches toggle */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => setExpandedProductId(isExpanded ? null : product.id)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-doodle border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#fffdf0] active:translate-y-[1px] active:shadow-none transition-all"
                          >
                            📦 {product.batches.length}
                            <span>{isExpanded ? "▲" : "▼"}</span>
                          </button>
                        </td>

                        {/* Adjust −/+ */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleAdjustStock(product.id, -1)}
                              disabled={product.current_stock <= 0 || isAdjusting[product.id]}
                              className="w-8 h-8 rounded-doodle bg-pastel-pink border-2 border-black font-bold text-lg flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-pink-300 disabled:opacity-40 active:translate-y-[1px] active:shadow-none transition-all"
                            >
                              −
                            </button>
                            <button
                              onClick={() => handleAdjustStock(product.id, 1)}
                              disabled={isAdjusting[product.id]}
                              className="w-8 h-8 rounded-doodle bg-pastel-green border-2 border-black font-bold text-lg flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-green-300 disabled:opacity-40 active:translate-y-[1px] active:shadow-none transition-all"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        {/* Delete */}
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-doodle border-2 border-transparent text-gray-400 hover:border-black hover:bg-pastel-pink hover:text-black transition-all mx-auto"
                            title={t.inventoryDelete}
                          >
                            <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                          </button>
                        </td>
                      </tr>

                      {/* Expanded batch sub-row */}
                      {isExpanded && (
                        <tr key={`${product.id}-batches`} className="bg-[#f7f3ec]">
                          <td colSpan={8} className="px-6 py-4 border-b-2 border-black/10">
                            {product.batches.length === 0 ? (
                              <p className="text-xs text-gray-500 italic font-bold">{t.inventoryNoBatchData}</p>
                            ) : (
                              <table className="w-full border-collapse text-xs">
                                <thead>
                                  <tr className="border-b-2 border-dashed border-black/30">
                                    <th className="text-left font-bold text-[10px] uppercase tracking-wider text-gray-500 pb-2 pr-6">{t.inventoryQuantity}</th>
                                    <th className="text-left font-bold text-[10px] uppercase tracking-wider text-gray-500 pb-2 pr-6">Received</th>
                                    <th className="text-left font-bold text-[10px] uppercase tracking-wider text-gray-500 pb-2 pr-6">Expires</th>
                                    <th className="text-left font-bold text-[10px] uppercase tracking-wider text-gray-500 pb-2">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {product.batches.map((batch) => {
                                    const status = getExpiryStatus(batch.expiry_date);
                                    const rowBg =
                                      status === "expired" ? "bg-pastel-pink/60" :
                                      status === "soon"    ? "bg-pastel-orange/60" : "";
                                    const statusLabel =
                                      status === "expired" ? t.inventoryBatchExpiredLabel :
                                      status === "soon"    ? t.inventoryBatchExpiringSoonLabel : null;
                                    const statusBadgeCls =
                                      status === "expired" ? "bg-pastel-pink border-black" :
                                      status === "soon"    ? "bg-pastel-orange border-black" :
                                      "bg-pastel-green border-black";

                                    return (
                                      <tr key={batch.id} className={`border-b border-dashed border-black/10 last:border-b-0 ${rowBg}`}>
                                        <td className="py-2 pr-6 font-bold">{batch.quantity} {product.unit}</td>
                                        <td className="py-2 pr-6 text-gray-600 font-semibold">
                                          {new Date(batch.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                                        </td>
                                        <td className="py-2 pr-6 font-bold">
                                          {batch.expiry_date
                                            ? new Date(batch.expiry_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                                            : <span className="text-gray-400 italic font-normal text-xs">{t.inventoryNotSet}</span>}
                                        </td>
                                        <td className="py-2">
                                          {statusLabel ? (
                                            <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadgeCls}`}>
                                              {statusLabel}
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border bg-pastel-green border-black">
                                              ✓ OK
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
