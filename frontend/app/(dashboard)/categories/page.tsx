"use client";

import { useState, type FormEvent } from "react";
import { useCategories, useCreateCategory } from "@/lib/hooks/useExpenses";
import { useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api/client";

const DEFAULT_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
];

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(DEFAULT_COLORS[0]);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const name = newName.trim();
    if (!name) {
      setFormError("Category name is required.");
      return;
    }
    try {
      await createCategory.mutateAsync({ name, color: newColor });
      setNewName("");
      setNewColor(DEFAULT_COLORS[0]);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create category.";
      setFormError(message);
    }
  }

  async function handleDelete(id: number) {
    if (pendingDeleteId !== id) {
      setPendingDeleteId(id);
      return;
    }
    setPendingDeleteId(null);
    setDeletingId(id);
    try {
      await apiClient.delete(`/api/v1/categories/${id}`);
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch {
      // surface error inline instead of alert()
      setFormError("Failed to delete category.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Categories</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Organise your expenses with colour-coded categories
        </p>
      </div>

      {/* Add category form */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Add category
        </h2>
        <form onSubmit={handleCreate} noValidate className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[160px]">
            <label
              htmlFor="cat-name"
              className="block text-xs font-medium text-gray-500 mb-1"
            >
              Name
            </label>
            <input
              id="cat-name"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Food & Drink"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={createCategory.isPending}
            />
          </div>

          <div>
            <label
              htmlFor="cat-color"
              className="block text-xs font-medium text-gray-500 mb-1"
            >
              Color
            </label>
            <div className="flex items-center gap-2">
              <input
                id="cat-color"
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="h-9 w-14 rounded-lg border border-gray-300 cursor-pointer p-0.5"
                disabled={createCategory.isPending}
              />
              <div className="flex gap-1.5">
                {DEFAULT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      borderColor: newColor === c ? "#1e40af" : "transparent",
                    }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={createCategory.isPending}
            className="px-4 py-2 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {createCategory.isPending ? "Adding…" : "Add"}
          </button>
        </form>
        {formError && (
          <p className="mt-2 text-sm text-red-600">{formError}</p>
        )}
      </div>

      {/* Category list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-gray-50">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-5 py-4 animate-pulse"
              >
                <div className="w-5 h-5 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="h-4 bg-gray-200 rounded w-32" />
                <div className="ml-auto h-6 bg-gray-200 rounded w-14" />
              </div>
            ))}
          </div>
        ) : (categories ?? []).length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-gray-400">
            No categories yet. Add one above.
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {(categories ?? []).map((cat) => (
              <li
                key={cat.id}
                className="flex items-center gap-3 px-5 py-3.5"
              >
                <span
                  className="w-5 h-5 rounded-full flex-shrink-0 border border-black/10"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-sm font-medium text-gray-900 flex-1">
                  {cat.name}
                </span>
                <span className="text-xs text-gray-400 font-mono">
                  {cat.color}
                </span>
                {pendingDeleteId === cat.id ? (
                  <span className="ml-3 inline-flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(cat.id)}
                      disabled={deletingId === cat.id}
                      className="text-xs text-red-600 font-semibold hover:text-red-800 transition-colors disabled:opacity-50"
                    >
                      {deletingId === cat.id ? "Deleting…" : "Confirm"}
                    </button>
                    <button
                      onClick={() => setPendingDeleteId(null)}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => handleDelete(cat.id)}
                    disabled={deletingId === cat.id}
                    className="ml-3 text-xs text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-50"
                  >
                    Delete
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
