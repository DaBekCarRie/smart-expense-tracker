"use client";

import { useState } from "react";
import type { Expense, ExpenseItemOut, Category } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";
import { CategoryIcon } from "../ui/CategoryIcon";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Image as ImageIcon, Pencil, Save, X, Package } from "lucide-react";
import { useUpdateExpenseItem, useCategories } from "@/lib/hooks/useExpenses";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { DateInput } from "../ui/date-input";
import { Skeleton } from "../ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface Props {
  expenses: Expense[];
  isLoading: boolean;
  onDelete?: (id: string) => void;
  pendingDeleteId?: string | null;
  onCancelDelete?: () => void;
}

function SkeletonRow() {
  return (
    <tr>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-20" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-32" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-16" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-6 w-24" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-12" />
      </td>
    </tr>
  );
}

function getUniqueItemCategories(items: ExpenseItemOut[] | undefined): Category[] {
  if (!items) return [];
  const seen = new Set<number>();
  const result: Category[] = [];
  for (const item of items) {
    if (item.category && item.category_id != null && !seen.has(item.category_id)) {
      seen.add(item.category_id);
      result.push(item.category);
    }
  }
  return result;
}

export function ExpenseList({ expenses, isLoading, onDelete, pendingDeleteId, onCancelDelete }: Props) {
  const { t } = useTranslation();
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const { data: categories } = useCategories();

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const updateExpenseItemMutation = useUpdateExpenseItem();
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    quantity: 0,
    unit: "",
    unit_price: 0,
    expiry_date: "" as string | null,
    category_id: null as number | null,
  });

  const handleStartEdit = (item: ExpenseItemOut) => {
    setEditingItemId(item.id);
    setEditForm({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit || "",
      unit_price: Number(item.unit_price),
      expiry_date: item.expiry_date || null,
      category_id: item.category_id ?? null,
    });
  };

  const handleSaveItem = async () => {
    if (!selectedExpense || !editingItemId) return;
    try {
      const price = editForm.quantity * editForm.unit_price;
      const updatedExpense = await updateExpenseItemMutation.mutateAsync({
        expenseId: selectedExpense.id,
        itemId: editingItemId,
        data: {
          name: editForm.name,
          quantity: editForm.quantity,
          unit: editForm.unit || null,
          unit_price: editForm.unit_price,
          price,
          expiry_date: editForm.expiry_date || null,
          category_id: editForm.category_id,
        },
      });
      setSelectedExpense(updatedExpense);
      setEditingItemId(null);
    } catch (err) {
      console.error(err);
      alert(t.expenseDetailEditFailed);
    }
  };

  return (
    <>
      <div className="bg-paper rounded-doodle border-doodle shadow-doodle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="border-b-2 border-black bg-pastel-blue">
                <th className="px-4 py-3 text-left font-bold text-black uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left font-bold text-black uppercase tracking-wider">
                  Merchant
                </th>
                <th className="px-4 py-3 text-right font-bold text-black uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left font-bold text-black uppercase tracking-wider">
                  🏷️ Item Categories
                </th>
                {onDelete && (
                  <th className="px-4 py-3 text-right font-bold text-black uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black">
              {isLoading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : expenses.length === 0 ? (
                <tr>
                  <td
                    colSpan={onDelete ? 5 : 4}
                    className="px-4 py-12 text-center text-lg font-bold text-gray-500 bg-white"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <svg
                        className="w-8 h-8 text-black"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      <span>No expenses found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => {
                  const uniqueCats = getUniqueItemCategories(expense.items);
                  return (
                    <tr
                      key={expense.id}
                      onClick={() => setSelectedExpense(expense)}
                      className="hover:bg-paper cursor-pointer transition-colors bg-white"
                    >
                      <td className="px-4 py-3 text-black font-bold whitespace-nowrap">
                        {formatDate(expense.expense_date)}
                      </td>
                      <td className="px-4 py-3 font-bold text-black max-w-[200px] truncate">
                        <div className="flex items-center gap-2">
                          {expense.receipt_url && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewImageUrl(`${baseUrl}${expense.receipt_url}`);
                              }}
                              className="text-black hover:text-blue-600 transition-colors flex-shrink-0"
                              title="View receipt"
                            >
                              <ImageIcon className="w-4 h-4" strokeWidth={2.5} />
                            </button>
                          )}
                          <span>
                            {expense.merchant}
                            {expense.notes && (
                              <span className="ml-2 text-sm text-gray-600 font-sans font-normal">
                                — {expense.notes}
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-black whitespace-nowrap text-lg tracking-wider">
                        {formatCurrency(expense.amount, expense.currency)}
                      </td>
                      <td className="px-4 py-3">
                        {uniqueCats.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {uniqueCats.map((cat) => (
                              <span
                                key={cat.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-doodle border-doodle text-xs font-bold text-black shadow-doodle-sm"
                                style={{ backgroundColor: cat.color }}
                              >
                                <CategoryIcon name={cat.name} icon={cat.icon} className="w-3 h-3" />
                                {cat.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500 font-bold">—</span>
                        )}
                      </td>
                      {onDelete && (
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          {pendingDeleteId === expense.id ? (
                            <span className="inline-flex items-center gap-2">
                              <button
                                onClick={() => onDelete(expense.id)}
                                className="text-sm text-red-600 font-bold hover:text-red-800 transition-colors underline decoration-2 underline-offset-4"
                                title="ลบข้อมูลใบเสร็จนี้รวมถึงสินค้าที่ถูกนำเข้าคลังด้วย"
                              >
                                ⚠️ Confirm (will also delete inventory)
                              </button>
                              <button
                                onClick={onCancelDelete}
                                className="text-sm text-gray-500 font-bold hover:text-black transition-colors"
                              >
                                Cancel
                              </button>
                            </span>
                          ) : (
                            <button
                              onClick={() => onDelete(expense.id)}
                              className="text-sm text-black font-bold hover:bg-pastel-pink border-2 border-transparent hover:border-black rounded-doodle px-2 py-1 transition-all"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImageUrl} onOpenChange={(open) => !open && setPreviewImageUrl(null)}>
        <DialogContent className="max-w-2xl bg-paper">
          <DialogHeader>
            <DialogTitle>Receipt Preview</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-2 rounded-doodle border-2 border-black bg-white shadow-doodle-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImageUrl || ""}
              alt="Receipt Preview"
              className="max-h-[70vh] max-w-full object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Expense Detail Dialog with Line Items */}
      <Dialog open={!!selectedExpense} onOpenChange={(open) => !open && setSelectedExpense(null)}>
        <DialogContent className="max-w-3xl bg-paper overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold font-sans">📋 {t.expenseDetailTitle}</DialogTitle>
          </DialogHeader>

          {selectedExpense && (
            <div className="space-y-6 mt-4">
              {/* Top metadata grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-white p-4 rounded-doodle border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase block">{t.expenseDetailMerchant}</span>
                  <span className="text-base font-bold text-black">{selectedExpense.merchant}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase block">{t.expenseDetailDate}</span>
                  <span className="text-base font-bold text-black">{formatDate(selectedExpense.expense_date)}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase block">{t.expenseDetailTotal}</span>
                  <span className="text-lg font-bold text-black tracking-wide">
                    {formatCurrency(selectedExpense.amount, selectedExpense.currency)}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {selectedExpense.notes && (
                <div className="bg-[#faf8f5] p-3 rounded-doodle border border-black/30">
                  <span className="text-xs font-bold text-gray-500 uppercase block mb-1">{t.expenseDetailNotes}</span>
                  <p className="text-sm text-gray-700">{selectedExpense.notes}</p>
                </div>
              )}

              {/* Items / Image Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Items List */}
                <div className="md:col-span-2 space-y-3">
                  <h4 className="text-lg font-bold text-black font-sans pb-1 border-b border-black border-dashed">
                    📦 {t.expenseDetailItemsTitle}
                  </h4>

                  {!selectedExpense.items || selectedExpense.items.length === 0 ? (
                    <p className="text-sm text-gray-500 italic py-4">{t.expenseDetailNoItems}</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedExpense.items.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white p-3 rounded-doodle border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-sm"
                        >
                          {editingItemId === item.id ? (
                            /* ── Edit form ── */
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-0.5">{t.newExpenseColItemName}</label>
                                  <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                                    className="w-full border-2 border-black rounded px-2 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-black"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-0.5">{t.newExpenseColUnit}</label>
                                  <input
                                    type="text"
                                    value={editForm.unit}
                                    onChange={(e) => setEditForm((f) => ({ ...f, unit: e.target.value }))}
                                    className="w-full border-2 border-black rounded px-2 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-black"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-0.5">{t.newExpenseColQty}</label>
                                  <input
                                    type="number"
                                    min={0.01}
                                    step="any"
                                    value={editForm.quantity}
                                    onChange={(e) => setEditForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
                                    className="w-full border-2 border-black rounded px-2 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-black"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-0.5">{t.newExpenseColPriceUnit}</label>
                                  <input
                                    type="number"
                                    min={0}
                                    step="any"
                                    value={editForm.unit_price}
                                    onChange={(e) => setEditForm((f) => ({ ...f, unit_price: Number(e.target.value) }))}
                                    className="w-full border-2 border-black rounded px-2 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-black"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-0.5">{t.expenseDetailExpiryDate}</label>
                                  <DateInput
                                    value={editForm.expiry_date || ""}
                                    onChange={(iso) => setEditForm((f) => ({ ...f, expiry_date: iso || null }))}
                                    placeholder={t.expenseDetailExpiryDate}
                                    align="right"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-0.5">🏷️ {t.newExpenseColCategory}</label>
                                  <Select
                                    value={String(editForm.category_id ?? "none")}
                                    onValueChange={(val) => setEditForm((f) => ({ ...f, category_id: val === "none" ? null : Number(val) }))}
                                  >
                                    <SelectTrigger className="h-8 text-xs font-bold border-2 border-black">
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
                              {item.has_inventory && (
                                <p className="text-[10px] text-blue-700 font-bold flex items-center gap-1">
                                  <Package className="w-3 h-3" />
                                  {t.expenseDetailInventorySync}
                                </p>
                              )}
                              <div className="flex gap-2 justify-end pt-1">
                                <button
                                  onClick={() => setEditingItemId(null)}
                                  className="flex items-center gap-1 px-2 py-1 text-xs font-bold border-2 border-black rounded-doodle bg-white hover:bg-gray-100 transition-colors"
                                >
                                  <X className="w-3 h-3" /> {t.expensesCancel}
                                </button>
                                <button
                                  onClick={handleSaveItem}
                                  disabled={updateExpenseItemMutation.isPending}
                                  className="flex items-center gap-1 px-2 py-1 text-xs font-bold border-2 border-black rounded-doodle bg-pastel-blue hover:bg-blue-300 transition-colors disabled:opacity-50"
                                >
                                  <Save className="w-3 h-3" /> {updateExpenseItemMutation.isPending ? t.expenseDetailSaving : t.expensesSave}
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* ── Read-only row ── */
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-black flex items-center gap-1">
                                    {item.name}
                                    {item.has_inventory && (
                                      <span title={t.expenseDetailInventoryBadge}>
                                        <Package className="w-3 h-3 text-blue-500 inline-block" />
                                      </span>
                                    )}
                                  </span>
                                  {item.category && (
                                    <span
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-doodle border border-black text-[10px] font-bold"
                                      style={{ backgroundColor: item.category.color }}
                                    >
                                      <CategoryIcon name={item.category.name} icon={item.category.icon} className="w-2.5 h-2.5" />
                                      {item.category.name}
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-gray-500 block mt-0.5">
                                  {t.expenseDetailQtyUnit} {item.quantity} {item.unit || t.inventoryUnit} | {t.expenseDetailPricePerUnit} {formatCurrency(Number(item.unit_price), selectedExpense.currency)}
                                </span>
                                {item.expiry_date && (
                                  <span className="text-[10px] font-bold text-red-600 block mt-0.5">
                                    {t.expenseDetailExpiryDate} {new Date(item.expiry_date).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                <span className="font-bold text-black">
                                  {formatCurrency(Number(item.price), selectedExpense.currency)}
                                </span>
                                <button
                                  onClick={() => handleStartEdit(item)}
                                  title={t.expensesEdit}
                                  className="p-1 rounded border border-transparent hover:border-black hover:bg-pastel-blue transition-all"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Receipt Image Side */}
                <div className="md:col-span-1 space-y-3">
                  <h4 className="text-lg font-bold text-black font-sans pb-1 border-b border-black border-dashed">
                    📷 {t.expenseDetailReceiptTitle}
                  </h4>

                  {selectedExpense.receipt_url ? (
                    <div
                      className="cursor-pointer border-2 border-black rounded-doodle overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all bg-white flex items-center justify-center p-1"
                      onClick={() => setPreviewImageUrl(`${baseUrl}${selectedExpense.receipt_url}`)}
                      title={t.expenseDetailReceiptTitle}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`${baseUrl}${selectedExpense.receipt_url}`}
                        alt="Receipt"
                        className="max-h-[200px] max-w-full object-contain rounded"
                      />
                    </div>
                  ) : (
                    <div className="border border-dashed border-gray-300 rounded-doodle p-8 text-center text-xs text-gray-400">
                      {t.expenseDetailNoReceipt}
                    </div>
                  )}
                </div>

              </div>

              {/* Close Button */}
              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setSelectedExpense(null)}
                  className="rounded-doodle bg-pastel-blue px-5 py-2 font-bold text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-300 hover:translate-y-[-1px] hover:shadow-[3px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none transition-all text-sm"
                >
                  {t.expenseDetailClose}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
